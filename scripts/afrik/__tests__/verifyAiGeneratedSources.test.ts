import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createClaudeCliProposer,
  runVerification,
  type ClaudeRun,
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
  it("proposes once for sources of one fiche sharing a title and url", async () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      ...aiFiche("PAT_DIOP", "Diop"),
      sources: [aiFiche("", "").sources[0], aiFiche("", "").sources[0]],
    });
    const asked: string[] = [];

    await runVerification({
      datasetRoot,
      ledgerPath,
      limit: 2,
      today: "2026-10-08",
      model: "opus (claude -p)",
      proposeCandidates: async (request) => {
        asked.push(`${request.fiche} ${request.path}`);
        return [];
      },
    });

    expect(asked).toEqual([
      "patronymes/PAT_DIOP.json sources[0]",
      "patronymes/PAT_FALL.json sources[0]",
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

const REQUEST: VerificationRequest = {
  fiche: "patronymes/PAT_DIOP.json",
  path: "sources[0]",
  claim: "nameMain: Diop",
  original: { title: "Relevé de couverture", url: null },
};

/**
 * The shape `claude -p --output-format json` prints: one result envelope, the
 * schema-checked answer under `structured_output`, the raw text under `result`.
 */
function envelope(fields: Record<string, unknown>): string {
  return JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    ...fields,
  });
}

/** A stand-in for spawning the CLI, recording what it was given. */
function fakeClaude(outcome: Partial<ReturnType<ClaudeRun>>) {
  const calls: { args: string[]; input: string }[] = [];
  const run: ClaudeRun = (args, input) => {
    calls.push({ args, input });
    return { status: 0, stdout: "", stderr: "", error: undefined, ...outcome };
  };
  return { run, calls };
}

describe("createClaudeCliProposer", () => {
  // @req REQ-161
  it("returns the candidates of a schema-checked answer", async () => {
    const { run } = fakeClaude({
      stdout: envelope({ structured_output: { candidates: [CANDIDATE] } }),
    });

    expect(await createClaudeCliProposer(run)(REQUEST)).toEqual([CANDIDATE]);
  });

  // @req REQ-161
  it("falls back to the answer text when no structured output came back", async () => {
    const { run } = fakeClaude({
      stdout: envelope({
        result: "```json\n" + JSON.stringify([CANDIDATE]) + "\n```",
      }),
    });

    expect(await createClaudeCliProposer(run)(REQUEST)).toEqual([CANDIDATE]);
  });

  // @req REQ-161
  it("reads a malformed or off-schema answer as no candidate", async () => {
    const malformed = fakeClaude({
      stdout: envelope({ result: "I found nothing definitive {" }),
    });
    const offSchema = fakeClaude({
      stdout: envelope({
        structured_output: { candidates: [{ title: "No url, no quote" }] },
      }),
    });

    expect(await createClaudeCliProposer(malformed.run)(REQUEST)).toEqual([]);
    expect(await createClaudeCliProposer(offSchema.run)(REQUEST)).toEqual([]);
  });

  // A failed run is not an answer: ledgering it as "nothing found" would show
  // a reviewer an empty search that never happened, and the backlog would
  // never retry that source.
  // @req REQ-161
  it("throws when the CLI fails, reports an error or prints no envelope", async () => {
    const failed = fakeClaude({ status: 1, stderr: "Not logged in" });
    const reported = fakeClaude({
      stdout: envelope({ is_error: true, subtype: "error_during_execution" }),
    });
    const garbled = fakeClaude({ stdout: "Usage: claude [options]" });

    await expect(createClaudeCliProposer(failed.run)(REQUEST)).rejects.toThrow(
      "Not logged in"
    );
    await expect(
      createClaudeCliProposer(reported.run)(REQUEST)
    ).rejects.toThrow("error_during_execution");
    await expect(createClaudeCliProposer(garbled.run)(REQUEST)).rejects.toThrow(
      "no JSON result"
    );
  });

  // @req REQ-161
  it("throws on a timeout rather than wait on the push forever", async () => {
    const timeout = Object.assign(new Error("spawnSync claude ETIMEDOUT"), {
      code: "ETIMEDOUT",
    });
    const { run } = fakeClaude({ status: null, error: timeout });

    await expect(createClaudeCliProposer(run)(REQUEST)).rejects.toThrow(
      "timed out"
    );
  });

  // The claim is corpus text: it travels on stdin, never through argv or a
  // shell, and the run gets the web tools and nothing that writes or executes.
  // @req REQ-161
  it("sends the claim on stdin and allows only the web tools", async () => {
    const { run, calls } = fakeClaude({
      stdout: envelope({ structured_output: { candidates: [] } }),
    });

    await createClaudeCliProposer(run)(REQUEST);

    const [{ args, input }] = calls;
    expect(input).toContain("nameMain: Diop");
    expect(args.join(" ")).not.toContain("nameMain: Diop");
    expect(args).toEqual(expect.arrayContaining(["-p", "--json-schema"]));
    expect(args[args.indexOf("--tools") + 1]).toBe("WebSearch,WebFetch");
    expect(args[args.indexOf("--allowedTools") + 1]).toBe("WebSearch,WebFetch");
  });
});
