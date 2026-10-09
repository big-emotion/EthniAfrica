import { createServerClient } from "@/lib/supabase/server";
import { normalizeToKey } from "@/lib/normalize";
import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  nameRecordsFromHistory,
  type HistoryNameRecord,
} from "@/lib/afrik/nameHistoryRecords";
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

/** The field path a hand-sourced name record's assertion was loaded under. */
function nameFieldPath(nameType: string, nameText: string): string {
  return `names.${nameType}.${normalizeToKey(nameText)}`;
}

interface ToldNames {
  /** Each folded name, with its rank in the block. */
  records: Array<{ rank: number; record: SearchNameRecord }>;
  /** What the block covers, so a name_records row or an assertion for the same name is not shown twice. */
  fieldPaths: Set<string>;
}

/**
 * A people's names as its fiche's nameHistory tells them (REQ-196). A folded
 * name has no database assertion, so its evidence is built from the block's
 * own sources, in the shape the assertion of a name record had.
 */
function toldNames(
  entityId: string,
  rawHistory: unknown,
  confidence: { score: number; lastHumanAuditAt: string | null } | undefined
): ToldNames | undefined {
  if (rawHistory == null) return undefined;
  const parsed = parseNameHistory(rawHistory);
  if (!parsed.success) return undefined;

  const told: ToldNames = { records: [], fieldPaths: new Set() };
  nameRecordsFromHistory(parsed.data).forEach(
    (entry: HistoryNameRecord, rank) => {
      const id = `${entityId}:nameHistory:${rank}`;
      const fieldPath = nameFieldPath(entry.nameType, entry.nameText);
      const sources: SearchEvidenceSource[] = entry.sources.map(
        (source, index) => ({
          id: `${id}:source:${index}`,
          title: source.title,
          ...(nullableText(source.author) ? { author: source.author } : {}),
          ...(typeof source.year === "number" ? { year: source.year } : {}),
          ...(nullableText(source.url) ? { url: source.url } : {}),
          tier: searchSourceStanding(source.tier),
          sourceKind: source.source_kind,
        })
      );
      const evidence: SearchEvidence = {
        assertion: {
          id,
          statement: entry.nameText,
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
          form: entry.nameText,
          kind: entry.nameType,
          ...(nullableText(entry.languageOfOrigin)
            ? { languageOfOrigin: entry.languageOfOrigin }
            : {}),
          ...(nullableText(entry.meaning) ? { meaning: entry.meaning } : {}),
          ...(nullableText(entry.periodLabel)
            ? { periodLabel: entry.periodLabel }
            : {}),
          ...(nullableText(entry.shortLine)
            ? { shortLine: entry.shortLine }
            : {}),
          ...(nullableText(entry.imposedBy)
            ? { imposedBy: entry.imposedBy }
            : {}),
          ...(nullableText(entry.impositionPeriod)
            ? { impositionPeriod: entry.impositionPeriod }
            : {}),
          problematic: Boolean(nullableText(entry.whyProblematic)),
          usedToday: Boolean(nullableText(entry.contemporaryUsage)),
          evidence: [evidence],
        },
      });
    }
  );
  return told;
}

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
  const nameSubjects = uniqueSubjects.filter(
    ({ type }) => type === "people" || type === "patronyme"
  );

  const nameRecordsPromise =
    nameSubjects.length > 0
      ? client
          .from("name_records")
          .select(
            "id, entity_type, entity_id, name_text, name_type, language_of_origin, meaning, period_label, short_line, imposed_by, imposition_period, why_problematic, contemporary_usage, assertion_id, sort_rank"
          )
          .in("entity_type", ["people", "patronyme"])
          .in("entity_id", unique(nameSubjects.map(({ id }) => id)))
          .order("sort_rank", { ascending: true })
          .order("name_text", { ascending: true })
      : Promise.resolve({ data: [], error: null });

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
          .select("id, name_history")
          .in("id", peopleIds)
      : Promise.resolve({ data: [], error: null });

  const [nameResult, assertionResult, confidenceResult, historyResult] =
    await Promise.all([
      nameRecordsPromise,
      assertionsPromise,
      confidencePromise,
      historiesPromise,
    ]);
  if (nameResult.error) throw queryFailure("records", nameResult.error);
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
    const told = toldNames(
      String(row.id),
      row.name_history,
      confidenceBySubject.get(key)
    );
    if (told) toldBySubject.set(key, told);
  }
  // The block is the source of truth: the assertion a name_records row was
  // loaded with yields to the block's account of the same name.
  const isTold = (key: string, fieldPath: unknown) =>
    toldBySubject.get(key)?.fieldPaths.has(String(fieldPath)) ?? false;

  const evidenceByAssertion = new Map<string, SearchEvidence>();
  const assertionById = new Map(
    assertionRows.map((row) => [String(row.id), row])
  );
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
  for (const row of asRows(nameResult.data)) {
    const key = databaseKey(String(row.entity_type), String(row.entity_id));
    if (!subjectKeys.has(key)) continue;
    if (
      isTold(key, nameFieldPath(String(row.name_type), String(row.name_text)))
    )
      continue;
    const evidence = evidenceByAssertion.get(String(row.assertion_id));
    const claimStatus = claimStatusOf(
      assertionById.get(String(row.assertion_id))?.confidence_level
    );
    const record: SearchNameRecord = {
      id: String(row.id),
      entityType: String(row.entity_type),
      entityId: String(row.entity_id),
      form: String(row.name_text),
      kind: row.name_type as SearchNameRecord["kind"],
      ...(nullableText(row.language_of_origin)
        ? { languageOfOrigin: String(row.language_of_origin) }
        : {}),
      ...(nullableText(row.meaning) ? { meaning: String(row.meaning) } : {}),
      ...(nullableText(row.period_label)
        ? { periodLabel: String(row.period_label) }
        : {}),
      ...(nullableText(row.short_line)
        ? { shortLine: String(row.short_line) }
        : {}),
      ...(nullableText(row.imposed_by)
        ? { imposedBy: String(row.imposed_by) }
        : {}),
      ...(nullableText(row.imposition_period)
        ? { impositionPeriod: String(row.imposition_period) }
        : {}),
      problematic: Boolean(nullableText(row.why_problematic)),
      usedToday: Boolean(nullableText(row.contemporary_usage)),
      ...(claimStatus ? { claimStatus } : {}),
      evidence: evidence ? [evidence] : [],
    };
    recordsBySubject.set(key, [
      ...(recordsBySubject.get(key) ?? []),
      { rank: Number(row.sort_rank ?? 0), record },
    ]);
  }

  return new Map(
    uniqueSubjects.map(({ type, id }) => {
      const key = searchNamingKey(type, id);
      return [
        key,
        {
          // The order name_records is read in: rank, then name.
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
