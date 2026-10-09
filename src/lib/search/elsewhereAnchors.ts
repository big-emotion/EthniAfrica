/**
 * « Pendant ce temps, ailleurs » (REQ-198, doctrine §1.1): a fixed list of
 * events outside Africa, taken from French and Belgian school history, that a
 * reader can set a name's date against. They are time anchors, never the
 * subject: the timeline prints one only after a sentence about the African
 * name, and an event is chosen by date alone.
 *
 * A data file rather than code so the list can be reviewed and extended as
 * content; the schema below is what keeps every event sourced.
 */

import { z } from "zod";

import { ficheSourceTierSchema } from "@/lib/afrik/parsers/ficheSourceTier";
import { SOURCE_KINDS } from "@/types/sources";

import anchorsData from "./elsewhereAnchors.json";

const anchorSourceSchema = z
  .object({
    title: z.string().trim().min(1),
    author: z.string().trim().min(1),
    year: z.number().int().nullable(),
    url: z.string().min(1).nullable(),
    tier: ficheSourceTierSchema,
    source_kind: z.enum(SOURCE_KINDS),
  })
  .strict();

const anchorSchema = z
  .object({
    year: z.number().int(),
    sentence: z.string().trim().min(1),
    sources: z.array(anchorSourceSchema).min(1),
  })
  .strict();

export type ElsewhereAnchor = z.infer<typeof anchorSchema>;

// Parsed once at import: a malformed entry fails the build's tests, not a
// reader's page.
// @req REQ-198
export const ELSEWHERE_ANCHORS: readonly ElsewhereAnchor[] = z
  .array(anchorSchema)
  .parse(anchorsData) as ElsewhereAnchor[];

// How far from a tile's period an event may sit and still be « meanwhile ».
const TOLERANCE_YEARS = 5;

/**
 * The event nearest the middle of a dated period, within five years of it.
 * An undated period gets none: there is nothing to set it against.
 */
// @req REQ-198
export function elsewhereAnchorFor(period: {
  from?: number | null;
  to?: number | null;
}): ElsewhereAnchor | undefined {
  const start = period.from ?? period.to;
  const end = period.to ?? period.from;
  if (start === null || start === undefined) return undefined;
  const middle = (start + end) / 2;
  return ELSEWHERE_ANCHORS.filter(
    ({ year }) =>
      year >= start - TOLERANCE_YEARS && year <= end + TOLERANCE_YEARS
  ).sort((a, b) => Math.abs(a.year - middle) - Math.abs(b.year - middle))[0];
}
