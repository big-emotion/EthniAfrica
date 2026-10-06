import type { AnswerAccount } from "@/lib/search/answer";
import type { Language } from "@/types/shared";

/**
 * What the page says for a published word — a word with no fiche behind it,
 * whose answer is its production record. Everything here is a label or a frame:
 * the sentences about the word itself live in the record, never in this file.
 *
 * Same register as the rest of the result page: no scholarly word, and no
 * « atlas » naming the project.
 */
export interface WordAnswerCopy {
  eyebrow: string;
  /** Said under the word: it has no fiche, and the page says so rather than leave a gap. */
  noFicheNote: string;
  originTitle: string;
  /** One label per kind of account, so the reader sees what each one rests on. */
  attribution: Record<NonNullable<AnswerAccount["attribution"]>, string>;
  pathTitle: string;
  pathLead: string;
  namesTitle: string;
  sourcesLine: (count: number) => string;
  publicationsTitle: string;
  /** Names the network a link leads to. */
  publicationLink: (network: string) => string;
}

// @req REQ-184
export const wordAnswerCopy: Record<Language, WordAnswerCopy> = {
  en: {
    eyebrow: "Where this word comes from",
    noFicheNote:
      "This word has no entry of its own. Here is what we know of it.",
    originTitle: "Where the word comes from",
    attribution: {
      oral: "An account passed down by voice",
      written: "A written source",
      linguistic: "A reading from the languages themselves",
      synthesis: "Our own synthesis",
    },
    pathTitle: "The route of the word",
    pathLead: "The form it took in each language it passed through.",
    namesTitle: "Its forms",
    sourcesLine: (count) =>
      `${count} ${count === 1 ? "source" : "sources"} behind this answer`,
    publicationsTitle: "Our piece on this word",
    publicationLink: (network) => `See it on ${network}`,
  },
  fr: {
    eyebrow: "D'où vient ce mot",
    noFicheNote: "Ce mot n'a pas de fiche à lui. Voici ce que nous en savons.",
    originTitle: "D'où vient le mot",
    attribution: {
      oral: "Un récit transmis à voix haute",
      written: "Une source écrite",
      linguistic: "Une lecture à partir des langues elles-mêmes",
      synthesis: "Notre propre synthèse",
    },
    pathTitle: "Le chemin du mot",
    pathLead: "La forme qu'il a prise dans chaque langue traversée.",
    namesTitle: "Ses formes",
    sourcesLine: (count) =>
      `${count} ${count === 1 ? "source" : "sources"} derrière cette réponse`,
    publicationsTitle: "Notre publication sur ce mot",
    publicationLink: (network) => `La voir sur ${network}`,
  },
};
