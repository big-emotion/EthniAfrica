import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { cn } from "@/lib/utils";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import { sourceDiamondCopy } from "@/lib/i18n/copy/sourceDiamond";
import {
  SOURCE_KIND_FAMILIES,
  sourceKindFamily,
} from "@/lib/sources/sourceKindFamily";
import type { SourceKind } from "@/types/sources";
import type { Language } from "@/types/shared";

export interface SourceDiamondProps {
  /** The passage's source kinds, in the order the fiche cites them. */
  kinds: readonly SourceKind[];
  language: Language;
  onOpen: () => void;
  id?: string;
}

/**
 * A small coloured diamond set after the sentence it backs (ETNI-2015); its
 * colour tells the source's type, and tapping it opens the sources.
 *
 * One diamond per passage, coloured by the first source the fiche cites. A
 * row of diamonds, one per type, would read as a score — three marks looking
 * stronger than one — which is the ranking doctrine §1.1 rules out, and it
 * would put several buttons opening the same sheet in front of a screen
 * reader. The other sources are counted in the button's name and listed,
 * each with its own type, in the sheet.
 *
 * The visible diamond stays small; the button around it is the 24px target.
 */
// @req REQ-198
// @req REQ-194
export function SourceDiamond({
  kinds,
  language,
  onOpen,
  id,
}: SourceDiamondProps) {
  if (kinds.length === 0) return null;
  const copy = sourceDiamondCopy[language];
  const lead = kinds[0];

  return (
    <button
      type="button"
      id={id}
      data-family={sourceKindFamily(lead)}
      aria-label={copy.open(sourceKindLabel(lead, language), kinds.length - 1)}
      onClick={onOpen}
      className={cn("afh-source-diamond", CHARTER_FOCUS_RING)}
    >
      <span className="afh-source-diamond-mark" aria-hidden="true" />
    </button>
  );
}

/** What each diamond colour means, for the source sheet. */
// @req REQ-198
export function SourceDiamondLegend({ language }: { language: Language }) {
  const copy = sourceDiamondCopy[language];
  const headingId = "afh-source-diamond-legend-heading";

  return (
    <section
      aria-labelledby={headingId}
      data-testid="section-source-diamond-legend"
      className="afh-source-diamond-legend"
    >
      <h3 id={headingId} className="text-afh-small font-semibold text-afh-text">
        {copy.legendHeading}
      </h3>
      <ul>
        {SOURCE_KIND_FAMILIES.map((family) => (
          <li key={family} data-family={family}>
            <span className="afh-source-diamond-mark" aria-hidden="true" />
            {copy.families[family]}
          </li>
        ))}
      </ul>
    </section>
  );
}
