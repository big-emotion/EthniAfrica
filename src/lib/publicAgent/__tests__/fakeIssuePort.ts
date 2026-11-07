import type { IssuePort } from "@/lib/publicAgent/githubIssues";

// @req REQ-178
export interface FakeIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
  comments: string[];
}

/** An in-memory repository of issues, enough to observe what the tool writes. */
// @req REQ-178
export function createFakeIssuePort() {
  const issues: FakeIssue[] = [];
  const port: IssuePort = {
    async findIssue({ title, label }) {
      const found = issues.find(
        (issue) => issue.title === title && issue.labels.includes(label)
      );
      return found ? { number: found.number, labels: [...found.labels] } : null;
    },
    async createIssue({ title, body, labels }) {
      const issue = {
        number: issues.length + 1,
        title,
        body,
        labels: [...labels],
        comments: [],
      };
      issues.push(issue);
      return { number: issue.number };
    },
    async addComment(number, body) {
      issues.find((issue) => issue.number === number)!.comments.push(body);
    },
    async addLabels(number, labels) {
      const issue = issues.find((candidate) => candidate.number === number)!;
      for (const label of labels) {
        if (!issue.labels.includes(label)) issue.labels.push(label);
      }
    },
  };
  return { port, issues };
}
