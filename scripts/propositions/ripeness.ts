import { branchSlug, normalizeKey, parseProposals } from "./contract";

export const LABEL_PROPOSITION = "proposition";
export const LABEL_PR_OPEN = "pr-open";
export const LABEL_PROCESSED = "processed";
export const PROPOSAL_BRANCH_PREFIX = "proposal/";

/** Small on purpose: one PR per name is a human review each morning. */
export const DEFAULT_RIPE_LIMIT = 3;

export interface IssueSnapshot {
  number: number;
  title: string;
  state: "open" | "closed";
  labels: string[];
  /** Comment bodies, oldest first. */
  comments: string[];
}

export const slugForTitle = (title: string) => branchSlug(normalizeKey(title));

/**
 * Ripe means a human-visible proposal exists, cites at least one source, and
 * nothing downstream has already picked it up. A proposal with no source is
 * left waiting: the routine does not invent evidence.
 */
export function isRipe(
  issue: IssueSnapshot,
  openPullBranches: string[]
): boolean {
  if (issue.state !== "open") return false;
  if (!issue.labels.includes(LABEL_PROPOSITION)) return false;
  if (issue.labels.includes(LABEL_PR_OPEN)) return false;
  if (issue.labels.includes(LABEL_PROCESSED)) return false;
  if (
    openPullBranches.includes(
      `${PROPOSAL_BRANCH_PREFIX}${slugForTitle(issue.title)}`
    )
  )
    return false;
  return parseProposals(issue.comments).some(
    (proposal) => proposal.sources.length > 0
  );
}
