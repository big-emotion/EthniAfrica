import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiscoveryReader } from "@/components/discoveries/DiscoveryReader";
import type { DiscoveryPublication } from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { getCountryRoute, getPeopleRoute } from "@/lib/routing";

// The photo, browsing and sharing suites below walk the two photographed
// anecdotes in a known order; the proverbs have their own suite at the end.
const publications = getDiscoveryPublications().filter(
  (entry) => entry.kind === "anecdote"
);

const proverbPublication: DiscoveryPublication = {
  id: "proverb:test",
  kind: "proverb",
  status: "published",
  slug: { fr: "proverbe-test", en: "proverb-test" },
  title: { fr: "Texte du proverbe.", en: "Proverb text." },
  description: { fr: "Ce que dit le proverbe.", en: "What it says." },
  original: { text: "Ọ̀rọ̀ àtijọ́", lang: "yor" },
  source: {
    title: "Recueil publié",
    url: "https://example.org/recueil",
    tier: "referenced",
  },
  detail: {
    body: { fr: ["Ce que dit le proverbe."], en: ["What it says."] },
    entities: [],
    sources: [{ title: "Recueil publié", url: "https://example.org/recueil" }],
  },
};

afterEach(() => {
  vi.useRealTimers();
});

describe("Découvertes photo frame", () => {
  // @req REQ-156
  it("keeps one sourced photo and its editorial title in each browsable publication", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );

    const frames = screen.getAllByRole("article");
    expect(frames).toHaveLength(2);
    expect(frames[0]).toHaveAttribute(
      "data-publication-id",
      "anecdote:burkina-faso"
    );
    expect(frames[0].querySelector("img")?.getAttribute("src")).toMatch(
      /\/images\/anecdotes\/burkina-faso\.jpg$/
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Burkina Faso"
    );
    expect(screen.getByText(/W. Mittelholzer/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "En savoir plus" })
    ).toBeInTheDocument();
  });

  // @req REQ-156
  it("keeps an offscreen photo credit out of keyboard tab order", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    const credits = screen
      .getAllByRole("article")
      .map((article) => within(article).getByRole("link"));
    expect(credits[0]).toHaveAttribute("tabindex", "0");
    expect(credits[1]).toHaveAttribute("tabindex", "-1");
    fireEvent.click(
      screen.getByRole("button", { name: "Découverte suivante" })
    );
    expect(credits[0]).toHaveAttribute("tabindex", "-1");
    expect(credits[1]).toHaveAttribute("tabindex", "0");
  });

  // @req REQ-156
  it("keeps a readable publication without implying that a failed photo loaded", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    const first = screen.getAllByRole("article")[0];
    fireEvent.error(within(first).getByRole("img", { name: /Vue aérienne/ }));
    expect(within(first).getByText(/Photo indisponible/)).toBeInTheDocument();
    expect(within(first).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Burkina Faso"
    );
    expect(
      within(first).queryByRole("link", { name: /W. Mittelholzer/ })
    ).not.toBeInTheDocument();
  });
});

describe("Découvertes browsing", () => {
  // @req REQ-156
  it("does not force smooth motion when the reader requests reduced motion", () => {
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    try {
      render(
        <DiscoveryReader
          language="fr"
          publications={publications}
          initialId="anecdote:burkina-faso"
        />
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Découverte suivante" })
      );
      expect(scroll).toHaveBeenCalledWith({
        behavior: "instant",
        block: "start",
      });
    } finally {
      window.matchMedia = original;
    }
  });

  // @req REQ-156
  it("lets a keyboard reader move through the finite deck", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.history.replaceState(
      {},
      "",
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    const feed = screen.getByLabelText("Découvertes", { selector: "div" });
    fireEvent.keyDown(feed, { key: "ArrowDown" });
    expect(window.location.pathname).toBe("/fr/decouvertes/guere-krahn-we");
    fireEvent.keyDown(feed, { key: "ArrowDown" });
    expect(
      screen.getByRole("button", { name: "Découverte suivante" })
    ).toBeDisabled();
  });

  // @req REQ-158
  it("updates the exact URL after a settled vertical scroll and restores history", () => {
    vi.useFakeTimers();
    const scroll = vi.fn();
    HTMLElement.prototype.scrollIntoView = scroll;
    window.history.replaceState(
      {},
      "",
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    const feed = screen.getByLabelText("Découvertes", { selector: "div" });
    const cards = screen.getAllByRole("article");
    Object.defineProperty(cards[0], "offsetTop", { value: 0 });
    Object.defineProperty(cards[1], "offsetTop", { value: 500 });
    Object.defineProperty(feed, "scrollTop", {
      value: 500,
      configurable: true,
    });
    fireEvent.scroll(feed);
    act(() => vi.advanceTimersByTime(150));
    expect(window.location.pathname).toBe("/fr/decouvertes/guere-krahn-we");
    expect(screen.getByText("2 sur 2")).toBeInTheDocument();

    window.history.replaceState(
      {},
      "",
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    fireEvent.popState(window);
    expect(screen.getByText("1 sur 2")).toBeInTheDocument();
    expect(scroll).toHaveBeenCalled();
  });

  // @req REQ-158
  it("keeps browser and social metadata aligned with the active URL", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.history.replaceState(
      {},
      "",
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    document.head.innerHTML = `<title>Burkina</title>
      <meta name="description" content="Burkina">
      <link rel="canonical" href="https://ethniafrica.com/fr/decouvertes/burkina-faso-trois-langues">
      <link rel="alternate" hreflang="fr" href="https://ethniafrica.com/fr/decouvertes/burkina-faso-trois-langues">
      <link rel="alternate" hreflang="x-default" href="https://ethniafrica.com/fr/decouvertes/burkina-faso-trois-langues">
      <meta property="og:title" content="Burkina">
      <meta property="og:description" content="Burkina">
      <meta property="og:url" content="https://ethniafrica.com/fr/decouvertes/burkina-faso-trois-langues">
      <meta property="og:image" content="https://ethniafrica.com/images/anecdotes/burkina-faso.jpg">
      <meta name="twitter:title" content="Burkina">
      <meta name="twitter:description" content="Burkina">
      <meta name="twitter:image" content="https://ethniafrica.com/images/anecdotes/burkina-faso.jpg">`;
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Découverte suivante" })
    );
    const guere = publications.find(
      (entry) => entry.id === "anecdote:guere-wobe"
    )!;
    expect(document.title).toBe(guere.title.fr);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://ethniafrica.com/fr/decouvertes/guere-krahn-we"
    );
    expect(
      document.querySelector('link[rel="alternate"][hreflang="fr"]')
    ).toHaveAttribute(
      "href",
      "https://ethniafrica.com/fr/decouvertes/guere-krahn-we"
    );
    expect(
      document.querySelector('link[rel="alternate"][hreflang="x-default"]')
    ).toHaveAttribute(
      "href",
      "https://ethniafrica.com/fr/decouvertes/guere-krahn-we"
    );
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `https://ethniafrica.com${guere.image.src}`
    );
    expect(
      document.querySelector('meta[name="twitter:title"]')
    ).toHaveAttribute("content", guere.title.fr);

    window.history.replaceState(
      {},
      "",
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    fireEvent.popState(window);
    expect(document.title).toBe(publications[0].title.fr);
  });
});

describe("Découvertes details", () => {
  // @req REQ-157
  it("opens the selected publication's full source, image provenance and atlas targets", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "En savoir plus" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Thomas Sankara le proclame/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Burkina Faso" })).toHaveAttribute(
      "href",
      getCountryRoute("fr", "BFA")
    );
    expect(screen.getByRole("link", { name: /Jeune Afrique/ })).toHaveAttribute(
      "href",
      expect.stringContaining("jeuneafrique.com")
    );
    expect(
      screen.getByRole("link", { name: "Photo originale" })
    ).toHaveAttribute("href", expect.stringContaining("commons.wikimedia.org"));
  });
});

describe("Découvertes saved retrieval", () => {
  // @req REQ-159
  it("keeps the selected publication and retrieves its exact link after remount", () => {
    window.localStorage.clear();
    const view = render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Conserver" }));
    expect(
      screen.getByRole("button", { name: "Conservé" })
    ).toBeInTheDocument();
    view.unmount();

    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:guere-wobe"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Mes découvertes" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: /Burkina Faso/ })
    ).toHaveAttribute("href", "/fr/decouvertes/burkina-faso-trois-langues");
  });

  // @req REQ-159
  it("makes failed durable storage explicit", () => {
    window.localStorage.clear();
    const failure = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("storage unavailable");
      });
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Conserver" }));
    expect(
      screen.getByText(/uniquement pendant cette visite/)
    ).toBeInTheDocument();
    failure.mockRestore();
  });
});

describe("Découvertes sharing", () => {
  // @req REQ-160
  it("freezes the exact selected link while its ten truthful choices are open", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.history.replaceState(
      {},
      "",
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Partager" }));
    const dialog = screen.getByRole("dialog");
    const choices = within(dialog).getAllByTestId(/^share-choice-/);
    expect(choices).toHaveLength(10);
    for (const choice of choices) {
      expect(
        choice.querySelector("svg[aria-hidden='true']")
      ).toBeInTheDocument();
    }
    expect(
      within(dialog).getByRole("link", { name: /WhatsApp/ })
    ).toHaveAttribute(
      "href",
      expect.stringContaining("burkina-faso-trois-langues")
    );
    const feed = screen.getByLabelText("Découvertes", { selector: "div" });
    fireEvent.keyDown(feed, { key: "ArrowDown" });
    expect(window.location.pathname).toBe("/fr/decouvertes/guere-krahn-we");
    expect(
      within(dialog).getByText(/burkina-faso-trois-langues/)
    ).toBeInTheDocument();
  });

  // @req REQ-160
  it("copies the publication permalink and reports a real clipboard failure", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Partager" }));
    fireEvent.click(screen.getByRole("button", { name: "Copier le lien" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Copie impossible"
    );
    expect(writeText).toHaveBeenCalledWith(
      "https://ethniafrica.com/fr/decouvertes/burkina-faso-trois-langues"
    );
  });
});

describe("Découvertes proverb frame", () => {
  // Filed under its own kicker — « Saviez-vous que ? » over a proverb would
  // call a people's saying a fact — and declared in its own language.
  // @req REQ-157
  it("files a proverb as a proverb, in its own language, with no photo to credit", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[proverbPublication]}
        initialId="proverb:test"
      />
    );

    const card = screen.getByRole("article");
    expect(within(card).getByText("Proverbe")).toBeInTheDocument();
    expect(within(card).getByText("Ọ̀rọ̀ àtijọ́")).toHaveAttribute("lang", "yor");
    expect(within(card).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Texte du proverbe."
    );
    expect(within(card).queryByText(/Photo/)).not.toBeInTheDocument();
    expect(within(card).queryAllByRole("link")).toEqual([]);
  });

  // @req REQ-157
  it("opens a proverb's sources without an image provenance it does not have", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[proverbPublication]}
        initialId="proverb:test"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "En savoir plus" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("link", { name: "Recueil publié" })
    ).toHaveAttribute("href", "https://example.org/recueil");
    expect(
      within(dialog).queryByRole("link", { name: "Photo originale" })
    ).not.toBeInTheDocument();
  });
});

const imagePublication: DiscoveryPublication = {
  id: "image:test",
  kind: "image",
  status: "published",
  collection: "autonymes",
  slug: { fr: "image-test", en: "image-test-en" },
  title: { fr: "Les Kikuyu disent Agĩkũyũ", en: "The Kikuyu say Agĩkũyũ" },
  description: { fr: "Un autonyme.", en: "An autonym." },
  source: {
    title: "Grammaire kikuyu publiée",
    url: "https://example.org/grammaire",
    tier: "referenced",
  },
  image: {
    src: "/images/discoveries/image-test.png",
    credit: "EthniAfrica",
    alt: { fr: "Un marché au crépuscule.", en: "A market at dusk." },
    licence: "cc-by-sa",
  },
  generation: {
    tool: "Outil de test",
    model: "modele-test-2",
    jobId: "job-123",
    generatedOn: "2026-09-12",
    sourceKind: "ai_generated",
  },
  caption: {
    fr: "Une interprétation d’un marché kikuyu.",
    en: "An interpretation of a Kikuyu market.",
  },
  captionExceedsCorpus: true,
  captionSource: {
    title: "Étude du marché publiée",
    url: "https://example.org/marche",
  },
  detail: {
    body: { fr: ["Ce que dit l’autonyme."], en: ["What the autonym says."] },
    entities: [
      {
        kind: "people",
        id: "PPL_KIKUYU",
        label: { fr: "Kikuyu", en: "Kikuyu" },
      },
    ],
    sources: [
      {
        title: "Grammaire kikuyu publiée",
        url: "https://example.org/grammaire",
      },
    ],
  },
};

describe("Découvertes generated image", () => {
  // The label sits where the kind eyebrow sits, so the reader learns the
  // picture is generated before reading anything the picture seems to claim.
  // @req REQ-165
  it("labels a generated image on its card without opening the detail sheet", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[imagePublication]}
        initialId="image:test"
      />
    );

    const card = screen.getByRole("article");
    expect(within(card).getByText("Image générée")).toBeVisible();
    expect(
      within(card).queryByText("Saviez-vous que ?")
    ).not.toBeInTheDocument();
    expect(
      within(card).getByText("Une interprétation d’un marché kikuyu.")
    ).toBeInTheDocument();
    expect(within(card).queryByText(/Photo/)).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // @req REQ-165
  it("states what a generated image rests on in its detail sheet", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[imagePublication]}
        initialId="image:test"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "En savoir plus" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/interprétation/i)).toBeInTheDocument();
    expect(within(dialog).getByText("Outil de test")).toBeInTheDocument();
    expect(within(dialog).getByText("modele-test-2")).toBeInTheDocument();
    expect(within(dialog).getByText("12 septembre 2026")).toBeInTheDocument();
    expect(within(dialog).getByText(/CC BY-SA 4\.0/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Kikuyu" })
    ).toHaveAttribute("href", getPeopleRoute("fr", "PPL_KIKUYU"));
    expect(
      within(dialog).getByRole("link", { name: "Grammaire kikuyu publiée" })
    ).toHaveAttribute("href", "https://example.org/grammaire");
    expect(
      within(dialog).getByRole("link", { name: "Étude du marché publiée" })
    ).toHaveAttribute("href", "https://example.org/marche");
    expect(
      within(dialog).queryByRole("link", { name: "Photo originale" })
    ).not.toBeInTheDocument();
  });

  // A licence is published, not named (brand charter §9): the sheet links the
  // licence's URI, the publication's own when it records one.
  // @req REQ-165
  it("publishes the licence URI of a generated image in its detail sheet", () => {
    const { unmount } = render(
      <DiscoveryReader
        language="fr"
        publications={[imagePublication]}
        initialId="image:test"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "En savoir plus" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: "Lire la licence",
      })
    ).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/"
    );
    unmount();

    render(
      <DiscoveryReader
        language="en"
        publications={[
          {
            ...imagePublication,
            image: {
              ...imagePublication.image,
              licenceUrl: "https://example.org/licence",
            },
          },
        ]}
        initialId="image:test"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: "Read the licence",
      })
    ).toHaveAttribute("href", "https://example.org/licence");
  });

  // @req REQ-165
  it("renders the generated-image label and provenance in English from the English dictionary", () => {
    render(
      <DiscoveryReader
        language="en"
        publications={[{ ...imagePublication, captionExceedsCorpus: false }]}
        initialId="image:test"
      />
    );

    const card = screen.getByRole("article");
    expect(within(card).getByText("Generated image")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("September 12, 2026")).toBeInTheDocument();
    expect(within(dialog).getByText(/CC BY-SA 4\.0/)).toBeInTheDocument();
    expect(within(dialog).queryByText("Image générée")).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("link", { name: "Étude du marché publiée" })
    ).not.toBeInTheDocument();
  });
});
