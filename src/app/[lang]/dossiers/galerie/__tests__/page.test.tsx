import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DiscoveryPublication } from "@/lib/discoveries/catalog";
import { getLocalizedRoute } from "@/lib/routing";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Publication is mocked so the page is exercised against fixtures in both
// states: open, as the registry now declares it, and withheld.
const publication = vi.hoisted(() => ({ galerie: true }));
vi.mock("@/lib/hubs/moduleOffer", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  isModulePublished: (id: string) =>
    id === "galerie" ? publication.galerie : false,
}));

type Collection = NonNullable<DiscoveryPublication["collection"]>;

function generatedImage(
  id: string,
  collection: Collection,
  overrides: Partial<DiscoveryPublication> = {}
): DiscoveryPublication {
  return {
    id,
    kind: "image",
    status: "published",
    collection,
    slug: { fr: `${id}-fr`, en: `${id}-en` },
    title: { fr: `Titre ${id}`, en: `Title ${id}` },
    description: { fr: `Résumé ${id}`, en: `Summary ${id}` },
    source: {
      title: "Source",
      url: "https://example.org/source",
      tier: "referenced",
    },
    detail: {
      body: { fr: ["Texte"], en: ["Text"] },
      entities: [
        {
          kind: "people",
          id: "PPL_HAUSA",
          label: { fr: "Haoussa", en: "Hausa" },
        },
      ],
      sources: [],
    },
    image: {
      src: `/images/discoveries/${id}.webp`,
      credit: "EthniAfrica, CC BY-SA 4.0",
      licence: "cc-by-sa",
      alt: { fr: `Portrait stylisé ${id}`, en: `Stylised portrait ${id}` },
    },
    caption: { fr: "Légende", en: "Caption" },
    generation: {
      tool: "Higgsfield",
      model: "nano_banana_2",
      jobId: `job-${id}`,
      generatedOn: "2026-09-12",
      sourceKind: "ai_generated",
    },
    ...overrides,
  };
}

const FOUR_ELIGIBLE = [
  generatedImage("autonym-one", "autonymes"),
  generatedImage("crossing-one", "traversees"),
  generatedImage("moment-one", "figures-et-moments"),
  generatedImage("autonym-two", "autonymes"),
];
const ELIGIBLE_IDS = FOUR_ELIGIBLE.map((entry) => entry.id).sort();

vi.mock("@/lib/discoveries/entries", () => ({
  getDiscoveryPublications: () => [
    ...FOUR_ELIGIBLE,
    generatedImage("no-provenance", "traversees", { generation: undefined }),
  ],
}));

import GalleryPage, {
  generateMetadata,
} from "@/app/[lang]/dossiers/galerie/page";
import DiscoveriesPage from "@/app/[lang]/decouvertes/[[...publication]]/page";

const params = (lang = "fr") => Promise.resolve({ lang });

async function renderGallery(lang = "fr") {
  return render(await GalleryPage({ params: params(lang) }));
}

const tiles = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll<HTMLAnchorElement>("a[data-publication-id]")
  );

afterEach(() => {
  publication.galerie = true;
});

describe("the gallery and the feed show one set (REQ-167)", () => {
  // @req REQ-167
  it("shows exactly the four eligible images, as the feed does", async () => {
    const feed = render(
      await DiscoveriesPage({
        params: Promise.resolve({
          lang: "fr",
          publication: ["autonym-one-fr"],
        }),
      })
    );
    const feedIds = Array.from(
      feed.container.querySelectorAll("article[data-publication-id]")
    )
      .map((article) => article.getAttribute("data-publication-id"))
      .sort();
    feed.unmount();

    const gallery = await renderGallery();
    const galleryIds = tiles(gallery.container)
      .map((tile) => tile.getAttribute("data-publication-id"))
      .sort();

    expect(feedIds).toEqual(ELIGIBLE_IDS);
    expect(galleryIds).toEqual(ELIGIBLE_IDS);
  });

  // @req REQ-167
  it("groups the tiles under their collection, in the fixed order", async () => {
    const { container } = await renderGallery();

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("section[data-collection]")
    );
    expect(
      sections.map((section) => [
        within(section).getByRole("heading", { level: 2 }).textContent,
        tiles(section).map((tile) => tile.getAttribute("data-publication-id")),
      ])
    ).toEqual([
      ["Autonymes", ["autonym-one", "autonym-two"]],
      ["Traversées", ["crossing-one"]],
      ["Figures et moments", ["moment-one"]],
    ]);
  });
});

describe("a gallery tile opens its publication (REQ-167)", () => {
  // @req REQ-167
  it("links each tile to the French permalink, labelled as a generated image", async () => {
    const { container } = await renderGallery("fr");

    for (const tile of tiles(container)) {
      const id = tile.getAttribute("data-publication-id");
      expect(tile).toHaveAttribute("href", `/fr/decouvertes/${id}-fr`);
      expect(tile).toHaveTextContent("Image générée");
      expect(tile).toHaveTextContent(`Titre ${id}`);
      expect(within(tile).getByRole("img")).toHaveAttribute(
        "alt",
        `Portrait stylisé ${id}`
      );
    }
  });

  // @req REQ-167
  it("links each tile to the English permalink under /en", async () => {
    const { container } = await renderGallery("en");

    for (const tile of tiles(container)) {
      const id = tile.getAttribute("data-publication-id");
      expect(tile).toHaveAttribute("href", `/en/discoveries/${id}-en`);
      expect(tile).toHaveTextContent("Generated image");
      expect(within(tile).getByRole("img")).toHaveAttribute(
        "alt",
        `Stylised portrait ${id}`
      );
    }
  });

  /**
   * happy-dom lays nothing out, so the breakpoints are read off the module's
   * own text: one or two columns on a phone, and the wider grids declared
   * from the tablet and desktop floors up — never the other way round.
   */
  // @req REQ-167
  it("lays the tiles out mobile first, widening at 768 and 1200 px", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/[lang]/dossiers/galerie/gallery.module.css"),
      "utf8"
    );
    const tablet = css.indexOf("@media (min-width: 768px)");
    const desktop = css.indexOf("@media (min-width: 1200px)");
    const base = css.slice(0, tablet);

    expect(base).toMatch(/\.grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/);
    expect(tablet).toBeGreaterThan(0);
    expect(desktop).toBeGreaterThan(tablet);
    expect(css).not.toMatch(/max-width:\s*\d+px\)/);
  });
});

describe("the gallery while its module is withheld (REQ-167)", () => {
  // @req REQ-167
  it("answers 404 and declares no head", async () => {
    publication.galerie = false;

    await expect(GalleryPage({ params: params() })).rejects.toThrow(
      "NEXT_NOT_FOUND"
    );
    expect(await generateMetadata({ params: params() })).toEqual({});
  });

  // @req REQ-167
  it("declares its own canonical once published", async () => {
    const head = await generateMetadata({ params: params() });

    expect(head.title).toBe("Galerie");
    expect(String(head.alternates?.canonical)).toContain(
      getLocalizedRoute("fr", "gallery")
    );
  });
});
