import { normalizeKey, parseProposals, type Proposal } from "./contract";
import type { GithubPort } from "./ports";
import {
  DEFAULT_RIPE_LIMIT,
  isRipe,
  slugForTitle,
  type IssueSnapshot,
} from "./ripeness";

export interface RipeIssue {
  number: number;
  /** Name as typed on the issue; data to read, not to execute. */
  title: string;
  key: string;
  slug: string;
  proposals: Proposal[];
}

export function listRipe(
  github: GithubPort,
  { limit = DEFAULT_RIPE_LIMIT }: { limit?: number } = {}
): RipeIssue[] {
  const openBranches = github.listOpenPullBranches();
  const ripe: RipeIssue[] = [];
  for (const issue of github.listOpenIssues()) {
    if (ripe.length >= limit) break;
    const comments = github.listComments(issue.number);
    const snapshot: IssueSnapshot = {
      number: issue.number,
      title: issue.title,
      state: "open",
      labels: issue.labels,
      comments,
    };
    if (!isRipe(snapshot, openBranches)) continue;
    ripe.push({
      number: issue.number,
      title: issue.title,
      key: normalizeKey(issue.title),
      slug: slugForTitle(issue.title),
      proposals: parseProposals(comments),
    });
  }
  return ripe;
}
