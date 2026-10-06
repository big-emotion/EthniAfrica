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
import type { NamingClaimStatus } from "@/lib/search/naming";
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
  publications?: Array<{ network: string; url: string }>;
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
