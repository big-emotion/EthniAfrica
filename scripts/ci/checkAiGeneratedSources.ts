/**
 * CI gate — no machine-written source enters the corpus without a person
 * looking at it.
 *
 * `source_kind: "ai_generated"` marks a citation whose text came from agent or
 * internet output rather than from a work someone consulted. The policy does
 * not forbid it — it labels it — so the failure mode is a new one slipping in
 * without anyone deciding on it. The ratchet counts the unreviewed ones: an
 * ai_generated source leaves the count when the verification ledger
 * (docs/editorial/source-review/ai-source-verifications.json) records a
 * person keeping it (`rejected`, `oral_needed`) or when an accepted candidate
 * replaces it. A proposal is still unreviewed.
 *
 * It also holds the corpus to that ledger: an accepted verification the fiche
 * does not carry yet, or contradicts, fails here rather than silently
 * reverting at the next sync.
 *
 * Usage: npx tsx scripts/ci/checkAiGeneratedSources.ts [datasetRoot]
 */
import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  findUnreviewedAiGeneratedSources,
  findVerificationContradictions,
  readVerificationLedger,
  validateVerification,
  validateVerifications,
  type AiGeneratedSource,
  type AiSourceVerification,
} from "../afrik/aiSourceVerifications";
import { readCorpusFiches } from "../afrik/sourceTierRulings";

const DEFAULT_DATASET_ROOT = "dataset/source/afrik";

/**
 * A ratchet, not a budget — the rule of `NEEDS_REVIEW_RATCHET`: a count above
 * it fails, and so does a count below it, because a ceiling left above the
 * real number is room to regress into. Applying accepted verifications lowers
 * this line in the same change; NEVER raise it.
 *
 * 1343 measured 2026-10-08 with an empty ledger: 494 patronyme `sources[]`
 * entries, plus 849 `provenance` markers in the anthroponym candidate queue
 * (patronymes/_candidates-by-country.json). 1343 -> 1341 on 2026-10-09: PAT_ABABDA
 * and PAT_ABAZA decided oral_needed. 1341 -> 1321 on 2026-10-10: batch 1 of
 * ETNI-2010 decided, PAT_LAWSON oral_needed and 19 sources replaced.
 */
export const UNREVIEWED_AI_GENERATED_RATCHET = 1321;

export interface AiGeneratedSourcesResult {
  ok: boolean;
  count: number;
  threshold: number;
  sources: AiGeneratedSource[];
  /** Why the gate failed, including which line to change; null when it holds. */
  error: string | null;
}

export function checkAiGeneratedSources(
  datasetRoot: string,
  threshold: number,
  verifications: AiSourceVerification[] = []
): AiGeneratedSourcesResult {
  const sources = findUnreviewedAiGeneratedSources(
    readCorpusFiches(datasetRoot),
    verifications
  );
  const count = sources.length;

  let error: string | null = null;
  if (count > threshold) {
    error = `${count} unreviewed ai_generated sources exceed the ratchet of ${threshold}: a new ai_generated source entered the corpus — source it, or have a person decide on it in the verification ledger (${AI_SOURCE_VERIFICATIONS_LEDGER}). Do not raise the ratchet.`;
  } else if (count < threshold) {
    error = `${count} unreviewed ai_generated sources against a ratchet of ${threshold} — lower UNREVIEWED_AI_GENERATED_RATCHET to ${count} in scripts/ci/checkAiGeneratedSources.ts so it cannot climb back.`;
  }

  return { ok: error === null, count, threshold, sources, error };
}

export interface AiSourceVerificationsResult {
  ok: boolean;
  errors: string[];
}

/**
 * The ledger's side of the gate. A malformed entry is reported and not held
 * against the corpus: its contradictions would only restate the malformation.
 */
export function checkAiSourceVerifications(
  datasetRoot: string,
  ledgerPath: string
): AiSourceVerificationsResult {
  const entries = readVerificationLedger(ledgerPath);
  const wellFormed = entries.filter(
    (entry, index) => validateVerification(entry, index).length === 0
  );
  const errors = [
    ...validateVerifications(entries),
    ...findVerificationContradictions(
      readCorpusFiches(datasetRoot),
      wellFormed
    ),
  ];
  return { ok: errors.length === 0, errors };
}

function main(): void {
  const datasetRoot = process.argv[2] ?? DEFAULT_DATASET_ROOT;
  const result = checkAiGeneratedSources(
    datasetRoot,
    UNREVIEWED_AI_GENERATED_RATCHET,
    readVerificationLedger(AI_SOURCE_VERIFICATIONS_LEDGER)
  );

  const fiches = new Set(result.sources.map((source) => source.fiche));
  console.log(
    `unreviewed ai_generated sources: ${result.count} across ${fiches.size} fiches (ratchet: ${result.threshold})`
  );

  if (result.count > result.threshold) {
    for (const source of result.sources.slice(0, 40)) {
      console.log(
        `  ${source.fiche} ${source.path}: ${source.original.title ?? "(untitled)"}`
      );
    }
  }

  const ledger = checkAiSourceVerifications(
    datasetRoot,
    AI_SOURCE_VERIFICATIONS_LEDGER
  );
  for (const error of ledger.errors) console.error(error);

  if (!result.ok) console.error(result.error);
  if (!result.ok || !ledger.ok) process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith("checkAiGeneratedSources.ts")) {
  main();
}
