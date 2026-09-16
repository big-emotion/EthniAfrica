/**
 * The remediation state, read off a queue row the console did not write.
 *
 * Two spellings are accepted because two layers name the same four columns
 * differently — the payload is camelCase, the table is snake_case — and the
 * case file is rendered from whichever one the queue happens to hand it.
 *
 * Absent is a first-class answer. The columns arrive with their own migration,
 * and a console that throws on a row predating them would take the whole queue
 * down to show a panel.
 */

/** The four the column admits. A fifth value is a state this screen cannot label. */
// @req REQ-042
export const REMEDIATION_STATES = [
  "not_started",
  "in_progress",
  "published",
  "not_applicable",
] as const;

export type RemediationState = (typeof REMEDIATION_STATES)[number];

export interface RemediationSnapshot {
  /** null when the report is not tracked for remediation yet. */
  state: RemediationState | null;
  publishedAt: string | null;
  summary: string | null;
  revisionDraftId: string | null;
}

const UNTRACKED: RemediationSnapshot = {
  state: null,
  publishedAt: null,
  summary: null,
  revisionDraftId: null,
};

function text(
  record: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

// @req REQ-042
export function readRemediation(record: unknown): RemediationSnapshot {
  if (typeof record !== "object" || record === null) return UNTRACKED;

  const row = record as Record<string, unknown>;
  const declared = text(row, "remediationState", "remediation_state");
  const state = REMEDIATION_STATES.includes(declared as RemediationState)
    ? (declared as RemediationState)
    : null;

  return {
    state,
    publishedAt: text(
      row,
      "remediationPublishedAt",
      "remediation_published_at"
    ),
    summary: text(row, "remediationSummary", "remediation_summary"),
    revisionDraftId: text(row, "revisionDraftId", "revision_draft_id"),
  };
}
