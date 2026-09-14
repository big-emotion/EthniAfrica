/**
 * FR65 verification gate: the single predicate deciding whether a
 * fiche/assertion may feed a quiz question. Used identically by the
 * generation sweep (scripts/generateQuizQuestions.ts, Story 10.5) and the
 * serve-time re-check (quizService, Story 10.6) so the credibility rule
 * lives in one place.
 */

import {
  isAuthoritativeSourceTier,
  SOURCE_KINDS,
  toSourceTier,
  type SourceKind,
  type SourceTier,
} from "@/types/sources";

/** The oral narrative an `oral_tradition` source points at, reduced to what attributes it. */
export interface QuizOralTradition {
  narrativeCode: string | null;
  community: string | null;
}

export interface QuizAssertionSource {
  tier: SourceTier;
  /**
   * `sources.verified_at is not null` — "the most recent human verification of
   * this source". Recorded, and no longer consulted here: see the note on
   * `hasEligibleSource`.
   */
  resolvable: boolean;
  sourceKind?: SourceKind;
  oralTradition?: QuizOralTradition;
}

export interface QuizEligibilityInput {
  confidenceScore: number;
  /**
   * Recorded, and no longer consulted here. It still feeds the confidence
   * score's recency factor in `recompute_confidence`, so an audited fiche
   * scores higher and clears the bar more easily — it simply is not a gate of
   * its own any more.
   */
  lastHumanAuditAt: string | null;
  assertionSources: QuizAssertionSource[];
  openFlagCount: number;
}

// The reason keeps its historical name: the generation-run audit counters
// are keyed on it, and an attributed oral tradition now also satisfies it.
export type QuizEligibilityRejectionReason =
  | "confidence_below_threshold"
  | "no_authoritative_source"
  | "open_flags_present";

export type QuizEligibilityResult =
  | { eligible: true; reason: null }
  | { eligible: false; reason: QuizEligibilityRejectionReason };

/**
 * The `sources` columns both callers read, spelled once so the generation
 * sweep and the serve-time re-check cannot feed the gate different inputs.
 * The narrative is embedded through `sources.oral_narrative_id` (migration
 * 089). Under the anon key its RLS hides a narrative that is not public, and
 * the embed then reads null — the gate fails closed on it rather than open.
 */
// @req REQ-175
export const QUIZ_SOURCE_COLUMNS =
  "id, tier, verified_at, source_kind, oral_narratives(narrative_code, community)";

interface QuizSourceNarrativeRow {
  narrative_code: string | null;
  community: string | null;
}

export interface QuizSourceRow {
  tier: string | null;
  verified_at: string | null;
  source_kind?: string | null;
  // PostgREST returns one object for this many-to-one embed, but supabase-js,
  // with no generated database types, infers an array. Both are accepted so
  // the type describes what the client claims and the mapper what arrives.
  oral_narratives?: QuizSourceNarrativeRow | QuizSourceNarrativeRow[] | null;
}

/**
 * Absent fields stay absent rather than null, so a written source maps to the
 * same `{ tier, resolvable }` it always did.
 */
// @req REQ-175
export function toQuizAssertionSource(row: QuizSourceRow): QuizAssertionSource {
  const source: QuizAssertionSource = {
    tier: toSourceTier(row.tier),
    resolvable: row.verified_at !== null,
  };
  if (SOURCE_KINDS.includes(row.source_kind as SourceKind)) {
    source.sourceKind = row.source_kind as SourceKind;
  }
  const narrative = Array.isArray(row.oral_narratives)
    ? row.oral_narratives[0]
    : row.oral_narratives;
  if (narrative) {
    source.oralTradition = {
      narrativeCode: narrative.narrative_code,
      community: narrative.community,
    };
  }
  return source;
}

/**
 * 80 was unreachable rather than strict.
 *
 * `recompute_confidence` (migration 041) reserves 0.20 of the score for an
 * audit's recency factor: `0.50 × sources + 0.30 × quality + 0.20 × recency`.
 * With no audit the recency term is 0, so a fiche caps at 0.80 however well
 * sourced it is — and 80 therefore demanded a perfect source base *and* an
 * audit. Measured on the corpus: median 0.68, maximum 0.80, seven fiches at
 * the cap.
 *
 * 60 is three quarters of the reachable range — the same relative bar 80 was
 * meant to be on the full one. An audit still helps: it adds up to 0.20, so an
 * audited fiche clears this comfortably.
 */
// @req REQ-103
export const DEFAULT_QUIZ_MIN_CONFIDENCE = 60;

/**
 * `confidence_scores.score` is stored as a `[0,1]` decimal; the threshold
 * above is on a 0-100 scale. The conversion lives here, next to the bar it
 * feeds, because two callers read that same column — the generation sweep and
 * the serve-time re-check — and only one of them used to convert. The other
 * compared a raw 0.68 against 60, so every question in the bank failed the
 * gate and players got an empty session.
 *
 * A missing score yields 0, which fails the gate rather than defaulting open.
 */
// @req REQ-103
export function toQuizConfidenceScore(
  storedScore: number | null | undefined
): number {
  return storedScore != null ? Math.round(storedScore * 100) : 0;
}

/** Reads QUIZ_MIN_CONFIDENCE at call time so callers/tests can override it per-invocation. */
// @req REQ-103
export function getQuizMinConfidence(): number {
  const raw = process.env.QUIZ_MIN_CONFIDENCE;
  if (!raw) return DEFAULT_QUIZ_MIN_CONFIDENCE;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_QUIZ_MIN_CONFIDENCE;
}

/**
 * The community an `oral_tradition` source attributes its account to, or null
 * when either half of the attribution is missing. Both halves are required:
 * without the narrative the round points at nothing a reader can open, and
 * without the community it cannot say whose tradition it plays.
 */
function attributedCommunity(source: QuizAssertionSource): string | null {
  if (source.sourceKind !== "oral_tradition") return null;
  const narrativeCode = source.oralTradition?.narrativeCode?.trim();
  const community = source.oralTradition?.community?.trim();
  return narrativeCode && community ? community : null;
}

/**
 * A quiz asserts an answer as correct, so it needs a source that carries
 * authority of its own — `official` or `referenced` — or, since DEC-055, an
 * oral tradition attributed to a named community. The latter is played as
 * what that community tells, and the item says so (see
 * `oralTraditionCommunity`). Every other `unverified` source may back a
 * published fiche but not a quiz answer.
 *
 * What was dropped earlier is the `resolvable` conjunct — `sources.verified_at
 * is not null`, a second, separate human verification. Nothing in the corpus
 * performs it: no loader writes `verified_at`, so every source read as
 * unresolvable and this predicate returned false for all 17 802 candidates
 * however well sourced they were.
 *
 * The standing stays visible either way: the reveal renders each source's tier
 * through `SOURCE_TIER_LABELS`, so a reader sees what an answer rests on.
 */
function hasEligibleSource(sources: QuizAssertionSource[]): boolean {
  return sources.some(
    (source) =>
      isAuthoritativeSourceTier(source.tier) ||
      attributedCommunity(source) !== null
  );
}

/**
 * The community whose oral tradition an item rests on, when that tradition is
 * what qualifies it. A written source at authority standing already carries
 * the answer on its own, so such an item is not attributed to a tradition.
 */
// @req REQ-175
export function oralTraditionCommunity(
  sources: QuizAssertionSource[]
): string | null {
  if (sources.some((source) => isAuthoritativeSourceTier(source.tier))) {
    return null;
  }
  for (const source of sources) {
    const community = attributedCommunity(source);
    if (community) return community;
  }
  return null;
}

/**
 * Conditions are checked in a fixed precedence order (confidence → source
 * tier → open flags) so a single deterministic rejection reason feeds the
 * generation-run audit counters, even when several conditions fail on the
 * same candidate.
 *
 * The human-audit condition that used to sit second is gone. It asked for
 * `last_human_audit_at`, which no fiche carries and no loader may write —
 * forging it would attest to a review that never happened. The rule now
 * states its bar in terms of what the corpus actually records: a confidence
 * score, a source tier a curator assigned, and no open flag.
 */
// @req REQ-103 REQ-175
export function isQuizEligible(
  input: QuizEligibilityInput
): QuizEligibilityResult {
  if (input.confidenceScore < getQuizMinConfidence()) {
    return { eligible: false, reason: "confidence_below_threshold" };
  }
  if (!hasEligibleSource(input.assertionSources)) {
    return { eligible: false, reason: "no_authoritative_source" };
  }
  if (input.openFlagCount !== 0) {
    return { eligible: false, reason: "open_flags_present" };
  }
  return { eligible: true, reason: null };
}
