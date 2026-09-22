import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutPageContent from "../AboutPageContent";
import {
  ACCESS_MODE_LABELS,
  ACCESS_MODES,
  MODULE_DEFINITIONS,
} from "@/lib/hubs/moduleRegistry";
import { modulesNamedIn } from "@/test/axisModuleVocabulary";
import { getLocalizedRoute, type PageType } from "@/lib/routing";

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

describe("AboutPageContent (REQ-132)", () => {
  // @req REQ-145
  it("renders the project overview and navigation in English", () => {
    render(<AboutPageContent language="en" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "About" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("about-overview")).toHaveTextContent(
      /EthniAfrica tells Africa through its names/i
    );
    expect(screen.getByRole("link", { name: "how we write" })).toHaveAttribute(
      "href",
      getLocalizedRoute("en", "doctrine")
    );
    expect(screen.getByText("Three ways in")).toBeInTheDocument();
  });

  // The opening sentence is where a reader decides what this is. It used to
  // list what the project holds — peoples, then languages, then names third —
  // which is an inventory, and reads as an encyclopaedia without ever using
  // the word. The subject is what a name carries, with its sources; the rest is
  // what those names are.
  // @req REQ-132
  it("opens on what a name carries, not on what the project holds", () => {
    renderAbout();

    expect(
      screen.getByRole("heading", { level: 1, name: "À propos" })
    ).toBeTruthy();

    const overview = screen.getByTestId("about-overview");
    expect(overview).toHaveTextContent(/EthniAfrica/);
    expect(overview).toHaveTextContent(/l’Afrique à travers ses noms/i);
  });

  /**
   * Derived from the registry rather than written out, which is the whole
   * point: the hand-kept list said five for as long as the corpus had six.
   * Langue shipped, then Nom shipped, and this page — the one that answers
   * "what is in EthniAfrica" — went on naming the four it opened with plus
   * Appellations.
   *
   * The criterion is a corpus class, not an atlas module: `recherche` is on
   * the axis and is a way in, not a thing the corpus holds, and it is the one
   * atlas module with no `dataSource`.
   */
  // @req REQ-132
  it("gives every corpus class of the atlas a card", () => {
    renderAbout();

    const families = screen.getByTestId("about-content-families");
    const corpusClasses = MODULE_DEFINITIONS.filter(
      (module) => module.accessMode === "atlas" && module.dataSource
    );

    expect(corpusClasses.length).toBeGreaterThanOrEqual(6);

    for (const corpusClass of corpusClasses) {
      const href = getLocalizedRoute("fr", corpusClass.page as PageType);
      const links = within(families)
        .getAllByRole("link")
        .filter((link) => link.getAttribute("href") === href);

      expect(links.length, `no card links to ${href}`).toBeGreaterThan(0);
    }
  });

  // Doctrine moved out of the footer's "Le projet" rubric and into this
  // overview (2026-09-05): one place a reader meets the project description
  // is one place they meet how it is governed, rather than a fifth footer
  // link past four others describing the same project.
  // @req REQ-132
  it("links to the editorial doctrine from the overview", () => {
    renderAbout();

    const overview = screen.getByTestId("about-overview");

    expect(
      within(overview).getByRole("link", { name: "comment on écrit" })
    ).toHaveAttribute("href", getLocalizedRoute("fr", "doctrine"));
  });

  /**
   * The page carried no picture at all once the naming argument was cut, and
   * a page of nothing but prose is what the operator asked to stop. Each
   * chapter now opens on a document it is about — never a stock photograph of
   * the continent, which would substitute for none of them.
   */
  // @req REQ-132
  it("opens each chapter with a plate, and describes it for a reader who cannot see it", () => {
    const { container } = renderAbout();

    const plates = Array.from(container.querySelectorAll("figure"));

    expect(plates).toHaveLength(3);
    for (const plate of plates) {
      const image = within(plate as HTMLElement).getByRole("img");
      expect(image.getAttribute("alt")?.length ?? 0).toBeGreaterThan(30);
    }
    expect(
      new Set(
        plates.map((plate) => plate.querySelector("img")?.getAttribute("src"))
      ).size
    ).toBe(3);
  });

  /**
   * "A licence is published, not named" (brand charter §9). The tifinagh
   * photograph is CC BY-SA 2.0, whose §4(a) asks for the licence's own URI —
   * and a notice a reader cannot reach is not a notice. This is the one line
   * on the page that is not editorial discretion.
   */
  // @req REQ-132
  it("publishes the licence of the one plate that requires attribution", () => {
    renderAbout();

    const credit = screen.getByTestId("plate-credit-tifinagh");

    expect(credit).toHaveTextContent("Patrick Gruban");
    expect(
      within(credit).getByRole("link", { name: "CC BY-SA 2.0" })
    ).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/2.0/"
    );
    expect(
      within(credit).getByRole("link", { name: "Wikimedia Commons" })
    ).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/wiki/File:Tifinagh_Algeria.jpg"
    );
  });

  /**
   * "Fiche" and "corpus" are workshop words. A visitor does not know what
   * either means, and neither was load-bearing — it was the workshop talking
   * to itself in front of the reader. Asserted rather than trusted, because
   * one careless sentence puts them back.
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

      unmount();
    }
  });

  /**
   * The three-block naming argument was the longest stretch of prose on the
   * page and it sat between two chapters. Cut on 11 September 2026: the page
   * asked for more reading than a visitor gives it, and the three numbered
   * chapters carry the same job in a quarter of the words.
   */
  // @req REQ-132
  it("runs the three chapters back to back, with no prose block between them", () => {
    const { container } = renderAbout();

    const overview = screen.getByTestId("about-overview");
    const chapters = screen.getByTestId("about-content-families");

    expect(
      overview.compareDocumentPosition(chapters) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      container.querySelectorAll('[data-testid="home-purpose-blocks"]')
    ).toHaveLength(0);
  });

  /**
   * A reader told the project on 9 September 2026 that its goal was not
   * perceptible: the page described what the corpus holds and never said what
   * it sets out to change. The purpose chapter answers that, and it opens the
   * page — a statement of contents is not a statement of intent.
   */
  // @req REQ-132
  it("opens the chapters with what the atlas sets out to change", () => {
    renderAbout();

    const purposeChapter = screen.getByTestId("about-purpose");
    const corpus = screen.getByTestId("about-content-families");

    expect(purposeChapter).toHaveTextContent(
      /Nous ne jugeons personne\. Nous racontons les noms\./
    );
    expect(
      purposeChapter.compareDocumentPosition(corpus) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  /**
   * The claim is a commitment the project makes, not a finding the corpus
   * establishes, and an atlas that sells its provenance cannot print it
   * unlabelled. Same doctrine as the Source Tier policy: nothing is
   * forbidden, everything is labelled.
   */
  // @req REQ-132
  it("marks the central claim as the project's position rather than a corpus finding", () => {
    renderAbout();

    const status = screen.getByTestId("about-purpose-claim-status");

    expect(status).toHaveTextContent(/un engagement/i);
    expect(status).toHaveTextContent(/pas un résultat de nos recherches/i);
  });

  /**
   * Each scale answers "for whose benefit" with something the corpus can be
   * held to, not with an intention. The figures were measured from
   * `distributionByCountry` on 11 September 2026, macro-groups excluded.
   */
  // @req REQ-132
  it("grounds each scale of the purpose in a figure or a rule the corpus carries", () => {
    renderAbout();

    const purposeChapter = screen.getByTestId("about-purpose");

    expect(purposeChapter).toHaveTextContent(/le nom qu’il se donne/i);
    expect(purposeChapter).toHaveTextContent(/La Tanzanie en compte 95/);
    expect(purposeChapter).toHaveTextContent(
      /la France est déjà dans la liste de leurs pays/i
    );
    expect(purposeChapter).toHaveTextContent(/191 peuples/);
    expect(purposeChapter).toHaveTextContent(/Compté le 11 septembre 2026/i);
  });

  // @req REQ-145
  it("carries the purpose chapter in English too", () => {
    render(<AboutPageContent language="en" />);

    const purposeChapter = screen.getByTestId("about-purpose");

    expect(purposeChapter).toHaveTextContent(
      /We judge no one\. We tell the names\./
    );
    expect(screen.getByTestId("about-purpose-claim-status")).toHaveTextContent(
      /a commitment, not a result of our research/i
    );
    expect(purposeChapter).toHaveTextContent(/191 peoples/);
  });

  /**
   * The claim alone told a reader what the project commits to and not what
   * that commitment costs. The declaration is the five parts it rests on
   * (docs/editorial/purpose-doctrine.md): a name is never fixed, the source
   * closest to the autonym counts most, the gaps still weigh, nobody is being
   * singled out, and what the atlas is after is understanding.
   */
  // @req REQ-132
  it("publishes the full declaration inside the purpose chapter", () => {
    renderAbout();

    const declaration = within(screen.getByTestId("about-purpose")).getByTestId(
      "about-declaration"
    );

    expect(declaration).toHaveTextContent(/Un nom n’est jamais figé/);
    expect(declaration).toHaveTextContent(/Plusieurs noms peuvent coexister/);
    expect(declaration).toHaveTextContent(
      /peut ensuite devenir une appartenance réellement vécue/
    );
    expect(declaration).toHaveTextContent(/La pertinence d’une source/);
    expect(declaration).toHaveTextContent(
      /La pertinence d’une source dépend de la question posée/
    );
    expect(declaration).toHaveTextContent(/Ces écarts pèsent encore/);
    expect(declaration).toHaveTextContent(
      /Comprendre l’histoire d’un nom peut éclairer un désaccord/
    );
    expect(declaration).toHaveTextContent(/Personne n’est visé/);
    expect(declaration).toHaveTextContent(
      /Nous nommons les acteurs lorsque les sources établissent leur rôle/
    );
    expect(declaration).toHaveTextContent(/Ce que nous cherchons/);
    expect(declaration).toHaveTextContent(
      /l’appeler comme il s’appelle ne retire rien à personne/
    );
  });

  /**
   * The corrections are the doctrine, so they are published with their
   * reasons: a refused sentence printed without why reads as a taboo, and a
   * reason without the sentence it answers reads as a lecture.
   */
  // @req REQ-132
  it("names the three sentences the atlas does not write, each with its reason", () => {
    renderAbout();

    const refusals = screen.getByTestId("about-declaration-refusals");
    const items = within(refusals).getAllByRole("listitem");

    expect(items).toHaveLength(4);
    expect(refusals).toHaveTextContent(
      /Avant, on vivait en accord avec le continent/
    );
    expect(refusals).toHaveTextContent(/Les frontières sont arbitraires/);
    expect(refusals).toHaveTextContent(/Renouer avec le passé/);
    expect(refusals).toHaveTextContent(/reconnaître ce qui n’a jamais cessé/);
    expect(refusals).toHaveTextContent(
      /Avant les frontières, les peuples étaient unis/
    );
    expect(refusals).toHaveTextContent(
      /La frontière n’a pas toujours créé la séparation/
    );
    for (const item of items) {
      expect(
        item.querySelector('[data-role="reason"]')?.textContent?.trim()
      ).toBeTruthy();
    }
  });

  // @req REQ-145
  it("carries the declaration in English too", () => {
    render(<AboutPageContent language="en" />);

    const declaration = screen.getByTestId("about-declaration");

    expect(declaration).toHaveTextContent(/A name is never fixed/);
    expect(declaration).toHaveTextContent(/Several names can coexist/);
    expect(declaration).toHaveTextContent(
      /can later become a real, lived belonging/
    );
    expect(declaration).toHaveTextContent(
      /A source's relevance depends on the question being asked/
    );
    expect(
      within(screen.getByTestId("about-declaration-refusals")).getAllByRole(
        "listitem"
      )
    ).toHaveLength(4);
  });

  /**
   * A second doctrine session (purpose-doctrine.md §5, 14 September 2026)
   * separated a unity position from the constant ligne de vision: it must
   * read as its own labelled conviction, not folded into `claim`.
   */
  // @req REQ-132
  it("publishes the unity vision as a position separate from the constant ligne de vision", () => {
    renderAbout();

    const unityClaim = screen.getByTestId("about-purpose-unity-claim");
    const status = screen.getByTestId("about-purpose-unity-claim-status");

    expect(unityClaim).toHaveTextContent(
      /Ce qui relie les peuples d’Afrique a survécu à leurs propres ruptures/
    );
    expect(status).toHaveTextContent(/notre conviction/i);
    expect(status).toHaveTextContent(/pas une mesure qu’il produit/i);
  });

  // @req REQ-145
  it("carries the unity vision in English too", () => {
    render(<AboutPageContent language="en" />);

    expect(screen.getByTestId("about-purpose-unity-claim")).toHaveTextContent(
      /What connects Africa’s peoples has survived their own ruptures/
    );
    expect(
      screen.getByTestId("about-purpose-unity-claim-status")
    ).toHaveTextContent(/our conviction/i);
  });

  // Trimmed 2026-09-01: the example-country cards ("Ce que contient une
  // fiche"), the interactive access cards ("Par où commencer") and the
  // About/Doctrine distinction ("03 · La méthode") each duplicated a block
  // sitting right next to them. This test replaces
  // "places the corpus synthesis before the existing three access axes" and
  // "preserves the access framing around one interactive axis-card set".
  // @req REQ-132
  it("names the three access modes as a static list, with nothing else duplicating them", () => {
    renderAbout();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Trois manières d’entrer",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Chercher quelque chose de précis, lire une histoire, ou jouer.",
        { exact: true }
      )
    ).toBeInTheDocument();

    const staticItems = screen.getByTestId("about-access-mode-list");
    for (const name of Object.values(ACCESS_MODE_LABELS)) {
      expect(within(staticItems).getByText(name)).toBeInTheDocument();
    }

    expect(screen.queryByTestId("home-synthesis-rail")).toBeNull();
    expect(screen.queryByTestId("access-axes")).toBeNull();
    expect(screen.queryByTestId("about-doctrine-distinction")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: /Sources/i })
    ).not.toBeInTheDocument();
  });

  // The About page describes the three axes to a reader who has not opened
  // the header menu, so it owes the same answer the panel owes: what is
  // actually behind each entry, not the frame of mind that leads there.
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

  // @req REQ-132
  it("keeps one valid H1 → H2 → H3 document outline", () => {
    const { container } = renderAbout();
    const levels = headingLevels(container);

    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expectNoSkippedHeadingLevels(levels);
  });

  // @req REQ-132
  it("declares mobile-first grids that widen at tablet and editorial desktop", () => {
    renderAbout();

    const families = screen.getByTestId("about-content-families");
    expect(families.className).toMatch(/grid-cols-1/);
    expect(families.className).toMatch(/min-\[720px\]:grid-cols-2/);
    expect(families.className).toMatch(/min-\[1240px\]:grid-cols-5/);

    const accessModes = screen.getByTestId("about-access-mode-list");
    expect(accessModes.className).toMatch(/grid-cols-1/);
    expect(accessModes.className).toMatch(/min-\[720px\]:grid-cols-3/);
  });
});
