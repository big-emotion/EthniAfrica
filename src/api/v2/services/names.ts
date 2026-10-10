/**
 * Names Atlas service (Epic 8, FR53-FR58). Shared by `GET /v2/peoples/{id}/names`
 * (Story 8.6) and `GET /v2/names` (Story 8.7).
 *
 * Both read the people fiche as the loader projected it (REQ-196): the
 * nameHistory block (`name_history`) and the name index (`name_index`, its
 * names plus those derived from the appellations prose). `name_records`, the
 * table both used to read, is retired (migration 101).
 *
 * `getPeopleNamesDossier` is one people-row read plus one `getConfidenceMap`
 * call: every name cites its sources inline, so there is no per-name join.
 *
 * `listNames` filters q?, nameType?, imposedOnly?, peopleId?, letter? against
 * the `afrik_people_names` view, batching the people summary +
 * confidence-boost lookups (AR17 map pattern).
 */

import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/api/logger";
import { getConfidenceMap } from "@/lib/supabase/queries/afrik/module-zero-batch";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameRecordsFromHistory } from "@/lib/afrik/nameHistoryRecords";
import type { PeopleNameIndexEntry } from "@/lib/afrik/peopleNameIndex";
import type {
  ListNameFormsQuery,
  ListNamesQuery,
  NameForm,
  NameRecord,
  NameRecordConfidenceView,
  NameRecordImposition,
  NameRecordType,
  PeopleNameRecord,
  PeopleNamesDossier,
  PeopleSummary,
} from "@/api/v2/schemas/names";

// @req REQ-057
export class PeopleNamesNotFoundError extends Error {
  constructor(peopleId: string) {
    super(`People not found: ${peopleId}`);
    this.name = "PeopleNamesNotFoundError";
  }
}

// @req REQ-057
export class NamesSchemaUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NamesSchemaUnavailableError";
  }
}

interface ImpositionFields {
  imposed_by: string | null;
  imposition_period: string | null;
  why_problematic: string | null;
  contemporary_usage: string | null;
}

function buildImposition(row: ImpositionFields): NameRecordImposition | null {
  if (
    !row.imposed_by &&
    !row.imposition_period &&
    !row.why_problematic &&
    !row.contemporary_usage
  ) {
    return null;
  }
  return {
    imposedBy: row.imposed_by,
    impositionPeriod: row.imposition_period,
    whyProblematic: row.why_problematic,
    contemporaryUsage: row.contemporary_usage,
  };
}

/**
 * A people's names as its fiche's nameHistory tells them (REQ-196). The
 * dossier reads the block rather than its flattened copy in the name index,
 * because only the block carries the written traces and answer-card fields.
 *
 * Ids are stable keys built from the people and the name's position.
 */
function namesFromHistory(
  peopleId: string,
  rawHistory: unknown
): Array<Omit<PeopleNameRecord, "confidence">> {
  if (rawHistory == null) return [];
  const parsed = parseNameHistory(rawHistory);
  if (!parsed.success) {
    // The loader refuses an invalid block, so this is a row written by hand;
    // the derived names still answer rather than an empty card.
    logger.warn("names.getPeopleNamesDossier: unreadable nameHistory", {
      peopleId,
      errors: parsed.errors,
    });
    return [];
  }
  return nameRecordsFromHistory(parsed.data).map((entry, index) => {
    const id = `${peopleId}:nameHistory:${index}`;
    return {
      id,
      nameText: entry.nameText,
      nameType: entry.nameType,
      languageOfOrigin: entry.languageOfOrigin,
      meaning: entry.meaning,
      periodLabel: entry.periodLabel,
      imposition: buildImposition({
        imposed_by: entry.imposedBy,
        imposition_period: entry.impositionPeriod,
        why_problematic: entry.whyProblematic,
        contemporary_usage: entry.contemporaryUsage,
      }),
      assertionId: id,
      sources: entry.sources.map((source, sourceIndex) => ({
        id: `${id}:source:${sourceIndex}`,
        title: source.title,
        url: source.url,
        year: source.year,
        tier: source.tier,
      })),
      attestations: entry.attestations,
      shortLine: entry.shortLine ?? null,
      namedBy: entry.namedBy ?? null,
      originDebated: entry.originDebated,
      usedIn: entry.usedIn ?? [],
      pronunciation: entry.pronunciation ?? null,
    };
  });
}

interface RankedName {
  rank: number;
  name: PeopleNameRecord;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

// Rank, then type, then name: the order the dossier has always served.
function compareRanked(left: RankedName, right: RankedName): number {
  return (
    left.rank - right.rank ||
    compareText(left.name.nameType, right.name.nameType) ||
    compareText(left.name.nameText, right.name.nameText)
  );
}

/**
 * The names the fiche's appellations yield, from the name index (REQ-196).
 * The loader already left out every name the block tells, so these never
 * repeat one; they cite the fiche's sources, embedded in the entry.
 */
function namesFromAppellations(
  peopleId: string,
  rawIndex: unknown
): Array<{ rank: number; name: Omit<PeopleNameRecord, "confidence"> }> {
  if (!Array.isArray(rawIndex)) return [];
  return (rawIndex as PeopleNameIndexEntry[]).flatMap((entry, position) => {
    if (entry?.origin !== "appellation") return [];
    // The position in the index, as the afrik_people_names view numbers it.
    const id = `${peopleId}:name:${position}`;
    return [
      {
        rank: entry.sortRank,
        name: {
          id,
          nameText: entry.nameText,
          nameType: entry.nameType,
          languageOfOrigin: entry.languageOfOrigin,
          meaning: entry.meaning,
          periodLabel: entry.periodLabel,
          imposition: buildImposition({
            imposed_by: entry.imposedBy,
            imposition_period: entry.impositionPeriod,
            why_problematic: entry.whyProblematic,
            contemporary_usage: entry.contemporaryUsage,
          }),
          assertionId: id,
          sources: (entry.sources ?? []).map((source, sourceIndex) => ({
            id: `${id}:source:${sourceIndex}`,
            title: source.title,
            url: source.url,
            year: source.year,
            tier: source.tier,
          })),
          attestations: [],
          shortLine: null,
          namedBy: null,
          originDebated: false,
          usedIn: [],
          pronunciation: null,
        },
      },
    ];
  });
}

// @req REQ-057
export async function getPeopleNamesDossier(
  peopleId: string
): Promise<PeopleNamesDossier> {
  const supabase = createServerClient();

  const { data: peopleRow, error: peopleError } = await supabase
    .from("afrik_peoples")
    .select("id, content, name_history, name_index")
    .eq("id", peopleId)
    .maybeSingle();

  if (peopleError) {
    throw new Error(
      `Failed to load people ${peopleId}: ${peopleError.message}`
    );
  }
  if (!peopleRow) {
    throw new PeopleNamesNotFoundError(peopleId);
  }

  const row = peopleRow as {
    content?: unknown;
    name_history?: unknown;
    name_index?: unknown;
  };
  const content = (row.content ?? {}) as Record<string, unknown>;
  const appellations = (content.appellations ?? {}) as {
    selfAppellation?: string;
  };

  const confidenceScore = (await getConfidenceMap([peopleId])).get(peopleId);
  const confidence: NameRecordConfidenceView | null = confidenceScore
    ? {
        score: confidenceScore.score,
        recomputedAt: confidenceScore.recomputedAt,
      }
    : null;

  const names = [
    ...namesFromHistory(peopleId, row.name_history).map((name, rank) => ({
      rank,
      name,
    })),
    ...namesFromAppellations(peopleId, row.name_index),
  ]
    .map(({ rank, name }) => ({ rank, name: { ...name, confidence } }))
    .sort(compareRanked)
    .map(({ name }) => name);

  return {
    peopleId,
    autonym: appellations.selfAppellation ?? null,
    names,
  };
}

export interface ListNamesResult {
  names: NameRecord[];
  total: number;
}

function mapPeopleRowToSummary(row: Record<string, unknown>): PeopleSummary {
  const content = (row.content as Record<string, unknown>) ?? {};
  const appellations = content.appellations as
    Record<string, unknown> | undefined;
  const autonym =
    typeof appellations?.selfAppellation === "string"
      ? appellations.selfAppellation
      : null;

  return {
    id: row.id as string,
    nameMain: row.name_main as string,
    autonym,
    slug: row.id as string,
  };
}

function mapRowToNameRecord(
  row: Record<string, unknown>,
  peopleMap: Map<string, PeopleSummary>
): NameRecord {
  const peopleId = row.entity_id as string;

  return {
    id: row.id as string,
    peopleId,
    nameText: row.name_text as string,
    nameType: row.name_type as NameRecord["nameType"],
    languageOfOrigin: (row.language_of_origin as string | null) ?? null,
    meaning: (row.meaning as string | null) ?? null,
    periodLabel: (row.period_label as string | null) ?? null,
    imposedBy: (row.imposed_by as string | null) ?? null,
    impositionPeriod: (row.imposition_period as string | null) ?? null,
    whyProblematic: (row.why_problematic as string | null) ?? null,
    contemporaryUsage: (row.contemporary_usage as string | null) ?? null,
    sortRank: row.sort_rank as number,
    people: peopleMap.get(peopleId) ?? null,
  };
}

// @req FR53 @req FR55 @req FR58
// @req REQ-057
export async function listNames(
  query: ListNamesQuery
): Promise<ListNamesResult> {
  const supabase = createServerClient();

  // Every row of the view is a people's name, so no entity filter applies.
  let dbQuery = supabase
    .from("afrik_people_names")
    .select("*", { count: "exact" });

  if (query.q) {
    dbQuery = dbQuery.textSearch("search_vector", query.q, {
      type: "websearch",
      config: "french",
    });
  }
  if (query.nameType) {
    dbQuery = dbQuery.eq("name_type", query.nameType);
  }
  if (query.imposedOnly) {
    dbQuery = dbQuery.not("imposed_by", "is", null);
  }
  if (query.peopleId) {
    dbQuery = dbQuery.eq("entity_id", query.peopleId);
  }
  if (query.letter) {
    dbQuery = dbQuery.ilike("name_text", `${query.letter}%`);
  }

  const { data, error, count } = await dbQuery
    .order("sort_rank")
    .order("name_text")
    .range(query.offset, query.offset + query.limit - 1);

  if (error) {
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      error.code === "42P17"
    ) {
      throw new NamesSchemaUnavailableError(
        `Names schema is unavailable: ${error.message}`
      );
    }
    logger.error("names.listNames failed", error);
    throw new Error(`Failed to list name records: ${error.message}`);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const peopleIds = [...new Set(rows.map((row) => row.entity_id as string))];

  // ── batched people summary lookup (AR17 map pattern) ──────────────────────
  const peopleMap = new Map<string, PeopleSummary>();
  if (peopleIds.length > 0) {
    const { data: peopleRows, error: peopleError } = await supabase
      .from("afrik_peoples")
      .select("id, name_main, content")
      .in("id", peopleIds);

    if (peopleError) {
      throw new Error(
        `Failed to load people summaries: ${peopleError.message}`
      );
    }
    for (const row of peopleRows ?? []) {
      peopleMap.set(row.id as string, mapPeopleRowToSummary(row));
    }
  }

  let names = rows.map((row) => mapRowToNameRecord(row, peopleMap));

  // ── confidence-only ordering ──────────────────────────────────────────────
  // This sorts by confidence alone, in JavaScript, over the current page. It
  // is NOT the ts_rank_cd × confidence ranking the comment here used to claim
  // — that never existed anywhere. /api/v2/search now ranks in Postgres
  // (migrations 043/044); this endpoint has not been moved yet, and saying so
  // is what keeps the next reader from citing it as precedent.
  if (query.q && peopleIds.length > 0) {
    const { data: scoreRows } = await supabase
      .from("confidence_scores")
      .select("entity_id, score")
      .eq("entity_type", "people")
      .in("entity_id", peopleIds);

    const confidenceMap = new Map<string, number>();
    for (const row of scoreRows ?? []) {
      if (row.score !== null) confidenceMap.set(row.entity_id, row.score);
    }

    names = [...names].sort(
      (a, b) =>
        (confidenceMap.get(b.peopleId) ?? -1) -
        (confidenceMap.get(a.peopleId) ?? -1)
    );
  }

  return { names, total: count ?? rows.length };
}

/**
 * Folds a reader's query the same way `afrik_name_forms.form_key` is folded.
 *
 * The view groups on `lower(afrik_unaccent(name_text))`, so a query that is
 * not folded identically can only match by luck — "Traoré" would miss the
 * corpus's own "Traore". `%` and `_` are escaped because they are `ILIKE`
 * wildcards, and a reader typing one means the character, not the operator.
 */
function foldNameQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\\%_]/g, (character) => `\\${character}`);
}

export interface ListNameFormsResult {
  forms: NameForm[];
  total: number;
  pageCount: number;
}

function mapRowToNameForm(row: Record<string, unknown>): NameForm {
  return {
    formKey: row.form_key as string,
    displayName: row.display_name as string,
    spellings: (row.spellings as string[]) ?? [],
    nameTypes: (row.name_types as NameForm["nameTypes"]) ?? [],
    bearerCount: (row.bearer_count as number) ?? 0,
    bearers: (row.bearers as NameForm["bearers"]) ?? [],
    hasImposed: Boolean(row.has_imposed),
    whyProblematic: (row.why_problematic as string | null) ?? null,
    languageOfOrigin: (row.language_of_origin as string | null) ?? null,
  };
}

/**
 * One page of the Appellations nomenclature.
 *
 * Reads `afrik_name_forms` rather than `afrik_people_names`: the surface's unit is
 * the name, and a page can only group what it has already fetched, so
 * grouping the records here — after `range()` — would have produced a
 * different set of entries on every page. Ordering is alphabetical on the
 * folded key rather than on `sort_rank`, which used to sink the 2742 exonyms
 * behind 742 rank-0 endonyms.
 */
// @req REQ-054
export async function listNameForms(
  query: ListNameFormsQuery
): Promise<ListNameFormsResult> {
  const supabase = createServerClient();
  const offset = (query.page - 1) * query.perPage;

  let dbQuery = supabase
    .from("afrik_name_forms")
    .select("*", { count: "exact" });

  if (query.q) {
    dbQuery = dbQuery.ilike("form_key", `%${foldNameQuery(query.q)}%`);
  }
  if (query.nameType) {
    dbQuery = dbQuery.contains("name_types", [query.nameType]);
  }
  if (query.imposedOnly) {
    dbQuery = dbQuery.eq("has_imposed", true);
  }

  const { data, error, count } = await dbQuery
    .order("form_key")
    .range(offset, offset + query.perPage - 1);

  if (error) {
    if (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      error.code === "42P17"
    ) {
      throw new NamesSchemaUnavailableError(
        `Name forms view is unavailable: ${error.message}`
      );
    }
    logger.error("names.listNameForms failed", error);
    throw new Error(`Failed to list name forms: ${error.message}`);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const total = count ?? rows.length;

  return {
    forms: rows.map(mapRowToNameForm),
    total,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export interface NameTypeCounts {
  byType: Partial<Record<NameRecordType, number>>;
  imposed: number;
}

/**
 * How many records each filter can reach, so the surface can stop offering
 * one that reaches none.
 *
 * A type absent from the corpus is absent from the returned map rather than
 * present at zero: the caller renders what it is given, and an explicit zero
 * would only move the decision to drop the chip back into the component.
 */
// @req REQ-054
export async function getNameTypeCounts(): Promise<NameTypeCounts> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("afrik_name_type_counts")
    .select("name_type, record_count, imposed_count");

  if (error) {
    // A missing facet view costs the chips, never the nomenclature itself.
    logger.error("names.getNameTypeCounts failed", error);
    return { byType: {}, imposed: 0 };
  }

  const counts: NameTypeCounts = { byType: {}, imposed: 0 };
  for (const row of (data ?? []) as Array<{
    name_type: NameRecordType;
    record_count: number;
    imposed_count: number;
  }>) {
    if (row.record_count > 0) {
      counts.byType[row.name_type] = row.record_count;
    }
    counts.imposed += row.imposed_count ?? 0;
  }

  return counts;
}
