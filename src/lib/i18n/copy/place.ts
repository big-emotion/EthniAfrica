import type { Language } from "@/types/shared";

/**
 * The place page's words (REQ-196). `placeType` values are the model's
 * (`public/modele-lieu.json`); an unknown one reads as « Lieu ».
 */
const fr = {
  typeLabels: {
    ville: "Ville",
    region: "Région",
    "site-historique": "Site historique",
    autre: "Lieu",
  } as Record<string, string>,
  fallbackType: "Lieu",
  /** A region that spans several countries: « 10 pays ». */
  countryCount: (count: number) => `${count} pays`,
  sections: {
    summary: "En bref",
    related: "Pays et peuples liés",
    gaps: "Ce que nous ne savons pas encore",
    sources: "Sources",
    hypothesesLead:
      "Deux explications existent du passage du nom N'Gokro au nom Yamoussoukro, sans que l'une l'emporte.",
    familyAccount: "Récit de famille",
    familyAccountPeriod: "Début du XXe siècle",
  },
  countryLabel: "Pays",
  peoplesLabel: "Peuples liés",
  storyLinkLabel: (name: string) => `Lire l’histoire du nom ${name}`,
  storyLinkHint:
    "La page du nom présente ce que disent les sources : qui l’a donné, à qui, quand et pourquoi, du plus récent au plus ancien.",
};

export type PlaceCopy = typeof fr;

// @req REQ-196
export const placeCopy: Record<Language, PlaceCopy> = { fr };

/**
 * « Ville · Côte d'Ivoire »: what the place is, then where. A region over
 * several countries reads « Région · 10 pays »; the list is on the page.
 */
// @req REQ-193
export function placeSubtitle(
  language: Language,
  placeType: string,
  countries: { name: string | null }[]
): string {
  const copy = placeCopy[language];
  const type = copy.typeLabels[placeType] ?? copy.fallbackType;
  if (countries.length > 1)
    return `${type} · ${copy.countryCount(countries.length)}`;
  const name = countries[0]?.name;
  return name ? `${type} · ${name}` : type;
}
