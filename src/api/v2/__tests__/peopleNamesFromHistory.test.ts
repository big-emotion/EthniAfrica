/**
 * GET /v2/peoples/{id}/names reads a people's nameHistory before its
 * name_records rows (REQ-196, ARCH-028): the fold of noms/ into the fiches
 * must leave the served dossier unchanged.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { getPeopleNamesDossier } from "../services/names";
import { getConfidenceMap } from "@/lib/supabase/queries/afrik/module-zero-batch";
import { peopleNameAnswer } from "@/lib/fiche/nameAnswer";
import type { NameRecordDossier } from "@/types/names";
import {
  FOLDED_RECORD_FILES,
  ficheNameHistory,
  foldedRecord,
} from "@/lib/afrik/__tests__/fixtures/foldedNameRecords";

type FakeQuery = Record<string, ReturnType<typeof vi.fn>>;

function thenable(rows: unknown, single = false): FakeQuery {
  const query: FakeQuery = {} as FakeQuery;
  for (const method of ["select", "eq", "order"]) {
    query[method] = vi.fn(() => query);
  }
  query.in = vi.fn(() => Promise.resolve({ data: rows, error: null }));
  query.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: single ? rows : null, error: null })
  );
  (query as unknown as { then: PromiseLike<unknown>["then"] }).then = (
    resolve,
    reject
  ) => Promise.resolve({ data: rows, error: null }).then(resolve, reject);
  return query;
}

/** The rows nameRecordJsonLoader wrote for a dossier: sources → assertions → name_records. */
function recordTables(dossier: NameRecordDossier) {
  const sourceId = (title: string) => `source:${title}`;
  const sources = new Map<string, Record<string, unknown>>();
  const assertions = dossier.names.map((entry, index) => {
    for (const source of entry.sources) {
      sources.set(source.title, {
        id: sourceId(source.title),
        title: source.title,
        url: source.url,
        year: source.year,
        tier: source.tier,
      });
    }
    return {
      id: `assertion-${index}`,
      source_ids: entry.sources.map((source) => sourceId(source.title)),
    };
  });
  const names = dossier.names.map((entry, index) => ({
    id: `row-${index}`,
    name_text: entry.nameText,
    name_type: entry.nameType,
    language_of_origin: entry.languageOfOrigin,
    meaning: entry.meaning,
    period_label: entry.periodLabel,
    imposed_by: entry.imposedBy,
    imposition_period: entry.impositionPeriod,
    why_problematic: entry.whyProblematic,
    contemporary_usage: entry.contemporaryUsage,
    attestations: entry.attestations ?? [],
    short_line: entry.shortLine ?? null,
    named_by: entry.namedBy ?? null,
    origin_debated: entry.originDebated ?? null,
    used_in: entry.usedIn ?? [],
    pronunciation: entry.pronunciation ?? null,
    assertion_id: `assertion-${index}`,
    sort_rank: entry.sortRank,
  }));
  return { names, assertions, sources: [...sources.values()] };
}

function mockTables({
  people,
  names = [],
  assertions = [],
  sources = [],
}: {
  people: Record<string, unknown>;
  names?: unknown[];
  assertions?: unknown[];
  sources?: unknown[];
}) {
  fromMock.mockImplementation((table: string) => {
    if (table === "afrik_peoples") return thenable(people, true);
    if (table === "name_records") return thenable(names);
    if (table === "assertions") return thenable(assertions);
    if (table === "sources") return thenable(sources);
    throw new Error(`Unexpected table: ${table}`);
  });
}

// Row ids are database keys, not content: a folded name has none.
function content(names: Array<Record<string, unknown>>) {
  return names.map((name) => ({
    ...without(name, "id", "assertionId"),
    sources: (name.sources as Array<Record<string, unknown>>).map((source) =>
      without(source, "id")
    ),
  }));
}

function without<T extends object>(value: T, ...keys: string[]) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key))
  );
}

describe("names service — a people's nameHistory", () => {
  beforeEach(() => {
    fromMock.mockReset();
    vi.mocked(getConfidenceMap).mockReset();
    vi.mocked(getConfidenceMap).mockResolvedValue(new Map());
  });

  // @req REQ-196
  it.each(FOLDED_RECORD_FILES)(
    "%s: the folded history serves the dossier its name records served",
    async (file) => {
      const dossier = foldedRecord(file);
      const people = { id: dossier.id, content: {} };

      mockTables({ people, ...recordTables(dossier) });
      const fromRecords = await getPeopleNamesDossier(dossier.id);

      mockTables({
        people: { ...people, name_history: ficheNameHistory(dossier.id) },
      });
      const fromHistory = await getPeopleNamesDossier(dossier.id);

      expect(fromHistory.names.length).toBe(dossier.names.length);
      expect(content(fromHistory.names)).toEqual(content(fromRecords.names));
      // The people fiche's answer card (REQ-190) reads this dossier.
      expect(peopleNameAnswer(null, fromHistory, "fr")).toEqual(
        peopleNameAnswer(null, fromRecords, "fr")
      );
    }
  );

  // @req REQ-196
  it("lets the history win over a row for the same name and keeps a name only the rows hold", async () => {
    const igbo = foldedRecord("PPL_IGBO.json");
    const tables = recordTables(igbo);
    const staleIbo = { ...tables.names[1], meaning: "Ancienne lecture" };
    const derived = {
      ...tables.names[0],
      id: "row-derived",
      name_text: "Igbos",
      name_type: "exonym",
      sort_rank: 1,
    };

    mockTables({
      people: {
        id: igbo.id,
        content: {},
        name_history: ficheNameHistory(igbo.id),
      },
      ...tables,
      names: [staleIbo, derived],
    });
    const result = await getPeopleNamesDossier(igbo.id);

    expect(result.names.map((name) => name.nameText)).toEqual([
      "Ndi Igbo",
      "Ibo",
      "Igbos",
      "Union Ibo",
    ]);
    expect(result.names[1].meaning).toBeNull();
    expect(result.names[2].id).toBe("row-derived");
  });
});
