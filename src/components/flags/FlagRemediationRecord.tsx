import { ActionLink } from "@/components/ui/ActionLink";
import { formatDate } from "@/lib/languageTag";
import { publicFlagsCopy } from "@/lib/i18n/copy/publicFlags";
import { cn } from "@/lib/utils";
import type { FlagRemediationState } from "@/types/module-zero";
import type { Language } from "@/types/shared";

interface FlagRemediationRecordProps {
  state: FlagRemediationState | null;
  /** When the correction reached the published corpus. */
  publishedAt?: string | null;
  /** One reader-facing sentence naming what changed. Published verbatim. */
  summary?: string | null;
  /** When the atlas agreed with the report — `flags.resolved_at`. */
  decidedAt?: string | null;
  changeHref?: string | null;
  language?: Language;
}

/**
 * The remediation axis of a public report (moderation-charter §5).
 *
 * It is the answer to "did the corpus change?", which the disposition badge
 * beside it deliberately no longer gives. Flag 00EZK83QDV was accepted on
 * 2026-09-16 and its page read « acceptée · page mise à jour » while the map
 * it contested was unchanged in production; the label was per-status, so
 * accepting always asserted the update.
 *
 * Sharp corners on purpose: `--afh-radius-0` is the source apparatus, and a
 * published correction is a version banner. The reader tells the atlas's
 * opinion from the atlas's record by shape, before reading a word
 * (actions-charter §6).
 */
// @req REQ-042
export function FlagRemediationRecord({
  state,
  publishedAt,
  summary,
  decidedAt,
  changeHref,
  language = "fr",
}: FlagRemediationRecordProps) {
  // On a rejected report the absence is itself the information. Printing
  // "sans objet" would hand the reader the workshop's bookkeeping.
  if (state === null || state === undefined || state === "not_applicable") {
    return null;
  }

  const copy = publicFlagsCopy[language].remediation;
  const isPublished = state === "published";
  const stateLabel = remediationStateLabel(language, state, publishedAt);

  // Postgres refuses a published row with no date
  // (`flags_remediation_published_check`, migration 092), so a missing label
  // only happens on a hand-built payload — and an undated correction is a
  // claim with no record behind it.
  if (!stateLabel) return null;

  return (
    <section
      data-testid="flag-remediation-record"
      data-remediation-state={state}
      aria-label={copy.label}
      className={cn(
        "rounded-none border-l-4 px-4 py-3 space-y-2",
        isPublished
          ? "border-[color:var(--afh-color-green)] bg-[var(--afh-color-green-bg)] text-[color:var(--afh-color-green)]"
          : "border-[color:var(--afh-color-gold)] bg-[var(--afh-color-gold-bg)] text-[color:var(--afh-color-gold)]"
      )}
    >
      <p className="font-afh text-afh-caption font-bold uppercase tracking-[0.14em]">
        {copy.label}
      </p>
      <p className="font-afh text-afh-small font-semibold">{stateLabel}</p>
      {state === "not_started" && decidedAt && (
        <p className="font-afh text-afh-small">
          {copy.notStarted.body(formatRemediationDate(language, decidedAt))}
        </p>
      )}
      {isPublished && summary && (
        <p
          className="font-afh text-afh-small"
          data-testid="remediation-summary"
        >
          {summary}
        </p>
      )}
      {isPublished && changeHref && (
        <ActionLink href={changeHref}>{copy.published.link}</ActionLink>
      )}
    </section>
  );
}

/**
 * The one line naming the remediation, shared by the report page's record and
 * the queue's mark so the two cannot word the same state differently.
 *
 * Null means there is nothing to state: no remediation, none applicable, or a
 * `published` claim with no publication date behind it.
 */
// @req REQ-014
export function remediationStateLabel(
  language: Language,
  state: FlagRemediationState | null | undefined,
  publishedAt?: string | null
): string | null {
  if (!state || state === "not_applicable") return null;

  const copy = publicFlagsCopy[language].remediation;
  if (state === "in_progress") return copy.inProgress.state;
  if (state === "not_started") return copy.notStarted.state;
  if (!publishedAt) return null;

  return copy.published.state(formatRemediationDate(language, publishedAt));
}

/**
 * UTC, like every other stamp on a report page: a moderation timeline must
 * read the same from every time zone.
 */
function formatRemediationDate(language: Language, iso: string): string {
  return formatDate(language, new Date(iso), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
