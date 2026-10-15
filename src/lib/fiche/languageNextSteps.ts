import { getLanguageFamilyById } from "@/api/v2/services/languageFamilyService";
import { ficheNextSteps } from "@/lib/fiche/ficheNameClosing";
import { loadPeopleFiche } from "@/lib/fiche/ficheExistence";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import type { NextStepCard } from "@/lib/search/nameClosing";
import type { Language } from "@/types/shared";

/**
 * « Poursuivre avec un autre nom » on a language fiche (brief 3): the
 * language family, then the first people that speaks it, each kept only
 * when its own fiche has a summary to give the reason.
 */
// @req REQ-198
export async function loadLanguageNextSteps({
  family,
  speakingPeoples,
  language,
}: {
  family: { id: string; name: string };
  speakingPeoples: ReadonlyArray<{ id: string; name: string }>;
  language: Language;
}): Promise<NextStepCard[]> {
  const relation = nameClosingCopy[language].fiche.nextRelation;
  const [familyFiche, ...peoples] = await Promise.all([
    getLanguageFamilyById(family.id).catch(() => null),
    ...speakingPeoples
      .slice(0, 3)
      .map((people) => loadPeopleFiche(people.id).catch(() => null)),
  ]);
  return ficheNextSteps([
    {
      kind: relation.family,
      name: family.name,
      summary: familyFiche?.nameHistory?.summary ?? null,
    },
    ...speakingPeoples.slice(0, 3).map((people, index) => ({
      kind: relation.people,
      name: people.name,
      summary: peoples[index]?.nameHistory?.summary ?? null,
    })),
  ]);
}
