import type { GithubPort, IssueRecord } from "../../propositions/ports";
import type { CommandResult, CommandRunner } from "../../propositions/ports";

export interface RecordedCall {
  file: string;
  args: string[];
}

/** Answers by the first matching rule; anything unmatched succeeds with no output. */
export function fakeRunner(
  rules: Array<{
    match: (call: RecordedCall) => boolean;
    result: Partial<CommandResult>;
  }> = []
) {
  const calls: RecordedCall[] = [];
  const run: CommandRunner = (file, args) => {
    const call = { file, args: [...args] };
    calls.push(call);
    const rule = rules.find((r) => r.match(call));
    return { status: 0, stdout: "", stderr: "", ...rule?.result };
  };
  return { run, calls };
}

export function fakeGithub(
  issues: IssueRecord[],
  commentsByIssue: Record<number, string[]>,
  openPullBranches: string[] = []
) {
  const events: string[] = [];
  const port: GithubPort = {
    listOpenIssues: () => issues,
    listComments: (n) => commentsByIssue[n] ?? [],
    listOpenPullBranches: () => openPullBranches,
    openPullRequest: ({ head, title, body }) => {
      events.push(`pr:${head}|${title}|${body}`);
      return { url: "https://github.com/o/r/pull/42", number: 42 };
    },
    commentOnIssue: (n, body) => events.push(`comment:${n}|${body}`),
    addLabel: (n, label) => events.push(`label:${n}|${label}`),
  };
  return { port, events };
}
