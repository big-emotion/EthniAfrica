import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createClaudeProposer,
  runVerification,
  type VerificationRequest,
} from "../verifyAiGeneratedSources";
import {
  readVerificationLedger,
  type SourceCandidate,
} from "../aiSourceVerifications";

/**
 * The web search is the one thing these tests never run: the proposer is
 * injected, so everything around it — which sources are picked, in which
 * order, what lands in the ledger — runs for real over a real directory.
 */

let workspace: string;
let datasetRoot: string;
let ledgerPath: string;

function writeFiche(relativePath: string, fiche: unknown): void {
  const file = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(fiche, null, 2), "utf8");
}

function aiFiche(id: string, nameMain: string) {
  return {
    id,
    nameMain,
    sources: [
      {
        title: "Relevé de couverture",
        url: null,
        tier: "unverified",
        source_kind: "ai_generated",
      },
    ],
  };
}

const CANDIDATE: SourceCandidate = {
  title: "Les noms de famille wolof",
  author: "A. Diallo",
  year: 1998,
  url: "https://example.org/wolof",
  source_kind: "academic",
  quote: "Diop est un nom de clan wolof.",
  supports: "Diop is a Wolof clan name",
};

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-verify-"));
  datasetRoot = path.join(workspace, "afrik");
  ledgerPath = path.join(workspace, "verifications.json");
  writeFiche("patronymes/PAT_DIOP.json", aiFiche("PAT_DIOP", "Diop"));
  writeFiche("patronymes/PAT_FALL.json", aiFiche("PAT_FALL", "Fall"));
  writeFiche("patronymes/PAT_SALL.json", aiFiche("PAT_SALL", "Sall"));
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe("runVerification", () => {
  // @req REQ-161
  it("proposes candidates for the first N sources in corpus order and appends them as proposals", async () => {
    const asked: VerificationRequest[] = [];

    await runVerification({
      datasetRoot,
      ledgerPath,
      limit: 2,
      today: "2026-10-08",
      model: "claude-opus-5-5",
      proposeCandidates: async (request) => {
        asked.push(request);
        return [CANDIDATE];
      },
    });

    expect(asked.map((request) => request.fiche)).toEqual([
      "patronymes/PAT_DIOP.json",
      "patronymes/PAT_FALL.json",
    ]);
    expect(asked[0].claim).toContain("nameMain: Diop");
    expect(readVerificationLedger(ledgerPath)).toEqual([
      {
        id: "ASV-2026-10-08-0001",
        fiche: "patronymes/PAT_DIOP.json",
        path: "sources[0]",
        claim: asked[0].claim,
        original: { title: "Relevé de couverture", url: null },
        candidates: [CANDIDATE],
        status: "proposed",
        proposedAt: "2026-10-08",
        model: "claude-opus-5-5",
      },
      expect.objectContaining({
        id: "ASV-2026-10-08-0002",
        fiche: "patronymes/PAT_FALL.json",
      }),
    ]);
  });

  // @req REQ-161
  it("skips sources the ledger already holds and numbers on from the last id", async () => {
    await runVerification({
      datasetRoot,
      ledgerPath,
      limit: 2,
      today: "2026-10-08",
      model: "claude-opus-5-5",
      proposeCandidates: async () => [],
    });

    const asked: string[] = [];
    await runVerification({
      datasetRoot,
      ledgerPath,
      limit: 5,
      today: "2026-10-15",
      model: "claude-opus-5-5",
      proposeCandidates: async (request) => {
        asked.push(request.fiche);
        return [];
      },
    });

    expect(asked).toEqual(["patronymes/PAT_SALL.json"]);
    expect(readVerificationLedger(ledgerPath).map((entry) => entry.id)).toEqual(
      ["ASV-2026-10-08-0001", "ASV-2026-10-08-0002", "ASV-2026-10-15-0003"]
    );
  });

  // "Nothing found" is a proposal too: it puts the source in front of a human,
  // who keeps it as a synthesis or records an oral account. It never deletes.
  // @req REQ-161
  it("records a proposal with no candidate when the search finds nothing", async () => {
    await runVerification({
      datasetRoot,
      ledgerPath,
      limit: 1,
      today: "2026-10-08",
      model: "claude-opus-5-5",
      proposeCandidates: async () => [],
    });

    const [entry] = readVerificationLedger(ledgerPath);
    expect(entry.status).toBe("proposed");
    expect(entry.candidates).toEqual([]);
  });

  // @req REQ-161
  it("drops a candidate with no url or an ai_generated kind rather than ledger it", async () => {
    await runVerification({
      datasetRoot,
      ledgerPath,
      limit: 1,
      today: "2026-10-08",
      model: "claude-opus-5-5",
      proposeCandidates: async () => [
        { ...CANDIDATE, url: "" },
        { ...CANDIDATE, source_kind: "ai_generated" as never },
        CANDIDATE,
      ],
    });

    expect(readVerificationLedger(ledgerPath)[0].candidates).toEqual([
      CANDIDATE,
    ]);
  });

  // @req REQ-161
  it("keeps the proposals gathered before the search failed", async () => {
    let calls = 0;
    await expect(
      runVerification({
        datasetRoot,
        ledgerPath,
        limit: 3,
        today: "2026-10-08",
        model: "claude-opus-5-5",
        proposeCandidates: async () => {
          calls += 1;
          if (calls === 2) throw new Error("rate limited");
          return [CANDIDATE];
        },
      })
    ).rejects.toThrow("rate limited");

    expect(readVerificationLedger(ledgerPath)).toHaveLength(1);
  });
});

/** A stand-in for the Messages API, replaying canned responses in order. */
function scriptedClient(responses: Partial<Anthropic.Message>[]) {
  const requests: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const client = {
    messages: {
      create: async (params: Anthropic.MessageCreateParamsNonStreaming) => {
        requests.push(structuredClone(params));
        return responses.shift();
      },
    },
  } as unknown as Anthropic;
  return { client, requests };
}

const REQUEST: VerificationRequest = {
  fiche: "patronymes/PAT_DIOP.json",
  path: "sources[0]",
  claim: "nameMain: Diop",
  original: { title: "Relevé de couverture", url: null },
};

function report(candidates: SourceCandidate[]): Anthropic.ContentBlock {
  return {
    type: "tool_use",
    id: "toolu_1",
    name: "report_candidates",
    input: { candidates },
  } as Anthropic.ContentBlock;
}

describe("createClaudeProposer", () => {
  // @req REQ-161
  it("resumes a paused turn and returns the reported candidates", async () => {
    const paused: Anthropic.ContentBlock[] = [
      { type: "text", text: "Searching." } as Anthropic.ContentBlock,
    ];
    const { client, requests } = scriptedClient([
      { stop_reason: "pause_turn", content: paused },
      { stop_reason: "tool_use", content: [report([CANDIDATE])] },
    ]);

    const candidates = await createClaudeProposer(client)(REQUEST);

    expect(candidates).toEqual([CANDIDATE]);
    expect(requests).toHaveLength(2);
    expect(requests[1].messages.at(-1)).toEqual({
      role: "assistant",
      content: paused,
    });
  });

  // @req REQ-161
  it("returns no candidate when the model refuses", async () => {
    const { client } = scriptedClient([
      { stop_reason: "refusal", content: [], stop_details: null },
    ]);

    expect(await createClaudeProposer(client)(REQUEST)).toEqual([]);
  });

  // @req REQ-161
  it("asks the web, on Opus 5.5, without forcing the report tool", async () => {
    const { client, requests } = scriptedClient([
      { stop_reason: "tool_use", content: [report([])] },
    ]);

    await createClaudeProposer(client)(REQUEST);

    const [request] = requests;
    expect(request.model).toBe("claude-opus-5-5");
    expect(request.tool_choice).toBeUndefined();
    expect(request.tools).toEqual(
      expect.arrayContaining([
        { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        expect.objectContaining({ name: "report_candidates", strict: true }),
      ])
    );
  });
});
