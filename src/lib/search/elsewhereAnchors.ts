/**
 * « Pendant ce temps, ailleurs » (REQ-198, doctrine §1.1): a fixed list of
 * dated events a reader can set a name's date against. They are time anchors,
 * never the subject: the timeline prints one only after a sentence about the
 * African name.
 *
 * The list mixes African events with French and Belgian school history
 * (operator ruling, ETNI-2012 review): a reader schooled in France or Belgium
 * gets a landmark they know, and an African reader is not told that the only
 * history running alongside an African name is Europe's.
 *
 * A data file rather than code so the list can be reviewed and extended as
 * content; the schema below is what keeps every event sourced.
 */

import { z } from "zod";

import { ficheSourceTierSchema } from "@/lib/afrik/parsers/ficheSourceTier";
import { SOURCE_KINDS } from "@/types/sources";

import anchorsData from "./elsewhereAnchors.json";

/** The UN M49 sub-regions of Africa, the grain at which « ailleurs » is judged. */
// @req REQ-198
export const AFRICAN_REGIONS = [
  "north",
  "west",
  "central",
  "east",
  "southern",
] as const;

export type AfricanRegion = (typeof AFRICAN_REGIONS)[number];

// UN M49 (« Standard country or area codes for statistical use »), Africa.
// Mozambique, Madagascar, Zambia and Zimbabwe are Eastern Africa there, not
// Southern: the standard is followed as published rather than by ear.
const REGION_BY_COUNTRY: Record<string, AfricanRegion> = {
  ...Object.fromEntries(
    ["DZA", "EGY", "LBY", "MAR", "SDN", "TUN", "ESH"].map((id) => [id, "north"])
  ),
  ...Object.fromEntries(
    [
      "BEN",
      "BFA",
      "CPV",
      "CIV",
      "GMB",
      "GHA",
      "GIN",
      "GNB",
      "LBR",
      "MLI",
      "MRT",
      "NER",
      "NGA",
      "SHN",
      "SEN",
      "SLE",
      "TGO",
    ].map((id) => [id, "west"])
  ),
  ...Object.fromEntries(
    ["AGO", "CMR", "CAF", "TCD", "COG", "COD", "GNQ", "GAB", "STP"].map(
      (id) => [id, "central"]
    )
  ),
  ...Object.fromEntries(
    [
      "BDI",
      "COM",
      "DJI",
      "ERI",
      "ETH",
      "KEN",
      "MDG",
      "MWI",
      "MUS",
      "MYT",
      "MOZ",
      "REU",
      "RWA",
      "SYC",
      "SOM",
      "SSD",
      "UGA",
      "TZA",
      "ZMB",
      "ZWE",
    ].map((id) => [id, "east"])
  ),
  ...Object.fromEntries(
    ["BWA", "SWZ", "LSO", "NAM", "ZAF"].map((id) => [id, "southern"])
  ),
};

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
    /** Empty for an event outside Africa; several when it spans regions. */
    africanRegions: z.array(z.enum(AFRICAN_REGIONS)),
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

/** The African regions a subject's countries lie in, in region order. */
// @req REQ-198
export function africanRegionsOf(
  countryIds: readonly string[] | undefined
): AfricanRegion[] {
  const regions = new Set(
    (countryIds ?? []).map((id) => REGION_BY_COUNTRY[id])
  );
  return AFRICAN_REGIONS.filter((region) => regions.has(region));
}

// How far from a tile's period an event may sit and still be « meanwhile ».
const TOLERANCE_YEARS = 5;

/**
 * The event nearest the middle of a dated period, within five years of it,
 * that is elsewhere for this subject. An undated period gets none: there is
 * nothing to set it against.
 *
 * « Elsewhere » rule: an African event is skipped when it touches any region
 * the subject belongs to, so a Malian name is never set against Mansa Moussa.
 * When the subject's region is unknown (a language, a family, a family name:
 * the search result carries no country for them), no African event can be
 * shown to be elsewhere, and only events outside Africa are offered. Among
 * the events left, the nearest date wins, whatever the region; on a tie, the
 * earlier one.
 */
// @req REQ-198
export function elsewhereAnchorFor(
  period: { from?: number | null; to?: number | null },
  subjectRegions: readonly AfricanRegion[] = []
): ElsewhereAnchor | undefined {
  const start = period.from ?? period.to;
  const end = period.to ?? period.from;
  if (start === null || start === undefined) return undefined;
  const middle = (start + end) / 2;
  const isElsewhere = ({ africanRegions }: ElsewhereAnchor) =>
    subjectRegions.length === 0
      ? africanRegions.length === 0
      : !africanRegions.some((region) => subjectRegions.includes(region));
  return ELSEWHERE_ANCHORS.filter(
    (anchor) =>
      anchor.year >= start - TOLERANCE_YEARS &&
      anchor.year <= end + TOLERANCE_YEARS &&
      isElsewhere(anchor)
  ).sort((a, b) => Math.abs(a.year - middle) - Math.abs(b.year - middle))[0];
}
