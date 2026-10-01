/**
 * Which network may receive which format, and which platform limits are
 * actually known. The data is `scripts/lib/socialFormatMatrix.json`, shared with
 * the TypeScript ledger gate.
 *
 * A limit is enforced only when it carries the official page it was read on and
 * the day. Platform limits change without notice, so one older than
 * FRESHNESS_DAYS is reported as unverified rather than trusted, and a dimension
 * nobody has verified is listed, never treated as passing.
 */
import { readFileSync } from "node:fs";

export const MATRIX = JSON.parse(
  readFileSync(
    new URL("../../../scripts/lib/socialFormatMatrix.json", import.meta.url),
    "utf8"
  )
);

const FRESHNESS_DAYS = 120;
const DAY = 86_400_000;

// What each measured value is compared with, per format. A dimension is only
// asked about when the caller supplies the measurement.
const DIMENSIONS = {
  video: [["durationSeconds", "maxDurationSeconds"]],
  carrousel: [["cardCount", "maxCards"]],
  texte: [],
};

export function checkDestination(
  { network, format, ...measured },
  { asOf = new Date().toISOString().slice(0, 10) } = {}
) {
  const problems = [];
  const unverified = [];
  if (!MATRIX.formats[network]?.includes(format)) {
    problems.push(`${network} does not accept ${format}`);
    return { ok: false, problems, unverified };
  }
  for (const [measure, limitName] of DIMENSIONS[format] ?? []) {
    if (measured[measure] === undefined) continue;
    const limit = MATRIX.constraints?.[network]?.[format]?.[limitName];
    const label = `${network} ${format} ${limitName}`;
    if (!limit) {
      unverified.push(label);
      continue;
    }
    const age = (Date.parse(asOf) - Date.parse(limit.verifiedOn)) / DAY;
    if (age > FRESHNESS_DAYS) {
      unverified.push(`${label} (stale: read ${limit.verifiedOn})`);
      continue;
    }
    if (measured[measure] > limit.value) {
      problems.push(
        `${label}: ${measured[measure]} exceeds ${limit.value} (${limit.sourceUrl}, read ${limit.verifiedOn})`
      );
    }
  }
  return { ok: problems.length === 0, problems, unverified };
}
