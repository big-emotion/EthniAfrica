import { describe, expect, it } from "vitest";

import { readRemediation } from "@/components/admin/remediation";

/**
 * The console reads a remediation state it does not write, from columns
 * another change is adding. Every branch below exists so the case file opens
 * on a queue row that predates those columns.
 */
describe("readRemediation", () => {
  // @req REQ-042
  it("reports an untracked remediation rather than inventing a state", () => {
    expect(readRemediation({ id: "flag-1" })).toEqual({
      state: null,
      publishedAt: null,
      summary: null,
      revisionDraftId: null,
    });
    expect(readRemediation(null).state).toBeNull();
    expect(readRemediation(undefined).state).toBeNull();
  });

  // @req REQ-042
  it("reads the state under either the payload or the column spelling", () => {
    expect(readRemediation({ remediationState: "in_progress" }).state).toBe(
      "in_progress"
    );
    expect(readRemediation({ remediation_state: "published" }).state).toBe(
      "published"
    );
  });

  // @req REQ-042
  it("carries the publication stamp, the summary and the linked revision", () => {
    const snapshot = readRemediation({
      remediationState: "published",
      remediationPublishedAt: "2026-09-16T09:36:00.000Z",
      remediationSummary: "Western Sahara cut at 27°40'N.",
      revision_draft_id: "7b1d2a8e-0000-4000-8000-00000000abcd",
    });

    expect(snapshot).toEqual({
      state: "published",
      publishedAt: "2026-09-16T09:36:00.000Z",
      summary: "Western Sahara cut at 27°40'N.",
      revisionDraftId: "7b1d2a8e-0000-4000-8000-00000000abcd",
    });
  });

  /**
   * A state outside the four the column admits is a state this screen cannot
   * label. Rendering it raw would put an unexplained word where a reader
   * expects a status.
   */
  // @req REQ-042
  it("treats a state outside the vocabulary as untracked", () => {
    expect(readRemediation({ remediationState: "done" }).state).toBeNull();
    expect(readRemediation({ remediationState: 3 }).state).toBeNull();
  });
});
