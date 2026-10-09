/**
 * CI gate — no etymology field states a name's origin as fact (ETNI-2009,
 * doctrine §1.1: every origin is a hypothesis; the site never affirms).
 *
 * The detector is a heuristic (see scripts/afrik/findAssertiveEtymologies.ts),
 * so the gate is an exact ratchet rather than a zero rule: the fields it still
 * flags were read by a person and left as they are because the flagged
 * sentence tells a group's or a spelling's history, not a name's origin. A new
 * field climbing above the line fails; so does a count below it, because a
 * ceiling left above the real number is room to regress into.
 *
 * Usage: npx tsx scripts/ci/checkEtymologyHypotheses.ts [datasetRoot]
 */
import {
  findAssertiveEtymologies,
  type AssertiveEtymology,
} from "../afrik/findAssertiveEtymologies";

const DEFAULT_DATASET_ROOT = "dataset/source/afrik";

/** NEVER raise it: rewrite the new sentence as a hypothesis instead. */
export const ASSERTIVE_ETYMOLOGY_RATCHET = 289;

export interface EtymologyHypothesesResult {
  ok: boolean;
  count: number;
  threshold: number;
  fields: AssertiveEtymology[];
  error: string | null;
}

export function checkEtymologyHypotheses(
  datasetRoot: string,
  threshold: number
): EtymologyHypothesesResult {
  const fields = findAssertiveEtymologies(datasetRoot);
  const count = fields.length;

  let error: string | null = null;
  if (count > threshold) {
    const listing = fields
      .map(({ fiche, sentences }) => `  ${fiche}: ${sentences.join(" ")}`)
      .join("\n");
    error = `${count} etymology fields state an origin as fact, above the ratchet of ${threshold}. Write the origin as a hypothesis — « viendrait de … », « selon [a source the fiche cites] » — never as fact. Do not raise the ratchet.\n${listing}`;
  } else if (count < threshold) {
    error = `${count} etymology fields state an origin as fact against a ratchet of ${threshold} — lower ASSERTIVE_ETYMOLOGY_RATCHET to ${count} in scripts/ci/checkEtymologyHypotheses.ts so it cannot climb back.`;
  }

  return { ok: error === null, count, threshold, fields, error };
}

function main(): void {
  const datasetRoot = process.argv[2] ?? DEFAULT_DATASET_ROOT;
  const result = checkEtymologyHypotheses(
    datasetRoot,
    ASSERTIVE_ETYMOLOGY_RATCHET
  );
  console.log(
    `etymology fields stating an origin as fact: ${result.count} (ratchet: ${result.threshold})`
  );
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  process.argv[1].endsWith("checkEtymologyHypotheses.ts")
) {
  main();
}
