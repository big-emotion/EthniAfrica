import { describe, expect, it } from "vitest";

import { articleJsonLd, serializeJsonLd } from "../jsonLd";
import { carouselArticle, videoArticle } from "./fixtures";
import { assembleArticleCorpus } from "../corpus";

const parse = (raw: ReturnType<typeof videoArticle>) =>
  assembleArticleCorpus([{ filename: `${raw.id}.json`, raw }]).articles[0];

describe("articleJsonLd", () => {
  // @req REQ-114
  it("uses the article's own dates and accountable author, never the media's", () => {
    const article = parse(
      videoArticle({
        id: "a1",
        publishedAt: "2026-10-02",
        modifiedAt: "2026-10-05",
      })
    );
    const node = articleJsonLd(article, "fr");

    expect(node["@type"]).toBe("Article");
    expect(node.headline).toBe(article.fr.title);
    expect(node.datePublished).toBe("2026-10-02");
    expect(node.dateModified).toBe("2026-10-05");
    expect(node.author).toMatchObject({ name: "EthniAfrica" });
    expect(node.inLanguage).toBe("fr");
  });

  // @req REQ-114
  it("omits dateModified when the article was never corrected", () => {
    const node = articleJsonLd(parse(videoArticle({ id: "a2" })), "fr");
    expect("dateModified" in node).toBe(false);
  });

  // @req REQ-114
  it("describes a carousel's first slide and a video's poster as the image", () => {
    const video = articleJsonLd(parse(videoArticle({ id: "v1" })), "fr");
    const carousel = articleJsonLd(parse(carouselArticle({ id: "c1" })), "fr");

    expect(String(video.image)).toMatch(/\/media\/articles\/media\/a\.jpg$/);
    expect(String(carousel.image)).toMatch(/s1\.jpg$/);
  });

  // @req REQ-114
  it("cannot be closed early by article text", () => {
    const article = parse(videoArticle({ id: "x1" }));
    article.fr.title = "</script><script>alert(1)</script>";
    const html = serializeJsonLd(articleJsonLd(article, "fr"));

    expect(html).not.toContain("</script>");
    expect(JSON.parse(html).headline).toBe(article.fr.title);
  });
});
