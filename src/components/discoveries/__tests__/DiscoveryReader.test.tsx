import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DiscoveryReader } from "@/components/discoveries/DiscoveryReader";
import type { DiscoveryPublication } from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { ConsentProvider } from "@/hooks/use-consent";
import { DISCOVERY_VIDEOS, videoPublications } from "@/lib/discoveries/videos";
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

const generatedFiles = {
  "9:16": "/images/discoveries/generated/hausa-autonym/9x16.jpg",
  "4:5": "/images/discoveries/generated/hausa-autonym/4x5.jpg",
  "1:1": "/images/discoveries/generated/hausa-autonym/1x1.jpg",
};

const generatedPublication: DiscoveryPublication = {
  id: "image:hausa-autonym",
  kind: "image",
  status: "published",
  slug: { fr: "hausa-autonyme", en: "hausa-autonym" },
  title: { fr: "Hausa, le nom qu’ils se donnent", en: "Hausa, their own name" },
  description: { fr: "Une image générée.", en: "A generated image." },
  source: {
    title: "Fiche Haoussa",
    url: "https://example.org/hausa",
    tier: "referenced",
  },
  image: {
    src: "/images/discoveries/generated/hausa-autonym/4x5.jpg",
    credit: "EthniAfrica, CC BY-SA 4.0",
    licence: "cc-by-sa",
  },
  downloads: generatedFiles,
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
    expect(
      within(screen.getByRole("dialog")).getByText("Sources et contexte")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/une ordonnance du 2 août 1984/i)
    ).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Garder" }));
    expect(screen.getByRole("button", { name: "Gardé" })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Garder" }));
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

describe("Découvertes generated image downloads", () => {
  // @req REQ-166
  it("offers each pre-rendered format by name beside the ten link choices, for the publication being shared", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    render(
      <DiscoveryReader
        language="fr"
        publications={[generatedPublication, proverbPublication]}
        initialId="image:hausa-autonym"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Partager" }));
    const dialog = screen.getByRole("dialog");

    const expected = [
      [/^9:16 · Story et Reel\s*1080 × 1920/, generatedFiles["9:16"]],
      [/^4:5 · Publication\s*1080 × 1350/, generatedFiles["4:5"]],
      [/^1:1 · Photo de profil\s*1080 × 1080/, generatedFiles["1:1"]],
    ] as const;
    const downloads = within(dialog).getByRole("region", {
      name: "Télécharger l’image",
    });
    expect(within(downloads).getAllByRole("link")).toHaveLength(3);
    for (const [name, href] of expected) {
      const link = within(downloads).getByRole("link", { name });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("download");
    }
    expect(within(dialog).getAllByTestId(/^share-choice-/)).toHaveLength(10);

    fireEvent.keyDown(
      screen.getByLabelText("Découvertes", { selector: "div" }),
      {
        key: "ArrowDown",
      }
    );
    expect(
      within(dialog).getByRole("link", { name: /^1:1 · Photo de profil/ })
    ).toHaveAttribute("href", generatedFiles["1:1"]);
  });

  // @req REQ-166
  it("leaves out a format whose file is absent without announcing anything", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[
          {
            ...generatedPublication,
            downloads: {
              "9:16": generatedFiles["9:16"],
              "4:5": generatedFiles["4:5"],
            },
          },
        ]}
        initialId="image:hausa-autonym"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Partager" }));
    const dialog = screen.getByRole("dialog");

    const downloads = within(dialog).getByRole("region", {
      name: "Télécharger l’image",
    });
    expect(
      within(downloads)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href"))
    ).toEqual([generatedFiles["9:16"], generatedFiles["4:5"]]);
    expect(within(dialog).queryByText(/1:1/)).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("status")).not.toBeInTheDocument();
  });

  // @req REQ-166
  it("offers no download for a photographed anecdote", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={publications}
        initialId="anecdote:burkina-faso"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Partager" }));
    expect(
      within(screen.getByRole("dialog")).queryByRole("region", {
        name: "Télécharger l’image",
      })
    ).not.toBeInTheDocument();
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

const carouselPublication: DiscoveryPublication = {
  id: "carousel:guinee",
  kind: "carousel",
  status: "published",
  slug: { fr: "guinee-trois-recits", en: "guinea-three-accounts" },
  title: { fr: "Guinée, trois récits", en: "Guinea, three accounts" },
  description: {
    fr: "Ce que le nom raconte.",
    en: "What the name tells.",
  },
  source: {
    title: "Fiche Guinée",
    url: "https://example.org/guinee",
    tier: "referenced",
  },
  image: {
    src: "/images/discoveries/carousel/guinee/1.jpg",
    credit: "EthniAfrica, CC BY-SA 4.0",
    licence: "cc-by-sa",
  },
  carousel: {
    frames: [
      {
        src: "/images/discoveries/carousel/guinee/1.jpg",
        width: 1080,
        height: 1350,
        alt: { fr: "Première carte", en: "First card" },
      },
      {
        src: "/images/discoveries/carousel/guinee/2.jpg",
        width: 1080,
        height: 1350,
        alt: { fr: "Deuxième carte", en: "Second card" },
      },
      {
        src: "/images/discoveries/carousel/guinee/3.jpg",
        width: 1080,
        height: 1350,
        alt: { fr: "Troisième carte", en: "Third card" },
      },
    ],
  },
};

describe("Découvertes carousel frame", () => {
  // @req REQ-156
  it("puts every frame of the series in one track, each described in the reader's language", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[carouselPublication]}
        initialId={carouselPublication.id}
      />
    );

    const track = screen.getByRole("group", {
      name: "Images de cette découverte",
    });
    expect(
      within(track)
        .getAllByRole("img")
        .map((frame) => frame.getAttribute("alt"))
    ).toEqual(["Première carte", "Deuxième carte", "Troisième carte"]);
  });

  // The dots say "there is more sideways" to a reader who can see them. A
  // reader who cannot gets the same fact as a sentence, or gets nothing.
  // @req REQ-156
  it("announces which frame is showing, and how many there are", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[carouselPublication]}
        initialId={carouselPublication.id}
      />
    );

    expect(screen.getByText("Image 1 sur 3")).toBeTruthy();
  });

  // @req REQ-156
  it("moves through the frames with the horizontal arrows, and stops at both ends", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    render(
      <DiscoveryReader
        language="fr"
        publications={[carouselPublication]}
        initialId={carouselPublication.id}
      />
    );
    const feed = screen.getByLabelText("Découvertes", { selector: "div" });

    fireEvent.keyDown(feed, { key: "ArrowLeft" });
    expect(screen.getByText("Image 1 sur 3")).toBeTruthy();

    fireEvent.keyDown(feed, { key: "ArrowRight" });
    expect(screen.getByText("Image 2 sur 3")).toBeTruthy();

    fireEvent.keyDown(feed, { key: "ArrowRight" });
    fireEvent.keyDown(feed, { key: "ArrowRight" });
    expect(screen.getByText("Image 3 sur 3")).toBeTruthy();
  });

  // The vertical deck and the horizontal series share one key handler, and a
  // frame move must not also move the publication.
  // @req REQ-156
  it("leaves the deck's own vertical keys to the deck", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.history.replaceState({}, "", "/fr/decouvertes/guinee-trois-recits");
    render(
      <DiscoveryReader
        language="fr"
        publications={[carouselPublication, ...publications]}
        initialId={carouselPublication.id}
      />
    );
    const feed = screen.getByLabelText("Découvertes", { selector: "div" });

    fireEvent.keyDown(feed, { key: "ArrowRight" });
    expect(window.location.pathname).toBe(
      "/fr/decouvertes/guinee-trois-recits"
    );

    fireEvent.keyDown(feed, { key: "ArrowDown" });
    expect(window.location.pathname).toBe(
      "/fr/decouvertes/burkina-faso-trois-langues"
    );
  });

  // @req REQ-157
  it("files a series as a series, and credits it without a file page it does not have", () => {
    render(
      <DiscoveryReader
        language="fr"
        publications={[carouselPublication]}
        initialId={carouselPublication.id}
      />
    );

    expect(screen.getByText("Série")).toBeTruthy();
    const credit = screen.getByText(/EthniAfrica, CC BY-SA 4\.0/);
    expect(credit.querySelector("a")).toBeNull();
  });

  // A carousel has no photograph elsewhere, so its share card is its own
  // first frame rather than the site's default image.
  // @req REQ-158
  it("shares the series on its first frame", () => {
    document.head.innerHTML = '<meta property="og:image" content="" />';
    render(
      <DiscoveryReader
        language="fr"
        publications={[carouselPublication]}
        initialId={carouselPublication.id}
      />
    );

    expect(
      document.head
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content")
    ).toContain("/images/discoveries/carousel/guinee/1.jpg");
  });
});

describe("Découvertes video", () => {
  const [video] = videoPublications(DISCOVERY_VIDEOS);
  const withoutEmbed: DiscoveryPublication = {
    ...video,
    id: "video:no-embed",
    slug: { fr: "sans-lecteur", en: "no-player" },
    video: { ...video.video!, embed: undefined },
  };

  const renderVideo = (publication: DiscoveryPublication, language = "fr") =>
    render(
      <ConsentProvider>
        <DiscoveryReader
          language={language as "fr" | "en"}
          publications={[publication]}
          initialId={publication.id}
        />
      </ConsentProvider>
    );

  // The reader shows a production without asking anything of a platform: the
  // facade is a button and a link, and no frame exists until the click.
  // @req REQ-181
  it("shows a production behind a facade, with no frame and the link out", () => {
    const { container } = renderVideo(video);

    expect(container.querySelector("iframe")).toBeNull();
    expect(
      screen.getByRole("button", { name: /charge le lecteur de YouTube/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /regarder sur youtube/i })
    ).toHaveAttribute("href", video.video!.watchUrl);
    expect(screen.getByText("Vidéo")).toBeInTheDocument();
  });

  // A record without an embed is the link out it was before this change.
  // @req REQ-181
  it("shows only the link out when the record has no embed", () => {
    const { container } = renderVideo(withoutEmbed);

    expect(container.querySelector("iframe")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /charge le lecteur/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /regarder sur youtube/i })
    ).toBeInTheDocument();
  });

  // The card is the picture, the way a photograph or a carousel already is
  // on every other kind of card: the player is not a box sitting inside the
  // caption column.
  // @req REQ-156
  it("plays the production as the card's own picture, not inside the caption", () => {
    const { container } = renderVideo(video);

    const stage = container.querySelector('[data-layout="fill"]');
    expect(stage).not.toBeNull();
    const credit = screen.getByRole("link", { name: "CC BY-SA 4.0" });
    // The caption (title, description, credit) stays where every other kind
    // of card keeps it; the player never wraps it.
    expect(stage?.contains(credit)).toBe(false);
  });

  // The deck mounts every card at once, so nothing else stops a video that
  // has scrolled out of view.
  // @req REQ-156
  it("stops the video when the reader moves to the next publication", () => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
    render(
      <ConsentProvider>
        <DiscoveryReader
          language="fr"
          publications={[video, proverbPublication]}
          initialId={video.id}
        />
      </ConsentProvider>
    );
    fireEvent.click(
      screen.getByRole("button", { name: /charge le lecteur de YouTube/i })
    );
    expect(document.querySelector("iframe")).not.toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Découverte suivante" })
    );

    expect(document.querySelector("iframe")).toBeNull();
  });

  // The caption sits in front of the picture, so a playing player would be
  // drawn under the site's own words. The words step aside while it plays and
  // come back with the facade.
  // @req REQ-181
  it("takes the caption out of the way while the video plays and restores it on close", () => {
    renderVideo(video);
    const credit = screen.getByRole("link", { name: "CC BY-SA 4.0" });
    expect(credit.closest("[inert]")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /charge le lecteur de YouTube/i })
    );
    expect(credit.closest("[inert]")).not.toBeNull();
    expect(credit.closest("article")).toHaveAttribute("data-playing", "true");

    fireEvent.click(screen.getByRole("button", { name: /fermer le lecteur/i }));
    expect(credit.closest("[inert]")).toBeNull();
    expect(credit.closest("article")).not.toHaveAttribute("data-playing");
  });

  // REQ-128: author, licence and the page the piece is published on.
  // @req REQ-181
  it("credits the author and links the licence", () => {
    renderVideo(video);

    expect(screen.getByText(/EthniAfrica/, { selector: "p" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "CC BY-SA 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/"
    );
  });

  // @req REQ-181
  it("speaks English on an English route", () => {
    renderVideo(video, "en");

    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /loads YouTube's player/i })
    ).toBeInTheDocument();
  });
});
