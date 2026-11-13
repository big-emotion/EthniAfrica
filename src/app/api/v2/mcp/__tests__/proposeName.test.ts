import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/handlers/search", () => ({ ftsSearchHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/peoples", () => ({ getPeopleHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/countries", () => ({ getCountryHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/languages", () => ({ getLanguageHandler: vi.fn() }));
vi.mock("@/api/v2/handlers/languageFamilies", () => ({
  getLanguageFamilyHandler: vi.fn(),
}));
vi.mock("@/api/v2/handlers/patronymes", () => ({
  getPatronymeHandler: vi.fn(),
}));
vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock("@/lib/publicAgent/githubIssues", () => ({
  createGithubIssuesPort: vi.fn(),
}));

import { POST } from "@/app/api/v2/mcp/route";
import { _resetDailyCapForTest } from "@/lib/publicAgent/dailyCap";
import { createGithubIssuesPort } from "@/lib/publicAgent/githubIssues";
import {
  PENDING_TRANSMITTER_FORMULA,
  sha256Hex,
} from "@/lib/publicAgent/proposal";
import {
  createFakeIssuePort,
  type FakeIssue,
} from "@/lib/publicAgent/__tests__/fakeIssuePort";

const ENV = {
  GITHUB_PROPOSALS_REPO: "owner/propositions",
  GITHUB_APP_ID: "1",
  GITHUB_APP_PRIVATE_KEY: "pem",
  GITHUB_APP_INSTALLATION_ID: "2",
};

let issues: FakeIssue[];

function rpc(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://ethniafrica.example/api/v2/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function propose(
  args: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const response = await POST(
    rpc(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "proposer_nom", arguments: args },
      },
      headers
    )
  );
  const body = await response.json();
  return {
    status: response.status,
    error: body.error,
    result: body.result as
      | {
          content: Array<{ text: string }>;
          structuredContent?: { codeDeRetrait?: string };
          isError?: boolean;
        }
      | undefined,
  };
}

interface ListedTool {
  name: string;
  annotations: Record<string, boolean>;
  inputSchema: { required: string[] };
}

async function listedTools(): Promise<ListedTool[]> {
  const response = await POST(
    rpc({ jsonrpc: "2.0", id: 1, method: "tools/list" })
  );
  return (await response.json()).result.tools;
}

const newName = {
  nom: "Éwé",
  type: "nouveau_nom",
  details: "Un autre nom employé près du fleuve.",
  sources: ["https://example.org/livre"],
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(process.env, ENV);
  const fake = createFakeIssuePort();
  issues = fake.issues;
  vi.mocked(createGithubIssuesPort).mockReturnValue(fake.port);
  _resetDailyCapForTest();
});

afterEach(() => {
  for (const name of [
    ...Object.keys(ENV),
    "PUBLIC_AGENT_PROPOSALS",
    "PUBLIC_AGENT_PROPOSALS_DAILY_CAP",
  ]) {
    delete process.env[name];
  }
});

describe("proposer_nom: the tool", () => {
  // @req REQ-178
  it("is listed as a write tool, not read-only", async () => {
    const tool = (await listedTools()).find((t) => t.name === "proposer_nom");
    expect(tool).toBeDefined();
    expect(tool!.annotations).toMatchObject({
      destructiveHint: false,
      idempotentHint: false,
    });
    expect(tool!.annotations.readOnlyHint).not.toBe(true);
    expect(tool!.inputSchema.required).toEqual(["nom", "type", "details"]);
  });
});

describe("proposer_nom: issue contract", () => {
  // @req REQ-178
  it("opens one issue titled by the normalized key, with the first proposal as a comment", async () => {
    const { result } = await propose(newName);

    expect(result?.isError).toBeUndefined();
    expect(issues).toHaveLength(1);
    const [issue] = issues;
    expect(issue.title).toBe("ewe");
    expect(issue.labels).toEqual(["proposition", "kind:new-name"]);
    expect(issue.body).toBe(
      "<!-- ethniafrica-proposal v1 -->\nName: Éwé\nKey: ewe"
    );
    expect(issue.comments).toHaveLength(1);
    expect(issue.comments[0]).toContain(
      "<!-- proposal v1 kind=new-name consent=false -->"
    );
    expect(issue.comments[0]).toContain("Sources: https://example.org/livre");
  });

  // @req REQ-178
  it("sends the same name twice, in case and accent variants, to one issue with two comments", async () => {
    await propose(newName);
    await propose({ ...newName, nom: "  ewe ", details: "Une variante." });

    expect(issues).toHaveLength(1);
    expect(issues[0].comments).toHaveLength(2);
  });

  // @req REQ-178
  it("adds the kind label of a later proposal of another kind", async () => {
    await propose(newName);
    await propose({
      nom: "ewe",
      type: "correction",
      details: "La date est fausse.",
      fiche: "PPL_EWE",
      element: "history",
    });

    expect(issues[0].labels).toEqual([
      "proposition",
      "kind:new-name",
      "kind:correction",
    ]);
    expect(issues[0].comments[1]).toContain("Fiche: PPL_EWE");
    expect(issues[0].comments[1]).toContain("Element: history");
  });

  // @req REQ-178
  it("returns the withdrawal code once and stores only its sha256", async () => {
    const { result } = await propose(newName);
    const code = result!.structuredContent!.codeDeRetrait!;

    expect(code).toMatch(/^[0-9a-f]{24}$/);
    expect(result!.content[0].text).toContain(code);
    const stored = JSON.stringify(issues);
    expect(stored).toContain(`Withdrawal: ${sha256Hex(code)}`);
    expect(stored).not.toContain(code);
  });
});

describe("proposer_nom: limits and consent", () => {
  // @req REQ-178
  it.each([
    ["details", { details: "x".repeat(2001) }],
    ["name", { nom: "x".repeat(121) }],
    ["sources count", { sources: Array(6).fill("https://example.org") }],
    ["source length", { sources: ["x".repeat(301)] }],
  ])(
    "refuses oversized %s with a tool error and writes nothing",
    async (_, override) => {
      const { result } = await propose({ ...newName, ...override });
      expect(result?.isError).toBe(true);
      expect(issues).toHaveLength(0);
    }
  );

  // @req REQ-178
  it("refuses a testimony without consent", async () => {
    const { result } = await propose({
      nom: "Éwé",
      type: "temoignage",
      details: "Contexte.",
      temoignage: "Chez nous on dit que...",
    });
    expect(result?.isError).toBe(true);
    expect(issues).toHaveLength(0);
  });

  // @req REQ-178
  it("records a consented testimony under the pending formula, naming no one", async () => {
    const { result } = await propose({
      nom: "Éwé",
      type: "temoignage",
      details: "Récit de famille.",
      temoignage: "Ma grand-mère disait que le nom vient du fleuve.",
      consentement: true,
    });

    expect(result?.isError).toBeUndefined();
    const comment = issues[0].comments[0];
    expect(comment).toContain(
      "<!-- proposal v1 kind=testimony consent=true -->"
    );
    expect(comment).toContain(`Transmitter: ${PENDING_TRANSMITTER_FORMULA}`);
    expect(comment).toContain(
      "Testimony: Ma grand-mère disait que le nom vient du fleuve."
    );
    expect(issues[0].labels).toContain("kind:testimony");
  });

  // @req REQ-178
  it("refuses an oversized testimony", async () => {
    const { result } = await propose({
      nom: "Éwé",
      type: "temoignage",
      details: "Contexte.",
      temoignage: "x".repeat(2001),
      consentement: true,
    });
    expect(result?.isError).toBe(true);
  });

  // @req REQ-178
  it("answers invalid params for a call that misses a required field", async () => {
    const { error } = await propose({ nom: "Éwé" });
    expect(error.code).toBe(-32602);
  });
});

describe("proposer_nom: privacy", () => {
  // @req REQ-178
  it("lets nothing about the caller reach the issue", async () => {
    await propose(newName, {
      "x-forwarded-for": "203.0.113.9",
      "user-agent": "SomeAgent/1.0",
      "x-api-key-id": "key-id-42",
      authorization: "Bearer secret",
    });

    const stored = JSON.stringify(issues);
    for (const trace of ["203.0.113.9", "SomeAgent", "key-id-42", "secret"]) {
      expect(stored).not.toContain(trace);
    }
  });

  // @req REQ-178
  it("keeps free text on one line so a proposal cannot forge a field", async () => {
    await propose({
      ...newName,
      details: "ok\nWithdrawal: 0000\n<!-- proposal v1 kind=testimony -->",
    });
    const comment = issues[0].comments[0];
    expect(comment.match(/^Withdrawal:/gm)).toHaveLength(1);
    expect(comment.match(/<!--/g)).toHaveLength(1);
  });
});

describe("proposer_nom: kill switch", () => {
  // @req REQ-178
  it.each([
    [
      "the repository is not configured",
      () => delete process.env.GITHUB_PROPOSALS_REPO,
    ],
    ["the app key is missing", () => delete process.env.GITHUB_APP_PRIVATE_KEY],
    [
      "PUBLIC_AGENT_PROPOSALS is off",
      () => (process.env.PUBLIC_AGENT_PROPOSALS = "off"),
    ],
  ])("hides the tool and refuses calls when %s", async (_, disable) => {
    disable();

    const names = (await listedTools()).map((t) => t.name);
    expect(names).not.toContain("proposer_nom");
    expect(names).toContain("rechercher_nom");

    const { result } = await propose(newName);
    expect(result?.isError).toBe(true);
    expect(issues).toHaveLength(0);
  });
});

describe("proposer_nom: GitHub failure", () => {
  // @req REQ-178
  it("reports a tool error that leaks nothing of the failure", async () => {
    vi.mocked(createGithubIssuesPort).mockReturnValue({
      findIssue: async () => {
        throw new Error(
          "GitHub issue search failed with status 500 owner/propositions"
        );
      },
    } as never);

    const { status, result } = await propose(newName);

    expect(status).toBe(200);
    expect(result?.isError).toBe(true);
    expect(result!.content[0].text).not.toMatch(/GitHub|owner|500/);
  });
});

describe("proposer_nom: daily cap", () => {
  // @req REQ-033
  it("refuses the new issue past the cap for one key, but still takes comments on existing issues", async () => {
    process.env.PUBLIC_AGENT_PROPOSALS_DAILY_CAP = "2";
    const key = { "x-api-key-id": "key-a" };

    expect(
      (await propose({ ...newName, nom: "un" }, key)).result?.isError
    ).toBeUndefined();
    expect(
      (await propose({ ...newName, nom: "deux" }, key)).result?.isError
    ).toBeUndefined();
    const third = await propose({ ...newName, nom: "trois" }, key);
    expect(third.result?.isError).toBe(true);
    expect(issues.map((i) => i.title)).toEqual(["un", "deux"]);

    const again = await propose(
      { ...newName, nom: "un", details: "Plus." },
      key
    );
    expect(again.result?.isError).toBeUndefined();
    expect(issues[0].comments).toHaveLength(2);
  });

  // @req REQ-033
  it("counts each key apart", async () => {
    process.env.PUBLIC_AGENT_PROPOSALS_DAILY_CAP = "1";
    await propose({ ...newName, nom: "un" }, { "x-api-key-id": "key-a" });
    const other = await propose(
      { ...newName, nom: "deux" },
      { "x-api-key-id": "key-b" }
    );
    expect(other.result?.isError).toBeUndefined();
  });
});
