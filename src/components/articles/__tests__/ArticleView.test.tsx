import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ArticleView } from "@/components/articles/ArticleView";
import { articleHref } from "@/components/articles/articlePaths";
import { ConsentProvider } from "@/hooks/use-consent";
import type { ArticleSummary } from "@/lib/articles/corpus";
import { articleSchema, type ArticleRecord } from "@/lib/articles/schema";
import {
  bothFormatsArticle,
  carouselArticle,
  videoArticle,
} from "@/lib/articles/__tests__/fixtures";

const parse = (record: ArticleRecord) => articleSchema.parse(record);

const renderView = (record: ArticleRecord, related: ArticleSummary[] = []) =>
  render(
    <ConsentProvider>
      <ArticleView language="fr" article={parse(record)} related={related} />
    </ConsentProvider>
  );

const media = () =>
  screen.getByRole("region", { name: "La publication d'origine" });
const text = () => document.getElementById("article-text") as HTMLElement;
const follows = (a: Node, b: Node) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("ArticleView", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // @req REQ-114
  it("carries one title, and it is the article's", () => {
    renderView(videoArticle());
    const titles = screen.getAllByRole("heading", { level: 1 });
    expect(titles).toHaveLength(1);
    expect(titles[0]).toHaveTextContent("D'où vient le nom X ?");
  });

  // @req REQ-114
  it("names who wrote it and when", () => {
    renderView(videoArticle({ modifiedAt: "2026-09-28" }));
    expect(screen.getByText(/Par EthniAfrica/)).toBeInTheDocument();
    expect(screen.getByText(/Publié le 25 septembre 2026/)).toBeInTheDocument();
    expect(
      screen.getByText(/Mis à jour le 28 septembre 2026/)
    ).toBeInTheDocument();
  });

  // The order the operator chose: the post first, then the text that develops it.
  // @req REQ-114
  it("puts the publication before the text, and a way past it before both", () => {
    renderView(carouselArticle());

    const skip = screen.getByRole("link", { name: "Aller au texte" });
    expect(skip).toHaveAttribute("href", "#article-text");
    expect(follows(skip, media())).toBe(true);
    expect(follows(media(), text())).toBe(true);
    expect(within(text()).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Ce que l'on sait"
    );
  });

  // Nothing leaves for YouTube until the reader asks for it.
  // @req REQ-181
  it("loads the video player only on the reader's click", async () => {
    const user = userEvent.setup();
    const { container } = renderView(videoArticle());

    expect(container.querySelector("iframe")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: /charge le lecteur de YouTube/ })
    );
    expect(container.querySelector("iframe")?.getAttribute("src")).toMatch(
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/A99ETtxdxiU/
    );
  });

  // @req REQ-114
  it("links to the original post on each network it was published on", () => {
    renderView(videoArticle());
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=A99ETtxdxiU"
    );
  });

  // A failed picture must not take the article with it.
  // @req REQ-114
  it("keeps the article whole when the media fails to load", () => {
    renderView(carouselArticle());

    fireEvent.error(screen.getByAltText("Slide 1"));

    expect(
      screen.getByText(/La publication n'a pas pu s'afficher ici/)
    ).toBeInTheDocument();
    // The slides' words survive their pictures.
    expect(screen.getByText("Slide one text")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Ce que l'on sait" })
    ).toBeInTheDocument();
  });

  // @req REQ-114
  it("offers a choice of format only when there are two", () => {
    renderView(carouselArticle());
    expect(
      screen.queryByRole("group", { name: "Choisir le format" })
    ).toBeNull();
  });

  // The body is never hidden behind the switch: it is not a set of tabs.
  // @req REQ-114
  it("switches the media between formats without touching the text", async () => {
    const user = userEvent.setup();
    renderView(bothFormatsArticle());

    const formats = screen.getByRole("group", { name: "Choisir le format" });
    const video = within(formats).getByRole("button", { name: "Vidéo" });
    expect(video).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("region", { name: "Carrousel" })).toBeVisible();

    await user.click(video);
    expect(video).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("region", { name: "Carrousel" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /charge le lecteur de YouTube/ })
    ).toBeInTheDocument();
    expect(text()).toBeVisible();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  // A claim points at its source where it is made, not in a footnote
  // the reader has to go looking for.
  // @req REQ-114
  it("cites each part's sources beside it and lists them in full below", () => {
    renderView(videoArticle());

    const marker = within(text()).getByRole("link", { name: "Source 1" });
    expect(marker).toHaveAttribute("href", "#source-src-1");
    const entry = document.getElementById("source-src-1") as HTMLElement;
    expect(entry).toHaveTextContent("A published work about the name");
    expect(entry).toHaveTextContent("chap. 2");
    expect(follows(text(), entry)).toBe(true);
  });

  // The reader is told what a source is, never how far to trust it
  // (doctrine §1.1): no tier word sits beside a reference.
  // @req REQ-092
  it("lists a reference without its tier", () => {
    renderView(videoArticle());

    const entry = document.getElementById("source-src-1") as HTMLElement;
    expect(entry).not.toHaveTextContent(
      /Référencée|Officielle|Non vérifiée|En attente d'examen/
    );
  });

  // @req REQ-114
  it("explains a corrected edition, and says nothing when there is none", () => {
    const corrected = videoArticle();
    corrected.media.edition = {
      id: "mande-2026-09-25",
      supersedes: "mande-2026-09-16",
      correctionNote: "La version du 16 septembre prononçait mal deux noms.",
    };
    const { unmount } = renderView(corrected);
    expect(screen.getByText("Note de correction")).toBeInTheDocument();
    expect(
      screen.getByText("La version du 16 septembre prononçait mal deux noms.")
    ).toBeInTheDocument();
    unmount();

    renderView(videoArticle());
    expect(screen.queryByText("Note de correction")).toBeNull();
  });

  // @req REQ-114
  it("points to related articles", () => {
    renderView(videoArticle(), [
      {
        id: "other",
        slug: "other",
        title: "Un autre nom",
        excerpt: "Autre chose.",
        publishedAt: "2026-09-20",
        poster: { src: "p.webp", width: 540, height: 960 },
        formats: ["video"],
      },
    ]);
    expect(screen.getByRole("link", { name: /Un autre nom/ })).toHaveAttribute(
      "href",
      articleHref("fr", "other")
    );
  });

  /**
   * Doctrine §1.1: every source a reader sees says what kind of thing it is.
   * An article's sources have their own vocabulary (book, press, oral…);
   * a source that declares none prints no type rather than a guess.
   */
  // @req REQ-161
  it("names each source's kind in the references, and nothing when undeclared", () => {
    const record = videoArticle();
    record.sources = [
      {
        id: "src-1",
        title: "A published work",
        tier: "referenced",
        kind: "book",
      },
      { id: "src-2", title: "A broadcast", tier: "referenced", kind: "press" },
      {
        id: "src-3",
        title: "An elder's account",
        tier: "referenced",
        kind: "oral",
      },
      { id: "src-4", title: "No kind given", tier: "referenced" },
    ];
    record.fr.sections[0].sourceRefs = ["src-1"];
    renderView(record);

    const references = screen
      .getByRole("heading", { name: "Sources consultées" })
      .closest("section") as HTMLElement;
    const items = within(references).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Livre");
    expect(items[1]).toHaveTextContent("Article de presse");
    expect(items[2]).toHaveTextContent("Tradition orale");
    expect(items[3].querySelector("[data-source-kind]")).toBeNull();
  });
});
