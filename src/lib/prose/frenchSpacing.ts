const NO_BREAK_SPACE = "\u00a0";

/**
 * @req REQ-122
 * Normalize ordinary French punctuation spacing without changing authored non-breaking spaces.
 */
export function normalizeFrenchSpacing(text: string): string {
  return text
    .replace(/« +/g, `«${NO_BREAK_SPACE}`)
    .replace(/ +»/g, `${NO_BREAK_SPACE}»`)
    .replace(/ +(?=[;:?!](?:$|\s|[^\p{L}\p{N}]))/gu, NO_BREAK_SPACE);
}
