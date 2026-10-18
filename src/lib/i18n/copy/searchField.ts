import type { Language } from "@/types/shared";

// @req REQ-002
export const searchFieldCopy: Record<
  Language,
  {
    label: string;
    placeholder: string;
    close: string;
    dialogLabel: string;
    submit: string;
    clear: string;
    suggestions: string;
    allAnswers: (query: string) => string;
    noPrefix: (query: string) => string;
    searchAnyway: string;
    kinds: Record<string, string>;
  }
> = {
  fr: {
    label: "Quel nom cherchez-vous ?",
    placeholder: "Un peuple, une langue, un pays…",
    close: "Fermer",
    dialogLabel: "Recherche",
    submit: "Rechercher",
    clear: "Effacer",
    suggestions: "Suggestions",
    allAnswers: (query) => `Toutes les réponses pour « ${query} »`,
    noPrefix: (query) => `Aucun nom ne commence par « ${query} ».`,
    searchAnyway: "Lancer la recherche quand même",
    kinds: {
      people: "Peuple",
      country: "Pays",
      family: "Famille linguistique",
      language: "Langue",
      patronyme: "Nom de famille",
      place: "Lieu",
    },
  },
};
