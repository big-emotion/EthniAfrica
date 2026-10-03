import { normalizeString } from "@/lib/normalize";
import { normaliseSearchQuery } from "@/lib/search/queryNormalisation";
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

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row++) {
    const current = [row];
    for (let column = 1; column <= right.length; column++) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[right.length];
}

/**
 * Reviewed terms a near spelling may have meant, for a search that found
 * nothing. Deliberately narrow: one substitution, insertion or deletion (two
 * from eight letters up), and never under four letters, where every word is
 * one edit from another. The query is never rewritten — the reader is offered
 * the term and chooses it. Shared spelling of an *entity's* filed name is a
 * different question and stays with the API's own near-miss leads.
 */
// @req REQ-125
export function suggestNameTerms(
  query: string | undefined,
  language: Language = "fr"
): string[] {
  const wanted = normalizeString(
    normaliseSearchQuery(query ?? "").candidates[0]
  );
  if (wanted.length < 4) return [];
  const allowed = wanted.length >= 8 ? 2 : 1;
  const suggested = new Set<string>();
  for (const answer of REVIEWED) {
    const terms = termsOf(answer);
    if (terms.includes(wanted)) return [];
    if (terms.some((term) => editDistance(wanted, term) <= allowed)) {
      suggested.add(answer.term[language] ?? answer.term.fr);
    }
  }
  return [...suggested];
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
  const wanted = normaliseSearchQuery(query ?? "").candidates.map(
    normalizeString
  );
  if (wanted.length === 0) return [];
  return REVIEWED.filter((answer) =>
    termsOf(answer).some((term) => wanted.includes(term))
  ).map((answer): NameAnswer => {
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
  });
}
