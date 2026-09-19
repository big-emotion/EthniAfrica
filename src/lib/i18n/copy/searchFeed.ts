import type { Language } from "@/types/shared";

export interface SearchFeedCopy {
  shelves: {
    shorts: string;
    plates: string;
    quiz: string;
    images: string;
    fiches: string;
    peoples: string;
    sharedName: string;
    nearName: string;
  };
  relation: {
    exact: string;
    linkedFamily: string;
    linkedPeople: string;
    linkedCountry: string;
    recent: string;
  };
  emptyShort: {
    body: string;
    action: string;
  };
  wideningNote: string;
  seeAll: string;
  labels: {
    anecdote: string;
    proverb: string;
    photoCredit: string;
    generatedImage: string;
    generatedWith: string;
    source: string;
    discoveries: string;
    noShortYet: string;
    playWithName: string;
    allQuestions: string;
    fichesSubtitle: string;
  };
  filters: {
    label: string;
    all: string;
    shorts: string;
    images: string;
    quiz: string;
    fiches: string;
  };
}

// @req REQ-180
export const searchFeedCopy: Record<Language, SearchFeedCopy> = {
  en: {
    shelves: {
      shorts: "In under one minute",
      plates: "Stories and proverbs",
      quiz: "Test what you have read",
      images: "In pictures",
      fiches: "In the atlas",
      peoples: "The peoples who share this name",
      sharedName: "Why the same name?",
      nearName: "A similar name, elsewhere",
    },
    relation: {
      exact: "About this name",
      linkedFamily: "Same language family",
      linkedPeople: "Related people",
      linkedCountry: "Same country",
      recent: "Recent in the atlas",
    },
    emptyShort: {
      body: "No source read by the atlas answers this question yet.",
      action: "Suggest a source",
    },
    wideningNote: "Around this name — related context, not the same name",
    seeAll: "See all",
    labels: {
      anecdote: "Story",
      proverb: "Proverb",
      photoCredit: "Image",
      generatedImage: "Generated image — an interpretation",
      generatedWith: "Generated with",
      source: "Source",
      discoveries: "Discoveries",
      noShortYet: "No short yet",
      playWithName: "Play with this name",
      allQuestions: "All questions",
      fichesSubtitle: "Go deeper with each entry and all of its sources.",
    },
    filters: {
      label: "Filter this result feed",
      all: "All",
      shorts: "Shorts",
      images: "Images",
      quiz: "Games",
      fiches: "Entries",
    },
  },
  fr: {
    shelves: {
      shorts: "En moins d’une minute",
      plates: "Récits et proverbes",
      quiz: "Vérifier ce que vous avez lu",
      images: "En images",
      fiches: "Dans l’atlas",
      peoples: "Les peuples qui partagent ce nom",
      sharedName: "Pourquoi le même nom ?",
      nearName: "Un nom proche, ailleurs",
    },
    relation: {
      exact: "Sur ce nom",
      linkedFamily: "Même famille de langues",
      linkedPeople: "Peuple lié",
      linkedCountry: "Même pays",
      recent: "Récent dans l’atlas",
    },
    emptyShort: {
      body: "Aucune source lue par l’atlas ne répond encore à cette question.",
      action: "Proposer une source",
    },
    wideningNote: "Autour de ce nom — un contexte lié, pas le même nom",
    seeAll: "Tout voir",
    labels: {
      anecdote: "Anecdote",
      proverb: "Proverbe",
      photoCredit: "Image",
      generatedImage: "Image générée — une interprétation",
      generatedWith: "Générée avec",
      source: "Source",
      discoveries: "Découvertes",
      noShortYet: "Pas encore de short",
      playWithName: "Joue avec ce nom",
      allQuestions: "Toutes les questions",
      fichesSubtitle:
        "Pour aller au fond : chaque fiche, avec toutes ses sources.",
    },
    filters: {
      label: "Filtrer ce fil de résultats",
      all: "Tout",
      shorts: "Shorts",
      images: "Images",
      quiz: "Jeux",
      fiches: "Fiches",
    },
  },
};
