import type { Language } from "@/types/shared";

// Languages index (ETNI-1802/REQ-139). 748 languages for 532 distinct
// names — e.g. "Fulfulde" names both fuf and fuv — so the copy itself
// flags why every row needs a family + id, not just the name.
const fr = {
  pageTitle: "Langues",
  pageSubtitle:
    "Les langues attestées d'Afrique, classées par famille linguistique. Nous recensons 748 langues pour 532 noms distincts — plusieurs langues partagent un même nom (par exemple « Fulfulde », qui désigne à la fois le fuf et le fuv), d'où la famille et l'identifiant ISO 639-3 affichés sur chaque ligne.",
  unavailable:
    "Les langues sont momentanément indisponibles. Réessayez dans un instant.",
  range: {
    none: "Aucune langue",
    of: "sur",
    languagesSingular: "langue",
    languagesPlural: "langues",
  },
  emptyState: "Aucune langue ne commence par cette lettre.",
  pagination: {
    label: "Pagination des langues",
    previous: "Précédent",
    next: "Suivant",
    page: "Page",
  },
};

type LanguagesCopy = typeof fr;

// @req REQ-145
export const languagesCopy: Record<Language, LanguagesCopy> = { fr };
