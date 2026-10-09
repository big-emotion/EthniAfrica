/**
 * The search sheet reads a people's names from its nameHistory before its
 * name_records rows (REQ-196, ARCH-028), and the fold of noms/ into the
 * fiches must leave what it shows unchanged.
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

/** What nameRecordJsonLoader wrote for a dossier. */
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
  const names = dossier.names.map((entry, index) => ({
    id: `row-${index}`,
    entity_type: "people",
    entity_id: dossier.id,
    name_text: entry.nameText,
    name_type: entry.nameType,
    language_of_origin: entry.languageOfOrigin,
    meaning: entry.meaning,
    period_label: entry.periodLabel,
    short_line: entry.shortLine ?? null,
    imposed_by: entry.imposedBy,
    imposition_period: entry.impositionPeriod,
    why_problematic: entry.whyProblematic,
    contemporary_usage: entry.contemporaryUsage,
    assertion_id: `assertion-${index}`,
    sort_rank: entry.sortRank,
  }));
  return { names, assertions, sources: [...sources.values()] };
}

function client(tables: {
  peoples: unknown[];
  names?: unknown[];
  assertions?: unknown[];
  sources?: unknown[];
}) {
  const byTable: Record<string, ReturnType<typeof thenableQuery>> = {
    afrik_peoples: thenableQuery({ data: tables.peoples, error: null }),
    name_records: thenableQuery({ data: tables.names ?? [], error: null }),
    assertions: thenableQuery({ data: tables.assertions ?? [], error: null }),
    confidence_scores: thenableQuery({ data: [], error: null }),
    sources: thenableQuery({ data: tables.sources ?? [], error: null }),
  };
  return { from: vi.fn((table: string) => byTable[table]) };
}

// Ids are database keys, and the history adds each source's source_kind,
// which the rows never carried: everything else must match.
function evidenceContent(evidence: SearchEvidence) {
  return {
    ...evidence,
    assertion: without(evidence.assertion, "id"),
    sources: evidence.sources.map((source) =>
      without(source, "id", "sourceKind")
    ),
  };
}

function recordContent(record: SearchNameRecord) {
  return {
    ...without(record, "id"),
    evidence: record.evidence.map(evidenceContent),
  };
}

function without<T extends object>(value: T, ...keys: string[]) {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key))
  );
}

describe("search naming — a people's nameHistory", () => {
  // @req REQ-196
  it.each(FOLDED_RECORD_FILES)(
    "%s: the folded history shows the names its name records showed",
    async (file) => {
      const dossier = foldedRecord(file);
      const key = searchNamingKey("people", dossier.id);
      const subjects = [{ type: "people" as const, id: dossier.id }];

      const fromRecords = (
        await loadSearchNamingData(
          subjects,
          client({
            peoples: [{ id: dossier.id, name_history: null }],
            ...recordTables(dossier),
          }) as never
        )
      ).get(key);
      const fromHistory = (
        await loadSearchNamingData(
          subjects,
          client({
            peoples: [
              { id: dossier.id, name_history: ficheNameHistory(dossier.id) },
            ],
          }) as never
        )
      ).get(key);

      expect(fromHistory.records.map(recordContent)).toEqual(
        fromRecords.records.map(recordContent)
      );
      expect(fromHistory.evidence.map(evidenceContent)).toEqual(
        fromRecords.evidence.map(evidenceContent)
      );
    }
  );

  // @req REQ-196
  it("shows each name once when the rows still hold the folded record", async () => {
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
