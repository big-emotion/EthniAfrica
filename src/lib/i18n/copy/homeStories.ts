import type { Language } from "@/types/shared";

export interface HomeStoriesCopy {
  title: string;
  intro: string;
  /** One label per card; the card's own title is its accessible description. */
  linkLabel: string;
}

// @req REQ-115
// @req REQ-145
export const homeStoriesCopy: Record<Language, HomeStoriesCopy> = {
  en: {
    title: "Stories to discover",
    intro: "A familiar word can open onto an unexpected story.",
    linkLabel: "Read the story",
  },
  fr: {
    title: "Des histoires à découvrir",
    intro: "Un mot familier peut ouvrir sur une histoire inattendue.",
    linkLabel: "Lire l’histoire",
  },
};
