import type { AnswerKind } from "@/lib/search/answer";

/**
 * One accent per answer, chosen by what the subject is. The assignment follows
 * the validated mockup (v11), where a language reads periwinkle and a family
 * ocre; it is held here, and nowhere in a component, so a ruling that moves a
 * kind moves one line.
 */
// @req REQ-178
export const ANSWER_ACCENT_CLASS: Record<AnswerKind, string> = {
  people: "afh-accent-ocre",
  country: "afh-accent-teal",
  language: "afh-accent-perv",
  languageFamily: "afh-accent-ocre",
  patronyme: "afh-accent-terre",
  word: "afh-accent-ocre",
};

/** Reading measure shared by every block, so prose never stretches at 1280 px. */
// @req REQ-178
export const ANSWER_BLOCK =
  "w-full max-w-[var(--afh-measure-prose)] min-w-0 text-left";

// @req REQ-178
export const ANSWER_HEADING =
  "font-afh-display text-afh-h2 font-bold leading-[var(--afh-leading-h2)] text-afh-text";

/** A text-height link grown to a 44 px target without changing its look. */
// @req REQ-178
export const ANSWER_TEXT_BUTTON =
  "inline-flex min-h-11 items-center text-left font-bold text-[color:var(--accent-ink)] underline underline-offset-4 focus-visible:outline-none focus-visible:shadow-[var(--afh-ring-focus)]";
