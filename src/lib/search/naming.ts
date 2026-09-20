import type { SearchEntityType } from "@/types/afrik-frontend";
import { violatesReaderRegister } from "@/lib/editorial/readerRegister";
import type { SearchEvidence } from "@/lib/search/evidence";

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

export type NamingClaimStatus = "established" | "claimed" | "contested";

export interface SearchNameRecord {
  id: string;
  entityType: string;
  entityId: string;
  form: string;
  kind: "endonym" | "exonym" | "historical_spelling" | "surname";
  languageOfOrigin?: string;
  meaning?: string;
  periodLabel?: string;
  imposedBy?: string;
  impositionPeriod?: string;
  problematic: boolean;
  usedToday: boolean;
  claimStatus?: NamingClaimStatus;
  evidence: SearchEvidence[];
}

export interface NamingOriginFact {
  languageCode?: string;
  meaning?: string;
  imposedBy?: string;
  period?: string;
}

export interface NamingPresentationForm {
  form: string;
  /** Null means the corpus does not classify the form on this axis. */
  selfGiven: boolean | null;
  qualifier?: string;
  origin?: NamingOriginFact;
  attestationPeriod?: string;
  attestations: string[];
  problematic?: "recorded";
  currentUsage?: "recorded";
  claimStatus?: NamingClaimStatus;
  evidence: SearchEvidence[];
}

export interface NamingPosition {
  statement?: string;
  claimStatus: NamingClaimStatus;
  evidence: SearchEvidence[];
}

export interface NamingDisagreement {
  positions: NamingPosition[];
}

export interface NamingPresentation {
  forms: NamingPresentationForm[];
  eras: Array<{ era: NamingEraKey }>;
  disagreements: NamingDisagreement[];
  origin?: "recorded";
  problematic?: "recorded";
  currentUsage?: "recorded";
  evidence: SearchEvidence[];
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
  /** Structured facts for the feed. Legacy prose above is not rendered there. */
  presentation: NamingPresentation;
}

type LegacyNamingProjection = Omit<NamingProjection, "presentation">;

const EMPTY: LegacyNamingProjection = { forms: [], eras: [] };

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

function fromAppellations(
  content: Record<string, unknown>
): LegacyNamingProjection {
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
): LegacyNamingProjection {
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
): LegacyNamingProjection {
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

function fromSpellings(root: Record<string, unknown>): LegacyNamingProjection {
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

const SCHOLARLY_PAGE_WORDS =
  /(?:^|[^\p{L}])(?:exonyme|endonyme|autonyme|étymologie|etymologie|exonym|endonym|autonym|etymology|corpus)(?=$|[^\p{L}])/iu;

// @req REQ-180
export function searchPresentationText(value: unknown): string | undefined {
  const candidate = text(value);
  return candidate &&
    !violatesReaderRegister(candidate) &&
    !SCHOLARLY_PAGE_WORDS.test(candidate)
    ? candidate
    : undefined;
}

function formKey(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}

function basePresentationForms(
  type: SearchEntityType | string,
  legacy: LegacyNamingProjection
): NamingPresentationForm[] {
  const forms: NamingPresentationForm[] = [];
  const seen = new Set<string>();

  if (legacy.selfGiven && type !== "patronyme") {
    seen.add(formKey(legacy.selfGiven));
    forms.push({
      form: legacy.selfGiven,
      selfGiven: true,
      attestations: [],
      evidence: [],
    });
  }

  for (const form of legacy.forms) {
    const key = formKey(form.form);
    if (seen.has(key)) continue;
    seen.add(key);
    forms.push({
      form: form.form,
      selfGiven: type === "people" || type === "languageFamily" ? false : null,
      ...(searchPresentationText(form.qualifier)
        ? { qualifier: searchPresentationText(form.qualifier) }
        : {}),
      attestations: form.attestedIn ?? [],
      evidence: [],
    });
  }

  return forms;
}

function originFact(record: SearchNameRecord): NamingOriginFact | undefined {
  const origin: NamingOriginFact = {
    ...(searchPresentationText(record.languageOfOrigin)
      ? { languageCode: searchPresentationText(record.languageOfOrigin) }
      : {}),
    ...(searchPresentationText(record.meaning)
      ? { meaning: searchPresentationText(record.meaning) }
      : {}),
    ...(searchPresentationText(record.imposedBy)
      ? { imposedBy: searchPresentationText(record.imposedBy) }
      : {}),
    ...(searchPresentationText(record.impositionPeriod)
      ? { period: searchPresentationText(record.impositionPeriod) }
      : {}),
  };
  return Object.keys(origin).length > 0 ? origin : undefined;
}

function enrichPresentationForms(
  base: NamingPresentationForm[],
  records: readonly SearchNameRecord[]
): NamingPresentationForm[] {
  const byKey = new Map(base.map((form) => [formKey(form.form), form]));

  for (const record of records) {
    const key = formKey(record.form);
    const existing = byKey.get(key);
    const enriched: NamingPresentationForm = {
      form: record.form,
      selfGiven:
        record.kind === "endonym"
          ? true
          : record.kind === "exonym"
            ? false
            : (existing?.selfGiven ?? null),
      ...(existing?.qualifier ? { qualifier: existing.qualifier } : {}),
      ...(originFact(record) ? { origin: originFact(record) } : {}),
      ...(searchPresentationText(record.periodLabel)
        ? { attestationPeriod: searchPresentationText(record.periodLabel) }
        : {}),
      attestations: existing?.attestations ?? [],
      ...(record.problematic ? { problematic: "recorded" as const } : {}),
      ...(record.usedToday ? { currentUsage: "recorded" as const } : {}),
      ...(record.claimStatus ? { claimStatus: record.claimStatus } : {}),
      evidence: record.evidence,
    };
    if (existing) {
      const index = base.indexOf(existing);
      base[index] = enriched;
    } else {
      base.push(enriched);
    }
    byKey.set(key, enriched);
  }

  return base;
}

const ORIGIN_COLLECTIONS = [
  "oralTraditions",
  "writtenChronicles",
  "linguisticReconstructions",
] as const;

function disagreementsOf(
  root: Record<string, unknown>,
  evidence: readonly SearchEvidence[]
): NamingDisagreement[] {
  const origin = record(root.origin);
  const positions = ORIGIN_COLLECTIONS.flatMap((collection) =>
    (Array.isArray(origin[collection]) ? origin[collection] : []).flatMap(
      (value, index): NamingPosition[] => {
        const item = record(value);
        const claimStatus = item.claimStatus;
        if (
          claimStatus !== "established" &&
          claimStatus !== "claimed" &&
          claimStatus !== "contested"
        ) {
          return [];
        }
        const statement = searchPresentationText(item.claim);
        const fieldPrefix = `origin.${collection}.${index}`;
        const matchingEvidence = evidence.filter(({ assertion }) => {
          if (assertion.fieldPath) {
            return (
              assertion.fieldPath === fieldPrefix ||
              assertion.fieldPath.startsWith(`${fieldPrefix}.`)
            );
          }
          return assertion.statement === item.claim;
        });
        return [
          {
            ...(statement ? { statement } : {}),
            claimStatus,
            evidence: matchingEvidence,
          },
        ];
      }
    )
  );

  return positions.length > 1 ||
    positions.some(({ claimStatus }) => claimStatus === "contested")
    ? [{ positions }]
    : [];
}

function buildPresentation(
  type: SearchEntityType | string,
  legacy: LegacyNamingProjection,
  root: Record<string, unknown>,
  records: readonly SearchNameRecord[],
  evidence: readonly SearchEvidence[]
): NamingPresentation {
  const eras = legacy.eras.map(({ era }) => ({ era }));
  if (
    type === "country" &&
    legacy.forms.length > 0 &&
    !eras.some(({ era }) => era === "formerNames")
  ) {
    eras.unshift({ era: "formerNames" });
  }

  return {
    forms: enrichPresentationForms(
      basePresentationForms(type, legacy),
      records
    ),
    eras,
    disagreements: disagreementsOf(root, evidence),
    ...(legacy.origin ? { origin: "recorded" as const } : {}),
    ...(legacy.problem ? { problematic: "recorded" as const } : {}),
    ...(legacy.usageToday ? { currentUsage: "recorded" as const } : {}),
    evidence: [...evidence],
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
  root: unknown = {},
  nameRecords: readonly SearchNameRecord[] = [],
  evidence: readonly SearchEvidence[] = []
): NamingProjection {
  const contentRecord = record(content);
  const rootRecord = record(root);

  let legacy: LegacyNamingProjection;
  switch (type) {
    case "people":
      legacy = fromAppellations(contentRecord);
      break;
    case "languageFamily":
      legacy = fromDecolonialHeader(contentRecord);
      break;
    case "country":
      legacy = fromCountry(contentRecord, rootRecord);
      break;
    case "patronyme":
      legacy = fromSpellings(rootRecord);
      break;
    // The loader stores a language's names inside `content` and the search
    // RPC returns `content` whole, so that is where they are on a search row;
    // a fiche carries them at its root. Reading the root alone matched the
    // fiche and missed the API, and every language reached the result page
    // with no names — measured 2026-09-19, after 206 had been written in.
    // `spellingAliases` is a column of its own the RPC does not return, so it
    // only arrives from a fiche-shaped root.
    case "language":
      legacy = {
        ...EMPTY,
        forms: bareForms([
          ...strings(contentRecord.alternateNames ?? rootRecord.alternateNames),
          ...strings(
            contentRecord.spellingAliases ?? rootRecord.spellingAliases
          ),
        ]),
        problem: text(
          contentRecord.whyProblematic ?? rootRecord.whyProblematic
        ),
      };
      break;
    default:
      legacy = EMPTY;
  }

  return {
    ...legacy,
    presentation: buildPresentation(
      type,
      legacy,
      rootRecord,
      nameRecords,
      evidence
    ),
  };
}
