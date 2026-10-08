import { ATTRIBUTION_STRING, PRODUCT_NAME } from "@/lib/brand";
import type { Language } from "@/types/shared";

/**
 * The flat, site-wide strings that no single surface owns.
 *
 * The type is read off the object (`typeof fr`). No `as const`, so the
 * strings widen to `string` rather than freezing each value into its type.
 */
const fr = {
  title: PRODUCT_NAME,
  // Drawn into the social-card images (siteShareCard.tsx), so it is read far
  // more often than it is seen on the site. Held by siteDescription.test.ts to
  // the four kinds of name a reader arrives with, and the sources. It sits
  // *under* the question on the card, where it answers "what can I look up" for
  // a reader the question has already stopped.
  subtitle:
    "Noms de famille, peuples, langues et lieux — l’histoire de chaque nom, avec ses sources.",
  byCountry: "Par Pays",
  byPeople: "Par Peuple",
  byFamily: "Par Famille Linguistique",
  statistics: "Statistiques",
  searchPlaceholder: "Rechercher familles, peuples ou pays...",
  population: "Population",
  percentage: "Pourcentage",
  country: "Pays",
  countries: "Pays",
  people: "Peuple",
  peoples: "Peuples",
  languageFamily: "Famille Linguistique",
  languageFamilies: "Familles Linguistiques",
  subgroup: "Sous-groupe",
  totalPopulation: "Population Totale 2025",
  inCountry: "Dans le Pays",
  inAfrica: "En Afrique",
  showingResults: "Affichage de",
  of: "sur",
  results: "résultats",
  noResults: "Aucun résultat trouvé",
  sortBy: "Trier par",
  filterBy: "Filtrer par",
  all: "Tous",
  viewDetails: "Voir Détails",
  close: "Fermer",
  whyThisSite: "Pourquoi ce site ?",
  madeWithEmotion: ATTRIBUTION_STRING,
};

type CommonCopy = typeof fr;

// @req REQ-145
export const commonCopy: Record<Language, CommonCopy> = { fr };
