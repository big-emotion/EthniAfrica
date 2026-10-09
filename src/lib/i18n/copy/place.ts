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
  sections: {
    summary: "En bref",
    related: "Pays et peuples liés",
    gaps: "Ce que nous ne savons pas encore",
    sources: "Sources",
  },
  countryLabel: "Pays",
  peoplesLabel: "Peuples liés",
};

export type PlaceCopy = typeof fr;

// @req REQ-196
export const placeCopy: Record<Language, PlaceCopy> = { fr };

/** « Ville · Côte d'Ivoire »: what the place is, then where. */
// @req REQ-196
export function placeSubtitle(
  language: Language,
  placeType: string,
  countryName: string | null
): string {
  const copy = placeCopy[language];
  const type = copy.typeLabels[placeType] ?? copy.fallbackType;
  return countryName ? `${type} · ${countryName}` : type;
}
