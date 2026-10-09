import { SEARCH_ANSWER_ACCENT } from "@/components/search/searchEntityAccent";
import type { AnswerKind } from "@/lib/search/answer";

/**
 * One accent per answer, chosen by what the subject is. The assignment lives
 * in `SEARCH_ANSWER_ACCENT`, next to the table the result cards read, and is
 * ruled by search-result charter §6.
 */
// @req REQ-178
export const ANSWER_ACCENT_CLASS: Record<AnswerKind, string> =
  SEARCH_ANSWER_ACCENT;

/** The question above a set of ways in: smaller than a block's own heading. */
// @req REQ-178
export const ANSWER_SUBHEADING =
  "m-0 text-afh-body font-bold leading-[var(--afh-leading-small)] text-afh-text";

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
  "inline-flex min-h-11 items-center text-left font-bold text-[color:var(--accent-ink)] underline underline-offset-4 focus-visible:outline-none focus-visible:shadow-afh-focus";
