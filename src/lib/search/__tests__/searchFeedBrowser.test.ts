import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  resolveSearchFeedAssetPath,
  waitForSearchFeedReady,
} from "../../../../e2e/support/search-feed-browser";

describe("search-feed browser harness", () => {
  // @req REQ-180
  it("routes only committed board and editorial assets", () => {
    const root = process.cwd();

    expect(
      resolveSearchFeedAssetPath(
        "/docs/design/mockups/search-feed/posters/mande.jpg",
        root
      )
    ).toBe(
      realpathSync(
        path.join(root, "docs/design/mockups/search-feed/posters/mande.jpg")
      )
    );
    expect(
      resolveSearchFeedAssetPath(
        "/docs/design/mockups/search-feed/fonts/Fraunces-normal-latin.woff2",
        root
      )
    ).toBe(
      realpathSync(
        path.join(
          root,
          "docs/design/mockups/search-feed/fonts/Fraunces-normal-latin.woff2"
        )
      )
    );
    expect(
      resolveSearchFeedAssetPath(
        "/public/images/anecdotes/malinke-manden.jpg",
        root
      )
    ).toBe(
      realpathSync(
        path.join(root, "public/images/anecdotes/malinke-manden.jpg")
      )
    );
    expect(
      resolveSearchFeedAssetPath(
        "/public/images/anecdotes/not-committed.jpg",
        root
      )
    ).toBeNull();
    expect(
      resolveSearchFeedAssetPath(
        "/docs/design/mockups/search-feed/Mande.dc.html",
        root
      )
    ).toBeNull();
    expect(
      resolveSearchFeedAssetPath(
        "/docs/design/mockups/search-feed/posters/%2e%2e/%2e%2e/secrets",
        root
      )
    ).toBeNull();
    expect(
      resolveSearchFeedAssetPath(
        "/docs/design/mockups/search-feed/posters/%E0%A4%A",
        root
      )
    ).toBeNull();
  });

  // @req REQ-180
  it("rejects a symlink that escapes an allowed asset directory", () => {
    const root = mkdtempSync(path.join(tmpdir(), "search-feed-assets-"));

    try {
      const images = path.join(root, "public/images");
      const outside = path.join(root, "outside.jpg");
      mkdirSync(images, { recursive: true });
      writeFileSync(outside, "not an image");
      symlinkSync(outside, path.join(images, "escape.jpg"));

      expect(
        resolveSearchFeedAssetPath("/public/images/escape.jpg", root)
      ).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  // @req REQ-180
  it("waits for network, fonts and every image before returning readiness", async () => {
    const readiness = {
      deviceScaleFactor: 1,
      fonts: [
        {
          family: "Fraunces",
          style: "normal",
          weight: "300 900",
          status: "loaded",
        },
        {
          family: "Nunito Sans",
          style: "normal",
          weight: "300 800",
          status: "loaded",
        },
      ],
      images: [
        {
          src: "http://127.0.0.1/posters/mande.jpg",
          naturalWidth: 130,
          naturalHeight: 231,
        },
      ],
    };
    const page = {
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(readiness),
    };

    await expect(waitForSearchFeedReady(page as never)).resolves.toEqual(
      readiness
    );
    expect(page.waitForLoadState).toHaveBeenCalledWith("networkidle");
    expect(page.evaluate).toHaveBeenCalledOnce();
  });

  // @req REQ-180
  it("surfaces readiness failures instead of taking an incomplete capture", async () => {
    const page = {
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      evaluate: vi
        .fn()
        .mockRejectedValue(
          new Error("Search-feed image decoding failed: broken.jpg")
        ),
    };

    await expect(waitForSearchFeedReady(page as never)).rejects.toThrow(
      "Search-feed image decoding failed: broken.jpg"
    );
  });
});
