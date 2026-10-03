import type { ProverbOriginStatus } from "@/lib/proverbs/proverbs";
import type { Language } from "@/types/shared";

const en = {
  pageTitle: "Proverbs",
  pageSubtitle:
    "Proverbs from Africa, each with the people who say it — where a source names them.",
  // The claim every card on the page makes, rather than a count of them.
  pageKicker: "A proverb belongs to the people who say it",
  kicker: "Proverb",
  originalIn: (language: string) => `In ${language}`,
  meaning: "Meaning",
  origin: "Origin",
  originStatus: {
    attested: "attested by a source",
    estimated: "estimated",
    unestablished: "not established",
  } satisfies Record<ProverbOriginStatus, string>,
  // The same statuses as choices, where they stand alone rather than finish
  // the « Origin — » sentence of a card.
  originOptions: {
    attested: "Attested",
    estimated: "Estimated",
    unestablished: "Not established",
  } satisfies Record<ProverbOriginStatus, string>,
  count: (total: number, formatted: string) =>
    total === 1 ? "1 proverb" : `${formatted} proverbs`,
  unitPlural: "proverbs",
  country: "Country",
  allCountries: "All countries",
  people: "People",
  allPeoples: "All peoples",
  family: "Language family",
  allFamilies: "All language families",
  allOrigins: "All origins",
  empty: "No published proverb matches these filters.",
  sources: "Sources",
  photo: "Photo",
  // The way in from the dossiers hub.
  readAll: "Read the proverbs",
};

type ProverbsCopy = typeof en;

const fr: ProverbsCopy = {
  pageTitle: "Proverbes",
  pageSubtitle:
    "Des proverbes d'Afrique, chacun avec le peuple qui le dit — quand une source le nomme.",
  pageKicker: "Un proverbe appartient au peuple qui le dit",
  kicker: "Proverbe",
  originalIn: (language) => `En ${language}`,
  meaning: "Sens",
  origin: "Origine",
  originStatus: {
    attested: "attestée par une source",
    estimated: "estimée",
    unestablished: "non établie",
  },
  originOptions: {
    attested: "Attestée",
    estimated: "Estimée",
    unestablished: "Non établie",
  },
  count: (total, formatted) =>
    total === 1 ? "1 proverbe" : `${formatted} proverbes`,
  unitPlural: "proverbes",
  country: "Pays",
  allCountries: "Tous les pays",
  people: "Peuple",
  allPeoples: "Tous les peuples",
  family: "Famille linguistique",
  allFamilies: "Toutes les familles",
  allOrigins: "Toutes les origines",
  empty: "Aucun proverbe publié ne correspond à ces filtres.",
  sources: "Sources",
  photo: "Photo",
  readAll: "Lire les proverbes",
};

// @req REQ-145
export const proverbsCopy: Record<Language, ProverbsCopy> = { en, fr };
