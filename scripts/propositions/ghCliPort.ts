import { LABEL_PROPOSITION } from "./ripeness";
import type { CommandRunner, GithubPort } from "./ports";

const ISSUE_PAGE = 100;

/**
 * GitHub through the `gh` CLI. Text from issues travels only as the value of a
 * `--flag=value` argument: the `=` form keeps a value starting with `-` from
 * being read as another flag.
 */
export function ghCliPort(
  run: CommandRunner,
  proposalsRepo: string
): GithubPort {
  const repo = `--repo=${proposalsRepo}`;

  const gh = (args: string[]): string => {
    const result = run("gh", args);
    if (result.status !== 0) {
      throw new Error(
        `gh ${args[0]} ${args[1]} failed: ${result.stderr.trim()}`
      );
    }
    return result.stdout;
  };

  return {
    listOpenIssues() {
      const rows = JSON.parse(
        gh([
          "issue",
          "list",
          repo,
          `--label=${LABEL_PROPOSITION}`,
          "--state=open",
          `--limit=${ISSUE_PAGE}`,
          "--json=number,title,body,labels",
        ])
      ) as Array<{
        number: number;
        title: string;
        body: string;
        labels: Array<{ name: string }>;
      }>;
      return rows.map((row) => ({
        number: row.number,
        title: row.title,
        body: row.body ?? "",
        labels: row.labels.map((label) => label.name),
      }));
    },

    listComments(issueNumber) {
      const view = JSON.parse(
        gh(["issue", "view", String(issueNumber), repo, "--json=comments"])
      ) as { comments: Array<{ body: string }> };
      return view.comments.map((comment) => comment.body);
    },

    listOpenPullBranches() {
      const rows = JSON.parse(
        gh(["pr", "list", "--state=open", "--limit=200", "--json=headRefName"])
      ) as Array<{ headRefName: string }>;
      return rows.map((row) => row.headRefName);
    },

    openPullRequest({ head, base, title, body }) {
      const url = gh([
        "pr",
        "create",
        `--base=${base}`,
        `--head=${head}`,
        `--title=${title}`,
        `--body=${body}`,
      ]).trim();
      return { url, number: Number(url.split("/").pop()) };
    },

    commentOnIssue(issueNumber, body) {
      gh(["issue", "comment", String(issueNumber), repo, `--body=${body}`]);
    },

    addLabel(issueNumber, label) {
      gh(["issue", "edit", String(issueNumber), repo, `--add-label=${label}`]);
    },
  };
}
