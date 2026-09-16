import type { FlagAuditEntry } from "@/api/v2/services/auditLog";
import { formatDate } from "@/lib/languageTag";
import { moderationConsoleCopy } from "@/lib/i18n/copy/moderationConsole";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

/**
 * The trail of one report, oldest first.
 *
 * Two rules are rendered here rather than merely respected.
 *
 * **Roles, never people.** A row says « modérateur · rôle admin » because a
 * register has to establish that a decision was taken and at what level of
 * authorisation. Naming who decided adds nothing to that and turns an
 * accountability record into a target. The payload carries no identity to
 * begin with — the service never selects the columns — so this component could
 * not name one if it tried.
 *
 * **A step that has not happened is listed as such.** A trail that stops at
 * "accepted" reads as a correction that shipped. The pending row is the reason
 * the screen exists: it is the visible distance between a decision and a
 * publication.
 */

/** Same shape as the public register's stamp, so the two can be compared. */
const TRAIL_TIMESTAMP: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
};

type TrailEventKey =
  keyof (typeof moderationConsoleCopy)["fr"]["trail"]["events"];

export interface AuditTimelineProps {
  language: Language;
  entries: readonly FlagAuditEntry[];
  /** A step the corpus has not reached, drawn hollow under the recorded ones. */
  pendingEvent?: TrailEventKey;
  /** `unreadable` states that the register failed, which is not an empty trail. */
  state?: "ready" | "loading" | "unreadable";
}

// @req REQ-041
export function AuditTimeline({
  language,
  entries,
  pendingEvent,
  state = "ready",
}: AuditTimelineProps) {
  const copy = moderationConsoleCopy[language].trail;

  if (state === "loading") {
    return (
      <p className="text-afh-caption text-afh-text-soft">{copy.loading}</p>
    );
  }

  if (state === "unreadable") {
    return (
      <p className="text-afh-caption text-afh-text-soft" role="alert">
        {copy.unreadable}
      </p>
    );
  }

  return (
    <>
      <p className="text-afh-caption text-afh-text-soft">
        {copy.timeZoneNote} {copy.rolesNotPeople}
      </p>
      <ol className="mt-afh-md flex flex-col gap-afh-md">
        {entries.map((entry, index) => (
          <TrailRow
            key={`${entry.event}-${entry.occurredAt}-${index}`}
            language={language}
            entry={entry}
          />
        ))}
        {pendingEvent && (
          <PendingRow language={language} event={pendingEvent} />
        )}
      </ol>
    </>
  );
}

/**
 * The marker column and the text column stack at 430 px and sit side by side
 * from the first breakpoint up — one row per transition either way, so a
 * narrow screen never hides a step.
 */
const ROW_LAYOUT =
  "flex flex-col gap-1 min-[480px]:flex-row min-[480px]:items-baseline min-[480px]:gap-afh-md";

function TrailRow({
  language,
  entry,
}: {
  language: Language;
  entry: FlagAuditEntry;
}) {
  const copy = moderationConsoleCopy[language].trail;
  const role = copy.roles[entry.actorRole];

  return (
    <li className={ROW_LAYOUT} data-pending="false">
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-afh-full bg-afh-text-soft min-[480px]:mt-1"
      />
      <span className="text-afh-small font-medium">
        {copy.events[entry.event]}
      </span>
      <time
        className="text-afh-caption text-afh-text-soft"
        dateTime={entry.occurredAt}
      >
        {formatDate(language, new Date(entry.occurredAt), TRAIL_TIMESTAMP)} UTC
      </time>
      <span className="text-afh-caption text-afh-text-soft">
        {entry.authorisationLevel
          ? `${role} · ${copy.level(entry.authorisationLevel)}`
          : role}
      </span>
    </li>
  );
}

function PendingRow({
  language,
  event,
}: {
  language: Language;
  event: TrailEventKey;
}) {
  const copy = moderationConsoleCopy[language].trail;

  return (
    <li className={cn(ROW_LAYOUT, "opacity-60")} data-pending="true">
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-afh-full border border-afh-text-soft min-[480px]:mt-1"
      />
      <span className="text-afh-small font-medium">{copy.events[event]}</span>
      <span className="text-afh-caption text-afh-text-soft">
        {copy.pending}
      </span>
    </li>
  );
}
