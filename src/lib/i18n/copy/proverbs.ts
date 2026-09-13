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
  filterLabel: "Proverbs concerning",
  filterAll: "All proverbs",
  filterKinds: {
    country: "Countries",
    people: "Peoples",
    family: "Language families",
  },
  empty: "No published proverb concerns this atlas entry.",
  sources: "Sources",
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
  filterLabel: "Proverbes concernant",
  filterAll: "Tous les proverbes",
  filterKinds: {
    country: "Pays",
    people: "Peuples",
    family: "Familles linguistiques",
  },
  empty: "Aucun proverbe publié ne concerne cette entrée de l'atlas.",
  sources: "Sources",
};

// @req REQ-145
export const proverbsCopy: Record<Language, ProverbsCopy> = { en, fr };
