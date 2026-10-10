import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  runPrePush,
  type CorpusHistory,
  type PrePushOptions,
} from "../prePushAiSources";
import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  readVerificationLedger,
  type AiSourceVerification,
} from "../../afrik/aiSourceVerifications";
import type { VerificationRequest } from "../../afrik/verifyAiGeneratedSources";

/**
 * Git and the CLI are the two things these tests never run. History is a map
 * of commit → files, so each case states the corpus on both sides of a push;
 * the working-tree ledger is a real file, because the hook appends to it.
 */

const ZERO = "0".repeat(40);
const DIOP = "dataset/source/afrik/patronymes/PAT_DIOP.json";
const QUEUE = "dataset/source/afrik/patronymes/_candidates-by-country.json";
const ficheAt = (id: string) => `dataset/source/afrik/patronymes/${id}.json`;

const AI_SOURCE = {
  title: "Relevé de couverture",
  url: null,
  tier: "unverified",
  source_kind: "ai_generated",
};
const BOOK_SOURCE = {
  title: "Les noms wolof",
  url: "https://example.org/wolof",
  tier: "referenced",
  source_kind: "academic",
};

function fiche(sources: unknown[], description = "Nom de clan wolof.") {
  return JSON.stringify({
    id: "PAT_DIOP",
    nameMain: "Diop",
    description,
    sources,
  });
}

function queue(names: string[]) {
  return JSON.stringify({
    countries: [
      {
        countryId: "SEN",
        entries: names.map((name) => ({
          countryId: "SEN",
          name,
          provenance: { tier: "unverified", source_kind: "ai_generated" },
        })),
      },
    ],
  });
}

type Files = Record<string, string>;

function fakeHistory(
  commits: Record<string, Files>,
  mergeBases: Record<string, string> = {}
) {
  const calls: string[] = [];
  const history: CorpusHistory = {
    hasCommit: (sha) => sha in commits,
    mergeBase: (sha, ref) => {
      calls.push(`merge-base ${sha} ${ref}`);
      return mergeBases[`${sha} ${ref}`] ?? null;
    },
    changedFiches: (from, to) => {
      calls.push(`diff ${from} ${to}`);
      const paths = new Set([
        ...Object.keys(commits[from]),
        ...Object.keys(commits[to]),
      ]);
      return [...paths].filter(
        (file) =>
          file.startsWith("dataset/source/afrik/") &&
          commits[to][file] !== undefined &&
          commits[from][file] !== commits[to][file]
      );
    },
    readFile: (sha, file) => commits[sha]?.[file] ?? null,
  };
  return { history, calls };
}

function committedLedger(verifications: Partial<AiSourceVerification>[]) {
  return JSON.stringify({ verifications });
}

function decided(
  status: AiSourceVerification["status"],
  overrides: Partial<AiSourceVerification> = {}
): Partial<AiSourceVerification> {
  return {
    id: "ASV-2026-10-08-0001",
    fiche: "patronymes/PAT_DIOP.json",
    path: "sources[1]",
    claim: "nameMain: Diop",
    original: { title: "Relevé de couverture", url: null },
    candidates: [],
    status,
    proposedAt: "2026-10-08",
    model: "opus (claude -p)",
    decidedBy: "reviewer-1",
    decidedAt: "2026-10-09",
    ...overrides,
  };
}

let workspace: string;
let ledgerPath: string;
let output: string[];
let asked: VerificationRequest[];

function options(
  history: CorpusHistory,
  stdin: string,
  overrides: Partial<PrePushOptions> = {}
): PrePushOptions {
  return {
    stdin,
    history,
    ledgerPath,
    claudeAvailable: () => true,
    proposeCandidates: async (request) => {
      asked.push(request);
      return [];
    },
    today: "2026-10-08",
    print: (line) => output.push(line),
    ...overrides,
  };
}

/** The line git writes on a pre-push hook's stdin for one ref. */
const push = (local: string, remote: string) =>
  `refs/heads/feat ${local} refs/heads/feat ${remote}\n`;

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "pre-push-ai-"));
  ledgerPath = path.join(workspace, "verifications.json");
  output = [];
  asked = [];
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe("runPrePush", () => {
  // @req REQ-161
  it("exits 0 without reading history when git sends no ref", async () => {
    const { history, calls } = fakeHistory({});

    expect(await runPrePush(options(history, ""))).toBe(0);
    expect(calls).toEqual([]);
    expect(output).toEqual([]);
  });

  // The common case: a push that adds no machine-written source costs one
  // diff and nothing else — no ledger read, no CLI.
  // @req REQ-161
  it("exits 0 silently when the push adds no ai_generated source", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([AI_SOURCE]) },
      new: { [DIOP]: fiche([AI_SOURCE], "Nom de clan wolof, Sénégal.") },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(0);
    expect(asked).toEqual([]);
    expect(output).toEqual([]);
  });

  // @req REQ-161
  it("searches each added source, ledgers the proposal and blocks the push", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([BOOK_SOURCE]) },
      new: {
        [DIOP]: fiche([BOOK_SOURCE, AI_SOURCE]),
        [QUEUE]: queue(["Ndiaye", "Fall"]),
      },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(1);

    expect(asked.map((request) => [request.fiche, request.path])).toEqual([
      ["patronymes/PAT_DIOP.json", "sources[1]"],
      [
        "patronymes/_candidates-by-country.json",
        "countries[0].entries[0].provenance",
      ],
      [
        "patronymes/_candidates-by-country.json",
        "countries[0].entries[1].provenance",
      ],
    ]);
    const ledger = readVerificationLedger(ledgerPath);
    expect(ledger.map((entry) => [entry.id, entry.status])).toEqual([
      ["ASV-2026-10-08-0001", "proposed"],
      ["ASV-2026-10-08-0002", "proposed"],
      ["ASV-2026-10-08-0003", "proposed"],
    ]);
    const printed = output.join("\n");
    expect(printed).toContain("ASV-2026-10-08-0001");
    expect(printed).toContain(AI_SOURCE_VERIFICATIONS_LEDGER);
    expect(printed).toContain("--no-verify");
  });

  // @req REQ-161
  it("compares a new branch with its merge-base on origin/recette", async () => {
    const { history, calls } = fakeHistory(
      {
        base: { [DIOP]: fiche([AI_SOURCE]) },
        new: { [DIOP]: fiche([AI_SOURCE]) },
      },
      { "new origin/recette": "base" }
    );

    expect(await runPrePush(options(history, push("new", ZERO)))).toBe(0);
    expect(calls).toEqual(["merge-base new origin/recette", "diff base new"]);
  });

  // @req REQ-161
  it("exits 0 for a branch deletion", async () => {
    const { history, calls } = fakeHistory({});

    expect(await runPrePush(options(history, push(ZERO, "old")))).toBe(0);
    expect(calls).toEqual([]);
  });

  // @req REQ-161
  it("blocks with install and by-hand instructions when claude is missing", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([]) },
      new: { [DIOP]: fiche([AI_SOURCE]) },
    });

    const code = await runPrePush(
      options(history, push("new", "old"), { claudeAvailable: () => false })
    );

    expect(code).toBe(1);
    expect(asked).toEqual([]);
    const printed = output.join("\n");
    expect(printed).toContain("claude");
    expect(printed).toContain("patronymes/PAT_DIOP.json sources[0]");
    expect(printed).toContain("oral_needed");
  });

  // @req REQ-161
  it("lets the push through once every added source is decided in the pushed ledger", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([BOOK_SOURCE]) },
      new: {
        [DIOP]: fiche([BOOK_SOURCE, AI_SOURCE]),
        [AI_SOURCE_VERIFICATIONS_LEDGER]: committedLedger([
          decided("oral_needed"),
        ]),
      },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(0);
    expect(asked).toEqual([]);
  });

  // @req REQ-161
  it("blocks an accepted source that was never applied to the fiche", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([BOOK_SOURCE]) },
      new: {
        [DIOP]: fiche([BOOK_SOURCE, AI_SOURCE]),
        [AI_SOURCE_VERIFICATIONS_LEDGER]: committedLedger([
          decided("accepted", {
            candidates: [
              {
                ...BOOK_SOURCE,
                author: null,
                year: null,
                quote: "q",
                supports: "s",
              } as never,
            ],
            chosen: 0,
            tier: "referenced",
          }),
        ]),
      },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(1);
    expect(asked).toEqual([]);
    expect(output.join("\n")).toContain(
      "applyAiSourceVerifications.ts --apply"
    );
  });

  // A second push before the ledger is committed must not search again: the
  // proposal already waits in the working tree for a decision.
  // @req REQ-161
  it("does not search again for a proposal already in the working-tree ledger", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([]) },
      new: { [DIOP]: fiche([AI_SOURCE]) },
    });
    await runPrePush(options(history, push("new", "old")));
    asked = [];

    const code = await runPrePush(
      options(history, push("new", "old"), { claudeAvailable: () => false })
    );

    expect(code).toBe(1);
    expect(asked).toEqual([]);
    expect(readVerificationLedger(ledgerPath)).toHaveLength(1);
  });

  // @req REQ-161
  it("blocks and reports a search that failed, keeping the ones that ran", async () => {
    const { history } = fakeHistory({
      old: {},
      new: {
        [ficheAt("PAT_DIOP")]: fiche([AI_SOURCE]),
        [ficheAt("PAT_FALL")]: fiche([AI_SOURCE]),
      },
    });
    let calls = 0;

    const code = await runPrePush(
      options(history, push("new", "old"), {
        proposeCandidates: async () => {
          calls += 1;
          if (calls === 2) throw new Error("claude timed out after 300s");
          return [];
        },
      })
    );

    expect(code).toBe(1);
    expect(readVerificationLedger(ledgerPath)).toHaveLength(1);
    expect(output.join("\n")).toContain("claude timed out after 300s");
  });

  // A bulk import must not hold a push for hours: each attempt searches a
  // bounded batch, and the push stays blocked until every source is decided.
  // @req REQ-161
  it("searches at most the per-push limit and says how many remain", async () => {
    const { history } = fakeHistory({
      old: {},
      new: {
        [ficheAt("PAT_DIOP")]: fiche([AI_SOURCE]),
        [ficheAt("PAT_FALL")]: fiche([AI_SOURCE]),
        [ficheAt("PAT_SALL")]: fiche([AI_SOURCE]),
      },
    });

    const code = await runPrePush(
      options(history, push("new", "old"), { searchLimit: 2 })
    );

    expect(code).toBe(1);
    expect(asked).toHaveLength(2);
    expect(output.join("\n")).toContain("1 more");
  });

  // An identity is fiche + title + url: a citation inserted above an existing
  // ai_generated source shifts its index, and that is not an addition.
  // @req REQ-161
  it("reports no addition when an insertion only shifts an existing source's index", async () => {
    const { history } = fakeHistory({
      old: { [DIOP]: fiche([AI_SOURCE]) },
      new: { [DIOP]: fiche([BOOK_SOURCE, AI_SOURCE]) },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(0);
    expect(asked).toEqual([]);
    expect(output).toEqual([]);
  });

  // @req REQ-161
  it("reports a new queue entry as exactly one addition", async () => {
    const { history } = fakeHistory({
      old: { [QUEUE]: queue(["Diop", "Fall"]) },
      new: { [QUEUE]: queue(["Diop", "Ndiaye", "Fall"]) },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(1);
    expect(asked.map((request) => request.owner)).toEqual([
      { countryId: "SEN", name: "Ndiaye" },
    ]);
  });

  // @req REQ-161
  it("reports no addition when the queue is only reordered", async () => {
    const { history } = fakeHistory({
      old: { [QUEUE]: queue(["Diop", "Fall", "Sall"]) },
      new: { [QUEUE]: queue(["Sall", "Diop", "Fall"]) },
    });

    expect(await runPrePush(options(history, push("new", "old")))).toBe(0);
    expect(asked).toEqual([]);
  });
});
