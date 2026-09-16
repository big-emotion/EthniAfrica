"use client";

import { Badge } from "@/components/ui/badge";
import { publicFlagsCopy } from "@/lib/i18n/copy/publicFlags";
import { formatDate } from "@/lib/languageTag";
import type { FlagRow } from "@/types/module-zero";
import type { Language } from "@/types/shared";

type FlagStatus = FlagRow["status"];

interface FlagPublicStatusProps {
  status: FlagStatus;
  moderatorNotes?: string | null;
  /** `flags.resolved_at` — dates the moderation signature. */
  resolvedAt?: string | null;
  language?: Language;
}

/**
 * The states the charter requires a note on (§5). `withdrawn` is terminal too,
 * but the contributor withdrew it themselves and there is no decision to
 * explain.
 */
const DECIDED_STATUSES: ReadonlyArray<FlagStatus> = [
  "accepted",
  "rejected",
  "duplicate",
];

const STATUS_CONFIG: Record<FlagStatus, { style: React.CSSProperties }> = {
  open: {
    style: { backgroundColor: "#FEF3C7", color: "#92400E" },
  },
  under_review: {
    style: { backgroundColor: "#FEF3C7", color: "#92400E" },
  },
  accepted: {
    style: { backgroundColor: "#D1FAE5", color: "#065F46" },
  },
  rejected: {
    style: { backgroundColor: "#F3F4F6", color: "#374151" },
  },
  duplicate: {
    style: { backgroundColor: "#F3F4F6", color: "#374151" },
  },
  withdrawn: {
    style: { backgroundColor: "#F3F4F6", color: "#6B7280" },
  },
};

/**
 * The disposition of a public report: what the atlas thinks of the remark.
 *
 * It says nothing about the corpus — that is `FlagRemediationRecord`, and the
 * split exists because this badge used to read « acceptée · page mise à jour »
 * on flag 00EZK83QDV while the map it contested was unchanged in production.
 *
 * Amber = open / under review; green = accepted; grey = rejected / duplicate /
 * withdrawn. The pill is the actions charter's shape for one value among
 * several — an opinion that could have been another.
 *
 * A decided report also carries the moderator's answer, labelled and signed:
 * the page already quotes the reporter, and two unlabelled quotes leave the
 * reader guessing which one is the atlas. The note used to be fetched and
 * dropped on `accepted`, against §5 of the moderation charter.
 */
// @req REQ-014
export function FlagPublicStatus({
  status,
  moderatorNotes,
  resolvedAt,
  language = "fr",
}: FlagPublicStatusProps) {
  const config = STATUS_CONFIG[status];
  const copy = publicFlagsCopy[language];
  const label = copy.statusDescriptions[status];
  const showRationale =
    DECIDED_STATUSES.includes(status) && Boolean(moderatorNotes);

  return (
    <div className="space-y-2">
      <Badge
        variant="outline"
        data-testid="flag-status-badge"
        data-status={status}
        className="border-transparent font-medium text-afh-small px-3 py-1"
        style={config.style}
      >
        {label}
      </Badge>
      {showRationale && (
        <figure className="space-y-1" data-testid="moderation-response">
          <figcaption className="font-afh text-afh-caption font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.moderation.responseLabel}
          </figcaption>
          <blockquote
            className="border-l-4 border-muted pl-4 text-muted-foreground italic text-afh-small"
            role="blockquote"
          >
            {moderatorNotes}
          </blockquote>
          {resolvedAt && (
            <p className="pl-4 font-afh text-afh-caption text-muted-foreground">
              {copy.moderation.signature(
                formatDate(language, new Date(resolvedAt), MODERATION_STAMP)
              )}
            </p>
          )}
        </figure>
      )}
    </div>
  );
}

// UTC, so the signature reads the same from every time zone.
const MODERATION_STAMP: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
};
