import { cn } from "@/lib/utils";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import type { SourceKind } from "@/types/sources";
import type { Language } from "@/types/shared";

/**
 * What kind of source this is — a tradition, an archive, a publication.
 *
 * The reader is told who speaks, never how much to trust them (doctrine §1.1),
 * so this replaced the tier badge on reader surfaces. Square, not a pill:
 * `actions-charter.md` §6 gives radius 0 to the source apparatus, and a pill
 * would read as a removable filter chip.
 */
// @req REQ-161
export function SourceKindBadge({
  kind,
  language = "fr",
  className,
}: {
  kind: SourceKind;
  language?: Language;
  className?: string;
}) {
  return (
    <span
      data-source-kind={kind}
      className={cn(
        "inline-block shrink-0 rounded-none bg-afh-bg-warm px-2 py-0.5 text-afh-eyebrow font-medium text-afh-text-soft",
        className
      )}
    >
      {sourceKindLabel(kind, language)}
    </span>
  );
}
