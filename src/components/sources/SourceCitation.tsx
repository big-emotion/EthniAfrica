import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import type { SourceKind } from "@/types/sources";
import type { Language } from "@/types/shared";

/**
 * A citable work, reduced to what a citation actually needs.
 *
 * Structural rather than named: a patronyme source, a dossier source and a
 * fiche source are three shapes of one idea, and a component that took one of
 * them by name would be copied for the other two — which is exactly what had
 * started to happen.
 */
export interface CitableSource {
  title: string;
  url: string | null;
  /** Absent when the record does not say; the citation then names no type. */
  kind?: SourceKind | null;
}

/**
 * One citation, wherever the atlas cites.
 *
 * The citation names the source's type — a tradition, an archive, a
 * publication — and never its tier: the reader is told who speaks, not how
 * much to trust them (doctrine §1.1). The tier stays on the record for
 * moderation; it has no reader rendering.
 */
// @req REQ-092
// @req REQ-161
export function SourceCitation({
  source,
  language = "fr",
}: {
  source: CitableSource;
  language?: Language;
}) {
  return (
    <span className="afh-source-citation">
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer noopener">
          {source.title}
        </a>
      ) : (
        source.title
      )}
      {source.kind ? (
        <>
          {" "}
          <span className="afh-source-kind-label">
            ({sourceKindLabel(source.kind, language)})
          </span>
        </>
      ) : null}
    </span>
  );
}
