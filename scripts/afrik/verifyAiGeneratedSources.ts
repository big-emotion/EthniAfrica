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
 * Sources are taken in corpus order (fiches sorted by path, then document
 * order) so successive runs walk the tail instead of re-asking the same ones;
 * anything already in the ledger, whatever its status, is skipped.
 *
 *   npx tsx scripts/afrik/verifyAiGeneratedSources.ts            # 20 sources
 *   npx tsx scripts/afrik/verifyAiGeneratedSources.ts --limit 5
 *
 * Credentials resolve from the environment (ANTHROPIC_API_KEY in CI).
 */

import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  CANDIDATE_SOURCE_KINDS,
  findAiGeneratedSources,
  readVerificationLedger,
  validateCandidate,
  validateVerifications,
  writeVerificationLedger,
  type AiGeneratedSource,
  type AiSourceVerification,
  type SourceCandidate,
} from "./aiSourceVerifications";
import { readCorpusFiches } from "./sourceTierRulings";

const MODEL = "claude-opus-5-5";
const DEFAULT_LIMIT = 20;

export type VerificationRequest = AiGeneratedSource;

/** The one seam to the network: tests pass a fake, CI passes Claude. */
export type ProposeCandidates = (
  request: VerificationRequest
) => Promise<SourceCandidate[]>;

export interface VerificationOptions {
  datasetRoot: string;
  ledgerPath: string;
  limit: number;
  proposeCandidates: ProposeCandidates;
  model: string;
  /** ISO date stamped on the ids and `proposedAt`. */
  today: string;
}

function nextSequence(entries: AiSourceVerification[]): number {
  const numbers = entries.map((entry) => Number(entry.id.slice(-4)) || 0);
  return Math.max(0, ...numbers) + 1;
}

/**
 * Returns the proposals appended. The ledger is written even when a search
 * throws midway, so a rate limit on source 15 does not discard the first 14
 * paid-for searches.
 */
export async function runVerification(
  options: VerificationOptions
): Promise<AiSourceVerification[]> {
  const ledger = readVerificationLedger(options.ledgerPath);
  const errors = validateVerifications(ledger);
  if (errors.length > 0) {
    throw new Error(
      `The verification ledger is invalid:\n${errors.join("\n")}`
    );
  }

  const known = new Set(
    ledger.map((entry) => JSON.stringify([entry.fiche, entry.path]))
  );
  const pending = findAiGeneratedSources(readCorpusFiches(options.datasetRoot))
    .filter((source) => !known.has(JSON.stringify([source.fiche, source.path])))
    .slice(0, options.limit);

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

const CandidateReport = z.strictObject({
  candidates: z.array(
    z.strictObject({
      title: z.string(),
      author: z.string().nullable(),
      // No .int(): it emits minimum/maximum, which strict tool schemas reject.
      year: z.number().nullable(),
      url: z.string(),
      source_kind: z.enum(CANDIDATE_SOURCE_KINDS),
      quote: z.string(),
      supports: z.string(),
    })
  ),
});

// Structured output (`output_config.format`) is documented as incompatible
// with citations, and web search answers always carry citations, so the
// result comes back through a strict tool instead. Forcing that tool with
// tool_choice is a 400 on this model; the prompt asks for it and the loop
// nudges once if the model ends its turn without calling it.
const reportSchema: Record<string, unknown> = z.toJSONSchema(CandidateReport);
// The JSON Schema dialect marker is not part of a tool's input schema.
delete reportSchema.$schema;

const REPORT_TOOL: Anthropic.Tool = {
  name: "report_candidates",
  description:
    "Report the sources found for the claim. Call it exactly once, with an empty list when no source states the claim.",
  strict: true,
  input_schema: reportSchema as Anthropic.Tool.InputSchema,
};

const WEB_SEARCH: Anthropic.WebSearchTool20260209 = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 5,
};

const SYSTEM = `You verify citations for an open, sourced atlas of African peoples, languages and names. A corpus statement is currently backed only by machine-written text. Search the web for published sources that actually state it.

Rules:
- Return only sources you opened in this search that state the claim, each with a short verbatim quote from that source.
- Prefer academic, archival, linguistic-reference and official sources over encyclopedias, blogs and genealogy sites.
- Never invent or reconstruct a URL: use the exact URL of a page you saw.
- A source that merely mentions the name without supporting the claim does not count.
- When nothing supports the claim, report an empty list. That is a useful answer: a human will then decide whether the statement rests on an oral account.
- Finish by calling report_candidates once.`;

function describeRequest(request: VerificationRequest): string {
  return [
    `Fiche: ${request.fiche} (at ${request.path})`,
    `Claim (fields of the fiche, in French): ${request.claim || "(no text beside the source)"}`,
    `Current machine-written citation: ${request.original.title ?? "(untitled)"}${request.original.url ? ` <${request.original.url}>` : ""}`,
  ].join("\n");
}

/** Server-side search pauses after ten iterations; a few resumes are plenty. */
const MAX_TURNS = 6;

export function createClaudeProposer(
  client: Anthropic = new Anthropic()
): ProposeCandidates {
  return async (request) => {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: describeRequest(request) },
    ];
    let nudged = false;

    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        tools: [WEB_SEARCH, REPORT_TOOL],
        output_config: { effort: "medium" },
        messages,
      });

      if (response.stop_reason === "refusal") {
        console.warn(
          `  ${request.fiche} ${request.path}: refused (${response.stop_details?.category ?? "no category"}) — recorded with no candidate`
        );
        return [];
      }

      const report = response.content.find(
        (block): block is Anthropic.ToolUseBlock =>
          block.type === "tool_use" && block.name === REPORT_TOOL.name
      );
      if (report) {
        const parsed = CandidateReport.safeParse(report.input);
        return parsed.success
          ? (parsed.data.candidates as SourceCandidate[])
          : [];
      }

      messages.push({ role: "assistant", content: response.content });
      if (response.stop_reason === "pause_turn") continue;
      if (nudged) break;
      nudged = true;
      messages.push({
        role: "user",
        content: "Report your findings with the report_candidates tool.",
      });
    }

    console.warn(
      `  ${request.fiche} ${request.path}: no report after ${MAX_TURNS} turns — recorded with no candidate`
    );
    return [];
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
    proposeCandidates: createClaudeProposer(),
    model: MODEL,
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
