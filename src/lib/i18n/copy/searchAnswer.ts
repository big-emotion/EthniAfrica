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
const EN_NUMBER_WORDS = ["", "one", "two", "three", "four", "five"];

const capitalise = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

// @req REQ-178
export const searchAnswerCopy: Record<Language, SearchAnswerCopy> = {
  en: {
    eyebrow: {
      people: "A people",
      country: "A country",
      language: "A language",
      languageFamily: "A language family",
      patronyme: "A family name",
      word: "A word",
    },
    eyebrowMany: (kind, count) => {
      const noun: Record<AnswerKind, string> = {
        people: "peoples",
        country: "countries",
        language: "languages",
        languageFamily: "language families",
        patronyme: "family names",
        word: "words",
      };
      return `${capitalise(EN_NUMBER_WORDS[count] || String(count))} ${noun[kind]}`;
    },
    whatFallback: {
      people: (population, countryCount) =>
        `A people of about <strong>${population}</strong> persons, living in <strong>${countryCount}</strong> countries.`,
      peopleNoCount: (population) =>
        `A people of about <strong>${population}</strong> persons.`,
      country: (peopleCount) =>
        `A country whose <strong>${peopleCount}</strong> peoples we present.`,
      language: (speakers, countryCount) =>
        `A language spoken by about <strong>${speakers}</strong> persons, in <strong>${countryCount}</strong> countries.`,
      languageFamily: (speakers, countryCount) =>
        `A family of languages spoken by about <strong>${speakers}</strong> persons, in <strong>${countryCount}</strong> countries.`,
      patronyme: (countryCount) =>
        `A family name carried in <strong>${countryCount}</strong> countries.`,
    },
    origin: {
      title: {
        name: "Where the name comes from",
        word: "Where the word comes from",
      },
      readMore: "Read more",
      readLess: "Show less",
      debatedIntroTwo: (title) =>
        `The origin of the name ${title} is not settled. Two explanations circulate:`,
      debatedIntroMany:
        "Several accounts explain this name; none stands above the others.",
      debatedFootnote: "The sources do not choose between them.",
      attribution: {
        oral: "Account passed down orally",
        written: "Written source",
        linguistic: "Reading of the languages",
        synthesis: "Our own summary",
      },
    },
    names: {
      title: {
        people: "Its names",
        country: "Its names through time",
        language: "Its names",
        languageFamily: "Its names",
        patronyme: "Its spellings",
        word: "Its path to us",
      },
      yourSearch: "your search",
      selfGiven: "their own name",
      undated: "in use",
      showMore: (count, preview) =>
        `+ ${count} more ${count === 1 ? "name" : "names"} (${preview}…)`,
      showFewer: "Show fewer",
    },
    where: {
      title: { default: "Where", country: "Who lives there" },
      speakersHeadline: (figure, countryCount) =>
        `About <strong>${figure}</strong> people speak it, in <strong>${countryCount}</strong> ${countryCount === 1 ? "country" : "countries"}.`,
      populationHeadline: (figure, countryCount) =>
        `About <strong>${figure}</strong> people, in <strong>${countryCount}</strong> ${countryCount === 1 ? "country" : "countries"}.`,
      moreCountries: (count) =>
        `+ ${count} more ${count === 1 ? "country" : "countries"}`,
      estimateSpeakers:
        "Estimates of the number of speakers, to be read as orders of magnitude.",
      estimatePopulation: "Estimates, to be read as orders of magnitude.",
      peoplePresented: (count) =>
        `${count} ${count === 1 ? "people" : "peoples"} presented`,
      unsplit: (percent, peopleNames) =>
        `${percent} of the population is not yet split by people${peopleNames ? ` (${peopleNames}…)` : ""}.`,
      presenceHeadline: (countryCount) =>
        `Carried in <strong>${countryCount}</strong> ${countryCount === 1 ? "country" : "countries"}:`,
      presenceMissingFigures:
        "We do not yet know how many people carry this name in each country: the chart will appear once we have the figures.",
    },
    next: {
      eyebrow: "And now",
      template: {
        migration: (from, to) =>
          `How did this name travel from ${from} to ${to}?`,
        formerName: (formerName) =>
          `Who gave the name “${formerName}”, and why did it change?`,
        distributionGap: (countryCount) =>
          `Why is this name found in ${countryCount} countries?`,
      },
    },
    sources: {
      summary: (count) =>
        `These answers rest on <strong>${count} ${count === 1 ? "source" : "sources"}</strong>`,
      open: "See the sources",
      sheetStatement: (title) => `Sources for the answer on ${title}`,
      accountPosition: (index) => `Account ${index}`,
    },
    invitation: {
      people: {
        title: "Do you know another explanation?",
        body: "A story handed down in your family, a written source: we will read it.",
        action: "Suggest a source",
      },
      country: {
        title: "Do you know another explanation?",
        body: "A story handed down, a written source: we will read it.",
        action: "Suggest a source",
      },
      language: {
        title: "Do you speak this language?",
        body: "What you were told about the name of your language interests us.",
        action: "Suggest a source",
      },
      languageFamily: {
        title: "Did you learn it differently?",
        body: "Tell us what you were told about this name, with its source if you have one.",
        action: "Suggest a source",
      },
      patronyme: {
        title: "Do you carry this name?",
        body: "What your family says about its origin interests us.",
        action: "Share a story",
      },
      word: {
        title: "Do you know another source?",
        body: "A reading, a document: we will read it.",
        action: "Suggest a source",
      },
    },
  },
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
