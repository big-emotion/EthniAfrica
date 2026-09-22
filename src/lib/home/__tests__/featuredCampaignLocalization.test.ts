import { describe, expect, it } from "vitest";

import { FEATURED_CAMPAIGNS } from "@/lib/home/featuredCampaigns";
import { FEATURED_CAMPAIGNS_EN } from "@/lib/home/featuredCampaigns.en";
import { localizeFeaturedCampaign } from "@/lib/home/featuredCampaignLocalization";

describe("localizeFeaturedCampaign", () => {
  // @req REQ-145
  it("returns the French campaign untouched for fr", () => {
    const campaign = FEATURED_CAMPAIGNS[0];

    expect(localizeFeaturedCampaign(campaign, "fr")).toBe(campaign);
  });

  // @req REQ-145
  it("swaps in the English sidecar's copy, keeping the entity and window", () => {
    const campaign = FEATURED_CAMPAIGNS[0];
    const localized = localizeFeaturedCampaign(campaign, "en");

    expect(localized.heading).toBe(FEATURED_CAMPAIGNS_EN[campaign.id].heading);
    expect(localized.entity).toEqual(campaign.entity);
    expect(localized.translationKind).toBe("human");
  });

  // @req REQ-145
  it("every French campaign has an English sidecar entry", () => {
    for (const campaign of FEATURED_CAMPAIGNS) {
      expect(
        FEATURED_CAMPAIGNS_EN[campaign.id],
        `${campaign.id} has no English sidecar`
      ).toBeDefined();
    }
  });
});
