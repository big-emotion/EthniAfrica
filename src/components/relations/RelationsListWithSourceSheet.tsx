"use client";

import { peopleDisplayLabel } from "@/lib/search/peopleDisplayNames";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { RelationsList, type RelationsListProps } from "./RelationsList";
import type { EgoNetworkGraphCenter } from "@/components/relations/EgoNetworkGraph";
import type { RelationListItem } from "@/lib/relationsDataTransformer";
import { getPeopleLinksRoute } from "@/lib/routing";
import type { PeopleId } from "@/types/afrik";
import type { Language } from "@/types/shared";
import { relationsCopy } from "@/lib/i18n/copy/relations";

// Deferred off the initial list bundle (Epic 11, Story 11.11, FR75/NFR1):
// the graph is a below-the-fold enhancement, never required to read the
// SSR-rendered list first.
const LazyEgoNetworkGraph = dynamic(
  () =>
    import("@/components/relations/EgoNetworkGraph").then(
      (mod) => mod.EgoNetworkGraph
    ),
  { ssr: false }
);

const LazySourceChainSheet = dynamic(
  () => import("@/components/source-transparency/SourceChainSheet"),
  { ssr: false }
);

export interface RelationsListWithSourceSheetProps {
  items: RelationListItem[];
  /** The people the ego-network graph is centered on (Epic 11, Story 11.11). */
  center: EgoNetworkGraphCenter;
  neighborLangById?: Partial<Record<PeopleId, string>>;
  initialActiveTypes?: RelationsListProps["initialActiveTypes"];
  className?: string;
  language?: Language;
}

/**
 * Client boundary pairing `RelationsList` (SSR-rendered by the caller) with
 * the `SourceChainSheet` its `ConfidenceChip`s open (UX-DR48) — the sheet
 * owns no data source of its own beyond what `RelationListItem` already
 * carries, so per-relation `sources` stay empty rather than invented
 * (FragmentationView precedent, "never invent data").
 */
// @req REQ-097
export function RelationsListWithSourceSheet({
  items,
  center,
  neighborLangById,
  initialActiveTypes,
  className,
  language = "fr",
}: RelationsListWithSourceSheetProps) {
  const copy = relationsCopy[language];
  const router = useRouter();
  const [openRelationId, setOpenRelationId] = useState<string | null>(null);
  const [shouldLoadGraph, setShouldLoadGraph] = useState(false);
  const activeItem = items.find((item) => item.id === openRelationId) ?? null;
  // Radix restores focus to the pre-open element itself, but only if that
  // element is still mounted when its own (deferred) restore fires; since
  // the sheet here is conditionally unmounted by `activeItem` rather than
  // by Radix's own exit transition, we capture and restore explicitly.
  const graphTriggerRef = useRef<(HTMLElement | SVGElement) | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length === 0 || shouldLoadGraph) return;

    const graphContainer = graphContainerRef.current;
    if (!graphContainer) return;

    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setShouldLoadGraph(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        setShouldLoadGraph(true);
        observer.disconnect();
      },
      { rootMargin: "0px", threshold: 0.25 }
    );

    observer.observe(graphContainer);
    return () => observer.disconnect();
  }, [items.length, shouldLoadGraph]);

  // Derived edges have no per-relation sourced explanation (FR73) — only
  // sourced activation opens the sheet.
  function handleEdgeActivate(relationId: string | null) {
    if (!relationId) return;
    const active = document.activeElement;
    graphTriggerRef.current =
      active instanceof HTMLElement || active instanceof SVGElement
        ? active
        : null;
    setOpenRelationId(relationId);
  }

  function handleNodeActivate(peopleId: PeopleId) {
    router.push(getPeopleLinksRoute(language, peopleId));
  }

  useEffect(() => {
    if (openRelationId === null && graphTriggerRef.current) {
      graphTriggerRef.current.focus();
      graphTriggerRef.current = null;
    }
  }, [openRelationId]);

  return (
    <>
      <RelationsList
        items={items}
        onOpenRelation={setOpenRelationId}
        initialActiveTypes={initialActiveTypes}
        className={className}
        language={language}
      />
      {items.length > 0 && (
        <div
          ref={graphContainerRef}
          data-testid="ego-network-graph-container"
          className="mt-afh-md aspect-square w-full max-w-md"
        >
          {shouldLoadGraph ? (
            <LazyEgoNetworkGraph
              center={center}
              edges={items}
              neighborLangById={neighborLangById}
              language={language}
              onEdgeActivate={handleEdgeActivate}
              onNodeActivate={handleNodeActivate}
            />
          ) : null}
        </div>
      )}
      {activeItem && (
        <LazySourceChainSheet
          language={language}
          open={openRelationId !== null}
          onOpenChange={(open) => {
            if (!open) setOpenRelationId(null);
          }}
          assertion={{
            statement:
              activeItem.description ??
              copy.list.linkWith(
                peopleDisplayLabel(
                  activeItem.neighbor.selfAppellation,
                  activeItem.neighbor.nameMain
                )
              ),
            confidenceScore: activeItem.confidence?.score ?? 0,
            sourceCount: activeItem.confidence?.sourceCount ?? 0,
            lastHumanAuditAt: null,
          }}
          sources={[]}
          anchorId={`relation-${activeItem.id}`}
        />
      )}
    </>
  );
}
