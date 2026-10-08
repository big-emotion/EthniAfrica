import type { Language } from "@/types/shared";
import { getLocalizedRoute } from "@/lib/routing";

/** Stable editorial themes; reading formats and atlas entities are separate. */
// @req REQ-114
export const DOSSIER_THEMES = [
  {
    id: "pouvoirs",
    label: "Pouvoirs et territoires",
    description:
      "Royaumes, chefferies, institutions, frontières et résistances.",
  },
  {
    id: "migrations",
    label: "Migrations et diasporas",
    description: "Déplacements, installations et histoires des diasporas.",
  },
  {
    id: "spiritualites",
    label: "Spiritualités et croyances",
    description: "Divinités, esprits, rites et transformations des croyances.",
  },
  {
    id: "parentes",
    label: "Parentés et sociétés",
    description: "Clans, lignages, alliances et institutions sociales.",
  },
  {
    id: "langues",
    label: "Langues et transmission",
    description:
      "Langues, écritures, oralité et transmission entre générations.",
  },
  {
    id: "noms",
    label: "Noms et identités",
    description:
      "Appellations, noms de personnes et histoires de la nomination.",
  },
  {
    id: "arts",
    label: "Arts et savoirs",
    description: "Objets, textiles, musiques et savoir-faire transmis.",
  },
  {
    id: "economies",
    label: "Économies et échanges",
    description: "Modes de subsistance, marchés et réseaux commerciaux.",
  },
] as const;

export type DossierThemeId = (typeof DOSSIER_THEMES)[number]["id"];

// @req REQ-114
export function getDossierThemeHref(
  theme: string,
  language: Language = "fr"
): string {
  return `${getLocalizedRoute(language, "dossiersHub")}/themes/${encodeURIComponent(theme)}`;
}

// The themes are labelled in French, the one locale published; `language`
// is accepted for the callers that still pass one.
// @req REQ-140
export function getDossierThemes(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  language: Language = "fr"
) {
  return DOSSIER_THEMES;
}
