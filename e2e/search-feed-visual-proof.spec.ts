import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

import {
  routeCommittedSearchFeedAssets,
  waitForSearchFeedReady,
} from "./support/search-feed-browser";
import {
  assertPixelParity,
  loadSearchFeedManifest,
} from "./support/search-feed-visual";
import { LOCALE } from "./support/locale";

const FEED_ROOT = "[data-feed-root]";
const BOARD_PATH = "/docs/design/mockups/search-feed/Mande.dc.html";

interface FeedGeometry {
  root: { x: number; y: number; width: number; height: number };
  blocks: Array<{
    id: string;
    text: string;
    box: { x: number; y: number; width: number; height: number };
  }>;
  firstPoster: { x: number; y: number; width: number; height: number } | null;
}

async function readFeedGeometry(page: Page): Promise<FeedGeometry> {
  return page.locator(FEED_ROOT).evaluate((root) => {
    const box = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    };
    const normalizedText = (element: Element) =>
      (element.textContent ?? "").replace(/\s+/g, " ").trim();
    const poster = root.querySelector('[data-feed-block="shorts"] img');

    return {
      root: box(root),
      blocks: Array.from(root.querySelectorAll(":scope > [data-feed-block]"))
        .concat(
          Array.from(
            root.querySelectorAll(
              ":scope > div > [data-feed-block], :scope > div > div > [data-feed-block]"
            )
          )
        )
        .filter((element, index, all) => all.indexOf(element) === index)
        .map((element) => ({
          id: element.getAttribute("data-feed-block") ?? "",
          text: normalizedText(element),
          box: box(element),
        })),
      firstPoster: poster ? box(poster) : null,
    };
  });
}

function expectBoxWithinOnePixel(
  actual: FeedGeometry["root"],
  expected: FeedGeometry["root"]
): void {
  for (const key of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(actual[key] - expected[key]), key).toBeLessThanOrEqual(1);
  }
}

test.describe("search-feed visual harness proof", () => {
  test.use({ deviceScaleFactor: 1, viewport: { width: 430, height: 800 } });
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  // @req REQ-180
  test("proves Mande mobile-day parity and rejects a one-pixel mutation", async ({
    page,
  }) => {
    const manifest = loadSearchFeedManifest(
      path.join(process.cwd(), "docs/design/mockups/search-feed/manifest.json")
    );
    const board = manifest.entries.find(
      (entry) => entry.case === "mande" && entry.variant === "mobile-day"
    );
    expect(board).toBeDefined();

    const expectedPage = await page.context().newPage();
    const failures: string[] = [];
    for (const candidate of [expectedPage, page]) {
      candidate.on("requestfailed", (request) => failures.push(request.url()));
      candidate.on("response", (response) => {
        if (response.status() >= 400) failures.push(response.url());
      });
      await routeCommittedSearchFeedAssets(candidate);
      await candidate.goto(BOARD_PATH);
    }

    const [expectedReady, actualReady] = await Promise.all([
      waitForSearchFeedReady(expectedPage),
      waitForSearchFeedReady(page),
    ]);

    expect(failures).toEqual([]);
    expect(expectedReady.deviceScaleFactor).toBe(1);
    expect(actualReady.deviceScaleFactor).toBe(expectedReady.deviceScaleFactor);
    expect(actualReady.images.length).toBeGreaterThan(0);
    expect(actualReady.images).toEqual(expectedReady.images);
    expect(actualReady.images.every((image) => image.naturalWidth > 0)).toBe(
      true
    );
    expect(actualReady.fonts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ family: "Fraunces", status: "loaded" }),
        expect.objectContaining({ family: "Nunito Sans", status: "loaded" }),
      ])
    );

    const expectedGeometry = await readFeedGeometry(expectedPage);
    const actualGeometry = await readFeedGeometry(page);
    expect(actualGeometry.blocks.map(({ id }) => id)).toEqual(
      board!.blocks.map(({ id }) => id)
    );
    expect(actualGeometry.blocks.map(({ text }) => text)).toEqual(
      expectedGeometry.blocks.map(({ text }) => text)
    );
    expect(actualGeometry.root).toEqual(expectedGeometry.root);
    expect(actualGeometry.firstPoster).not.toBeNull();
    expectBoxWithinOnePixel(
      actualGeometry.firstPoster!,
      expectedGeometry.firstPoster!
    );
    expect(actualGeometry.firstPoster).toMatchObject({
      width: board!.firstPoster!.width,
      height: board!.firstPoster!.height,
    });
    expectBoxWithinOnePixel(actualGeometry.firstPoster!, board!.firstPoster!);
    expect(actualGeometry.blocks).toHaveLength(board!.blocks.length);
    for (const [index, block] of actualGeometry.blocks.entries()) {
      expectBoxWithinOnePixel(block.box, expectedGeometry.blocks[index].box);
    }

    const screenshotOptions = {
      animations: "disabled" as const,
      scale: "css" as const,
      type: "png" as const,
    };
    const reference = await expectedPage
      .locator(FEED_ROOT)
      .screenshot(screenshotOptions);
    const actual = await page.locator(FEED_ROOT).screenshot(screenshotOptions);
    await expect(assertPixelParity(reference, actual)).resolves.toMatchObject({
      differentPixelRatio: 0,
    });

    await page.locator(FEED_ROOT).evaluate((element) => {
      const height = element.getBoundingClientRect().height;
      (element as HTMLElement).style.height = `${height + 1}px`;
    });
    const onePixelTaller = await page
      .locator(FEED_ROOT)
      .screenshot(screenshotOptions);
    await expect(assertPixelParity(reference, onePixelTaller)).rejects.toThrow(
      /1px height difference fails visual parity/
    );

    await expectedPage.close();
  });

  // @req REQ-180
  test("rejects a declared font whose committed bytes cannot load", async ({
    page,
  }) => {
    await page.setContent(`
      <style>
        @font-face {
          font-family: "Nunito Sans";
          src: url("data:font/woff2;base64,AA==") format("woff2");
          font-style: normal;
          font-weight: 300 800;
        }
        @font-face {
          font-family: "Fraunces";
          src: url("data:font/woff2;base64,AA==") format("woff2");
          font-style: normal;
          font-weight: 300 900;
        }
        @font-face {
          font-family: "Fraunces";
          src: url("data:font/woff2;base64,AA==") format("woff2");
          font-style: italic;
          font-weight: 300 900;
        }
      </style>
      <main data-feed-root style="font-family: 'Nunito Sans'">Mandé</main>
    `);

    await expect(waitForSearchFeedReady(page)).rejects.toThrow(
      /Required search-feed font (failed to load|is unavailable)/
    );
  });
});
