import type { ProverbOriginStatus } from "@/lib/proverbs/proverbs";
import type { Language } from "@/types/shared";

const fr = {
  pageTitle: "Proverbes",
  pageSubtitle:
    "Des proverbes d'Afrique, chacun avec le peuple qui le dit — quand une source le nomme.",
  pageKicker: "Un proverbe appartient au peuple qui le dit",
  kicker: "Proverbe",
  originalIn: (language: string) => `En ${language}`,
  meaning: "Sens",
  origin: "Origine",
  originStatus: {
    attested: "attestée par une source",
    estimated: "estimée",
    unestablished: "non établie",
  } satisfies Record<ProverbOriginStatus, string>,
  originOptions: {
    attested: "Attestée",
    estimated: "Estimée",
    unestablished: "Non établie",
  } satisfies Record<ProverbOriginStatus, string>,
  count: (total: number, formatted: string) =>
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

type ProverbsCopy = typeof fr;

// @req REQ-145
export const proverbsCopy: Record<Language, ProverbsCopy> = { fr };
