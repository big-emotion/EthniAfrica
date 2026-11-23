import { parseProposals, SLUG_PATTERN } from "./contract";
import { changedPaths, guardRawDiff } from "./guard";
import type { CommandRunner, GithubPort } from "./ports";
import {
  LABEL_PR_OPEN,
  PROPOSAL_BRANCH_PREFIX,
  slugForTitle,
} from "./ripeness";

export interface FinalizeDeps {
  github: GithubPort;
  run: CommandRunner;
  readFile: (path: string) => string;
  /** "owner/name" of the private proposals repository, for the PR body link. */
  proposalsRepo: string;
  baseBranch: string;
}

// A flat shape rather than a union: the project compiles without strictNullChecks,
// where a discriminated union does not narrow.
export interface FinalizeOutcome {
  ok: boolean;
  prUrl?: string;
  reason?: string;
}

const VALIDATOR_COMMENT_TAIL = 1500;

const fail = (reason: string): FinalizeOutcome => ({ ok: false, reason });

/** Source entries (with a source_kind) found under any `sources` array of a fiche. */
function collectSourceKinds(
  node: unknown,
  found = new Map<string, string>()
): Map<string, string> {
  if (Array.isArray(node)) {
    node.forEach((child) => collectSourceKinds(child, found));
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (key === "sources" && Array.isArray(value)) {
        for (const entry of value) {
          const { url, title, source_kind: kind } = entry ?? {};
          if (typeof kind === "string") {
            found.set(String(url ?? title ?? ""), kind);
          }
        }
      }
      collectSourceKinds(value, found);
    }
  }
  return found;
}

function describeSourcesByKind(
  paths: string[],
  readFile: (path: string) => string
): string {
  const byKind = new Map<string, string[]>();
  for (const path of paths) {
    let fiche: unknown;
    try {
      fiche = JSON.parse(readFile(path));
    } catch {
      continue;
    }
    for (const [reference, kind] of collectSourceKinds(fiche)) {
      byKind.set(kind, [...(byKind.get(kind) ?? []), reference]);
    }
  }
  if (byKind.size === 0) return "- none found in the changed fiches";
  return [...byKind]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, refs]) => `- ${kind}: ${refs.length}`)
    .join("\n");
}

function pullRequestBody(args: {
  proposalsRepo: string;
  issueNumber: number;
  sourcesByKind: string;
  hasTestimony: boolean;
}): string {
  return [
    "Draft fiche change prepared by the daily proposals routine.",
    "",
    `Proposal issue: ${args.proposalsRepo}#${args.issueNumber}`,
    "",
    "Sources in the changed fiches, by source_kind:",
    args.sourcesByKind,
    ...(args.hasTestimony
      ? [
          "",
          'This change records a family testimony as claimed oral tradition (claimStatus "claimed"). The transmitter is described by the agreed formula and is not named.',
        ]
      : []),
    "",
    "Only dataset/source/afrik/**/*.json changed (checked by the guard), and the AFRIK validator passed. A person reviews the sources and the wording before merging; the routine never merges.",
  ].join("\n");
}

export function finalizeProposal(
  slug: string,
  deps: FinalizeDeps
): FinalizeOutcome {
  const { github, run, readFile, proposalsRepo, baseBranch } = deps;
  if (!SLUG_PATTERN.test(slug)) return fail(`invalid slug: ${slug}`);

  const branch = `${PROPOSAL_BRANCH_PREFIX}${slug}`;
  if (github.listOpenPullBranches().includes(branch)) {
    return fail(`a pull request is already open on ${branch}`);
  }
  const issue = github
    .listOpenIssues()
    .find((candidate) => slugForTitle(candidate.title) === slug);
  if (!issue) return fail(`no open proposal issue matches ${slug}`);

  const current = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (current.stdout.trim() !== branch) {
    return fail(`check out ${branch} first (on ${current.stdout.trim()})`);
  }

  // Three-dot: only what the branch added since it left the base.
  const diff = run("git", [
    "diff",
    "--raw",
    "--no-renames",
    `origin/${baseBranch}...${branch}`,
  ]);
  if (diff.status !== 0) return fail(`git diff failed: ${diff.stderr.trim()}`);
  const guard = guardRawDiff(diff.stdout);
  if (!guard.ok) return fail(`guard refused: ${guard.errors.join("; ")}`);

  // The validator checks the whole corpus: a fiche cannot break a cross-file rule unseen.
  const validation = run("npx", ["tsx", "scripts/validateAfrikData.ts"]);
  if (validation.status !== 0) {
    const tail = `${validation.stdout}\n${validation.stderr}`
      .trim()
      .slice(-VALIDATOR_COMMENT_TAIL);
    github.commentOnIssue(
      issue.number,
      `The AFRIK validator refused the draft fiche, so no pull request was opened.\n\n${tail}`
    );
    return fail("validator failed");
  }

  const push = run("git", ["push", "--set-upstream", "origin", branch]);
  if (push.status !== 0) return fail(`git push failed: ${push.stderr.trim()}`);

  const proposals = parseProposals(github.listComments(issue.number));
  const pullRequest = github.openPullRequest({
    head: branch,
    base: baseBranch,
    title: `feat(afrik): proposal for ${slug}`,
    body: pullRequestBody({
      proposalsRepo,
      issueNumber: issue.number,
      sourcesByKind: describeSourcesByKind(changedPaths(diff.stdout), readFile),
      hasTestimony: proposals.some((p) => p.kind === "testimony"),
    }),
  });
  github.commentOnIssue(issue.number, pullRequest.url);
  github.addLabel(issue.number, LABEL_PR_OPEN);
  return { ok: true, prUrl: pullRequest.url };
}
