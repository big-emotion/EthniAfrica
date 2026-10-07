import type { Language } from "@/types/shared";

/**
 * What the word page says beyond the answer blocks, whose words live in
 * `searchAnswer.ts`. The sentences about the word itself are in its record,
 * never in this file.
 *
 * Same register as the rest of the result page: no scholarly word, and no
 * « atlas » naming the project.
 */
export interface WordAnswerCopy {
  /** Said under the word: it has no fiche, and the page says so rather than leave a gap. */
  noFicheNote: string;
  publicationsTitle: string;
  /** Names the network a link leads to. */
  publicationLink: (network: string) => string;
}

// @req REQ-184
export const wordAnswerCopy: Record<Language, WordAnswerCopy> = {
  en: {
    noFicheNote:
      "This word has no entry of its own. Here is what we know of it.",
    publicationsTitle: "Our piece on this word",
    publicationLink: (network) => `See it on ${network}`,
  },
  fr: {
    noFicheNote: "Ce mot n'a pas de fiche à lui. Voici ce que nous en savons.",
    publicationsTitle: "Notre publication sur ce mot",
    publicationLink: (network) => `La voir sur ${network}`,
  },
};
