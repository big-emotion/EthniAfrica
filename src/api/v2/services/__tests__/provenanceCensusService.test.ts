import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

import { getProvenanceCensusFor } from "../confidence";

type Row = Record<string, unknown>;

/**
 * One fake per table, wired the way the service reads each of them: the two
 * list reads resolve when awaited, the audit read resolves on `maybeSingle`.
 */
function fakeSupabase(tables: {
  assertions?: Row[];
  sources?: Row[];
  confidence_scores?: Row | null;
}) {
  return (table: string) => {
    if (table === "confidence_scores") {
      const query: Record<string, unknown> = {};
      query.select = () => query;
      query.eq = () => query;
      query.maybeSingle = () =>
        Promise.resolve({
          data: tables.confidence_scores ?? null,
          error: null,
        });
      return query;
    }
    const rows = table === "assertions" ? tables.assertions : tables.sources;
    const result = Promise.resolve({ data: rows ?? [], error: null });
    const query: Record<string, unknown> = {
      then: result.then.bind(result),
      catch: result.catch.bind(result),
    };
    query.select = () => query;
    query.eq = () => query;
    query.in = () => query;
    query.limit = () => query;
    return query;
  };
}

describe("the provenance census service", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  // @req REQ-084
  it("counts every assertion once, under the standing of its strongest source", async () => {
    fromMock.mockImplementation(
      fakeSupabase({
        assertions: [
          { id: "a1", source_ids: ["s-official", "s-blog"] },
          { id: "a2", source_ids: ["s-blog"] },
          { id: "a3", source_ids: ["s-book"] },
          { id: "a4", source_ids: ["s-pending"] },
        ],
        sources: [
          { id: "s-official", tier: "official" },
          { id: "s-book", tier: "referenced" },
          { id: "s-blog", tier: "unverified" },
          { id: "s-pending", tier: "needs_review" },
        ],
        confidence_scores: { last_human_audit_at: "2026-03-12T00:00:00.000Z" },
      })
    );

    const census = await getProvenanceCensusFor("country", "CIV");

    expect(census.standings).toEqual({
      official: 1,
      referenced: 1,
      unverified: 1,
      needs_review: 1,
    });
    expect(census.assertionCount).toBe(4);
    expect(census.lastHumanAuditAt).toBe("2026-03-12T00:00:00.000Z");
  });

  // @req REQ-084
  it("reads a language family under its underscored fabric entity type", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    fromMock.mockImplementation((table: string) => {
      const base = fakeSupabase({ assertions: [], sources: [] })(table);
      const select = base.select as () => typeof base;
      base.select = () => {
        const q = select();
        q.eq = (column: string, value: unknown) => {
          if (table === "assertions") eqCalls.push([column, value]);
          return q;
        };
        return q;
      };
      return base;
    });

    await getProvenanceCensusFor("language-family", "FLG_BANTU");

    expect(eqCalls).toContainEqual(["entity_type", "language_family"]);
    expect(eqCalls).toContainEqual(["entity_id", "FLG_BANTU"]);
  });

  // @req REQ-084
  it("treats a source the database left untiered as awaiting review", async () => {
    fromMock.mockImplementation(
      fakeSupabase({
        assertions: [{ id: "a1", source_ids: ["s-null"] }],
        sources: [{ id: "s-null", tier: null }],
      })
    );

    const census = await getProvenanceCensusFor("language", "bam");

    expect(census.standings.needs_review).toBe(1);
    expect(census.standings.unverified).toBe(0);
  });

  // @req REQ-084
  it("leaves an assertion citing nothing out of the census rather than inventing a standing for it", async () => {
    fromMock.mockImplementation(
      fakeSupabase({
        assertions: [
          { id: "a1", source_ids: ["s-book"] },
          { id: "a2", source_ids: [] },
          { id: "a3", source_ids: null },
        ],
        sources: [{ id: "s-book", tier: "referenced" }],
      })
    );

    const census = await getProvenanceCensusFor("people", "PPL_SHONA");

    expect(census.assertionCount).toBe(1);
    expect(census.standings.referenced).toBe(1);
  });

  // @req REQ-084
  it("returns an empty census for a fiche the fabric records nothing about", async () => {
    fromMock.mockImplementation(fakeSupabase({ assertions: [] }));

    const census = await getProvenanceCensusFor("country", "ZZZ");

    expect(census.assertionCount).toBe(0);
    expect(census.standings).toEqual({
      official: 0,
      referenced: 0,
      unverified: 0,
      needs_review: 0,
    });
    expect(census.lastHumanAuditAt).toBeNull();
  });

  // @req REQ-084
  it("throws when the fabric read fails, rather than reporting an empty corpus", async () => {
    fromMock.mockImplementation(() => {
      const result = Promise.resolve({
        data: null,
        error: { message: "db down" },
      });
      const query: Record<string, unknown> = {
        then: result.then.bind(result),
        catch: result.catch.bind(result),
      };
      query.select = () => query;
      query.eq = () => query;
      query.in = () => query;
      query.limit = () => query;
      return query;
    });

    await expect(getProvenanceCensusFor("country", "CIV")).rejects.toThrow(
      /db down/
    );
  });
});
