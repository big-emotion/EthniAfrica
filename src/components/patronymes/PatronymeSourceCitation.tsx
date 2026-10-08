import { SourceCitation } from "@/components/sources/SourceCitation";
import type { PatronymeSource } from "@/lib/patronymes/content";

/**
 * The patronyme fiche's citation, now a caller of the shared one.
 *
 * It keeps its own name and its own `@req` because the fiche's sections read
 * a `<source>` out of the opaque `content` bag and this is where that shape
 * is adapted. The record's `tier` is deliberately not passed: the reader sees
 * the source's type, never its tier (doctrine §1.1).
 */
// @req REQ-133
export function PatronymeSourceCitation({
  source,
}: {
  source: PatronymeSource;
}) {
  return (
    <SourceCitation
      source={{
        title: source.title,
        url: source.url ?? null,
        kind: source.sourceKind,
      }}
    />
  );
}
