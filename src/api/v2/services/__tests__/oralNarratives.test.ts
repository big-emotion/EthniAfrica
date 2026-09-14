import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

import { listPublicOralNarratives } from "../oralNarratives";

type FakeQuery = Record<string, ReturnType<typeof vi.fn>>;

function buildListQuery(
  rows: Array<Record<string, unknown>>,
  count: number
): FakeQuery {
  const query: FakeQuery = {} as FakeQuery;
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.neq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.range = vi.fn(() =>
    Promise.resolve({ data: rows, error: null, count })
  );
  return query;
}

describe("oral narratives service", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  // @req REQ-172
  it("lists cleared public narratives linked to the entity, reviewed or not, reviewed first", async () => {
    const query = buildListQuery(
      [
        {
          id: "11111111-1111-1111-1111-111111111111",
          narrative_code: "ORL_YORUBA_MEMORY_001",
          narrator_display_mode: "public_name",
          narrator_display_name: "A. Adeyemi",
          community: "Yoruba",
          language_code: "yor",
          narrative_kind: "memory",
          summary: "A reviewed memory.",
          variant_of: null,
          review_status: "approved",
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          narrative_code: "ORL_YORUBA_MEMORY_003",
          narrator_display_mode: "pseudonym",
          narrator_display_name: "Iya",
          community: "Yoruba",
          language_code: "yor",
          narrative_kind: "tradition",
          summary: "A memory nobody has reviewed yet.",
          variant_of: null,
          review_status: "pending",
        },
      ],
      2
    );
    fromMock.mockReturnValue(query);

    const result = await listPublicOralNarratives({
      entityType: "people",
      entityId: "PPL_YORUBA",
      page: 2,
      perPage: 10,
    });

    expect(fromMock).toHaveBeenCalledWith("oral_narratives");
    const [selected] = query.select.mock.calls[0];
    expect(selected).toContain("review_status");
    for (const withheld of [
      "carrier_ref",
      "approved_by",
      "transcript",
      "collector",
      "media_locator",
      "consent_evidence",
    ]) {
      expect(selected).not.toContain(withheld);
    }
    expect(query.eq).toHaveBeenCalledWith("visibility", "public");
    expect(query.eq).toHaveBeenCalledWith("rights_status", "cleared");
    expect(query.eq).not.toHaveBeenCalledWith("review_status", "approved");
    expect(query.neq).toHaveBeenCalledWith("review_status", "rejected");
    expect(query.eq).toHaveBeenCalledWith(
      "oral_narrative_links.entity_type",
      "people"
    );
    expect(query.eq).toHaveBeenCalledWith(
      "oral_narrative_links.entity_id",
      "PPL_YORUBA"
    );
    expect(query.order.mock.calls.map(([column]) => column)).toEqual([
      "review_status",
      "narrative_code",
    ]);
    expect(query.range).toHaveBeenCalledWith(10, 19);
    expect(result).toEqual({
      data: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          narrativeCode: "ORL_YORUBA_MEMORY_001",
          narratorDisplayName: "A. Adeyemi",
          community: "Yoruba",
          languageCode: "yor",
          narrativeKind: "memory",
          summary: "A reviewed memory.",
          variantOf: null,
          reviewed: true,
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          narrativeCode: "ORL_YORUBA_MEMORY_003",
          narratorDisplayName: "Iya",
          community: "Yoruba",
          languageCode: "yor",
          narrativeKind: "tradition",
          summary: "A memory nobody has reviewed yet.",
          variantOf: null,
          reviewed: false,
        },
      ],
      total: 2,
    });
  });

  // @req REQ-172
  it("never returns the name of a narrator whose identity is withheld", async () => {
    const query = buildListQuery(
      [
        {
          id: "44444444-4444-4444-4444-444444444444",
          narrative_code: "ORL_YORUBA_MEMORY_004",
          narrator_display_mode: "withheld",
          narrator_display_name: "A name that must stay private",
          community: "Yoruba",
          language_code: "yor",
          narrative_kind: "memory",
          summary: "An account whose narrator is withheld.",
          variant_of: null,
          review_status: "pending",
        },
      ],
      1
    );
    fromMock.mockReturnValue(query);

    const result = await listPublicOralNarratives({
      entityType: "people",
      entityId: "PPL_YORUBA",
      page: 1,
      perPage: 20,
    });

    expect(result.data[0].narratorDisplayName).toBeNull();
    expect(JSON.stringify(result)).not.toContain("must stay private");
  });

  // @req REQ-095
  it("keeps published variants as separate public rows", async () => {
    const query = buildListQuery(
      [
        {
          id: "11111111-1111-1111-1111-111111111111",
          narrative_code: "ORL_YORUBA_MEMORY_001",
          narrator_display_name: null,
          community: "Yoruba",
          language_code: "yor",
          narrative_kind: "memory",
          summary: "First public variant.",
          variant_of: null,
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          narrative_code: "ORL_YORUBA_MEMORY_002",
          narrator_display_name: null,
          community: "Yoruba",
          language_code: "yor",
          narrative_kind: "memory",
          summary: "Second public variant.",
          variant_of: "11111111-1111-1111-1111-111111111111",
        },
      ],
      2
    );
    fromMock.mockReturnValue(query);

    const result = await listPublicOralNarratives({
      entityType: "people",
      entityId: "PPL_YORUBA",
      page: 1,
      perPage: 20,
    });

    expect(result.data).toEqual([
      expect.objectContaining({ narrativeCode: "ORL_YORUBA_MEMORY_001" }),
      expect.objectContaining({
        narrativeCode: "ORL_YORUBA_MEMORY_002",
        variantOf: "11111111-1111-1111-1111-111111111111",
      }),
    ]);
    expect(result.total).toBe(2);
  });

  // @req REQ-095
  it("throws when the public narrative query fails", async () => {
    const query = buildListQuery([], 0);
    query.range = vi.fn(() =>
      Promise.resolve({
        data: null,
        error: { message: "database unavailable" },
        count: null,
      })
    );
    fromMock.mockReturnValue(query);

    await expect(
      listPublicOralNarratives({
        entityType: "country",
        entityId: "NGA",
        page: 1,
        perPage: 20,
      })
    ).rejects.toThrow(
      "Failed to list public oral narratives: database unavailable"
    );
  });
});
