/**
 * Test-first: service + handler for GET /v2/peoples/{id}/names (Story 8.6,
 * Epic 8 Names Atlas). Route-level tests live in
 * src/app/api/v2/__tests__/names-routes.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ from: fromMock }),
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/supabase/queries/afrik/module-zero-batch", () => ({
  getConfidenceMap: vi.fn(),
}));

import {
  getPeopleNamesDossier,
  PeopleNamesNotFoundError,
} from "../services/names";
import { getPeopleNamesHandler } from "../handlers/peopleNames";
import { getConfidenceMap } from "@/lib/supabase/queries/afrik/module-zero-batch";

type FakeQuery = Record<string, ReturnType<typeof vi.fn>>;

function buildMaybeSingleQuery(row: Record<string, unknown> | null): FakeQuery {
  const query: FakeQuery = {} as FakeQuery;
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn(() => Promise.resolve({ data: row, error: null }));
  return query;
}

const ethnologue = {
  title: "Ethnologue",
  url: "https://ethnologue.com",
  year: null,
  tier: "official",
};

// Name-index entries derived from the fiche's appellations (REQ-196): they
// cite the fiche's sources, embedded, rather than an assertion row.
const endonymEntry = {
  nameText: "Jieng",
  nameType: "endonym",
  origin: "appellation",
  languageOfOrigin: null,
  meaning: null,
  periodLabel: null,
  imposedBy: null,
  impositionPeriod: null,
  whyProblematic: null,
  contemporaryUsage: "primary self-identification",
  sortRank: 0,
  sources: [ethnologue],
};

const exonymEntry = {
  ...endonymEntry,
  nameText: "Dinka",
  nameType: "exonym",
  whyProblematic: "Arabic-origin exonym imposed by colonial administrators",
  contemporaryUsage: "still in common external use",
  sortRank: 1,
};

const peopleRow = {
  id: "PPL_DINKA",
  content: {
    appellations: { selfAppellation: "Jieng" },
  },
  name_index: [endonymEntry, exonymEntry],
};

function mockTables({
  people = peopleRow,
}: {
  people?: Record<string, unknown> | null;
} = {}) {
  fromMock.mockImplementation((table: string) => {
    if (table === "afrik_peoples") return buildMaybeSingleQuery(people);
    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("names service — getPeopleNamesDossier", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.mocked(getConfidenceMap).mockReset();
    vi.mocked(getConfidenceMap).mockResolvedValue(
      new Map([
        [
          "PPL_DINKA",
          {
            entityId: "PPL_DINKA",
            score: 85,
            sourceCount: 2,
            avgSourceQuality: 0.9,
            lastHumanAuditAt: null,
            openFlagCount: 0,
            recomputedAt: "2026-07-31T10:00:00Z",
          },
        ],
      ])
    );
  });

  // @req REQ-092
  it("returns the dossier ordered endonyms-first with per-name sources and confidence", async () => {
    mockTables();

    const result = await getPeopleNamesDossier("PPL_DINKA");

    expect(result.peopleId).toBe("PPL_DINKA");
    expect(result.autonym).toBe("Jieng");
    expect(result.names).toHaveLength(2);
    expect(result.names[0].nameText).toBe("Jieng");
    expect(result.names[0].nameType).toBe("endonym");
    expect(result.names[0].sources).toEqual([
      { id: "PPL_DINKA:name:0:source:0", ...ethnologue },
    ]);
    expect(result.names[0].confidence).toEqual({
      score: 85,
      recomputedAt: "2026-07-31T10:00:00Z",
    });
    expect(result.names[1].nameText).toBe("Dinka");
    expect(result.names[1].nameType).toBe("exonym");
  });

  // @req REQ-092
  it("nests the imposition fields of an exonym", async () => {
    mockTables();

    const result = await getPeopleNamesDossier("PPL_DINKA");

    expect(result.names[1].imposition).toEqual({
      imposedBy: null,
      impositionPeriod: null,
      whyProblematic: "Arabic-origin exonym imposed by colonial administrators",
      contemporaryUsage: "still in common external use",
    });
  });

  // @req REQ-092
  it("nests contemporaryUsage under imposition for a non-imposed endonym (no data loss)", async () => {
    mockTables();

    const result = await getPeopleNamesDossier("PPL_DINKA");

    expect(result.names[0].imposition).toEqual({
      imposedBy: null,
      impositionPeriod: null,
      whyProblematic: null,
      contemporaryUsage: "primary self-identification",
    });
  });

  // @req REQ-092
  it("sets imposition to null when no imposition-related field is present", async () => {
    mockTables({
      people: {
        ...peopleRow,
        name_index: [{ ...endonymEntry, contemporaryUsage: null }],
      },
    });

    const result = await getPeopleNamesDossier("PPL_DINKA");

    expect(result.names[0].imposition).toBeNull();
  });

  // @req REQ-196
  // @req REQ-191
  it("answers empty answer-card fields for a name derived from the appellations", async () => {
    mockTables();

    const result = await getPeopleNamesDossier("PPL_DINKA");

    expect(result.names[1]).toMatchObject({
      attestations: [],
      shortLine: null,
      namedBy: null,
      originDebated: false,
      usedIn: [],
      pronunciation: null,
    });
  });

  // @req REQ-092
  it("returns an empty names array when the people has no indexed name", async () => {
    mockTables({ people: { ...peopleRow, name_index: null } });

    const result = await getPeopleNamesDossier("PPL_DINKA");

    expect(result.names).toEqual([]);
  });

  // @req REQ-196
  it("reads the dossier from the people row alone, with one confidence lookup", async () => {
    mockTables();

    await getPeopleNamesDossier("PPL_DINKA");

    const calledTables = fromMock.mock.calls.map((call) => call[0]);
    expect(calledTables).toEqual(["afrik_peoples"]);
    expect(getConfidenceMap).toHaveBeenCalledTimes(1);
    expect(getConfidenceMap).toHaveBeenCalledWith(["PPL_DINKA"]);
  });

  // @req REQ-092
  it("throws PeopleNamesNotFoundError for an unknown people id", async () => {
    mockTables({ people: null });

    await expect(getPeopleNamesDossier("PPL_UNKNOWN")).rejects.toThrow(
      PeopleNamesNotFoundError
    );
  });
});

describe("names handler — getPeopleNamesHandler", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.mocked(getConfidenceMap).mockReset();
    vi.mocked(getConfidenceMap).mockResolvedValue(new Map());
  });

  // @req REQ-092
  it("returns ok:true with the AR8 envelope for a valid dossier", async () => {
    mockTables();

    const result = await getPeopleNamesHandler("PPL_DINKA");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.envelope.data.peopleId).toBe("PPL_DINKA");
      expect(result.envelope.meta.license).toBe("CC-BY-SA-4.0");
      expect(result.envelope.errors).toEqual([]);
    }
  });

  // @req REQ-092
  it("returns ok:false NOT_FOUND for an unknown id", async () => {
    mockTables({ people: null });

    const result = await getPeopleNamesHandler("PPL_UNKNOWN");

    expect(result).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });
});
