import type { Language } from "@/types/shared";

const fr = {
  flags: {
    antibotFailed: "vérification anti-robot échouée",
    antibotUnavailable:
      "vérification anti-robot temporairement indisponible, veuillez réessayer plus tard",
    rateLimited: (seconds: number) =>
      `Limite de soumission des signalements dépassée. Réessayez dans ${seconds} secondes.`,
    illegalTransition:
      "Cette transition n'est pas permise depuis l'état courant.",
  },
  download: {
    summarySheet: "Résumé",
    familiesSheet: "Familles",
    peoplesSheet: "Peuples",
    countriesSheet: "Pays",
    relationsSheet: "Relations",
    languageFamilies: "Familles linguistiques",
    peoples: "Peuples",
    countries: "Pays",
    name: "Nom",
    mainName: "Nom principal",
    languageFamily: "Famille linguistique",
    country: "Pays",
    etymology: "Étymologie",
    peopleId: "Peuple ID",
    countryId: "Pays ID",
  },
};

type ServerCopy = typeof fr;

// @req REQ-145
export const serverCopy: Record<Language, ServerCopy> = { fr };
