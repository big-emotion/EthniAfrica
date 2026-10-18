import type { Language } from "@/types/shared";

export interface SearchFeedCopy {
  answer: {
    exact: string;
    relatedOnly: string;
    /** Said when no name answers: the nearest names follow as explicit choices. */
    typo: string;
    /**
     * When every choice is a family-name lead (DEC-075): a form that begins
     * with the query's first letter and scores 0.4 at least, named by that
     * form, so « written almost the same way » is true of what the chip says.
     * Scoped to our fiches: people bear spellings we hold no fiche for. The
     * choices agree with how many there are, because one lead is the usual
     * case and the plural then asked the reader to choose among one. Never
     * « proche »: on this site the word names a recorded variant (the
     * Tchicaya fiche calls Tschikaya « une forme proche »).
     */
    typoWrittenAlike: {
      heading: (count: number) => string;
      summary: (query: string, choices: readonly string[]) => string;
    };
    /**
     * Any other choice: a people, a country or a family is a lead at 0.2 with
     * no first-letter rule, which DEC-075 describes as names that may share
     * only a syllable, and a reviewed term is offered for any of its terms.
     * Nothing is said of how they are written.
     */
    typoResembling: {
      heading: (count: number) => string;
      summary: (query: string, count: number) => string;
    };
    /**
     * Under the chips, when the form a chip names is not its fiche's filed
     * name: « jarra » reaches Diarra through the spelling Jara. The line says
     * only which fiche records the form, never that one form derives from
     * another (doctrine §1: none is crowned).
     */
    typoFormOf: {
      familyName: (form: string, name: string) => string;
      other: (form: string, name: string) => string;
    };
    /**
     * For a reader whose own spelling is the one searched (brief 16). It sits
     * under the chips, so it names the spelling: « ce nom » read as the lead.
     */
    typoInvitation: (query: string) => string;
    /**
     * The fiches a misspelling's search found: what the block holds, then the
     * related-only page's caution, in the number of the cards listed, about
     * the spelling typed rather than « ce nom », which read as the lead.
     */
    fichesFound: {
      title: (count: number) => string;
      note: (count: number, query: string) => string;
    };
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
  /**
   * The one video in « Histoire du nom » (brief 11 §2). A piece matched
   * `exact` is matched on the subject, not on the name form, so the eyebrow
   * names the subject by its kind and never says « sur ce nom ».
   */
  timelineShort: {
    eyebrow: Record<
      "people" | "country" | "language" | "languageFamily" | "patronyme",
      string
    >;
    duration: (minutes: number, seconds: string) => string;
  };
}

const RELATED_ONLY_FR =
  "Nous avons trouvé des fiches liées sans établir qu’elles répondent à ce nom.";

// @req REQ-180
export const searchFeedCopy: Record<Language, SearchFeedCopy> = {
  fr: {
    answer: {
      exact: "Nous documentons ce nom.",
      relatedOnly: RELATED_ONLY_FR,
      typo: "Cherchiez-vous…\u00a0?",
      typoWrittenAlike: {
        heading: (count) =>
          count === 1
            ? "Un nom qui s’écrit presque de la même façon"
            : "Des noms qui s’écrivent presque de la même façon",
        summary: (query, choices) =>
          `Aucune de nos fiches ne porte le nom «\u00a0${query}\u00a0». ${
            choices.length === 1
              ? `${choices[0]} s’écrit presque de la même façon\u00a0: vous pouvez chercher ce nom.`
              : "Plusieurs noms s’écrivent presque de la même façon\u00a0: choisissez celui que vous cherchez."
          }`,
      },
      typoResembling: {
        heading: (count) =>
          count === 1
            ? "Un nom qui ressemble au nom cherché"
            : "Des noms qui ressemblent au nom cherché",
        summary: (query, count) =>
          `Aucune de nos fiches ne porte le nom «\u00a0${query}\u00a0». ${
            count === 1
              ? "Nous connaissons un nom qui ressemble à celui-ci\u00a0: vous pouvez le chercher."
              : "Nous connaissons des noms qui ressemblent à celui-ci\u00a0: choisissez celui que vous cherchez."
          }`,
      },
      typoFormOf: {
        familyName: (form, name) =>
          `La fiche ${name} donne aussi l’écriture ${form}.`,
        other: (form, name) => `La fiche ${name} donne aussi le nom ${form}.`,
      },
      typoInvitation: (query) =>
        `Si vous écrivez «\u00a0${query}\u00a0», dites-nous où cette écriture est employée.`,
      fichesFound: {
        title: (count) =>
          count === 1 ? "La fiche trouvée" : "Les fiches trouvées",
        note: (count, query) =>
          count === 1
            ? `Nous avons trouvé une fiche liée sans établir qu’elle répond à «\u00a0${query}\u00a0».`
            : `Nous avons trouvé des fiches liées sans établir qu’elles répondent à «\u00a0${query}\u00a0».`,
      },
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
    timelineShort: {
      eyebrow: {
        people: "Une vidéo sur ce peuple",
        country: "Une vidéo sur ce pays",
        language: "Une vidéo sur cette langue",
        languageFamily: "Une vidéo sur cette famille de langues",
        patronyme: "Une vidéo sur ce nom de famille",
      },
      duration: (minutes, seconds) =>
        minutes === 0
          ? `${Number(seconds)} s`
          : Number(seconds) === 0
            ? `${minutes} min`
            : `${minutes} min ${seconds}`,
    },
  },
};

// @req REQ-135
export const noNameFicheCopy = {
  label: "Nom absent",
  body: "Nous n’avons pas encore de fiche sur ce nom.",
} as const;
