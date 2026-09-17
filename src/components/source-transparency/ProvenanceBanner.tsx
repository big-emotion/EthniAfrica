import { ActionLink } from "@/components/ui/ActionLink";
import { formatDate } from "@/lib/languageTag";
import {
  SOURCE_PENDING_REVIEW_LABEL,
  SOURCE_TIER_LABELS,
} from "@/lib/glossaire/vocabularies";
import { provenanceCopy } from "@/lib/i18n/copy/provenance";
import { cn } from "@/lib/utils";
import { SOURCE_TIER_STATES, type SourceTierState } from "@/types/sources";
import type { ProvenanceCensus } from "@/api/v2/schemas/confidence";
import type { Language } from "@/types/shared";

/**
 * ProvenanceBanner — a census at the head of a fiche, and never a score.
 *
 * Why it exists at all: the brand charter says every claim carries its
 * provenance, tiered and visible. Measured, that was true of four components
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
 * Why it is asymmetric. A banner that looks the same on every fiche is
 * furniture by the second visit. Salience is a difference, and this one exists
 * only because discretion is the norm: while every assertion sits at
 * `official` or `referenced` the banner is one quiet line on the parchment's
 * own ground, and it opens into the gold census the moment one assertion is
 * `unverified` or awaiting review.
 *
 * Why it carries no glyph. The actions charter licenses exactly one, the
 * arrow, and the atlas doctrine is that nothing is forbidden and everything is
 * labelled. An alert pictogram on a community or oral account would reinstate
 * in one icon the colonial filter the tier policy exists to refuse — so the
 * loud state states the policy in a sentence instead.
 */

export type ProvenanceBannerProps = {
  language: Language;
  census: ProvenanceCensus;
  /** Where the fiche publishes its own source list. */
  sourcesHref?: string;
};

/** The parchment's sources footer, on all three fiche surfaces. */
const DEFAULT_SOURCES_HREF = "#sources";

/**
 * The standings the loud state exists for. `unverified` is a ruling somebody
 * made and `needs_review` is the absence of one; the reader is owed both, and
 * either is enough to open the census.
 */
const DECLARED_WEAK_STANDINGS: readonly SourceTierState[] = [
  "unverified",
  "needs_review",
];

// The audit stamp is a date, not an instant. Pinning the formatter to UTC
// keeps a reader west of Greenwich from being shown the day before.
const AUDIT_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

function standingLabel(standing: SourceTierState, language: Language): string {
  return standing === "needs_review"
    ? SOURCE_PENDING_REVIEW_LABEL[language]
    : SOURCE_TIER_LABELS[language][standing];
}

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
  const holdsWeakStanding = DECLARED_WEAK_STANDINGS.some(
    (standing) => census.standings[standing] > 0
  );

  const auditedAt = census.lastHumanAuditAt
    ? copy.lastHumanAudit(
        formatDate(language, new Date(census.lastHumanAuditAt), AUDIT_DATE)
      )
    : copy.neverAudited;

  return (
    <aside
      role="region"
      aria-label={copy.region}
      data-provenance-standing={holdsWeakStanding ? "weak" : "settled"}
      className={cn(
        "afh-provenance-banner",
        "max-w-[var(--afh-measure-prose)] rounded-[var(--afh-radius-0)]",
        "border px-4 py-3 text-afh-small",
        // The ground and the rule name their token without the "color:" hint
        // the ink uses. Tailwind accepts both, but the contrast sweep reads
        // any "color:" as a text colour and would measure a ground against
        // itself. Nor can this comment spell the rejected form out: Tailwind
        // scans comments too, and the class it generated from the example
        // failed to parse and took the whole stylesheet down with it.
        holdsWeakStanding
          ? "bg-[var(--afh-color-gold-bg)] border-[var(--afh-color-gold)] text-[color:var(--afh-color-gold)]"
          : "bg-transparent border-[var(--afh-border)] text-[color:var(--afh-text-soft)]"
      )}
    >
      <p className="font-medium">
        {copy.assertionCount(census.assertionCount)}
      </p>

      {holdsWeakStanding && (
        <>
          {/* A wrapping definition list rather than one sentence: at 430 px
              the four pairs re-flow onto as many lines as they need, and no
              count is ever clipped to keep a line. */}
          <dl className="flex flex-wrap gap-x-4 gap-y-1">
            {SOURCE_TIER_STATES.filter(
              (standing) => census.standings[standing] > 0
            ).map((standing) => (
              <div key={standing} className="flex items-baseline gap-1.5">
                <dt>{standingLabel(standing, language)}</dt>
                <dd className="font-semibold tabular-nums">
                  {census.standings[standing]}
                </dd>
              </div>
            ))}
          </dl>
          <p>{copy.unverifiedNotice}</p>
        </>
      )}

      <p>{auditedAt}</p>

      <ActionLink href={sourcesHref} className="mt-1">
        {copy.viewSources}
      </ActionLink>
    </aside>
  );
}
