/**
 * The two buttons of the account board (`account-430`): `cm-btn`, bordered,
 * and `cm-text`, the label alone (actions charter §4). Tokens only.
 */
// @req REQ-213
export const ACCOUNT_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-afh-lg border border-afh-border bg-afh-surface px-3.5 text-afh-small font-semibold leading-tight text-afh-text focus-visible:shadow-afh-focus focus-visible:outline-none";

// @req REQ-213
export const ACCOUNT_TEXT_BUTTON =
  "inline-flex min-h-11 items-center px-0.5 text-afh-small font-semibold text-[color:var(--accent-ink)] focus-visible:shadow-afh-focus focus-visible:outline-none";

/** `cm-pill`: a value among several, rounded; dashed while it waits. */
// @req REQ-213
export const ACCOUNT_PILL =
  "inline-flex items-center rounded-full border border-afh-border bg-afh-surface px-2.5 py-0.5 text-afh-caption font-semibold leading-normal text-afh-text";

/** `cm-remed`: what changed on the fiche, with the sharp corner of the source apparatus. */
// @req REQ-213
export const ACCOUNT_CORRECTION =
  "inline-flex items-center rounded-afh-0 border border-afh-text-soft bg-afh-bg-warm px-2.5 py-0.5 text-afh-caption font-bold leading-normal";
