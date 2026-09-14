/**
 * The source-tier ruling ledger: what a ruling is, which citations it names,
 * and what the corpus must say for the ruling to hold.
 *
 * A ruling names one citation identity — its exact title and url — because the
 * `needs_review` tail barely repeats: a per-domain ruling was measured to clear
 * about one citation. Shared by the script that applies rulings to the fiches
 * and by the coverage gate that refuses a corpus contradicting them, so the two
 * cannot disagree on what "the citation this ruling names" means.
 */

import fs from "node:fs";
import path from "node:path";

import {
  SOURCE_TIERS,
  SOURCE_TIER_RULING_DECISIONS,
  type SourceTier,
  type SourceTierRulingDecision,
} from "@/types/sources";

export const SOURCE_TIER_RULINGS_LEDGER =
  "docs/editorial/source-review/source-tier-rulings.json";

export const APPLY_RULINGS_COMMAND =
  "npx tsx scripts/afrik/applySourceTierRulings.ts --apply";

export interface SourceTierRuling {
  id: string;
  match: { title: string; url: string | null };
  /** Fiche paths relative to the dataset root; absent means every citing fiche. */
  appliesTo?: string[];
  decision: SourceTierRulingDecision;
  tier?: SourceTier;
  repairedUrl?: string;
  rationale: string;
  decidedBy: string;
  decidedAt: string;
  draftId?: string;
}

export interface CorpusFiche {
  /** Relative to the dataset root, with forward slashes. */
  path: string;
  text: string;
  json: unknown;
}

function listJsonFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort()) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...listJsonFiles(fullPath));
    else if (entry.name.endsWith(".json")) files.push(fullPath);
  }
  return files;
}

export function readCorpusFiches(datasetRoot: string): CorpusFiche[] {
  const fiches: CorpusFiche[] = [];
  for (const fullPath of listJsonFiles(datasetRoot)) {
    const text = fs.readFileSync(fullPath, "utf8");
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      continue;
    }
    fiches.push({
      path: path.relative(datasetRoot, fullPath).split(path.sep).join("/"),
      text,
      json,
    });
  }
  return fiches;
}

/** A missing ledger holds no rulings; a malformed one throws, loudly. */
export function readRulingLedger(ledgerPath: string): SourceTierRuling[] {
  if (!fs.existsSync(ledgerPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(ledgerPath, "utf8")) as {
    rulings?: unknown;
  };
  return Array.isArray(parsed.rulings)
    ? (parsed.rulings as SourceTierRuling[])
    : [];
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

/** An absent url and an empty one are the same citation: one without a locator. */
export function normalizeUrl(url: unknown): string | null {
  return typeof url === "string" && url.trim() !== "" ? url : null;
}

/** The citation identity a ruling names, as one comparable string. */
export function citationKey(title: string, url: unknown): string {
  return JSON.stringify([title, normalizeUrl(url)]);
}

export function citesPair(
  source: unknown,
  title: string,
  url: string | null | undefined
): source is { title: string; url?: string | null; tier?: unknown } {
  if (!source || typeof source !== "object") return false;
  const candidate = source as { title?: unknown; url?: unknown };
  return (
    candidate.title === title &&
    normalizeUrl(candidate.url) === normalizeUrl(url)
  );
}

export function appliesToFiche(
  ruling: SourceTierRuling,
  fichePath: string
): boolean {
  return !ruling.appliesTo || ruling.appliesTo.includes(fichePath);
}

/** Every `sources` array a fiche carries, at any depth. */
export function forEachSourcesArray(
  value: unknown,
  visit: (sources: unknown[]) => void
): void {
  if (Array.isArray(value)) {
    for (const item of value) forEachSourcesArray(item, visit);
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (key === "sources" && Array.isArray(child)) visit(child);
    forEachSourcesArray(child, visit);
  }
}

function rulingLabel(ruling: Partial<SourceTierRuling>, index: number): string {
  return isBlank(ruling?.id) ? `ruling #${index + 1}` : ruling.id;
}

export function validateRuling(
  ruling: Partial<SourceTierRuling>,
  index: number
): string[] {
  const label = rulingLabel(ruling, index);
  const errors: string[] = [];

  if (isBlank(ruling?.id)) errors.push(`${label}: the id is empty`);
  if (isBlank(ruling?.match?.title)) {
    errors.push(`${label}: match.title is empty`);
  }
  if (
    ruling?.appliesTo !== undefined &&
    (!Array.isArray(ruling.appliesTo) ||
      ruling.appliesTo.some((fiche) => isBlank(fiche)))
  ) {
    errors.push(`${label}: appliesTo must be a list of fiche paths`);
  }

  const decision = ruling?.decision;
  if (!SOURCE_TIER_RULING_DECISIONS.includes(decision)) {
    errors.push(`${label}: unknown decision "${String(decision)}"`);
  }

  const tier = ruling?.tier as unknown;
  if (tier === "needs_review") {
    errors.push(
      `${label}: "needs_review" is not a ruling — a ruling states official, referenced or unverified`
    );
  } else if (tier !== undefined && tier !== null) {
    if (!SOURCE_TIERS.includes(tier as SourceTier)) {
      errors.push(`${label}: unknown tier "${String(tier)}"`);
    }
  } else if (decision === "tier" || decision === "repair") {
    errors.push(`${label}: a ${decision} ruling needs a tier`);
  }

  if (decision === "repair") {
    if (isBlank(ruling.repairedUrl)) {
      errors.push(`${label}: a repair ruling needs a repairedUrl`);
    } else if (ruling.repairedUrl === normalizeUrl(ruling.match?.url)) {
      errors.push(`${label}: repairedUrl is the url it repairs`);
    }
  }

  if (isBlank(ruling?.rationale))
    errors.push(`${label}: the rationale is empty`);
  if (isBlank(ruling?.decidedBy)) errors.push(`${label}: decidedBy is empty`);
  if (
    typeof ruling?.decidedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}/.test(ruling.decidedAt) ||
    Number.isNaN(Date.parse(ruling.decidedAt))
  ) {
    errors.push(
      `${label}: decidedAt "${String(ruling?.decidedAt)}" is not an ISO date`
    );
  }

  return errors;
}

export function validateRulings(rulings: SourceTierRuling[]): string[] {
  const errors = rulings.flatMap((ruling, index) =>
    validateRuling(ruling, index)
  );

  const seen = new Set<string>();
  for (const ruling of rulings) {
    if (isBlank(ruling?.id)) continue;
    if (seen.has(ruling.id)) errors.push(`${ruling.id}: duplicate id`);
    seen.add(ruling.id);
  }

  // Rulings apply in ledger order, so two on one citation for a shared fiche
  // leave the earlier one contradicted by the corpus with no way to go green.
  for (let later = 0; later < rulings.length; later += 1) {
    const ruling = rulings[later];
    if (isBlank(ruling?.match?.title)) continue;
    const key = citationKey(ruling.match.title, ruling.match.url);
    const earlier = rulings
      .slice(0, later)
      .find(
        (other) =>
          !isBlank(other?.match?.title) &&
          citationKey(other.match.title, other.match.url) === key &&
          appliesToOverlap(other, ruling)
      );
    if (earlier) {
      errors.push(
        `${rulingLabel(ruling, later)}: rules on "${ruling.match.title}" (${normalizeUrl(ruling.match.url) ?? "no url"}) for fiches ${rulingLabel(earlier, rulings.indexOf(earlier))} already rules on — one ruling per citation`
      );
    }
  }
  return errors;
}

/** An absent `appliesTo` means every citing fiche, so it overlaps anything. */
function appliesToOverlap(
  first: SourceTierRuling,
  second: SourceTierRuling
): boolean {
  if (!Array.isArray(first.appliesTo) || !Array.isArray(second.appliesTo)) {
    return true;
  }
  return first.appliesTo.some((fiche) => second.appliesTo.includes(fiche));
}

function awaitsReview(tier: unknown): boolean {
  return tier === "needs_review" || tier === undefined || tier === null;
}

/**
 * What the corpus says against a set of well-formed rulings. After a ruling is
 * applied, a `tier` ruling still finds its citation (now tiered), a `repair`
 * finds it under the repaired url, and a `remove` finds nothing — which is why
 * "matches nothing" is only decidable for the first two.
 */
export function findRulingContradictions(
  fiches: CorpusFiche[],
  rulings: SourceTierRuling[]
): string[] {
  const errors: string[] = [];
  const fichePaths = new Set(fiches.map((fiche) => fiche.path));

  for (const ruling of rulings) {
    const { title } = ruling.match;
    const url = normalizeUrl(ruling.match.url);
    let found = 0;

    for (const named of ruling.appliesTo ?? []) {
      if (!fichePaths.has(named)) {
        errors.push(
          `${ruling.id}: appliesTo names ${named}, which is not a fiche`
        );
      }
    }

    for (const fiche of fiches) {
      if (!appliesToFiche(ruling, fiche.path)) continue;

      forEachSourcesArray(fiche.json, (sources) => {
        for (const source of sources) {
          if (citesPair(source, title, url)) {
            found += 1;
            if (ruling.decision === "repair") {
              errors.push(
                `${ruling.id}: ${fiche.path} still cites "${title}" at the url the ruling repaired — run ${APPLY_RULINGS_COMMAND}`
              );
            } else if (ruling.decision === "remove") {
              errors.push(
                `${ruling.id}: ${fiche.path} still cites "${title}", which the ruling removed — run ${APPLY_RULINGS_COMMAND}`
              );
            } else if (awaitsReview(source.tier)) {
              errors.push(
                `${ruling.id}: ${fiche.path} still says needs_review for "${title}" — run ${APPLY_RULINGS_COMMAND}`
              );
            } else if (source.tier !== ruling.tier) {
              errors.push(
                `${ruling.id}: ${fiche.path} cites "${title}" at "${String(source.tier)}", the ruling says "${ruling.tier}"`
              );
            }
          } else if (
            ruling.decision === "repair" &&
            citesPair(source, title, ruling.repairedUrl)
          ) {
            found += 1;
            if (source.tier !== ruling.tier) {
              errors.push(
                `${ruling.id}: ${fiche.path} cites "${title}" at "${String(source.tier)}", the ruling says "${ruling.tier}"`
              );
            }
          }
        }
      });
    }

    if (ruling.decision !== "remove" && found === 0) {
      errors.push(
        `${ruling.id}: matches no citation of "${title}" (${url ?? "no url"}) in the corpus`
      );
    }
  }

  return errors;
}
