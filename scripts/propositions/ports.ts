import { spawnSync } from "node:child_process";

export interface CommandResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Arguments are an array, never a string: no shell ever sees proposal text. */
export type CommandRunner = (file: string, args: string[]) => CommandResult;

export const runCommand: CommandRunner = (file, args) => {
  const result = spawnSync(file, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

export interface IssueRecord {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

export interface PullRequestRequest {
  head: string;
  base: string;
  title: string;
  body: string;
}

/** What the routine needs from GitHub; the proposals repo is bound at construction. */
export interface GithubPort {
  listOpenIssues(): IssueRecord[];
  /** Comment bodies, oldest first. */
  listComments(issueNumber: number): string[];
  /** Head branches of open PRs in the public repository. */
  listOpenPullBranches(): string[];
  openPullRequest(request: PullRequestRequest): { url: string; number: number };
  commentOnIssue(issueNumber: number, body: string): void;
  addLabel(issueNumber: number, label: string): void;
}
