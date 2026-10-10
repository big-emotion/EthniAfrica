import { describe, expect, it, vi } from "vitest";

import {
  loadSearchNamingData,
  searchNamingKey,
  type SearchNamingSubjectRef,
} from "@/lib/supabase/queries/afrik/searchNaming";

function thenableQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: PromiseLike<typeof result>["then"];
  } = {
    select: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

function subject(
  type: SearchNamingSubjectRef["type"],
  id: string
): SearchNamingSubjectRef {
  return { type, id };
}

describe("batched search naming data", () => {
  // @req REQ-180
  it("does not query an empty subject set", async () => {
    const client = { from: vi.fn() };

    const result = await loadSearchNamingData([], client as never);

    expect(result.size).toBe(0);
    expect(client.from).not.toHaveBeenCalled();
  });

  // @req REQ-180
  it("hydrates five subject classes without an N+1 query", async () => {
    const assertions = thenableQuery({
      data: [
        {
          id: "assertion-fang",
          entity_type: "people",
          entity_id: "PPL_FANG",
          field_path: "content.appellations.originOfExonyms",
          statement: "Pahouin is recorded for Fang.",
          position: null,
          confidence_level: "contested",
          source_ids: ["source-b", "source-a", "source-b"],
          superseded_by: null,
        },
        {
          id: "assertion-traore",
          entity_type: "patronyme",
          entity_id: "PAT_TRAORE",
          field_path: "spellings.0.traore",
          statement: "Traoré",
          position: null,
          confidence_level: "high",
          source_ids: ["source-a"],
          superseded_by: null,
        },
        {
          id: "assertion-country",
          entity_type: "country",
          entity_id: "NGA",
          field_path: "etymology",
          statement: "The current name is recorded in Portuguese sources.",
          position: null,
          confidence_level: "high",
          source_ids: ["source-a"],
          superseded_by: null,
        },
        {
          id: "assertion-country-history",
          entity_type: "country",
          entity_id: "NGA",
          field_path: "content.historicalNames.colonization",
          statement: "The colonial-era wording is recorded.",
          position: null,
          confidence_level: "high",
          source_ids: ["source-a"],
          superseded_by: null,
        },
        {
          id: "assertion-family",
          entity_type: "language_family",
          entity_id: "FLG_BANTU",
          field_path: "content.decolonialHeader.historicalAppellations.0",
          statement: "The historical wording is attested by an oral account.",
          position: null,
          confidence_level: "medium",
          source_ids: ["source-c"],
          superseded_by: null,
        },
        {
          id: "assertion-language-unsafe",
          entity_type: "language",
          entity_id: "lin",
          field_path: "alternateNames.0",
          statement: "The corpus records this as an exonym.",
          position: null,
          confidence_level: "high",
          source_ids: ["source-a"],
          superseded_by: null,
        },
        {
          id: "assertion-old",
          entity_type: "language",
          entity_id: "lin",
          field_path: "alternateNames.0",
          statement: "Superseded statement",
          position: null,
          confidence_level: "high",
          source_ids: ["source-a"],
          superseded_by: "assertion-new",
        },
        {
          id: "assertion-unrelated",
          entity_type: "people",
          entity_id: "PPL_FANG",
          field_path: "content.demography.totalPopulation",
          statement: "An unrelated fact.",
          position: null,
          confidence_level: "high",
          source_ids: ["source-unrelated"],
          superseded_by: null,
        },
      ],
      error: null,
    });
    const confidence = thenableQuery({
      data: [
        {
          entity_type: "people",
          entity_id: "PPL_FANG",
          score: 0.8,
          last_human_audit_at: "2026-09-01",
        },
        {
          entity_type: "patronyme",
          entity_id: "PAT_TRAORE",
          score: 0.7,
          last_human_audit_at: null,
        },
      ],
      error: null,
    });
    const sources = thenableQuery({
      data: [
        {
          id: "source-a",
          title: "Official register",
          author: null,
          url: "https://example.org/a",
          year: 1972,
          page: null,
          tier: "official",
          source_kind: "archive",
          oral_narratives: null,
        },
        {
          id: "source-b",
          title: "Unclassified note",
          author: "A. Writer",
          url: null,
          year: null,
          page: "12",
          tier: "legacy-tier",
          source_kind: "oral_tradition",
          oral_narratives: { review_status: "approved" },
        },
        {
          id: "source-c",
          title: "Pending oral account",
          author: null,
          url: null,
          year: null,
          page: null,
          tier: "unverified",
          source_kind: "oral_tradition",
          oral_narratives: [{ review_status: "pending" }],
        },
      ],
      error: null,
    });
    // REQ-196: a people's names are read from the fiche's projection — its
    // nameHistory, and the name index the appellations add to it.
    const histories = thenableQuery({
      data: [
        {
          id: "PPL_FANG",
          name_history: null,
          name_index: [
            {
              nameText: "Pahouin",
              nameType: "exonym",
              origin: "appellation",
              languageOfOrigin: null,
              meaning: null,
              periodLabel: null,
              imposedBy: null,
              impositionPeriod: null,
              whyProblematic: "Recorded concern",
              contemporaryUsage: "Historical use",
              sortRank: 1,
              sources: [
                {
                  title: "Official register",
                  url: "https://example.org/a",
                  year: null,
                  tier: "official",
                },
              ],
            },
          ],
        },
      ],
      error: null,
    });
    const byTable = {
      assertions,
      confidence_scores: confidence,
      afrik_peoples: histories,
      sources,
    };
    const client = {
      from: vi.fn((table: keyof typeof byTable) => byTable[table]),
    };

    const result = await loadSearchNamingData(
      [
        subject("people", "PPL_FANG"),
        subject("languageFamily", "FLG_BANTU"),
        subject("country", "NGA"),
        subject("language", "lin"),
        subject("patronyme", "PAT_TRAORE"),
        subject("people", "PPL_FANG"),
      ],
      client as never
    );

    expect(client.from.mock.calls.map(([table]) => table)).toEqual([
      "assertions",
      "confidence_scores",
      "afrik_peoples",
      "sources",
    ]);
    expect(histories.in).toHaveBeenCalledWith("id", ["PPL_FANG"]);
    expect(sources.in).toHaveBeenCalledWith("id", [
      "source-a",
      "source-b",
      "source-c",
    ]);

    const fang = result.get(searchNamingKey("people", "PPL_FANG"));
    expect(fang?.records).toHaveLength(1);
    expect(fang?.records[0]).toMatchObject({
      form: "Pahouin",
      kind: "exonym",
      problematic: true,
      usedToday: true,
    });
    // A derived name cites the fiche's sources, embedded in the index.
    expect(fang?.records[0].evidence[0].sources).toEqual([
      expect.objectContaining({
        title: "Official register",
        tier: "official",
      }),
    ]);
    expect(fang?.records[0].evidence[0].standing).toBe("official");
    const fangAssertion = fang?.evidence.find(
      ({ assertion }) => assertion.id === "assertion-fang"
    );
    expect(fangAssertion?.sources.map(({ id }) => id)).toEqual([
      "source-b",
      "source-a",
    ]);
    expect(fangAssertion?.sources[0]).toMatchObject({
      tier: "needs_review",
      author: "A. Writer",
      page: "12",
      reviewedNarrative: true,
      // REQ-161: the sheet names the kind of each source.
      sourceKind: "oral_tradition",
    });
    expect(fangAssertion?.sources[1]).toMatchObject({
      sourceKind: "archive",
    });
    // REQ-196: a family name's spellings are read from their assertions.
    const traore = result.get(searchNamingKey("patronyme", "PAT_TRAORE"));
    expect(traore?.records).toEqual([
      expect.objectContaining({
        id: "assertion-traore",
        entityType: "patronyme",
        form: "Traoré",
        kind: "surname",
      }),
    ]);
    expect(traore?.records[0].evidence[0].assertion.id).toBe(
      "assertion-traore"
    );
    const country = result.get(searchNamingKey("country", "NGA"));
    expect(country?.evidence.map(({ assertion }) => assertion.id)).toEqual([
      "assertion-country-history",
      "assertion-country",
    ]);
    expect(country?.evidence[0].assertion).not.toHaveProperty(
      "confidenceScore"
    );
    expect(
      result.get(searchNamingKey("languageFamily", "FLG_BANTU"))?.evidence[0]
        .sources[0]
    ).toMatchObject({ reviewedNarrative: false });
    expect(result.get(searchNamingKey("language", "lin"))?.evidence).toEqual(
      []
    );
    expect(sources.select).toHaveBeenCalledWith(
      expect.stringContaining("oral_narratives(review_status)")
    );
  });

  // @req REQ-180
  it("does not fabricate evidence when a cited source is missing", async () => {
    const byTable = {
      assertions: thenableQuery({
        data: [
          {
            id: "assertion-one",
            entity_type: "patronyme",
            entity_id: "PAT_ONE",
            field_path: "spellings.0.one",
            statement: "One",
            position: null,
            confidence_level: "high",
            source_ids: ["missing-source"],
            superseded_by: null,
          },
        ],
        error: null,
      }),
      confidence_scores: thenableQuery({ data: [], error: null }),
      sources: thenableQuery({ data: [], error: null }),
    };
    const client = {
      from: vi.fn((table: keyof typeof byTable) => byTable[table]),
    };

    const result = await loadSearchNamingData(
      [subject("patronyme", "PAT_ONE")],
      client as never
    );

    const one = result.get(searchNamingKey("patronyme", "PAT_ONE"));
    expect(one?.records[0].evidence).toEqual([]);
    expect(one?.evidence).toEqual([]);
  });

  // @req REQ-180
  it("propagates a failed batch instead of turning it into a knowledge gap", async () => {
    const client = {
      from: vi.fn(() =>
        thenableQuery({
          data: null,
          error: { message: "database unavailable" },
        })
      ),
    };

    await expect(
      loadSearchNamingData([subject("people", "PPL_FANG")], client as never)
    ).rejects.toThrow("database unavailable");
  });
});
