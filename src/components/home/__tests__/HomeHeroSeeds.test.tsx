import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeHeroSeeds } from "../HomeHeroSeeds";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";

describe("HomeHeroSeeds — four renewable example queries", () => {
  // The same three words as the placeholder, introduced rather than floating:
  // « Essayez avec » names the list, so it is announced as what it is.
  // @req REQ-002
  it("introduces four chips from copy, in order", () => {
    render(<HomeHeroSeeds language="fr" onPick={vi.fn()} />);

    const list = screen.getByRole("list", { name: "Essayez avec" });
    expect(
      within(list)
        .getAllByRole("button")
        .map((chip) => chip.textContent)
    ).toEqual(["Keïta", "Lingala", "Fulbe", "Bénin"]);
  });

  // @req REQ-002
  it("hands the picked word to the caller", () => {
    const onPick = vi.fn();
    render(<HomeHeroSeeds language="fr" onPick={onPick} />);

    fireEvent.click(screen.getByRole("button", { name: "Lingala" }));

    expect(onPick).toHaveBeenCalledWith("Lingala");
  });

  // @req REQ-145
  it("introduces the English chips in English", () => {
    render(<HomeHeroSeeds language="en" onPick={vi.fn()} />);

    const list = screen.getByRole("list", { name: "Try" });
    expect(within(list).getAllByRole("button")).toHaveLength(4);
    expect(homeHeroCopy.en.seeds).toHaveLength(4);
  });

  // The reels are gone: no hidden track, no second word waiting to roll in,
  // and a chip's name is its visible word at every moment.
  // @req REQ-002
  it("renders no reel — each chip is named by the word it shows", () => {
    const { container } = render(
      <HomeHeroSeeds language="fr" onPick={vi.fn()} />
    );

    expect(container.querySelector("[aria-hidden]")).toBeNull();
    expect(container.querySelector("style")).toBeNull();
    for (const chip of screen
      .getAllByRole("listitem")
      .map((item) => within(item).getByRole("button"))) {
      expect(chip).toHaveAccessibleName(chip.textContent ?? "");
    }
  });
  // @req REQ-002
  it("renews every example on request and submits the displayed word", () => {
    const onPick = vi.fn();
    render(
      <HomeHeroSeeds
        language="fr"
        onPick={onPick}
        words={{
          patronyme: ["Keïta", "Konaté"],
          language: ["Lingala", "Swahili"],
          people: ["Fulbe", "Iteso"],
          country: ["Bénin", "Togo"],
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Autres exemples" }));
    const list = screen.getByRole("list", { name: "Essayez avec" });
    expect(
      within(list)
        .getAllByRole("button")
        .map((chip) => chip.textContent)
    ).toEqual(["Konaté", "Swahili", "Iteso", "Togo"]);
    fireEvent.click(screen.getByRole("button", { name: "Iteso" }));
    expect(onPick).toHaveBeenCalledWith("Iteso");
  });
});
