import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeHeroAnecdote } from "@/components/home/HomeHeroAnecdote";
import type { DidYouKnowFact } from "@/lib/home/didYouKnowFacts";
import {
  getCountryRoute,
  getLocalizedRoute,
  getPeopleRoute,
} from "@/lib/routing";

/**
 * The anecdote the hero draws, held to the decisions the retired « Saviez-vous
 * que » band was rebuilt around. They moved with the anecdote rather than
 * being deleted with the band: each one names a defect that already shipped
 * once. The CSS decisions are read from the component's own <style> block,
 * because happy-dom applies no stylesheet and would stay green over all of
 * them.
 */

const FACT: DidYouKnowFact = {
  id: "monrovia",
  headline: "La capitale du Liberia porte le nom d'un président américain.",
  body: ["Monrovia vient de James Monroe."],
  entities: [
    { kind: "country", id: "LBR", label: "Liberia" },
    {
      kind: "people",
      id: "PPL_AMERICANO_LIBERIENS",
      label: "Américano-Libériens",
    },
  ],
  tier: "referenced",
};

const OFFICIAL: DidYouKnowFact = {
  ...FACT,
  id: "berbere",
  sources: [
    {
      title: "SIL Ethnologue — Amazigh",
      url: "https://www.ethnologue.com/",
      tier: "official",
    },
  ],
};

const SOURCE = readFileSync(
  resolve(process.cwd(), "src/components/home/HomeHeroAnecdote.tsx"),
  "utf8"
);

/** The declarations of one rule in the component's own <style> block. */
function ruleBody(selector: string): string {
  const match = SOURCE.match(
    new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`
    )
  );
  if (!match) throw new Error(`Missing rule ${selector}`);
  return match[1];
}

describe("HomeHeroAnecdote — the hero's anecdote (REQ-115)", () => {
  /**
   * The band once rendered nothing for the half of the bank illustrated by a
   * drawn plate: 34 of 67 facts left their image column empty. The plates are
   * gone, and `iteso-bakedi` — one of them — is kept here as the witness that
   * a former plate now draws a photograph.
   */
  // @req REQ-113
  it.each(["monrovia", "iteso-bakedi"])(
    "illustrates the %s fact with a photograph",
    (id) => {
      const { container } = render(
        <HomeHeroAnecdote language="fr" fact={{ ...FACT, id }} />
      );

      expect(
        container.querySelector(".home-hero-anecdote-figure img")
      ).not.toBeNull();
    }
  );

  // @req REQ-113
  it("routes each chip to its own kind of entry", () => {
    render(<HomeHeroAnecdote language="fr" fact={FACT} />);

    expect(screen.getByRole("link", { name: /Liberia/ })).toHaveAttribute(
      "href",
      getCountryRoute("fr", "LBR")
    );
    expect(
      screen.getByRole("link", { name: /Américano-Libériens/ })
    ).toHaveAttribute("href", getPeopleRoute("fr", "PPL_AMERICANO_LIBERIENS"));
  });

  // @req REQ-113
  it("names and links the official source supporting the fact", () => {
    render(<HomeHeroAnecdote language="fr" fact={OFFICIAL} />);

    expect(
      screen.getByRole("link", { name: "SIL Ethnologue — Amazigh" })
    ).toHaveAttribute("href", "https://www.ethnologue.com/");
  });

  // Every entry states the authority of what it asserts; a fact on the home
  // asserts just as much and owes the same.
  // @req REQ-113
  it("states the tier of the source when no official one backs the fact", () => {
    render(<HomeHeroAnecdote language="fr" fact={FACT} />);

    expect(screen.getByText("Source référencée")).toBeInTheDocument();
  });

  // The hero shows one card; the page it points at is where the others are,
  // and the arrow is what tells a link that goes somewhere from a label.
  // @req REQ-113
  it("offers the reader the page holding the others", () => {
    render(<HomeHeroAnecdote language="fr" fact={FACT} />);

    const exit = screen.getByRole("link", { name: "Lire d'autres anecdotes" });
    expect(exit).toHaveAttribute("href", getLocalizedRoute("fr", "anecdotes"));
    expect(exit.textContent).toContain("→");
  });

  // Turning, marking and sharing belong to the dedicated reader.
  // @req REQ-113
  it("carries none of the anecdote reader's controls", () => {
    render(<HomeHeroAnecdote language="fr" fact={FACT} />);

    for (const name of [
      "Anecdote suivante",
      "Cette anecdote est intéressante",
      "Je conteste cette anecdote",
      "Partager",
    ]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
  });

  // A kicker files a drawn fact; its headline is the heading (brand charter
  // §8.5: a title over a random draw cannot be wrong, so it is not a title).
  // @req REQ-113
  it("files the anecdote with a kicker rather than titling a random draw", () => {
    render(<HomeHeroAnecdote language="fr" fact={FACT} />);

    expect(screen.getByText("Saviez-vous que")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Saviez-vous que" })
    ).toBeNull();
    expect(
      screen.getByRole("heading", { level: 2, name: FACT.headline })
    ).toBeInTheDocument();
  });

  // @req REQ-145
  it("reads its labels from the English dictionary on the English home", () => {
    render(<HomeHeroAnecdote language="en" fact={FACT} />);

    expect(screen.getByText("Did you know")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read more anecdotes" })
    ).toBeInTheDocument();
  });

  // Mono, uppercase and tracked, the provenance line once dressed exactly like
  // the kicker — two kickers for one card, the louder on the least important
  // line. It stays readable content but in the register of a footnote.
  // @req REQ-113
  it("dresses the provenance as a footnote, not as a second kicker", () => {
    const tier = ruleBody(".home-hero-anecdote-tier");

    expect(tier).not.toMatch(/text-transform:\s*uppercase/);
    expect(tier).not.toMatch(/font-mono/);
  });

  // @req REQ-113
  it("keeps the prose ragged-right at every width", () => {
    expect(ruleBody(".home-hero-anecdote-prose")).toMatch(/text-align:\s*left/);
  });
});
