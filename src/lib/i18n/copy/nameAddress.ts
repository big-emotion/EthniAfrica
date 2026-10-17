import type { Language } from "@/types/shared";

/**
 * The head of a name's own address (REQ-200): what a search engine or an
 * assistant shows before anyone opens the page. It names the name as the
 * corpus writes it and says what the page answers, in the reader's words.
 */
export interface NameAddressCopy {
  /** The descriptive half of the title; the product name follows it. */
  title: (name: string) => string;
  description: (name: string) => string;
}

const fr: NameAddressCopy = {
  title: (name) => `${name} : d'où vient ce nom`,
  description: (name) =>
    `Cette page explique d'où vient le nom ${name}, quels autres noms il porte, qui les a donnés, quand et pourquoi, et cite ses sources.`,
};

// @req REQ-200
export const nameAddressCopy: Record<Language, NameAddressCopy> = { fr };
