/**
 * The contract of the answer page: six blocks per subject, whatever class the
 * subject belongs to. Plan: `docs/design/search-answer-plan.md`; reference
 * rendering: `docs/design/mockups/search-answer/` (v11).
 *
 * A block with no data is an absent key, never an empty one — the page draws a
 * block only when its key exists, so a thin fiche shows a short answer instead
 * of a list of apologies.
 */
import type { SearchEvidence } from "@/lib/search/evidence";
import {
  PATRONYME_ORIGIN_COLLECTIONS,
  readNaming,
  type NamingClaimStatus,
  type SearchNameRecord,
} from "@/lib/search/naming";
import { violatesReaderRegister } from "@/lib/editorial/readerRegister";

/**
 * Limits of the two sentences a fiche may write for the page. They live here
 * rather than in the validator because the reader of the field (`readAnswer`)
 * and the gate that guards it must never disagree on what a valid sentence is.
 */
// @req REQ-178
export const SEARCH_ANSWER_LEAD_MAX_LENGTH = 220;
// @req REQ-178
export const SEARCH_ANSWER_FOLLOW_UP_MAX_LENGTH = 120;

export type AnswerKind =
  "people" | "country" | "language" | "languageFamily" | "patronyme" | "word";

/**
 * One account of where the name comes from. Provenance is carried per account
 * and not as a count: a debated origin shows its readings side by side, and
 * the sources sheet is grouped by the account each source supports.
 */
export interface AnswerAccount {
  text: string;
  attribution?: "oral" | "written" | "linguistic" | "synthesis";
  claimStatus?: NamingClaimStatus;
  evidence: SearchEvidence[];
}

export interface AnswerName {
  form: string;
  /** Null means the fiche does not classify the form on this axis. */
  selfGiven: boolean | null;
  shortLine?: string;
  period?: string;
  attestedIn?: string[];
}

/**
 * `percent` rows are keyed by people (a country's share of its inhabitants);
 * every other unit is keyed by country. `speakers` is a declared estimate of
 * a language's or family's speakers, never a sum of peoples' populations: the
 * people-language relation is many-to-many. `presence` is for patronymes,
 * which have no figures, so `value` is null.
 */
export type AnswerWhereRow =
  | { countryId: string; value: number | null }
  | { peopleId: string; value: number };

export interface AnswerWhere {
  unit: "population" | "speakers" | "percent" | "presence";
  estimate: boolean;
  rows: AnswerWhereRow[];
  /** Share of a country's population not yet split by people. */
  unsplitPercent?: number;
  documentedPeopleCount?: number;
}

export type AnswerNext =
  /** Written by the fiche, `content.searchAnswer.followUp`. */
  | { question: string }
  /** Fallback: the copy module writes the sentence from these parameters. */
  | {
      template: "migration" | "formerName" | "distributionGap";
      params: Record<string, string | number>;
    };

export interface SearchAnswer {
  kind: AnswerKind;
  title: string;
  what: {
    /** Written by the fiche; absent means the copy's sentence template. */
    lead?: string;
    facts: {
      population?: number;
      countryCount?: number;
      familyId?: string;
      peopleCount?: number;
    };
  };
  origin?: { accounts: AnswerAccount[]; debated: boolean };
  names: AnswerName[];
  where?: AnswerWhere;
  next?: AnswerNext;
  /** Distinct sources across every account's evidence. */
  sources: { count: number };
  publications?: Array<{
    network: string;
    url: string;
    /** The production's format (carrousel, video): the card says what it links to. */
    format?: string;
    /** ISO date of the occurrence on that network. */
    publishedAt?: string;
  }>;
  path?: Array<{ form: string; language: string; period?: string }>;
}

/** Carried by the envelope, not by a row: « pharaon » may match no fiche. */
export interface WordAnswer extends SearchAnswer {
  kind: "word";
  queries: string[];
}

/** Words a fiche's own prose may use, and the result page may not (charter §3). */
const SCHOLARLY_WORDS_PATTERN =
  /\b(?:ex[oô]nym|end[oô]nym|auto[nm]ym|[ée]tymolog|corpus)\w*/i;

export type SearchAnswerSentenceProblem =
  "too-long" | "not-a-question" | "register" | "scholarly-word";

/**
 * What is wrong with a sentence a fiche or a production wrote for the page.
 * One function for both writers, so the corpus gate and the ledger gate cannot
 * disagree about what a valid lead or follow-up is.
 * @req REQ-178
 */
export function searchAnswerSentenceProblems(
  field: "lead" | "followUp",
  text: string
): SearchAnswerSentenceProblem[] {
  const problems: SearchAnswerSentenceProblem[] = [];
  const maxLength =
    field === "lead"
      ? SEARCH_ANSWER_LEAD_MAX_LENGTH
      : SEARCH_ANSWER_FOLLOW_UP_MAX_LENGTH;
  if ([...text].length > maxLength) problems.push("too-long");
  if (field === "followUp" && !text.trim().endsWith("?")) {
    problems.push("not-a-question");
  }
  if (violatesReaderRegister(text)) problems.push("register");
  if (SCHOLARLY_WORDS_PATTERN.test(text)) problems.push("scholarly-word");
  return problems;
}

/** What `readAnswer` cannot find in the fiche: rows the service loads. */
export interface AnswerExtras {
  nameRecords?: readonly SearchNameRecord[];
  evidence?: readonly SearchEvidence[];
  /** Peoples the corpus documents in a country (`afrik_people_countries`). */
  documentedPeopleCount?: number;
  /** Peoples of a family. Never offered for a language: the relation is many-to-many. */
  peopleCount?: number;
}

type Fiche = Record<string, unknown>;

function fiche(value: unknown): Fiche {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Fiche)
    : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sentence(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * Languages and patronymes keep their fields at the root of the fiche, the
 * other classes inside `content`; a search row may carry either.
 */
function fieldOf(content: Fiche, root: Fiche, key: string): unknown {
  return content[key] ?? root[key];
}

/** A sentence the validator would refuse must not reach a reader either. */
function writtenSentence(
  field: "lead" | "followUp",
  value: unknown
): string | undefined {
  const text = sentence(value);
  return text && searchAnswerSentenceProblems(field, text).length === 0
    ? text
    : undefined;
}

const ATTRIBUTION_OF_COLLECTION: Record<
  (typeof PATRONYME_ORIGIN_COLLECTIONS)[number],
  NonNullable<AnswerAccount["attribution"]>
> = {
  oralTraditions: "oral",
  writtenChronicles: "written",
  historicalSyntheses: "synthesis",
  linguisticReconstructions: "linguistic",
};

const ORIGIN_FIELD_PATHS: Record<string, string[]> = {
  people: ["appellations.originOfExonyms"],
  country: ["etymology", "nameOriginActor"],
  language: ["whyProblematic"],
  languageFamily: ["decolonialHeader.originOfHistoricalTerm"],
  word: ["nameHistory.summary"],
};

function evidenceAt(
  evidence: readonly SearchEvidence[],
  fieldPaths: string[],
  statement: string
): SearchEvidence[] {
  return evidence.filter(({ assertion }) => {
    if (!assertion.fieldPath) return assertion.statement === statement;
    const path = assertion.fieldPath.replace(/^content\./, "");
    return fieldPaths.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}.`)
    );
  });
}

function claimStatusOf(value: unknown): NamingClaimStatus | undefined {
  return value === "established" || value === "claimed" || value === "contested"
    ? value
    : undefined;
}

function readAccounts(
  type: string,
  originProse: string | undefined,
  root: Fiche,
  evidence: readonly SearchEvidence[]
): AnswerAccount[] {
  if (type === "patronyme") {
    const origin = fiche(root.origin);
    return PATRONYME_ORIGIN_COLLECTIONS.flatMap((collection) =>
      list(origin[collection]).flatMap((entry, index): AnswerAccount[] => {
        const claim = fiche(entry);
        const text = sentence(claim.claim);
        if (!text || violatesReaderRegister(text)) return [];
        const status = claimStatusOf(claim.claimStatus);
        return [
          {
            text,
            attribution: ATTRIBUTION_OF_COLLECTION[collection],
            ...(status ? { claimStatus: status } : {}),
            evidence: evidenceAt(
              evidence,
              [`origin.${collection}.${index}`],
              text
            ),
          },
        ];
      })
    );
  }

  if (!originProse || violatesReaderRegister(originProse)) return [];
  return [
    {
      text: originProse,
      evidence: evidenceAt(
        evidence,
        ORIGIN_FIELD_PATHS[type] ?? [],
        originProse
      ),
    },
  ];
}

/** Competing origins are the accounts a nameHistory groups as hypotheses. */
function historyHoldsHypotheses(root: Fiche): boolean {
  return list(fiche(root.nameHistory).names).some((name) =>
    list(fiche(name).accounts).some(
      (account) => sentence(fiche(account).hypothesisGroup) !== undefined
    )
  );
}

function isDebated(
  type: string,
  accounts: AnswerAccount[],
  content: Fiche,
  root: Fiche
): boolean {
  if (type === "word" && historyHoldsHypotheses(root)) return true;
  const status = String(
    fieldOf(content, root, "classificationStatus") ??
      fieldOf(content, root, "classification_status") ??
      ""
  );
  return (
    accounts.some(({ claimStatus }) => claimStatus === "contested") ||
    fieldOf(content, root, "originDebated") === true ||
    status === "contested"
  );
}

function readWhere(
  type: string,
  content: Fiche,
  root: Fiche,
  extras: AnswerExtras
): AnswerWhere | undefined {
  switch (type) {
    case "people": {
      const rows = list(
        fiche(content.demography).distributionByCountry
      ).flatMap((entry): AnswerWhereRow[] => {
        const row = fiche(entry);
        const population = finiteNumber(row.population);
        return typeof row.country === "string" && population !== undefined
          ? [{ countryId: row.country, value: population }]
          : [];
      });
      return rows.length
        ? { unit: "population", estimate: true, rows }
        : undefined;
    }
    case "country": {
      const rows = list(fiche(content.demographics).peoples).flatMap(
        (entry): AnswerWhereRow[] => {
          const row = fiche(entry);
          const share = finiteNumber(row.percentageInCountry);
          return typeof row.peopleId === "string" && share !== undefined
            ? [{ peopleId: row.peopleId, value: share }]
            : [];
        }
      );
      if (!rows.length) return undefined;
      const named = rows.reduce((sum, row) => sum + (row.value ?? 0), 0);
      const unsplitPercent = Math.round((100 - named) * 100) / 100;
      return {
        unit: "percent",
        estimate: true,
        rows,
        ...(unsplitPercent > 0 ? { unsplitPercent } : {}),
        ...(extras.documentedPeopleCount
          ? { documentedPeopleCount: extras.documentedPeopleCount }
          : {}),
      };
    }
    case "language":
    case "languageFamily": {
      // Declared by the fiche, never derived: a sum of peoples' populations
      // would count a speaker once for every people that claims the language.
      const rows = list(
        fiche(fieldOf(content, root, "speakers")).byCountry
      ).flatMap((entry): AnswerWhereRow[] => {
        const row = fiche(entry);
        const speakers = finiteNumber(row.speakers);
        return typeof row.country === "string" && speakers !== undefined
          ? [{ countryId: row.country, value: speakers }]
          : [];
      });
      return rows.length
        ? { unit: "speakers", estimate: true, rows }
        : undefined;
    }
    case "patronyme": {
      const rows = list(root.countries).flatMap((entry): AnswerWhereRow[] => {
        const countryId = fiche(entry).countryId;
        return typeof countryId === "string"
          ? [{ countryId, value: null }]
          : [];
      });
      return rows.length
        ? { unit: "presence", estimate: false, rows }
        : undefined;
    }
    default:
      return undefined;
  }
}

function readNext(
  type: string,
  content: Fiche,
  root: Fiche,
  where: AnswerWhere | undefined,
  formerName: string | undefined
): AnswerNext | undefined {
  const question = writtenSentence(
    "followUp",
    fiche(fieldOf(content, root, "searchAnswer")).followUp
  );
  if (question) return { question };

  if (type === "people") {
    const routeCount = list(fiche(content.origins).migrationRoutes).length;
    return routeCount
      ? { template: "migration", params: { routeCount } }
      : undefined;
  }
  if (type === "country") {
    if (formerName) return { template: "formerName", params: { formerName } };
    if (where?.unsplitPercent) {
      return {
        template: "distributionGap",
        params: { unsplitPercent: where.unsplitPercent },
      };
    }
  }
  return undefined;
}

function titleOf(root: Fiche): string {
  return (
    sentence(root.nameMain) ??
    sentence(root.nameFr) ??
    sentence(root.name) ??
    sentence(root.id) ??
    ""
  );
}

/**
 * Builds the six-block answer for one search row. An optional block whose
 * source the fiche leaves empty is an absent key, and the page draws a block
 * only when its key exists. Nothing here writes a sentence: text comes from
 * the fiche, or is left to the copy module's templates.
 * @req REQ-178
 */
export function readAnswer(
  type: AnswerKind,
  content: unknown,
  root: unknown = {},
  extras: AnswerExtras = {}
): SearchAnswer {
  const contentRecord = fiche(content);
  const rootRecord = fiche(root);
  const naming = readNaming(
    type,
    content,
    root,
    extras.nameRecords ?? [],
    extras.evidence ?? []
  );

  const accounts = readAccounts(
    type,
    // A language's fiche has no origin field: the explanation of its name is
    // `whyProblematic`, which `readNaming` surfaces as `problem`.
    type === "language" ? naming.problem : naming.origin,
    rootRecord,
    extras.evidence ?? []
  );
  const where = readWhere(type, contentRecord, rootRecord, extras);
  const next = readNext(
    type,
    contentRecord,
    rootRecord,
    where,
    type === "country" ? naming.forms[0]?.form : undefined
  );
  // A word fiche's definition is the one sentence it writes about what the
  // word means today: its lead.
  const lead = writtenSentence(
    "lead",
    fiche(fieldOf(contentRecord, rootRecord, "searchAnswer")).lead ??
      (type === "word" ? rootRecord.definition : undefined)
  );

  const population = finiteNumber(
    fiche(contentRecord.demography).totalPopulation
  );
  const familyId = sentence(rootRecord.languageFamilyId);
  const countryCount = where?.rows.filter((row) => "countryId" in row).length;
  const peopleCount =
    type === "country"
      ? extras.documentedPeopleCount
      : type === "languageFamily"
        ? extras.peopleCount
        : undefined;

  const sourceIds = new Set(
    accounts.flatMap(({ evidence }) =>
      evidence.flatMap(({ sources }) => sources.map(({ id }) => id))
    )
  );

  return {
    kind: type,
    title: titleOf(rootRecord),
    what: {
      ...(lead ? { lead } : {}),
      facts: {
        ...(type === "people" && population ? { population } : {}),
        ...(countryCount ? { countryCount } : {}),
        ...(type === "people" && familyId ? { familyId } : {}),
        ...(peopleCount ? { peopleCount } : {}),
      },
    },
    ...(accounts.length
      ? {
          origin: {
            accounts,
            debated: isDebated(type, accounts, contentRecord, rootRecord),
          },
        }
      : {}),
    names: naming.presentation.forms.map((form) => ({
      form: form.form,
      selfGiven: form.selfGiven,
      ...(form.shortLine ? { shortLine: form.shortLine } : {}),
      ...(form.attestationPeriod ? { period: form.attestationPeriod } : {}),
      ...(form.attestations.length ? { attestedIn: form.attestations } : {}),
    })),
    ...(where ? { where } : {}),
    ...(next ? { next } : {}),
    sources: { count: sourceIds.size },
  };
}
