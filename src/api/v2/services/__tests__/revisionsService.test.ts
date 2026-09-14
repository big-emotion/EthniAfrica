import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

import { getRevisionSnapshot, getPeopleRevisionSnapshot } from "../revisions";

type FakeQuery = Record<string, ReturnType<typeof vi.fn>>;

const ENTITY_ID = "PPL_YORUBA";
const SNAPSHOT: Record<string, unknown> = {
  id: "PPL_YORUBA",
  name: "Yoruba",
  demographics: {
    total_population: 45000000,
    distribution: [{ country: "NGA", percentage: 85.0 }],
  },
  sources: [{ id: "src-1", tier: 1, url: "https://example.org/yoruba" }],
};
const DOCTRINE_VERSION_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const DOCTRINE_REFERENCE = {
  slug: "classifications-contestees",
  version: 42,
};

function buildSelectQuery(
  row: Record<string, unknown> | null,
  error: { message: string } | null = null
): FakeQuery {
  const q: FakeQuery = {} as FakeQuery;
  q.select = vi.fn(() => q);
  q.eq = vi.fn(() => q);
  q.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: error ? null : row, error })
  );
  return q;
}

describe("getRevisionSnapshot", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  // @req REQ-025
  it.each([
    ["language_family", "FLG_BANTU"],
    ["people", "PPL_YORUBA"],
    ["country", "NGA"],
  ] as const)(
    "resolves frozen doctrine metadata for a %s revision",
    async (entityType, entityId) => {
      const revisionQuery = buildSelectQuery({
        version: 3,
        snapshot_jsonb: SNAPSHOT,
        published_at: "2026-05-21T10:00:00.000Z",
        doctrine_version_id: DOCTRINE_VERSION_ID,
      });
      const doctrineQuery = buildSelectQuery(DOCTRINE_REFERENCE);

      fromMock.mockImplementation((table: string) =>
        table === "revisions" ? revisionQuery : doctrineQuery
      );

      const result = await getRevisionSnapshot(entityType, entityId, 3);

      expect(result).toEqual({
        data: SNAPSHOT,
        version: 3,
        published_at: "2026-05-21T10:00:00.000Z",
        confidence: null,
        doctrine: DOCTRINE_REFERENCE,
      });
      expect(revisionQuery.select).toHaveBeenCalledWith(
        "version, snapshot_jsonb, published_at, doctrine_version_id"
      );
      expect(revisionQuery.eq).toHaveBeenCalledWith("entity_type", entityType);
      expect(doctrineQuery.select).toHaveBeenCalledWith("slug, version");
      expect(doctrineQuery.eq).toHaveBeenCalledWith("id", DOCTRINE_VERSION_ID);
    }
  );

  // @req REQ-025
  it("returns null doctrine metadata when the revision has no reference", async () => {
    const revisionQuery = buildSelectQuery({
      version: 1,
      snapshot_jsonb: SNAPSHOT,
      published_at: null,
      doctrine_version_id: null,
    });
    fromMock.mockReturnValue(revisionQuery);

    const result = await getRevisionSnapshot("people", ENTITY_ID, 1);

    expect(result?.doctrine).toBeNull();
    expect(fromMock).toHaveBeenCalledTimes(1);
  });

  // @req REQ-025
  it("returns null doctrine metadata when the referenced row does not exist", async () => {
    const revisionQuery = buildSelectQuery({
      version: 2,
      snapshot_jsonb: SNAPSHOT,
      published_at: null,
      doctrine_version_id: DOCTRINE_VERSION_ID,
    });
    const doctrineQuery = buildSelectQuery(null);

    fromMock.mockImplementation((table: string) =>
      table === "revisions" ? revisionQuery : doctrineQuery
    );

    const result = await getRevisionSnapshot("country", "NGA", 2);

    expect(result?.doctrine).toBeNull();
  });

  // @req REQ-025
  it("keeps the people-specific snapshot API compatible", async () => {
    const revisionQuery = buildSelectQuery({
      version: 4,
      snapshot_jsonb: { ...SNAPSHOT, confidence: 0.87 },
      published_at: null,
      doctrine_version_id: DOCTRINE_VERSION_ID,
    });
    const doctrineQuery = buildSelectQuery(DOCTRINE_REFERENCE);

    fromMock.mockImplementation((table: string) =>
      table === "revisions" ? revisionQuery : doctrineQuery
    );

    const result = await getPeopleRevisionSnapshot(ENTITY_ID, 4);

    expect(result?.confidence).toBe(0.87);
    expect(result?.doctrine).toEqual(DOCTRINE_REFERENCE);
    expect(revisionQuery.eq).toHaveBeenCalledWith("entity_type", "people");
  });
});
