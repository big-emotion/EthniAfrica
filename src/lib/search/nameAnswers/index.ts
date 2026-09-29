import { normalizeString } from "@/lib/normalize";
import {
  strongestSearchSourceStanding,
  type SearchEvidence,
} from "@/lib/search/evidence";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import {
  reviewedNameAnswerSchema,
  type ReviewedNameAnswer,
} from "@/lib/search/nameAnswers/schema";
import type { Language } from "@/types/shared";

import bambaraLanguage from "./data/bambara-language.json";
import bambaraPeople from "./data/bambara-people.json";
import lingala from "./data/lingala.json";
import mali from "./data/mali.json";
import pygmee from "./data/pygmee.json";

// Parsed once at module load: a malformed reviewed answer must fail the build
// and the test suite, never reach a reader half-shaped.
const REVIEWED: readonly ReviewedNameAnswer[] = [
  lingala,
  bambaraPeople,
  bambaraLanguage,
  mali,
  pygmee,
].map((raw) => reviewedNameAnswerSchema.parse(raw));

function termsOf(answer: ReviewedNameAnswer): string[] {
  return [answer.term.fr, answer.term.en, ...answer.aliases]
    .filter((term): term is string => Boolean(term))
    .map((term) => normalizeString(term));
}

function evidenceOf(
  answer: ReviewedNameAnswer,
  language: Language
): SearchEvidence[] {
  return answer.evidence.map((entry, entryIndex) => {
    const sources = entry.sources.map((source, sourceIndex) => ({
      id: `${answer.term.fr}:${entryIndex}:${sourceIndex}`,
      ...source,
    }));
    return {
      assertion: {
        statement: entry.statement[language] ?? entry.statement.fr,
        sourceCount: sources.length,
        lastHumanAuditAt: null,
      },
      sources,
      standing: strongestSearchSourceStanding(sources),
    };
  });
}

/**
 * The reviewed answers for a searched term, matched on the whole term with
 * accents and case ignored. An answer is never inferred from a partial match:
 * a name that merely contains « mali » has not been reviewed.
 */
// @req REQ-178
export function findNameAnswers(
  query: string | undefined,
  language: Language = "fr"
): NameAnswer[] {
  const wanted = normalizeString(query?.trim());
  if (!wanted) return [];
  return REVIEWED.filter((answer) => termsOf(answer).includes(wanted)).map(
    (answer): NameAnswer => {
      const uncertainty = answer.uncertainty;
      return {
        term: answer.term[language] ?? answer.term.fr,
        subjects: answer.subjects,
        paragraphs: answer.paragraphs[language] ?? answer.paragraphs.fr,
        ...(uncertainty
          ? { uncertainty: uncertainty[language] ?? uncertainty.fr }
          : {}),
        sources: evidenceOf(answer, language),
      };
    }
  );
}
