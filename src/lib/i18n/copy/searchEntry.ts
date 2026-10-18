import type { Language } from "@/types/shared";

export interface SearchEntryCopy {
  examples: string;
  weeklyNames: string;
}

// @req REQ-200
export const searchEntryCopy: Record<Language, SearchEntryCopy> = {
  fr: {
    examples: "Essayez avec",
    weeklyNames: "Cherchés cette semaine",
  },
};

export interface WeeklySearchName {
  form: string;
  href: string;
}

// @req REQ-200
export const SEARCH_PAGE_EXAMPLE_WORDS = {
  patronyme: ["Shenouda", "Keïta"],
  language: ["Siwi", "Lingala"],
  people: ["Suri", "Fulɓe"],
  country: ["Tchad", "Bénin"],
};
