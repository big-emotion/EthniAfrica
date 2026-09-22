/**
 * Unit tests for URL health pure helpers used by the confidence recompute job.
 *
 * Covers Story 0.20 (FR31) acceptance criteria:
 *   - A source unreachable for >= 7 consecutive days triggers a penalty
 *   - A source resolvable again for >= 3 consecutive days reverses the penalty
 *   - Boundary conditions (exactly 7 / 6 days, exactly 3 / 2 days)
 *   - Idempotency: re-running the decision step with the same state does not
 *     double-penalize or double-recover.
 */

import { describe, it, expect, vi } from "vitest";
import {
  computeConsecutiveRuns,
  decideAction,
  type HealthRecord,
  type Action,
} from "../lib/urlHealth";
import { fetchByIds } from "../recomputeConfidence";
import type { PageResult } from "../lib/supabasePaging";

/** Build a synthetic NDJSON-equivalent record. */
function rec(
  sourceId: string,
  daysAgo: number,
  status: "ok" | "broken"
): HealthRecord {
  const ts = new Date(Date.UTC(2026, 4, 13)); // reference "today" = 2026-05-13
  ts.setUTCDate(ts.getUTCDate() - daysAgo);
  return {
    source_id: sourceId,
    url: `https://example.com/${sourceId}`,
    status,
    http_code: status === "ok" ? 200 : 503,
    timestamp: ts.toISOString(),
  };
}

const NOW = new Date(Date.UTC(2026, 4, 13));

describe("computeConsecutiveRuns", () => {
  it("returns zero runs for an empty input", () => {
    const runs = computeConsecutiveRuns([], NOW);
    expect(runs.size).toBe(0);
  });

  it("counts a single broken day as a 1-day broken run", () => {
    const records = [rec("s1", 0, "broken")];
    const runs = computeConsecutiveRuns(records, NOW);
    expect(runs.get("s1")).toEqual({
      mostRecentStatus: "broken",
      consecutiveBrokenDays: 1,
      consecutiveOkDays: 0,
    });
  });

  it("counts 7 consecutive broken days correctly", () => {
    const records = Array.from({ length: 7 }, (_, i) => rec("s1", i, "broken"));
    const runs = computeConsecutiveRuns(records, NOW);
    expect(runs.get("s1")?.consecutiveBrokenDays).toBe(7);
    expect(runs.get("s1")?.mostRecentStatus).toBe("broken");
  });

  it("resets the broken run when an ok day appears in between", () => {
    // day 0..2 broken, day 3 ok, day 4..6 broken
    const records = [
      rec("s1", 0, "broken"),
      rec("s1", 1, "broken"),
      rec("s1", 2, "broken"),
      rec("s1", 3, "ok"),
      rec("s1", 4, "broken"),
      rec("s1", 5, "broken"),
      rec("s1", 6, "broken"),
    ];
    const runs = computeConsecutiveRuns(records, NOW);
    // most recent (day 0) is broken, run length back to nearest non-broken (day 3) = 3 days
    expect(runs.get("s1")?.consecutiveBrokenDays).toBe(3);
    expect(runs.get("s1")?.mostRecentStatus).toBe("broken");
  });

  it("counts 3 consecutive ok days after a broken stretch", () => {
    const records = [
      rec("s1", 0, "ok"),
      rec("s1", 1, "ok"),
      rec("s1", 2, "ok"),
      rec("s1", 3, "broken"),
      rec("s1", 4, "broken"),
    ];
    const runs = computeConsecutiveRuns(records, NOW);
    expect(runs.get("s1")?.consecutiveOkDays).toBe(3);
    expect(runs.get("s1")?.mostRecentStatus).toBe("ok");
  });

  it("deduplicates multiple records on the same calendar day", () => {
    // two probes on day 0 (both broken)
    const records = [
      rec("s1", 0, "broken"),
      rec("s1", 0, "broken"),
      rec("s1", 1, "broken"),
    ];
    const runs = computeConsecutiveRuns(records, NOW);
    expect(runs.get("s1")?.consecutiveBrokenDays).toBe(2);
  });

  it("handles multiple sources independently", () => {
    const records = [
      rec("s1", 0, "broken"),
      rec("s2", 0, "ok"),
      rec("s1", 1, "broken"),
      rec("s2", 1, "ok"),
    ];
    const runs = computeConsecutiveRuns(records, NOW);
    expect(runs.get("s1")?.consecutiveBrokenDays).toBe(2);
    expect(runs.get("s2")?.consecutiveOkDays).toBe(2);
  });
});

describe("decideAction", () => {
  it("returns 'penalize' when broken run is exactly 7 and no open flag exists", () => {
    const action: Action = decideAction({
      mostRecentStatus: "broken",
      consecutiveBrokenDays: 7,
      consecutiveOkDays: 0,
      hasOpenFlag: false,
    });
    expect(action).toBe("penalize");
  });

  it("returns 'noop' when broken run is 6 days (does not trigger)", () => {
    const action = decideAction({
      mostRecentStatus: "broken",
      consecutiveBrokenDays: 6,
      consecutiveOkDays: 0,
      hasOpenFlag: false,
    });
    expect(action).toBe("noop");
  });

  it("returns 'penalize' for broken runs longer than 7 if no flag yet", () => {
    const action = decideAction({
      mostRecentStatus: "broken",
      consecutiveBrokenDays: 14,
      consecutiveOkDays: 0,
      hasOpenFlag: false,
    });
    expect(action).toBe("penalize");
  });

  it("is idempotent: returns 'noop' when broken >= 7 but a flag already exists", () => {
    const action = decideAction({
      mostRecentStatus: "broken",
      consecutiveBrokenDays: 10,
      consecutiveOkDays: 0,
      hasOpenFlag: true,
    });
    expect(action).toBe("noop");
  });

  it("returns 'recover' when ok run is exactly 3 and an open flag exists", () => {
    const action = decideAction({
      mostRecentStatus: "ok",
      consecutiveBrokenDays: 0,
      consecutiveOkDays: 3,
      hasOpenFlag: true,
    });
    expect(action).toBe("recover");
  });

  it("returns 'noop' when ok run is 2 days (does not reverse)", () => {
    const action = decideAction({
      mostRecentStatus: "ok",
      consecutiveBrokenDays: 0,
      consecutiveOkDays: 2,
      hasOpenFlag: true,
    });
    expect(action).toBe("noop");
  });

  it("is idempotent: returns 'noop' when ok >= 3 but no flag is open", () => {
    const action = decideAction({
      mostRecentStatus: "ok",
      consecutiveBrokenDays: 0,
      consecutiveOkDays: 5,
      hasOpenFlag: false,
    });
    expect(action).toBe("noop");
  });

  it("returns 'noop' for any other state", () => {
    expect(
      decideAction({
        mostRecentStatus: "ok",
        consecutiveBrokenDays: 0,
        consecutiveOkDays: 0,
        hasOpenFlag: false,
      })
    ).toBe("noop");
  });
});

describe("fetchByIds", () => {
  // The nightly job broke fetching production's ~1000 checked sources in one
  // `.in(...)` call: a request that long comes back 400 Bad Request with no
  // hint that length was the cause (scripts/lib/supabasePaging.ts). This
  // reproduces that scale against a fake `page` callback, without a network.

  // @req REQ-092
  it("returns an empty list without calling page when there are no ids", async () => {
    const page = vi.fn();
    const rows = await fetchByIds<{ id: string }>([], page);
    expect(rows).toEqual([]);
    expect(page).not.toHaveBeenCalled();
  });

  // @req REQ-092
  it("splits an id list too long for one URL into multiple chunked calls", async () => {
    // 60-char ids give a budget of floor(8000 / 63) = 126 per chunk; 300 ids
    // forces three, the way production's checked-source count forces many
    // more than one over real ~36-char UUIDs.
    const ids = Array.from({ length: 300 }, (_, i) =>
      `source-id-${i}`.padEnd(60, "x")
    );
    const calledWithChunks: string[][] = [];
    const page = vi.fn(
      async (idChunk: string[]): Promise<PageResult<{ id: string }>> => {
        calledWithChunks.push(idChunk);
        return { data: idChunk.map((id) => ({ id })), error: null };
      }
    );

    const rows = await fetchByIds<{ id: string }>(ids, page);

    expect(calledWithChunks.length).toBeGreaterThan(1);
    expect(calledWithChunks.flat().sort()).toEqual([...ids].sort());
    expect(rows.map((r) => r.id).sort()).toEqual([...ids].sort());
  });

  // @req REQ-092
  it("pages past a single chunk's row cap instead of dropping the tail", async () => {
    const ids = ["s1"];
    const totalRows = 2500; // more than one 1000-row page
    const page = vi.fn(
      async (
        idChunk: string[],
        from: number,
        to: number
      ): Promise<PageResult<{ id: string }>> => {
        const rows = [];
        for (let i = from; i <= to && i < totalRows; i++) {
          rows.push({ id: `${idChunk[0]}-${i}` });
        }
        return { data: rows, error: null };
      }
    );

    const rows = await fetchByIds<{ id: string }>(ids, page);

    expect(rows).toHaveLength(totalRows);
  });

  // @req REQ-092
  it("propagates a page error instead of silently returning partial rows", async () => {
    const page = vi.fn(async (): Promise<PageResult<{ id: string }>> => ({
      data: null,
      error: new Error("Bad Request"),
    }));

    await expect(fetchByIds<{ id: string }>(["s1"], page)).rejects.toThrow(
      "Bad Request"
    );
  });
});

describe("integration: consecutive-run + decide", () => {
  it("end-to-end: 7 broken days with no flag => penalize", () => {
    const records = Array.from({ length: 7 }, (_, i) => rec("s1", i, "broken"));
    const runs = computeConsecutiveRuns(records, NOW);
    const state = runs.get("s1")!;
    const action = decideAction({ ...state, hasOpenFlag: false });
    expect(action).toBe("penalize");
  });

  it("end-to-end: 7 broken days then 3 ok days, with flag => recover", () => {
    const records = [
      ...Array.from({ length: 7 }, (_, i) => rec("s1", i + 3, "broken")),
      rec("s1", 0, "ok"),
      rec("s1", 1, "ok"),
      rec("s1", 2, "ok"),
    ];
    const runs = computeConsecutiveRuns(records, NOW);
    const state = runs.get("s1")!;
    expect(state.consecutiveOkDays).toBe(3);
    const action = decideAction({ ...state, hasOpenFlag: true });
    expect(action).toBe("recover");
  });

  it("idempotency: re-decide with flag still open returns noop", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      rec("s1", i, "broken")
    );
    const runs = computeConsecutiveRuns(records, NOW);
    const state = runs.get("s1")!;
    // First pass would penalize; second pass (flag already open) is noop.
    expect(decideAction({ ...state, hasOpenFlag: true })).toBe("noop");
  });
});
