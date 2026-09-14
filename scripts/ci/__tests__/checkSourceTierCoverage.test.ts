import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NEEDS_REVIEW_RATCHET,
  checkSourceTierCoverage,
  checkSourceTierRulings,
  findUntieredSources,
} from "../checkSourceTierCoverage";
import { SOURCE_TIER_RULINGS_LEDGER } from "../../afrik/sourceTierRulings";

let datasetRoot: string;

function writeFiche(relativePath: string, fiche: unknown): void {
  const filePath = path.join(datasetRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(fiche, null, 2), "utf8");
}

beforeEach(() => {
  datasetRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tier-coverage-"));
});

afterEach(() => {
  fs.rmSync(datasetRoot, { recursive: true, force: true });
});

describe("findUntieredSources", () => {
  // @req REQ-032
  it("reports a source left at needs_review", () => {
    writeFiche("peuples/PPL_A.json", {
      id: "PPL_A",
      content: {
        sources: [
          { title: "Recensements", url: null, tier: "needs_review", notes: "" },
        ],
      },
    });

    const untiered = findUntieredSources(datasetRoot);

    expect(untiered).toHaveLength(1);
    expect(untiered[0].path).toBe("content.sources[0]");
    expect(untiered[0].title).toBe("Recensements");
  });

  // @req REQ-032
  it("reports a source with no tier field at all", () => {
    writeFiche("pays/ZAF.json", {
      id: "ZAF",
      content: { sources: [{ title: "Statistics South Africa", url: null }] },
    });

    expect(findUntieredSources(datasetRoot)).toHaveLength(1);
  });

  // @req REQ-032
  it("accepts the three doctrine tiers and the legacy numeric tiers", () => {
    writeFiche("relations/REL_A.json", {
      id: "REL_A",
      sources: [
        { title: "a", tier: "official" },
        { title: "b", tier: "referenced" },
        { title: "c", tier: "unverified" },
        { title: "d", tier: 1 },
        { title: "e", tier: 2 },
      ],
    });

    expect(findUntieredSources(datasetRoot)).toHaveLength(0);
  });

  // @req REQ-032
  it("looks inside nested sources arrays such as names[].sources", () => {
    writeFiche("noms/PPL_A.json", {
      id: "PPL_A",
      names: [{ nameText: "x", sources: [{ title: "y" }] }],
    });

    expect(findUntieredSources(datasetRoot)[0].path).toBe(
      "names[0].sources[0]"
    );
  });
});

describe("checkSourceTierCoverage", () => {
  // @req REQ-032
  it("fails when the untiered count exceeds the threshold", () => {
    writeFiche("peuples/PPL_A.json", {
      id: "PPL_A",
      content: {
        sources: [{ title: "a", tier: "needs_review" }, { title: "b" }],
      },
    });

    const result = checkSourceTierCoverage(datasetRoot, 1);

    expect(result.ok).toBe(false);
    expect(result.count).toBe(2);
  });

  // @req REQ-032
  it("passes when the untiered count sits on the threshold", () => {
    writeFiche("peuples/PPL_A.json", {
      id: "PPL_A",
      content: { sources: [{ title: "a", tier: "needs_review" }] },
    });

    const result = checkSourceTierCoverage(datasetRoot, 1);

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
  });

  // A ceiling left above the real count is room to regress into without a red
  // run, so an improvement fails too until the number is lowered with it.
  // @req REQ-032
  it("fails when the untiered count drops below the threshold, naming the line to lower", () => {
    writeFiche("peuples/PPL_A.json", {
      id: "PPL_A",
      content: { sources: [{ title: "a", tier: "needs_review" }] },
    });

    const result = checkSourceTierCoverage(datasetRoot, 3);

    expect(result.ok).toBe(false);
    expect(result.error).toContain(
      "lower NEEDS_REVIEW_RATCHET to 1 in scripts/ci/checkSourceTierCoverage.ts"
    );
  });

  // @req REQ-032
  it("names the regression, and forbids raising the ratchet, when the count climbs", () => {
    writeFiche("peuples/PPL_A.json", {
      id: "PPL_A",
      content: { sources: [{ title: "a" }, { title: "b" }] },
    });

    const result = checkSourceTierCoverage(datasetRoot, 1);

    expect(result.error).toContain(
      "2 untiered sources exceed the ratchet of 1"
    );
    expect(result.error).toContain("do not raise the ratchet");
  });

  // @req REQ-032
  it("holds the live corpus exactly at the committed ratchet", () => {
    const live = checkSourceTierCoverage(
      "dataset/source/afrik",
      NEEDS_REVIEW_RATCHET
    );

    expect(live.count).toBe(NEEDS_REVIEW_RATCHET);
    expect(live.ok).toBe(true);
  });
});

describe("checkSourceTierRulings", () => {
  const WPP_TITLE = "ONU – World Population Prospects 2025";

  function writeLedger(rulings: unknown[]): string {
    // Inside the temp dataset so afterEach removes it; it carries no `sources`
    // array, so the corpus walk reads nothing from it.
    const ledgerPath = path.join(datasetRoot, "rulings-ledger.json");
    fs.writeFileSync(ledgerPath, JSON.stringify({ rulings }), "utf8");
    return ledgerPath;
  }

  function ruling(overrides: Record<string, unknown> = {}) {
    return {
      id: "STR-0001",
      match: { title: WPP_TITLE, url: null },
      decision: "tier",
      tier: "official",
      rationale: "United Nations population estimates.",
      decidedBy: "moderator-1",
      decidedAt: "2026-09-14",
      ...overrides,
    };
  }

  function citing(tier: string) {
    writeFiche("pays/BEN.json", {
      id: "BEN",
      content: { sources: [{ title: WPP_TITLE, url: null, tier }] },
    });
  }

  // @req REQ-092
  it("holds when every fiche agrees with the ledger", () => {
    citing("official");

    const result = checkSourceTierRulings(datasetRoot, writeLedger([ruling()]));

    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  // @req REQ-092
  it("fails when a fiche contradicts a ruling", () => {
    citing("referenced");

    const { errors } = checkSourceTierRulings(
      datasetRoot,
      writeLedger([ruling()])
    );

    expect(errors).toEqual([
      `STR-0001: pays/BEN.json cites "${WPP_TITLE}" at "referenced", the ruling says "official"`,
    ]);
  });

  // @req REQ-092
  it("fails when a ruled source still says needs_review, naming the command that applies it", () => {
    citing("needs_review");

    const { errors } = checkSourceTierRulings(
      datasetRoot,
      writeLedger([ruling()])
    );

    expect(errors[0]).toContain(
      `STR-0001: pays/BEN.json still says needs_review for "${WPP_TITLE}"`
    );
    expect(errors[0]).toContain(
      "npx tsx scripts/afrik/applySourceTierRulings.ts --apply"
    );
  });

  // @req REQ-092
  it("fails a ruling that targets needs_review or an unknown tier", () => {
    citing("official");

    const { errors } = checkSourceTierRulings(
      datasetRoot,
      writeLedger([
        ruling({ tier: "needs_review" }),
        ruling({ id: "STR-0002", tier: "primary-ish" }),
      ])
    );

    expect(errors).toContain(
      'STR-0001: "needs_review" is not a ruling — a ruling states official, referenced or unverified'
    );
    expect(errors).toContain('STR-0002: unknown tier "primary-ish"');
  });

  // @req REQ-092
  it("fails a ruling whose rationale is empty", () => {
    citing("official");

    const { errors } = checkSourceTierRulings(
      datasetRoot,
      writeLedger([ruling({ rationale: "" })])
    );

    expect(errors).toEqual(["STR-0001: the rationale is empty"]);
  });

  // @req REQ-092
  it("fails a ruling that matches no citation in the corpus", () => {
    citing("official");

    const { errors } = checkSourceTierRulings(
      datasetRoot,
      writeLedger([
        ruling({ match: { title: WPP_TITLE, url: "https://nowhere.example" } }),
      ])
    );

    expect(errors).toEqual([
      `STR-0001: matches no citation of "${WPP_TITLE}" (https://nowhere.example) in the corpus`,
    ]);
  });

  // @req REQ-092
  it("holds the live corpus to the committed ledger", () => {
    const live = checkSourceTierRulings(
      "dataset/source/afrik",
      SOURCE_TIER_RULINGS_LEDGER
    );

    expect(live.errors).toEqual([]);
  });
});
