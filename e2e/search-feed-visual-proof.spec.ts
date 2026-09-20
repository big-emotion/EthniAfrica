import path from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  FEED_CASES,
  type FeedCaseFixture,
} from "../src/lib/search/__fixtures__/feedCases";

import { waitForSearchFeedReady } from "./support/search-feed-browser";
import {
  routeSearchFeedFixtures,
  searchFeedUrl,
} from "./support/search-feed-fixture";
import {
  assertPixelParity,
  createSearchFeedDiffPng,
  loadSearchFeedManifest,
  type SearchFeedManifestEntry,
} from "./support/search-feed-visual";
import { LOCALE } from "./support/locale";

const FEED_ROOT = "[data-feed-root]";
const BOARD_ROOT = "[data-board-root]";
const MANIFEST = loadSearchFeedManifest(
  path.join(process.cwd(), "docs/design/mockups/search-feed/manifest.json")
);
const BOARD_ORIGIN =
  process.env.SEARCH_FEED_BOARD_ORIGIN ?? "http://127.0.0.1:4173";
const SCREENSHOT_OPTIONS = {
  animations: "disabled" as const,
  scale: "css" as const,
  type: "png" as const,
};

interface ElementBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FeedGeometry {
  viewport: { width: number; height: number; deviceScaleFactor: number };
  root: ElementBox;
  blocks: Array<{ id: string; text: string; box: ElementBox }>;
  owedParts: string[];
  firstPoster: ElementBox | null;
}

interface FeedReadiness {
  fonts: Array<{
    family: string;
    style: string;
    weight: string;
    status: FontFaceLoadStatus;
  }>;
  images: Array<{
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  }>;
}

interface NetworkFailure {
  kind: "request" | "response";
  url: string;
  detail: string;
}

function fixtureFor(entry: SearchFeedManifestEntry): FeedCaseFixture {
  const fixture = FEED_CASES.find((candidate) => candidate.id === entry.case);
  if (!fixture)
    throw new Error(`Missing fixture for board case: ${entry.case}`);
  return fixture;
}

function boardUrl(entry: SearchFeedManifestEntry): string {
  return new URL(
    `/docs/design/mockups/search-feed/${entry.file}`,
    BOARD_ORIGIN
  ).toString();
}

function watchNetwork(page: Page, failures: NetworkFailure[]): void {
  page.on("requestfailed", (request) => {
    // React cancels its superseded search effect when the fixture-backed feed
    // settles. Chromium reports that deliberate cancellation as ERR_ABORTED;
    // it is not a transport or asset failure.
    if (request.failure()?.errorText === "net::ERR_ABORTED") return;
    failures.push({
      kind: "request",
      url: request.url(),
      detail: request.failure()?.errorText ?? "request failed",
    });
  });
  page.on("response", (response) => {
    if (response.status() < 400) return;
    failures.push({
      kind: "response",
      url: response.url(),
      detail: String(response.status()),
    });
  });
}

async function waitForFeedAssets(page: Page): Promise<FeedReadiness> {
  await expect(page.locator(FEED_ROOT)).toBeVisible();
  return page.locator(FEED_ROOT).evaluate(async (root) => {
    await document.fonts.ready;

    const requiredFonts = [
      {
        descriptor: `normal 400 16px "Nunito Sans"`,
        family: "Nunito Sans",
        style: "normal",
        weight: "400",
      },
      {
        descriptor: `normal 700 16px "Fraunces"`,
        family: "Fraunces",
        style: "normal",
        weight: "700",
      },
      {
        descriptor: `italic 400 16px "Fraunces"`,
        family: "Fraunces",
        style: "italic",
        weight: "400",
      },
    ] as const;
    const fonts = [];
    for (const required of requiredFonts) {
      const loaded = await document.fonts.load(required.descriptor, "Mandé");
      if (
        loaded.length === 0 ||
        !document.fonts.check(required.descriptor, "Mandé") ||
        loaded.some((font) => font.status !== "loaded")
      ) {
        throw new Error(
          `Required search-feed font is unavailable: ${required.family} ${required.style} ${required.weight}`
        );
      }
      fonts.push(
        ...loaded.map((font) => ({
          family: font.family.replaceAll('"', ""),
          style: font.style,
          weight: font.weight,
          status: font.status,
        }))
      );
    }

    const images = Array.from(root.querySelectorAll("img"));
    const decoded = await Promise.allSettled(
      images.map(async (image) => {
        if (!image.complete || image.naturalWidth === 0)
          image.loading = "eager";
        await image.decode();
      })
    );
    const failed = images.filter(
      (image, index) =>
        decoded[index].status === "rejected" ||
        !image.complete ||
        image.naturalWidth === 0
    );
    if (failed.length > 0) {
      throw new Error(
        `Search-feed image decoding failed: ${failed
          .map((image) => image.currentSrc || image.src)
          .join(", ")}`
      );
    }

    return {
      fonts,
      images: images.map((image) => ({
        src: image.currentSrc || image.src,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      })),
    };
  });
}

async function readFeedGeometry(page: Page): Promise<FeedGeometry> {
  return page.locator(FEED_ROOT).evaluate((root) => {
    const box = (element: Element): ElementBox => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    };
    const normalizedText = (element: Element) => {
      const parts: string[] = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          let parent = node.parentElement;
          while (parent && parent !== element) {
            const style = getComputedStyle(parent);
            if (style.display === "none" || style.visibility === "hidden") {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      while (walker.nextNode())
        parts.push(walker.currentNode.textContent ?? "");
      return parts.join(" ").replace(/\s*→/g, " →").replace(/\s+/g, " ").trim();
    };
    const poster = root.querySelector('[data-feed-block="shorts"] img');

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        deviceScaleFactor: window.devicePixelRatio,
      },
      root: box(root),
      blocks: Array.from(root.querySelectorAll("[data-feed-block]")).map(
        (element) => ({
          id: element.getAttribute("data-feed-block") ?? "",
          text: normalizedText(element),
          box: box(element),
        })
      ),
      owedParts: Array.from(root.querySelectorAll("[data-feed-part]")).map(
        (element) => element.getAttribute("data-feed-part") ?? ""
      ),
      firstPoster: poster ? box(poster) : null,
    };
  });
}

function expectBoxWithinOnePixel(
  actual: ElementBox,
  expected: ElementBox,
  label: string,
  keys: readonly (keyof ElementBox)[] = ["x", "y", "width", "height"]
): void {
  for (const key of keys) {
    expect(
      Math.abs(actual[key] - expected[key]),
      `${label}.${key}: expected ${expected[key]}, received ${actual[key]}`
    ).toBeLessThanOrEqual(1);
  }
}

async function attachFailure(
  testInfo: TestInfo,
  diagnostics: Record<string, unknown>,
  reference?: Buffer,
  actual?: Buffer
): Promise<void> {
  await testInfo.attach("parity-diagnostics.json", {
    body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
    contentType: "application/json",
  });
  if (reference) {
    await testInfo.attach("reference.png", {
      body: reference,
      contentType: "image/png",
    });
  }
  if (actual) {
    await testInfo.attach("actual.png", {
      body: actual,
      contentType: "image/png",
    });
  }
  if (!reference || !actual) return;

  try {
    const diff = await createSearchFeedDiffPng(reference, actual);
    await testInfo.attach("diff.png", {
      body: diff,
      contentType: "image/png",
    });
  } catch (error) {
    await testInfo.attach("diff-error.txt", {
      body: Buffer.from(error instanceof Error ? error.message : String(error)),
      contentType: "text/plain",
    });
  }
}

test.describe("search-feed forty-board visual parity", () => {
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  for (const entry of MANIFEST.entries) {
    // @req REQ-180
    test(`${entry.case} ${entry.variant} matches its approved board`, async ({
      page,
    }, testInfo) => {
      const fixture = fixtureFor(entry);
      const expectedPage = await page.context().newPage();
      const networkFailures: NetworkFailure[] = [];
      let expectedGeometry: FeedGeometry | undefined;
      let actualGeometry: FeedGeometry | undefined;
      let reference: Buffer | undefined;
      let actual: Buffer | undefined;

      watchNetwork(expectedPage, networkFailures);
      watchNetwork(page, networkFailures);

      try {
        await Promise.all([
          expectedPage.setViewportSize({
            width: entry.width,
            height: entry.height,
          }),
          page.setViewportSize({ width: entry.width, height: entry.height }),
        ]);
        await page.addInitScript((theme) => {
          localStorage.setItem("theme", theme === "night" ? "dark" : "light");
        }, entry.theme);
        await routeSearchFeedFixtures(page);

        await Promise.all([
          expectedPage.goto(boardUrl(entry), { waitUntil: "load" }),
          page.goto(searchFeedUrl(fixture), { waitUntil: "load" }),
        ]);

        await expect(page.locator("html")).toHaveClass(
          entry.theme === "night" ? /\bdark\b/ : /^(?!.*\bdark\b)/
        );
        await page.addStyleTag({
          // The dev-server indicator floats over the feed's bottom-left corner and
          // lands in the screenshot, which is not part of the page under test.
          content:
            '[data-testid="site-header"], nextjs-portal { visibility: hidden !important; }',
        });
        await expect(expectedPage.locator(BOARD_ROOT)).toHaveCSS(
          "width",
          `${entry.width}px`
        );
        await expect(expectedPage.locator(BOARD_ROOT)).toHaveCSS(
          "height",
          `${entry.height}px`
        );

        await expect
          .poll(
            () =>
              page
                .locator(`${FEED_ROOT} [data-feed-block]`)
                .evaluateAll((blocks) =>
                  blocks.map((block) => block.getAttribute("data-feed-block"))
                ),
            { message: "production feed must render every declared block" }
          )
          .toEqual(entry.blocks.map(({ id }) => id));

        const [expectedReady, actualReady] = await Promise.all([
          waitForFeedAssets(expectedPage),
          waitForFeedAssets(page),
        ]);
        [expectedReady, actualReady].forEach((readiness) => {
          expect(readiness.images.length).toBeGreaterThan(0);
          expect(
            readiness.images.every(
              (image) => image.naturalWidth > 0 && image.naturalHeight > 0
            )
          ).toBe(true);
          expect(readiness.fonts).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                family: "Fraunces",
                status: "loaded",
              }),
              expect.objectContaining({
                family: "Nunito Sans",
                status: "loaded",
              }),
            ])
          );
        });

        [expectedGeometry, actualGeometry] = await Promise.all([
          readFeedGeometry(expectedPage),
          readFeedGeometry(page),
        ]);
        [reference, actual] = await Promise.all([
          expectedPage.locator(FEED_ROOT).screenshot(SCREENSHOT_OPTIONS),
          page.locator(FEED_ROOT).screenshot(SCREENSHOT_OPTIONS),
        ]);

        expect(networkFailures).toEqual([]);
        expect(expectedGeometry.viewport).toEqual({
          width: entry.width,
          height: entry.height,
          deviceScaleFactor: 1,
        });
        expect(actualGeometry.viewport).toEqual(expectedGeometry.viewport);

        const expectedIds = entry.blocks.map(({ id }) => id);
        expect(expectedGeometry.blocks.map(({ id }) => id)).toEqual(
          expectedIds
        );
        expect(actualGeometry.blocks.map(({ id }) => id)).toEqual(expectedIds);
        expect(actualGeometry.blocks.map(({ text }) => text)).toEqual(
          expectedGeometry.blocks.map(({ text }) => text)
        );
        expect(expectedGeometry.owedParts).toEqual(entry.owedParts);
        expect(actualGeometry.owedParts).toEqual(entry.owedParts);
        expectBoxWithinOnePixel(
          actualGeometry.root,
          expectedGeometry.root,
          "feed-root"
        );
        for (const [index, block] of actualGeometry.blocks.entries()) {
          expectBoxWithinOnePixel(
            block.box,
            expectedGeometry.blocks[index].box,
            `block[${block.id}]`
          );
        }

        if (entry.firstPoster === null) {
          expect(expectedGeometry.firstPoster).toBeNull();
          expect(actualGeometry.firstPoster).toBeNull();
        } else {
          expect(expectedGeometry.firstPoster).not.toBeNull();
          expect(actualGeometry.firstPoster).not.toBeNull();
          // The manifest was measured on macOS, where a row of chips above the
          // poster wraps one line differently than on Linux (the boards moved
          // 15 to 27px in CI while the app moved with them). Its y is therefore
          // not a portable expectation; the poster's size is, and its y is
          // held against the board rendered in the same run just below.
          const posterSize = ["width", "height"] as const;
          expectBoxWithinOnePixel(
            expectedGeometry.firstPoster!,
            entry.firstPoster,
            "board-first-poster",
            posterSize
          );
          expectBoxWithinOnePixel(
            actualGeometry.firstPoster!,
            entry.firstPoster,
            "actual-first-poster",
            posterSize
          );
          expectBoxWithinOnePixel(
            actualGeometry.firstPoster!,
            expectedGeometry.firstPoster!,
            "first-poster"
          );
        }

        // Chromium captures a fractional box on its outer whole pixels, so a
        // 2583.47px root is a 2584-row image; rounding failed every fraction < .5.
        await expect(
          assertPixelParity(reference, actual)
        ).resolves.toMatchObject({
          width: Math.ceil(expectedGeometry.root.width),
          height: Math.ceil(expectedGeometry.root.height),
        });
      } catch (error) {
        await attachFailure(
          testInfo,
          {
            board: entry,
            networkFailures,
            expectedGeometry,
            actualGeometry,
            error: error instanceof Error ? error.message : String(error),
          },
          reference,
          actual
        );
        throw error;
      } finally {
        await expectedPage.close();
      }
    });
  }
});

test.describe("search-feed visual harness safeguards", () => {
  test.use({ deviceScaleFactor: 1, viewport: { width: 430, height: 800 } });
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  // @req REQ-180
  test("rejects a one-pixel height mutation", async ({ page }) => {
    await page.goto(
      new URL(
        "/docs/design/mockups/search-feed/Mande.dc.html",
        BOARD_ORIGIN
      ).toString(),
      { waitUntil: "load" }
    );
    await waitForFeedAssets(page);

    const reference = await page
      .locator(FEED_ROOT)
      .screenshot(SCREENSHOT_OPTIONS);
    await page.locator(FEED_ROOT).evaluate((element) => {
      const height = element.getBoundingClientRect().height;
      (element as HTMLElement).style.height = `${height + 1}px`;
    });
    const onePixelTaller = await page
      .locator(FEED_ROOT)
      .screenshot(SCREENSHOT_OPTIONS);

    await expect(assertPixelParity(reference, onePixelTaller)).rejects.toThrow(
      /1px height difference fails visual parity/
    );
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
