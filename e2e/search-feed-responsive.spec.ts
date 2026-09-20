import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import {
  FEED_CASES,
  type FeedCaseFixture,
} from "../src/lib/search/__fixtures__/feedCases";

import { LOCALE } from "./support/locale";
import {
  routeSearchFeedFixtures,
  searchFeedUrl,
} from "./support/search-feed-fixture";

const FEED_ROOT = "[data-feed-root]";
const WIDTHS = [320, 375, 430, 767, 768, 1024, 1199, 1200, 1280, 1440];
const POSTER_WIDTHS = new Set([430, 1280]);
const THEMES = ["light", "dark"] as const;
const CASE_IDS = ["mande", "ekpeye", "introuvable", "inconnu"] as const;

const CASES = CASE_IDS.map((id) => {
  const fixture = FEED_CASES.find((candidate) => candidate.id === id);
  if (!fixture) throw new Error(`Missing search-feed fixture: ${id}`);
  return fixture;
});

type Theme = (typeof THEMES)[number];

function expectedLayout(fixture: FeedCaseFixture, width: number) {
  if (width < 1200) return "mobile";
  return fixture.resultState === "exact" ? "desktop-rich" : "desktop-thin";
}

async function openFixture(
  page: Page,
  fixture: FeedCaseFixture,
  theme: Theme
): Promise<void> {
  await page.addInitScript((selectedTheme) => {
    localStorage.setItem("theme", selectedTheme);
  }, theme);
  await routeSearchFeedFixtures(page);
  await page.goto(searchFeedUrl(fixture));
  await expect(page.locator("html")).toHaveClass(
    theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/
  );
  await expect(page.locator(FEED_ROOT)).toBeVisible();
  await expect(page.getByTestId("feed-layout")).toBeVisible();
  await page.locator(FEED_ROOT).evaluate(async (root) => {
    await document.fonts.ready;
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      images.map(async (image) => {
        if (image.complete && image.naturalWidth > 0) return;
        image.loading = "eager";
        await image.decode();
      })
    );
  });
}

async function expectNoPageOverflow(page: Page, width: number): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("[data-feed-root]");
    if (!root) throw new Error("Missing search-feed root");
    const rect = root.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      rootLeft: rect.left,
      rootRight: rect.right,
    };
  });

  expect.soft(geometry.viewport).toBe(width);
  expect.soft(geometry.documentScrollWidth).toBeLessThanOrEqual(width);
  expect.soft(geometry.bodyScrollWidth).toBeLessThanOrEqual(width);
  expect.soft(geometry.rootLeft).toBeGreaterThanOrEqual(-0.5);
  expect.soft(geometry.rootRight).toBeLessThanOrEqual(width + 0.5);
}

async function expectEveryRailEndReachable(page: Page): Promise<void> {
  const rails = await page.locator(FEED_ROOT).evaluate((root) => {
    const candidates = Array.from(root.querySelectorAll<HTMLElement>("*"));
    return candidates.flatMap((rail, index) => {
      const style = getComputedStyle(rail);
      if (
        !["auto", "scroll"].includes(style.overflowX) ||
        rail.scrollWidth <= rail.clientWidth + 1 ||
        rail.children.length === 0
      ) {
        return [];
      }

      rail.scrollLeft = rail.scrollWidth;
      const last = rail.lastElementChild as HTMLElement;
      const railRect = rail.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      return [
        {
          index,
          block: rail
            .closest("[data-feed-block]")
            ?.getAttribute("data-feed-block"),
          label: rail.getAttribute("aria-label"),
          tag: rail.tagName.toLowerCase(),
          reachable:
            lastRect.left >= railRect.left - 1 &&
            lastRect.right <= railRect.right + 1,
          railRight: railRect.right,
          lastRight: lastRect.right,
        },
      ];
    });
  });

  for (const rail of rails) {
    expect.soft(rail.reachable, JSON.stringify(rail)).toBe(true);
  }
}

async function expectThinFeedCentered(page: Page): Promise<void> {
  const box = await page.getByTestId("feed-layout").boundingBox();
  if (!box) throw new Error("Missing desktop-thin feed layout");
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect.soft(box.width).toBeLessThanOrEqual(880.5);
  expect
    .soft(Math.abs(box.x + box.width / 2 - viewportWidth / 2))
    .toBeLessThanOrEqual(1);
}

async function expectFirstPosterFitsOpening(
  page: Page,
  width: number,
  fixtureId: FeedCaseFixture["id"]
): Promise<void> {
  const expected =
    width < 1200 ? { width: 130, height: 231 } : { width: 160, height: 284 };
  const poster = page.locator('[data-feed-block="shorts"] img').first();
  await expect(poster).toBeVisible();
  const box = await poster.boundingBox();
  if (!box) throw new Error("Missing first search-feed poster");

  expect.soft(Math.abs(box.width - expected.width)).toBeLessThanOrEqual(0.25);
  expect.soft(Math.abs(box.height - expected.height)).toBeLessThanOrEqual(0.25);
  expect.soft(box.y).toBeGreaterThanOrEqual(0);
  const verticalChain = await page.locator(FEED_ROOT).evaluate((root) => {
    const measurement = (selector: string) => {
      const element = root.matches(selector)
        ? root
        : root.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        y: Math.round(rect.y * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        bottom: Math.round(rect.bottom * 100) / 100,
      };
    };
    return Object.fromEntries(
      [
        ["root", "[data-feed-root]"],
        ["form", 'form[role="search"]'],
        ["lenses", '[data-feed-block="lenses"]'],
        ["answer", '[data-feed-opening="answer"]'],
        ["verdict", '[data-feed-block="verdict"]'],
        ["appellations", '[data-feed-block="appellations"]'],
        ["shortsHeading", '[data-feed-block="shorts"] > header'],
        ["shortsList", '[data-feed-block="shorts"] > ul'],
        ["poster", '[data-feed-block="shorts"] img'],
      ].map(([name, selector]) => [name, measurement(selector)])
    );
  });
  expect
    .soft(
      box.y + box.height,
      `${fixtureId} ${width}px vertical chain: ${JSON.stringify(verticalChain)}`
    )
    .toBeLessThanOrEqual(800);
}

async function expectDesktopZonesMatchFixture(
  page: Page,
  fixture: FeedCaseFixture
): Promise<void> {
  const expected = (zone: "primary" | "secondary") =>
    fixture.board.blocks.desktop
      .filter((block) => block.zone === zone)
      .map((block) => block.id);
  const actual = async (zone: "primary" | "secondary") =>
    page
      .locator(`[data-feed-stream="${zone}"] > [data-feed-block]`)
      .evaluateAll((blocks) =>
        blocks.map((block) => ({
          id: block.getAttribute("data-feed-block"),
          zone: block.getAttribute("data-feed-zone"),
        }))
      );

  const expectedPrimary = expected("primary");
  const expectedSecondary = expected("secondary");
  const primary = await actual("primary");
  const secondary = await actual("secondary");

  expect(primary.map(({ id }) => id)).toEqual(expectedPrimary);
  expect(primary.every(({ zone }) => zone === "primary")).toBe(true);
  expect(secondary.map(({ id }) => id)).toEqual(expectedSecondary);
  expect(secondary.every(({ zone }) => zone === "secondary")).toBe(true);

  if (expectedSecondary.length === 0) return;

  const columns = await page
    .getByTestId("feed-movement")
    .evaluate((movement) => {
      const primaryStream = movement.querySelector<HTMLElement>(
        '[data-feed-stream="primary"]'
      );
      const secondaryStream = movement.querySelector<HTMLElement>(
        '[data-feed-stream="secondary"]'
      );
      if (!primaryStream || !secondaryStream) return null;
      const primaryRect = primaryStream.getBoundingClientRect();
      const secondaryRect = secondaryStream.getBoundingClientRect();
      return {
        primaryLeft: primaryRect.left,
        primaryRight: primaryRect.right,
        secondaryLeft: secondaryRect.left,
        secondaryRight: secondaryRect.right,
      };
    });

  expect(columns, "Missing rich-desktop feed columns").not.toBeNull();
  expect.soft(columns!.primaryLeft).toBeLessThan(columns!.secondaryLeft);
  expect
    .soft(columns!.primaryRight)
    .toBeLessThanOrEqual(columns!.secondaryLeft);
  expect
    .soft(columns!.secondaryRight)
    .toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth + 0.5));
}

async function expectVisibleControlsUsable(page: Page): Promise<void> {
  const controls = await page.locator(FEED_ROOT).evaluate((root) => {
    const selector =
      'a[href], button, input, select, textarea, [role="button"]';
    const elements = Array.from(
      new Set(root.querySelectorAll<HTMLElement>(selector))
    );

    const isVisible = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        style.clip === "auto" &&
        style.clipPath === "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const hasHorizontalRail = (element: HTMLElement) => {
      for (
        let ancestor = element.parentElement;
        ancestor && root.contains(ancestor);
        ancestor = ancestor.parentElement
      ) {
        const overflowX = getComputedStyle(ancestor).overflowX;
        if (
          ["auto", "scroll"].includes(overflowX) &&
          ancestor.scrollWidth > ancestor.clientWidth + 1
        ) {
          return true;
        }
      }
      return false;
    };

    return elements
      .filter(isVisible)
      .filter((element) => !hasHorizontalRail(element))
      .map((element) => {
        const labelledControl = element as HTMLInputElement;
        const hitTarget =
          element.closest<HTMLElement>("label") ??
          labelledControl.labels?.item(0) ??
          element;
        const rect = hitTarget.getBoundingClientRect();
        const label =
          element.getAttribute("aria-label") ??
          element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ??
          element.tagName.toLowerCase();
        const clippedBy = [] as string[];

        for (
          let ancestor = element.parentElement;
          ancestor && root.contains(ancestor);
          ancestor = ancestor.parentElement
        ) {
          const style = getComputedStyle(ancestor);
          if (
            !["hidden", "clip"].includes(style.overflowX) &&
            !["hidden", "clip"].includes(style.overflow)
          ) {
            continue;
          }
          const ancestorRect = ancestor.getBoundingClientRect();
          if (
            rect.left < ancestorRect.left - 0.5 ||
            rect.right > ancestorRect.right + 0.5
          ) {
            clippedBy.push(
              ancestor.getAttribute("data-feed-block") ??
                ancestor.tagName.toLowerCase()
            );
          }
        }

        return {
          label,
          tag: element.tagName.toLowerCase(),
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          clippedBy,
        };
      });
  });
  const viewportWidth = await page.evaluate(() => window.innerWidth);

  for (const control of controls) {
    const context = JSON.stringify(control);
    expect.soft(control.width, context).toBeGreaterThanOrEqual(43.5);
    expect.soft(control.height, context).toBeGreaterThanOrEqual(43.5);
    expect.soft(control.left, context).toBeGreaterThanOrEqual(-0.5);
    expect
      .soft(control.right, context)
      .toBeLessThanOrEqual(viewportWidth + 0.5);
    expect.soft(control.clippedBy, context).toEqual([]);
  }
}

async function expectDesktopOpeningAlignment(page: Page): Promise<void> {
  const answer = page.locator('[data-feed-opening="answer"]');
  const appellations = answer.locator('[data-feed-block="appellations"]');
  if ((await appellations.count()) === 0) return;

  const geometry = await answer.evaluate((answerElement) => {
    const verdictElement = answerElement.querySelector<HTMLElement>(
      '[data-feed-block="verdict"]'
    );
    const verdictEyebrow = verdictElement?.querySelector<HTMLElement>("p");
    const appellationsHeading = answerElement.querySelector<HTMLElement>(
      '[data-feed-block="appellations"] h2'
    );
    if (!verdictEyebrow || !appellationsHeading) return null;
    const answerRect = answerElement.getBoundingClientRect();
    const answerStyle = getComputedStyle(answerElement);
    const verdictRect = verdictEyebrow.getBoundingClientRect();
    const appellationsRect = appellationsHeading.getBoundingClientRect();
    return {
      answerContentTop:
        answerRect.top + Number.parseFloat(answerStyle.paddingTop),
      verdictTop: verdictRect.top,
      appellationsTop: appellationsRect.top,
    };
  });
  if (!geometry) throw new Error("Missing desktop opening geometry");

  expect
    .soft(Math.abs(geometry.verdictTop - geometry.answerContentTop))
    .toBeLessThanOrEqual(0.5);
  expect
    .soft(Math.abs(geometry.appellationsTop - geometry.verdictTop - 8))
    .toBeLessThanOrEqual(0.5);
}

async function structuralSnapshot(page: Page) {
  return page.locator(FEED_ROOT).evaluate((root) => {
    const roundedRect = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height].map(
        (value) => Math.round(value * 100) / 100
      );
    };
    const selectors = [
      'form[role="search"]',
      '[data-feed-block="lenses"]',
      '[data-feed-block="verdict"]',
      '[data-feed-block="appellations"]',
      '[data-feed-block="shorts"]',
      '[data-feed-block="shorts"] img',
    ];

    return {
      blocks: Array.from(root.querySelectorAll("[data-feed-block]"), (block) =>
        block.getAttribute("data-feed-block")
      ),
      boxes: Object.fromEntries(
        selectors.map((selector) => [
          selector,
          roundedRect(root.querySelector(selector)),
        ])
      ),
    };
  });
}

// @req REQ-180
test.describe("search-feed responsive geometry", () => {
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  for (const fixture of CASES) {
    for (const theme of THEMES) {
      test(`${fixture.id} · ${theme} holds every responsive boundary`, async ({
        page,
      }) => {
        await openFixture(page, fixture, theme);

        for (const width of WIDTHS) {
          await test.step(`${width}px`, async () => {
            await page.setViewportSize({ width, height: 800 });
            const layout = expectedLayout(fixture, width);
            await expect(page.getByTestId("feed-layout")).toHaveAttribute(
              "data-feed-layout",
              layout
            );
            await expectNoPageOverflow(page, width);
            await expectEveryRailEndReachable(page);
            await expectVisibleControlsUsable(page);

            if (layout === "desktop-thin") {
              await expectThinFeedCentered(page);
            }
            if (POSTER_WIDTHS.has(width)) {
              await expectFirstPosterFitsOpening(page, width, fixture.id);
            }
          });
        }
      });
    }
  }
});

// @req REQ-180
test.describe("search-feed complete fixture geometry", () => {
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  for (const fixture of FEED_CASES) {
    test(`${fixture.id} keeps its opening and desktop zones usable`, async ({
      page,
    }) => {
      const failedRequests: Array<{ url: string; error: string | null }> = [];
      page.on("requestfailed", (request) => {
        failedRequests.push({
          url: request.url(),
          error: request.failure()?.errorText ?? null,
        });
      });
      await openFixture(page, fixture, "light");

      await page.setViewportSize({ width: 430, height: 800 });
      await expect(page.getByTestId("feed-layout")).toHaveAttribute(
        "data-feed-layout",
        expectedLayout(fixture, 430)
      );
      await expectFirstPosterFitsOpening(page, 430, fixture.id);
      await expectVisibleControlsUsable(page);

      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.getByTestId("feed-layout")).toHaveAttribute(
        "data-feed-layout",
        expectedLayout(fixture, 1200)
      );
      await expectDesktopZonesMatchFixture(page, fixture);
      await expectDesktopOpeningAlignment(page);

      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(page.getByTestId("feed-layout")).toHaveAttribute(
        "data-feed-layout",
        expectedLayout(fixture, 1280)
      );
      await expectFirstPosterFitsOpening(page, 1280, fixture.id);
      await expectVisibleControlsUsable(page);
      const unexpectedFailedRequests = failedRequests.filter(
        ({ url, error }) => {
          const requestUrl = new URL(url);
          return !(
            error === "net::ERR_ABORTED" &&
            requestUrl.pathname === "/api/v2/search"
          );
        }
      );
      expect(unexpectedFailedRequests).toEqual([]);
    });
  }
});

// @req REQ-180
test.describe("search-feed accessibility", () => {
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  for (const fixture of CASES) {
    for (const theme of THEMES) {
      test(`${fixture.id} · ${theme} has no serious or critical axe violation at 430px`, async ({
        page,
      }, testInfo) => {
        await openFixture(page, fixture, theme);
        await page.setViewportSize({ width: 430, height: 800 });

        const results = await new AxeBuilder({ page })
          .include(FEED_ROOT)
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const blocking = results.violations.filter(
          ({ impact }) => impact === "serious" || impact === "critical"
        );
        await testInfo.attach("axe-serious-critical.json", {
          body: JSON.stringify(blocking, null, 2),
          contentType: "application/json",
        });

        expect(blocking).toEqual([]);
      });
    }
  }
});

// @req REQ-180
test.describe("search-feed theme geometry", () => {
  test.skip(LOCALE !== "fr", "The approved board copy is French");

  for (const fixture of CASES) {
    test(`${fixture.id} keeps the same structure by day and night`, async ({
      page,
    }) => {
      await openFixture(page, fixture, "light");

      for (const width of [430, 1280]) {
        await test.step(`${width}px`, async () => {
          await page.setViewportSize({ width, height: 800 });
          const layout = expectedLayout(fixture, width);
          await expect(page.getByTestId("feed-layout")).toHaveAttribute(
            "data-feed-layout",
            layout
          );
          await page.locator("html").evaluate((root) => {
            root.classList.remove("dark");
            root.classList.add("light");
            root.style.colorScheme = "light";
          });
          const day = await structuralSnapshot(page);

          await page.locator("html").evaluate((root) => {
            root.classList.remove("light");
            root.classList.add("dark");
            root.style.colorScheme = "dark";
          });
          await expect(page.locator("html")).toHaveClass(/\bdark\b/);
          await page.evaluate(
            () => new Promise((resolve) => requestAnimationFrame(resolve))
          );

          expect(await structuralSnapshot(page)).toEqual(day);
        });
      }
    });
  }
});
