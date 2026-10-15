import { ficheNextSteps } from "@/lib/fiche/ficheNameClosing";
import { loadLanguageFiche, loadPeopleFiche } from "@/lib/fiche/ficheExistence";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import type { NextStepCard } from "@/lib/search/nameClosing";
import type { Language } from "@/types/shared";

/** How many candidates of each kind are read before giving up on a summary. */
const CANDIDATES = 3;

export interface FamilyLanguageCandidate {
  id: string;
  name: string;
  content?: Record<string, unknown>;
}

/** The speakers a language fiche declares, summed over its countries. */
function declaredSpeakers(language: FamilyLanguageCandidate): number {
  const speakers = language.content?.speakers as
    { byCountry?: Array<{ speakers?: unknown }> } | undefined;
  return (speakers?.byCountry ?? []).reduce(
    (total, row) =>
      total + (typeof row.speakers === "number" ? row.speakers : 0),
    0
  );
}

/**
 * The family's languages, the most spoken first, then from A to Z: the order
 * in which the next step looks for one with a summary (brief 4, decided in
 * review on 2026-10-15).
 */
// @req REQ-198
export function rankFamilyLanguages<T extends FamilyLanguageCandidate>(
  languages: readonly T[]
): T[] {
  return [...languages].sort(
    (a, b) =>
      declaredSpeakers(b) - declaredSpeakers(a) ||
      a.name.localeCompare(b.name, "fr")
  );
}

/**
 * « Poursuivre avec un autre nom » on a language-family fiche (brief 4,
 * boards family-*.dc.html): a language inside the family, then a people,
 * each the first of its list whose own fiche has a summary to give the
 * reason. The peoples arrive ranked by reach, as the fiche lists them.
 */
// @req REQ-198
export async function loadFamilyNextSteps({
  languages,
  peoples,
  language,
}: {
  languages: readonly FamilyLanguageCandidate[];
  peoples: ReadonlyArray<{ id: string; name: string }>;
  language: Language;
}): Promise<NextStepCard[]> {
  const relation = nameClosingCopy[language].fiche.nextRelation;
  const ranked = rankFamilyLanguages(languages).slice(0, CANDIDATES);
  const people = peoples.slice(0, CANDIDATES);
  const [languageFiches, peopleFiches] = await Promise.all([
    Promise.all(
      ranked.map((entry) => loadLanguageFiche(entry.id).catch(() => null))
    ),
    Promise.all(
      people.map((entry) => loadPeopleFiche(entry.id).catch(() => null))
    ),
  ]);
  return [
    ...ficheNextSteps(
      ranked.map((entry, index) => ({
        kind: relation.language,
        name: entry.name,
        summary: languageFiches[index]?.nameHistory?.summary ?? null,
      })),
      1
    ),
    ...ficheNextSteps(
      people.map((entry, index) => ({
        kind: relation.people,
        name: entry.name,
        summary: peopleFiches[index]?.nameHistory?.summary ?? null,
      })),
      1
    ),
  ];
}
