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
