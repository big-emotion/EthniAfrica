/**
 * GET /v2/peoples/{id}/names reads a people's nameHistory first, then the
 * names its appellations yield (REQ-196, ARCH-028): the fold of noms/ into
 * the fiches must leave the served dossier unchanged.
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
  enrichedLikeFiche,
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

/**
 * The dossier the retired name_records rows of a folded record served, built
 * the way the service mapped a row: the frozen expectation the fold is held to.
 */
function servedFromRecords(dossier: NameRecordDossier) {
  return {
    peopleId: dossier.id,
    autonym: null,
    names: [...dossier.names]
      .sort(
        (left, right) =>
          left.sortRank - right.sortRank ||
          left.nameType.localeCompare(right.nameType) ||
          (left.nameText < right.nameText ? -1 : 1)
      )
      .map((entry, index) => ({
        id: `row-${index}`,
        nameText: entry.nameText,
        nameType: entry.nameType,
        languageOfOrigin: entry.languageOfOrigin,
        meaning: entry.meaning,
        periodLabel: entry.periodLabel,
        imposition:
          entry.imposedBy ||
          entry.impositionPeriod ||
          entry.whyProblematic ||
          entry.contemporaryUsage
            ? {
                imposedBy: entry.imposedBy,
                impositionPeriod: entry.impositionPeriod,
                whyProblematic: entry.whyProblematic,
                contemporaryUsage: entry.contemporaryUsage,
              }
            : null,
        assertionId: `assertion-${index}`,
        sources: entry.sources.map((source) => ({
          id: `source:${source.title}`,
          title: source.title,
          url: source.url,
          year: source.year,
          tier: source.tier,
        })),
        confidence: null,
        attestations: entry.attestations ?? [],
        shortLine: entry.shortLine ?? null,
        namedBy: entry.namedBy ?? null,
        originDebated: entry.originDebated ?? false,
        usedIn: entry.usedIn ?? [],
        pronunciation: entry.pronunciation ?? null,
      })),
  };
}

function mockPeople(people: Record<string, unknown>) {
  fromMock.mockImplementation((table: string) => {
    if (table === "afrik_peoples") return thenable(people, true);
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
      const dossier = enrichedLikeFiche(
        foldedRecord(file),
        ficheNameHistory(foldedRecord(file).id)
      );
      const fromRecords = servedFromRecords(dossier);

      mockPeople({
        id: dossier.id,
        content: {},
        name_history: ficheNameHistory(dossier.id),
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
  it("serves the names the appellations yield beside the history, in rank order", async () => {
    const igbo = foldedRecord("PPL_IGBO.json");
    const derived = {
      nameText: "Igbos",
      nameType: "exonym",
      origin: "appellation",
      languageOfOrigin: null,
      meaning: null,
      periodLabel: null,
      imposedBy: null,
      impositionPeriod: null,
      whyProblematic: null,
      contemporaryUsage: null,
      sortRank: 1,
      sources: [],
    };

    mockPeople({
      id: igbo.id,
      content: {},
      name_history: ficheNameHistory(igbo.id),
      // The index repeats the history's names; the dossier reads them from
      // the block, which carries what the index flattens away.
      name_index: [
        { ...derived, nameText: "Ibo", origin: "nameHistory" },
        derived,
      ],
    });
    const result = await getPeopleNamesDossier(igbo.id);

    expect(result.names.map((name) => name.nameText)).toEqual([
      "Ndi Igbo",
      "Ibo",
      "Igbos",
      "Union Ibo",
    ]);
    expect(result.names[2].id).toBe(`${igbo.id}:name:1`);
  });
});
