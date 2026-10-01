import { describe, expect, it } from "vitest";

import { articleMediaUrl, createArticleMediaUrl } from "../media";

describe("articleMediaUrl", () => {
  // @req REQ-114
  it("serves from the same origin by default", () => {
    expect(articleMediaUrl("mali/poster.webp")).toBe(
      "/media/articles/mali/poster.webp"
    );
  });

  // @req REQ-114
  it("prefixes a durable host without doubling slashes", () => {
    const url = createArticleMediaUrl("https://media.example.org/articles/");
    expect(url("/mali/poster.webp")).toBe(
      "https://media.example.org/articles/mali/poster.webp"
    );
  });

  // @req REQ-114
  it("refuses a path that leaves the media root or is an absolute URL", () => {
    expect(() => articleMediaUrl("../secrets.txt")).toThrow(/relative/);
    expect(() => articleMediaUrl("https://cdn.example/expiring.jpg")).toThrow(
      /relative/
    );
  });
});
