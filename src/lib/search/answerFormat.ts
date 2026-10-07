import type { Language } from "@/types/shared";

const LOCALE: Record<Language, string> = { fr: "fr-FR", en: "en-GB" };

function decimal(value: number, language: Language, digits: number): string {
  return new Intl.NumberFormat(LOCALE[language], {
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * A person count is only ever shown in millions: the figures are declared
 * estimates, and 34 000 000 would claim a precision no fiche has.
 * @req REQ-178
 */
export function formatMillions(persons: number, language: Language): string {
  const millions = persons / 1_000_000;
  // Rounding 20 000 to « 0 M » would read as « nobody ».
  if (millions > 0 && millions < 0.05) {
    return `< ${decimal(0.1, language, 1)} M`;
  }
  return `${decimal(millions, language, 1)} M`;
}

/** « 40 millions » / « 40 million », for a headline sentence. @req REQ-178 */
export function formatMillionsInWords(
  persons: number,
  language: Language
): string {
  const rounded = Math.round(persons / 1_000_000);
  const word = language === "fr" && rounded > 1 ? "millions" : "million";
  return `${decimal(rounded, language, 0)} ${word}`;
}

/** @req REQ-178 */
export function formatPercent(value: number, language: Language): string {
  const figure = decimal(value, language, 1);
  return language === "fr" ? `${figure} %` : `${figure}%`;
}

// A sentence ends at . ! ? or … followed by a space and a capital or an
// opening quote. « XIVe siècle » never splits: no full stop follows it.
const SENTENCE_BOUNDARY = /(?<=[.!?…])\s+(?=[«"“A-ZÀ-ÖØ-Þ])/u;

/** @req REQ-178 */
export function sentences(text: string): string[] {
  return text
    .trim()
    .split(SENTENCE_BOUNDARY)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** @req REQ-178 */
export function firstSentence(text: string): string {
  return sentences(text)[0] ?? "";
}

/**
 * What stays visible before « Lire la suite », and what the disclosure holds.
 * @req REQ-178
 */
export function leadingSentences(
  text: string,
  count: number
): { shown: string; rest: string } {
  const all = sentences(text);
  return {
    shown: all.slice(0, count).join(" "),
    rest: all.slice(count).join(" "),
  };
}
