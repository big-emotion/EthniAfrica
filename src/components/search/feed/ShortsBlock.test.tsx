import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShortsBlock } from "@/components/search/feed/ShortsBlock";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";

// @req REQ-180
describe("ShortsBlock", () => {
  it("renders reachable 9:16 posters and the contribution slot", () => {
    render(
      <ShortsBlock
        items={[
          {
            id: "short-1",
            href: "/fr/decouvertes/mande",
            name: "Mande",
            description: "Une minute pour comprendre le nom Mande.",
            publishedAt: "2026-09-19",
            durationSeconds: 63,
            watchUrl: "https://example.org/watch/mande",
            source: {
              title: "Archive",
              url: "https://example.org/archive",
              tier: "referenced",
            },
            match: {
              relation: "linked-family",
              entityType: "languageFamily",
              entityId: "FLG_MANDE",
            },
            poster: {
              src: "/images/mande.jpg",
              alt: "Couverture : D’où vient le nom « Mande » ?",
              width: 450,
              height: 800,
            },
          },
        ]}
        emptySlot={{
          name: "Soninké",
          question: "Une source à proposer ?",
          body: "Aidez-nous à documenter ce nom.",
          action: "Proposer une source",
        }}
        contributionTarget={{
          type: "search-query",
          id: "mande",
          name: "Mande",
          fieldPath: "shorts",
          fieldLabel: "Les shorts",
        }}
      />
    );

    const block = screen.getByTestId("feed-block-shorts");
    expect(block).toHaveAttribute("data-feed-zone", "first");
    expect(screen.getByRole("list")).toHaveClass(
      "overflow-x-auto",
      "snap-x",
      "snap-mandatory",
      "scroll-px-afh-lg",
      "mt-afh-md",
      "min-[1200px]:mt-afh-lg"
    );
    const shortLink = screen.getByRole("link", { name: /Mande/ });
    expect(shortLink).toHaveClass("w-[130px]", "min-[1200px]:w-[160px]");
    expect(shortLink.closest("li")).toHaveClass("snap-start");
    expect(shortLink.firstElementChild).toHaveClass(
      "h-[231px]",
      "min-[1200px]:h-[284px]"
    );
    expect(
      shortLink.firstElementChild?.querySelector('[aria-hidden="true"]')
    ).toHaveClass("size-8", "min-[1200px]:size-9");
    expect(
      screen.getByRole("button", { name: "Proposer une source" })
    ).toHaveClass("min-h-11");
    expect(screen.getByText("Même famille de langues")).toHaveAttribute(
      "data-companion-relation",
      "linked-family"
    );
  });

  // @req REQ-180
  it.each(FEED_CASES)(
    "uses the canonical production question for $id fixture shorts",
    (fixture) => {
      const { container } = render(
        <ShortsBlock items={fixture.production.companions.shorts.items} />
      );

      const renderedQuestions = Array.from(
        container.querySelectorAll("li > a > p.mt-afh-md"),
        (node) => node.textContent
      );
      expect(renderedQuestions).toEqual(
        fixture.production.companions.shorts.items.map((item) =>
          formatProductionNameQuestion(item.name, "fr")
        )
      );
    }
  );
});
