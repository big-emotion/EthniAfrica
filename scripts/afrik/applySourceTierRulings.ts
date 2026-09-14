#!/usr/bin/env tsx
/**
 * Writes the rulings of the source-tier ledger into the fiches they name.
 *
 * The ledger is the only place a ruling survives: the corpus sync re-upserts
 * every tier from the JSON, so a tier changed in the database alone is gone at
 * the next load. This script is the step between a moderator's decision and a
 * corpus that says it.
 *
 * It patches nothing it cannot patch cleanly. Fiches are prettier output, so a
 * fiche is rewritten through prettier, and one that would not survive that
 * round trip unchanged is listed for a hand edit instead — a one-line ruling
 * must stay a one-line diff.
 *
 * The rationale is never written into the fiche. `sources[].notes` is published
 * to readers verbatim, and why a moderator ruled is workshop vocabulary.
 *
 *   npx tsx scripts/afrik/applySourceTierRulings.ts           # dry run
 *   npx tsx scripts/afrik/applySourceTierRulings.ts --apply   # write the fiches
 */

import fs from "node:fs";
import path from "node:path";

import * as prettier from "prettier";

import {
  NEEDS_REVIEW_RATCHET,
  carriesTier,
  findUntieredSources,
} from "../ci/checkSourceTierCoverage";
import {
  SOURCE_TIER_RULINGS_LEDGER,
  appliesToFiche,
  citesPair,
  forEachSourcesArray,
  normalizeUrl,
  readCorpusFiches,
  readRulingLedger,
  validateRulings,
  type SourceTierRuling,
} from "./sourceTierRulings";

export interface SourceTierRulingOptions {
  datasetRoot: string;
  ledgerPath: string;
  translationsRoot: string;
  write: boolean;
  /** The committed ratchet; defaults to NEEDS_REVIEW_RATCHET. */
  ratchet?: number;
}

export interface SourceTierRulingReport {
  errors: string[];
  changedFiches: string[];
  /** Fiches a ruling names that prettier would reformat; edit them by hand. */
  unformattable: string[];
  /** One `translate:record --drift` command per English sidecar a change drifts. */
  sidecarsToRedrift: string[];
  untieredBefore: number;
  untieredAfter: number;
  ratchetLine: string | null;
}

interface FicheOutcome {
  citationsChanged: number;
  untieredCleared: number;
  /** A removal or a repaired url; a tier alone changes no translated field. */
  fieldSetChanged: boolean;
}

function applyRulings(
  fiche: unknown,
  fichePath: string,
  rulings: SourceTierRuling[]
): FicheOutcome {
  const outcome: FicheOutcome = {
    citationsChanged: 0,
    untieredCleared: 0,
    fieldSetChanged: false,
  };

  for (const ruling of rulings) {
    if (!appliesToFiche(ruling, fichePath)) continue;
    const url = normalizeUrl(ruling.match.url);

    forEachSourcesArray(fiche, (sources) => {
      // Backwards, so a removal does not skip the entry after it.
      for (let index = sources.length - 1; index >= 0; index -= 1) {
        const source = sources[index];
        if (!citesPair(source, ruling.match.title, url)) continue;
        if (ruling.decision === "tier" && source.tier === ruling.tier) continue;

        const wasUntiered = !carriesTier(source.tier);
        if (ruling.decision === "remove") {
          sources.splice(index, 1);
          outcome.fieldSetChanged = true;
        } else if (ruling.decision === "repair") {
          source.url = ruling.repairedUrl;
          source.tier = ruling.tier;
          outcome.fieldSetChanged = true;
        } else {
          source.tier = ruling.tier;
        }
        outcome.citationsChanged += 1;
        if (wasUntiered) outcome.untieredCleared += 1;
      }
    });
  }

  return outcome;
}

async function formatLikeCorpus(file: string, json: unknown): Promise<string> {
  const options = (await prettier.resolveConfig(file)) ?? {};
  return prettier.format(JSON.stringify(json, null, 2), {
    ...options,
    filepath: file,
  });
}

export async function runSourceTierRulings(
  options: SourceTierRulingOptions
): Promise<SourceTierRulingReport> {
  const ratchet = options.ratchet ?? NEEDS_REVIEW_RATCHET;
  const rulings = readRulingLedger(options.ledgerPath);
  const report: SourceTierRulingReport = {
    errors: validateRulings(rulings),
    changedFiches: [],
    unformattable: [],
    sidecarsToRedrift: [],
    untieredBefore: 0,
    untieredAfter: 0,
    ratchetLine: null,
  };
  if (report.errors.length > 0) return report;

  report.untieredBefore = findUntieredSources(options.datasetRoot).length;
  let cleared = 0;

  for (const fiche of readCorpusFiches(options.datasetRoot)) {
    const outcome = applyRulings(fiche.json, fiche.path, rulings);
    if (outcome.citationsChanged === 0) continue;

    const file = path.join(options.datasetRoot, fiche.path);
    const untouched = await formatLikeCorpus(file, JSON.parse(fiche.text));
    if (untouched !== fiche.text) {
      report.unformattable.push(fiche.path);
      continue;
    }

    report.changedFiches.push(fiche.path);
    cleared += outcome.untieredCleared;
    if (options.write) {
      fs.writeFileSync(file, await formatLikeCorpus(file, fiche.json), "utf8");
    }

    const sidecar = path.join(options.translationsRoot, "en", fiche.path);
    if (outcome.fieldSetChanged && fs.existsSync(sidecar)) {
      report.sidecarsToRedrift.push(
        `npm run translate:record -- --id ${path.basename(fiche.path, ".json")} --lang en --drift`
      );
    }
  }

  report.untieredAfter = report.untieredBefore - cleared;
  if (report.untieredAfter < ratchet) {
    report.ratchetLine = `lower NEEDS_REVIEW_RATCHET to ${report.untieredAfter} in scripts/ci/checkSourceTierCoverage.ts`;
  }
  return report;
}

async function main(): Promise<void> {
  const write = process.argv.includes("--apply");
  const report = await runSourceTierRulings({
    datasetRoot: "dataset/source/afrik",
    ledgerPath: SOURCE_TIER_RULINGS_LEDGER,
    translationsRoot: "dataset/translations",
    write,
  });

  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(error);
    console.error("The ledger is invalid; no fiche was touched.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `${write ? "Changed" : "Would change"} ${report.changedFiches.length} fiche(s)`
  );
  for (const fiche of report.changedFiches) console.log(`  ${fiche}`);

  if (report.unformattable.length > 0) {
    console.log(
      "Not patched — prettier would reformat these fiches; apply the ruling by hand:"
    );
    for (const fiche of report.unformattable) console.log(`  ${fiche}`);
  }

  if (report.sidecarsToRedrift.length > 0) {
    console.log("English sidecars drifted by a removal or a repair:");
    for (const command of report.sidecarsToRedrift) console.log(`  ${command}`);
  }

  console.log(
    `Untiered sources: ${report.untieredBefore} -> ${report.untieredAfter}`
  );
  if (report.ratchetLine) console.log(`Then ${report.ratchetLine}.`);
  if (!write && report.changedFiches.length > 0) {
    console.log("Dry run. Re-run with --apply to write the fiches.");
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  void main();
}
