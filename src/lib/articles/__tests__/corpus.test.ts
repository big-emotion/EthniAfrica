import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";

import {
  assembleArticleCorpus,
  publishedArticleSummaries,
  readArticleCorpus,
} from "../corpus";
import { videoArticle, carouselArticle, bothFormatsArticle } from "./fixtures";

const record = (raw: unknown, name = "x") => ({
  filename: `${name}.json`,
  raw,
});

describe("article corpus", () => {
  const tmp: string[] = [];
  afterEach(() => {
    while (tmp.length) rmSync(tmp.pop()!, { recursive: true, force: true });
  });

  // @req REQ-114
  it("accepts video-only, carousel-only and both-format articles", () => {
    const { articles, errors } = assembleArticleCorpus([
      record(videoArticle(), "video-a"),
      record(carouselArticle(), "carousel-a"),
      record(bothFormatsArticle(), "both-a"),
    ]);
    expect(errors).toEqual([]);
    expect(articles.map((a) => a.id).sort()).toEqual([
      "both-a",
      "carousel-a",
      "video-a",
    ]);
  });

  // @req REQ-114
  it("keeps drafts out of every published projection", () => {
    const { articles } = assembleArticleCorpus([
      record(videoArticle({ id: "live" }), "live"),
      record(
        videoArticle({ id: "wip", status: "draft", publishedAt: undefined }),
        "wip"
      ),
    ]);
    expect(articles).toHaveLength(2);
    expect(publishedArticleSummaries(articles).map((s) => s.id)).toEqual([
      "live",
    ]);
  });

  // @req REQ-114
  it("refuses a published article that has no publication date", () => {
    const { articles, errors } = assembleArticleCorpus([
      record(
        videoArticle({ id: "undated", publishedAt: undefined }),
        "undated"
      ),
    ]);
    expect(articles).toEqual([]);
    expect(errors.join("\n")).toMatch(/undated.*publishedAt/);
  });

  // @req REQ-114
  it("refuses a published article without media or without sources", () => {
    const noMedia = assembleArticleCorpus([
      record(
        videoArticle({ id: "m", media: { formats: [], originals: [] } }),
        "m"
      ),
    ]);
    expect(noMedia.errors.join("\n")).toMatch(/m.*media/);
    const noSources = assembleArticleCorpus([
      record(videoArticle({ id: "s", sources: [] }), "s"),
    ]);
    expect(noSources.errors.join("\n")).toMatch(/s.*sources/);
  });

  // @req REQ-114
  it("refuses duplicate ids and duplicate slugs with the file names", () => {
    const first = videoArticle({ id: "one" });
    const second = videoArticle({ id: "two" });
    second.fr.slug = first.fr.slug;
    const { articles, errors } = assembleArticleCorpus([
      record(first, "one"),
      record(second, "two"),
    ]);
    expect(articles.map((a) => a.id)).toEqual(["one"]);
    expect(errors.join("\n")).toMatch(/two\.json.*slug/);
  });

  // @req REQ-114
  it.each([
    "anecdotes",
    "proverbes",
    "galerie",
    "themes",
    "nommer",
    "migrations",
    "regards",
  ])("refuses the reserved slug %s", (slug) => {
    const article = videoArticle({ id: "r" });
    article.fr.slug = slug;
    const { errors } = assembleArticleCorpus([record(article, "r")]);
    expect(errors.join("\n")).toMatch(/reserved/);
  });

  // @req REQ-114
  it("refuses a slug that belongs to a legacy dossier", () => {
    const article = videoArticle({ id: "d" });
    article.fr.slug = "kongo";
    const { errors } = assembleArticleCorpus([record(article, "d")], {
      legacyDossierSlugs: ["kongo"],
    });
    expect(errors.join("\n")).toMatch(/reserved/);
  });

  // @req REQ-114
  it("refuses a section citing an unknown source and a relation to an unknown article", () => {
    const badRef = videoArticle({ id: "b" });
    badRef.fr.sections[0].sourceRefs = ["nope"];
    expect(
      assembleArticleCorpus([record(badRef, "b")]).errors.join("\n")
    ).toMatch(/unknown source "nope"/);

    const badRel = videoArticle({ id: "c", relatedArticleIds: ["ghost"] });
    expect(
      assembleArticleCorpus([record(badRel, "c")]).errors.join("\n")
    ).toMatch(/unknown related article "ghost"/);
  });

  // @req REQ-114
  it("requires a correction note when an edition supersedes another", () => {
    const old = videoArticle({ id: "old" });
    const corrected = videoArticle({ id: "new" });
    corrected.fr.slug = "new-slug";
    corrected.media.edition = { id: "e2", supersedes: "e1" };
    const { errors } = assembleArticleCorpus([
      record(old, "old"),
      record(corrected, "new"),
    ]);
    expect(errors.join("\n")).toMatch(/new.*correctionNote/);
  });

  // @req REQ-114
  it("needs a playable video: a YouTube id or a native file, not a link alone", () => {
    const article = videoArticle({ id: "v" });
    article.media.formats = [
      { kind: "video", poster: { src: "/p.jpg", width: 540, height: 960 } },
    ] as never;
    expect(
      assembleArticleCorpus([record(article, "v")]).errors.join("\n")
    ).toMatch(/video.*youtubeId or nativeSrc/);
  });

  // @req REQ-114
  it("orders summaries by publication date descending with a stable id tie-break", () => {
    const { articles } = assembleArticleCorpus(
      [
        record(videoArticle({ id: "b", publishedAt: "2026-09-10" }), "b"),
        record(videoArticle({ id: "a", publishedAt: "2026-09-10" }), "a"),
        record(videoArticle({ id: "c", publishedAt: "2026-09-20" }), "c"),
      ].map((r, i) => {
        (r.raw as { fr: { slug: string } }).fr.slug = `s-${i}`;
        return r;
      })
    );
    expect(publishedArticleSummaries(articles).map((s) => s.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  // @req REQ-114
  it("does not reorder an article when only its modification date changes", () => {
    const a = videoArticle({ id: "a", publishedAt: "2026-09-10" });
    const b = videoArticle({ id: "b", publishedAt: "2026-09-12" });
    b.fr.slug = "b-slug";
    a.modifiedAt = "2026-09-29";
    const { articles } = assembleArticleCorpus([
      record(a, "a"),
      record(b, "b"),
    ]);
    expect(publishedArticleSummaries(articles).map((s) => s.id)).toEqual([
      "b",
      "a",
    ]);
  });

  // @req REQ-114
  it("summaries carry no article body", () => {
    const { articles } = assembleArticleCorpus([
      record(videoArticle(), "video-a"),
    ]);
    const [summary] = publishedArticleSummaries(articles);
    expect(Object.keys(summary).sort()).toEqual(
      [
        "excerpt",
        "id",
        "poster",
        "publishedAt",
        "slug",
        "title",
        "formats",
      ].sort()
    );
  });

  // @req REQ-114
  it("reports an unreadable directory entry as an error, not as an empty catalogue", () => {
    const root = mkdtempSync(join(tmpdir(), "articles-"));
    tmp.push(root);
    writeFileSync(join(root, "broken.json"), "{not json");
    const { articles, errors } = readArticleCorpus(root);
    expect(articles).toEqual([]);
    expect(errors[0]).toMatch(/broken\.json/);
  });

  // @req REQ-114
  it("treats an absent article directory as no articles yet, not as a failure", () => {
    expect(
      readArticleCorpus(join(tmpdir(), "does-not-exist-articles"))
    ).toEqual({
      articles: [],
      errors: [],
    });
  });
});
