import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveArticleMediaFile, serveArticleMedia } from "../mediaFiles";

describe("article media served from the host's own directory", () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "article-media-"));
    mkdirSync(join(root, "mali", "mali"), { recursive: true });
    writeFileSync(join(root, "mali", "mali", "poster-ab12.webp"), "WEBP");
    writeFileSync(join(root, "mali", "notes.txt"), "not media");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  // @req REQ-114
  it("resolves an image inside the root and names its type", () => {
    expect(
      resolveArticleMediaFile(["mali", "mali", "poster-ab12.webp"], root)
    ).toEqual({
      file: join(root, "mali", "mali", "poster-ab12.webp"),
      contentType: "image/webp",
    });
  });

  // @req REQ-114
  it.each([
    [["..", "etc", "passwd.webp"]],
    [["mali", "..", "..", "x.webp"]],
    [[".hidden", "a.webp"]],
    [["mali", "a b.webp"]],
    [["mali", "a%2e%2e.webp"]],
    [["mali", "poster.svg"]],
    [["mali", "notes.txt"]],
    [[]],
  ])("refuses the path %j before touching the disk", (segments) => {
    expect(resolveArticleMediaFile(segments, root)).toBeNull();
  });

  // @req REQ-114
  it("serves the bytes with an immutable cache, since names carry a hash", async () => {
    const response = await serveArticleMedia(
      ["mali", "mali", "poster-ab12.webp"],
      root
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable"
    );
    expect(await response.text()).toBe("WEBP");
  });

  // @req REQ-114
  it("answers 404 for a file that is not there, and for a refused path", async () => {
    expect(
      (await serveArticleMedia(["mali", "missing.webp"], root)).status
    ).toBe(404);
    expect((await serveArticleMedia(["..", "x.webp"], root)).status).toBe(404);
  });

  // @req REQ-114
  it("answers 404 rather than failing when the directory is not mounted", async () => {
    const response = await serveArticleMedia(
      ["mali", "a.webp"],
      join(root, "not-mounted")
    );
    expect(response.status).toBe(404);
  });
});
