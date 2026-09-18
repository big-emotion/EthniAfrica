#!/usr/bin/env tsx
/**
 * Editorial CI rules gate for AFRIK fiches — ETNI-32.
 *
 * Enforces five decolonial-posture rules on the fiches under
 * `dataset/source/afrik/`:
 *
 *   Rule 1 — Endonym (autonym) required.
 *     Asked only of ethnographic entities — peoples and language families.
 *     The scope used to be "anything that is not a country", which was true
 *     while the corpus held three classes; it now holds eight, so that
 *     negative scope asked 24 language fiches and 32 patronyme files for a
 *     self-appellation none of them has a field to declare. Eighty-nine
 *     inapplicable warnings buried the two real ones — PPL_KIRDI among them,
 *     a colonial exonym meaning "pagan", which is precisely the case this
 *     rule exists to surface.
 *     If a fiche has no autonym (top-level `autonym`, or
 *     `content.appellations.selfAppellation` for PPL fiches, or
 *     `content.decolonialHeader.selfAppellation` for FLG fiches), then:
 *       - if `confidence` >= medium → error (blocks merge)
 *       - if `confidence` < medium or missing → warning (advisory)
 *
 *   Rule 2 — Sources count.
 *     If `classification_status` ∈ {contested, colonial-legacy} and the
 *     fiche carries fewer than 2 sources (aggregated `content.sources`),
 *     emit an error.
 *
 *   Rule 4 — A patronyme's claims cite its own sources.
 *     Patronymes are the only corpus class where provenance attaches to the
 *     assertion rather than to the fiche: each claim names the `sourceKey`
 *     backing it, through `sourceRefs`. A reference to a key the dossier does
 *     not declare renders exactly like one that resolves, so the claim reads
 *     as sourced while citing nothing.
 *
 *   Rule 5 — Reader-facing register.
 *     `gaps[].reason`, `sources[].title` and `sources[].notes` are rendered to
 *     the visitor verbatim, so they may carry no repository path, no JSON field
 *     path, no raw corpus identifier and none of the pipeline's own vocabulary.
 *     See `docs/editorial/reader-facing-register.md`.
 *
 *   Rule 3 — DoctrineLinkCard snapshot presence.
 *     If `classification_status` ∈ {contested, colonial-legacy}, look for a
 *     test file in the repo referencing `DoctrineLinkCard`. If no such test
 *     exists anywhere (ETNI-28 not yet merged), emit a `notice` and DO NOT
 *     block the build.
 *
 * Output: PR-annotation lines printed to stdout for GitHub Actions to pick
 * up, plus a human-readable summary on stderr. Exit code 0 when no errors,
 * 1 otherwise.
 */

import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";

// ───── Types ──────────────────────────────────────────────────────────────

export type Severity = "error" | "warning" | "notice";

export type RuleName =
  | "autonym-required"
  | "sources-count"
  | "doctrine-link-card-snapshot"
  | "source-ref-resolves"
  | "reader-facing-register"
  | "chronology-symmetry"
  | "competing-appellations"
  | "json-parse";

export interface RuleResult {
  rule: RuleName;
  severity: Severity;
  file: string; // path relative to repo root
  slug: string; // fiche id, e.g. PPL_YORUBA
  message: string;
}

export interface Fiche {
  id?: string;
  autonym?: string | null;
  confidence?: string | null;
  classification_status?: string | null;
  classificationStatus?: string | null;
  gaps?: unknown[];
  sources?: unknown[];
  names?: unknown[];
  content?: {
    appellations?: {
      selfAppellation?: string | null;
      exonyms?: unknown;
      originOfExonyms?: string | null;
    };
    decolonialHeader?: {
      selfAppellation?: string | null;
      historicalAppellations?: unknown;
      originOfHistoricalTerm?: string | null;
    };
    sources?: unknown[];
    kingdoms?: unknown[];
    // Chapters beyond the ones the rules name — historicalAffiliation carries
    // its own sources, which the register rule reads.
    [chapter: string]: unknown;
  };
  [key: string]: unknown;
}

export interface RunResult {
  exitCode: number;
  findings: RuleResult[];
  annotations: string[];
}

// ───── Helpers ────────────────────────────────────────────────────────────

const AUTONYM_RULE: RuleName = "autonym-required";
const SOURCES_RULE: RuleName = "sources-count";
const DOCTRINE_RULE: RuleName = "doctrine-link-card-snapshot";

const CONFIDENCE_BLOCKING = new Set(["medium", "high", "verified"]);
const CLASSIFICATION_FLAGGED = new Set(["contested", "colonial-legacy"]);

export function extractAutonym(fiche: Fiche): string | null {
  const top = fiche.autonym;
  if (typeof top === "string" && top.trim().length > 0) return top;

  const appellations = fiche.content?.appellations?.selfAppellation;
  if (typeof appellations === "string" && appellations.trim().length > 0) {
    return appellations;
  }

  const flg = fiche.content?.decolonialHeader?.selfAppellation;
  if (typeof flg === "string" && flg.trim().length > 0) return flg;

  return null;
}

/**
 * Country fiches (under `pays/`) don't carry a single autonym — they aggregate
 * many peoples, each with their own `selfAppellation`.
 */
export function isCountryFiche(relPath: string): boolean {
  const parts = relPath.split(/[\\/]/);
  return parts.some((p) => p === "pays");
}

/** The classes the autonym rule is about. */
const ETHNOGRAPHIC_DIRS = new Set(["peuples", "famille_linguistique"]);

/**
 * Rule 1 asks a fiche for its self-appellation. Only an ethnographic entity
 * has one to give.
 *
 * The rule used to be scoped as "anything that is not a country", which was
 * true of the corpus when it held three classes. It now holds eight, so the
 * negative scope caught languages, patronymes, relations, migrations and
 * onomastic systems — 89 advisory warnings asking a language for an endonym
 * it has no field to declare. A gate whose output is mostly inapplicable is
 * one nobody reads, which is the failure this file's own header warns about
 * from the other direction.
 */
export function isEthnographicFiche(relPath: string): boolean {
  const parts = relPath.split(/[\\/]/);
  return parts.some((p) => ETHNOGRAPHIC_DIRS.has(p));
}

/** A `PAT_*` dossier, the one class whose provenance is per-claim. */
export function isPatronymeFiche(relPath: string): boolean {
  const parts = relPath.split(/[\\/]/);
  return (
    parts.some((p) => p === "patronymes") &&
    /^PAT_[A-Z0-9_]+\.json$/.test(parts[parts.length - 1] ?? "")
  );
}

export function extractConfidence(fiche: Fiche): string | null {
  const c = fiche.confidence;
  return typeof c === "string" && c.length > 0 ? c.toLowerCase() : null;
}

/**
 * Both spellings are read, and neither may be tidied away.
 *
 * PPL and FLG fiches declare `classificationStatus` at the top level: that is
 * what `migrateAfrikToDatabase.ts` loads into the column (`:204` for families,
 * `:244` for peoples), and what `validateAfrikData.ts` already validates on
 * migration, relation and nom fiches. Reading only `classification_status`
 * meant Rule 2 matched no fiche in the corpus and reported green for it — a
 * gate that checked nothing, which is worse than a red one.
 *
 * The snake_case form stays because migration fiches use it.
 */
export function extractClassificationStatus(fiche: Fiche): string | null {
  const s = fiche.classification_status ?? fiche.classificationStatus;
  return typeof s === "string" && s.length > 0 ? s.toLowerCase() : null;
}

export function extractSources(fiche: Fiche): unknown[] {
  const sources = fiche.content?.sources;
  return Array.isArray(sources) ? sources : [];
}

function getSlug(fiche: Fiche, fallbackFromPath: string): string {
  if (typeof fiche.id === "string" && fiche.id.length > 0) return fiche.id;
  return path.basename(fallbackFromPath, ".json");
}

// ───── Rule 1: autonym ────────────────────────────────────────────────────

export function checkAutonym(fiche: Fiche, file: string): RuleResult | null {
  // Asked of the entities that have a self-appellation to give, rather than
  // of everything that is not a country — see `isEthnographicFiche`.
  if (!isEthnographicFiche(file)) return null;

  const autonym = extractAutonym(fiche);
  if (autonym !== null) return null;

  const confidence = extractConfidence(fiche);
  const blocking = confidence !== null && CONFIDENCE_BLOCKING.has(confidence);
  const slug = getSlug(fiche, file);
  const severity: Severity = blocking ? "error" : "warning";
  const confidenceLabel = confidence ?? "missing";

  return {
    rule: AUTONYM_RULE,
    severity,
    file,
    slug,
    message: `Fiche ${slug} has no autonym (endonym). Confidence=${confidenceLabel}. Decolonial posture requires every fiche to provide its self-appellation before reaching confidence >= medium.`,
  };
}

// ───── Rule: competing appellations ───────────────────────────────────────

const APPELLATIONS_RULE: RuleName = "competing-appellations";

/**
 * The fiches still storing `historicalAppellations` as a string, named rather
 * than counted.
 *
 * Twenty-four of the twenty-five families held one — and it was the family's
 * own English name, "Afroasiatic", "Bantu", "Cushitic". Two defects in one
 * field: the wrong content, since a family's own name is not a historical
 * appellation of itself, and the wrong shape, since `readNaming` projects
 * arrays and only arrays, so the result page was shown nothing for the whole
 * class. Twenty-two were rewritten from their archives on 2026-09-18.
 *
 * These two are not, and the reason is specific rather than a lack of time:
 * neither carries `originOfHistoricalTerm`, which this rule requires beside a
 * non-empty list, and writing one would mean naming authorities their fiches
 * do not cite — Ibn Khaldoun and Hanoteau & Letourneux for Berber, the VOC
 * journals for Khoe. Both are in the family-restoration queue
 * (`docs/editorial/family-restoration/`), where a header is written together
 * with the sources that carry it.
 *
 * A named entry is downgraded to a warning, never excused — and the rule fails
 * in the other direction too, when a fiche here starts carrying a list. An
 * entry left standing is a free pass for the next fiche that regresses. When
 * both are gone, delete the set.
 */
const STRING_APPELLATIONS_DEBT = new Set(["FLG_BERBERE", "FLG_KHOE"]);

/**
 * A fiche must have *decided* about the names it is known by besides its own.
 *
 * The result page promises to show every form and to crown none of them
 * (`docs/design/search-result-charter.md`). Nothing required a fiche to carry
 * those forms, so the promise rested on a field that could empty without a test
 * noticing — the blocker §5 of that charter names about itself.
 *
 * **It cannot demand an exonym.** A people known by one name only is a truth
 * the atlas publishes, and `Ekpeye` is the board drawn for it. What it demands
 * is that the question was asked: the key present, so an empty list reads as
 * « we looked and found none » rather than as nobody having looked. Measured
 * 2026-09-18 — 770 of 774 peoples carry forms, three declare an empty list, and
 * one never declared the key at all.
 *
 * And a fiche that does carry forms says where they come from — the field the
 * page's « D'où elles viennent » block reads.
 *
 * **It is an error, not a warning, because the corpus is at zero.** It shipped
 * as a warning behind a ratchet of three; all three were correctable from prose
 * the fiches already published, so the ratchet was deleted in the same session
 * that created it. Two of the three were not incomplete at all — they listed
 * their own name as a competing appellation, with a note in brackets, which is
 * a people known by one name mis-encoded as a people known by two.
 */
export function checkCompetingAppellations(
  fiche: Fiche,
  file: string
): RuleResult[] {
  if (!isEthnographicFiche(file)) return [];

  const slug = getSlug(fiche, file);
  const isFamily = file.split(/[\\/]/).includes("famille_linguistique");
  const block = isFamily
    ? fiche.content?.decolonialHeader
    : fiche.content?.appellations;
  const formsKey = isFamily ? "historicalAppellations" : "exonyms";
  const originKey = isFamily ? "originOfHistoricalTerm" : "originOfExonyms";

  if (!block || !(formsKey in block)) {
    return [
      {
        rule: APPELLATIONS_RULE,
        severity: "error",
        file,
        slug,
        message: `Fiche ${slug} never declares \`${formsKey}\`. A people known by one name only is a truth the atlas publishes — say so with an empty list. An absent key is an unanswered question, and the result page cannot tell the two apart.`,
      },
    ];
  }

  const forms = (block as Record<string, unknown>)[formsKey];
  const origin = (block as Record<string, unknown>)[originKey];
  const owesAList = STRING_APPELLATIONS_DEBT.has(slug);

  if (owesAList && Array.isArray(forms)) {
    return [
      {
        rule: APPELLATIONS_RULE,
        severity: "error",
        file,
        slug,
        message: `Fiche ${slug} now declares \`${formsKey}\` as a list. Remove it from STRING_APPELLATIONS_DEBT in the same change — an entry left standing is a free pass for the next fiche that regresses.`,
      },
    ];
  }

  // A declared silence is an empty *list*. Anything else that is not a list is
  // an answer nothing can read: `readNaming` projects arrays and only arrays,
  // so a string sits in a full field and reaches the reader as no forms at
  // all. This rule used to return early here on any non-array, which made a
  // string indistinguishable from a silence — and twenty-four of the
  // twenty-five family fiches store one.
  if (!Array.isArray(forms)) {
    return [
      {
        rule: APPELLATIONS_RULE,
        severity: owesAList ? "warning" : "error",
        file,
        slug,
        message: `Fiche ${slug} declares \`${formsKey}\` as ${forms === null ? "null" : typeof forms}, where the strict model declares a list. A declared silence is an empty list; anything else is a value the result page cannot read, and this rule could not tell the two apart.`,
      },
    ];
  }

  if (forms.length === 0) return [];

  if (typeof origin !== "string" || origin.trim().length === 0) {
    return [
      {
        rule: APPELLATIONS_RULE,
        severity: "error",
        file,
        slug,
        message: `Fiche ${slug} lists ${forms.length} competing appellation(s) and says nowhere where they come from (\`${originKey}\` is empty). Showing a name without its provenance is the one thing this atlas does not do.`,
      },
    ];
  }

  return [];
}

// ───── Rule 2: sources count ──────────────────────────────────────────────

export function checkSourcesCount(
  fiche: Fiche,
  file: string
): RuleResult | null {
  const status = extractClassificationStatus(fiche);
  if (status === null || !CLASSIFICATION_FLAGGED.has(status)) return null;

  const count = extractSources(fiche).length;
  if (count >= 2) return null;

  const slug = getSlug(fiche, file);
  return {
    rule: SOURCES_RULE,
    severity: "error",
    file,
    slug,
    message: `Fiche ${slug} has classification_status="${status}" but only ${count} source(s). Decolonial posture requires >= 2 sources for contested or colonial-legacy classifications.`,
  };
}

// ───── Rule 4: a patronyme's claims cite its own sources ──────────────────

const SOURCE_REF_RULE: RuleName = "source-ref-resolves";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every `sourceRefs` entry anywhere in a dossier, however deeply nested. */
function collectSourceRefs(value: unknown, into: Set<string>): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectSourceRefs(entry, into);
    return;
  }
  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (key === "sourceRefs" && Array.isArray(child)) {
      for (const ref of child) {
        if (typeof ref === "string" && ref.trim() !== "") into.add(ref);
      }
      continue;
    }
    if (key === "selfIdentificationSourceRef" && typeof child === "string") {
      into.add(child);
      continue;
    }
    collectSourceRefs(child, into);
  }
}

/**
 * Patronymes are the only corpus class where provenance attaches to the
 * assertion rather than to the fiche: each claim names the `sourceKey` that
 * backs it. A reference to a key the dossier does not declare is a claim that
 * cites nothing — and it renders exactly like one that cites something, which
 * is the failure mode a provenance-first surface can least afford.
 */
export function checkPatronymeSourceRefs(
  fiche: Fiche,
  file: string
): RuleResult[] {
  if (!isPatronymeFiche(file)) return [];

  const declared = new Set<string>();
  const sources = fiche.sources;
  if (Array.isArray(sources)) {
    for (const source of sources) {
      if (isRecord(source) && typeof source.sourceKey === "string") {
        declared.add(source.sourceKey);
      }
    }
  }

  const referenced = new Set<string>();
  collectSourceRefs(fiche, referenced);

  const slug = getSlug(fiche, file);
  return [...referenced]
    .filter((ref) => !declared.has(ref))
    .sort()
    .map((ref) => ({
      rule: SOURCE_REF_RULE,
      severity: "error" as Severity,
      file,
      slug,
      message: `Fiche ${slug} cites source key "${ref}", which it does not declare in sources[]. A claim referencing an undeclared key is published as sourced while resolving to nothing.`,
    }));
}

// ───── Rule 3: DoctrineLinkCard snapshot ──────────────────────────────────

const TEST_DIR_NAMES = new Set(["__tests__", "__snapshots__", "tests", "test"]);
const TEST_FILE_RE = /\.(test|spec|stories)\.(ts|tsx|js|jsx|mdx)$/i;
const SNAPSHOT_FILE_RE = /\.snap$/i;

function isTestFile(name: string): boolean {
  return TEST_FILE_RE.test(name) || SNAPSHOT_FILE_RE.test(name);
}

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".vercel",
  ".storybook-static",
  "storybook-static",
]);

function searchForDoctrineLinkCardTest(root: string): boolean {
  // Walk repo, look for a test file mentioning DoctrineLinkCard.
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".github") {
        // Skip hidden dirs other than .github (not relevant for tests anyway).
        if (entry.isDirectory()) continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!isTestFile(entry.name)) continue;
      let content: string;
      try {
        content = fs.readFileSync(full, "utf-8");
      } catch {
        continue;
      }
      if (content.includes("DoctrineLinkCard")) return true;
    }
  }
  return false;
}

// Cache to avoid walking the tree per-fiche. Keyed by repoRoot.
const doctrineSearchCache = new Map<string, boolean>();

export function checkDoctrineLinkCardSnapshot(
  fiche: Fiche,
  file: string,
  repoRoot: string
): RuleResult | null {
  const status = extractClassificationStatus(fiche);
  if (status === null || !CLASSIFICATION_FLAGGED.has(status)) return null;

  let exists = doctrineSearchCache.get(repoRoot);
  if (exists === undefined) {
    exists = searchForDoctrineLinkCardTest(repoRoot);
    doctrineSearchCache.set(repoRoot, exists);
  }

  if (exists) return null;

  const slug = getSlug(fiche, file);
  return {
    rule: DOCTRINE_RULE,
    severity: "notice",
    file,
    slug,
    message: `Fiche ${slug} has classification_status="${status}" but no DoctrineLinkCard test was found in the repository. ETNI-28 not yet merged — Rule 3 is informational only.`,
  };
}

// ───── Rule 5: reader-facing register ─────────────────────────────────────

const REGISTER_RULE: RuleName = "reader-facing-register";

export interface ProseField {
  path: string;
  text: string;
}

/**
 * The prose a fiche publishes verbatim.
 *
 * `gaps[].reason` is rendered by `FieldProvenanceMarker` and the `sources[]`
 * entries by the Sources chapter, neither of which draws a curation/reader
 * distinction: whatever the corpus holds in these three fields is what the
 * visitor reads.
 *
 * Sources are found by walking the fiche, not by listing where they live. An
 * enumerated list was wrong twice: it read `sources` and `names[].sources` but
 * not `content.sources`, where 854 people, country and family fiches keep
 * theirs, and then not `content.historicalAffiliation.sources`, where a
 * chapter keeps its own.
 *
 * Every `_`-prefixed key — `_meta.directives`, `_translation` — is authoring
 * metadata that no surface renders, and stays the curator's to write.
 */
export function readerFacingProseFields(fiche: Fiche): ProseField[] {
  const fields: ProseField[] = [];

  if (Array.isArray(fiche.gaps)) {
    fiche.gaps.forEach((gap, i) => {
      if (!isRecord(gap)) return;
      const reason = gap.reason;
      if (typeof reason === "string" && reason.trim() !== "") {
        fields.push({ path: `gaps[${i}].reason`, text: reason });
      }
    });
  }

  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (!isRecord(value)) return;

    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("_")) continue;
      const childPath = path ? `${path}.${key}` : key;
      if (key === "sources" && Array.isArray(child)) {
        child.forEach((source, i) => {
          if (!isRecord(source)) return;
          for (const field of ["title", "notes"] as const) {
            const text = source[field];
            if (typeof text === "string" && text.trim() !== "") {
              fields.push({ path: `${childPath}[${i}].${field}`, text });
            }
          }
        });
      }
      walk(child, childPath);
    }
  };
  walk(fiche, "");

  return fields;
}

/**
 * The reader-facing register moved to `src/lib/editorial/readerRegister` when
 * it gained a second caller with the opposite timing: this gate reads it at
 * build time to refuse a fiche, and `lib/seo/ficheMetadata` reads it at request
 * time to refuse a title it would otherwise print into a search result. Two
 * copies of the vocabulary could disagree about what a reader may see, which is
 * the one thing a single exported constant exists to prevent.
 *
 * Re-exported here because this module is where CLAUDE.md and the rule's own
 * tests say the vocabulary is found.
 */
import {
  type RegisterPattern,
  INTERNAL_REGISTER_PATTERNS,
  INTERNAL_REGISTER_PATTERNS_EN,
} from "@/lib/editorial/readerRegister";

export {
  type RegisterPattern,
  INTERNAL_REGISTER_PATTERNS,
  INTERNAL_REGISTER_PATTERNS_EN,
};

/**
 * `_`-prefixed files under the corpus are the curator's own worksheets — the
 * candidate queue, the coverage findings, the manifest. Nothing loads them and
 * no surface renders them, so their notes are allowed to stay notes.
 */
export function isCuratorWorksheet(relPath: string): boolean {
  return path.basename(relPath).startsWith("_");
}

/**
 * A French fiche is read against both lists: its source notes are often
 * English — the tiering codemod wrote 5 000 of them in English whatever the
 * fiche's language — and the French list alone let every one through.
 */
export function checkReaderFacingRegister(
  fiche: Fiche,
  file: string,
  patterns: ReadonlyArray<RegisterPattern> = [
    ...INTERNAL_REGISTER_PATTERNS,
    ...INTERNAL_REGISTER_PATTERNS_EN,
  ]
): RuleResult[] {
  if (isCuratorWorksheet(file)) return [];

  const slug = getSlug(fiche, file);
  const findings: RuleResult[] = [];

  for (const field of readerFacingProseFields(fiche)) {
    for (const { label, pattern } of patterns) {
      const hit = field.text.match(pattern);
      if (hit === null) continue;
      findings.push({
        rule: REGISTER_RULE,
        severity: "error",
        file,
        slug,
        message: `${field.path} is published verbatim to the reader but carries a ${label} ("${hit[0]}"). Say what the atlas does not know; never how the workshop knows it does not.`,
      });
      break;
    }
  }

  return findings;
}

// ───── Rule 6: chronology symmetry ────────────────────────────────────────

const CHRONOLOGY_RULE: RuleName = "chronology-symmetry";

/**
 * The number of precolonial polities still undated in a country that dates its
 * colonial administrations, measured 2026-09-07 across the 54 country fiches.
 *
 * A ratchet with two edges, like `DEAD_CODE_CEILINGS`: above it is a
 * regression, and **below it is also a failure**, because a ceiling left
 * standing over the real count is a licence to climb back to it. Each editorial
 * pass that sources a polity's dates lowers this constant in the same change,
 * which is what makes the burn-down auditable rather than aspirational.
 *
 * It moved 95 → 96 once, in the change that retyped "Colónia de Angola" from
 * polity to colonial. Nothing regressed: Angola's Ovimbundu kingdoms were
 * always undated, and the misfiled colony was hiding them from this count. A
 * ratchet that only ever falls would have made that correction unreportable,
 * so the rule is that the number follows the measurement and the change says
 * why.
 *
 * When it reaches 0, delete the ratchet and let the findings be errors: the
 * rule becomes a plain gate and the asymmetry cannot return.
 */
export const UNDATED_POLITY_CEILING = 95;

interface KingdomShape {
  name?: unknown;
  entryType?: unknown;
  timeRange?: unknown;
}

/**
 * Rule 6 – A country that dates its colonial administrations dates its
 * precolonial polities too.
 *
 * This is not a completeness check. A country that dates nothing is merely
 * unfinished; a country that dates only the coloniser has published a claim
 * about whose history is precise, and that is the asymmetry the atlas showed
 * on six of its pages — "1894 - 1962" for the protectorate, "Précolonial" for
 * the five kingdoms above it.
 *
 * The grain is the entry, not the country: counting countries would let a
 * single dated Ugandan kingdom clear the other four.
 */
export function checkChronologySymmetry(
  fiche: Fiche,
  file: string
): RuleResult[] {
  if (!isCountryFiche(file)) return [];
  const kingdoms = fiche.content?.kingdoms;
  if (!Array.isArray(kingdoms)) return [];

  const entries = kingdoms.filter(
    (k): k is KingdomShape => !!k && typeof k === "object"
  );
  const datedColonial = entries.find(
    (k) =>
      (k.entryType === "colonial" || k.entryType === "modern") && !!k.timeRange
  );
  if (!datedColonial) return [];

  const witness =
    typeof datedColonial.name === "string" ? datedColonial.name : "—";
  const slug = path.basename(file, ".json");

  return entries
    .filter((k) => k.entryType === "polity" && !k.timeRange)
    .map((k) => ({
      rule: CHRONOLOGY_RULE,
      severity: "warning" as Severity,
      file,
      slug,
      message: `"${witness}" is dated but "${
        typeof k.name === "string" ? k.name : "—"
      }" is not — a country that dates its colonial administrations must date its precolonial polities.`,
    }));
}

/**
 * The ratchet finding. Returns null only when the corpus sits exactly on the
 * recorded ceiling; both directions are errors, and the message names the
 * measured number so the fix is to edit one line.
 */
export function checkUndatedPolityCeiling(
  count: number,
  ceiling: number
): RuleResult | null {
  if (count === ceiling) return null;
  const direction =
    count > ceiling
      ? `rose to ${count} (ceiling ${ceiling}) — a polity lost its dates`
      : `fell to ${count} (ceiling ${ceiling}) — lower UNDATED_POLITY_CEILING to ${count} in the same change`;
  return {
    rule: CHRONOLOGY_RULE,
    severity: "error",
    file: "scripts/ci/checkEditorialRules.ts",
    slug: "UNDATED_POLITY_CEILING",
    message: `Undated precolonial polities ${direction}.`,
  };
}

// ───── Loader ─────────────────────────────────────────────────────────────

interface LoadedFiche {
  fiche: Fiche | null;
  relPath: string;
  parseError: string | null;
}

function listFicheFiles(afrikRoot: string): string[] {
  const out: string[] = [];
  const stack: string[] = [afrikRoot];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip directories that are not live corpus data: `archive/` is
        // retired fiches, and `logs/` is where validateAfrikData writes its
        // own report — walking it made the gate audit its own output.
        if (entry.name === "archive" || entry.name === "logs") continue;
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".json")) continue;
      out.push(full);
    }
  }
  return out.sort();
}

function loadFiche(fullPath: string, repoRoot: string): LoadedFiche {
  const relPath = path.relative(repoRoot, fullPath);
  try {
    const raw = fs.readFileSync(fullPath, "utf-8");
    const fiche = JSON.parse(raw) as Fiche;
    return { fiche, relPath, parseError: null };
  } catch (err) {
    return {
      fiche: null,
      relPath,
      parseError: err instanceof Error ? err.message : String(err),
    };
  }
}

// ───── PR-annotation emitter ──────────────────────────────────────────────

/**
 * Escape characters that have special meaning in GitHub Actions workflow
 * commands. The `%` substitution MUST run first to avoid double-escaping.
 * See https://docs.github.com/actions/reference/workflow-commands-for-github-actions
 */
export function escapeWorkflowCommand(s: string): string {
  return s
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/:/g, "%3A")
    .replace(/,/g, "%2C");
}

export function formatAnnotation(r: RuleResult): string {
  const tag =
    r.severity === "error"
      ? "::error"
      : r.severity === "warning"
        ? "::warning"
        : "::notice";
  // Posix-style separator for GitHub Actions annotations.
  const file = r.file.split(path.sep).join("/");
  const title = escapeWorkflowCommand(`${r.rule}::${r.slug}`);
  const message = escapeWorkflowCommand(`${r.slug} — ${r.message}`);
  return `${tag} file=${file},title=${title}::${message}`;
}

// ───── Runner ─────────────────────────────────────────────────────────────

export interface RunOptions {
  repoRoot: string;
  afrikRoot?: string;
  /** Defaults to `<repoRoot>/dataset/translations/en`. */
  translationsRoot?: string;
  /**
   * The undated-polity ratchet counts *this repository's* corpus, so it is off
   * unless a caller asks for it — a run pointed at a fixture would otherwise
   * fail for containing the wrong number of countries. The CLI passes
   * `UNDATED_POLITY_CEILING`; that call site is the arming.
   */
  undatedPolityCeiling?: number;
}

export function runEditorialRules(opts: RunOptions): RunResult {
  const repoRoot = opts.repoRoot;
  const afrikRoot =
    opts.afrikRoot ?? path.join(repoRoot, "dataset", "source", "afrik");

  // Reset doctrine cache for this run (tests reuse the module).
  doctrineSearchCache.delete(repoRoot);

  const findings: RuleResult[] = [];

  if (!fs.existsSync(afrikRoot)) {
    // No data dir → nothing to do; emit a notice for transparency but exit 0.
    const notice: RuleResult = {
      rule: AUTONYM_RULE,
      severity: "notice",
      file: path.relative(repoRoot, afrikRoot),
      slug: "—",
      message: `AFRIK source directory not found at ${afrikRoot}; nothing to validate.`,
    };
    const annotations = [formatAnnotation(notice)];
    return { exitCode: 0, findings: [notice], annotations };
  }

  const files = listFicheFiles(afrikRoot);

  for (const fullPath of files) {
    const { fiche, relPath, parseError } = loadFiche(fullPath, repoRoot);
    if (parseError !== null || fiche === null) {
      findings.push({
        rule: "json-parse",
        severity: "error",
        file: relPath,
        slug: path.basename(relPath, ".json"),
        message: `Invalid JSON in ${relPath}: ${parseError}`,
      });
      continue;
    }

    const r1 = checkAutonym(fiche, relPath);
    if (r1) findings.push(r1);

    const r2 = checkSourcesCount(fiche, relPath);
    if (r2) findings.push(r2);

    const r3 = checkDoctrineLinkCardSnapshot(fiche, relPath, repoRoot);
    if (r3) findings.push(r3);

    findings.push(...checkPatronymeSourceRefs(fiche, relPath));

    findings.push(...checkReaderFacingRegister(fiche, relPath));

    findings.push(...checkChronologySymmetry(fiche, relPath));

    findings.push(...checkCompetingAppellations(fiche, relPath));
  }

  if (opts.undatedPolityCeiling !== undefined) {
    const undatedPolities = findings.filter(
      (f) => f.rule === CHRONOLOGY_RULE
    ).length;
    const ratchet = checkUndatedPolityCeiling(
      undatedPolities,
      opts.undatedPolityCeiling
    );
    if (ratchet) findings.push(ratchet);
  }

  // A translated record publishes the same three fields verbatim, in English.
  // Only the register rule applies: invariants and sources are the source
  // fiche's, and TR-1 in validateAfrikData holds the sidecar to them.
  const translationsRoot =
    opts.translationsRoot ??
    path.join(repoRoot, "dataset", "translations", "en");
  for (const fullPath of listFicheFiles(translationsRoot)) {
    const { fiche, relPath, parseError } = loadFiche(fullPath, repoRoot);
    if (parseError !== null || fiche === null) {
      findings.push({
        rule: "json-parse",
        severity: "error",
        file: relPath,
        slug: path.basename(relPath, ".json"),
        message: `Invalid JSON in ${relPath}: ${parseError}`,
      });
      continue;
    }
    findings.push(
      ...checkReaderFacingRegister(
        fiche,
        relPath,
        INTERNAL_REGISTER_PATTERNS_EN
      )
    );
  }

  const annotations = findings.map(formatAnnotation);
  const exitCode = findings.some((f) => f.severity === "error") ? 1 : 0;
  return { exitCode, findings, annotations };
}

// ───── CLI entry point ────────────────────────────────────────────────────

function summarize(findings: RuleResult[]): string {
  const counts: Record<Severity, number> = {
    error: 0,
    warning: 0,
    notice: 0,
  };
  for (const f of findings) counts[f.severity]++;
  return `Editorial rules summary — errors: ${counts.error}, warnings: ${counts.warning}, notices: ${counts.notice}`;
}

async function main(): Promise<void> {
  const repoRoot = process.cwd();
  const result = runEditorialRules({
    repoRoot,
    undatedPolityCeiling: UNDATED_POLITY_CEILING,
  });
  for (const line of result.annotations) {
    // PR annotations must be written to stdout for GitHub Actions to pick
    // them up.
    process.stdout.write(line + "\n");
  }
  process.stderr.write(summarize(result.findings) + "\n");
  // Ensure stdout is flushed before exit; process.exit() can otherwise drop
  // buffered annotation lines and break GitHub Actions parsing.
  await new Promise<void>((resolve) =>
    process.stdout.write("", () => resolve())
  );
  process.exit(result.exitCode);
}

// Only run main() when invoked directly (not when imported by tests).
const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  void main();
}
