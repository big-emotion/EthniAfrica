import type { Language } from "@/types/shared";

export type SeedWords = Record<
  "patronyme" | "language" | "people" | "country",
  string[]
>;

// These fallback spellings are checked against the source corpus, including
// the people's own appellations. Names keep their diacritics in both locales.
// @req REQ-002
export const FALLBACK_SEED_WORDS: Record<Language, SeedWords> = {
  fr: {
    patronyme: ["Keïta", "Konaté", "Kouassi", "Katende"],
    language: ["Lingala", "Swahili", "Ewe", "Alur"],
    people: ["Fulbe", "Iteso", "Suri", "Murle"],
    country: ["Bénin", "Togo", "Namibie", "Rwanda"],
  },
  en: {
    patronyme: ["Keïta", "Konaté", "Kouassi", "Katende"],
    language: ["Lingala", "Swahili", "Ewe", "Alur"],
    people: ["Fulbe", "Iteso", "Suri", "Murle"],
    country: ["Benin", "Togo", "Namibia", "Rwanda"],
  },
};

// @req REQ-002
export function drawSeedWords(
  candidates: readonly string[],
  fallback: readonly string[],
  random: () => number = Math.random
): string[] {
  // Omit long or qualified names rather than cutting a corpus statement into
  // an invented short name. The chips wrap on narrow screens.
  const eligible = [...new Set(candidates.map((word) => word.trim()))].filter(
    (word) => word.length > 0 && word.length <= 20 && !/[(),;]/.test(word)
  );
  const words = eligible.length >= 2 ? eligible : [...fallback];
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.slice(0, 10);
}
