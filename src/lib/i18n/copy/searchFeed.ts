import type { Language } from "@/types/shared";

export interface SearchFeedCopy {
  answer: {
    exact: string;
    relatedOnly: string;
    /** Said when no name answers: the nearest names follow as explicit choices. */
    typo: string;
    typoSummary: (query: string) => string;
    /** Heading of the suggestions: they are not forms of the searched name. */
    typoChoices: string;
    exactSummary: string;
    widenedSummary: string;
    /** A relation-scoped browse (a family or country chip), never a name search. */
    relationEyebrow: string;
    relationFamilyVerdict: (familyName: string) => string;
    /** `locatedPhrase` is already composed with its preposition, e.g. "au Sénégal". */
    relationCountryVerdict: (locatedPhrase: string) => string;
    relationSummary: string;
  };
  shelves: {
    shorts: string;
    plates: string;
    quiz: string;
    fiches: string;
  };
  relation: {
    exact: string;
    linkedFamily: string;
    linkedPeople: string;
    linkedCountry: string;
    recent: string;
    word: string;
  };
  emptyShort: {
    body: string;
    action: string;
  };
  seeAll: string;
  labels: {
    anecdote: string;
    proverb: string;
    photoCredit: string;
    source: string;
    discoveries: string;
    noShortYet: string;
    seeMore: string;
    playWithName: string;
    allQuestions: string;
    fichesSubtitle: string;
  };
  filters: {
    label: string;
    all: string;
    shorts: string;
    stories: string;
    quiz: string;
    fiches: string;
    /** The name-history timeline (REQ-198), the default when a name has one. */
    timeline: string;
  };
  /** What a filter shows once the reader has chosen it. */
  lens: {
    /** The page's one heading while a filter is on, named for the searched name. */
    title: {
      shorts: (name: string) => string;
      stories: (name: string) => string;
      quiz: (name: string) => string;
      fiches: (name: string) => string;
    };
    onName: (count: number) => string;
    around: (count: number) => string;
    aroundNote: string;
    back: string;
    /**
     * On the name-history lens, the subjects the searched name also answers
     * to whose history is not written yet: named, never silently dropped.
     */
    alsoNamed: string;
    alsoNamedUnwritten: (count: number) => string;
    alsoNamedSeeAll: string;
  };
  blocks: {
    /** The button below the answer; the name tells two same-named subjects apart. */
    ficheLink: (name: string) => string;
    ficheMeta: string;
    groupMeta: (count: number) => string;
    questionCount: string;
  };
  status: {
    loading: string;
    retry: string;
  };
  /**
   * Under the heading, when the reader searched another name than the one the
   * subject gives itself (doctrine §1.1). A kind left out gets no lead: a
   * country or a patronyme records no self-given name.
   */
  searchedLead: {
    searched: (name: string) => string;
    self: Partial<
      Record<"people" | "language" | "languageFamily", (self: string) => string>
    >;
  };
}

// @req REQ-180
export const searchFeedCopy: Record<Language, SearchFeedCopy> = {
  fr: {
    answer: {
      exact: "Nous documentons ce nom.",
      relatedOnly:
        "Nous avons trouvé des fiches liées sans établir qu’elles répondent à ce nom.",
      typo: "Cherchiez-vous… ?",
      typoChoices: "Les noms les plus proches",
      typoSummary: (query) =>
        `Aucun nom ne correspond exactement à « ${query} ». Voici les plus proches : choisissez-en un pour le chercher.`,
      exactSummary:
        "Les formes et les sources ci-dessous disent ce que nous pouvons établir.",
      widenedSummary:
        "Chaque contenu élargi indique ce qui le relie au nom cherché.",
      relationEyebrow: "Résultats liés",
      relationFamilyVerdict: (familyName) =>
        `Les peuples de la famille ${familyName}.`,
      relationCountryVerdict: (locatedPhrase) =>
        `Les peuples présents ${locatedPhrase}.`,
      relationSummary:
        "Aucun nom n’a été cherché : ces fiches partagent seulement ce filtre.",
    },
    shelves: {
      shorts: "Les vidéos",
      plates: "Récits et proverbes",
      quiz: "Vérifier ce que vous avez lu",
      fiches: "Découvrir",
    },
    relation: {
      exact: "Sur ce nom",
      linkedFamily: "Même famille de langues",
      linkedPeople: "Peuple lié",
      linkedCountry: "Même pays",
      recent: "Récemment ajouté",
      word: "Sur ce mot",
    },
    emptyShort: {
      body: "Nous n’avons pas encore fait de vidéo sur ce nom.",
      action: "Proposer une source",
    },
    seeAll: "Tout voir",
    labels: {
      anecdote: "Anecdote",
      proverb: "Proverbe",
      photoCredit: "Image",
      source: "Source",
      discoveries: "Découvertes",
      noShortYet: "Pas encore de short",
      seeMore: "Voir plus",
      playWithName: "Joue avec ce nom",
      allQuestions: "Toutes les questions",
      fichesSubtitle:
        "Pour aller au fond : chaque fiche, avec toutes ses sources.",
    },
    filters: {
      label: "Filtrer ce fil de résultats",
      all: "Tout",
      shorts: "Shorts",
      stories: "Récits",
      quiz: "Jeux",
      fiches: "Fiches",
      timeline: "Histoire du nom",
    },
    lens: {
      title: {
        shorts: (name) => `Vidéos sur ${name}`,
        stories: (name) => `Récits et proverbes sur ${name}`,
        quiz: (name) => `Jeux sur ${name}`,
        fiches: (name) => `Fiches sur ${name}`,
      },
      onName: (count) => `Sur ce nom · ${count}`,
      around: (count) => `Autour de ce nom · ${count}`,
      aroundNote: "Un contexte lié, pas le même nom.",
      back: "Revenir à la réponse",
      alsoNamed: "Ce nom désigne aussi",
      alsoNamedUnwritten: (count) =>
        count > 1
          ? "Leur histoire du nom n’est pas encore écrite. Ce que nous savons d’eux est dans « Tout »."
          : "Son histoire du nom n’est pas encore écrite. Ce que nous en savons est dans « Tout ».",
      alsoNamedSeeAll: "Voir tout",
    },
    blocks: {
      ficheLink: (name) => `Voir la fiche complète · ${name}`,
      ficheMeta: "Fiche EthniAfrica",
      groupMeta: (count) => `${count} fiches`,
      questionCount: "Une question tirée de cette page",
    },
    status: {
      loading: "Chargement en cours",
      retry: "Réessayer",
    },
    searchedLead: {
      searched: (name) => `Vous avez cherché ${name}.`,
      self: {
        people: (self) => `Ce peuple se nomme lui-même ${self}.`,
        language: (self) =>
          `Le nom employé par les personnes qui la parlent : ${self}.`,
        languageFamily: (self) =>
          `Le nom employé par les personnes qui la parlent : ${self}.`,
      },
    },
  },
};

// @req REQ-135
export const noNameFicheCopy = {
  label: "Nom absent",
  body: "Nous n’avons pas encore de fiche sur ce nom.",
} as const;
