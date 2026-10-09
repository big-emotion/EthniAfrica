#!/usr/bin/env tsx
/**
 * Proposes a real source for each ai_generated corpus source, by web search,
 * and appends the proposals to the verification ledger for a human to decide.
 *
 * It never touches a fiche. A proposal is a lead, not a ruling: the model can
 * misread a page or cite one that only resembles the claim, and the doctrine
 * keeps the decision — accept a candidate, keep the synthesis, or record an
 * oral account — with a person. `applyAiSourceVerifications.ts` writes only
 * what a person accepted.
 *
 * The search runs through the operator's Claude Code CLI (`claude -p`), on
 * their subscription: the project pays for no API key and runs nothing on
 * GitHub's side.
 *
 * Sources are taken in corpus order (fiches sorted by path, then document
 * order) so successive runs walk the tail instead of re-asking the same ones;
 * anything already in the ledger, whatever its status, is skipped.
 *
 *   npm run verify:ai-sources                # 20 sources
 *   npm run verify:ai-sources -- --limit 5
 */

import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

import { z } from "zod";

import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  CANDIDATE_SOURCE_KINDS,
  findAiGeneratedSources,
  readVerificationLedger,
  sourceIdentity,
  validateCandidate,
  validateVerifications,
  writeVerificationLedger,
  type AiGeneratedSource,
  type AiSourceVerification,
  type SourceCandidate,
} from "./aiSourceVerifications";
import { readCorpusFiches } from "./sourceTierRulings";

const MODEL_ALIAS = "opus";
/** What the ledger records as `model`: the alias, and that it ran in the CLI. */
export const CLI_MODEL_LABEL = `${MODEL_ALIAS} (claude -p)`;
const DEFAULT_LIMIT = 20;

export type VerificationRequest = AiGeneratedSource;

/** The one seam to the network: tests pass a fake, the scripts pass Claude. */
export type ProposeCandidates = (
  request: VerificationRequest
) => Promise<SourceCandidate[]>;

function nextSequence(entries: AiSourceVerification[]): number {
  const numbers = entries.map((entry) => Number(entry.id.slice(-4)) || 0);
  return Math.max(0, ...numbers) + 1;
}

export interface ProposalOptions {
  ledgerPath: string;
  proposeCandidates: ProposeCandidates;
  model: string;
  /** ISO date stamped on the ids and `proposedAt`. */
  today: string;
}

/**
 * Searches each source the ledger does not hold yet and appends one
 * `proposed` entry per source. The ledger is written even when a search
 * throws midway, so a failure on source 15 does not discard the first 14
 * searches.
 */
export async function appendProposals(
  sources: AiGeneratedSource[],
  options: ProposalOptions
): Promise<AiSourceVerification[]> {
  const ledger = readVerificationLedger(options.ledgerPath);
  const errors = validateVerifications(ledger);
  if (errors.length > 0) {
    throw new Error(
      `The verification ledger is invalid:\n${errors.join("\n")}`
    );
  }

  // One proposal per identity: sources of a fiche sharing a title and url
  // are one source to decide on.
  const known = new Set(ledger.map(sourceIdentity));
  const pending = sources.filter((source) => {
    const identity = sourceIdentity(source);
    if (known.has(identity)) return false;
    known.add(identity);
    return true;
  });

  const proposed: AiSourceVerification[] = [];
  let sequence = nextSequence(ledger);
  try {
    for (const source of pending) {
      const candidates = (await options.proposeCandidates(source)).filter(
        (candidate, index) => validateCandidate(candidate, index).length === 0
      );
      proposed.push({
        id: `ASV-${options.today}-${String(sequence).padStart(4, "0")}`,
        fiche: source.fiche,
        path: source.path,
        claim: source.claim,
        original: source.original,
        ...(source.owner ? { owner: source.owner } : {}),
        candidates,
        status: "proposed",
        proposedAt: options.today,
        model: options.model,
      });
      sequence += 1;
    }
  } finally {
    if (proposed.length > 0) {
      await writeVerificationLedger(options.ledgerPath, [
        ...ledger,
        ...proposed,
      ]);
    }
  }
  return proposed;
}

export interface VerificationOptions extends ProposalOptions {
  datasetRoot: string;
  limit: number;
}

/** The backlog: the next `limit` ai_generated sources the ledger lacks. */
export async function runVerification(
  options: VerificationOptions
): Promise<AiSourceVerification[]> {
  const known = new Set(
    readVerificationLedger(options.ledgerPath).map(sourceIdentity)
  );
  const pending = findAiGeneratedSources(readCorpusFiches(options.datasetRoot))
    .filter((source) => {
      const identity = sourceIdentity(source);
      if (known.has(identity)) return false;
      known.add(identity);
      return true;
    })
    .slice(0, options.limit);
  return appendProposals(pending, options);
}

const CandidateFields = z.strictObject({
  title: z.string(),
  author: z.string().nullable(),
  year: z.number().nullable(),
  url: z.string(),
  source_kind: z.enum(CANDIDATE_SOURCE_KINDS),
  quote: z.string(),
  supports: z.string(),
});

const CandidateReport = z.strictObject({
  candidates: z.array(CandidateFields),
});

/**
 * Passed to `--json-schema`, so the CLI itself holds the model to the shape.
 * Without zod's `$schema` line: the CLI's validator does not know the
 * draft-2020-12 meta-schema and refuses the whole run.
 */
const reportShape: Record<string, unknown> = z.toJSONSchema(CandidateReport);
delete reportShape.$schema;
const REPORT_SCHEMA = JSON.stringify(reportShape);

const SYSTEM = `You verify citations for an open, sourced atlas of African peoples, languages and names. A corpus statement is currently backed only by machine-written text. Search the web for published sources that actually state it.

Rules:
- Return only sources you opened in this search that state the claim, each with a short verbatim quote from that source.
- Prefer academic, archival, linguistic-reference and official sources over encyclopedias, blogs and genealogy sites.
- Never invent or reconstruct a URL: use the exact URL of a page you saw.
- A source that merely mentions the name without supporting the claim does not count.
- When nothing supports the claim, answer with an empty list. That is a useful answer: a human will then decide whether the statement rests on an oral account.
- Answer with JSON only: {"candidates": [{"title", "author", "year", "url", "source_kind", "quote", "supports"}]}.`;

function describeRequest(request: VerificationRequest): string {
  return [
    `Fiche: ${request.fiche} (at ${request.path})`,
    `Claim (fields of the fiche, in French): ${request.claim || "(no text beside the source)"}`,
    `Current machine-written citation: ${request.original.title ?? "(untitled)"}${request.original.url ? ` <${request.original.url}>` : ""}`,
  ].join("\n");
}

const WEB_TOOLS = "WebSearch,WebFetch";

/**
 * `--safe-mode` and `--strict-mcp-config` keep the operator's own CLAUDE.md,
 * plugins, hooks and MCP servers out of the run: they are not part of the
 * task, and loading them multiplies the context by two orders of magnitude.
 * `--permission-prompts none` denies anything that would ask, so a run in a
 * git hook can never hang on a prompt nobody sees. Unlike `--bare`, safe mode
 * keeps subscription login working.
 */
export const CLAUDE_ARGS = [
  "-p",
  "--output-format",
  "json",
  "--model",
  MODEL_ALIAS,
  "--safe-mode",
  "--strict-mcp-config",
  "--no-session-persistence",
  "--permission-prompts",
  "none",
  "--tools",
  WEB_TOOLS,
  "--allowedTools",
  WEB_TOOLS,
  "--system-prompt",
  SYSTEM,
  "--json-schema",
  REPORT_SCHEMA,
];

/** A few searches and page reads per source; past this, something is stuck. */
const CLAUDE_TIMEOUT_MS = 5 * 60 * 1000;

export interface ClaudeRunResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error: (Error & { code?: string }) | undefined;
}

/** The one process seam: tests pass a fake, so no test ever spawns the CLI. */
export type ClaudeRun = (args: string[], input: string) => ClaudeRunResult;

export const spawnClaude: ClaudeRun = (args, input) => {
  const result = spawnSync("claude", args, {
    input,
    encoding: "utf8",
    timeout: CLAUDE_TIMEOUT_MS,
    maxBuffer: 16 * 1024 * 1024,
    // Away from the repository, so no project setting or hook joins the run.
    cwd: os.tmpdir(),
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
};

const CliEnvelope = z.looseObject({
  is_error: z.boolean().optional(),
  subtype: z.string().optional(),
  result: z.string().optional(),
  structured_output: z.unknown().optional(),
});

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The model's text answer, which may arrive inside a ```json fence. */
function parseAnswerText(text: string | undefined): unknown {
  if (!text) return undefined;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return parseJson((fenced ? fenced[1] : text).trim());
}

function readCandidates(answer: unknown): SourceCandidate[] {
  const report = Array.isArray(answer) ? { candidates: answer } : answer;
  const parsed = CandidateReport.safeParse(report);
  return parsed.success ? (parsed.data.candidates as SourceCandidate[]) : [];
}

/**
 * An answer that cannot be read is zero candidates: a human still sees the
 * source. A run that did not answer at all throws, so it is retried instead
 * of being ledgered as an empty search.
 */
export function createClaudeCliProposer(
  run: ClaudeRun = spawnClaude
): ProposeCandidates {
  return async (request) => {
    const label = `${request.fiche} ${request.path}`;
    const outcome = run(CLAUDE_ARGS, describeRequest(request));

    if (outcome.error?.code === "ETIMEDOUT") {
      throw new Error(
        `claude timed out after ${CLAUDE_TIMEOUT_MS / 1000}s on ${label}`
      );
    }
    if (outcome.error) {
      throw new Error(
        `claude could not run on ${label}: ${outcome.error.message}`
      );
    }
    if (outcome.status !== 0) {
      throw new Error(
        `claude exited ${outcome.status} on ${label}: ${outcome.stderr.trim() || outcome.stdout.trim()}`
      );
    }

    const parsedEnvelope = CliEnvelope.safeParse(
      parseJson(outcome.stdout.trim())
    );
    if (!parsedEnvelope.success) {
      throw new Error(`claude printed no JSON result on ${label}`);
    }
    const envelope = parsedEnvelope.data;
    if (envelope.is_error) {
      throw new Error(
        `claude reported an error on ${label}: ${envelope.subtype ?? "unknown"} ${envelope.result ?? ""}`.trim()
      );
    }

    return readCandidates(
      envelope.structured_output ?? parseAnswerText(envelope.result)
    );
  };
}

function readLimit(argv: string[]): number {
  const index = argv.indexOf("--limit");
  if (index === -1) return DEFAULT_LIMIT;
  const limit = Number(argv[index + 1]);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(
      `--limit expects a positive integer, got "${argv[index + 1]}"`
    );
  }
  return limit;
}

async function main(): Promise<void> {
  const proposed = await runVerification({
    datasetRoot: "dataset/source/afrik",
    ledgerPath: AI_SOURCE_VERIFICATIONS_LEDGER,
    limit: readLimit(process.argv),
    proposeCandidates: createClaudeCliProposer(),
    model: CLI_MODEL_LABEL,
    today: new Date().toISOString().slice(0, 10),
  });

  console.log(`Proposed ${proposed.length} verification(s):`);
  for (const entry of proposed) {
    console.log(
      `  ${entry.id} ${entry.fiche} ${entry.path}: ${entry.candidates.length} candidate(s)`
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
