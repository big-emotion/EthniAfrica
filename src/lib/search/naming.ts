import type { SearchEntityType } from "@/types/afrik-frontend";

/**
 * One shape for what a result page says about a name, whatever class it comes
 * from.
 *
 * Five classes answer the same question and each stores the answer under a
 * different key — peoples under `content.appellations`, countries at the root
 * plus `content.historicalNames`, families under `content.decolonialHeader`,
 * patronymes under `spellings[]` and `origin`, languages under a bare
 * `alternateNames[]`. Measured 2026-09-18; the counts are in
 * `docs/design/search-result-data-shape.md`.
 *
 * Before this, the envelope surfaced naming for **peoples only**, so three of
 * the five classes delivered none of their names to the page that exists to
 * show them. Reading five shapes in the component is how a block ends up
 * rendering on one class and silently missing on another; reading them here
 * turns the grammar's conditions into field checks.
 */

/** One form a thing is known by. */
export interface NamingForm {
  form: string;
  /**
   * A short qualifier — the language it comes from, the register it carries.
   *
   * **Undefined until a field exists for it, and never parsed out of `form`.**
   * A quarter of the corpus's exonyms carry something like
   * « Mandingue (français colonial) », in 677 distinct free-text values across
   * 759 uses. Splitting on the parenthesis would leave three quarters of the
   * forms bare and publish those values as if they were a vocabulary.
   */
  qualifier?: string;
  /** Country codes where this form is attested — patronymes alone record it. */
  attestedIn?: string[];
}

/** The six eras a country's fiche names, in reading order. */
// @req REQ-044
export const NAMING_ERAS = [
  "formerNames",
  "antiquity",
  "middleAges",
  "precolonial",
  "colonization",
  "contemporary",
] as const;

export type NamingEraKey = (typeof NAMING_ERAS)[number];

export interface NamingEra {
  era: NamingEraKey;
  text: string;
}

export interface NamingProjection {
  /** The name the thing gives itself, where the corpus records one. */
  selfGiven?: string;
  /** Every other form, in the order the fiche lists them. Never reordered. */
  forms: NamingForm[];
  /** Where the forms come from, as the curator wrote it. */
  origin?: string;
  /** What the forms carry that the reader should know. */
  problem?: string;
  /** Who uses which form today. */
  usageToday?: string;
  /**
   * Dated eras. Only countries fill this — measured at 100 % on all 54, and at
   * 0 % on every people, family, language and patronyme.
   */
  eras: NamingEra[];
}

const EMPTY: NamingProjection = { forms: [], eras: [] };

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && !!item.trim()
      )
    : [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function bareForms(names: string[]): NamingForm[] {
  return names.map((form) => ({ form }));
}

function fromAppellations(content: Record<string, unknown>): NamingProjection {
  const appellations = record(content.appellations);
  return {
    selfGiven: text(appellations.selfAppellation),
    forms: bareForms(strings(appellations.exonyms)),
    origin: text(appellations.originOfExonyms),
    problem: text(appellations.whyProblematic),
    usageToday: text(appellations.contemporaryUsage),
    eras: [],
  };
}

function fromDecolonialHeader(
  content: Record<string, unknown>
): NamingProjection {
  const header = record(content.decolonialHeader);
  return {
    selfGiven: text(header.selfAppellation),
    forms: bareForms(strings(header.historicalAppellations)),
    origin: text(header.originOfHistoricalTerm),
    problem: text(header.whyProblematic),
    usageToday: text(header.contemporaryUsage),
    eras: [],
  };
}

function fromCountry(
  content: Record<string, unknown>,
  root: Record<string, unknown>
): NamingProjection {
  const historical = record(content.historicalNames);
  const eras: NamingEra[] = [];
  for (const era of NAMING_ERAS) {
    const value = text(historical[era]);
    if (value) eras.push({ era, text: value });
  }

  // `nameOriginActor` is prose about who did the naming, not a code — it reads
  // as a second sentence of the etymology rather than a field of its own.
  const etymology = text(root.etymology);
  const actor = text(root.nameOriginActor);
  const origin = [etymology, actor].filter(Boolean).join(" ") || undefined;

  return {
    selfGiven: undefined,
    forms: bareForms(strings(historical.formerNames)),
    origin,
    problem: undefined,
    usageToday: text(historical.contemporary),
    eras,
  };
}

function fromSpellings(root: Record<string, unknown>): NamingProjection {
  const forms: NamingForm[] = [];
  for (const entry of Array.isArray(root.spellings) ? root.spellings : []) {
    const spelling = record(entry);
    const form = text(spelling.spelling);
    if (!form) continue;
    const attestedIn = (
      Array.isArray(spelling.attestations) ? spelling.attestations : []
    )
      .map((attestation) => text(record(attestation).countryId))
      .filter((code): code is string => Boolean(code));
    forms.push(attestedIn.length ? { form, attestedIn } : { form });
  }

  // The origin is one or more sourced claims; the page shows the prose, and the
  // claims keep their own sources on the fiche.
  const origin = record(root.origin);
  const claims = [
    ...(Array.isArray(origin.writtenChronicles)
      ? origin.writtenChronicles
      : []),
    ...(Array.isArray(origin.oralTraditions) ? origin.oralTraditions : []),
  ]
    .map((entry) => text(record(entry).claim))
    .filter((claim): claim is string => Boolean(claim));

  return {
    selfGiven: text(root.nameMain),
    forms,
    origin: claims.length ? claims.join(" ") : undefined,
    problem: undefined,
    usageToday: undefined,
    eras: [],
  };
}

/**
 * Reads whichever shape the class uses and returns the one the page consumes.
 *
 * A class with nothing to say returns the empty projection rather than
 * `undefined`, so a caller writes `naming.forms.length > 0` and never a null
 * guard — the grammar's conditions are about what the corpus holds, not about
 * whether a reader exists.
 */
// @req REQ-044
export function readNaming(
  type: SearchEntityType | string,
  content: unknown,
  root: unknown = {}
): NamingProjection {
  const contentRecord = record(content);
  const rootRecord = record(root);

  switch (type) {
    case "people":
      return fromAppellations(contentRecord);
    case "languageFamily":
      return fromDecolonialHeader(contentRecord);
    case "country":
      return fromCountry(contentRecord, rootRecord);
    case "patronyme":
      return fromSpellings(rootRecord);
    case "language":
      return {
        ...EMPTY,
        forms: bareForms([
          ...strings(rootRecord.alternateNames),
          ...strings(rootRecord.spellingAliases),
        ]),
      };
    default:
      return EMPTY;
  }
}
