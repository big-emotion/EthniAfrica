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
  /** « Carrousel · 3 octobre 2026 »: the kind of piece and when it came out. */
  publicationMeta: (
    format: string | undefined,
    date: string | undefined
  ) => string;
}

const FORMATS_EN: Record<string, string> = {
  carrousel: "Carousel",
  video: "Video",
};
const FORMATS_FR: Record<string, string> = {
  carrousel: "Carrousel",
  video: "Vidéo",
};

function metaOf(
  formats: Record<string, string>,
  locale: string,
  format: string | undefined,
  date: string | undefined
): string {
  const day = date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : undefined;
  return [format ? (formats[format] ?? format) : undefined, day]
    .filter(Boolean)
    .join(" · ");
}

// @req REQ-184
export const wordAnswerCopy: Record<Language, WordAnswerCopy> = {
  en: {
    noFicheNote:
      "This word has no entry of its own. Here is what we know of it.",
    publicationsTitle: "Our publication",
    publicationLink: (network) => `See it on ${network}`,
    publicationMeta: (format, date) =>
      metaOf(FORMATS_EN, "en-GB", format, date),
  },
  fr: {
    noFicheNote: "Ce mot n'a pas de fiche à lui. Voici ce que nous en savons.",
    publicationsTitle: "Notre publication",
    publicationLink: (network) => `Voir sur ${network}`,
    publicationMeta: (format, date) =>
      metaOf(FORMATS_FR, "fr-FR", format, date),
  },
};
