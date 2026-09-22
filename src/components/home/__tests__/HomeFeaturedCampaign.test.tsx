import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeFeaturedCampaign } from "@/components/home/HomeFeaturedCampaign";
import type { LocalizedFeaturedCampaign } from "@/lib/home/featuredCampaignLocalization";
import { getPeopleRoute } from "@/lib/routing";

const CAMPAIGN: LocalizedFeaturedCampaign = {
  id: "peul-fulbe-noms",
  kind: "naming",
  eyebrow: "Un nom, plusieurs histoires",
  heading: "Peul, Fulbe : pourquoi plusieurs noms ?",
  support: "Découvrez ce que chaque forme raconte.",
  entity: { kind: "people", id: "PPL_FULA" },
  forms: [
    { label: "Fulɓe · Pullo", isSelfDesignation: true },
    { label: "Peul" },
    { label: "Fulani" },
  ],
  quote: "Aucune des lectures proposées n’est établie.",
  sources: [{ title: "Breedveld (1995)" }, { title: "Hampâté Bâ (1966)" }],
  sourceCount: 26,
  linkLabel: "Explorer ces noms",
};

describe("HomeFeaturedCampaign", () => {
  // @req REQ-115
  it("renders the eyebrow, heading and support line", () => {
    render(<HomeFeaturedCampaign language="fr" campaign={CAMPAIGN} />);

    expect(screen.getByText(CAMPAIGN.eyebrow)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: CAMPAIGN.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(CAMPAIGN.support)).toBeInTheDocument();
  });

  // The self-designation is marked, never promoted above the rest: same
  // list, same styling hook, a class rather than a separate leading slot.
  // @req REQ-115
  it("marks the self-designation without singling it out of the list", () => {
    const { container } = render(
      <HomeFeaturedCampaign language="fr" campaign={CAMPAIGN} />
    );

    const items = Array.from(
      container.querySelectorAll(".home-featured-forms li")
    );
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveClass("is-self");
    expect(items[1]).not.toHaveClass("is-self");
  });

  // @req REQ-115
  it("shows the real source count and a few named sources", () => {
    render(<HomeFeaturedCampaign language="fr" campaign={CAMPAIGN} />);

    expect(screen.getByText(/26 sources/)).toBeInTheDocument();
    expect(screen.getByText(/Breedveld \(1995\)/)).toBeInTheDocument();
  });

  // @req REQ-115
  it("links to the real fiche the campaign names, not a mock destination", () => {
    render(<HomeFeaturedCampaign language="fr" campaign={CAMPAIGN} />);

    expect(
      screen.getByRole("link", { name: CAMPAIGN.linkLabel })
    ).toHaveAttribute("href", getPeopleRoute("fr", "PPL_FULA"));
  });

  // @req REQ-115
  it("omits the forms list and quote when a campaign carries neither", () => {
    const { container } = render(
      <HomeFeaturedCampaign
        language="fr"
        campaign={{ ...CAMPAIGN, forms: undefined, quote: undefined }}
      />
    );

    expect(container.querySelector(".home-featured-forms")).toBeNull();
    expect(container.querySelector("blockquote")).toBeNull();
  });
});
