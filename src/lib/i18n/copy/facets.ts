import type { Language } from "@/types/shared";

const fr = {
  navigation: "Facettes",
  filters: "Filtres",
  filter: "Filtrer",
  removeFilter: "Retirer le filtre",
  firstLetter: "Première lettre",
  allLetters: "Tous",
  previousPage: "Page précédente",
  nextPage: "Page suivante",
  page: "Page",
  pagination: "Pagination des",
  topOfList: "en tête de liste",
  bottomOfList: "en pied de liste",
  to: "à",
  of: "sur",
  perPage: "Par page",
  resultsPerPage: "Résultats par page",
  selectionEmptyCountry: "Cette sélection ne documente rien dans ce pays.",
  alreadyNarrowed: "La liste est déjà réduite à ce pays.",
  narrowToCountry: "Réduire la liste à ce pays",
  missingCountryData: "Nous ne renseignons encore aucun peuple par pays.",
  showMap: "Afficher la carte",
  hideMap: "Masquer la carte",
  areaNoun: "nos fiches",
  definitions: {
    families: {
      label: "Familles",
      sectionName: "Familles linguistiques",
      eyebrow: "Parcourir · les familles linguistiques",
      title: "Familles linguistiques",
      filterHint:
        "La liste est faite de familles linguistiques. Les filtres la restreignent sans changer sa nature : filtrer par pays montre les familles présentes dans ce pays, pas le pays lui-même.",
    },
    languages: {
      label: "Langues",
      sectionName: "Langues",
      eyebrow: "Parcourir · les langues d'Afrique",
      title: "Les langues d'Afrique",
      filterHint:
        "La liste est faite de langues. Les filtres la restreignent sans changer sa nature : filtrer par pays montre les langues qu'on y parle, pas le pays lui-même.",
    },
    peoples: {
      label: "Peuples",
      sectionName: "Peuples",
      eyebrow: "Parcourir · les peuples d'Afrique",
      title: "Les peuples d'Afrique",
      filterHint:
        "La liste est faite de peuples. Les filtres la restreignent sans changer sa nature : filtrer par pays montre les peuples que ce pays documente, pas le pays lui-même.",
    },
    countries: {
      label: "Pays",
      sectionName: "Pays",
      eyebrow: "Parcourir · les pays d'Afrique",
      title: "Les pays d'Afrique",
      filterHint:
        "La liste est faite de pays. Les filtres la restreignent sans changer sa nature : filtrer par famille linguistique montre les pays où cette famille est présente, pas la famille elle-même.",
    },
    patronymes: {
      label: "Noms",
      sectionName: "Noms",
      eyebrow: "Parcourir · les noms d'Afrique",
      title: "Les noms d'Afrique",
      filterHint:
        "La liste est faite de noms. Les filtres la restreignent sans changer sa nature : filtrer par peuple montre les noms que ce peuple porte, pas le peuple lui-même.",
    },
  },
};

type FacetsCopy = typeof fr;

// @req REQ-145
export const facetsCopy: Record<Language, FacetsCopy> = { fr };
