/**
 * FicheSequence — the shell every fiche stands in.
 *
 * Globe band, reading rail, dossier — the head having since moved up into the
 * shell's hero plate, which sits above the globe just as the head did and
 * carries the trail beside it. It began (Epic 15 · Story 15.9) as
 * a chapter engine: it asked a composer which chapters an entity had, a
 * registry what rendered each one, and dropped whatever resolved to nothing.
 * The Atlas mockup asks for something simpler than that engine could express —
 * one globe and one parchment — and each of the three fiches reached that
 * shape in turn, until no entity had a chapter left to compose. What the
 * engine did is now done by the parchment itself, which reads every section
 * the chapters used to claim and carries its own reading measure.
 *
 * So this file is the shell and nothing else. It still decides the two things
 * that are genuinely shared: which accent the page is scoped to, and the order
 * globe → rail → dossier.
 */

import type { ReactNode } from "react";

import { ReadingDepthProbe } from "@/components/analytics/ReadingDepthProbe";
import { FicheChapterBar } from "@/components/fiche/FicheChapterBar";
import { ACCENT_CLASS_BY_ENTITY } from "@/components/fiche/ficheAccent";
import { FICHE_RECORD_ANCHOR } from "@/lib/ficheChapters";
import type { FicheEntityType } from "@/types/fiche";
import { cn } from "@/lib/utils";
import { FALLBACK_LOCALE } from "@/lib/locale";
import type { Language } from "@/types/shared";

export { ACCENT_CLASS_BY_ENTITY };

export interface FicheSequenceProps {
  entityType: FicheEntityType;
  /**
   * What the fiche is about. The rail carries the reader's report control
   * (moderation charter §3) and a report needs a subject, so the shell passes
   * the entity's identity down rather than have the rail guess it from a URL.
   */
  entityId?: string;
  entityName?: string;
  /** The entity's dossier — the parchment the page is. */
  record: ReactNode;
  /** The REQ-116 atlas globe (AtlasGlobe), on the DEC-022 Night surface. Omitted entirely when a route has not built one. */
  globe?: ReactNode;
  className?: string;
  language?: Language;
}

// @req REQ-091
export function FicheSequence({
  entityType,
  entityId,
  entityName,
  record,
  globe,
  className,
  language = FALLBACK_LOCALE,
}: FicheSequenceProps) {
  return (
    <div
      data-fiche-sequence=""
      className={cn(
        ACCENT_CLASS_BY_ENTITY[entityType],
        "flex flex-col gap-afh-3xl",
        className
      )}
    >
      {/* No head here. It is the shell's now, in the hero plate above this
          sequence: it was raised at this position to get above the globe, and
          the plate is above the globe too — with the trail beside it and the
          same card every other route opens on. */}
      {globe}
      {/* The rail opens the reading, not the map: pinned here it starts
          following the reader exactly where the parchment starts, and the globe
          keeps the screen to itself while it is the subject. */}
      <FicheChapterBar
        entityId={entityId}
        entityName={entityName}
        language={language}
      />
      {/* Neither the globe nor the parchment is boxed in a measured column.
          The globe runs edge to edge; the parchment carries its own reading
          measure, and a column here would apply a second, wider one on top of
          it. The anchor stays because the globe's facts panel links to it. */}
      {record ? <section id={FICHE_RECORD_ANCHOR}>{record}</section> : null}
      {/* Mounted in the shell rather than in each of the five routes: reading
          depth is a property of a fiche, and a route that forgot the probe
          would go missing from the histogram rather than fail visibly. */}
      <ReadingDepthProbe surface={entityType} />
    </div>
  );
}
