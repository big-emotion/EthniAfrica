import { getCountryById } from "@/api/v2/services/countryService";
import type { PatronymeLinkSummary } from "@/api/v2/services/patronymeFicheLinks";
import { getPatronymeById } from "@/api/v2/services/patronymes";
import { ficheNextSteps, toldNames } from "@/lib/fiche/ficheNameClosing";
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
  const [patronymes, countries] = await Promise.all([
    Promise.all(
      borneNames.slice(0, 3).map(async (borne) => {
        const fiche = await getPatronymeById(borne.id).catch(() => null);
        return {
          relation: "patronyme" as const,
          name: borne.nameMain,
          summary: fiche?.nameHistory?.summary ?? null,
          names: toldNames(fiche),
        };
      })
    ),
    Promise.all(
      countryCodes.slice(0, 2).map(async (code) => {
        const country = await getCountryById(code).catch(() => null);
        return {
          relation: "country" as const,
          name: country?.nameFr ?? code,
          summary: country?.nameHistory?.summary ?? null,
          names: toldNames(country),
        };
      })
    ),
  ]);
  return ficheNextSteps(
    [
      ...(family
        ? [
            {
              relation: "family" as const,
              name: family.name,
              summary: family.summary,
            },
          ]
        : []),
      ...patronymes,
      ...countries,
    ],
    2,
    language
  );
}
