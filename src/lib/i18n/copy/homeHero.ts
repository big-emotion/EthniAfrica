import type { Language } from "@/types/shared";

export interface HomeHeroCopy {
  question: string;
}

/**
 * The home's heading, and the one question the atlas answers.
 *
 * It asked about the continent until 2026-09-18 — an opening that invited any
 * question, of a site that answers one kind. The reorientation onto where names
 * come from (docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md) makes it
 * the same sentence the account's card, its reel and the single social format
 * ask, so the surfaces pose one question rather than four.
 *
 * It sits directly above the search field, which is why it is a question and
 * not a claim: the field is its answer, and the tile band below states the
 * classes it counts. The no-break space before « ? » is the French rule.
 *
 * It lives here rather than inside the component because a French sentence a
 * reader sees belongs in a dictionary — the rule `check:copy-literals` holds,
 * and the rule that gives this key its English counterpart for free.
 */
// @req REQ-044
// @req REQ-145
export const homeHeroCopy: Record<Language, HomeHeroCopy> = {
  en: {
    question: "Where does this name come from?",
  },
  fr: {
    question: "D’où vient ce nom ?",
  },
};
