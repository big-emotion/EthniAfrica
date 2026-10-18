/**
 * Resolve what a human typed — "Zoulou", "Afrique du Sud", "amaZulu",
 * "Mulumba" — to an AFRIK fiche identifier, by reading the corpus in git.
 *
 *   npx tsx scripts/resolveAfrikFiche.ts "Zoulou"
 *
 * This is the curator skill's first phase. That phase used to call
 * `searchAfrikAll` and three sibling `searchAfrik*` functions; all four were
 * removed when search moved into Postgres (migrations 043/044, then 069), so the
 * skill raised on the very step it needed before it read a single fiche.
 *
 * Resolution deliberately reads `dataset/source/afrik/` rather than the database.
 * Three reasons, in order of weight:
 *
 *   1. The corpus in git is the editorial truth and the files the curator goes on
 *      to edit. Resolving against the projection while editing the source invites
 *      the two to disagree about what exists.
 *   2. It needs no credentials, so it works in a fresh clone.
 *   3. It survives a database that has not been loaded — which recette's had not,
 *      for the ten fiches merged on 31 August 2026.
 *
 * Matching folds accents and case, and ranks exact hits above containment. It
 * computes no similarity score: a fuzzy near-miss that silently wins would send
 * the curator to edit the wrong fiche. The one exception is four respellings
 * of the same name (`spellingKey`), offered only when no declared name matches
 * exactly and labelled `neighbour`, so the caller confirms them instead of
 * taking them for the name typed.
 *
 * Family names are read too, with their retired identifiers: the nightly
 * demand journal of 2026-10-17 listed mulumba, mutombo and tchikaya as names
 * without a fiche when PAT_MULUMBA, PAT_MUTOMBO and PAT_TCHICAYA had been filed
 * since 2026-09-02, because this script never opened `patronymes/`.
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const CORPUS_ROOT = join(process.cwd(), "dataset/source/afrik");

export type FicheKind =
  "people" | "country" | "family" | "language" | "patronyme";
export type MatchType =
  "id" | "retired" | "exact" | "neighbour" | "contains" | "partial";

/**
 * Below this length a declared name is not allowed to match by being contained
 * *in* the query. "Bantous" should reach the family declared as "Bantou"; "Sud"
 * should not claim every fiche whose name mentions a southern region.
 */
const SHORTEST_NAME_MATCHED_INSIDE_A_QUERY = 4;

export interface FicheMatch {
  id: string;
  kind: FicheKind;
  /**
   * Which declared name matched — `mainName`, `selfAppellation`, `nameFr`, … —
   * or `retiredId` when the query was an identifier merged into this fiche.
   */
  matchedOn: string;
  /** That name as the corpus spells it, accents and all, or the retired id. */
  matchedValue: string;
  matchType: MatchType;
}

/** A name a fiche declares, kept with the field it came from so the caller can
 * see *why* a fiche matched. "Zulu matched on selfAppellation" is a confirmable
 * statement; "Zulu matched" is not. */
interface DeclaredName {
  field: string;
  value: string;
}

interface Fiche {
  id: string;
  kind: FicheKind;
  names: DeclaredName[];
}

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * One key for the spellings the search fold leaves apart: c/k, tch/ch, ou/u
 * and i/y — « tchikaya » and « Tchicaya », « moutombo » and « Mutombo ». Only
 * these four pairs, the ones the 2026-10-17 triage named: each further pair
 * makes more distinct names collide. Applied to both sides, after `fold`.
 */
function spellingKey(folded: string): string {
  return folded
    .replace(/tch/g, "ch")
    .replace(/ou/g, "u")
    .replace(/c/g, "k")
    .replace(/y/g, "i");
}

function declare(names: DeclaredName[], field: string, value: unknown): void {
  if (typeof value === "string" && value.trim()) {
    names.push({ field, value: value.trim() });
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      declare(names, field, entry);
    }
  }
}

function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    // A malformed fiche is validateAfrikData's finding to report, not this
    // script's. Resolution degrades to "that one is not searchable" rather than
    // refusing to resolve anything at all.
    return null;
  }
}

function listJson(directory: string): string[] {
  try {
    return readdirSync(directory)
      .filter((entry) => entry.endsWith(".json"))
      .map((entry) => join(directory, entry));
  } catch {
    return [];
  }
}

function content(fiche: Record<string, unknown>): Record<string, unknown> {
  const value = fiche.content;
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function peopleFiches(): Fiche[] {
  const root = join(CORPUS_ROOT, "peuples");
  let families: string[];
  try {
    families = readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(root, entry.name));
  } catch {
    return [];
  }

  const fiches: Fiche[] = [];
  for (const family of families) {
    for (const path of listJson(family)) {
      const raw = readJson(path);
      if (typeof raw?.id !== "string") continue;

      const appellations = (content(raw).appellations ?? {}) as Record<
        string,
        unknown
      >;
      const names: DeclaredName[] = [];
      declare(names, "nameMain", raw.nameMain);
      declare(names, "mainName", appellations.mainName);
      declare(names, "selfAppellation", appellations.selfAppellation);
      declare(names, "exonyms", appellations.exonyms);
      declare(names, "historicalNames", appellations.historicalNames);
      declare(names, "spellingAliases", raw.spellingAliases);

      fiches.push({ id: raw.id, kind: "people", names });
    }
  }
  return fiches;
}

function flatFiches(
  directory: string,
  kind: FicheKind,
  collect: (raw: Record<string, unknown>, names: DeclaredName[]) => void
): Fiche[] {
  const fiches: Fiche[] = [];
  for (const path of listJson(join(CORPUS_ROOT, directory))) {
    const raw = readJson(path);
    if (typeof raw?.id !== "string") continue;

    const names: DeclaredName[] = [];
    collect(raw, names);
    fiches.push({ id: raw.id, kind, names });
  }
  return fiches;
}

function loadCorpus(): Fiche[] {
  return [
    ...peopleFiches(),
    ...flatFiches("pays", "country", (raw, names) => {
      declare(names, "nameFr", raw.nameFr);
      declare(names, "nameOfficial", raw.nameOfficial);
      declare(names, "historicalNames", content(raw).historicalNames);
    }),
    ...flatFiches("famille_linguistique", "family", (raw, names) => {
      declare(names, "nameFr", raw.nameFr);
      declare(names, "nameEn", raw.nameEn);
    }),
    ...flatFiches("langues", "language", (raw, names) => {
      declare(names, "nameFr", raw.nameFr);
      declare(names, "nameEn", raw.nameEn);
      declare(names, "alternateNames", raw.alternateNames);
      declare(names, "spellingAliases", raw.spellingAliases);
    }),
    ...flatFiches("patronymes", "patronyme", (raw, names) => {
      declare(names, "nameMain", raw.nameMain);
      const spellings = Array.isArray(raw.spellings) ? raw.spellings : [];
      for (const entry of spellings) {
        declare(names, "spellings", (entry as { spelling?: unknown }).spelling);
      }
    }),
  ];
}

/**
 * Each retired family-name identifier and the one that took it in, or null
 * for a fiche withdrawn without a successor.
 */
function retiredPatronymes(): Map<string, string | null> {
  const entries = readJson(
    join(CORPUS_ROOT, "patronymes", "_retired-identifiers.json")
  );
  const retired = new Map<string, string | null>();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (typeof entry?.retiredId !== "string") continue;
    retired.set(
      entry.retiredId,
      typeof entry.successorId === "string" ? entry.successorId : null
    );
  }
  return retired;
}

/**
 * The live fiche a retired identifier leads to, following a successor that
 * was itself retired later; undefined when the chain ends on a withdrawal.
 */
function successorOf(
  retiredId: string,
  retired: Map<string, string | null>,
  corpus: Fiche[]
): Fiche | undefined {
  const seen = new Set<string>();
  let id = retired.get(retiredId);
  while (id && !seen.has(id)) {
    const live = corpus.find((fiche) => fiche.id === id);
    if (live) return live;
    seen.add(id);
    id = retired.get(id);
  }
  return undefined;
}

const MATCH_RANK: Record<MatchType, number> = {
  id: 0,
  retired: 0,
  exact: 1,
  neighbour: 2,
  contains: 3,
  partial: 4,
};

/**
 * How `query` relates to one declared name, or null if it does not.
 *
 * `partial` is the plural case and nothing more ambitious: French names a people
 * in the plural ("Bantous") where the corpus declares the family in the singular
 * ("Bantou"), so containment has to work in both directions. It is ranked last
 * because the looser direction is also the noisier one.
 */
function classifyMatch(needle: string, declared: string): MatchType | null {
  if (declared === needle) return "exact";
  if (declared.includes(needle)) return "contains";
  if (
    declared.length >= SHORTEST_NAME_MATCHED_INSIDE_A_QUERY &&
    needle.includes(declared)
  ) {
    return "partial";
  }
  return null;
}

/**
 * Candidate fiches for `query`, best first. An identifier resolves to exactly
 * one fiche; a name may legitimately resolve to several, and the caller is
 * expected to ask rather than take the first.
 */
// @req REQ-032
export function resolveAfrikFiche(query: string): FicheMatch[] {
  const needle = fold(query);
  if (!needle) return [];

  const corpus = loadCorpus();

  const byId = corpus.find((fiche) => fold(fiche.id) === needle);
  if (byId) {
    return [
      {
        id: byId.id,
        kind: byId.kind,
        matchedOn: "id",
        matchedValue: byId.id,
        matchType: "id",
      },
    ];
  }

  const retired = retiredPatronymes();
  const retiredId = [...retired.keys()].find((id) => fold(id) === needle);
  if (retiredId) {
    const successor = successorOf(retiredId, retired, corpus);
    return successor
      ? [
          {
            id: successor.id,
            kind: successor.kind,
            matchedOn: "retiredId",
            matchedValue: retiredId,
            matchType: "retired",
          },
        ]
      : [];
  }

  // A neighbour is offered only where no declared name is the one typed, and
  // only for a fiche nothing else matched: a query that resolved before
  // 2026-10-18 keeps every line it printed, in the same order among them.
  const neighbourKey = corpus.some((fiche) =>
    fiche.names.some((name) => fold(name.value) === needle)
  )
    ? undefined
    : spellingKey(needle);

  const matches: FicheMatch[] = [];
  for (const fiche of corpus) {
    // One hit per fiche, the strongest: a fiche that declares "Zulu" twice is
    // not a better answer than one that declares it once.
    let best: FicheMatch | undefined;

    for (const name of fiche.names) {
      const matchType = classifyMatch(needle, fold(name.value));
      if (!matchType) continue;

      if (!best || MATCH_RANK[matchType] < MATCH_RANK[best.matchType]) {
        best = {
          id: fiche.id,
          kind: fiche.kind,
          matchedOn: name.field,
          matchedValue: name.value,
          matchType,
        };
      }
    }

    if (!best && neighbourKey !== undefined) {
      const respelt = fiche.names.find(
        (name) => spellingKey(fold(name.value)) === neighbourKey
      );
      if (respelt) {
        best = {
          id: fiche.id,
          kind: fiche.kind,
          matchedOn: respelt.field,
          matchedValue: respelt.value,
          matchType: "neighbour",
        };
      }
    }

    if (best) matches.push(best);
  }

  // At equal strength a family name comes after the fiches it was read
  // beside before 2026-10-18 — « Zulu » still answers PPL_ZULU first, then
  // PAT_ZULU — so the lines a query printed then keep their order.
  const familyNameLast = (match: FicheMatch) =>
    match.kind === "patronyme" ? 1 : 0;
  return matches.sort(
    (left, right) =>
      MATCH_RANK[left.matchType] - MATCH_RANK[right.matchType] ||
      familyNameLast(left) - familyNameLast(right) ||
      left.id.localeCompare(right.id)
  );
}

if (require.main === module) {
  const query = process.argv.slice(2).join(" ");

  if (!query.trim()) {
    console.error('Usage: npx tsx scripts/resolveAfrikFiche.ts "Zoulou"');
    process.exit(2);
  }

  const matches = resolveAfrikFiche(query);

  if (matches.length === 0) {
    console.error(`No AFRIK fiche declares a name matching "${query}".`);
    process.exit(1);
  }

  for (const match of matches) {
    console.log(
      `${match.id}\t${match.kind}\t${match.matchType}\t${match.matchedOn}=${match.matchedValue}`
    );
  }
}
