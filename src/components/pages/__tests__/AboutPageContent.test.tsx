import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutPageContent from "../AboutPageContent";
import { ACCESS_MODE_LABELS, ACCESS_MODES } from "@/lib/hubs/moduleRegistry";
import { modulesNamedIn } from "@/test/axisModuleVocabulary";
import { getLocalizedRoute, getStaticPageRoute } from "@/lib/routing";

const renderAbout = () => render(<AboutPageContent language="fr" />);

function headingLevels(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(
    (heading) => Number(heading.tagName[1])
  );
}

function expectNoSkippedHeadingLevels(levels: number[]) {
  let highestLevelSeen = 0;

  for (const level of levels) {
    expect(level).toBeLessThanOrEqual(highestLevelSeen + 1);
    highestLevelSeen = Math.max(highestLevelSeen, level);
  }
}

const sectionHeadings = () =>
  screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);

describe("AboutPageContent (REQ-132)", () => {
  /**
   * The editorial plan's A1–A7 (operator ruling, 22 September 2026): the page
   * says what the project is for, then why names, then what a reader can do
   * with it, for whom, on what knowledge, under which conviction, and how to
   * correct it — in that order, because each section answers the question the
   * previous one raises.
   */
  // @req REQ-132
  it("runs the seven sections in the editorial plan's order", () => {
    renderAbout();

    expect(
      screen.getByRole("heading", { level: 1, name: "À propos d’EthniAfrica" })
    ).toBeInTheDocument();
    expect(sectionHeadings()).toEqual([
      "Pourquoi partir des noms ?",
      "Ce que vous pouvez explorer",
      "Un projet ouvert, une attention aux diasporas",
      "Rendre les savoirs accessibles",
      "Notre conviction",
      "Un travail qui peut être corrigé",
    ]);
  });

  // The brand charter records that this lead carries the signature; the
  // mission follows it rather than replacing it.
  // @req REQ-132
  it("opens on the signature, then states the mission", () => {
    renderAbout();

    const overview = screen.getByTestId("about-overview");
    expect(overview).toHaveTextContent(
      "EthniAfrica raconte l’Afrique à travers ses noms."
    );
    expect(overview).toHaveTextContent(
      /plus faciles à trouver, à comprendre et à partager/
    );
    expect(overview).toHaveTextContent(/EthniAfrica part d’un nom/);
  });

  // Other surfaces link to about#about-purpose-title; renaming the anchor
  // would break them silently.
  // @req REQ-132
  it("keeps the purpose anchor on the « why names » heading", () => {
    renderAbout();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Pourquoi partir des noms ?",
      })
    ).toHaveAttribute("id", "about-purpose-title");
  });

  // @req REQ-132
  it("names the French-speaking diasporas it pays attention to", () => {
    renderAbout();

    expect(screen.getByTestId("about-audience")).toHaveTextContent(
      /une attention particulière aux diasporas francophones/
    );
  });

  /**
   * The conviction is a position, not a finding; the heading labels it as
   * one and the second paragraph says what it does not replace.
   */
  // @req REQ-132
  it("labels the conviction as a conviction", () => {
    renderAbout();

    const conviction = screen.getByTestId("about-conviction");
    expect(
      within(conviction).getByRole("heading", { name: "Notre conviction" })
    ).toBeInTheDocument();
    expect(conviction).toHaveTextContent(
      /Elle ne remplace pas les résultats de l’enquête/
    );
  });

  // The three destinations are the site's own routes, not paths spelled here.
  // @req REQ-132
  it("closes on three links: search, method, report an error", () => {
    renderAbout();

    const correction = screen.getByTestId("about-correction");
    expect(
      within(correction).getByRole("link", { name: "Chercher un nom" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "search"));
    expect(
      within(correction).getByRole("link", { name: "Comment nous travaillons" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "doctrine"));
    expect(
      within(correction).getByRole("link", { name: "Signaler une erreur" })
    ).toHaveAttribute("href", getStaticPageRoute("fr", "reportError"));
  });

  /**
   * The border-age comparison, the dated counts and the three scales left
   * this page on 22 September 2026; they are kept verbatim, marked
   * superseded, in docs/editorial/purpose-doctrine.md. The refusals moved to
   * the method page. The six subject cards went too: listing what the project
   * holds is the retired register.
   */
  // @req REQ-132
  it("no longer carries the retired chapters", () => {
    const { container } = renderAbout();
    const text = container.textContent ?? "";

    expect(text).not.toMatch(/cent quarante ans/);
    expect(text).not.toMatch(/191 peuples/);
    expect(text).not.toMatch(/La Tanzanie en compte 95/);
    expect(text).not.toMatch(/Pour une diaspora/);
    expect(text).not.toMatch(/Quatre phrases que nous n’écrivons pas/);
    expect(text).not.toMatch(/Six sujets/);
    expect(text).not.toMatch(/Nous ne jugeons personne/);
  });

  // @req REQ-132
  it("places the three ways in under « what you can explore »", () => {
    renderAbout();

    const explore = screen.getByTestId("about-explore");
    const list = within(explore).getByTestId("about-access-mode-list");
    for (const name of Object.values(ACCESS_MODE_LABELS)) {
      expect(within(list).getByText(name)).toBeInTheDocument();
    }
  });

  // The page describes the three axes to a reader who has not opened the
  // header menu, so it owes the same answer the panel owes: what is actually
  // behind each entry.
  // @req REQ-132
  it("describes each access mode by the modules it holds", () => {
    renderAbout();

    for (const mode of ACCESS_MODES) {
      const card = screen.getByTestId(`about-access-mode-${mode}`);
      const description = within(card).getByTestId(
        `about-access-mode-description-${mode}`
      ).textContent;

      expect(
        modulesNamedIn(mode, description ?? "").length
      ).toBeGreaterThanOrEqual(2);
    }
  });

  /**
   * "Fiche", "corpus", "autonyme", "exonyme" are workshop words, and the
   * project is never "the atlas" to a reader (operator ruling, 2026-09-22).
   * Asserted rather than trusted, because one careless sentence puts them
   * back.
   */
  // @req REQ-132
  // @req REQ-145
  it("says nothing to the reader in the workshop's own vocabulary", () => {
    for (const language of ["fr", "en"] as const) {
      const { container, unmount } = render(
        <AboutPageContent language={language} />
      );

      expect(container.textContent).not.toMatch(/fiches?\b/i);
      expect(container.textContent).not.toMatch(/corpus/i);
      expect(container.textContent).not.toMatch(/autonyme?s?\b|exonyme?s?\b/i);
      expect(container.textContent).not.toMatch(/atlas/i);

      unmount();
    }
  });

  // @req REQ-132
  it("opens each section on a rule and a heading, with no image", () => {
    const { container } = renderAbout();

    expect(container.querySelectorAll("figure")).toHaveLength(0);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  // @req REQ-145
  it("renders the same outline in English", () => {
    render(<AboutPageContent language="en" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About EthniAfrica" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("about-overview")).toHaveTextContent(
      "EthniAfrica tells Africa through its names."
    );
    expect(sectionHeadings()).toHaveLength(6);
    expect(
      screen.getByRole("heading", { level: 2, name: "Why start from names?" })
    ).toHaveAttribute("id", "about-purpose-title");
    expect(screen.getByRole("link", { name: "How we work" })).toHaveAttribute(
      "href",
      getLocalizedRoute("en", "doctrine")
    );
    expect(
      screen.getByRole("link", { name: "Report an error" })
    ).toHaveAttribute("href", getStaticPageRoute("en", "reportError"));
  });

  // @req REQ-132
  it("keeps one valid H1 → H2 → H3 document outline", () => {
    const { container } = renderAbout();
    const levels = headingLevels(container);

    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expectNoSkippedHeadingLevels(levels);
  });

  // @req REQ-132
  it("declares a mobile-first grid for the ways in that widens at tablet", () => {
    renderAbout();

    const accessModes = screen.getByTestId("about-access-mode-list");
    expect(accessModes.className).toMatch(/grid-cols-1/);
    expect(accessModes.className).toMatch(/min-\[720px\]:grid-cols-3/);
  });
});
