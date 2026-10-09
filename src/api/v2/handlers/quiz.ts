/**
 * Quiz handlers — assemble the Module #0 envelope for `/v2/quiz/scopes` and
 * `/v2/quiz/session`, and hold the business logic the route layer must not:
 * the French label of a scope, whether a scope holds enough questions to be
 * launched (422 SEMANTIC_ERROR), and the source/entity-link enrichment of raw
 * `quizService.composeQuizSession` rows (Epic 10, Story 10.7, ETNI-496).
 */

import {
  getQuizScopeCatalogue,
  getQuizScopeLabel,
  composeQuizSession,
  type QuizScopeOption,
  type QuizSessionQuestion,
} from "@/api/v2/services/quizService";
import {
  getQuizRevealSources,
  getQuizSubjectNames,
  type QuizRevealSource,
  type QuizSubjectName,
} from "@/api/v2/services/quizReveal";
import {
  parseQuizScope,
  QUIZ_SESSION_SIZE,
  type QuizScope,
} from "@/lib/quiz/quizScope";
import { QUIZ_THEME_IDS, type QuizThemeId } from "@/lib/quiz/segmentPolicy";
import type { QuizEntityType } from "@/types/quiz";
import { SOURCE_TIERS } from "@/types/sources";
import { createApiResponse, type ApiEnvelope } from "@/api/v2/utils/response";
import type {
  QuizSessionQuery,
  QuizScopesData,
  QuizScopeOptionView,
  QuizScopeView,
  QuizSessionData,
  QuizSessionQuestionView,
  QuizSourceRefView,
  QuizEntityLinkView,
} from "@/api/v2/schemas/quiz";
import type { Language } from "@/types/shared";

/** The whole-corpus tracks, which have no entity and so no name in the corpus. */
const CORPUS_SCOPE_LABELS: Record<
  Language,
  Record<"mixed" | "random", string>
> = {
  fr: { mixed: "Tout le continent", random: "Au hasard" },
};

/**
 * A track is launchable when it can fill a session outright.
 *
 * Not "holds at least one question": a track offering three is a track that
 * repeats the same subject three times over eight rounds.
 *
 * Khoïsan — one people, four questions — was the case this was written
 * against. It holds eleven now, and measured 2026-09-01 no country, family or
 * theme is unplayable on its own: all 54, all 23 and all 9 fill a session. The
 * threshold has not become decorative, it has moved — `playableThemeIds` runs
 * it over the 486 country × theme pairs, 123 of which cannot pay, and
 * `composeQuizSessionHandler` runs it again over the pool a draw actually
 * found. One predicate for both, so what the picker offers and what the
 * session refuses cannot drift.
 */
// @req REQ-103
export function isPlayableScope(activeQuestionCount: number): boolean {
  return activeQuestionCount >= QUIZ_SESSION_SIZE;
}

function toScopeOptionView(option: QuizScopeOption): QuizScopeOptionView {
  return {
    id: option.id,
    labelFr: option.labelFr,
    activeQuestionCount: option.activeQuestionCount,
    playable: isPlayableScope(option.activeQuestionCount),
    // The same threshold as the track itself, deliberately: what the picker
    // offers and what `composeQuizSessionHandler` refuses have to be one
    // predicate, or a card appears for a pair the session then rejects.
    // Ordered by QUIZ_THEME_IDS rather than by count — the picker is a table of
    // contents and must not reshuffle as the bank grows.
    playableThemeIds: QUIZ_THEME_IDS.filter((themeId) =>
      isPlayableScope(option.questionCountByTheme?.[themeId] ?? 0)
    ),
  };
}

// @req REQ-103
export async function getQuizScopesHandler(
  language: Language = "fr"
): Promise<ApiEnvelope<QuizScopesData>> {
  const catalogue = await getQuizScopeCatalogue(language);
  const corpusOption = (id: "mixed" | "random"): QuizScopeOptionView => ({
    id,
    labelFr: CORPUS_SCOPE_LABELS[language][id],
    activeQuestionCount: catalogue.totalActiveQuestionCount,
    playable: isPlayableScope(catalogue.totalActiveQuestionCount),
    // A whole-corpus track can play whatever the corpus itself can play, so
    // this reads the same totals the `themes` axis is built from.
    playableThemeIds: catalogue.themes
      .filter((theme) => isPlayableScope(theme.activeQuestionCount))
      .map((theme) => theme.id),
  });

  return createApiResponse({
    countries: catalogue.countries.map(toScopeOptionView),
    families: catalogue.families.map(toScopeOptionView),
    themes: catalogue.themes.map((theme) => ({
      id: theme.id,
      labelFr: theme.labelFr,
      activeQuestionCount: theme.activeQuestionCount,
      playable: isPlayableScope(theme.activeQuestionCount),
    })),
    mixed: corpusOption("mixed"),
    random: corpusOption("random"),
  });
}

/** Lower rank = higher priority. Unknown/null tiers sort last. */
const SOURCE_TIER_RANK: Record<string, number> = Object.fromEntries(
  SOURCE_TIERS.map((tier, rank) => [tier, rank])
);

const EMPTY_SOURCE_REF: QuizSourceRefView = {
  title: "",
  year: null,
  tier: null,
  url: null,
  sourceKind: null,
};

/**
 * Every serving question already carries an authoritative source
 * (FR65 gate, re-checked in `composeQuizSession`), so this only chooses
 * *which* one to surface as the answer-reveal source line — highest tier
 * first, ties broken by `sourceIds` order.
 */
function pickBestSource(
  sourceIds: string[],
  sourceMap: Map<string, QuizRevealSource>
): QuizSourceRefView {
  const resolved = sourceIds
    .map((id) => sourceMap.get(id))
    .filter((row): row is QuizRevealSource => Boolean(row));

  const [best] = resolved.sort(
    (a, b) =>
      (SOURCE_TIER_RANK[a.tier ?? ""] ?? 99) -
      (SOURCE_TIER_RANK[b.tier ?? ""] ?? 99)
  );

  if (!best) return EMPTY_SOURCE_REF;

  return {
    title: best.title,
    year: best.year,
    tier: best.tier,
    url: best.url,
    sourceKind: best.sourceKind,
  };
}

function entityLinkFor(
  id: string,
  type: QuizEntityType = "people"
): QuizEntityLinkView {
  return { type, id, slug: id, autonym: null, exonym: null };
}

function toEntityLinkView(name: QuizSubjectName): QuizEntityLinkView {
  return {
    type: name.type,
    id: name.id,
    slug: name.id,
    autonym: name.autonym,
    exonym: name.exonym,
  };
}

function buildQuestionView(
  question: QuizSessionQuestion,
  sourceMap: Map<string, QuizRevealSource>,
  subjectNames: Map<string, QuizSubjectName>
): QuizSessionQuestionView {
  const subjectName = subjectNames.get(question.entityId);
  return {
    id: question.id,
    templateId: question.templateId,
    promptFr: question.promptFr,
    stimulusFr: question.stimulusFr,
    optionsFr: question.optionsFr,
    correctOption: question.correctOption,
    explanationFr: question.explanationFr,
    source: pickBestSource(question.sourceIds, sourceMap),
    assertionId: question.assertionId,
    entity: subjectName
      ? toEntityLinkView(subjectName)
      : entityLinkFor(question.entityId, question.entityType),
  };
}

/**
 * Names a scope for the reader: the entity's own name, or the corpus track's.
 * Null means the query named a country or family the corpus does not hold —
 * well-formed but meaningless, which is a 422 and not a 400.
 */
// @req REQ-103
export async function describeScope(
  scope: QuizScope,
  language: Language = "fr"
): Promise<QuizScopeView | null> {
  if (scope.kind === "mixed" || scope.kind === "random") {
    return {
      kind: scope.kind,
      entityId: null,
      labelFr: CORPUS_SCOPE_LABELS[language][scope.kind],
    };
  }

  const labelFr = await getQuizScopeLabel(scope);
  if (!labelFr) return null;

  return { kind: scope.kind, entityId: scope.entityId ?? null, labelFr };
}

export type ComposeQuizSessionHandlerResult =
  | { ok: true; envelope: ApiEnvelope<QuizSessionData> }
  | { ok: false; code: "SEMANTIC_ERROR"; message: string };

/**
 * The shape of `pays`/`famille` is validated by the Zod schema (route layer);
 * whether the entity it names exists and holds a session's worth of questions
 * needs the bank as well as the query, so it is checked here and mapped to 422
 * SEMANTIC_ERROR, never 400 — the same split the retired segment/rung check
 * followed.
 */
// @req REQ-103
export async function composeQuizSessionHandler(
  query: QuizSessionQuery
): Promise<ComposeQuizSessionHandlerResult> {
  const language = query.lang ?? "fr";
  const scope = parseQuizScope(query);
  const described = await describeScope(scope, language);

  if (!described) {
    return {
      ok: false,
      code: "SEMANTIC_ERROR",
      message: `No ${scope.kind} known as "${scope.entityId}"`,
    };
  }

  const draw = await composeQuizSession({
    scope,
    count: query.count,
    theme: query.theme as QuizThemeId | undefined,
    language,
  });
  const questions = draw.questions;

  // A pair the corpus cannot fill is refused, never half-dealt.
  //
  // Zero and three are different events, and the asymmetry below is deliberate.
  // Zero deals nothing and has nothing to be dishonest about — the client has a
  // calm empty state written for it. One to seven *is* dealt: it presents
  // itself as a track and is a stub whose difficulty ladder has no top rung,
  // which is what « Djibouti + Migrations » used to serve in silence.
  //
  // Measured against `poolSize`, not against the session, so a fat pool the
  // serve-time freshness gate shortened still answers 200: a pair that could
  // pay and then failed a re-check is not a pair the corpus never held.
  //
  // The threshold is `isPlayableScope`, the same predicate the picker offers
  // tracks with, so what is offered and what is refused cannot drift apart.
  if (draw.poolSize > 0 && !isPlayableScope(draw.poolSize)) {
    return {
      ok: false,
      code: "SEMANTIC_ERROR",
      message: `Not enough questions to fill a session of ${query.count} for this track`,
    };
  }

  if (questions.length === 0) {
    return {
      ok: true,
      envelope: createApiResponse({ scope: described, questions: [] }),
    };
  }

  const sourceIds = Array.from(
    new Set(questions.flatMap((question) => question.sourceIds))
  );
  const subjectIdsByType = (entityType: QuizEntityType) =>
    Array.from(
      new Set(
        questions
          .filter((question) => question.entityType === entityType)
          .map((question) => question.entityId)
      )
    );

  const [sourceMap, subjectNames] = await Promise.all([
    getQuizRevealSources(sourceIds),
    getQuizSubjectNames(
      subjectIdsByType("people"),
      subjectIdsByType("country")
    ),
  ]);

  return {
    ok: true,
    envelope: createApiResponse({
      scope: described,
      questions: questions.map((question) =>
        buildQuestionView(question, sourceMap, subjectNames)
      ),
    }),
  };
}
