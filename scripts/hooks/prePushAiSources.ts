#!/usr/bin/env tsx
/**
 * Pre-push guard — an ai_generated source a push adds is searched on the web
 * and put in front of a person before it leaves the machine.
 *
 * It runs locally, on the operator's Claude Code subscription (`claude -p`),
 * because the project pays for no API key and runs no model on GitHub. That
 * makes it skippable (`git push --no-verify`), which is acceptable: CI still
 * runs `npm run check:ai-sources`, whose ratchet fails on any new
 * ai_generated source, with or without this hook.
 *
 * Only sources the pushed commits add are looked at, so the 1,343-source
 * backlog never slows a push down (`npm run verify:ai-sources` walks it).
 * A push that touches no fiche costs one `git diff --name-only` per ref.
 *
 * Wired in `.husky/pre-push`; git writes one
 * "<local ref> <local sha> <remote ref> <remote sha>" line per ref on stdin.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";

import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  APPLY_VERIFICATIONS_COMMAND,
  findAiGeneratedSources,
  readVerificationLedger,
  sourceIdentity,
  type AiGeneratedSource,
  type AiSourceVerification,
} from "../afrik/aiSourceVerifications";
import type { CorpusFiche } from "../afrik/sourceTierRulings";
import {
  appendProposals,
  CLI_MODEL_LABEL,
  createClaudeCliProposer,
  type ProposeCandidates,
} from "../afrik/verifyAiGeneratedSources";

const DATASET_PREFIX = "dataset/source/afrik/";
const INTEGRATION_REF = "origin/recette";
const NO_COMMIT = /^0+$/;

/** The only git questions the hook asks; tests answer them from a map. */
export interface CorpusHistory {
  hasCommit(sha: string): boolean;
  /** null when the two share no history. */
  mergeBase(sha: string, ref: string): string | null;
  /** Repository paths of the fiches added or modified between two commits. */
  changedFiches(fromSha: string, toSha: string): string[];
  /** null when the file does not exist at that commit. */
  readFile(sha: string, repoPath: string): string | null;
}

export interface PrePushOptions {
  stdin: string;
  history: CorpusHistory;
  /** The working-tree ledger, where proposals are appended. */
  ledgerPath: string;
  claudeAvailable: () => boolean;
  proposeCandidates: ProposeCandidates;
  today: string;
  print: (line: string) => void;
  /** Searches per push attempt; defaults to SEARCHES_PER_PUSH. */
  searchLimit?: number;
}

/**
 * A bulk import can add hundreds of sources; searching them all would hold a
 * push for hours. The push stays blocked until each is decided anyway, so
 * every attempt searches the next batch.
 */
const SEARCHES_PER_PUSH = 20;

interface PushedRef {
  localSha: string;
  remoteSha: string;
}

function parsePushedRefs(stdin: string): PushedRef[] {
  return (
    stdin
      .split("\n")
      .map((line) => line.trim().split(/\s+/))
      .filter((fields) => fields.length === 4)
      .map(([, localSha, , remoteSha]) => ({ localSha, remoteSha }))
      // A deleted ref pushes no content.
      .filter((ref) => !NO_COMMIT.test(ref.localSha))
  );
}

/**
 * What the pushed commits are compared with: the remote tip when we have it,
 * else where the branch left the integration branch. A brand-new branch with
 * no common history gets no base, and CI's ratchet is left to judge it.
 */
function baseOf(history: CorpusHistory, ref: PushedRef): string | null {
  if (!NO_COMMIT.test(ref.remoteSha) && history.hasCommit(ref.remoteSha)) {
    return ref.remoteSha;
  }
  return history.mergeBase(ref.localSha, INTEGRATION_REF);
}

function fichesAt(
  history: CorpusHistory,
  sha: string,
  repoPaths: string[]
): CorpusFiche[] {
  const fiches: CorpusFiche[] = [];
  for (const repoPath of repoPaths) {
    const text = history.readFile(sha, repoPath);
    if (text === null) continue;
    try {
      fiches.push({
        path: repoPath.slice(DATASET_PREFIX.length),
        text,
        json: JSON.parse(text),
      });
    } catch {
      // A fiche that does not parse is validateAfrikData's to report.
    }
  }
  return fiches;
}

/**
 * By identity (fiche + title + url), not JSON path: a citation inserted above
 * an existing ai_generated source shifts its index without adding anything.
 */
function findAddedAiSources(
  history: CorpusHistory,
  ref: PushedRef
): AiGeneratedSource[] {
  const base = baseOf(history, ref);
  if (!base) return [];
  const changed = history.changedFiches(base, ref.localSha);
  if (changed.length === 0) return [];

  const before = new Set(
    findAiGeneratedSources(fichesAt(history, base, changed)).map(sourceIdentity)
  );
  return findAiGeneratedSources(
    fichesAt(history, ref.localSha, changed)
  ).filter((source) => !before.has(sourceIdentity(source)));
}

function ledgerAt(history: CorpusHistory, sha: string): AiSourceVerification[] {
  const text = history.readFile(sha, AI_SOURCE_VERIFICATIONS_LEDGER);
  if (text === null) return [];
  try {
    const parsed = JSON.parse(text) as { verifications?: unknown };
    return Array.isArray(parsed.verifications)
      ? (parsed.verifications as AiSourceVerification[])
      : [];
  } catch {
    // A malformed ledger fails check:ai-sources; here it decides nothing.
    return [];
  }
}

const label = (source: AiGeneratedSource) => `${source.fiche} ${source.path}`;

/**
 * The verdict is read from the ledger in the pushed commit, not the working
 * tree: CI sees only what is pushed, so an uncommitted decision is no
 * decision yet.
 */
function undecided(
  history: CorpusHistory,
  ref: PushedRef,
  added: AiGeneratedSource[]
): { source: AiGeneratedSource; status: string | null }[] {
  const byKey = new Map(
    ledgerAt(history, ref.localSha).map((entry) => [
      sourceIdentity(entry),
      entry,
    ])
  );
  return added
    .map((source) => ({
      source,
      status: byKey.get(sourceIdentity(source))?.status ?? null,
    }))
    .filter(({ status }) => status !== "rejected" && status !== "oral_needed");
}

const HOW_TO_DECIDE = [
  `Decide each entry in ${AI_SOURCE_VERIFICATIONS_LEDGER}: open each candidate's url, check the quote states the claim, then set`,
  `  "status": "accepted" with "chosen" (candidate index) and "tier" (official | referenced | unverified),`,
  `  or "rejected" (keep the citation as the synthesis it is), or "oral_needed" (an oral account must be recorded);`,
  `  plus "decidedBy" (an account id, never an e-mail) and "decidedAt" (ISO date).`,
  `For an accepted entry run ${APPLY_VERIFICATIONS_COMMAND}. Commit the ledger, then push again.`,
];

const BYPASS = [
  "To push anyway: git push --no-verify — CI still fails on a new ai_generated source (npm run check:ai-sources).",
];

export async function runPrePush(options: PrePushOptions): Promise<number> {
  const { history, print } = options;

  const blocked = new Map<
    string,
    { source: AiGeneratedSource; status: string | null }
  >();
  for (const ref of parsePushedRefs(options.stdin)) {
    const added = findAddedAiSources(history, ref);
    if (added.length === 0) continue;
    for (const item of undecided(history, ref, added)) {
      // The first location of an identity is the one the ledger records.
      const identity = sourceIdentity(item.source);
      if (!blocked.has(identity)) blocked.set(identity, item);
    }
  }
  if (blocked.size === 0) return 0;

  const items = [...blocked.values()];
  print(
    `This push adds ${items.length} ai_generated source(s) no one has decided on yet.`
  );

  const toApply = items.filter(({ status }) => status === "accepted");
  for (const { source } of toApply) {
    print(
      `  accepted but not applied: ${label(source)} — run ${APPLY_VERIFICATIONS_COMMAND}`
    );
  }

  const searched = new Set(
    readVerificationLedger(options.ledgerPath).map(sourceIdentity)
  );
  const unledgered = items
    .filter(({ status }) => status === null)
    .map(({ source }) => source);
  const toSearch = unledgered.filter(
    (source) => !searched.has(sourceIdentity(source))
  );

  if (toSearch.length > 0 && !options.claudeAvailable()) {
    print(
      "Claude Code (`claude`) is not on PATH, so these sources cannot be searched:"
    );
    for (const source of toSearch) print(`  ${label(source)}`);
    print(
      "Install it (npm install -g @anthropic-ai/claude-code), run `claude` once to log in with your subscription, and push again."
    );
    print(
      `Or record a decision by hand in ${AI_SOURCE_VERIFICATIONS_LEDGER} (schema in docs/editorial/source-review/README.md): status "rejected" or "oral_needed" needs no search.`
    );
    for (const line of BYPASS) print(line);
    return 1;
  }

  if (toSearch.length > 0) {
    const batch = toSearch.slice(0, options.searchLimit ?? SEARCHES_PER_PUSH);
    print(`Searching the web for ${batch.length} source(s) with claude -p…`);
    if (toSearch.length > batch.length) {
      print(
        `  ${toSearch.length - batch.length} more will be searched on the next push attempts.`
      );
    }
    try {
      await appendProposals(batch, {
        ledgerPath: options.ledgerPath,
        proposeCandidates: options.proposeCandidates,
        model: CLI_MODEL_LABEL,
        today: options.today,
      });
    } catch (error) {
      print(
        `Search stopped: ${error instanceof Error ? error.message : String(error)}`
      );
      print("The proposals made before it are kept; push again to retry.");
    }
  }

  const pending = readVerificationLedger(options.ledgerPath).filter(
    (entry) =>
      entry.status === "proposed" &&
      unledgered.some(
        (source) => sourceIdentity(source) === sourceIdentity(entry)
      )
  );
  if (pending.length > 0) {
    print("Waiting for a decision:");
    for (const entry of pending) {
      print(
        `  ${entry.id} ${entry.fiche} ${entry.path}: ${entry.candidates.length} candidate(s)`
      );
    }
  }
  if (pending.length > 0 || unledgered.length > 0) {
    for (const line of HOW_TO_DECIDE) print(line);
  }
  for (const line of BYPASS) print(line);
  return 1;
}

const gitHistory: CorpusHistory = {
  hasCommit: (sha) =>
    spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`]).status === 0,
  mergeBase: (sha, ref) => {
    const result = spawnSync("git", ["merge-base", sha, ref], {
      encoding: "utf8",
    });
    return result.status === 0 ? result.stdout.trim() : null;
  },
  changedFiches: (fromSha, toSha) =>
    execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--diff-filter=AMR",
        fromSha,
        toSha,
        "--",
        DATASET_PREFIX,
      ],
      { encoding: "utf8" }
    )
      .split("\n")
      .filter((file) => file.endsWith(".json")),
  readFile: (sha, repoPath) => {
    const result = spawnSync("git", ["show", `${sha}:${repoPath}`], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    return result.status === 0 ? result.stdout : null;
  },
};

function claudeOnPath(): boolean {
  return spawnSync("claude", ["--version"], { stdio: "ignore" }).error
    ? false
    : true;
}

async function main(): Promise<void> {
  process.exitCode = await runPrePush({
    stdin: fs.readFileSync(0, "utf8"),
    history: gitHistory,
    ledgerPath: AI_SOURCE_VERIFICATIONS_LEDGER,
    claudeAvailable: claudeOnPath,
    proposeCandidates: createClaudeCliProposer(),
    today: new Date().toISOString().slice(0, 10),
    print: (line) => console.error(line),
  });
}

if (process.argv[1] && process.argv[1].endsWith("prePushAiSources.ts")) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
