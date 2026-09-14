import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as prettier from "prettier";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runSourceTierRulings } from "../applySourceTierRulings";
import type { SourceTierRuling } from "../sourceTierRulings";

/**
 * The ledger is how a moderator's ruling reaches git. A ruling that only
 * reached the database would be overwritten by the next sync, so everything
 * below drives the real script over a real directory of fiches.
 */

let workspace: string;
let datasetRoot: string;
let translationsRoot: string;
let ledgerPath: string;

async function writeFiche(relativePath: string, fiche: unknown) {
  const file = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // The corpus is prettier output (short arrays stay on one line), so the
  // fixture is too — otherwise "formatting preserved" would prove nothing.
  const text = await prettier.format(JSON.stringify(fiche, null, 2), {
    parser: "json",
  });
  fs.writeFileSync(file, text, "utf8");
  return text;
}

function readFiche(relativePath: string): string {
  return fs.readFileSync(path.join(datasetRoot, relativePath), "utf8");
}

function writeLedger(rulings: SourceTierRuling[]) {
  fs.writeFileSync(ledgerPath, JSON.stringify({ rulings }, null, 2), "utf8");
}

function ruling(overrides: Partial<SourceTierRuling> = {}): SourceTierRuling {
  return {
    id: "STR-0001",
    match: { title: "ONU – World Population Prospects 2025", url: null },
    decision: "tier",
    tier: "official",
    rationale: "United Nations population estimates, dated edition.",
    decidedBy: "moderator-1",
    decidedAt: "2026-09-14",
    ...overrides,
  };
}

function country(id: string, sources: unknown[]) {
  return {
    id,
    name: id,
    aliases: ["A", "B"],
    content: { summary: "Texte.", sources },
  };
}

const WPP = {
  title: "ONU – World Population Prospects 2025",
  url: null,
  tier: "needs_review",
};

beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "tier-rulings-"));
  datasetRoot = path.join(workspace, "afrik");
  translationsRoot = path.join(workspace, "translations");
  ledgerPath = path.join(workspace, "rulings.json");
  fs.mkdirSync(datasetRoot, { recursive: true });
});

afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

describe("runSourceTierRulings", () => {
  // @req REQ-092
  it("changes only the ruled tier, keeping indentation, key order and inline arrays", async () => {
    const before = await writeFiche(
      "pays/BEN.json",
      country("BEN", [
        {
          title: "Autre source",
          url: "https://example.org",
          tier: "referenced",
        },
        WPP,
      ])
    );
    writeLedger([ruling()]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    expect(report.errors).toEqual([]);
    expect(readFiche("pays/BEN.json")).toBe(
      before.replace('"tier": "needs_review"', '"tier": "official"')
    );
  });

  // @req REQ-092
  it("applies a ruling without appliesTo to every fiche citing the exact title and url", async () => {
    await writeFiche("pays/BEN.json", country("BEN", [WPP]));
    await writeFiche("peuples/FLG_X/PPL_A.json", country("PPL_A", [WPP]));
    const sameTitleOtherUrl = await writeFiche(
      "pays/TCD.json",
      country("TCD", [{ ...WPP, url: "https://population.un.org/wpp/" }])
    );
    writeLedger([ruling()]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    expect(report.changedFiches.sort()).toEqual([
      "pays/BEN.json",
      "peuples/FLG_X/PPL_A.json",
    ]);
    expect(readFiche("peuples/FLG_X/PPL_A.json")).toContain(
      '"tier": "official"'
    );
    expect(readFiche("pays/TCD.json")).toBe(sameTitleOtherUrl);
  });

  // @req REQ-092
  it("restricts a ruling to the fiches its appliesTo names", async () => {
    await writeFiche("pays/BEN.json", country("BEN", [WPP]));
    const untouched = await writeFiche("pays/TCD.json", country("TCD", [WPP]));
    writeLedger([ruling({ appliesTo: ["pays/BEN.json"] })]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    expect(report.changedFiches).toEqual(["pays/BEN.json"]);
    expect(readFiche("pays/TCD.json")).toBe(untouched);
  });

  // A removal shifts the indices of `sources[]` the English sidecar was hashed
  // against. A tier or a repaired url does not: the translation hash leaves
  // tiers and source urls out on purpose (src/lib/afrik/translations/hashing.ts).
  // @req REQ-092
  it("lists the English sidecars a removal drifts, and none for a repair or a tier", async () => {
    await writeFiche("pays/BEN.json", country("BEN", [WPP]));
    await writeFiche(
      "pays/SEN.json",
      country("SEN", [
        {
          title: "Site mort",
          url: "http://dead.example",
          tier: "needs_review",
        },
      ])
    );
    await writeFiche(
      "pays/NER.json",
      country("NER", [{ title: "Blog", url: null, tier: "needs_review" }])
    );
    for (const id of ["BEN", "SEN", "NER"]) {
      fs.mkdirSync(path.join(translationsRoot, "en", "pays"), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(translationsRoot, "en", "pays", `${id}.json`),
        "{}"
      );
    }
    writeLedger([
      ruling(),
      ruling({
        id: "STR-0002",
        match: { title: "Site mort", url: "http://dead.example" },
        decision: "repair",
        tier: "referenced",
        repairedUrl: "https://web.archive.org/web/2025/http://dead.example",
      }),
      ruling({
        id: "STR-0003",
        match: { title: "Blog", url: null },
        decision: "remove",
        tier: undefined,
      }),
    ]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    expect(report.sidecarsToRedrift).toEqual([
      "npm run translate:record -- --id NER --lang en --drift",
    ]);
    const senegal = JSON.parse(readFiche("pays/SEN.json"));
    expect(senegal.content.sources).toEqual([
      {
        title: "Site mort",
        url: "https://web.archive.org/web/2025/http://dead.example",
        tier: "referenced",
      },
    ]);
    expect(JSON.parse(readFiche("pays/NER.json")).content.sources).toEqual([]);
  });

  // `sources[].notes` is published to readers verbatim, and the rationale is
  // workshop vocabulary; it belongs to the ledger alone.
  // @req REQ-092
  it("never writes the rationale into the fiche", async () => {
    await writeFiche("pays/BEN.json", country("BEN", [WPP]));
    writeLedger([ruling({ rationale: "Domain ruling: UN statistics desk." })]);

    await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    const text = readFiche("pays/BEN.json");
    expect(text).not.toContain("Domain ruling");
    expect(Object.keys(JSON.parse(text).content.sources[0]).sort()).toEqual([
      "tier",
      "title",
      "url",
    ]);
  });

  // @req REQ-092
  it("writes nothing on a dry run, and still reports what it would change", async () => {
    const before = await writeFiche("pays/BEN.json", country("BEN", [WPP]));
    writeLedger([ruling()]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: false,
    });

    expect(report.changedFiches).toEqual(["pays/BEN.json"]);
    expect(readFiche("pays/BEN.json")).toBe(before);
  });

  // @req REQ-092
  it("reports the ratchet line to lower once rulings clear citations", async () => {
    await writeFiche(
      "pays/BEN.json",
      country("BEN", [WPP, { title: "Autre", url: null, tier: "needs_review" }])
    );
    writeLedger([ruling()]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
      ratchet: 2,
    });

    expect(report.untieredBefore).toBe(2);
    expect(report.untieredAfter).toBe(1);
    expect(report.ratchetLine).toContain(
      "lower NEEDS_REVIEW_RATCHET to 1 in scripts/ci/checkSourceTierCoverage.ts"
    );
  });

  // Rewriting a fiche prettier would reformat turns a one-line ruling into a
  // whole-file diff nobody can review.
  // @req REQ-092
  it("refuses to patch a fiche that would not round-trip through the formatter", async () => {
    const file = path.join(datasetRoot, "pays/BEN.json");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const handFormatted = `{\n  "id": "BEN",\n  "content": { "sources": [\n    { "title": "ONU – World Population Prospects 2025", "url": null, "tier": "needs_review" }\n  ] }\n}\n`;
    fs.writeFileSync(file, handFormatted, "utf8");
    writeLedger([ruling()]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    expect(report.unformattable).toEqual(["pays/BEN.json"]);
    expect(report.changedFiches).toEqual([]);
    expect(readFiche("pays/BEN.json")).toBe(handFormatted);
  });

  // @req REQ-092
  it("writes nothing when the ledger itself is invalid", async () => {
    const before = await writeFiche("pays/BEN.json", country("BEN", [WPP]));
    writeLedger([ruling({ rationale: "  " })]);

    const report = await runSourceTierRulings({
      datasetRoot,
      ledgerPath,
      translationsRoot,
      write: true,
    });

    expect(report.errors).toEqual(["STR-0001: the rationale is empty"]);
    expect(readFiche("pays/BEN.json")).toBe(before);
  });
});
