import { createServerClient } from "@/lib/supabase/server";
import { normalizeToKey } from "@/lib/normalize";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameRecordsFromHistory } from "@/lib/afrik/nameHistoryRecords";
import type { PeopleNameIndexEntry } from "@/lib/afrik/peopleNameIndex";
import { toSourceKindOrNull } from "@/types/sources";
import {
  searchSourceStanding,
  strongestSearchSourceStanding,
  type SearchEvidence,
  type SearchEvidenceSource,
} from "@/lib/search/evidence";
import {
  searchPresentationText,
  type NamingClaimStatus,
  type SearchNameRecord,
} from "@/lib/search/naming";

export type SearchNamingSubjectType =
  "people" | "country" | "languageFamily" | "language" | "patronyme";

export interface SearchNamingSubjectRef {
  type: SearchNamingSubjectType;
  id: string;
}

export interface SearchNamingData {
  records: SearchNameRecord[];
  evidence: SearchEvidence[];
}

type SearchClient = ReturnType<typeof createServerClient>;

const DATABASE_ENTITY_TYPE: Record<SearchNamingSubjectType, string> = {
  people: "people",
  country: "country",
  languageFamily: "language_family",
  language: "language",
  patronyme: "patronyme",
};

// @req REQ-180
export function searchNamingKey(
  type: SearchNamingSubjectType | string,
  id: string
): string {
  return `${type}:${id}`;
}

function databaseKey(entityType: string, entityId: string): string {
  const type = (
    Object.keys(DATABASE_ENTITY_TYPE) as SearchNamingSubjectType[]
  ).find((candidate) => DATABASE_ENTITY_TYPE[candidate] === entityType);
  return searchNamingKey(type ?? entityType, entityId);
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function asRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item)
      )
    : [];
}

function nullableText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function queryFailure(table: string, error: unknown): Error {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return new Error(`Failed to load search naming ${table}: ${message}`);
}

function compareText(left: unknown, right: unknown): number {
  const a = String(left ?? "");
  const b = String(right ?? "");
  return a === b ? 0 : a < b ? -1 : 1;
}

function isNamingField(entityType: string, fieldPath: unknown): boolean {
  if (typeof fieldPath !== "string") return false;
  switch (entityType) {
    case "people":
      return /^(?:(?:content\.)?appellations|names)(?:\.|$)/.test(fieldPath);
    case "language_family":
      return /^(?:content\.)?decolonialHeader(?:\.|$)/.test(fieldPath);
    case "country":
      return (
        fieldPath === "etymology" ||
        fieldPath === "nameOriginActor" ||
        /^(?:content\.)?historicalNames(?:\.|$)/.test(fieldPath)
      );
    case "language":
      return /^(?:content\.)?(?:alternateNames|spellingAliases|whyProblematic)(?:\.|$)/.test(
        fieldPath
      );
    case "patronyme":
      return /^(?:spellings|origin)(?:\.|$)/.test(fieldPath);
    default:
      return false;
  }
}

function toEvidenceSource(row: Record<string, unknown>): SearchEvidenceSource {
  const narrative = Array.isArray(row.oral_narratives)
    ? row.oral_narratives[0]
    : row.oral_narratives;
  const reviewStatus =
    narrative && typeof narrative === "object" && !Array.isArray(narrative)
      ? (narrative as Record<string, unknown>).review_status
      : undefined;
  const sourceKind = toSourceKindOrNull(row.source_kind);
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    ...(nullableText(row.author) ? { author: String(row.author) } : {}),
    ...(typeof row.year === "number" ? { year: row.year } : {}),
    ...(nullableText(row.page) ? { page: String(row.page) } : {}),
    ...(nullableText(row.url) ? { url: String(row.url) } : {}),
    tier: searchSourceStanding(row.tier),
    ...(sourceKind ? { sourceKind } : {}),
    ...(row.source_kind === "oral_tradition"
      ? { reviewedNarrative: reviewStatus === "approved" }
      : {}),
  };
}

/**
 * The field path a people name's assertion was loaded under by the retired
 * name-record loaders. A database loaded before migration 101 still holds
 * them; they yield to the fiche's own account of the same name.
 */
function nameFieldPath(nameType: string, nameText: string): string {
  return `names.${nameType}.${normalizeToKey(nameText)}`;
}

interface ToldNames {
  /** Each folded name, with its rank in the block. */
  records: Array<{ rank: number; record: SearchNameRecord }>;
  /** What the fiche covers, so an assertion left for the same name is not shown twice. */
  fieldPaths: Set<string>;
}

/** A name as the search sheet shows it, before evidence is attached. */
type ToldName = Omit<
  SearchNameRecord,
  "id" | "entityType" | "entityId" | "evidence"
>;

interface ToldSource {
  title: string;
  author?: string | null;
  year: number | null;
  url: string | null;
  tier: string | null;
  source_kind?: string;
}

/**
 * A people's names as its fiche tells them (REQ-196): the nameHistory block
 * first, then the names the name index derived from the appellations. A told
 * name has no database assertion, so its evidence is built from the fiche's
 * own sources, in the shape an assertion's evidence has.
 */
function toldNames(
  entityId: string,
  rawHistory: unknown,
  rawIndex: unknown,
  confidence: { score: number; lastHumanAuditAt: string | null } | undefined
): ToldNames {
  const told: ToldNames = { records: [], fieldPaths: new Set() };

  const tell = (
    id: string,
    rank: number,
    name: ToldName,
    citedSources: ToldSource[]
  ) => {
    const fieldPath = nameFieldPath(name.kind, name.form);
    const sources: SearchEvidenceSource[] = citedSources.map(
      (source, index) => {
        const sourceKind = toSourceKindOrNull(source.source_kind);
        return {
          id: `${id}:source:${index}`,
          title: source.title,
          ...(nullableText(source.author) ? { author: source.author } : {}),
          ...(typeof source.year === "number" ? { year: source.year } : {}),
          ...(nullableText(source.url) ? { url: source.url } : {}),
          tier: searchSourceStanding(source.tier),
          ...(sourceKind ? { sourceKind } : {}),
        };
      }
    );
    const evidence: SearchEvidence = {
      assertion: {
        id,
        statement: name.form,
        fieldPath,
        ...(confidence ? { confidenceScore: confidence.score } : {}),
        sourceCount: sources.length,
        lastHumanAuditAt: confidence?.lastHumanAuditAt ?? null,
      },
      sources,
      standing: strongestSearchSourceStanding(sources),
    };
    told.fieldPaths.add(fieldPath);
    told.records.push({
      rank,
      record: {
        id,
        entityType: "people",
        entityId,
        ...name,
        evidence: [evidence],
      },
    });
  };

  const parsed = rawHistory == null ? undefined : parseNameHistory(rawHistory);
  if (parsed?.success) {
    nameRecordsFromHistory(parsed.data).forEach((entry, rank) => {
      tell(
        `${entityId}:nameHistory:${rank}`,
        rank,
        shownName(entry),
        entry.sources
      );
    });
  }

  if (Array.isArray(rawIndex)) {
    (rawIndex as PeopleNameIndexEntry[]).forEach((entry, position) => {
      // The block's names are read from the block above, which carries the
      // short line the flattened index leaves out.
      if (entry?.origin !== "appellation") return;
      tell(
        `${entityId}:name:${position}`,
        entry.sortRank,
        shownName(entry),
        entry.sources ?? []
      );
    });
  }

  return told;
}

function shownName(entry: {
  nameText: string;
  nameType: string;
  languageOfOrigin: string | null;
  meaning: string | null;
  periodLabel: string | null;
  shortLine?: string;
  imposedBy: string | null;
  impositionPeriod: string | null;
  whyProblematic: string | null;
  contemporaryUsage: string | null;
}): ToldName {
  return {
    form: entry.nameText,
    kind: entry.nameType as SearchNameRecord["kind"],
    ...(nullableText(entry.languageOfOrigin)
      ? { languageOfOrigin: entry.languageOfOrigin }
      : {}),
    ...(nullableText(entry.meaning) ? { meaning: entry.meaning } : {}),
    ...(nullableText(entry.periodLabel)
      ? { periodLabel: entry.periodLabel }
      : {}),
    ...(nullableText(entry.shortLine) ? { shortLine: entry.shortLine } : {}),
    ...(nullableText(entry.imposedBy) ? { imposedBy: entry.imposedBy } : {}),
    ...(nullableText(entry.impositionPeriod)
      ? { impositionPeriod: entry.impositionPeriod }
      : {}),
    problematic: Boolean(nullableText(entry.whyProblematic)),
    usedToday: Boolean(nullableText(entry.contemporaryUsage)),
  };
}

/** A family name's spelling, as its loader keys the assertion: `spellings.<rank>.<key>`. */
const SPELLING_FIELD_PATH = /^spellings\.(\d+)\./;

function claimStatusOf(value: unknown): NamingClaimStatus | undefined {
  return value === "contested" ? "contested" : undefined;
}

/**
 * Loads every naming relation for a result page in bounded batches. A failed
 * batch throws: a database outage must never be rendered as a corpus silence.
 */
// @req REQ-180
export async function loadSearchNamingData(
  subjects: readonly SearchNamingSubjectRef[],
  client: SearchClient = createServerClient()
): Promise<Map<string, SearchNamingData>> {
  const uniqueSubjects = Array.from(
    new Map(
      subjects.map((subject) => [
        searchNamingKey(subject.type, subject.id),
        subject,
      ])
    ).values()
  );
  if (uniqueSubjects.length === 0) return new Map();

  const subjectKeys = new Set(
    uniqueSubjects.map(({ type, id }) => searchNamingKey(type, id))
  );
  const allIds = unique(uniqueSubjects.map(({ id }) => id));
  const allEntityTypes = unique(
    uniqueSubjects.map(({ type }) => DATABASE_ENTITY_TYPE[type])
  );
  const assertionsPromise = client
    .from("assertions")
    .select(
      "id, entity_type, entity_id, field_path, statement, position, confidence_level, source_ids, superseded_by"
    )
    .in("entity_type", allEntityTypes)
    .in("entity_id", allIds);

  const confidencePromise = client
    .from("confidence_scores")
    .select("entity_type, entity_id, score, last_human_audit_at")
    .in("entity_type", allEntityTypes)
    .in("entity_id", allIds);

  const peopleIds = unique(
    uniqueSubjects.filter(({ type }) => type === "people").map(({ id }) => id)
  );
  const historiesPromise =
    peopleIds.length > 0
      ? client
          .from("afrik_peoples")
          .select("id, name_history, name_index")
          .in("id", peopleIds)
      : Promise.resolve({ data: [], error: null });

  const [assertionResult, confidenceResult, historyResult] = await Promise.all([
    assertionsPromise,
    confidencePromise,
    historiesPromise,
  ]);
  if (assertionResult.error)
    throw queryFailure("assertions", assertionResult.error);
  if (confidenceResult.error)
    throw queryFailure("confidence", confidenceResult.error);
  if (historyResult.error)
    throw queryFailure("name histories", historyResult.error);

  const assertionRows = asRows(assertionResult.data)
    .filter(
      (row) =>
        row.superseded_by == null &&
        isNamingField(String(row.entity_type), row.field_path) &&
        subjectKeys.has(
          databaseKey(String(row.entity_type), String(row.entity_id))
        )
    )
    .sort(
      (left, right) =>
        compareText(left.field_path, right.field_path) ||
        compareText(left.id, right.id)
    );
  const sourceIds = unique(
    assertionRows.flatMap((row) => stringArray(row.source_ids))
  );
  const sourceResult =
    sourceIds.length > 0
      ? await client
          .from("sources")
          .select(
            "id, title, author, url, year, page, tier, source_kind, oral_narratives(review_status)"
          )
          .in("id", sourceIds)
      : { data: [], error: null };
  if (sourceResult.error) throw queryFailure("sources", sourceResult.error);

  const sourcesById = new Map(
    asRows(sourceResult.data).map((row) => {
      const source = toEvidenceSource(row);
      return [source.id, source];
    })
  );
  const confidenceBySubject = new Map(
    asRows(confidenceResult.data).flatMap((row) => {
      const key = databaseKey(String(row.entity_type), String(row.entity_id));
      return subjectKeys.has(key) && typeof row.score === "number"
        ? [
            [
              key,
              {
                score: row.score,
                lastHumanAuditAt:
                  typeof row.last_human_audit_at === "string"
                    ? row.last_human_audit_at
                    : null,
              },
            ] as const,
          ]
        : [];
    })
  );

  const toldBySubject = new Map<string, ToldNames>();
  for (const row of asRows(historyResult.data)) {
    const key = searchNamingKey("people", String(row.id));
    toldBySubject.set(
      key,
      toldNames(
        String(row.id),
        row.name_history,
        row.name_index,
        confidenceBySubject.get(key)
      )
    );
  }
  // The fiche is the source of truth: an assertion an earlier load left for a
  // name yields to the fiche's account of the same name.
  const isTold = (key: string, fieldPath: unknown) =>
    toldBySubject.get(key)?.fieldPaths.has(String(fieldPath)) ?? false;

  const evidenceByAssertion = new Map<string, SearchEvidence>();
  const evidenceBySubject = new Map<string, SearchEvidence[]>();
  for (const row of assertionRows) {
    const statement = searchPresentationText(row.statement);
    const key = databaseKey(String(row.entity_type), String(row.entity_id));
    if (isTold(key, row.field_path)) continue;
    const confidence = confidenceBySubject.get(key);
    const orderedIds = unique(stringArray(row.source_ids));
    const sources = orderedIds.flatMap((id) => {
      const source = sourcesById.get(id);
      return source ? [source] : [];
    });
    if (
      !statement ||
      orderedIds.length === 0 ||
      sources.length !== orderedIds.length
    ) {
      continue;
    }

    const evidence: SearchEvidence = {
      assertion: {
        id: String(row.id),
        statement,
        ...(searchPresentationText(row.position)
          ? { position: searchPresentationText(row.position) }
          : {}),
        ...(nullableText(row.field_path)
          ? { fieldPath: String(row.field_path) }
          : {}),
        ...(confidence ? { confidenceScore: confidence.score } : {}),
        sourceCount: sources.length,
        lastHumanAuditAt: confidence?.lastHumanAuditAt ?? null,
      },
      sources,
      standing: strongestSearchSourceStanding(sources),
    };
    evidenceByAssertion.set(String(row.id), evidence);
    evidenceBySubject.set(key, [
      ...(evidenceBySubject.get(key) ?? []),
      evidence,
    ]);
  }

  const recordsBySubject = new Map<
    string,
    Array<{ rank: number; record: SearchNameRecord }>
  >();
  for (const [key, told] of toldBySubject) {
    recordsBySubject.set(key, [...told.records]);
    evidenceBySubject.set(
      key,
      [
        ...(evidenceBySubject.get(key) ?? []),
        ...told.records.flatMap(({ record }) => record.evidence),
      ].sort(
        (left, right) =>
          compareText(left.assertion.fieldPath, right.assertion.fieldPath) ||
          compareText(left.assertion.id, right.assertion.id)
      )
    );
  }
  for (const row of assertionRows) {
    if (row.entity_type !== "patronyme") continue;
    const spelling = SPELLING_FIELD_PATH.exec(String(row.field_path));
    const form = searchPresentationText(row.statement);
    if (!spelling || !form) continue;
    const key = databaseKey("patronyme", String(row.entity_id));
    const evidence = evidenceByAssertion.get(String(row.id));
    const claimStatus = claimStatusOf(row.confidence_level);
    const record: SearchNameRecord = {
      id: String(row.id),
      entityType: "patronyme",
      entityId: String(row.entity_id),
      form,
      kind: "surname",
      problematic: false,
      usedToday: false,
      ...(claimStatus ? { claimStatus } : {}),
      evidence: evidence ? [evidence] : [],
    };
    recordsBySubject.set(key, [
      ...(recordsBySubject.get(key) ?? []),
      { rank: Number(spelling[1]), record },
    ]);
  }

  return new Map(
    uniqueSubjects.map(({ type, id }) => {
      const key = searchNamingKey(type, id);
      return [
        key,
        {
          // Rank, then name: the order the sheet has always shown.
          records: (recordsBySubject.get(key) ?? [])
            .sort(
              (left, right) =>
                left.rank - right.rank ||
                compareText(left.record.form, right.record.form)
            )
            .map(({ record }) => record),
          evidence: evidenceBySubject.get(key) ?? [],
        },
      ];
    })
  );
}
