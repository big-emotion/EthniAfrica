import type { Language } from "@/types/shared";

const fr = {
  countries: {
    lede: (total: string, selected: string, filtered: boolean) =>
      `${total} pays documentés${filtered ? ` · ${selected} dans cette sélection` : ""}. Choisissez-en un sur le globe ou dans la liste pour ouvrir sa page.`,
    documentedPeoples: "peuples documentés",
    submit: "Appliquer",
    searchLabel: "Rechercher un pays",
    searchPlaceholder: "Nom ou identifiant du pays",
    family: "Famille linguistique",
    allFamilies: "Toutes les familles",
    sort: "Tri",
    alphabetical: "Nom (A → Z)",
    documentedPeoplesDescending: "Peuples documentés (décroissant)",
    documentedPeoplesSort: "Tri : peuples documentés",
    empty: "Aucun pays documenté ne répond à cette sélection.",
    listLabel: "Pays",
  },
  peoples: {
    singular: "peuple",
    plural: "peuples",
    lede: (total: string, singular: boolean) =>
      `${total} ${singular ? "peuple" : "peuples"} dans cette sélection. Choisissez un pays sur le globe pour voir ceux qu'il documente.`,
    familyFilter: "Famille",
    letterFilter: "Lettre",
    searchLabel: "Rechercher un peuple",
    searchPlaceholder: "Nom du peuple",
    country: "Pays",
    allCountries: "Tous les pays",
    family: "Famille linguistique",
    allFamilies: "Toutes les familles",
    empty: "Aucun peuple documenté ne répond à cette sélection.",
    reset: "Revenir à tous les peuples",
    listLabel: "Peuples",
    unavailable:
      "Les peuples documentés sont momentanément indisponibles. Réessayez dans un instant.",
  },
  families: {
    plural: "familles",
    lede: (total: string, countryName: string) =>
      `${total} familles ${countryName ? `documentées en ${countryName}` : "documentées"}. Choisissez un pays sur le globe pour voir lesquelles s'y parlent.`,
    searchLabel: "Rechercher une famille linguistique",
    searchPlaceholder: "Nom ou identifiant de la famille",
    country: "Pays",
    allCountries: "Tous les pays",
    empty: "Aucune famille linguistique ne répond à cette sélection.",
    // French writes the plural whatever the count; the flag is the caller's.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    peopleCount: (total: string, singular: boolean) =>
      `${total} peuples documentés`,
    unclassified: (total: string) =>
      `${total} peuples non classés dans une famille linguistique publiée.`,
    listLabel: "Familles linguistiques",
  },
  languages: {
    familyFilter: "Famille",
    letterFilter: "Lettre",
    lede: (total: string, singular: boolean) =>
      `${total} ${singular ? "langue" : "langues"} dans cette sélection. Choisissez un pays sur le globe pour voir celles qu'on y parle.`,
    searchLabel: "Rechercher une langue",
    searchPlaceholder: "Nom de la langue, code ISO 639-3",
    country: "Pays",
    allCountries: "Tous les pays",
    family: "Famille linguistique",
    allFamilies: "Toutes les familles",
    empty: "Aucune langue documentée ne répond à cette sélection.",
    reset: "Revenir à toutes les langues",
    listLabel: "Langues",
  },
  names: {
    singular: "nom",
    plural: "noms",
    countryFilter: "Pays",
    systemFilter: "Système",
    letterFilter: "Lettre",
    lede: (total: string, singular: boolean) =>
      `${total} ${singular ? "nom" : "noms"} dans cette sélection. Choisissez un pays sur le globe pour voir ceux qu'il atteste.`,
    searchLabel: "Rechercher un nom",
    searchPlaceholder: "Nom, graphie attestée",
    people: "Peuple",
    allPeoples: "Tous les peuples",
    country: "Pays",
    allCountries: "Tous les pays",
    system: "Système de nommage",
    allSystems: "Tous les systèmes",
    empty: "Aucun nom documenté ne répond à cette sélection.",
    reset: "Revenir à tous les noms",
    listLabel: "Noms",
  },
};

type FacetDirectoriesCopy = typeof fr;

// @req REQ-141
export const facetDirectoriesCopy: Record<Language, FacetDirectoriesCopy> = {
  fr,
};
