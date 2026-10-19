import { ficheNextSteps, toldNames } from "@/lib/fiche/ficheNameClosing";
import { loadCountryFiche, loadPeopleFiche } from "@/lib/fiche/ficheExistence";
import type { NextStepCard } from "@/lib/search/nameClosing";
import type { Language } from "@/types/shared";

/** The next names linked from a place fiche, in the order shown on its board. */
// @req REQ-196
export async function loadPlaceNextSteps({
  countries,
  associatedPeoples,
  language,
}: {
  countries: ReadonlyArray<{ id: string; name: string }>;
  associatedPeoples: ReadonlyArray<{ id: string; name: string }>;
  language: Language;
}): Promise<NextStepCard[]> {
  const [country, people] = await Promise.all([
    countries[0]
      ? loadCountryFiche(countries[0].id).catch(() => null)
      : Promise.resolve(null),
    associatedPeoples[0]
      ? loadPeopleFiche(associatedPeoples[0].id).catch(() => null)
      : Promise.resolve(null),
  ]);

  return ficheNextSteps(
    [
      ...(countries[0]
        ? [
            {
              relation: "country" as const,
              name: country?.nameMain ?? countries[0].name,
              summary: country?.nameHistory?.summary ?? null,
              names: toldNames(country),
            },
          ]
        : []),
      ...(associatedPeoples[0]
        ? [
            {
              relation: "people" as const,
              name: people?.nameMain ?? associatedPeoples[0].name,
              summary: people?.nameHistory?.summary ?? null,
              names: toldNames(people),
            },
          ]
        : []),
    ],
    2,
    language
  );
}
