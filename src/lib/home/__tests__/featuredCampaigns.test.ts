import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { localizeFeaturedCampaign } from "@/lib/home/featuredCampaignLocalization";
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

  // Opened by the operator on 2026-09-22, from the next day, with no end
  // date: it stays until a later campaign replaces it in the registry.
  // @req REQ-115
  it("opens the Fulbe campaign on 2026-09-23 and leaves it open", () => {
    expect(
      getActiveFeaturedCampaign(FEATURED_CAMPAIGNS, new Date("2026-09-22"))
    ).toBeNull();
    expect(
      getActiveFeaturedCampaign(FEATURED_CAMPAIGNS, new Date("2026-09-23"))?.id
    ).toBe("peul-fulbe-noms");
    expect(
      getActiveFeaturedCampaign(FEATURED_CAMPAIGNS, new Date("2027-06-01"))?.id
    ).toBe("peul-fulbe-noms");
  });
});

/**
 * The tile quotes and names what the PPL_FULA fiche says, so a reader who
 * follows its link finds the same sentence and the same authors there. The
 * fiche is the authority: when the two disagree, the tile is what changes.
 */
describe("the Fulbe campaign against its fiche", () => {
  const fiche = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json"
      ),
      "utf8"
    )
  );
  const ficheSources: { title: string; url?: string }[] = fiche.content.sources;
  const fulbe = FEATURED_CAMPAIGNS.find(
    (entry) => entry.id === "peul-fulbe-noms"
  )!;

  // @req REQ-115
  it("quotes the fiche's origin-of-names paragraph verbatim", () => {
    expect(fulbe.entity).toEqual({ kind: "people", id: "PPL_FULA" });
    expect(fiche.content.appellations.originOfExonyms).toContain(fulbe.quote);
  });

  // A short citation is « Author (year) »: the fiche's full title must carry
  // both halves, and a cited address must be the fiche's own.
  // @req REQ-115
  it("names only sources the fiche cites, in both languages", () => {
    for (const language of ["fr", "en"] as const) {
      const campaign = localizeFeaturedCampaign(fulbe, language);
      for (const source of campaign.sources) {
        const [, name, qualifier] =
          source.title.match(/^(.*?)(?:\s*\(([^)]*)\))?$/) ?? [];
        const match = ficheSources.find(
          (candidate) =>
            candidate.title.includes(name) &&
            (!qualifier || candidate.title.includes(qualifier))
        );
        expect(match, `${language}: ${source.title}`).toBeDefined();
        if (source.url) expect(match?.url).toBe(source.url);
      }
    }
  });

  // @req REQ-115
  it("counts the fiche's own sources, never an inflated figure", () => {
    expect(fulbe.sourceCount).toBe(ficheSources.length);
  });

  // Operator ruling, 2026-09-22: a people's own name comes first wherever a
  // people is named.
  // @req REQ-115
  it("names the people by its own name first", () => {
    for (const language of ["fr", "en"] as const) {
      const campaign = localizeFeaturedCampaign(fulbe, language);
      expect(campaign.heading.startsWith("Fulbe"), language).toBe(true);
      expect(campaign.support.startsWith("Fulbe, Pullo"), language).toBe(true);
      expect(campaign.forms?.[0]).toEqual({
        label: "Fulɓe · Pullo",
        isSelfDesignation: true,
      });
    }
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

  // A window with no end is the operator leaving a campaign up until the next
  // one replaces it; a window with no start is never open, even with an end.
  // @req REQ-115
  it("keeps a campaign with no end date open, and never opens one without a start", () => {
    const bank = [
      campaign("no-start", { activeTo: "2026-12-31" }),
      campaign("open-ended", { activeFrom: "2026-09-23" }),
    ];

    expect(getActiveFeaturedCampaign(bank, new Date("2026-09-22"))).toBeNull();
    expect(getActiveFeaturedCampaign(bank, new Date("2030-01-01"))?.id).toBe(
      "open-ended"
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
