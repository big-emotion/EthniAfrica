import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  UNREVIEWED_AI_GENERATED_RATCHET,
  checkAiGeneratedSources,
  checkAiSourceVerifications,
} from "../checkAiGeneratedSources";
import {
  AI_SOURCE_VERIFICATIONS_LEDGER,
  readVerificationLedger,
  sourceIdentity,
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
      "lower UNREVIEWED_AI_GENERATED_RATCHET to 1 in scripts/ci/checkAiGeneratedSources.ts"
    );
  });

  // The guarantee is that no machine-written source enters without a person
  // looking at it, not that none exists: a source a reviewer kept as a
  // synthesis, or flagged for an oral account, is reviewed and leaves the
  // count. A proposal is still waiting for a person, so it stays.
  // @req REQ-161
  it("counts only the sources no rejected or oral_needed decision covers", () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      sources: [
        AI_SOURCE,
        { ...AI_SOURCE, title: "Relevé B" },
        { ...AI_SOURCE, title: "Relevé C" },
      ],
    });
    const decidedBy = { decidedBy: "moderator-1", decidedAt: "2026-10-09" };

    const result = checkAiGeneratedSources(datasetRoot, 1, [
      verification({ status: "rejected", ...decidedBy }),
      verification({
        id: "ASV-2026-10-08-0002",
        path: "sources[1]",
        original: { title: "  Relevé B ", url: null },
        status: "oral_needed",
        ...decidedBy,
      }),
      verification({
        id: "ASV-2026-10-08-0003",
        path: "sources[2]",
        original: { title: "Relevé C", url: null },
      }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.sources.map((source) => source.path)).toEqual(["sources[2]"]);
  });

  // @req REQ-161
  it("counts every object of a reviewed identity out, however many share it", () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      sources: [AI_SOURCE, { ...AI_SOURCE, sourceKey: "other" }],
    });

    const result = checkAiGeneratedSources(datasetRoot, 0, [
      verification({
        status: "rejected",
        decidedBy: "moderator-1",
        decidedAt: "2026-10-09",
      }),
    ]);

    expect(result.count).toBe(0);
  });

  // A provenance marker carries no title or url; the queue entry owning it
  // (country + name) is what tells one marker from the next.
  // @req REQ-161
  it("tells untitled provenance markers apart by their entry's country and name", () => {
    writeFiche("patronymes/_queue.json", {
      countries: [
        {
          entries: ["Diop", "Fall", "Sall"].map((name) => ({
            countryId: "SEN",
            name,
            provenance: { tier: "unverified", source_kind: "ai_generated" },
          })),
        },
      ],
    });

    const result = checkAiGeneratedSources(datasetRoot, 2, [
      verification({
        fiche: "patronymes/_queue.json",
        path: "countries[0].entries[1].provenance",
        original: { title: null, url: null },
        owner: { countryId: "SEN", name: "Fall" },
        status: "rejected",
        decidedBy: "moderator-1",
        decidedAt: "2026-10-09",
      }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.sources.map((source) => source.owner?.name)).toEqual([
      "Diop",
      "Sall",
    ]);
  });

  // @req REQ-161
  it("adds nameSystem when country and name collide, and fails loudly when that collides too", () => {
    const entry = (nameSystem: string) => ({
      countryId: "SEN",
      name: "Diop",
      nameSystem,
      provenance: { tier: "unverified", source_kind: "ai_generated" },
    });
    writeFiche("patronymes/_queue.json", {
      entries: [entry("clan_name"), entry("patronym")],
    });

    expect(
      checkAiGeneratedSources(datasetRoot, 2).sources.map(
        (source) => source.owner
      )
    ).toEqual([
      { countryId: "SEN", name: "Diop", nameSystem: "clan_name" },
      { countryId: "SEN", name: "Diop", nameSystem: "patronym" },
    ]);

    writeFiche("patronymes/_queue.json", {
      entries: [entry("clan_name"), entry("clan_name")],
    });
    expect(() => checkAiGeneratedSources(datasetRoot, 2)).toThrow(
      "patronymes/_queue.json: two ai_generated markers share"
    );
  });

  // @req REQ-161
  // Counts shrink with every reviewed batch, so the invariant is pinned, not
  // the 849 markers / 1343 sources measured on 2026-10-08.
  it("counts every live queue marker as a source of its own", () => {
    const live = checkAiGeneratedSources("dataset/source/afrik", 0);
    const identities = new Set(live.sources.map(sourceIdentity));
    const queueMarkers = live.sources.filter(
      (source) => source.fiche === "patronymes/_candidates-by-country.json"
    );

    expect(queueMarkers.length).toBeGreaterThan(0);
    expect(new Set(queueMarkers.map(sourceIdentity)).size).toBe(
      queueMarkers.length
    );
    expect(identities.size).toBe(live.sources.length);
  });

  // @req REQ-161
  it("holds the live corpus exactly at the committed ratchet", () => {
    const live = checkAiGeneratedSources(
      "dataset/source/afrik",
      UNREVIEWED_AI_GENERATED_RATCHET,
      readVerificationLedger(AI_SOURCE_VERIFICATIONS_LEDGER)
    );

    expect(live.count).toBe(UNREVIEWED_AI_GENERATED_RATCHET);
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
    writeFiche("patronymes/PAT_DIOP.json", {
      sources: [
        AI_SOURCE,
        { ...AI_SOURCE, title: "Relevé B" },
        { ...AI_SOURCE, title: "Relevé C" },
      ],
    });
    writeLedger([
      verification(),
      verification({
        id: "ASV-2026-10-08-0002",
        path: "sources[1]",
        original: { title: "Relevé B", url: null },
        candidates: [],
        status: "oral_needed",
        decidedBy: "moderator-1",
        decidedAt: "2026-10-09",
      }),
      verification({
        id: "ASV-2026-10-08-0003",
        path: "sources[2]",
        original: { title: "Relevé C", url: null },
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

  // A verification note helps the person who decides; it decides nothing
  // itself, so a proposal may carry one — but never an empty one.
  // @req REQ-161
  it("holds a proposal carrying a review note, and fails a blank one", () => {
    writeLedger([
      verification({ reviewNote: "Page ouverte : la citation y figure." }),
    ]);
    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual(
      []
    );

    writeLedger([verification({ reviewNote: "  " })]);
    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      "ASV-2026-10-08-0001: reviewNote is empty — drop it or write the note",
    ]);
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
      `ASV-2026-10-08-0001: patronymes/PAT_DIOP.json does not cite the accepted candidate "${CANDIDATE.title}"`,
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
      'ASV-2026-10-08-0001: patronymes/PAT_DIOP.json "Relevé de couverture" is already verified by ASV-2026-10-08-0001 — one verification per source',
    ]);
  });

  // A source is its fiche, title and url, not its position: the same citation
  // under another path is the same source, verified once.
  // @req REQ-161
  it("fails two verifications of one identity even at different paths", () => {
    writeLedger([
      verification(),
      verification({
        id: "ASV-2026-10-08-0002",
        path: "sources[4]",
        original: { title: "Relevé de couverture ", url: "" as never },
      }),
    ]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      'ASV-2026-10-08-0002: patronymes/PAT_DIOP.json "Relevé de couverture" is already verified by ASV-2026-10-08-0001 — one verification per source',
    ]);
  });

  // @req REQ-161
  it("finds a not-yet-applied accepted source by identity after an insertion shifted it", () => {
    writeFiche("patronymes/PAT_DIOP.json", {
      sources: [{ title: "Autre", url: null, tier: "referenced" }, AI_SOURCE],
    });
    writeLedger([verification(ACCEPTED)]);

    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      "ASV-2026-10-08-0001: patronymes/PAT_DIOP.json still carries the ai_generated source at sources[1] — run npx tsx scripts/afrik/applyAiSourceVerifications.ts --apply",
    ]);
  });

  // @req REQ-161
  it("fails a non-accepted entry whose owner matches no ai_generated marker", () => {
    writeFiche("patronymes/_queue.json", {
      entries: [
        {
          countryId: "SEN",
          name: "Fall",
          provenance: { tier: "unverified", source_kind: "ai_generated" },
        },
      ],
    });
    const marker = {
      fiche: "patronymes/_queue.json",
      path: "entries[0].provenance",
      original: { title: null, url: null },
      status: "rejected" as const,
      decidedBy: "moderator-1",
      decidedAt: "2026-10-09",
    };

    writeLedger([
      verification({ ...marker, owner: { countryId: "SEN", name: "Fal" } }),
    ]);
    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual([
      "ASV-2026-10-08-0001: patronymes/_queue.json names no AI-generated source — mistyped owner/title/url?",
    ]);

    writeLedger([
      verification({ ...marker, owner: { countryId: "SEN", name: "Fall" } }),
    ]);
    expect(checkAiSourceVerifications(datasetRoot, ledgerPath).errors).toEqual(
      []
    );
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
