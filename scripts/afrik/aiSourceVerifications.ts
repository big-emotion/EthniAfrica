/**
 * The AI-source verification ledger: which corpus sources were written from
 * machine output (`source_kind: "ai_generated"`), what a web search proposed
 * in their place, and what a human decided.
 *
 * A source is named by its fiche and its JSON path rather than by its title:
 * the ai_generated tail is mostly one generic citation ("Relevé de couverture
 * anthroponymique") repeated across hundreds of fiches, each standing for a
 * different claim, so a title match would verify them all at once.
 *
 * Shared by the script that proposes candidates, the script that applies
 * accepted ones, and the gate that holds the corpus to the ledger, so the
 * three cannot disagree on what "the source this entry names" means.
 */

import fs from "node:fs";

import * as prettier from "prettier";

import {
  SOURCE_KINDS,
  SOURCE_TIERS,
  type SourceKind,
  type SourceTier,
} from "@/types/sources";

import { normalizeUrl, type CorpusFiche } from "./sourceTierRulings";

export const AI_SOURCE_VERIFICATIONS_LEDGER =
  "docs/editorial/source-review/ai-source-verifications.json";

export const APPLY_VERIFICATIONS_COMMAND =
  "npx tsx scripts/afrik/applyAiSourceVerifications.ts --apply";

/**
 * `rejected` and `oral_needed` exist because the doctrine never drops a source
 * for not being written or online: when no candidate holds, a human either
 * keeps the citation as the synthesis it is, or records the oral account that
 * actually supports it. Neither touches the corpus.
 */
export const VERIFICATION_STATUSES = [
  "proposed",
  "accepted",
  "rejected",
  "oral_needed",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/**
 * A candidate replaces a machine-written citation, so it must be a work
 * someone can open: the provenance markers (ai_generated, unknown, discovery,
 * oral_tradition, ethniafrica_synthesis) are not candidates.
 */
export const CANDIDATE_SOURCE_KINDS = SOURCE_KINDS.filter(
  (kind) =>
    ![
      "ai_generated",
      "unknown",
      "discovery",
      "oral_tradition",
      "ethniafrica_synthesis",
    ].includes(kind)
) as [SourceKind, ...SourceKind[]];

export interface SourceCandidate {
  title: string;
  author: string | null;
  year: number | null;
  url: string;
  source_kind: SourceKind;
  /** The passage of the source that states the claim. */
  quote: string;
  /** Which part of the claim the quote establishes. */
  supports: string;
}

export interface OriginalCitation {
  title: string | null;
  url: string | null;
}

export interface AiSourceVerification {
  id: string;
  /** Relative to the dataset root, with forward slashes. */
  fiche: string;
  path: string;
  claim: string;
  original: OriginalCitation;
  candidates: SourceCandidate[];
  status: VerificationStatus;
  chosen?: number;
  tier?: SourceTier;
  decidedBy?: string;
  decidedAt?: string;
  proposedAt: string;
  model: string;
}

export interface AiGeneratedSource {
  fiche: string;
  path: string;
  claim: string;
  original: OriginalCitation;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isAiGenerated(value: unknown): boolean {
  return isObject(value) && value.source_kind === "ai_generated";
}

const CLAIM_MAX_LENGTH = 400;

/**
 * What the source vouches for, as far as the fiche says: the string fields
 * sitting beside it. Short on purpose — it is a search brief, not a copy of
 * the fiche — and `_`-prefixed authoring metadata is left out.
 */
function describeClaim(enclosing: JsonObject | null): string {
  if (!enclosing) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(enclosing)) {
    if (key.startsWith("_")) continue;
    if (typeof value === "string" && value.trim() !== "") {
      parts.push(`${key}: ${value}`);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => typeof item === "string")
    ) {
      parts.push(`${key}: ${value.join(", ")}`);
    }
  }
  const claim = parts.join("; ");
  return claim.length > CLAIM_MAX_LENGTH
    ? `${claim.slice(0, CLAIM_MAX_LENGTH - 1)}…`
    : claim;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Every object carrying `source_kind: "ai_generated"`, not only `sources[]`
 * entries: the anthroponym candidate queue marks each entry's `provenance` the
 * same way, and a gate that only read `sources[]` would let that queue grow
 * unnoticed.
 */
export function findAiGeneratedSources(
  fiches: CorpusFiche[]
): AiGeneratedSource[] {
  const found: AiGeneratedSource[] = [];

  function visit(
    fiche: string,
    value: unknown,
    valuePath: string,
    enclosing: JsonObject | null
  ): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        visit(fiche, item, `${valuePath}[${index}]`, enclosing)
      );
      return;
    }
    if (!isObject(value)) return;

    if (isAiGenerated(value)) {
      found.push({
        fiche,
        path: valuePath,
        claim: describeClaim(enclosing),
        original: {
          title: stringOrNull(value.title),
          url: normalizeUrl(value.url),
        },
      });
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      visit(fiche, child, valuePath ? `${valuePath}.${key}` : key, value);
    }
  }

  for (const fiche of fiches) visit(fiche.path, fiche.json, "", null);
  return found;
}

function pathSegments(jsonPath: string): (string | number)[] {
  return [...jsonPath.matchAll(/([^.[\]]+)|\[(\d+)\]/g)].map((match) =>
    match[2] !== undefined ? Number(match[2]) : match[1]
  );
}

export function resolveJsonPath(json: unknown, jsonPath: string): unknown {
  let current = json;
  for (const segment of pathSegments(jsonPath)) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[segment];
  }
  return current;
}

export function replaceAtJsonPath(
  json: unknown,
  jsonPath: string,
  value: unknown
): void {
  const segments = pathSegments(jsonPath);
  const parent = resolveJsonPath(
    json,
    segments
      .slice(0, -1)
      .map((segment) =>
        typeof segment === "number" ? `[${segment}]` : `.${segment}`
      )
      .join("")
  ) as Record<string | number, unknown>;
  parent[segments[segments.length - 1]] = value;
}

/** A missing ledger holds no verifications; a malformed one throws, loudly. */
export function readVerificationLedger(
  ledgerPath: string
): AiSourceVerification[] {
  if (!fs.existsSync(ledgerPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(ledgerPath, "utf8")) as {
    verifications?: unknown;
  };
  return Array.isArray(parsed.verifications)
    ? (parsed.verifications as AiSourceVerification[])
    : [];
}

const LEDGER_DESCRIPTION =
  "One entry per ai_generated corpus source a web search was run for. Schema and doctrine: README.md in this directory. Proposed by scripts/afrik/verifyAiGeneratedSources.ts, decided by a human, applied by scripts/afrik/applyAiSourceVerifications.ts and held by scripts/ci/checkAiGeneratedSources.ts.";

/** Written through prettier so the committed ledger passes format:check as is. */
export async function writeVerificationLedger(
  ledgerPath: string,
  verifications: AiSourceVerification[]
): Promise<void> {
  const text = await prettier.format(
    JSON.stringify({ description: LEDGER_DESCRIPTION, verifications }),
    { parser: "json" }
  );
  fs.writeFileSync(ledgerPath, text, "utf8");
}

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function isIsoDate(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

/** Problems with one candidate, or none. Used to drop bad proposals too. */
export function validateCandidate(candidate: unknown, index: number): string[] {
  const label = `candidate ${index}`;
  if (!isObject(candidate)) return [`${label} is not an object`];
  const errors: string[] = [];
  if (isBlank(candidate.title)) errors.push(`${label} has no title`);
  if (!CANDIDATE_SOURCE_KINDS.includes(candidate.source_kind as SourceKind)) {
    errors.push(
      `${label} has source_kind "${String(candidate.source_kind)}" — a candidate is a bibliographic work`
    );
  }
  if (
    typeof candidate.url !== "string" ||
    !/^https?:\/\/\S+$/.test(candidate.url)
  ) {
    errors.push(`${label} has no http(s) url`);
  }
  if (isBlank(candidate.quote)) errors.push(`${label} has no quote`);
  return errors;
}

function entryLabel(entry: Partial<AiSourceVerification>, index: number) {
  return isBlank(entry?.id) ? `verification #${index + 1}` : entry.id;
}

export function validateVerification(
  entry: Partial<AiSourceVerification>,
  index: number
): string[] {
  const label = entryLabel(entry, index);
  const errors: string[] = [];

  if (!/^ASV-\d{4}-\d{2}-\d{2}-\d{4}$/.test(String(entry?.id))) {
    errors.push(`${label}: the id is not ASV-YYYY-MM-DD-NNNN`);
  }
  if (isBlank(entry?.fiche)) errors.push(`${label}: fiche is empty`);
  if (isBlank(entry?.path)) errors.push(`${label}: path is empty`);
  if (typeof entry?.claim !== "string")
    errors.push(`${label}: claim is missing`);
  if (!isObject(entry?.original)) errors.push(`${label}: original is missing`);
  if (!isIsoDate(entry?.proposedAt)) {
    errors.push(
      `${label}: proposedAt "${String(entry?.proposedAt)}" is not an ISO date`
    );
  }
  if (isBlank(entry?.model)) errors.push(`${label}: model is empty`);

  const candidates = Array.isArray(entry?.candidates) ? entry.candidates : null;
  if (!candidates) {
    errors.push(`${label}: candidates must be a list`);
  } else {
    candidates.forEach((candidate, candidateIndex) => {
      for (const error of validateCandidate(candidate, candidateIndex)) {
        errors.push(`${label}: ${error}`);
      }
    });
  }

  const status = entry?.status;
  if (!VERIFICATION_STATUSES.includes(status)) {
    errors.push(`${label}: unknown status "${String(status)}"`);
    return errors;
  }

  if (status === "proposed") {
    if (entry.chosen !== undefined || entry.tier !== undefined) {
      errors.push(`${label}: a proposal carries no chosen candidate or tier`);
    }
    return errors;
  }

  if (status === "accepted") {
    if (
      !Number.isInteger(entry.chosen) ||
      entry.chosen < 0 ||
      entry.chosen >= (candidates?.length ?? 0)
    ) {
      errors.push(
        `${label}: chosen must index one of the ${candidates?.length ?? 0} candidate(s)`
      );
    }
    if (!SOURCE_TIERS.includes(entry.tier)) {
      errors.push(
        `${label}: an accepted verification needs a tier (official, referenced or unverified), not "${String(entry.tier)}"`
      );
    }
  }

  if (isBlank(entry.decidedBy)) errors.push(`${label}: decidedBy is empty`);
  if (!isIsoDate(entry.decidedAt)) {
    errors.push(
      `${label}: decidedAt "${String(entry.decidedAt)}" is not an ISO date`
    );
  }
  return errors;
}

function sourceKey(entry: AiSourceVerification): string {
  return JSON.stringify([entry.fiche, entry.path]);
}

export function validateVerifications(
  entries: AiSourceVerification[]
): string[] {
  const errors = entries.flatMap((entry, index) =>
    validateVerification(entry, index)
  );

  const ids = new Set<string>();
  const verified = new Map<string, string>();
  entries.forEach((entry, index) => {
    const label = entryLabel(entry, index);
    if (!isBlank(entry?.id)) {
      if (ids.has(entry.id)) errors.push(`${label}: duplicate id`);
      ids.add(entry.id);
    }
    const key = sourceKey(entry);
    const earlier = verified.get(key);
    if (earlier) {
      errors.push(
        `${label}: ${entry.fiche} ${entry.path} is already verified by ${earlier} — one verification per source`
      );
    } else {
      verified.set(key, label);
    }
  });
  return errors;
}

/**
 * What the corpus says against well-formed verifications. Only an accepted
 * one makes a claim on the fiche; the other statuses leave the source as it
 * stands, so for them the gate only checks the fiche still exists.
 */
export function findVerificationContradictions(
  fiches: CorpusFiche[],
  entries: AiSourceVerification[]
): string[] {
  const errors: string[] = [];
  const byPath = new Map(fiches.map((fiche) => [fiche.path, fiche]));

  for (const entry of entries) {
    const fiche = byPath.get(entry.fiche);
    if (!fiche) {
      errors.push(`${entry.id}: names ${entry.fiche}, which is not a fiche`);
      continue;
    }
    if (entry.status !== "accepted") continue;

    const current = resolveJsonPath(fiche.json, entry.path);
    const chosen = entry.candidates[entry.chosen];
    if (isAiGenerated(current)) {
      errors.push(
        `${entry.id}: ${entry.fiche} still carries the ai_generated source at ${entry.path} — run ${APPLY_VERIFICATIONS_COMMAND}`
      );
    } else if (
      !isObject(current) ||
      current.title !== chosen.title ||
      normalizeUrl(current.url) !== normalizeUrl(chosen.url)
    ) {
      errors.push(
        `${entry.id}: ${entry.fiche} ${entry.path} does not cite the accepted candidate "${chosen.title}"`
      );
    } else if (current.tier !== entry.tier) {
      errors.push(
        `${entry.id}: ${entry.fiche} cites "${chosen.title}" at "${String(current.tier)}", the verification says "${entry.tier}"`
      );
    }
  }
  return errors;
}
