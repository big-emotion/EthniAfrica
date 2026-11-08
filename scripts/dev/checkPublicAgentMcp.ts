/**
 * Smoke test of a deployed public agent endpoint: the same three calls an
 * assistant makes when it connects (initialize, tools/list, one search).
 *
 *   npm run mcp:check -- http://localhost:3000/api/v2/mcp
 *
 * The HTTP call is injected so the steps are testable without a server.
 * Exit code 1 when any step fails, so it can gate a recette-to-production
 * checklist.
 */

export interface JsonRpcAnswer {
  status: number;
  body: unknown;
}

export type JsonRpcPost = (
  url: string,
  message: unknown
) => Promise<JsonRpcAnswer>;

export interface CheckStep {
  name: string;
  ok: boolean;
  reason?: string;
}

const EXPECTED_TOOLS = ["rechercher_nom", "lire_fiche"];
// A family name is the case the assistants are asked about most, and it
// carries an accent that a broken request encoding would damage.
const SEARCHED_NAME = "Traoré";

interface RpcResult {
  serverInfo?: { name?: string };
  protocolVersion?: string;
  tools?: Array<{ name: string }>;
  content?: Array<{ text?: string }>;
  isError?: boolean;
}

interface RpcBody {
  result?: RpcResult;
  error?: { code: number; message: string };
}

async function step(
  name: string,
  url: string,
  post: JsonRpcPost,
  id: number,
  method: string,
  params: unknown,
  verify: (result: RpcResult) => string | null
): Promise<CheckStep> {
  let answer: JsonRpcAnswer;
  try {
    answer = await post(url, { jsonrpc: "2.0", id, method, params });
  } catch (error) {
    return {
      name,
      ok: false,
      reason: `request failed: ${(error as Error).message}`,
    };
  }
  if (answer.status !== 200) {
    return {
      name,
      ok: false,
      reason: `HTTP ${answer.status} ${JSON.stringify(answer.body)}`,
    };
  }
  const body = answer.body as RpcBody;
  if (body?.error) {
    return {
      name,
      ok: false,
      reason: `JSON-RPC error ${body.error.code}: ${body.error.message}`,
    };
  }
  if (!body?.result) {
    return { name, ok: false, reason: "no result in the answer" };
  }
  const problem = verify(body.result);
  return problem ? { name, ok: false, reason: problem } : { name, ok: true };
}

export async function runChecks(
  url: string,
  post: JsonRpcPost
): Promise<CheckStep[]> {
  // The server is stateless, so each step stands alone and a failure of one
  // does not hide the state of the others.
  return [
    await step(
      "initialize",
      url,
      post,
      1,
      "initialize",
      {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "mcp-check", version: "1" },
      },
      (result) =>
        result.serverInfo?.name && result.protocolVersion
          ? null
          : "missing serverInfo or protocolVersion"
    ),
    await step("tools/list", url, post, 2, "tools/list", {}, (result) => {
      const names: string[] = (result.tools ?? []).map(
        (tool: { name: string }) => tool.name
      );
      const missing = EXPECTED_TOOLS.filter((tool) => !names.includes(tool));
      return missing.length ? `missing tool ${missing.join(", ")}` : null;
    }),
    await step(
      "tools/call rechercher_nom",
      url,
      post,
      3,
      "tools/call",
      { name: "rechercher_nom", arguments: { nom: SEARCHED_NAME } },
      (result) => {
        const text: string = result.content?.[0]?.text ?? "";
        if (result.isError) return `tool error: ${text}`;
        return text.trim() ? null : "empty answer";
      }
    ),
  ];
}

export function formatReport(steps: CheckStep[]): string {
  return steps
    .map((entry) =>
      entry.ok ? `PASS ${entry.name}` : `FAIL ${entry.name}: ${entry.reason}`
    )
    .join("\n");
}

const fetchPost: JsonRpcPost = async (url, message) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(message),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep the raw text: a proxy error page is the reason worth showing.
  }
  return { status: response.status, body };
};

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run mcp:check -- <https://host/api/v2/mcp>");
    process.exit(2);
  }
  const steps = await runChecks(url, fetchPost);
  console.log(formatReport(steps));
  process.exit(steps.every((entry) => entry.ok) ? 0 : 1);
}

if (process.argv[1]?.endsWith("checkPublicAgentMcp.ts")) {
  void main();
}
