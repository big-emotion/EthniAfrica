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
    const nameRecords = thenableQuery({
      data: [
        {
          id: "name-fang",
          entity_type: "people",
          entity_id: "PPL_FANG",
          name_text: "Pahouin",
          name_type: "exonym",
          language_of_origin: "fra",
          meaning: null,
          period_label: "nineteenth century",
          imposed_by: "French administrators",
          imposition_period: "colonial period",
          why_problematic: "Recorded concern",
          contemporary_usage: "Historical use",
          assertion_id: "assertion-fang",
          sort_rank: 1,
        },
        {
          id: "name-traore",
          entity_type: "patronyme",
          entity_id: "PAT_TRAORE",
          name_text: "Traoré",
          name_type: "surname",
          language_of_origin: null,
          meaning: null,
          period_label: null,
          imposed_by: null,
          imposition_period: null,
          why_problematic: null,
          contemporary_usage: null,
          assertion_id: "assertion-traore",
          sort_rank: 0,
        },
      ],
      error: null,
    });
    const assertions = thenableQuery({
      data: [
        {
          id: "assertion-fang",
          entity_type: "people",
          entity_id: "PPL_FANG",
          field_path: "names.exonym.pahouin",
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
          statement: "Traoré is an attested spelling.",
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
    const byTable = {
      name_records: nameRecords,
      assertions,
      confidence_scores: confidence,
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
      "name_records",
      "assertions",
      "confidence_scores",
      "sources",
    ]);
    expect(nameRecords.in).toHaveBeenCalledWith("entity_type", [
      "people",
      "patronyme",
    ]);
    expect(nameRecords.in).toHaveBeenCalledWith("entity_id", [
      "PPL_FANG",
      "PAT_TRAORE",
    ]);
    expect(sources.in).toHaveBeenCalledWith("id", [
      "source-a",
      "source-c",
      "source-b",
    ]);

    const fang = result.get(searchNamingKey("people", "PPL_FANG"));
    expect(fang?.records).toHaveLength(1);
    expect(fang?.records[0]).toMatchObject({
      form: "Pahouin",
      problematic: true,
      usedToday: true,
      claimStatus: "contested",
    });
    expect(fang?.records[0].evidence[0].sources.map(({ id }) => id)).toEqual([
      "source-b",
      "source-a",
    ]);
    expect(fang?.records[0].evidence[0].standing).toBe("official");
    expect(fang?.records[0].evidence[0].sources[0]).toMatchObject({
      tier: "needs_review",
      author: "A. Writer",
      page: "12",
      reviewedNarrative: true,
    });
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
      name_records: thenableQuery({
        data: [
          {
            id: "name-one",
            entity_type: "people",
            entity_id: "PPL_ONE",
            name_text: "One",
            name_type: "endonym",
            assertion_id: "assertion-one",
            sort_rank: 0,
          },
        ],
        error: null,
      }),
      assertions: thenableQuery({
        data: [
          {
            id: "assertion-one",
            entity_type: "people",
            entity_id: "PPL_ONE",
            field_path: "content.appellations.selfAppellation",
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
      [subject("people", "PPL_ONE")],
      client as never
    );

    const one = result.get(searchNamingKey("people", "PPL_ONE"));
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
