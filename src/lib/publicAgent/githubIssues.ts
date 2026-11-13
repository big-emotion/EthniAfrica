import { createSign } from "node:crypto";

/**
 * The only door to the private proposals repository: four issue operations,
 * so the tool is testable against a fake and the GitHub App needs no more than
 * Issues read/write on that one repository.
 */
// @req REQ-178
export interface IssuePort {
  findIssue(query: {
    title: string;
    label: string;
  }): Promise<{ number: number; labels: string[] } | null>;
  createIssue(issue: {
    title: string;
    body: string;
    labels: string[];
  }): Promise<{ number: number }>;
  addComment(issueNumber: number, body: string): Promise<void>;
  addLabels(issueNumber: number, labels: string[]): Promise<void>;
}

// @req REQ-178
export interface GithubAppConfig {
  repo: string;
  appId: string;
  installationId: string;
  privateKey: string;
}

const API = "https://api.github.com";
// GitHub caps an app JWT at ten minutes; the clock-skew margin on `iat` is
// GitHub's own recommendation.
const JWT_LIFETIME_SECONDS = 9 * 60;
const JWT_BACKDATE_SECONDS = 60;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

// @req REQ-178
export function _resetInstallationTokenForTest(): void {
  cachedToken = null;
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function appJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const signingInput = [
    base64url(JSON.stringify({ alg: "RS256", typ: "JWT" })),
    base64url(
      JSON.stringify({
        iat: now - JWT_BACKDATE_SECONDS,
        exp: now + JWT_LIFETIME_SECONDS,
        iss: appId,
      })
    ),
  ].join(".");
  // Hosting secret stores often flatten the PEM's line breaks into "\n".
  const pem = privateKey.replace(/\\n/g, "\n");
  const signature = createSign("RSA-SHA256").update(signingInput).sign(pem);
  return `${signingInput}.${base64url(signature)}`;
}

// A GitHub refusal says which call failed, never what it answered: the body
// may echo a proposal.
async function githubJson(
  response: Response,
  what: string
): Promise<Record<string, unknown>> {
  if (!response.ok) {
    throw new Error(`GitHub ${what} failed with status ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

async function installationToken(config: GithubAppConfig): Promise<string> {
  if (
    cachedToken &&
    cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()
  ) {
    return cachedToken.value;
  }
  const response = await fetch(
    `${API}/app/installations/${config.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt(config.appId, config.privateKey)}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  const body = await githubJson(response, "installation token");
  cachedToken = {
    value: String(body.token),
    expiresAt: Date.parse(String(body.expires_at)),
  };
  return cachedToken.value;
}

// @req REQ-178
export function createGithubIssuesPort(config: GithubAppConfig): IssuePort {
  const repoUrl = `${API}/repos/${config.repo}`;

  async function call(path: string, what: string, init: RequestInit = {}) {
    const token = await installationToken(config);
    const response = await fetch(`${repoUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
    });
    return githubJson(response, what);
  }

  const post = (path: string, what: string, payload: unknown) =>
    call(path, what, { method: "POST", body: JSON.stringify(payload) });

  return {
    async findIssue({ title, label }) {
      const query = `repo:${config.repo} is:issue label:"${label}" in:title "${title.replace(/"/g, " ")}"`;
      const token = await installationToken(config);
      const response = await fetch(
        `${API}/search/issues?q=${encodeURIComponent(query)}&per_page=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
          },
        }
      );
      const body = await githubJson(response, "issue search");
      const items = (body.items ?? []) as Array<{
        number: number;
        title: string;
        labels: Array<{ name: string }>;
      }>;
      // The search matches words, not the whole title.
      const exact = items.find((item) => item.title === title);
      return exact
        ? { number: exact.number, labels: exact.labels.map((l) => l.name) }
        : null;
    },
    async createIssue(issue) {
      const created = await post("/issues", "issue creation", issue);
      return { number: Number(created.number) };
    },
    async addComment(issueNumber, body) {
      await post(`/issues/${issueNumber}/comments`, "comment", { body });
    },
    async addLabels(issueNumber, labels) {
      await post(`/issues/${issueNumber}/labels`, "labeling", { labels });
    },
  };
}
