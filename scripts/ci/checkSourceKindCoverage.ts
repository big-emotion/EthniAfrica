/**
 * CI gate — every AFRIK source should say what kind of thing it is.
 *
 * Readers see a source's type, never its tier (doctrine §1.1); a source with
 * no `source_kind` reads « Type non précisé ». The rules in
 * scripts/afrik/classifySourceKinds.ts type what they can name and leave the
 * rest for a person (docs/editorial/source-review/source-kind-review.json), so
 * this ratchet counts what is still untyped and stops it from growing.
 *
 * Usage: npx tsx scripts/ci/checkSourceKindCoverage.ts [datasetRoot]
 */
import { readCorpusFiches } from "../afrik/sourceTierRulings";

const DEFAULT_DATASET_ROOT = "dataset/source/afrik";

/**
 * A ratchet, not a budget — the rule of `NEEDS_REVIEW_RATCHET`: a count above
 * it fails, and so does a count below it, because a ceiling left above the
 * real number is room to regress into. A typing batch lowers this line in the
 * same change; NEVER raise it.
 *
 * Measured 2026-10-10, after the long-tail hosts, the social-media posts and
 * the census and publisher titles were typed (ETNI-2007). 1064 -> 1061 the
 * same day: three untyped citations left with the duplicate people fiches
 * folded into their keepers. 1061 -> 1057 on 2026-10-11: four untyped citations
 * left with the fifteen duplicate people fiches folded that day, and a fifth,
 * African Voice, was typed as press when it moved to PPL_FULA. 1056 -> 1047
 * the same day: nine untyped citations left with the twenty-four duplicate
 * people fiches of waves 4 and 5; the untyped ones carried into a keeper keep
 * their count. 1047 -> 1037 on 2026-10-11: ten untyped citations left with the
 * duplicate people fiches folded after wave 8; the one carried to the new
 * Afizere fiche keeps its count. 1037 -> 1029 on 2026-10-12: eight untyped
 * citations left with the duplicate people fiches folded after wave 10.
 * 1029 -> 1026 the same day: three untyped citations left with the Khainai
 * and Koyra fiches folded after wave 12. 1026 -> 1025 on 2026-10-13: wave 16
 * typed the Tongwe Trust citation of PPL_TONGWE (community, tier unverified).
 * 1025 -> 1009 on 2026-10-14: sixteen untyped citations left with the
 * twenty-one people fiches and the four family-name fiches of waves 14 to 19
 * folded or withdrawn that day. 1009 -> 1008 the same day: the untyped
 * citation of PPL_NABT left with it, folded into PPL_NABDAM. 1008 -> 1006 the
 * same day: the two Gur citations of Koelle's Polyglotta Africana now point
 * to the scan and are typed. 1006 -> 1003 on 2026-10-15: three untyped
 * citations left PPL_TUAREG with the Touareg name-history corrections, and
 * the sources added to it carry a source_kind. 1003 -> 1001 on 2026-10-18:
 * wave 24 typed two untyped citations of the people fiches it wrote.
 * 1001 -> 991 the same day: ten untyped citations left with PPL_MUCUBAL,
 * folded into PPL_MUCUVAL, and two people fiches withdrawn after wave 24;
 * the one carried to the Cabo Verde fiche carries a source_kind.
 */
export const UNTYPED_SOURCE_RATCHET = 991;

export interface UntypedSource {
  file: string;
  title: string;
}

export interface SourceKindCoverageResult {
  ok: boolean;
  count: number;
  threshold: number;
  untyped: UntypedSource[];
  /** Why the gate failed, including which line to change; null when it holds. */
  error: string | null;
}

function collectUntyped(
  file: string,
  value: unknown,
  untyped: UntypedSource[]
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectUntyped(file, item, untyped));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (key === "sources" && Array.isArray(child)) {
      for (const source of child) {
        if (!source || typeof source !== "object") continue;
        const { title, source_kind: kind } = source as Record<string, unknown>;
        if (typeof kind !== "string") {
          untyped.push({ file, title: String(title ?? "(untitled source)") });
        }
      }
    }
    collectUntyped(file, child, untyped);
  }
}

export function checkSourceKindCoverage(
  datasetRoot: string,
  threshold: number
): SourceKindCoverageResult {
  const untyped: UntypedSource[] = [];
  for (const fiche of readCorpusFiches(datasetRoot)) {
    collectUntyped(fiche.path, fiche.json, untyped);
  }
  const count = untyped.length;

  let error: string | null = null;
  if (count > threshold) {
    error = `${count} sources without source_kind exceed the ratchet of ${threshold}: give the new sources a kind (npx tsx scripts/afrik/classifySourceKinds.ts proposes one) — do not raise the ratchet.`;
  } else if (count < threshold) {
    error = `${count} sources without source_kind against a ratchet of ${threshold} — lower UNTYPED_SOURCE_RATCHET to ${count} in scripts/ci/checkSourceKindCoverage.ts so it cannot climb back.`;
  }

  return { ok: error === null, count, threshold, untyped, error };
}

function main(): void {
  const datasetRoot = process.argv[2] ?? DEFAULT_DATASET_ROOT;
  const result = checkSourceKindCoverage(datasetRoot, UNTYPED_SOURCE_RATCHET);

  console.log(
    `Sources without source_kind: ${result.count} (ratchet: ${result.threshold})`
  );
  if (!result.ok) {
    console.error(result.error);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("checkSourceKindCoverage.ts")) {
  main();
}
