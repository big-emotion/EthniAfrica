import { readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FEATURED_CAMPAIGNS,
  getActiveFeaturedCampaign,
  type FeaturedCampaign,
} from "@/lib/home/featuredCampaigns";

const campaign = (
  id: string,
  overrides: Partial<FeaturedCampaign> = {}
): FeaturedCampaign => ({
  id,
  kind: "naming",
  eyebrow: "Eyebrow",
  heading: `Heading ${id}`,
  support: "Support",
  entity: { kind: "people", id: "PPL_X" },
  sources: [{ title: "Source" }],
  sourceCount: 1,
  linkLabel: "Explorer",
  ...overrides,
});

/** The corpus itself, the same way didYouKnowFacts.test.ts reads it. */
function corpusPeopleIds(): Set<string> {
  const root = resolve(process.cwd(), "dataset/source/afrik/peuples");
  const ids = new Set<string>();
  for (const branch of readdirSync(root)) {
    const branchPath = join(root, branch);
    if (!statSync(branchPath).isDirectory()) continue;
    for (const file of readdirSync(branchPath)) {
      if (file.startsWith("PPL_") && file.endsWith(".json")) {
        ids.add(basename(file, ".json"));
      }
    }
  }
  return ids;
}

describe("the featured-campaign registry", () => {
  // @req REQ-115
  it("gives every campaign an id of its own", () => {
    const ids = FEATURED_CAMPAIGNS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // A tile pointing at a fiche the atlas does not hold is a 404 the reader
  // finds before we do.
  // @req REQ-115
  it("points every people campaign at a fiche the corpus actually holds", () => {
    const people = corpusPeopleIds();
    const dangling = FEATURED_CAMPAIGNS.filter(
      (entry) => entry.entity.kind === "people" && !people.has(entry.entity.id)
    ).map((entry) => `${entry.id} → ${entry.entity.id}`);

    expect(dangling).toEqual([]);
  });

  // Every campaign cites what it claims — no exception class exists here,
  // unlike the Saviez-vous bank's grandfathered six, because this registry
  // starts from zero.
  // @req REQ-115
  it("cites at least one source for every campaign", () => {
    for (const entry of FEATURED_CAMPAIGNS) {
      expect(entry.sources.length, `${entry.id} cites nothing`).toBeGreaterThan(
        0
      );
    }
  });

  // @req REQ-115
  it("ships with no campaign active — disabled is the default", () => {
    expect(getActiveFeaturedCampaign(FEATURED_CAMPAIGNS)).toBeNull();
  });
});

describe("getActiveFeaturedCampaign — the operator's on/off switch", () => {
  // @req REQ-115
  it("returns nothing when no campaign carries a window", () => {
    const bank = [campaign("a"), campaign("b")];

    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-22"))).toBeNull();
  });

  // @req REQ-115
  it("returns the campaign whose window contains the date", () => {
    const bank = [
      campaign("a", { activeFrom: "2026-09-20", activeTo: "2026-09-25" }),
    ];

    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-22"))?.id).toBe(
      "a"
    );
  });

  // @req REQ-115
  it("returns nothing before the window opens or after it closes", () => {
    const bank = [
      campaign("a", { activeFrom: "2026-09-20", activeTo: "2026-09-22" }),
    ];

    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-19"))).toBeNull();
    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-23"))).toBeNull();
  });

  // The whole point of the mechanism: the operator merges a future window
  // now, and it opens and closes itself without a further deploy exactly
  // at either edge.
  // @req REQ-115
  it("picks a campaign scheduled ahead of time once its window opens", () => {
    const bank = [
      campaign("independence-day", {
        kind: "event",
        activeFrom: "2026-10-01",
        activeTo: "2026-10-02",
      }),
    ];

    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-22"))).toBeNull();
    expect(getActiveFeaturedCampaign(bank, new Date("2026-10-01"))?.id).toBe(
      "independence-day"
    );
  });

  // @req REQ-115
  it("never picks two campaigns at once — the first open window wins", () => {
    const bank = [
      campaign("a", { activeFrom: "2026-09-20", activeTo: "2026-09-25" }),
      campaign("b", { activeFrom: "2026-09-21", activeTo: "2026-09-26" }),
    ];

    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-22"))?.id).toBe(
      "a"
    );
  });
});
