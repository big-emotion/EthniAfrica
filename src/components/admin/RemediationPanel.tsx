import type { RemediationSnapshot } from "@/components/admin/remediation";
import { formatDate } from "@/lib/languageTag";
import { moderationConsoleCopy } from "@/lib/i18n/copy/moderationConsole";
import type { Language } from "@/types/shared";

/**
 * What the corpus has actually done about a report — read, never written.
 *
 * The console may record an intention (a moderator links a revision) and may
 * not record an outcome. Only the publication of the corpus closes a
 * remediation, so there is no control on this panel: a "page updated" tick-box
 * would let a moderator announce a correction that has not happened, which is
 * the exact defect being repaired on the public register, with a layer of human
 * intention on top to make it credible.
 *
 * Source apparatus, not content: square corners (`--afh-radius-0`) against the
 * case file's 14 px, because this block reports on something outside the
 * screen rather than being part of it.
 */

const PUBLICATION_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
};

export interface RemediationPanelProps {
  language: Language;
  remediation: RemediationSnapshot;
}

// @req REQ-042
export function RemediationPanel({
  language,
  remediation,
}: RemediationPanelProps) {
  const copy = moderationConsoleCopy[language].remediation;

  return (
    <section className="rounded-afh-0 border border-afh-border p-afh-md">
      <div className="flex flex-wrap items-baseline gap-afh-md">
        <h4 className="text-afh-small font-medium">{copy.heading}</h4>
        <span className="rounded-afh-0 border border-afh-border px-2 py-0.5 text-afh-caption text-afh-text-soft">
          {copy.readOnlyMarker}
        </span>
      </div>

      <p className="mt-afh-md text-afh-caption text-afh-text-soft">
        {copy.readOnlyReason}
      </p>

      <dl className="mt-afh-md flex flex-col gap-afh-md text-afh-caption min-[480px]:grid min-[480px]:grid-cols-[auto_1fr] min-[480px]:gap-x-afh-md">
        <dt className="text-afh-text-soft">{copy.stateHeading}</dt>
        <dd>
          {remediation.state ? copy.states[remediation.state] : copy.untracked}
        </dd>

        {remediation.publishedAt && (
          <>
            <dt className="text-afh-text-soft">{copy.publishedAt}</dt>
            <dd>
              <time dateTime={remediation.publishedAt}>
                {formatDate(
                  language,
                  new Date(remediation.publishedAt),
                  PUBLICATION_DATE
                )}
              </time>
            </dd>
          </>
        )}

        {remediation.summary && (
          <>
            <dt className="text-afh-text-soft">{copy.summaryHeading}</dt>
            <dd>{remediation.summary}</dd>
          </>
        )}

        <dt className="text-afh-text-soft">{copy.linkedRevision}</dt>
        <dd className={remediation.revisionDraftId ? "font-mono" : undefined}>
          {remediation.revisionDraftId ?? copy.noLinkedRevision}
        </dd>
      </dl>
    </section>
  );
}
