import type { SourceKind } from "@/types/sources";

/**
 * The colour families of the source diamond (ETNI-2015).
 *
 * Fourteen source kinds are too many colours for a reader to learn, so the
 * diamond groups them into the five the manifesto film showed (oral
 * tradition, book, article, report, archive) plus a neutral for the
 * provenance markers that are not a cited work. The precise kind is never
 * lost: the diamond's accessible name and the source sheet both print it.
 */
// @req REQ-161
export const SOURCE_KIND_FAMILIES = [
  "oral",
  "book",
  "press",
  "report",
  "archive",
  "other",
] as const;

export type SourceKindFamily = (typeof SOURCE_KIND_FAMILIES)[number];

/**
 * Every corpus kind must have a family (the `SourceKind` half); the string
 * index admits the kinds PR #1624 adds before they reach
 * `SOURCE_KINDS`, so this map does not wait on that merge.
 */
const FAMILY_OF_KIND: Record<SourceKind, SourceKindFamily> &
  Record<string, SourceKindFamily> = {
  oral_tradition: "oral",
  // A community organisation speaks for the people it belongs to, which is
  // closer to a testimony than to a publication.
  community: "oral",
  academic: "book",
  linguistic_reference: "book",
  encyclopedia: "book",
  press: "press",
  government: "report",
  intergovernmental: "report",
  official_statistics: "report",
  ngo: "report",
  archive: "archive",
  repository: "archive",
  discovery: "other",
  // A lookup listing, like `discovery`: it points to peoples, it is not a
  // cited work about them.
  missionary_database: "other",
  ai_generated: "other",
  ethniafrica_synthesis: "other",
  unknown: "other",
};

// @req REQ-161
export function sourceKindFamily(
  kind: SourceKind | undefined
): SourceKindFamily {
  return FAMILY_OF_KIND[kind] ?? "other";
}
