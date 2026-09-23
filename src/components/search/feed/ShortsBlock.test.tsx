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
    expect(shortLink).toHaveClass("w-[180px]", "min-[1200px]:w-[256px]");
    expect(shortLink.closest("li")).toHaveClass("snap-start");
    // Height follows the 9:16 ratio rather than a hand-picked pixel value, so
    // the poster stays proportional at every width in between.
    expect(shortLink.firstElementChild).toHaveClass("aspect-[9/16]");
    expect(
      shortLink.firstElementChild?.querySelector('[aria-hidden="true"]')
    ).toHaveClass("size-[44px]", "min-[1200px]:size-[58px]");
    expect(
      screen.getByRole("button", { name: "Proposer une source" })
    ).toHaveClass("min-h-11");
    // The dashed empty slot is a card of the same shelf: it never reads
    // smaller than the shorts sitting beside it.
    const emptySlotBox = screen
      .getByRole("button", { name: "Proposer une source" })
      .closest("li");
    expect(emptySlotBox).toHaveClass("w-[180px]", "min-[1200px]:w-[256px]");
    expect(screen.getByText("Même famille de langues")).toHaveAttribute(
      "data-companion-relation",
      "linked-family"
    );
  });

  // The shelf cannot host a player: at 130 px wide YouTube's controls are
  // unusable and drawing the site's own over them is forbidden. It navigates,
  // to the piece where the site owns playback. The section head is where "see
  // all" goes; the platform is the link of last resort inside the piece.
  // @req REQ-181
  it("sends a card to the piece's own entry, not to the section head or the platform", () => {
    const item = FEED_CASES[0]!.production.companions.shorts.items[0]!;
    render(
      <ShortsBlock
        items={[
          {
            ...item,
            href: "/fr/decouvertes/origine-du-nom-mande",
            watchUrl: "https://www.youtube.com/shorts/vESK91smqxQ",
          },
        ]}
        allHref="/fr/decouvertes"
      />
    );

    const card = screen
      .getAllByRole("link")
      .find((link) => link.className.includes("w-[180px]"));
    expect(card).toHaveAttribute(
      "href",
      "/fr/decouvertes/origine-du-nom-mande"
    );
    expect(card).not.toHaveAttribute("href", "/fr/decouvertes");
    expect(card?.getAttribute("href")).not.toMatch(/youtube/);
    // Leaving the site for a platform from the result page is the opposite of
    // what the shelf is for.
    expect(card).not.toHaveAttribute("target", "_blank");
  });

  // @req REQ-178
  it("uses the board shelf density without per-item relation labels", () => {
    const item = FEED_CASES[0]!.production.companions.shorts.items[0]!;
    render(
      <ShortsBlock
        items={[
          {
            ...item,
            match: {
              relation: "linked-family",
              entityType: "languageFamily",
              entityId: "FLG_MANDE",
            },
          },
        ]}
        reviewed
      />
    );

    expect(
      screen.queryByText("Même famille de langues")
    ).not.toBeInTheDocument();
  });

  // @req REQ-180
  it("opens the reviewed empty slot on the question, without a leading subject label", () => {
    render(
      <ShortsBlock
        items={[]}
        reviewed
        emptySlot={{
          name: "Bassa",
          question: "D’où vient le nom « Bassa » ?",
          body: "Pas encore de short sur les Bassa de la famille krou.",
          action: "Proposer une source →",
        }}
        contributionTarget={{
          type: "search-query",
          id: "bassa",
          name: "Bassa",
          fieldPath: "shorts",
          fieldLabel: "Les shorts",
        }}
      />
    );

    expect(screen.queryByText("Bassa")).not.toBeInTheDocument();
    expect(
      screen.getByText("D’où vient le nom « Bassa » ?")
    ).toBeInTheDocument();
  });

  // With nothing to show, the shelf says so in one line. A dashed tile that
  // repeats the searched name as a question, a body and a call to action makes
  // an absence read as a piece of content.
  // @req REQ-180
  it("says only that there is no short yet when the atlas holds none", () => {
    render(
      <ShortsBlock
        items={[]}
        allHref="/fr/decouvertes"
        emptySlot={{
          name: "Sénégal",
          question: "D’où vient le nom « Sénégal » ?",
          body: "Aucune source lue par l’atlas ne répond encore à cette question.",
          action: "Proposer une source",
        }}
        contributionTarget={{
          type: "search-query",
          id: "senegal",
          name: "Sénégal",
          fieldPath: "shorts",
          fieldLabel: "Les shorts",
        }}
      />
    );

    expect(screen.getByText("Pas encore de short")).toBeInTheDocument();
    expect(screen.queryByText(/D’où vient le nom/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Proposer une source" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  // The related-context note only qualifies shorts that are on the page.
  // @req REQ-180
  it("keeps the dashed slot beside shorts that are there", () => {
    const item = FEED_CASES[0]!.production.companions.shorts.items[0]!;
    render(
      <ShortsBlock
        items={[item]}
        emptySlot={{
          name: "Sénégal",
          question: "D’où vient le nom « Sénégal » ?",
          body: "Aucune source lue par l’atlas ne répond encore à cette question.",
          action: "Proposer une source",
        }}
        contributionTarget={{
          type: "search-query",
          id: "senegal",
          name: "Sénégal",
          fieldPath: "shorts",
          fieldLabel: "Les shorts",
        }}
      />
    );

    expect(screen.getByText("D’où vient le nom « Sénégal » ?")).toBeVisible();
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
