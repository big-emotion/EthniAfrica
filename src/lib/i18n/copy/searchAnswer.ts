import type { AnswerKind } from "@/lib/search/answer";
import type { Language } from "@/types/shared";

/**
 * Every word the six answer blocks say themselves, as opposed to the words a
 * fiche writes (`lead`, `followUp`, the origin accounts).
 *
 * Ordinary words only: none of the corpus's scholarly vocabulary reaches this
 * surface (REQ-178, search-result charter §3). Sentence templates are the
 * fallback for a fiche that wrote no lead or no follow-up; they are written to
 * stay true with the little a fact list holds, and a template whose
 * parameters are missing is not drawn at all (the component checks, because
 * the parity suite calls every function with placeholder strings).
 *
 * `<strong>` marks the figures a sentence turns on; it is rendered by
 * `InlineMarkup` and is the only markup allowed here.
 */

export type AnswerAttribution = "oral" | "written" | "linguistic" | "synthesis";

export interface SearchAnswerCopy {
  /** The small line above the title: what kind of thing was found. */
  eyebrow: Record<AnswerKind, string>;
  /** Same line when several subjects answer to one name (two countries). */
  eyebrowMany: (kind: AnswerKind, count: number) => string;
  /** « 40 millions de personnes, dans 12 pays », when no lead was written. */
  whatFallback: {
    people: (population: string, countryCount: number) => string;
    peopleNoCount: (population: string) => string;
    country: (peopleCount: number) => string;
    language: (speakers: string, countryCount: number) => string;
    languageFamily: (speakers: string, countryCount: number) => string;
    patronyme: (countryCount: number) => string;
    /** The sentence above one story told for several States bearing the name. */
    /** `names` is the already-joined list (« A et B »), formed by the caller. */
    sharedCountryName: (count: number, names: string) => string;
  };
  /** « What are you looking for? »: the ways in when one name is two things. */
  choices: {
    title: string;
    family: string;
    peoples: { eyebrow: string; label: string };
  };
  origin: {
    title: Record<"name" | "word", string>;
    readMore: string;
    readLess: string;
    debatedIntroTwo: (title: string) => string;
    debatedIntroMany: string;
    debatedFootnote: string;
    attribution: Record<AnswerAttribution, string>;
  };
  names: {
    title: Record<AnswerKind, string>;
    yourSearch: string;
    selfGiven: string;
    /** A dated name without a date range, in a list of dated names. */
    undated: string;
    showMore: (count: number, preview: string) => string;
    showFewer: string;
  };
  where: {
    title: Record<"default" | "country", string>;
    speakersHeadline: (figure: string, countryCount: number) => string;
    populationHeadline: (figure: string, countryCount: number) => string;
    moreCountries: (count: number) => string;
    estimateSpeakers: string;
    estimatePopulation: string;
    peoplePresented: (count: number) => string;
    /** `peopleNames` is the comma-joined list of peoples the fiche lists without a share. */
    unsplit: (percent: string, peopleNames?: string) => string;
    presenceHeadline: (countryCount: number) => string;
    presenceMissingFigures: string;
    seePeoples: (count: number) => string;
  };
  next: {
    eyebrow: string;
    template: {
      migration: (from: string, to: string) => string;
      formerName: (formerName: string) => string;
      distributionGap: (countryCount: number) => string;
    };
  };
  sources: {
    summary: (count: number) => string;
    open: string;
    sheetStatement: (title: string) => string;
    accountPosition: (index: number) => string;
  };
  /**
   * The closing invitation, one per kind of subject: it asks for what only a
   * reader of that kind can bring (a family's story, a speaker's account) and
   * claims nothing about the subject itself.
   */
  invitation: Record<
    AnswerKind,
    { title: string; body: string; action: string }
  >;
}

const FR_NUMBER_WORDS = ["", "un", "deux", "trois", "quatre", "cinq"];

const capitalise = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

// @req REQ-178
export const searchAnswerCopy: Record<Language, SearchAnswerCopy> = {
  fr: {
    eyebrow: {
      people: "Un peuple",
      country: "Un pays",
      language: "Une langue",
      languageFamily: "Une famille de langues",
      patronyme: "Un nom de famille",
      word: "Un mot",
    },
    eyebrowMany: (kind, count) => {
      const noun: Record<AnswerKind, string> = {
        people: "peuples",
        country: "pays",
        language: "langues",
        languageFamily: "familles de langues",
        patronyme: "noms de famille",
        word: "mots",
      };
      return `${capitalise(FR_NUMBER_WORDS[count] || String(count))} ${noun[kind]}`;
    },
    whatFallback: {
      people: (population, countryCount) =>
        `Un peuple d'environ <strong>${population}</strong> de personnes, présent dans <strong>${countryCount}</strong> pays.`,
      peopleNoCount: (population) =>
        `Un peuple d'environ <strong>${population}</strong> de personnes.`,
      country: (peopleCount) =>
        `Un pays dont nous présentons <strong>${peopleCount}</strong> peuples.`,
      language: (speakers, countryCount) =>
        `Une langue parlée par environ <strong>${speakers}</strong> de personnes, dans <strong>${countryCount}</strong> pays.`,
      languageFamily: (speakers, countryCount) =>
        `Une famille de langues parlée par environ <strong>${speakers}</strong> de personnes, dans <strong>${countryCount}</strong> pays.`,
      patronyme: (countryCount) =>
        `Un nom de famille porté dans <strong>${countryCount}</strong> pays.`,
      sharedCountryName: (count, names) =>
        `${capitalise(FR_NUMBER_WORDS[count] || String(count))} États portent ce nom : ${names}.`,
    },
    choices: {
      title: "Que cherchez-vous ?",
      family: "Famille de langues",
      peoples: { eyebrow: "Peuples", label: "Les peuples qui les parlent" },
    },
    origin: {
      title: { name: "D'où vient le nom", word: "D'où vient le mot" },
      readMore: "Lire la suite",
      readLess: "Réduire",
      debatedIntroTwo: (title) =>
        `L'origine du nom ${title} n'est pas établie. Deux explications circulent :`,
      debatedIntroMany:
        "Plusieurs récits expliquent ce nom ; aucun ne s'impose.",
      debatedFootnote: "Les sources ne les départagent pas.",
      attribution: {
        oral: "Récit transmis de bouche à oreille",
        written: "Source écrite",
        linguistic: "Lecture des langues",
        synthesis: "Notre synthèse",
      },
    },
    names: {
      title: {
        people: "Ses noms",
        country: "Ses noms dans le temps",
        language: "Ses noms",
        languageFamily: "Ses noms",
        patronyme: "Ses graphies",
        word: "Son chemin jusqu'à nous",
      },
      yourSearch: "votre recherche",
      selfGiven: "leur propre nom",
      undated: "usage",
      showMore: (count, preview) =>
        `+ ${count} ${count === 1 ? "autre nom" : "autres noms"} (${preview}…)`,
      showFewer: "Réduire",
    },
    where: {
      title: { default: "Où", country: "Qui y vit" },
      speakersHeadline: (figure, countryCount) =>
        `Environ <strong>${figure}</strong> de personnes le parlent, dans <strong>${countryCount}</strong> pays.`,
      populationHeadline: (figure, countryCount) =>
        `Environ <strong>${figure}</strong> de personnes, dans <strong>${countryCount}</strong> pays.`,
      moreCountries: (count) =>
        `+ ${count} ${count === 1 ? "autre pays" : "autres pays"}`,
      estimateSpeakers:
        "Estimations du nombre de locuteurs, à lire comme des ordres de grandeur.",
      estimatePopulation: "Estimations, à lire comme des ordres de grandeur.",
      peoplePresented: (count) =>
        `${count} ${count === 1 ? "peuple présenté" : "peuples présentés"}`,
      unsplit: (percent, peopleNames) =>
        `${percent} de la population n'est pas encore répartie par peuple${peopleNames ? ` (${peopleNames}…)` : ""}.`,
      presenceHeadline: (countryCount) =>
        `Porté dans <strong>${countryCount}</strong> pays :`,
      presenceMissingFigures:
        "Nous ne savons pas encore combien de personnes portent ce nom dans chaque pays : le graphe apparaîtra quand nous aurons les chiffres.",
      seePeoples: (count) =>
        `Voir ${count === 1 ? "le peuple" : `les ${count} peuples`}`,
    },
    next: {
      eyebrow: "Et maintenant",
      template: {
        migration: (from, to) =>
          `Comment ce nom a-t-il voyagé de ${from} à ${to} ?`,
        formerName: (formerName) =>
          `Qui a donné le nom « ${formerName} », et pourquoi a-t-il changé ?`,
        distributionGap: (countryCount) =>
          `Pourquoi retrouve-t-on ce nom dans ${countryCount} pays ?`,
      },
    },
    sources: {
      summary: (count) =>
        `Ces réponses s'appuient sur <strong>${count} ${count === 1 ? "source" : "sources"}</strong>`,
      open: "Voir les sources",
      sheetStatement: (title) => `Sources de la réponse sur ${title}`,
      accountPosition: (index) => `Récit ${index}`,
    },
    invitation: {
      people: {
        title: "Vous connaissez une autre explication ?",
        body: "Un récit transmis dans votre famille, une source écrite : nous la lirons.",
        action: "Proposer une source",
      },
      country: {
        title: "Vous connaissez une autre explication ?",
        body: "Un récit transmis, une source écrite : nous la lirons.",
        action: "Proposer une source",
      },
      language: {
        title: "Vous parlez cette langue ?",
        body: "Ce qu'on vous a transmis sur le nom de votre langue nous intéresse.",
        action: "Proposer une source",
      },
      languageFamily: {
        title: "Vous l'avez appris autrement ?",
        body: "Dites-nous ce qu'on vous a transmis sur ce nom, avec sa source si vous l'avez.",
        action: "Proposer une source",
      },
      patronyme: {
        title: "Vous portez ce nom ?",
        body: "Ce que votre famille raconte sur son origine nous intéresse.",
        action: "Partager un récit",
      },
      word: {
        title: "Vous connaissez une autre source ?",
        body: "Une lecture, un document : nous la lirons.",
        action: "Proposer une source",
      },
    },
  },
};
