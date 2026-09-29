import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { SearchResult } from "@/types/afrik-frontend";

export interface NameAnswerEntry {
  answer: NameAnswer;
  /** The matched subjects this answer is about, in the order they were found. */
  subjects: SearchResult[];
}

export interface NameOpening {
  /**
   * The page subject when several subjects answer the name. Undefined for a
   * single subject, whose own name the page already uses.
   */
  title?: string;
  entries: NameAnswerEntry[];
  /** Matched subjects no reviewed answer covers; they still owe the reader their fiche. */
  unanswered: SearchResult[];
}

interface ResolveNameOpeningInput {
  query: string;
  subjects: readonly SearchResult[];
  nameAnswers: readonly NameAnswer[];
}

/**
 * What the opening of a result page is about, independent of result order.
 *
 * The title used to be `subjects[0]`, so a rerank turned « Pygmée » into
 * « Aka ». A shared term keeps the term — the reviewed spelling when an answer
 * exists, the query as typed otherwise — because shared spelling is not proof
 * that the subjects are one thing, and none of them owns the word.
 */
// @req REQ-178
export function resolveNameOpening({
  query,
  subjects,
  nameAnswers,
}: ResolveNameOpeningInput): NameOpening {
  const entries = nameAnswers.flatMap((answer): NameAnswerEntry[] => {
    const covered = subjects.filter((subject) =>
      answer.subjects.some(
        ({ type, id }) => type === subject.type && id === subject.id
      )
    );
    return covered.length > 0 ? [{ answer, subjects: covered }] : [];
  });

  const answered = new Set(
    entries.flatMap((entry) =>
      entry.subjects.map(({ type, id }) => `${type}:${id}`)
    )
  );
  const unanswered = subjects.filter(
    ({ type, id }) => !answered.has(`${type}:${id}`)
  );

  const distinct = new Set(subjects.map(({ type, id }) => `${type}:${id}`));
  if (distinct.size < 2) return { entries, unanswered };

  return {
    title: entries[0]?.answer.term ?? query.trim(),
    entries,
    unanswered,
  };
}
