/**
 * A model of the two tiers of the search that need no database, run over the
 * real corpus in `dataset/source/afrik`.
 *
 * - **lexical**: every typed word is a whole word of the entry, the last one
 *   may be a prefix (the shape of `afrik_prefix_tsquery`, migration 052). It
 *   is read twice, as the SQL weights it: over the entry's *names* (the entry
 *   answers to the name) and over its *prose* (the entry mentions the name).
 * - **neighbour**: pg_trgm `similarity` >= 0.2 against a name, the floor of
 *   `afrik_search_leads` (migrations 070, 094). pg_trgm's definition is small
 *   enough to restate exactly: lower-cased words, each padded with two spaces
 *   before and one after, compared as sets of three-character windows.
 *
 * It is a regression instrument, not the search: the SQL functions stay the
 * authority, and the recette checks in migration 094 stay the proof. Ranking,
 * stemming and the confidence factor are not modelled.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { normalizeString } from "@/lib/normalize";

export type EntityKind =
  "people" | "country" | "family" | "language" | "patronyme";

export interface ModelEntity {
  key: string;
  kind: EntityKind;
  filedName: string;
  /** Every recorded name, qualifier removed for scoring only. */
  forms: string[];
  /** Every other string of the fiche, sources and translations excluded. */
  prose: string[];
}

const DATASET = join(process.cwd(), "dataset/source/afrik");
const NOT_PROSE = new Set(["_meta", "_translation", "sources"]);

const withoutQualifier = (form: string) =>
  form.replace(/\s*\([^)]*\)\s*$/, "").trim();

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8"));
}

function stringsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, inner]) =>
      NOT_PROSE.has(key) ? [] : stringsOf(inner)
    );
  }
  return [];
}

function entity(
  kind: EntityKind,
  fiche: Record<string, unknown>,
  filedName: string,
  names: string[]
): ModelEntity {
  return {
    key: String(fiche.id),
    kind,
    filedName,
    forms: names.map(withoutQualifier).filter(Boolean),
    prose: stringsOf(fiche),
  };
}

function jsonFiles(dir: string, prefix = ""): string[] {
  return readdirSync(dir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".json"))
    .filter((file) => !file.startsWith("_"))
    .map((file) => join(dir, file));
}

function peopleEntities(): ModelEntity[] {
  const families = readdirSync(join(DATASET, "peuples"), {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory());
  return families.flatMap((family) =>
    jsonFiles(join(DATASET, "peuples", family.name), "PPL_").map((path) => {
      const fiche = readJson(path) as {
        nameMain: string;
        content?: {
          appellations?: { selfAppellation?: string; exonyms?: string[] };
        };
      };
      const appellations = fiche.content?.appellations;
      return entity("people", fiche, fiche.nameMain, [
        fiche.nameMain,
        ...(appellations?.selfAppellation ?? "").split(","),
        ...(Array.isArray(appellations?.exonyms) ? appellations.exonyms : []),
      ]);
    })
  );
}

const nameFrOf = (fiche: Record<string, unknown>) =>
  String(fiche.nameFr ?? fiche.name ?? "");

function simpleEntities(
  dir: string,
  kind: EntityKind,
  prefix = ""
): ModelEntity[] {
  return jsonFiles(join(DATASET, dir), prefix).map((path) => {
    const fiche = readJson(path);
    const alternates =
      kind === "language"
        ? [
            ...stringsOf(fiche.alternateNames),
            ...stringsOf(fiche.spellingAliases),
          ]
        : [];
    const spellings = kind === "patronyme" ? stringsOf(fiche.spellings) : [];
    const filed =
      kind === "patronyme" ? String(fiche.nameMain) : nameFrOf(fiche);
    return entity(kind, fiche, filed, [filed, ...alternates, ...spellings]);
  });
}

let corpus: ModelEntity[] | undefined;
// @req REQ-178
export function corpusEntities(): ModelEntity[] {
  corpus ??= [
    ...peopleEntities(),
    ...simpleEntities("pays", "country"),
    ...simpleEntities("famille_linguistique", "family"),
    ...simpleEntities("langues", "language"),
    ...simpleEntities("patronymes", "patronyme", "PAT_"),
  ];
  return corpus;
}

// The `french` configuration of afrik_prefix_tsquery drops stopwords and stems.
// Only what the September queries need is modelled: the function words below
// and the plural « s ».
const FRENCH_STOPWORDS = new Set([
  "le",
  "la",
  "les",
  "l",
  "un",
  "une",
  "des",
  "du",
  "de",
  "d",
  "et",
  "ou",
  "au",
  "aux",
  "qui",
  "que",
  "qu",
  "a",
  "ce",
  "est",
  "où",
]);

const stem = (word: string) =>
  word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;

const accentedWordsOf = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word && !FRENCH_STOPWORDS.has(word))
    .map(stem);

const wordsOf = (text: string) => accentedWordsOf(text).map(normalizeString);

/** Words as pg_trgm sees them: no stemming, no stopwords. */
const rawWordsOf = (text: string) =>
  normalizeString(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** pg_trgm: the set of three-character windows over each padded word. */
function trigrams(text: string): Set<string> {
  const windows = new Set<string>();
  for (const word of rawWordsOf(text)) {
    const padded = `  ${word} `;
    for (let i = 0; i + 3 <= padded.length; i++) {
      windows.add(padded.slice(i, i + 3));
    }
  }
  return windows;
}

// @req REQ-178
export function similarity(left: string, right: string): number {
  const a = trigrams(left);
  const b = trigrams(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const window of a) if (b.has(window)) shared++;
  return shared / (a.size + b.size - shared);
}

function everyWordFound(typed: string[], words: Set<string>): boolean {
  const list = [...words];
  return typed.every((word, index) =>
    index === typed.length - 1
      ? list.some((candidate) => candidate.startsWith(word))
      : words.has(word)
  );
}

const wordCache = new WeakMap<
  ModelEntity,
  { names: Set<string>; text: Set<string> }
>();
// Names are matched accent-folded (migration 052); prose is not, so « pigmee »
// does not find a fiche whose text writes « pigmée ». Measured on production
// on 2026-10-03, where the folded model had predicted a widening.
function wordsOfEntity(item: ModelEntity) {
  let cached = wordCache.get(item);
  if (!cached) {
    const names = new Set(item.forms.flatMap(wordsOf));
    cached = {
      names,
      text: new Set(item.prose.flatMap(accentedWordsOf)),
    };
    wordCache.set(item, cached);
  }
  return cached;
}

/** Entries that answer to the name: every typed word is one of their names' words. */
// @req REQ-178
export function nameHits(query: string): ModelEntity[] {
  const typed = wordsOf(query);
  if (typed.length === 0) return [];
  return corpusEntities().filter((item) =>
    everyWordFound(typed, wordsOfEntity(item).names)
  );
}

/** Entries that only mention the name in their text — related, not the name. */
// @req REQ-178
export function proseHits(query: string): ModelEntity[] {
  const typed = wordsOf(query);
  const accented = accentedWordsOf(query);
  if (typed.length === 0) return [];
  return corpusEntities().filter(
    (item) =>
      everyWordFound(typed, wordsOfEntity(item).names) ||
      everyWordFound(accented, wordsOfEntity(item).text)
  );
}

// @req REQ-178
export const NEIGHBOUR_FLOOR = 0.2;

/**
 * The leads scan covers peoples, countries and families (migration 070).
 * `formsOfAPeople: false` reproduces migration 084, which scored the filed
 * name of a people only.
 */
// @req REQ-178
export function neighbours(
  query: string,
  { formsOfAPeople }: { formsOfAPeople: boolean }
): ModelEntity[] {
  if (normalizeString(query).trim().length < 3) return [];
  return corpusEntities()
    .filter((item) => ["people", "country", "family"].includes(item.kind))
    .filter((item) => {
      const scored =
        item.kind === "people" && !formsOfAPeople
          ? [item.filedName]
          : item.forms;
      return scored.some((form) => similarity(form, query) >= NEIGHBOUR_FLOOR);
    });
}
