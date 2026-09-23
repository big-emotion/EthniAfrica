import type { AccessMode } from "@/lib/hubs/moduleRegistry";
import type { Language } from "@/types/shared";

export interface AccessModeCardCopy {
  id: AccessMode;
  label: string;
  description: string;
  accentClass: string;
}

interface AboutSectionCopy {
  title: string;
  paragraphs: string[];
}

export interface AboutCopy {
  title: string;
  overview: { eyebrow: string; lead: string; paragraphs: string[] };
  purpose: AboutSectionCopy;
  explore: AboutSectionCopy & { accessModes: AccessModeCardCopy[] };
  audience: AboutSectionCopy;
  sources: AboutSectionCopy;
  conviction: AboutSectionCopy;
  correction: AboutSectionCopy & {
    links: { search: string; method: string; reportError: string };
  };
}

/**
 * The accent each axis carries, per the charter's one-accent-per-surface
 * rule. Declared alongside the copy because a card is the pair.
 */
const ACCENT_CLASS: Record<AccessMode, string> = {
  atlas: "afh-accent-ocre",
  dossiers: "afh-accent-teal",
  jeux: "afh-accent-perv",
};

/**
 * The About page, rewritten on 22 September 2026 to the editorial plan's
 * A1–A7 (operator ruling).
 *
 * What left, and where it went:
 * - the border-age comparison, the dated counts and the three scales are
 *   kept verbatim, marked superseded, in docs/editorial/purpose-doctrine.md —
 *   a count printed on a page that describes the project drifts as the
 *   corpus moves, and nothing re-measured it;
 * - the four refused sentences moved to the method page (`doctrine.ts`),
 *   because what we do not write is method, not a presentation;
 * - the six subject cards went: enumerating what the project holds is the
 *   register the 17 September reorientation retired.
 *
 * The lead keeps the signature the brand charter records for this page, in
 * a sentence, lower-case, so it does not spell `PRODUCT_TAGLINE` outside
 * brand.ts. The conviction carries its own heading because it is a position,
 * not a finding: same doctrine as the Source Tier policy, one layer up —
 * nothing is forbidden, everything is labelled. The correction section
 * promises review only; no public correction note exists yet, so promising
 * to explain each correction would be a claim the site cannot keep.
 */
// @req REQ-132
// @req REQ-145
export const aboutCopy: Record<Language, AboutCopy> = {
  en: {
    title: "About EthniAfrica",
    overview: {
      eyebrow: "The project",
      lead: "EthniAfrica tells Africa through its names.",
      paragraphs: [
        "We want to make knowledge and sources about Africa’s populations easier to find, to understand and to share.",
        "EthniAfrica starts from a name: that of a family, a people, a language or a place. From that word, we gather landmarks for exploring the histories and the usages around it.",
      ],
    },
    purpose: {
      title: "Why start from names?",
      paragraphs: [
        "You can know a name without knowing its history. It can carry several meanings, several forms, or different usages depending on the people, the places and the times.",
        "Starting from the word you know opens the inquiry. We distinguish how a name is used today, the traces of its circulation, and the explanations proposed for its origin. The sources do not always answer these three questions in the same way.",
      ],
    },
    explore: {
      title: "What you can explore",
      paragraphs: [
        "Search a name, find its different forms, place the populations and languages it refers to, then consult the sources to go further.",
        "The dossiers develop one question. The videos offer a first look. The Browse section lets you carry on searching at your own pace.",
      ],
      accessModes: [
        {
          id: "atlas",
          label: "Browse",
          description:
            "Search a name and see where it comes from, then the peoples, languages, families of languages, countries and names that carry it.",
          accentClass: ACCENT_CLASS.atlas,
        },
        {
          id: "dossiers",
          label: "Dossiers",
          description:
            "Sourced anecdotes, initial migration landmarks and a dossier on colonisation.",
          accentClass: ACCENT_CLASS.dossiers,
        },
        {
          id: "jeux",
          label: "Play",
          description:
            "A quiz drawn from our pages, and the Mercator projection cut down to size.",
          accentClass: ACCENT_CLASS.jeux,
        },
      ],
    },
    audience: {
      title: "An open project, with attention to diasporas",
      paragraphs: [
        "EthniAfrica is for anyone curious about Africa. We pay particular attention to French-speaking diasporas, especially people with ties to West and Central Africa who live in France.",
        "That attention guides our examples and the subjects we feature. Our project remains devoted to Africa’s populations and their diasporas.",
      ],
    },
    sources: {
      title: "Making knowledge accessible",
      paragraphs: [
        "Knowledge lives in books, archives, research and traditions passed on orally. Its presence on EthniAfrica also depends on what we have been able to find and document.",
        "We seek to make oral traditions accessible together with the people who carry them, stating the context in which they are passed on. When an account is missing from our sources, that absence does not mean it does not exist.",
        "We state what a source allows us to establish, the questions it leaves open and the documented disagreements. The first trace found of a name does not necessarily give the date it appeared.",
      ],
    },
    conviction: {
      title: "Our conviction",
      paragraphs: [
        "We believe that a better knowledge of the histories and the ties between Africa’s populations can nurture understanding and cooperation.",
        "This conviction guides the project. It does not replace what the inquiry finds, and it assumes neither a single history nor the absence of disagreement.",
      ],
    },
    correction: {
      title: "A work that can be corrected",
      paragraphs: [
        "Does something seem inaccurate, incomplete or poorly presented? You can report the passage concerned and propose a source or a testimony.",
        "Contributions are reviewed before they are included.",
      ],
      links: {
        search: "Search a name",
        method: "How we work",
        reportError: "Report an error",
      },
    },
  },
  fr: {
    title: "À propos d’EthniAfrica",
    overview: {
      eyebrow: "Le projet",
      lead: "EthniAfrica raconte l’Afrique à travers ses noms.",
      paragraphs: [
        "Nous voulons rendre les connaissances et les sources sur les populations d’Afrique plus faciles à trouver, à comprendre et à partager.",
        "EthniAfrica part d’un nom : celui d’une famille, d’un peuple, d’une langue ou d’un lieu. À partir de ce mot, nous rassemblons des repères pour explorer les histoires et les usages qui l’entourent.",
      ],
    },
    purpose: {
      title: "Pourquoi partir des noms ?",
      paragraphs: [
        "On peut connaître un nom sans connaître son histoire. Il peut avoir plusieurs sens, plusieurs formes ou des usages différents selon les personnes, les lieux et les époques.",
        "Partir du mot que l’on connaît permet d’ouvrir l’enquête. Nous distinguons la façon dont un nom est employé aujourd’hui, les traces de sa circulation et les explications proposées pour son origine. Les sources ne répondent pas toujours à ces trois questions de la même manière.",
      ],
    },
    explore: {
      title: "Ce que vous pouvez explorer",
      paragraphs: [
        "Chercher un nom, retrouver ses différentes formes, situer les populations et les langues auxquelles il renvoie, puis consulter les sources pour aller plus loin.",
        "Les dossiers développent une question. Les vidéos proposent un premier éclairage. La rubrique Parcourir permet de poursuivre la recherche à votre rythme.",
      ],
      accessModes: [
        {
          id: "atlas",
          label: "Parcourir",
          description:
            "Chercher un nom et voir d’où il vient, puis les peuples, les langues, les familles de langues, les pays et les noms qui le portent.",
          accentClass: ACCENT_CLASS.atlas,
        },
        {
          id: "dossiers",
          label: "Les dossiers",
          description:
            "Des anecdotes sourcées, les premiers repères de migrations et un dossier sur la colonisation.",
          accentClass: ACCENT_CLASS.dossiers,
        },
        {
          id: "jeux",
          label: "Jouer",
          description:
            "Un quiz tiré de nos pages, et la projection de Mercator remise à sa juste taille.",
          accentClass: ACCENT_CLASS.jeux,
        },
      ],
    },
    audience: {
      title: "Un projet ouvert, une attention aux diasporas",
      paragraphs: [
        "EthniAfrica s’adresse à toute personne curieuse de l’Afrique. Nous portons une attention particulière aux diasporas francophones, notamment aux personnes liées à l’Afrique de l’Ouest et à l’Afrique centrale qui vivent en France.",
        "Cette attention guide nos exemples et les sujets mis en avant. Notre projet reste consacré aux populations d’Afrique et à leurs diasporas.",
      ],
    },
    sources: {
      title: "Rendre les savoirs accessibles",
      paragraphs: [
        "Les connaissances se trouvent dans des livres, des archives, des travaux de recherche et des traditions transmises oralement. Leur présence sur EthniAfrica dépend aussi de ce que nous avons pu retrouver et documenter.",
        "Nous cherchons à rendre les traditions orales accessibles avec les personnes qui les portent, en précisant leur contexte de transmission. Lorsqu’un récit manque à nos sources, cette absence ne signifie pas qu’il n’existe pas.",
        "Nous indiquons ce qu’une source permet d’établir, les questions qu’elle laisse ouvertes et les désaccords documentés. La première trace retrouvée d’un nom ne donne pas nécessairement la date de son apparition.",
      ],
    },
    conviction: {
      title: "Notre conviction",
      paragraphs: [
        "Nous pensons qu’une meilleure connaissance des histoires et des liens entre les populations d’Afrique peut nourrir la compréhension et la coopération.",
        "Cette conviction guide le projet. Elle ne remplace pas les résultats de l’enquête et ne suppose ni une histoire unique ni l’absence de désaccords.",
      ],
    },
    correction: {
      title: "Un travail qui peut être corrigé",
      paragraphs: [
        "Une information vous semble inexacte, incomplète ou mal présentée ? Vous pouvez nous signaler le passage concerné et proposer une source ou un témoignage.",
        "Les contributions sont examinées avant d’être intégrées.",
      ],
      links: {
        search: "Chercher un nom",
        method: "Comment nous travaillons",
        reportError: "Signaler une erreur",
      },
    },
  },
};
