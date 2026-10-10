"use client";

import { useState } from "react";

import { LazySourceChainSheet } from "@/components/source-transparency/SourceChainSheet.lazy";
import {
  SourceDiamond,
  SourceDiamondLegend,
} from "@/components/sources/SourceDiamond";
import type { SearchEvidenceSource } from "@/lib/search/evidence";
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
 * How a reader reaches the sources behind one timeline passage (ETNI-2015):
 * a small diamond after the passage's last word, coloured by the type of its
 * first source, opening the source sheet with the key to the colours. The
 * one-diamond-per-passage rule and the colour families live in
 * `SourceDiamond` and `sourceKindFamily`.
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

  return (
    <>
      <SourceDiamond
        id={anchorId}
        kinds={sources.map((source) => source.source_kind)}
        language={language}
        onOpen={() => setOpen(true)}
      />
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
        legend={<SourceDiamondLegend language={language} />}
      />
    </>
  );
}
