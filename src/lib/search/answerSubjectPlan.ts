import { normalizeString } from "@/lib/normalize";
import { getLocalizedSearchResultName } from "@/lib/search/localizedResult";
import type { SearchResult } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

export type AnswerBlockPlan =
  | { kind: "countries"; subjects: SearchResult[] }
  | {
      kind: "subject";
      subject: SearchResult;
      peoplesOfFamily?: SearchResult[];
    };

/**
 * How the page speaks about the subjects that answer to one name.
 *
 * Two countries carrying a name (the two Congos) are one story told once, so
 * they share one block; stacking two full answers made the reader compare
 * them. A people filed under a family of the same name (« bantou ») is not a
 * second answer: the family answers, and the peoples are one choice away. The
 * people is the family's when its own `languageFamilyId` says so, or when it
 * is filed under exactly the family's name: PPL_BANTU's `languageFamilyId` is
 * the parent family, so the name is all the corpus offers there. A people that
 * merely resembles the name is never folded.
 * Nothing here ranks subjects: each keeps the place it was met in.
 */
// @req REQ-178
export function planAnswerSubjects(
  answered: readonly SearchResult[],
  language: Language = "fr"
): AnswerBlockPlan[] {
  const countries = answered.filter(({ type }) => type === "country");
  const families = answered.filter(({ type }) => type === "languageFamily");
  const filedName = (subject: SearchResult) =>
    normalizeString(getLocalizedSearchResultName(subject, language));
  const foldedUnder = (subject: SearchResult): string | undefined => {
    if (subject.type !== "people") return undefined;
    return families.find(
      (family) =>
        family.id === subject.languageFamilyId ||
        filedName(family) === filedName(subject)
    )?.id;
  };

  const plan: AnswerBlockPlan[] = [];
  let countriesPlaced = false;
  for (const subject of answered) {
    if (foldedUnder(subject)) continue;
    if (subject.type === "country" && countries.length > 1) {
      if (!countriesPlaced)
        plan.push({ kind: "countries", subjects: countries });
      countriesPlaced = true;
      continue;
    }
    const peoplesOfFamily =
      subject.type === "languageFamily"
        ? answered.filter((other) => foldedUnder(other) === subject.id)
        : [];
    plan.push(
      peoplesOfFamily.length > 0
        ? { kind: "subject", subject, peoplesOfFamily }
        : { kind: "subject", subject }
    );
  }
  return plan;
}
