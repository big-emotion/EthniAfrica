import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AI_GENERATED_RATCHET,
  checkAiGeneratedSources,
  checkAiSourceVerifications,
} from "../checkAiGeneratedSources";
import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  type AiSourceVerification,
} from "../../afrik/aiSourceVerifications";

let workspace: string;
let datasetRoot: string;
let ledgerPath: string;

function writeFiche(relativePath: string, fiche: unknown): void {
  const filePath = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(fiche, null, 2), "utf8");
}

function writeLedger(verifications: unknown[]): void {
  fs.writeFileSync(ledgerPath, JSON.stringify({ verifications }), "utf8");
}

const AI_SOURCE = {
  sourceKey: "afrik-candidate-queue",
  title: "Relevé de couverture",
  url: null,
  tier: "unverified",
  source_kind: "ai_generated",
};

const CANDIDATE = {
  title: "Dictionnaire des noms de famille du Sénégal",
  author: "A. Diallo",
  year: 1998,
  url: "https://example.org/noms",
  source_kind: "academic",
  quote: "Diop est un patronyme wolof.",
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
    candidates: [CANDIDATE],
    status: "proposed",
    proposedAt: "2026-10-08",
    model: "claude-opus-5-5",
    ...overrides,
  } as AiSourceVerification;
}

const ACCEPTED = {
  status: "accepted" as const,
  chosen: 0,
  tier: "referenced" as const,
  decidedBy: "moderator-1",
  decidedAt: "2026-10-09",
};

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "ai-sources-"));
  datasetRoot = path.join(workspace, "afrik");
  ledgerPath = path.join(workspace, "verifications.json");
  fs.mkdirSync(datasetRoot, { recursive: true });
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe("checkAiGeneratedSources", () => {
  // @req REQ-161
  it("counts ai_generated sources at any depth, provenance markers included, and nothing else", () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      id: "PAT_DIOP",
      sources: [AI_SOURCE, { ...AI_SOURCE, source_kind: "academic" }],
    });
    writeFiche("patronymes/_candidates.json", {
      countries: [
        {
          entries: [
            {
              name: "Fall",
              provenance: { tier: "unverified", source_kind: "ai_generated" },
            },
          ],
        },
      ],
    });

    const result = checkAiGeneratedSources(datasetRoot, 2);

    expect(result.ok).toBe(true);
    expect(result.sources.map((source) => source.path).sort()).toEqual([
      "countries[0].entries[0].provenance",
      "sources[0]",
    ]);
  });

  // @req REQ-161
  it("fails when a new ai_generated source enters the corpus", () => {
    writeFiche("patronymes/PAT_DIOP.json", { sources: [AI_SOURCE] });

    const result = checkAiGeneratedSources(datasetRoot, 0);

    expect(result.ok).toBe(false);
    expect(result.error).toContain(
      "a new ai_generated source entered the corpus"
    );
    expect(result.error).toContain("verification ledger");
  });

  // @req REQ-161
  it("fails when the count drops below the ratchet, naming the line to lower", () => {
    writeFiche("patronymes/PAT_DIOP.json", { sources: [AI_SOURCE] });

    const result = checkAiGeneratedSources(datasetRoot, 3);

    expect(result.ok).toBe(false);
    expect(result.error).toContain(
      "lower AI_GENERATED_RATCHET to 1 in scripts/ci/checkAiGeneratedSources.ts"
    );
  });

  // @req REQ-161
  it("holds the live corpus exactly at the committed ratchet", () => {
    const live = checkAiGeneratedSources(
      "dataset/source/afrik",
      AI_GENERATED_RATCHET
    );

    expect(live.count).toBe(AI_GENERATED_RATCHET);
  });
});

describe("checkAiSourceVerifications", () => {
  beforeEach(() => {
    writeFiche("patronymes/PAT_DIOP.json", {
      id: "PAT_DIOP",
      nameMain: "Diop",
      sources: [AI_SOURCE],
    });
  });

  // @req REQ-161
  it("holds a ledger of proposals, rejections and oral-account requests", () => {
    writeLedger([
      verification(),
      verification({
        id: "ASV-2026-10-08-0002",
        path: "sources[1]",
        candidates: [],
        status: "oral_needed",
        decidedBy: "moderator-1",
        decidedAt: "2026-10-09",
      }),
      verification({
        id: "ASV-2026-10-08-0003",
        path: "sources[2]",
        status: "rejected",
        decidedBy: "moderator-1",
        decidedAt: "2026-10-09",
      }),
    ]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath)).toEqual({
      ok: true,
      errors: [],
    });
  });

  // @req REQ-161
  it("fails an accepted verification the corpus does not carry yet, naming the command that applies it", () => {
    writeLedger([verification(ACCEPTED)]);

    const result = checkAiSourceVerifications(datasetRoot, ledgerPath);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "ASV-2026-10-08-0001: patronymes/PAT_DIOP.json still carries the ai_generated source at sources[0] — run npx tsx scripts/afrik/applyAiSourceVerifications.ts --apply",
    ]);
  });

  // @req REQ-161
  it("holds an accepted verification once the fiche cites the chosen candidate at the chosen tier", () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      sources: [
        {
          title: CANDIDATE.title,
          url: CANDIDATE.url,
          tier: "referenced",
          source_kind: "academic",
        },
      ],
    });
    writeLedger([verification(ACCEPTED)]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual(
      []
    );
  });

  // @req REQ-161
  it("fails an accepted verification the fiche contradicts", () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      sources: [{ title: "Autre", url: null, tier: "referenced" }],
    });
    writeLedger([verification(ACCEPTED)]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      `ASV-2026-10-08-0001: patronymes/PAT_DIOP.json sources[0] does not cite the accepted candidate "${CANDIDATE.title}"`,
    ]);
  });

  // A human decides; tooling only proposes. An accepted entry without a
  // decider, a tier or a chosen candidate is a machine decision in disguise.
  // @req REQ-161
  it("fails an accepted verification with no human decision behind it", () => {
    writeLedger([
      verification({
        status: "accepted",
        chosen: 3,
        tier: "needs_review" as never,
      }),
    ]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      "ASV-2026-10-08-0001: chosen must index one of the 1 candidate(s)",
      'ASV-2026-10-08-0001: an accepted verification needs a tier (official, referenced or unverified), not "needs_review"',
      "ASV-2026-10-08-0001: decidedBy is empty",
      'ASV-2026-10-08-0001: decidedAt "undefined" is not an ISO date',
    ]);
  });

  // @req REQ-161
  it("fails a candidate that is itself ai_generated or has no url, and duplicate ids or sources", () => {
    writeLedger([
      verification({
        candidates: [{ ...CANDIDATE, source_kind: "ai_generated", url: "" }],
      }),
      verification({ status: "proposed" }),
    ]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      'ASV-2026-10-08-0001: candidate 0 has source_kind "ai_generated" — a candidate is a bibliographic work',
      "ASV-2026-10-08-0001: candidate 0 has no http(s) url",
      "ASV-2026-10-08-0001: duplicate id",
      "ASV-2026-10-08-0001: patronymes/PAT_DIOP.json sources[0] is already verified by ASV-2026-10-08-0001 — one verification per source",
    ]);
  });

  // @req REQ-161
  it("fails a verification that names no fiche of the corpus", () => {
    writeLedger([verification({ fiche: "patronymes/PAT_GONE.json" })]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      "ASV-2026-10-08-0001: names patronymes/PAT_GONE.json, which is not a fiche",
    ]);
  });

  // @req REQ-161
  it("holds the live corpus to the committed ledger", () => {
    expect(
      checkAiSourceVerifications(
        "dataset/source/afrik",
        AI_SOURCE_VERIFICATIONS_LEDGER
      ).errors
    ).toEqual([]);
  });
});
