import type { Language } from "@/types/shared";

export interface SearchFeedCopy {
  answer: {
    exact: string;
    widened: string;
    relatedOnly: string;
    typo: (name: string) => string;
    shared: (count: number) => string;
    exactSummary: string;
    widenedSummary: string;
  };
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
  blocks: {
    sharedNameBody: string;
    nearNameBody: (name: string) => string;
    problematicBody: string;
    relatedPeoplesTitle: string;
    atlasHoldsSummary: string;
    ficheMeta: string;
    groupMeta: (count: number) => string;
    peopleMeta: string;
    peopleDescription: string;
    questionCount: string;
  };
  status: {
    loading: string;
    retry: string;
  };
}

// @req REQ-180
export const searchFeedCopy: Record<Language, SearchFeedCopy> = {
  en: {
    answer: {
      exact: "The atlas documents this name.",
      widened:
        "The atlas documents this name, but the context below is related rather than identical.",
      relatedOnly:
        "The atlas found related entries without establishing that they answer to this name.",
      typo: (name) => `Did you mean ${name}?`,
      shared: (count) => `${count} peoples carry this name.`,
      exactSummary:
        "The forms and sources below state what the atlas can establish.",
      widenedSummary:
        "Every widened item says how it is related to the searched name.",
    },
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
    blocks: {
      sharedNameBody:
        "A shared spelling does not establish kinship between peoples.",
      nearNameBody: (name) =>
        `${name} has a similar spelling and belongs to a different atlas entry.`,
      problematicBody:
        "The corpus records a problem or disagreement about at least one form of this name.",
      relatedPeoplesTitle: "Peoples linked to this name",
      atlasHoldsSummary:
        "The atlas states the facts it holds and leaves the missing origin undeclared.",
      ficheMeta: "Atlas entry",
      groupMeta: (count) => `${count} records`,
      peopleMeta: "Documented people",
      peopleDescription: "Open the entry to read its complete sourced account.",
      questionCount: "One question from this page",
    },
    status: {
      loading: "Loading search",
      retry: "Try again",
    },
  },
  fr: {
    answer: {
      exact: "L’atlas documente ce nom.",
      widened:
        "L’atlas documente ce nom, mais le contexte ci-dessous est lié plutôt qu’identique.",
      relatedOnly:
        "L’atlas a trouvé des fiches liées sans établir qu’elles répondent à ce nom.",
      typo: (name) => `Vouliez-vous dire ${name} ?`,
      shared: (count) => `${count} peuples portent ce nom.`,
      exactSummary:
        "Les formes et les sources ci-dessous disent ce que l’atlas peut établir.",
      widenedSummary:
        "Chaque contenu élargi indique ce qui le relie au nom cherché.",
    },
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
    blocks: {
      sharedNameBody:
        "Une orthographe partagée ne suffit pas à établir une parenté entre des peuples.",
      nearNameBody: (name) =>
        `${name} a une graphie proche et correspond à une autre fiche de l’atlas.`,
      problematicBody:
        "Le corpus signale un problème ou un désaccord autour d’au moins une forme de ce nom.",
      relatedPeoplesTitle: "Les peuples liés à ce nom",
      atlasHoldsSummary:
        "L’atlas énonce les faits qu’il tient et laisse l’origine manquante déclarée.",
      ficheMeta: "Fiche de l’atlas",
      groupMeta: (count) => `${count} fiches`,
      peopleMeta: "Peuple documenté",
      peopleDescription:
        "Ouvrir la fiche pour lire son récit complet et sourcé.",
      questionCount: "Une question tirée de cette page",
    },
    status: {
      loading: "Chargement en cours",
      retry: "Réessayer",
    },
  },
};
