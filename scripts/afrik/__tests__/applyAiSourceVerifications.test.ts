import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as prettier from "prettier";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runAiSourceVerifications } from "../applyAiSourceVerifications";
import type { AiSourceVerification } from "../aiSourceVerifications";

/**
 * A human's acceptance reaches readers only once it is in the fiche, so these
 * drive the real script over a real directory of fiches.
 */

let workspace: string;
let datasetRoot: string;
let ledgerPath: string;

async function writeFiche(
  relativePath: string,
  fiche: unknown,
  tabWidth = 2
): Promise<string> {
  const file = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const text = await prettier.format(JSON.stringify(fiche, null, tabWidth), {
    parser: "json",
    tabWidth,
  });
  fs.writeFileSync(file, text, "utf8");
  return text;
}

function readFiche(relativePath: string): string {
  return fs.readFileSync(path.join(datasetRoot, relativePath), "utf8");
}

function writeLedger(verifications: AiSourceVerification[]): void {
  fs.writeFileSync(ledgerPath, JSON.stringify({ verifications }), "utf8");
}

const AI_SOURCE = {
  sourceKey: "afrik-candidate-queue",
  title: "Relevé de couverture",
  url: null,
  tier: "unverified",
  source_kind: "ai_generated",
  notes: "Ce nom figure à notre relevé de couverture.",
};

function diop() {
  return {
    id: "PAT_DIOP",
    nameMain: "Diop",
    spellings: [{ spelling: "Diop", sourceRefs: ["afrik-candidate-queue"] }],
    sources: [AI_SOURCE],
  };
}

const CANDIDATE = {
  title: "Les noms de famille wolof",
  author: "A. Diallo",
  year: 1998,
  url: "https://example.org/wolof",
  source_kind: "academic" as const,
  quote: "Diop est un nom de clan wolof.",
  supports: "Diop is a Wolof clan name",
};

function verification(
  overrides: Partial<AiSourceVerification> = {}
): AiSourceVerification {
  return {
    id: "ASV-2026-10-08-0001",
    fiche: "patronymes/PAT_DIOP.json",
    path: "sources[0]",
    claim: "nameMain: Diop",
    original: { title: "Relevé de couverture", url: null },
    candidates: [{ ...CANDIDATE, author: null, year: null }, CANDIDATE],
    status: "accepted",
    chosen: 1,
    tier: "referenced",
    decidedBy: "moderator-1",
    decidedAt: "2026-10-09",
    proposedAt: "2026-10-08",
    model: "claude-opus-5-5",
    ...overrides,
  };
}

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-apply-"));
  datasetRoot = path.join(workspace, "afrik");
  ledgerPath = path.join(workspace, "verifications.json");
  fs.mkdirSync(datasetRoot, { recursive: true });
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe("runAiSourceVerifications", () => {
  // The sourceKey stays: the fiche's attestations point at it by name.
  // No note is written: notes are published verbatim, and a ledger id is
  // workshop vocabulary (docs/editorial/reader-facing-register.md).
  // @req REQ-161
  it("replaces the ai_generated source with the chosen candidate at the human's tier", async () => {
    await writeFiche("patronymes/PAT_DIOP.json", diop());
    writeLedger([verification()]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
      ratchet: 1,
    });

    expect(report.errors).toEqual([]);
    expect(report.changedFiches).toEqual(["patronymes/PAT_DIOP.json"]);
    expect(JSON.parse(readFiche("patronymes/PAT_DIOP.json"))).toEqual({
      ...diop(),
      sources: [
        {
          sourceKey: "afrik-candidate-queue",
          title: "Les noms de famille wolof",
          author: "A. Diallo",
          year: 1998,
          url: "https://example.org/wolof",
          tier: "referenced",
          source_kind: "academic",
        },
      ],
    });
  });

  // @req REQ-161
  it("keeps the fiche's own indentation and its inline arrays", async () => {
    const before = await writeFiche("patronymes/PAT_DIOP.json", diop(), 4);
    writeLedger([verification()]);

    await runAiSourceVerifications({ datasetRoot, ledgerPath, write: true });

    const after = readFiche("patronymes/PAT_DIOP.json");
    expect(after).toContain('\n    "sources": [\n        {\n');
    expect(after).toContain('"sourceRefs": ["afrik-candidate-queue"]');
    expect(after.split("\n").slice(0, 4)).toEqual(
      before.split("\n").slice(0, 4)
    );
  });

  // Doctrine: no source is dropped for not being written or online. Only an
  // accepted candidate changes the corpus.
  // @req REQ-161
  it("changes nothing for proposed, rejected and oral_needed verifications", async () => {
    const before = await writeFiche("patronymes/PAT_DIOP.json", diop());
    const decided = { decidedBy: "moderator-1", decidedAt: "2026-10-09" };
    writeLedger([
      verification({
        status: "proposed",
        chosen: undefined,
        tier: undefined,
        decidedBy: undefined,
        decidedAt: undefined,
      }),
      verification({
        id: "ASV-2026-10-08-0002",
        path: "sources[1]",
        original: { title: "Relevé B", url: null },
        status: "rejected",
        chosen: undefined,
        tier: undefined,
        ...decided,
      }),
      verification({
        id: "ASV-2026-10-08-0003",
        path: "sources[2]",
        original: { title: "Relevé C", url: null },
        status: "oral_needed",
        chosen: undefined,
        tier: undefined,
        ...decided,
      }),
    ]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
    });

    expect(report.errors).toEqual([]);
    expect(report.changedFiches).toEqual([]);
    expect(readFiche("patronymes/PAT_DIOP.json")).toBe(before);
  });

  // @req REQ-161
  it("writes nothing on a dry run, and reports the ratchet line to lower", async () => {
    const before = await writeFiche("patronymes/PAT_DIOP.json", diop());
    writeLedger([verification()]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: false,
      ratchet: 1,
    });

    expect(report.changedFiches).toEqual(["patronymes/PAT_DIOP.json"]);
    expect(report.aiGeneratedBefore).toBe(1);
    expect(report.aiGeneratedAfter).toBe(0);
    expect(report.ratchetLine).toBe(
      "lower UNREVIEWED_AI_GENERATED_RATCHET to 0 in scripts/ci/checkAiGeneratedSources.ts"
    );
    expect(readFiche("patronymes/PAT_DIOP.json")).toBe(before);
  });

  // @req REQ-161
  it("is idempotent: an applied verification is not applied twice", async () => {
    await writeFiche("patronymes/PAT_DIOP.json", diop());
    writeLedger([verification()]);
    await runAiSourceVerifications({ datasetRoot, ledgerPath, write: true });
    const applied = readFiche("patronymes/PAT_DIOP.json");

    const second = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
    });

    expect(second.changedFiches).toEqual([]);
    expect(readFiche("patronymes/PAT_DIOP.json")).toBe(applied);
  });

  // @req REQ-161
  it("refuses to patch a fiche that would not round-trip through the formatter", async () => {
    const file = path.join(datasetRoot, "patronymes/PAT_DIOP.json");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const handFormatted = `{ "id": "PAT_DIOP", "sources": [ { "title": "Relevé de couverture", "url": null, "tier": "unverified", "source_kind": "ai_generated" } ] }\n`;
    fs.writeFileSync(file, handFormatted, "utf8");
    writeLedger([verification()]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
    });

    expect(report.unformattable).toEqual(["patronymes/PAT_DIOP.json"]);
    expect(readFiche("patronymes/PAT_DIOP.json")).toBe(handFormatted);
  });

  // @req REQ-161
  it("writes nothing when the ledger itself is invalid", async () => {
    const before = await writeFiche("patronymes/PAT_DIOP.json", diop());
    writeLedger([verification({ decidedBy: " " })]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
    });

    expect(report.errors).toEqual(["ASV-2026-10-08-0001: decidedBy is empty"]);
    expect(readFiche("patronymes/PAT_DIOP.json")).toBe(before);
  });

  // The path in the ledger is where the source was at proposal time. A fiche
  // edited since may have moved it; the identity still finds it.
  // @req REQ-161
  it("re-locates the accepted source by identity after an insertion shifted it", async () => {
    const book = {
      title: "Autre ouvrage",
      url: "https://example.org/autre",
      tier: "referenced",
      source_kind: "academic",
    };
    await writeFiche("patronymes/PAT_DIOP.json", {
      ...diop(),
      sources: [book, AI_SOURCE],
    });
    writeLedger([verification()]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
      ratchet: 0,
    });

    expect(report.errors).toEqual([]);
    const sources = JSON.parse(readFiche("patronymes/PAT_DIOP.json")).sources;
    expect(sources[0]).toEqual(book);
    expect(sources[1]).toMatchObject({
      title: CANDIDATE.title,
      tier: "referenced",
    });
  });

  // @req REQ-161
  it("replaces every source sharing the accepted identity in the fiche", async () => {
    await writeFiche("patronymes/PAT_DIOP.json", {
      ...diop(),
      sources: [AI_SOURCE, { ...AI_SOURCE, sourceKey: "second" }],
    });
    writeLedger([verification()]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
      ratchet: 0,
    });

    expect(report.aiGeneratedAfter).toBe(0);
    const sources = JSON.parse(readFiche("patronymes/PAT_DIOP.json")).sources;
    expect(
      sources.map((source: { sourceKey: string }) => source.sourceKey)
    ).toEqual(["afrik-candidate-queue", "second"]);
    expect(
      sources.every(
        (source: { title: string }) => source.title === CANDIDATE.title
      )
    ).toBe(true);
  });

  // @req REQ-161
  it("fails loudly and writes nothing when the accepted identity is gone from the fiche", async () => {
    const other = await writeFiche("patronymes/PAT_FALL.json", {
      ...diop(),
      id: "PAT_FALL",
    });
    const diopText = await writeFiche("patronymes/PAT_DIOP.json", {
      ...diop(),
      sources: [{ ...AI_SOURCE, title: "Relevé renommé" }],
    });
    writeLedger([
      verification(),
      verification({
        id: "ASV-2026-10-08-0002",
        fiche: "patronymes/PAT_FALL.json",
      }),
    ]);

    const report = await runAiSourceVerifications({
      datasetRoot,
      ledgerPath,
      write: true,
      ratchet: 0,
    });

    expect(report.errors).toEqual([
      'ASV-2026-10-08-0001: patronymes/PAT_DIOP.json carries neither the ai_generated source "Relevé de couverture" nor the accepted candidate — correct the ledger entry by hand',
    ]);
    expect(readFiche("patronymes/PAT_DIOP.json")).toBe(diopText);
    expect(readFiche("patronymes/PAT_FALL.json")).toBe(other);
  });
});
