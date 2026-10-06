import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { readSearchQueryReport } from "../searchQueryReport";

interface LogRow {
  query: string;
  result_count: number;
  lang: "fr" | "en";
  created_at: string;
}

const NOW = new Date("2026-10-06T12:00:00.000Z");

function at(minutes: number, seconds = 0): string {
  return new Date(Date.UTC(2026, 9, 5, 10, minutes, seconds)).toISOString();
}

function row(
  query: string,
  resultCount: number,
  createdAt: string,
  lang: "fr" | "en" = "fr"
): LogRow {
  return { query, result_count: resultCount, lang, created_at: createdAt };
}

/**
 * Serves `rows` newest first, one `.range()` at a time, the way PostgREST
 * answers the ordered query the service sends. Filters are recorded, not
 * applied: what the database does with them is not this suite's subject.
 */
function fakeLog(rows: LogRow[], error: { message: string } | null = null) {
  const newestFirst = [...rows].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "gte", "eq", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.range = vi.fn((from: number, to: number) =>
    Promise.resolve(
      error
        ? { data: null, error }
        : { data: newestFirst.slice(from, to + 1), error: null }
    )
  );
  const from = vi.fn(() => builder);
  mocks.createAdminClient.mockReturnValue({ from });
  return { from, builder };
}

describe("readSearchQueryReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-002
  it("counts a typed word once, not once per keystroke prefix the autocomplete logged", async () => {
    fakeLog([
      row("pe", 40, at(0, 0)),
      row("peu", 12, at(0, 1)),
      row("peul", 0, at(0, 2)),
    ]);

    const report = await readSearchQueryReport({ periodDays: 30, now: NOW });

    expect(report.totalSearches).toBe(1);
    expect(report.rowsRead).toBe(3);
    expect(report.mostFrequent.map((entry) => entry.query)).toEqual(["peul"]);
  });

  // @req REQ-002
  it("keeps a shorter search that nobody extended within the typing window", async () => {
    fakeLog([row("dogon", 3, at(0)), row("dogonland", 0, at(10))]);

    const report = await readSearchQueryReport({ periodDays: 30, now: NOW });

    expect(report.totalSearches).toBe(2);
    expect(report.mostFrequent.map((entry) => entry.query).sort()).toEqual([
      "dogon",
      "dogonland",
    ]);
  });

  // @req REQ-002
  it("lists zero-result searches by count, normalising case and surrounding spaces", async () => {
    fakeLog([
      row(" Peul ", 0, at(1)),
      row("peul", 0, at(5)),
      row("bamileke", 0, at(9)),
      row("yoruba", 8, at(13)),
    ]);

    const report = await readSearchQueryReport({ periodDays: 30, now: NOW });

    expect(report.zeroResults).toEqual([
      { query: "peul", count: 2, lastSeen: at(5) },
      { query: "bamileke", count: 1, lastSeen: at(9) },
    ]);
  });

  // @req REQ-002
  it("ranks frequent searches with their share of zero results and the header totals", async () => {
    fakeLog([
      row("wolof", 5, at(1)),
      row("wolof", 0, at(5)),
      row("wolof", 5, at(9)),
      row("wolof", 5, at(13)),
      row("haoussa", 0, at(17)),
    ]);

    const report = await readSearchQueryReport({ periodDays: 30, now: NOW });

    expect(report.mostFrequent[0]).toEqual({
      query: "wolof",
      count: 4,
      zeroResultShare: 0.25,
      lastSeen: at(13),
    });
    expect(report.totalSearches).toBe(5);
    expect(report.distinctQueries).toBe(2);
    expect(report.zeroResultShare).toBeCloseTo(2 / 5);
  });

  // @req REQ-002
  it("reads only the chosen period, and filters on the locale only when one is chosen", async () => {
    const { from, builder } = fakeLog([]);

    await readSearchQueryReport({ periodDays: 7, now: NOW });
    expect(from).toHaveBeenCalledWith("search_query_log");
    expect(builder.gte).toHaveBeenCalledWith(
      "created_at",
      "2026-09-29T12:00:00.000Z"
    );
    expect(builder.eq).not.toHaveBeenCalled();

    await readSearchQueryReport({ periodDays: 7, lang: "en", now: NOW });
    expect(builder.eq).toHaveBeenCalledWith("lang", "en");
  });

  // @req REQ-002
  it("reports an empty period as zeros rather than dividing by nothing", async () => {
    fakeLog([]);

    const report = await readSearchQueryReport({ periodDays: 30, now: NOW });

    expect(report).toMatchObject({
      totalSearches: 0,
      distinctQueries: 0,
      zeroResultShare: 0,
      zeroResults: [],
      mostFrequent: [],
      truncated: false,
    });
  });

  // @req REQ-002
  it("fails loudly when the log cannot be read, instead of showing an empty period", async () => {
    fakeLog([], { message: "permission denied" });

    await expect(
      readSearchQueryReport({ periodDays: 30, now: NOW })
    ).rejects.toThrow("permission denied");
  });
});
