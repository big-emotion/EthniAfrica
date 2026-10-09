/**
 * The search sheet reads a people's names from its nameHistory, then from the
 * name index its appellations add (REQ-196, ARCH-028); the fold of noms/ into
 * the fiches must leave what it shows unchanged.
 */
import { describe, expect, it, vi } from "vitest";

import { normalizeToKey } from "@/lib/normalize";
import type { SearchEvidence } from "@/lib/search/evidence";
import type { SearchNameRecord } from "@/lib/search/naming";
import {
  loadSearchNamingData,
  searchNamingKey,
} from "@/lib/supabase/queries/afrik/searchNaming";
import type { NameRecordDossier } from "@/types/names";
import {
  FOLDED_RECORD_FILES,
  ficheNameHistory,
  foldedRecord,
} from "@/lib/afrik/__tests__/fixtures/foldedNameRecords";

function thenableQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: PromiseLike<typeof result>["then"];
  } = { select: vi.fn(), in: vi.fn(), order: vi.fn() };
  query.select.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

/**
 * The assertions and sources the retired nameRecordJsonLoader wrote for a
 * dossier, which a database loaded before the fold still holds.
 */
function recordTables(dossier: NameRecordDossier) {
  const sources = new Map<string, Record<string, unknown>>();
  const assertions = dossier.names.map((entry, index) => {
    for (const source of entry.sources) {
      sources.set(source.title, {
        id: `source:${source.title}`,
        title: source.title,
        author: source.author,
        url: source.url,
        year: source.year,
        page: null,
        tier: source.tier,
        source_kind: null,
        oral_narratives: null,
      });
    }
    return {
      id: `assertion-${index}`,
      entity_type: "people",
      entity_id: dossier.id,
      field_path: `names.${entry.nameType}.${normalizeToKey(entry.nameText)}`,
      statement: entry.nameText,
      position: null,
      confidence_level: null,
      source_ids: entry.sources.map((source) => `source:${source.title}`),
      superseded_by: null,
    };
  });
  return { assertions, sources: [...sources.values()] };
}

function client(tables: {
  peoples: unknown[];
  assertions?: unknown[];
  sources?: unknown[];
}) {
  const byTable: Record<string, ReturnType<typeof thenableQuery>> = {
    afrik_peoples: thenableQuery({ data: tables.peoples, error: null }),
    assertions: thenableQuery({ data: tables.assertions ?? [], error: null }),
    confidence_scores: thenableQuery({ data: [], error: null }),
    sources: thenableQuery({ data: tables.sources ?? [], error: null }),
  };
  return { from: vi.fn((table: string) => byTable[table]) };
}

describe("search naming — a people's nameHistory", () => {
  // @req REQ-196
  it.each(FOLDED_RECORD_FILES)(
    "%s: the folded history shows each name its record held, citing the record's sources",
    async (file) => {
      const dossier = foldedRecord(file);
      const key = searchNamingKey("people", dossier.id);

      const fromHistory = (
        await loadSearchNamingData(
          [{ type: "people" as const, id: dossier.id }],
          client({
            peoples: [
              { id: dossier.id, name_history: ficheNameHistory(dossier.id) },
            ],
          }) as never
        )
      ).get(key);

      const expected = [...dossier.names].sort(
        (left, right) =>
          left.sortRank - right.sortRank ||
          (left.nameText < right.nameText ? -1 : 1)
      );
      expect(
        fromHistory.records.map((record) => ({
          form: record.form,
          kind: record.kind,
          sources: record.evidence[0].sources.map(({ title }) => title),
        }))
      ).toEqual(
        expected.map((entry) => ({
          form: entry.nameText,
          kind: entry.nameType,
          sources: entry.sources.map(({ title }) => title),
        }))
      );
    }
  );

  // @req REQ-196
  it("shows a name the appellations add once, even where an assertion from an earlier load still names it", async () => {
    const result = (
      await loadSearchNamingData(
        [{ type: "people", id: "PPL_TEST" }],
        client({
          peoples: [
            {
              id: "PPL_TEST",
              name_history: null,
              name_index: [
                {
                  nameText: "Tosti",
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
                  sources: [
                    {
                      title: "Ethnologue",
                      url: null,
                      year: null,
                      tier: "official",
                    },
                  ],
                },
              ],
            },
          ],
          assertions: [
            {
              id: "assertion-stale",
              entity_type: "people",
              entity_id: "PPL_TEST",
              field_path: `names.exonym.${normalizeToKey("Tosti")}`,
              statement: "Tosti",
              position: null,
              confidence_level: null,
              source_ids: ["source:Ethnologue"],
              superseded_by: null,
            },
          ],
          sources: [
            {
              id: "source:Ethnologue",
              title: "Ethnologue",
              tier: "official",
            },
          ],
        }) as never
      )
    ).get(searchNamingKey("people", "PPL_TEST"));

    expect(result.records.map((record) => record.form)).toEqual(["Tosti"]);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].assertion.id).not.toBe("assertion-stale");
  });

  // @req REQ-196
  it("shows each name once where the assertions of the folded record remain", async () => {
    const dossier = foldedRecord("PPL_IGBO.json");

    const result = (
      await loadSearchNamingData(
        [{ type: "people", id: dossier.id }],
        client({
          peoples: [
            { id: dossier.id, name_history: ficheNameHistory(dossier.id) },
          ],
          ...recordTables(dossier),
        }) as never
      )
    ).get(searchNamingKey("people", dossier.id));

    expect(result.records.map((record) => record.form)).toEqual([
      "Ndi Igbo",
      "Ibo",
      "Union Ibo",
    ]);
    expect(result.evidence).toHaveLength(3);
    expect(result.records[1].evidence[0].sources[0].sourceKind).toBe(
      "linguistic_reference"
    );
  });
});
