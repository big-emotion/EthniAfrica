import type { ReactNode } from "react";

import { ficheCopy } from "@/lib/i18n/copy/fiche";
import type { Language } from "@/types/shared";

export interface FicheFoldProps {
  /** The closed label. It names what it hides, so it states a fact (REQ-153). */
  label: string;
  language: Language;
  children: ReactNode;
}

/**
 * The one control behind which a long chapter keeps what follows its first
 * tile (brief 10 §2, `Main` « Chapitre replié »).
 *
 * It reuses the tile control rather than adding a component: the same worded
 * « + … » / « − replier » pair, both in the markup, the `open` attribute
 * picking the one that shows, so nothing turns and nothing transitions. Native
 * `details` gives keyboard operation and an announced expanded state, and a
 * browser's find-in-page opens it on a match. The chapter around it never
 * closes; only the tiles after its first one do.
 */
// @req REQ-153
export function FicheFold({ label, language, children }: FicheFoldProps) {
  return (
    <details className="ea-fold">
      <summary className="afh-tile-control">
        <span data-when="closed">{label}</span>
        <span data-when="open">{ficheCopy[language].tile.less}</span>
      </summary>
      {children}
    </details>
  );
}
