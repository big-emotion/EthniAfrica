import { getCountryById } from "@/api/v2/services/countryService";
import type { PatronymeLinkSummary } from "@/api/v2/services/patronymeFicheLinks";
import { getPatronymeById } from "@/api/v2/services/patronymes";
import { ficheNextSteps } from "@/lib/fiche/ficheNameClosing";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import type { NextStepCard } from "@/lib/search/nameClosing";
import type { Language } from "@/types/shared";

/**
 * « Poursuivre avec un autre nom » on a people fiche (brief 2): the language
 * family, then the first name the people bears, otherwise the first country,
 * each kept only when its own fiche has a summary to give the reason.
 */
// @req REQ-198
export async function loadPeopleNextSteps({
  family,
  borneNames,
  countryCodes,
  language,
}: {
  family: { name: string; summary?: string | null } | null;
  borneNames: readonly PatronymeLinkSummary[];
  countryCodes: readonly string[];
  language: Language;
}): Promise<NextStepCard[]> {
  const relation = nameClosingCopy[language].fiche.nextRelation;
  const [patronymes, countries] = await Promise.all([
    Promise.all(
      borneNames.slice(0, 3).map(async (borne) => ({
        kind: relation.patronyme,
        name: borne.nameMain,
        summary: await getPatronymeById(borne.id)
          .then((fiche) => fiche?.nameHistory?.summary ?? null)
          .catch(() => null),
      }))
    ),
    Promise.all(
      countryCodes.slice(0, 2).map(async (code) => {
        const country = await getCountryById(code).catch(() => null);
        return {
          kind: relation.country,
          name: country?.nameFr ?? code,
          summary: country?.nameHistory?.summary ?? null,
        };
      })
    ),
  ]);
  return ficheNextSteps([
    ...(family
      ? [{ kind: relation.family, name: family.name, summary: family.summary }]
      : []),
    ...patronymes,
    ...countries,
  ]);
}
