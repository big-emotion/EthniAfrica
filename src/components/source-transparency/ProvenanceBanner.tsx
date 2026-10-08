import { ActionLink } from "@/components/ui/ActionLink";
import { formatDate } from "@/lib/languageTag";
import { provenanceCopy } from "@/lib/i18n/copy/provenance";
import { cn } from "@/lib/utils";
import type { ProvenanceCensus } from "@/api/v2/schemas/confidence";
import type { Language } from "@/types/shared";

/**
 * ProvenanceBanner — a census at the head of a fiche, and never a score.
 *
 * Why it exists at all: the brand charter says every claim carries its
 * provenance, visible. Measured, that was true of four components
 * on the peoples surface and one on the patronymes surface, and of exactly
 * zero components on countries, language families and languages — the three
 * surfaces a search engine lands on first.
 *
 * Why it counts instead of scoring. A single figure at the head of a fiche
 * averages an identity chapter resting on `official` sources with an
 * oral-tradition chapter resting on `unverified` ones. The number describes
 * neither chapter, and it is the one figure the reader carries away. On an
 * atlas whose whole argument is provenance, the aggregate is the most elegant
 * way to lose it. So the banner states what the fiche is made of and lets the
 * reader weigh it.
 *
 * Why it names no standing. Doctrine §1.1 (operator ruling, 2026-10-08):
 * the reader never sees a source's tier. The banner used to open into a gold
 * per-tier census the moment one assertion was unverified; that was the tier
 * scale printed by another name, so it now reads the same on every fiche —
 * how much is recorded, when a human last read it, where the sources are.
 * The standings stay in `census` for the API and the moderators.
 *
 * Why it carries no glyph. The actions charter licenses exactly one, the
 * arrow.
 */

export type ProvenanceBannerProps = {
  language: Language;
  census: ProvenanceCensus;
  /** Where the fiche publishes its own source list. */
  sourcesHref?: string;
};

/** The parchment's sources footer, on all three fiche surfaces. */
const DEFAULT_SOURCES_HREF = "#sources";

// The audit stamp is a date, not an instant. Pinning the formatter to UTC
// keeps a reader west of Greenwich from being shown the day before.
const AUDIT_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

// @req REQ-019
export function ProvenanceBanner({
  language,
  census,
  sourcesHref = DEFAULT_SOURCES_HREF,
}: ProvenanceBannerProps) {
  // A census of nothing is not a census. What a fiche's silence is owed is
  // ruled by the atlas charter's own doctrine for an unfilled field, not by a
  // banner announcing a total of zero.
  if (census.assertionCount === 0) return null;

  const copy = provenanceCopy[language];

  const auditedAt = census.lastHumanAuditAt
    ? copy.lastHumanAudit(
        formatDate(language, new Date(census.lastHumanAuditAt), AUDIT_DATE)
      )
    : copy.neverAudited;

  return (
    <aside
      role="region"
      aria-label={copy.region}
      className={cn(
        "afh-provenance-banner",
        "max-w-[var(--afh-measure-prose)] rounded-[var(--afh-radius-0)]",
        "border px-4 py-3 text-afh-small",
        "bg-transparent border-[var(--afh-border)] text-[color:var(--afh-text-soft)]"
      )}
    >
      <p className="font-medium">
        {copy.assertionCount(census.assertionCount)}
      </p>

      <p>{auditedAt}</p>

      <ActionLink href={sourcesHref} className="mt-1">
        {copy.viewSources}
      </ActionLink>
    </aside>
  );
}
