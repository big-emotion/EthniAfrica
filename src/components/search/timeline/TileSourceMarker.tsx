"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

import { LazySourceChainSheet } from "@/components/source-transparency/SourceChainSheet.lazy";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import type { SearchEvidenceSource } from "@/lib/search/evidence";
import { cn } from "@/lib/utils";
import type { SourceKind, SourceTier } from "@/types/sources";
import type { Language } from "@/types/shared";

/** The source fields a timeline passage carries, from a fiche or an anchor. */
export interface PassageSource {
  title: string;
  author: string;
  year?: number | null;
  url?: string | null;
  tier?: string;
  source_kind: SourceKind;
  page?: string;
}

export interface TileSourceMarkerProps {
  statement: string;
  sources: readonly PassageSource[];
  anchorId: string;
  language: Language;
}

function toSheetSource(
  source: PassageSource,
  index: number,
  anchorId: string
): SearchEvidenceSource {
  return {
    id: `${anchorId}-${index}`,
    title: source.title,
    author: source.author,
    year: source.year ?? undefined,
    page: source.page,
    url: source.url ?? undefined,
    // Kept for the sheet's type only: the sheet prints the kind, never the
    // tier (doctrine §1.1, REQ-194).
    tier: source.tier as SourceTier,
    sourceKind: source.source_kind,
  };
}

/**
 * How a reader reaches the sources behind one timeline passage.
 *
 * ETNI-2015 is still open on this interaction (a marker on each passage, or
 * selecting a passage). This is the marker ETNI-2012 asks for as a first
 * release: a button naming the first source's type, opening the existing
 * source sheet. It is the one place that choice lives, so replacing it with
 * the selection interaction changes this component and nothing around it.
 */
// @req REQ-198
// @req REQ-194
export function TileSourceMarker({
  statement,
  sources,
  anchorId,
  language,
}: TileSourceMarkerProps) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;
  const copy = nameTimelineCopy[language].sources;
  const kind = sourceKindLabel(sources[0].source_kind, language);

  return (
    <>
      <button
        type="button"
        id={anchorId}
        aria-label={copy.open(kind)}
        onClick={() => setOpen(true)}
        className={cn(
          "afh-name-timeline-source inline-flex min-h-11 min-w-11 items-center gap-afh-xs align-middle",
          CHARTER_FOCUS_RING
        )}
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{kind}</span>
        {sources.length > 1 ? (
          <span aria-hidden="true">{copy.more(sources.length - 1)}</span>
        ) : null}
      </button>
      <LazySourceChainSheet
        language={language}
        open={open}
        onOpenChange={setOpen}
        assertion={{
          statement,
          sourceCount: sources.length,
          lastHumanAuditAt: null,
        }}
        sources={sources.map((source, index) =>
          toSheetSource(source, index, anchorId)
        )}
        anchorId={anchorId}
      />
    </>
  );
}
