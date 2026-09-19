import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeHero } from "@/components/home/HomeHero";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";
import { PRODUCT_NAME } from "@/lib/brand";
import { CORPUS_CLASSES } from "@/lib/home/corpusClasses";
import type { DidYouKnowFact } from "@/lib/home/didYouKnowFacts";
import { HOME_HERO_IMAGES } from "@/lib/home/homeHeroVisuals";
import { homePurposeCopy } from "@/lib/i18n/copy/homePurpose";

const ANECDOTE: DidYouKnowFact = {
  id: "test-hero-anecdote",
  headline: "Le Cameroun porte le nom d'un crustacé.",
  body: [
    "Rio dos Camarões, la rivière des crevettes.",
    "Le nom de l'estuaire est devenu celui du pays.",
  ],
  entities: [{ kind: "country", id: "CMR", label: "Cameroun" }],
  tier: "referenced",
  sources: [
    {
      title: "Ministère des Relations extérieures du Cameroun — Histoire",
      url: "https://www.diplocam.cm/histoire/",
      tier: "official",
    },
  ],
};

// The band carries an interactive island since the search field landed in it,
// and useRouter throws outside an app-router tree rather than degrading.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/atlas/ContinentGlobeStage", () => ({
  ContinentGlobeStage: ({
    activation,
    autoRotate,
  }: {
    activation?: "automatic" | "explicit";
    autoRotate?: boolean;
  }) => (
    <div
      className="home-globe-stage"
      data-testid="home-globe-stage"
      data-activation={activation}
      data-autoplay={String(Boolean(autoRotate))}
    />
  ),
}));

describe("HomeHero — the band the home opens on (REQ-115)", () => {
  // @req REQ-044
  it("renders no eyebrow and no standalone brand line", () => {
    render(<HomeHero language="fr" />);
    expect(screen.queryByText(PRODUCT_NAME)).not.toBeInTheDocument();
    expect(
      screen.queryByText("EXPLORER · COMPRENDRE · JOUER")
    ).not.toBeInTheDocument();
  });

  // The heading's accessible name is its text now. There is no reel to hide
  // from assistive technology and so no separate aria-label to keep in step
  // with it — a landmark whose name was a different sentence from what it
  // displayed is exactly the arrangement this band spent a release in.
  // @req REQ-044
  it("renders a single H1 whose accessible name is the question it displays", () => {
    render(<HomeHero language="fr" />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);

    expect(headings[0]).not.toHaveAttribute("aria-label");
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  // The headline asks the one question the atlas answers — where a name comes
  // from — and the tile band under the search states the classes it counts. It
  // used to ask about the continent, which invited any question; the site
  // answers one kind, and the social format asks it in the same words.
  // \s rather than a literal space: the no-break space before « ? » is
  // deliberate and must not be asserted as an ordinary one.
  //
  // The words come from the registry rather than a literal list. They were
  // written out once — peuples, langues, pays — and the day pays gave its tile
  // to noms this assertion failed on a band that was correct, which is the
  // shape of a test that pins the classes instead of the division of labour
  // between the headline and the band.
  // @req REQ-044
  it("asks where a name comes from and leaves the totals to the tile band", () => {
    render(<HomeHero language="fr" />);

    const h1 = screen.getByRole("heading", { level: 1 });
    // Read from the dictionary, never retyped: the copy files use the
    // typographic apostrophe, and a hand-written regex asserts the straight
    // one and fails on copy that is correct.
    expect(h1.textContent).toBe(homeHeroCopy.fr.question);

    const tiles = screen.getByTestId("home-corpus-counts");
    for (const { tileLabel } of CORPUS_CLASSES) {
      const className = tileLabel.split(" ")[0];
      expect(h1.textContent).not.toContain(className);
      expect(tiles.textContent).toContain(className);
    }
  });

  // The headline is the question the reader arrives with, so it stays a
  // question: a full stop here would turn the one line a first-time visitor
  // recognises as their own into an assertion about them.
  //
  // No italic clause any more. The accent used to fall on « le nom qu'ils se
  // donnent » because the headline was a nine-word thesis with a part worth
  // stressing; a five-word question has no subordinate to lift, and
  // italicising a fragment of it would stress nothing.
  // @req REQ-044
  it("keeps the headline interrogative and carries no italic clause", () => {
    render(<HomeHero language="fr" />);
    const h1 = screen.getByRole("heading", { level: 1 });

    expect(h1.textContent?.trim().endsWith("?")).toBe(true);
    expect(h1.querySelector("em")).toBeNull();
  });

  // One sentence, not three registers. The band used to ask the reader to
  // hold seven items before the first scroll — four in the lede's list,
  // three in the standfirst's — and a reader retains one.
  //
  // The sentence names what a reader can do before it names what the site is.
  // The band's job on a first visit is to answer « what is there here for me »
  // and it spent a release answering « how does this site work » instead, in a
  // sentence about fiches and access that named neither the map, the dossiers
  // nor the games. An edit that drops the verbs turns the proposition of value
  // back into a description of a mechanism.
  // @req REQ-044
  it("answers the headline in one sentence, and offers something to do", () => {
    render(<HomeHero language="fr" />);

    const answer = screen.getByTestId("home-hero-answer");
    const sentences = answer
      .textContent!.split(/(?<=\.)\s+/)
      .filter((part) => part.trim().length > 0);

    expect(sentences).toHaveLength(1);
    expect(answer).toHaveTextContent(/explorez/i);
    expect(answer).toHaveTextContent(/dossiers/i);
    expect(answer).toHaveTextContent(/atlas/i);
    expect(answer).toHaveTextContent(/sources/i);
  });

  // The band holds exactly one paragraph of prose. A second is how the lede
  // and the standfirst grew back the last time — so this asserts the exact
  // list rather than a count, which a new block could quietly join by
  // incrementing a number in a test. The figures are a definition list under
  // the search, deliberately not a third register of prose.
  // @req REQ-044
  it("holds one paragraph, one tile band, and no separating rule", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    const paragraphs = Array.from(
      container.querySelectorAll(".home-hero-copy p")
    );
    expect(
      paragraphs.map((paragraph) => paragraph.getAttribute("data-testid"))
    ).toEqual(["home-hero-answer", "home-hero-purpose-sentence"]);
    expect(screen.getByTestId("home-corpus-counts").tagName).toBe("DL");
    expect(container.querySelector(".home-hero-lede")).toBeNull();
    expect(container.querySelector(".home-hero-standfirst")).toBeNull();
    expect(styles).not.toMatch(/\.home-hero-answer\s*\{[^}]*border-top/);
  });

  // The sourcing claim moved to the page's closing strip (TrustStrip), so
  // the hero states one thing rather than three.
  // @req REQ-044
  it("no longer carries the trust note it used to duplicate", () => {
    render(<HomeHero language="fr" />);
    expect(
      screen.queryByTestId("home-hero-trust-note")
    ).not.toBeInTheDocument();
  });

  // ETNI-1404 restores the shared Mercator globe as the search-first hero's
  // visual without restoring the retired featured-module wrapper.
  // @req REQ-115 @req ETNI-1404
  it("holds the shared globe directly, not the old module slot", () => {
    const { container } = render(<HomeHero language="fr" />);

    expect(container.querySelector(".home-globe-holder")).toBeNull();
    expect(container.querySelector(".home-globe-stage")).not.toBeNull();
  });

  // The band stays on the reader's chosen surface: on parchment a dark
  // panel was a hole punched through the page.
  // @req REQ-115
  it("stays on the page surface rather than pinning itself to night", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    expect(container.querySelector("section")).not.toHaveClass("afh-on-night");
    expect(styles).toMatch(
      /\.home-hero\s*\{[^}]*background:\s*var\(--afh-bg\)/
    );
    expect(styles).not.toMatch(/var\(--afh-night-ground\)/);
  });

  // Asserted on the source, because no render here can see the defect: the
  // runner's JSX transform keeps the space that Next's drops, so the page
  // said « EthniAfricapublie » while every assertion above stayed green.
  // What is guarded is therefore the shape that removes the question — the
  // answer is string literals inside one expression, with no bare JSX text
  // beside them. The prose no longer interpolates the product name, but the
  // next edit reaching for it must not paste it in as adjacent JSX text.
  // @req REQ-044
  it("writes the answer as string literals, never as bare JSX text", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/home/HomeHero.tsx"),
      "utf8"
    );

    const answer = source.match(
      /data-testid="home-hero-answer">([\s\S]*?)<\/p>/
    )?.[1];

    expect(answer).toBeDefined();
    expect(answer!.trim().startsWith("{")).toBe(true);
    // Nothing but whitespace between the closing brace and the closing tag:
    // any character there is text SWC would butt against the expression.
    expect(answer!.trimEnd().endsWith("}")).toBe(true);
  });

  // The answer is the band's only prose, so it takes the reading size and
  // the full ink. Set at the retired lede's softer grey it would read as a
  // caption under the headline rather than as its answer.
  // @req REQ-044
  it("sets the answer in the reading size and full ink", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    const rule = styles.match(/\.home-hero-answer\s*\{[^}]*\}/)?.[0];
    expect(rule).toMatch(/font-size:\s*var\(--afh-text-body\)/);
    expect(rule).toMatch(/color:\s*var\(--afh-text\)/);

    // A class, not `.home-hero-copy p`: a descendant selector outranks a
    // single class, so an element rule would override whatever the answer
    // sets for itself.
    expect(styles).not.toMatch(/\.home-hero-copy p\s*\{/);
  });

  // The band ends on a stated edge, not a fade: it is where the sky stops
  // and the archive starts.
  // @req REQ-115
  it("closes the band on an accent seam rather than a gradient", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    expect(container.querySelector(".home-hero-seam")).toBeInTheDocument();
    expect(styles).toMatch(
      /\.home-hero-seam\s*\{[^}]*border-bottom:[^;]*var\(--afh-cat-ocre\)/
    );
  });

  // @req REQ-044 @req ETNI-822
  it("labels the hero section as an accessible landmark, matched by e2e/home-visual.spec.ts", () => {
    const { container } = render(<HomeHero language="fr" />);
    const section = container.querySelector("section");

    expect(section).toHaveAttribute("aria-label", PRODUCT_NAME);
  });

  // Search and globe must fit by content on a phone; a viewport-height floor
  // is what pushed the globe below the first screen.
  // @req REQ-115 @req ETNI-1404
  it("lets content size the band rather than claiming a viewport height", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/home/HomeHero.tsx"),
      "utf8"
    );

    expect(source).not.toMatch(/\b(?:dvh|svh|vh)\b|min-h-screen/);
  });

  // @req REQ-115 @req ETNI-1404
  it("draws the globe at every width, never hiding it on a phone", () => {
    const { container } = render(<HomeHero language="fr" />);
    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    expect(container.querySelector(".home-hero-globe")).not.toBeNull();
    expect(styles).not.toMatch(/\.home-hero-globe\s*\{[^}]*display:\s*none/);
  });

  // @req REQ-115 @req ETNI-1404
  it("retires the historical map from the interactive hero", () => {
    render(<HomeHero language="fr" />);

    expect(screen.queryByTestId("home-hero-figure")).toBeNull();
    expect(screen.queryByText(/al-Idrisi/i)).toBeNull();
  });

  /**
   * Document order, not direct childhood: the band gained a row wrapper when
   * it gained its second column, and what the reader — or a screen reader
   * walking the band — must meet first is the argument, not the globe.
   * CSS may put the visual wherever the width allows; the source may not.
   */
  // @req REQ-115
  it("keeps the copy first in the band", () => {
    const { container } = render(<HomeHero language="fr" />);
    const copy = container.querySelector(".home-hero-copy");
    const globe = container.querySelector(".home-hero-globe");

    expect(copy).not.toBeNull();
    expect(globe).not.toBeNull();
    expect(
      copy!.compareDocumentPosition(globe!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-115
  it("renders a drawn project image with its alt text and visible credit", () => {
    const image = HOME_HERO_IMAGES[0];

    render(<HomeHero language="fr" visual={{ kind: "image", image }} />);

    expect(screen.getByRole("img", { name: image.alt })).toBeInTheDocument();
    expect(screen.getByText(image.credit)).toBeInTheDocument();
    expect(screen.queryByTestId("home-hero-globe")).not.toBeInTheDocument();
  });

  // @req REQ-115
  it("keeps the interactive globe as the default and as an explicit draw", () => {
    const defaultView = render(<HomeHero language="fr" />);
    expect(screen.getByTestId("home-hero-globe")).toBeInTheDocument();
    defaultView.unmount();

    render(<HomeHero language="fr" visual={{ kind: "globe" }} />);
    expect(screen.getByTestId("home-hero-globe")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  /**
   * The doctrine, in the statement the social series opens on, behind a
   * closed disclosure: the band's job is still the search, and a reader who
   * wants to know what the atlas is for asks for it in one press. A native
   * <details>, so the answer needs no script to open.
   *
   * « Ce peuple n'a pas été divisé » was cut from the home (operator ruling,
   * 2026-09-14); the About chapter the link opens still carries it. The
   * statement runs the copy column's full width rather than the answer's
   * 52ch measure (same ruling).
   */
  // @req REQ-115
  it("keeps the purpose behind a closed disclosure under the answer", () => {
    const { container } = render(<HomeHero language="fr" />);

    const disclosure = screen.getByTestId("home-hero-purpose");
    expect(disclosure.tagName).toBe("DETAILS");
    expect(disclosure).not.toHaveAttribute("open");
    expect(disclosure.querySelector("summary")?.textContent).toBe(
      homePurposeCopy.fr.toggle
    );

    const sentences = within(disclosure)
      .getAllByTestId("home-hero-purpose-sentence")
      .map((sentence) => sentence.textContent);
    expect(sentences).toEqual(homePurposeCopy.fr.sentences);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toMatch(
      /^La plupart des frontières .*moins de cent quarante ans\. Les noms en ont plus de mille\.$/
    );
    expect(disclosure.textContent).not.toMatch(/pas été divisé/);

    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");
    expect(styles).not.toMatch(/\.home-hero-purpose\s*\{[^}]*max-width/);
    // Prose, so the body face at the body step (typography charter §1): in
    // the display face at `lead` it read as a third headline voice on a band
    // that already carries two (operator ruling, 2026-09-14).
    const sentenceRule = styles.match(
      /\.home-hero-purpose-sentence\s*\{([^}]*)\}/
    )?.[1];
    expect(sentenceRule).toMatch(/font-family:\s*var\(--afh-font-body\)/);
    expect(sentenceRule).toMatch(/font-size:\s*var\(--afh-text-body\)/);
    expect(sentenceRule).not.toMatch(/--afh-font-display|--afh-text-lead/);
    expect(styles).not.toMatch(
      /\.home-hero-purpose-sentence\s*\{[^}]*text-wrap:\s*balance/
    );

    expect(disclosure.querySelector("a")).toHaveAttribute(
      "href",
      "/fr/about#about-purpose-title"
    );

    const answer = screen.getByTestId("home-hero-answer");
    const search = screen.getByRole("search");
    expect(
      answer.compareDocumentPosition(disclosure) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      disclosure.compareDocumentPosition(search) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-145
  it("states the purpose in English on the English home", () => {
    render(<HomeHero language="en" />);

    const disclosure = screen.getByTestId("home-hero-purpose");
    expect(disclosure.querySelector("summary")?.textContent).toBe(
      homePurposeCopy.en.toggle
    );
    expect(
      within(disclosure)
        .getAllByTestId("home-hero-purpose-sentence")
        .map((sentence) => sentence.textContent)
    ).toEqual(homePurposeCopy.en.sentences);
  });

  /**
   * The « Saviez-vous » band is gone from the home; its anecdote now takes
   * its turn in the hero's visual slot, whole — headline, prose, the atlas
   * entries it names and its source — rather than as a teaser.
   */
  // @req REQ-115
  it("renders a drawn anecdote whole in the visual slot", () => {
    render(
      <HomeHero language="fr" visual={{ kind: "anecdote", fact: ANECDOTE }} />
    );

    const slot = screen.getByTestId("home-hero-anecdote");
    expect(
      within(slot).getByRole("heading", { level: 2, name: ANECDOTE.headline })
    ).toBeInTheDocument();
    for (const paragraph of ANECDOTE.body) {
      expect(within(slot).getByText(paragraph)).toBeInTheDocument();
    }
    expect(
      within(slot).getByRole("link", { name: /^Pays\s*Cameroun$/ })
    ).toHaveAttribute("href", expect.stringContaining("/fr/"));
    expect(
      within(slot).getByRole("link", { name: ANECDOTE.sources![0].title })
    ).toHaveAttribute("href", ANECDOTE.sources![0].url);
    expect(screen.queryByTestId("home-hero-globe")).not.toBeInTheDocument();
  });

  /**
   * Opening « Notre propos » grows the copy column. Centred, the visual beside
   * it recentred and slid down under the reader's click — a control moving a
   * block it has nothing to do with. Topped, the visual keeps its place
   * whatever the copy column does, for every kind the page draws (operator
   * ruling, 2026-09-14). A whole anecdote had been topped already, for the
   * screen of empty parchment it pushed above the question when centred.
   */
  // @req REQ-115
  it("tops the columns for every visual, so opening the purpose never moves it", () => {
    const { container } = render(<HomeHero language="fr" />);

    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");
    expect(styles).toMatch(
      /@media\s*\(min-width:\s*1200px\)[\s\S]*?\.home-hero-inner\s*\{[^}]*align-items:\s*start/
    );
    const gridRules =
      styles.match(/\.home-hero-inner[\w-]*\s*\{[^}]*\}/g) ?? [];
    expect(gridRules.length).toBeGreaterThan(0);
    for (const rule of gridRules) {
      expect(rule).not.toMatch(/align-items:\s*center/);
    }
  });

  /**
   * The question holds the left column on every request. The side used to be
   * tossed per request, which moved the search — the band's primary action —
   * from one visit to the next (operator ruling, 2026-09-14).
   */
  // @req REQ-115
  it("keeps the question on the left and the visual on the right at desktop", () => {
    const { container } = render(<HomeHero language="fr" />);

    expect(container.querySelector(".home-hero-inner")?.className).not.toMatch(
      /visual-start/
    );
    const styles = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");
    expect(styles).toMatch(
      /@media\s*\(min-width:\s*1200px\)[\s\S]*grid-template-areas:\s*"copy globe"/
    );
    expect(styles).not.toMatch(/"globe copy"/);
  });

  // @req REQ-115
  it("opts the home globe into gentle autoplay", () => {
    render(<HomeHero language="fr" visual={{ kind: "globe" }} />);

    expect(screen.getByTestId("home-globe-stage")).toHaveAttribute(
      "data-autoplay",
      "true"
    );
  });

  // @req REQ-112 REQ-115
  it("keeps the costly WebGL upgrade behind the reader's explicit action", () => {
    render(<HomeHero language="fr" visual={{ kind: "globe" }} />);

    expect(screen.getByTestId("home-globe-stage")).toHaveAttribute(
      "data-activation",
      "explicit"
    );
  });
});
