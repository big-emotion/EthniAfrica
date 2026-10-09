#!/usr/bin/env tsx
/**
 * Writes the accepted verifications of the AI-source ledger into the fiches.
 *
 * The ledger is where a human's decision survives: the corpus sync re-upserts
 * every source from the JSON, so a citation changed in the database alone is
 * gone at the next load. Only `accepted` entries change a fiche; `rejected`
 * and `oral_needed` leave the source where it is, because the doctrine never
 * deletes a source for not being written or online.
 *
 * The replacement keeps the original's `sourceKey`, which a fiche's
 * attestations cite by name, and never puts the ledger id in `notes`: notes
 * are published to readers verbatim, and a ledger id is workshop vocabulary
 * (docs/editorial/reader-facing-register.md). The ledger already ties the
 * citation to its verification by fiche, title and url.
 *
 * The source is re-located by that identity, never by the entry's recorded
 * path: an edit since the proposal may have shifted it. Every ai_generated
 * source of the fiche carrying the identity is replaced, since one decision
 * covers them all. An identity found neither as an ai_generated source nor
 * as the applied candidate means the ledger no longer describes the fiche,
 * and nothing is written until a person corrects it.
 *
 * Fiches are rewritten through prettier at their own indentation, and one that
 * would not survive that round trip unchanged is listed for a hand edit
 * instead — an accepted candidate must stay a one-citation diff.
 *
 *   npx tsx scripts/afrik/applyAiSourceVerifications.ts           # dry run
 *   npx tsx scripts/afrik/applyAiSourceVerifications.ts --apply   # write the fiches
 */

import fs from "node:fs";
import path from "node:path";

import * as prettier from "prettier";

import { UNREVIEWED_AI_GENERATED_RATCHET } from "../ci/checkAiGeneratedSources";
import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  findCitationTiers,
  findUnreviewedAiGeneratedSources,
  locateSource,
  readVerificationLedger,
  replaceAtJsonPath,
  resolveJsonPath,
  validateVerifications,
  type AiSourceVerification,
} from "./aiSourceVerifications";
import { readCorpusFiches } from "./sourceTierRulings";

export interface AiSourceVerificationOptions {
  datasetRoot: string;
  ledgerPath: string;
  write: boolean;
  /** The committed ratchet; defaults to UNREVIEWED_AI_GENERATED_RATCHET. */
  ratchet?: number;
}

export interface AiSourceVerificationReport {
  errors: string[];
  changedFiches: string[];
  /** Fiches an accepted entry names that prettier would reformat; edit them by hand. */
  unformattable: string[];
  aiGeneratedBefore: number;
  aiGeneratedAfter: number;
  ratchetLine: string | null;
}

/**
 * A patronyme fiche's source model is strict and has no author or year field,
 * so there they open the note, as the corpus already writes them by hand.
 */
function isPatronymeFiche(fiche: string): boolean {
  return /^patronymes\/PAT_[^/]+\.json$/.test(fiche);
}

function citationFor(
  entry: AiSourceVerification,
  original: Record<string, unknown>
): Record<string, unknown> {
  const chosen = entry.candidates[entry.chosen];
  const byline = [chosen.author, chosen.year].filter(
    (part) => part !== null && part !== undefined && part !== ""
  );
  const inNote = isPatronymeFiche(entry.fiche);
  return {
    ...(typeof original.sourceKey === "string"
      ? { sourceKey: original.sourceKey }
      : {}),
    title: chosen.title,
    ...(!inNote && chosen.author ? { author: chosen.author } : {}),
    ...(!inNote && chosen.year !== null ? { year: chosen.year } : {}),
    url: chosen.url,
    tier: entry.tier,
    source_kind: chosen.source_kind,
    ...(inNote && byline.length > 0 ? { notes: `${byline.join(", ")}.` } : {}),
  };
}

/** The fiche's own indent unit, so a 4-space file stays a 4-space file. */
function detectIndent(text: string): { tabWidth: number; useTabs: boolean } {
  const indent = /\n([ \t]+)\S/.exec(text)?.[1] ?? "  ";
  return indent.startsWith("\t")
    ? { tabWidth: 2, useTabs: true }
    : { tabWidth: indent.length, useTabs: false };
}

async function formatLikeFiche(
  file: string,
  originalText: string,
  json: unknown
): Promise<string> {
  const options = (await prettier.resolveConfig(file)) ?? {};
  return prettier.format(JSON.stringify(json, null, 2), {
    ...options,
    ...detectIndent(originalText),
    filepath: file,
  });
}

export async function runAiSourceVerifications(
  options: AiSourceVerificationOptions
): Promise<AiSourceVerificationReport> {
  const ratchet = options.ratchet ?? UNREVIEWED_AI_GENERATED_RATCHET;
  const entries = readVerificationLedger(options.ledgerPath);
  const report: AiSourceVerificationReport = {
    errors: validateVerifications(entries),
    changedFiches: [],
    unformattable: [],
    aiGeneratedBefore: 0,
    aiGeneratedAfter: 0,
    ratchetLine: null,
  };
  if (report.errors.length > 0) return report;

  const fiches = readCorpusFiches(options.datasetRoot);
  report.aiGeneratedBefore = findUnreviewedAiGeneratedSources(
    fiches,
    entries
  ).length;
  const accepted = entries.filter((entry) => entry.status === "accepted");
  const byPath = new Map(fiches.map((fiche) => [fiche.path, fiche]));

  const replacements = new Map<
    string,
    { entry: AiSourceVerification; at: string }[]
  >();
  for (const entry of accepted) {
    const fiche = byPath.get(entry.fiche);
    if (!fiche) continue; // check:ai-sources names a missing fiche.
    const paths = locateSource(fiche, entry);
    if (paths.length === 0) {
      const applied =
        findCitationTiers(fiche.json, entry.candidates[entry.chosen]).length >
        0;
      if (!applied) {
        report.errors.push(
          `${entry.id}: ${entry.fiche} carries neither the ai_generated source "${entry.original.title ?? "(untitled)"}" nor the accepted candidate — correct the ledger entry by hand`
        );
      }
      continue;
    }
    const planned = replacements.get(fiche.path) ?? [];
    planned.push(...paths.map((at) => ({ entry, at })));
    replacements.set(fiche.path, planned);
  }
  if (report.errors.length > 0) return report;

  let replaced = 0;
  for (const fiche of fiches) {
    const planned = replacements.get(fiche.path) ?? [];
    if (planned.length === 0) continue;
    for (const { entry, at } of planned) {
      replaceAtJsonPath(
        fiche.json,
        at,
        citationFor(
          entry,
          resolveJsonPath(fiche.json, at) as Record<string, unknown>
        )
      );
    }
    const replacedHere = planned.length;

    const file = path.join(options.datasetRoot, fiche.path);
    const untouched = await formatLikeFiche(
      file,
      fiche.text,
      JSON.parse(fiche.text)
    );
    if (untouched !== fiche.text) {
      report.unformattable.push(fiche.path);
      continue;
    }

    report.changedFiches.push(fiche.path);
    replaced += replacedHere;
    if (options.write) {
      fs.writeFileSync(
        file,
        await formatLikeFiche(file, fiche.text, fiche.json),
        "utf8"
      );
    }
  }

  report.aiGeneratedAfter = report.aiGeneratedBefore - replaced;
  if (report.aiGeneratedAfter < ratchet) {
    report.ratchetLine = `lower UNREVIEWED_AI_GENERATED_RATCHET to ${report.aiGeneratedAfter} in scripts/ci/checkAiGeneratedSources.ts`;
  }
  return report;
}

async function main(): Promise<void> {
  const write = process.argv.includes("--apply");
  const report = await runAiSourceVerifications({
    datasetRoot: "dataset/source/afrik",
    ledgerPath: AI_SOURCE_VERIFICATIONS_LEDGER,
    write,
  });

  if (report.errors.length > 0) {
    for (const error of report.errors) console.error(error);
    console.error("The ledger does not hold; no fiche was touched.");
    process.exitCode = 1;
    return;
  }

  console.log(
    `${write ? "Changed" : "Would change"} ${report.changedFiches.length} fiche(s)`
  );
  for (const fiche of report.changedFiches) console.log(`  ${fiche}`);

  if (report.unformattable.length > 0) {
    console.log(
      "Not patched — prettier would reformat these fiches; apply the verification by hand:"
    );
    for (const fiche of report.unformattable) console.log(`  ${fiche}`);
  }

  console.log(
    `unreviewed ai_generated sources: ${report.aiGeneratedBefore} -> ${report.aiGeneratedAfter}`
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
