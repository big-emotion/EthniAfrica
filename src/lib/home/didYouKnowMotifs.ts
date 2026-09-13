/**
 * Cultural objects redrawn as quiet line motifs behind the anecdotes page (the
 * home band that first carried them was retired on 2026-09-13).
 *
 * The identifiers keep each object attached to a named tradition instead of
 * presenting one anonymous "African" visual language.
 */
// @req REQ-115
export const DID_YOU_KNOW_MOTIFS = [
  "mande-kora",
  "amazigh-fibula",
  "punu-mukudj",
] as const;

export type DidYouKnowMotif = (typeof DID_YOU_KNOW_MOTIFS)[number];

/** Draw one of the three backgrounds with an equal one-third probability. */
// @req REQ-115
export function drawDidYouKnowMotif(
  random: () => number = Math.random
): DidYouKnowMotif {
  const index = Math.min(
    DID_YOU_KNOW_MOTIFS.length - 1,
    Math.floor(random() * DID_YOU_KNOW_MOTIFS.length)
  );

  return DID_YOU_KNOW_MOTIFS[index];
}
