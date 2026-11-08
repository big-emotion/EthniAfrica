// @req REQ-002
import { describe, expect, it } from "vitest";

import {
  formatReport,
  runChecks,
  type JsonRpcPost,
} from "../dev/checkPublicAgentMcp";

const healthyServer: JsonRpcPost = async (_url, message) => {
  const { id, method } = message as { id: number; method: string };
  const results: Record<string, unknown> = {
    initialize: {
      protocolVersion: "2025-06-18",
      serverInfo: { name: "ethniafrica", version: "0.1.0" },
      capabilities: { tools: {} },
    },
    "tools/list": {
      tools: [{ name: "rechercher_nom" }, { name: "lire_fiche" }],
    },
    "tools/call": {
      content: [
        { type: "text", text: "Traoré (nom de famille)\n\nEn bref\n..." },
      ],
    },
  };
  return { status: 200, body: { jsonrpc: "2.0", id, result: results[method] } };
};

describe("mcp:check against a server", () => {
  // @req REQ-002
  it("passes the three steps of a healthy server, searching for Traoré", async () => {
    const seen: unknown[] = [];
    const steps = await runChecks(
      "http://host.example/api/v2/mcp",
      async (url, message) => {
        seen.push(message);
        return healthyServer(url, message);
      }
    );
    expect(steps.map((step) => [step.name, step.ok])).toEqual([
      ["initialize", true],
      ["tools/list", true],
      ["tools/call rechercher_nom", true],
    ]);
    expect(JSON.stringify(seen[2])).toContain("Traoré");
  });

  // @req REQ-002
  it("fails tools/list with the missing tool named", async () => {
    const steps = await runChecks(
      "http://host.example/api/v2/mcp",
      async (url, message) => {
        const answer = await healthyServer(url, message);
        if ((message as { method: string }).method === "tools/list") {
          return {
            ...answer,
            body: {
              jsonrpc: "2.0",
              id: 2,
              result: { tools: [{ name: "rechercher_nom" }] },
            },
          };
        }
        return answer;
      }
    );
    const list = steps.find((step) => step.name === "tools/list");
    expect(list?.ok).toBe(false);
    expect(list?.reason).toContain("lire_fiche");
  });

  // @req REQ-002
  it("reports an HTTP refusal as the reason, for example a spent rate limit", async () => {
    const steps = await runChecks(
      "http://host.example/api/v2/mcp",
      async () => ({
        status: 429,
        body: { error: "rate_limited" },
      })
    );
    expect(steps.every((step) => !step.ok)).toBe(true);
    expect(steps[0].reason).toContain("429");
  });

  // @req REQ-002
  it("reports an unreachable server instead of throwing", async () => {
    const steps = await runChecks(
      "http://host.example/api/v2/mcp",
      async () => {
        throw new Error("connect ECONNREFUSED");
      }
    );
    expect(steps[0].ok).toBe(false);
    expect(steps[0].reason).toContain("ECONNREFUSED");
  });

  // @req REQ-002
  it("fails the tool call when the server answers with a tool error", async () => {
    const steps = await runChecks(
      "http://host.example/api/v2/mcp",
      async (url, message) => {
        if ((message as { method: string }).method === "tools/call") {
          return {
            status: 200,
            body: {
              jsonrpc: "2.0",
              id: 3,
              result: {
                isError: true,
                content: [
                  { type: "text", text: "Nous ne pouvons pas lire nos fiches" },
                ],
              },
            },
          };
        }
        return healthyServer(url, message);
      }
    );
    const call = steps.find((step) => step.name.startsWith("tools/call"));
    expect(call?.ok).toBe(false);
    expect(call?.reason).toContain("Nous ne pouvons pas lire");
  });

  // @req REQ-002
  it("prints one PASS or FAIL line per step with the reason on failure", () => {
    const report = formatReport([
      { name: "initialize", ok: true },
      { name: "tools/list", ok: false, reason: "missing lire_fiche" },
    ]);
    expect(report).toBe("PASS initialize\nFAIL tools/list: missing lire_fiche");
  });
});
