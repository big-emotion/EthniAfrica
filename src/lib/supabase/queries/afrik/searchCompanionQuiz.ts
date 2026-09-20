import type { CompanionQuizCandidate } from "@/lib/search/companionCatalogs";
import type { CompanionMatch } from "@/lib/search/companionRelations";
import {
  isQuizEligible,
  QUIZ_SOURCE_COLUMNS,
  toQuizAssertionSource,
  toQuizConfidenceScore,
  type QuizAssertionSource,
  type QuizSourceRow,
} from "@/lib/quiz/eligibility";
import { createServerClient } from "@/lib/supabase/server";
import { toSourceTier, type SourceTier } from "@/types/sources";
import type { QuizOptionValue, QuizTemplateId } from "@/types/quiz";
import type { Language } from "@/types/shared";

type SearchClient = ReturnType<typeof createServerClient>;
type QuizEntityType = "people" | "country";

interface QuizQuestionRow {
  id: string;
  template_id: QuizTemplateId;
  difficulty: number;
  entity_type: QuizEntityType;
  entity_id: string;
  prompt_fr: string;
  stimulus_fr: string | null;
  options_fr: QuizOptionValue[];
  correct_option: number;
  explanation_fr: string;
  assertion_id: string;
  source_ids: string[] | null;
}

interface ConfidenceRow {
  entity_type: QuizEntityType;
  entity_id: string;
  score: number | null;
  last_human_audit_at?: string | null;
}

interface FlagRow {
  entity_type?: QuizEntityType;
  entity_id: string;
  status: string | null;
}

interface SourceRow extends QuizSourceRow {
  id: string;
  title: string;
  url: string | null;
  tier: string | null;
}

export interface SearchCompanionQuizCandidate extends CompanionQuizCandidate {
  contentLanguage: Language;
  prompt: string;
  stimulus: string | null;
  options: QuizOptionValue[];
  correctOption: number;
  explanation: string;
  assertionId: string;
  source: {
    title: string;
    url: string | null;
    tier: SourceTier;
  };
  entity: { type: QuizEntityType; id: string };
}

const QUESTION_COLUMNS =
  "id,template_id,difficulty,entity_type,entity_id,prompt_fr,stimulus_fr,options_fr,correct_option,explanation_fr,assertion_id,source_ids";
const SOURCE_COLUMNS = `title,url,${QUIZ_SOURCE_COLUMNS}`;
const FILTER_BUDGET = 8_000;
const SOURCE_RANK: Record<SourceTier, number> = {
  official: 0,
  referenced: 1,
  unverified: 2,
};

function key(type: QuizEntityType, id: string): string {
  return `${type}:${id}`;
}

function isQuizTarget(
  target: CompanionMatch
): target is CompanionMatch & { entityType: QuizEntityType } {
  return target.entityType === "people" || target.entityType === "country";
}

function failure(table: string, error: unknown): Error {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);
  return new Error(
    `Failed to load search companion quiz candidates from ${table}: ${message}`
  );
}

/** Split `.in(...)` values by URL characters, not by an unsafe fixed count. */
function chunkForUrl(ids: readonly string[]): string[][] {
  if (ids.length === 0) return [];
  const longest = ids.reduce((max, id) => Math.max(max, id.length), 0);
  const size = Math.max(1, Math.floor(FILTER_BUDGET / (longest + 3)));
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

interface QueryResult {
  data: unknown;
  error: unknown;
}

async function readInChunks<Row>(
  table: string,
  ids: readonly string[],
  read: (chunk: string[]) => PromiseLike<QueryResult>
): Promise<Row[]> {
  const results = await Promise.all(chunkForUrl(ids).map(read));
  for (const result of results) {
    if (result.error) throw failure(table, result.error);
  }
  return results.flatMap((result) => (result.data ?? []) as Row[]);
}

function bestSource(
  ids: readonly string[],
  sourceById: ReadonlyMap<string, SourceRow>
): SourceRow | undefined {
  return ids
    .map((id) => sourceById.get(id))
    .filter((source): source is SourceRow =>
      Boolean(source?.title.trim().length)
    )
    .sort(
      (left, right) =>
        SOURCE_RANK[toSourceTier(left.tier)] -
        SOURCE_RANK[toSourceTier(right.tier)]
    )[0];
}

/** Load active, freshly eligible quiz questions for exact and ring-1 targets. */
// @req REQ-180
export async function loadSearchCompanionQuizCandidates(
  targets: readonly CompanionMatch[],
  language: Language,
  client: SearchClient = createServerClient()
): Promise<SearchCompanionQuizCandidate[]> {
  const quizTargets = Array.from(
    new Map(
      targets
        .filter(isQuizTarget)
        .map(
          (target) => [key(target.entityType, target.entityId), target] as const
        )
    ).values()
  );
  if (quizTargets.length === 0) return [];

  const entityIds = [...new Set(quizTargets.map(({ entityId }) => entityId))];
  const questionRows = await readInChunks<QuizQuestionRow>(
    "quiz_questions",
    entityIds,
    (chunk) =>
      client
        .from("quiz_questions")
        .select(QUESTION_COLUMNS)
        .eq("locale", language)
        .is("revoked_at", null)
        .in("entity_id", chunk)
        .order("difficulty", { ascending: true })
        .order("template_id", { ascending: true })
        .order("id", { ascending: true })
  );

  const targetKeys = new Set(
    quizTargets.map(({ entityType, entityId }) => key(entityType, entityId))
  );
  const rows = questionRows
    .filter((row) => targetKeys.has(key(row.entity_type, row.entity_id)))
    .sort(
      (left, right) =>
        left.difficulty - right.difficulty ||
        left.template_id.localeCompare(right.template_id) ||
        left.id.localeCompare(right.id)
    );
  if (rows.length === 0) return [];

  const sourceIds = [...new Set(rows.flatMap((row) => row.source_ids ?? []))];
  const [confidenceRows, flagRows, sourceRows] = await Promise.all([
    readInChunks<ConfidenceRow>("confidence_scores", entityIds, (chunk) =>
      client
        .from("confidence_scores")
        .select("entity_type,entity_id,score,last_human_audit_at")
        .in("entity_id", chunk)
    ),
    readInChunks<FlagRow>("flags", entityIds, (chunk) =>
      client
        .from("flags")
        .select("entity_type,entity_id,status")
        .eq("status", "open")
        .in("entity_id", chunk)
    ),
    readInChunks<SourceRow>("sources", sourceIds, (chunk) =>
      client.from("sources").select(SOURCE_COLUMNS).in("id", chunk)
    ),
  ]);

  const confidenceByEntity = new Map(
    confidenceRows.map((row) => [key(row.entity_type, row.entity_id), row])
  );
  const openFlagsByEntity = new Map<string, number>();
  for (const row of flagRows) {
    if (row.status !== "open") continue;
    const matchingTypes = row.entity_type
      ? [row.entity_type]
      : quizTargets
          .filter(({ entityId }) => entityId === row.entity_id)
          .map(({ entityType }) => entityType as QuizEntityType);
    for (const entityType of matchingTypes) {
      const entityKey = key(entityType, row.entity_id);
      openFlagsByEntity.set(
        entityKey,
        (openFlagsByEntity.get(entityKey) ?? 0) + 1
      );
    }
  }
  const sourceById = new Map(sourceRows.map((row) => [row.id, row]));

  return rows.flatMap<SearchCompanionQuizCandidate>((row) => {
    const entityKey = key(row.entity_type, row.entity_id);
    const confidence = confidenceByEntity.get(entityKey);
    const assertionSources: QuizAssertionSource[] = (row.source_ids ?? [])
      .map((id) => sourceById.get(id))
      .filter((source): source is SourceRow => Boolean(source))
      .map(toQuizAssertionSource);
    const eligibility = isQuizEligible({
      confidenceScore: toQuizConfidenceScore(confidence?.score),
      lastHumanAuditAt: confidence?.last_human_audit_at ?? null,
      assertionSources,
      openFlagCount: openFlagsByEntity.get(entityKey) ?? 0,
    });
    const source = bestSource(row.source_ids ?? [], sourceById);
    if (!eligibility.eligible || !source) return [];

    return [
      {
        id: row.id,
        eligible: true,
        difficulty: row.difficulty,
        templateId: row.template_id,
        subjects: [{ entityType: row.entity_type, entityId: row.entity_id }],
        contentLanguage: language,
        prompt: row.prompt_fr,
        stimulus: row.stimulus_fr,
        options: row.options_fr,
        correctOption: row.correct_option,
        explanation: row.explanation_fr,
        assertionId: row.assertion_id,
        source: {
          title: source.title,
          url: source.url,
          tier: toSourceTier(source.tier),
        },
        entity: { type: row.entity_type, id: row.entity_id },
      },
    ];
  });
}
