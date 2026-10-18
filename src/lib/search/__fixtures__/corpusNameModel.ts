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
  /**
   * A family name's `spellings[].spelling`, qualifier removed. `forms` holds
   * every string under `spellings`, attestations included; the leads read
   * only these, as migrations 110 and 111 do.
   */
  spellings?: string[];
  /** A people's filed name, self-appellation and each exonym, as written. */
  nameFields?: string[];
}

const DATASET = join(process.cwd(), "dataset/source/afrik");
const NOT_PROSE = new Set(["_meta", "sources"]);

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
      const exonyms = Array.isArray(appellations?.exonyms)
        ? appellations.exonyms
        : [];
      return {
        ...entity("people", fiche, fiche.nameMain, [
          fiche.nameMain,
          ...(appellations?.selfAppellation ?? "").split(","),
          ...exonyms,
        ]),
        nameFields: [
          fiche.nameMain,
          appellations?.selfAppellation ?? "",
          ...exonyms,
        ],
      };
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
    const modelled = entity(kind, fiche, filed, [
      filed,
      ...alternates,
      ...spellings,
    ]);
    return kind === "patronyme"
      ? { ...modelled, spellings: recordedSpellings(fiche.spellings) }
      : modelled;
  });
}

function recordedSpellings(spellings: unknown): string[] {
  if (!Array.isArray(spellings)) return [];
  return spellings
    .map((entry) => (entry as { spelling?: unknown } | null)?.spelling)
    .filter((spelling): spelling is string => typeof spelling === "string")
    .map(withoutQualifier)
    .filter(Boolean);
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
 * name of a people only; `true`, migration 111, which scores the pieces of
 * `peopleLeadForms`.
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
        item.kind !== "people"
          ? item.forms
          : formsOfAPeople
            ? peopleLeadForms(item)
            : [item.filedName];
      return scored.some((form) => similarity(form, query) >= NEIGHBOUR_FLOOR);
    });
}

/**
 * Where migration 111 cuts a people's name field into pieces: at « , », « ; »,
 * the word « ou », and a slash only when it stands between spaces
 * (« Baganda / Ganda »). A slash inside a word writes a click (« Hai//om »,
 * « Zhu/'hoasi », « G//ana ») and never cuts: cut there, « Hai//om » gave Hai,
 * a name no fiche gives. Nothing cuts inside a bracket: a bracket qualifies its
 * piece and is dropped whole, so « Baganda (sg. Muganda, pl. Abaganda) » is
 * one piece, Baganda, and « Diola (Joola / Jola) » keeps Diola. The text is
 * the SQL's pattern, read alike by JavaScript.
 */
// @req REQ-125
export const NAME_PIECE_SEPARATOR = String.raw`\s*(?:[,;]|\s/\s|\sou\s)\s*(?![^(]*\))`;

// The parts of ONE_NAME, in POSIX classes as migration 111 writes them. The
// combining accents are written as escapes: they do not show on their own.
const CLICK_MARK = "[!|ǀǁǂǃ=/]";
const LETTER = "[[:alpha:]\\u0300-\\u036f]";
// A click mark, an apostrophe or a hyphen, each followed in its word by a
// letter; only an apostrophe or a hyphen may end a word.
const BEFORE_A_LETTER = "[!|ǀǁǂǃ=/'’-]";
const REST_OF_WORD = `(?:${BEFORE_A_LETTER}*${LETTER})*['’-]*`;
const NAME_OPENING = `(?:(?![[:lower:]])[[:alpha:]]|${CLICK_MARK}+[[:alpha:]]|[[:lower:]]{1,4}[[:upper:]])`;

/**
 * What makes a piece one name (migration 111): three words at most, each made
 * of letters of any script with their accents, hyphens, apostrophes, and click
 * marks (! | ǀ ǁ ǂ ǃ = /) at the start of a word or inside it, never at its
 * end. The first word opens on an upper-case letter, a letter with no case
 * (ǂHoan, a Ge'ez name), click marks before a letter (« !Kung », « =|Hoa »),
 * or a class prefix of one to four lower-case letters before an upper-case
 * one (« amaXhosa », « isiNdebele », « vaKaranga »). A lower-case word
 * (« suivant Abdoulaye Bathily », « peuple du Burundi »), a digit, « pl. », a
 * lone « = », guillemets or a sentence is not one name, and is never scored.
 * The model reads the same text with Unicode classes.
 */
// @req REQ-125
export const ONE_NAME = `^${NAME_OPENING}${REST_OF_WORD}(?: +${BEFORE_A_LETTER}*${LETTER}${REST_OF_WORD}){0,2}$`;

// PostgreSQL reads the POSIX classes with the database's character type, the
// model with Unicode's: the same letters as long as that type is not C
// (verification 6 of migration 111 checks it on each database).
const oneName = new RegExp(
  ONE_NAME.replaceAll("[:alpha:]", String.raw`\p{L}`)
    .replaceAll("[:upper:]", String.raw`\p{Lu}`)
    .replaceAll("[:lower:]", String.raw`\p{Ll}`),
  "u"
);
const pieceSeparator = new RegExp(NAME_PIECE_SEPARATOR, "u");

/** The family-name search's own trigram threshold (066, 069, 108). */
// @req REQ-125
export const FAMILY_NAME_LEAD_FLOOR = 0.4;

/**
 * The family-name branch of the leads (migrations 110 and 111, DEC-075): a family name
 * qualifies through its filed name or a recorded spelling that begins with
 * the query's first letter, both folded, at the family-name search's own
 * threshold. Whether it is offered —
 * nothing answering exactly — is the query layer's, and is not modelled.
 */
// @req REQ-125
export function familyNameLeads(query: string): ModelEntity[] {
  const folded = normalizeString(query).trim();
  if (folded.length < 3) return [];
  return corpusEntities()
    .filter((item) => item.kind === "patronyme")
    .filter((item) =>
      leadForms(item, folded).some(
        (form) => similarity(form, query) >= FAMILY_NAME_LEAD_FLOOR
      )
    );
}

/**
 * The forms migration 111 scores for a family name, among those sharing the
 * query's first letter: its filed name, as filed, and each recorded spelling
 * that is one name (« da Costa » is not).
 */
function leadForms(item: ModelEntity, foldedQuery: string): string[] {
  return [
    withoutQualifier(item.filedName),
    ...(item.spellings ?? []).filter((spelling) => oneName.test(spelling)),
  ].filter((form) => normalizeString(form).trim()[0] === foldedQuery[0]);
}

/**
 * The `matched_form` migration 111 returns for a family-name lead: its best
 * scoring form, the filed name first on a tie.
 */
// @req REQ-125
export function familyNameLeadForm(
  query: string,
  item: ModelEntity
): string | undefined {
  const folded = normalizeString(query).trim();
  const filed = withoutQualifier(item.filedName);
  return leadForms(item, folded)
    .map((form) => ({ form, score: similarity(form, query) }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        Number(right.form === filed) - Number(left.form === filed) ||
        left.form.localeCompare(right.form)
    )[0]?.form;
}

/**
 * The forms migration 111 scores for a people: each piece of its filed name,
 * its self-appellation and each exonym that is one name, without its
 * trailing bracket. « Baganda / Ganda » gives Baganda and Ganda, « Hai//om »
 * stays whole, « Diula, Djula, … » gives each spelling. No other form is
 * scored, the filed name included: a people none of whose pieces scores is
 * no lead (brief 16, tenth review).
 */
// @req REQ-125
export function peopleLeadForms(item: ModelEntity): string[] {
  return (item.nameFields ?? [])
    .flatMap((field) => field.split(pieceSeparator).map(withoutQualifier))
    .filter((piece) => oneName.test(piece));
}

/**
 * The `matched_form` migration 111 returns for a people lead: the best
 * scoring of the forms it scores, the filed name first on a tie. Undefined
 * when none reaches the floor: the people is then no lead.
 */
// @req REQ-125
export function peopleLeadForm(
  query: string,
  item: ModelEntity
): string | undefined {
  const [best] = peopleLeadForms(item)
    .map((form) => ({ form, score: similarity(form, query) }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        Number(right.form === item.filedName) -
          Number(left.form === item.filedName) ||
        left.form.localeCompare(right.form)
    );
  return best && best.score >= NEIGHBOUR_FLOOR ? best.form : undefined;
}

function fichePaths(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return fichePaths(path);
    return entry.name.endsWith(".json") && !entry.name.startsWith("_")
      ? [path]
      : [];
  });
}

/**
 * The fiches whose whole file writes the query as a word, sources and notes
 * included: what a fiche records anywhere, wider than `proseHits`, which
 * leaves the sources out as the search vectors do. An example of a
 * misspelling must find none (brief 16).
 */
// @req REQ-125
export function fichesRecordingWord(query: string): string[] {
  const wanted = rawWordsOf(query).join(" ");
  if (!wanted) return [];
  return fichePaths(DATASET).flatMap((path) => {
    const text = readFileSync(path, "utf8");
    const words = ` ${rawWordsOf(text).join(" ")} `;
    if (!words.includes(` ${wanted} `)) return [];
    return [String(readJson(path).id ?? path)];
  });
}
