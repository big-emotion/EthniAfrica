/**
 * CI gate — no machine-written source enters the corpus unnoticed.
 *
 * `source_kind: "ai_generated"` marks a citation whose text came from agent or
 * internet output rather than from a work someone consulted. The policy does
 * not forbid it — it labels it — so the failure mode is a new one slipping in
 * without anyone deciding to accept it. A ratchet catches that; the
 * verification ledger (docs/editorial/source-review/ai-source-verifications.json)
 * is how the count comes down, one human decision at a time.
 *
 * It also holds the corpus to that ledger: an accepted verification the fiche
 * does not carry yet, or contradicts, fails here rather than silently
 * reverting at the next sync.
 *
 * Usage: npx tsx scripts/ci/checkAiGeneratedSources.ts [datasetRoot]
 */
import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  findAiGeneratedSources,
  findVerificationContradictions,
  readVerificationLedger,
  validateVerification,
  validateVerifications,
  type AiGeneratedSource,
} from "../afrik/aiSourceVerifications";
import { readCorpusFiches } from "../afrik/sourceTierRulings";

const DEFAULT_DATASET_ROOT = "dataset/source/afrik";

/**
 * A ratchet, not a budget — the rule of `NEEDS_REVIEW_RATCHET`: a count above
 * it fails, and so does a count below it, because a ceiling left above the
 * real number is room to regress into. Applying accepted verifications lowers
 * this line in the same change; NEVER raise it.
 *
 * 1343 measured 2026-10-08: 494 patronyme `sources[]` entries, plus 849
 * `provenance` markers in the anthroponym candidate queue
 * (patronymes/_candidates-by-country.json).
 */
export const AI_GENERATED_RATCHET = 1343;

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
  threshold: number
): AiGeneratedSourcesResult {
  const sources = findAiGeneratedSources(readCorpusFiches(datasetRoot));
  const count = sources.length;

  let error: string | null = null;
  if (count > threshold) {
    error = `${count} ai_generated sources exceed the ratchet of ${threshold}: a new ai_generated source entered the corpus — source it or record it in the verification ledger (${AI_SOURCE_VERIFICATIONS_LEDGER}). Do not raise the ratchet.`;
  } else if (count < threshold) {
    error = `${count} ai_generated sources against a ratchet of ${threshold} — lower AI_GENERATED_RATCHET to ${count} in scripts/ci/checkAiGeneratedSources.ts so it cannot climb back.`;
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
  const result = checkAiGeneratedSources(datasetRoot, AI_GENERATED_RATCHET);

  const fiches = new Set(result.sources.map((source) => source.fiche));
  console.log(
    `ai_generated sources: ${result.count} across ${fiches.size} fiches (ratchet: ${result.threshold})`
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
