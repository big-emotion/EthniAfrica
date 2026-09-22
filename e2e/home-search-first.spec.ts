import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { LOCALE } from "./support/locale";

// English UI copy lands per translation wave (REQ-142 to REQ-146). Until it
// does, the labels this spec reads are French, so the English matrix leg
// skips it rather than fail on copy it was never asked to check — and the
// leg's report says so, instead of counting the journey as covered.
test.skip(
  LOCALE !== "fr",
  "English copy lands per wave — this spec reads French UI copy"
);

const HOME_URL = `/${LOCALE}?hero=mercator`;
const MOBILE_VIEWPORT = { width: 430, height: 812 } as const;
const DESKTOP_VIEWPORT = { width: 1240, height: 900 } as const;
const SEEDS_LIST_NAME = "Essayez avec";

type ElementBox = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

async function elementBox(locator: Locator): Promise<ElementBox> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

function bottom(box: ElementBox): number {
  return box.y + box.height;
}

function right(box: ElementBox): number {
  return box.x + box.width;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "ethni-consent",
      JSON.stringify({
        hasConsented: true,
        preferences: { essential: true, analytics: true, functional: true },
        consentDate: "2026-01-01T00:00:00.000Z",
      })
    );
  });
  await page.goto(HOME_URL);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

// The composition ruled on 2026-09-22: the question and its search open the
// page, three still example chips under the field, then the featured answer
// (when a campaign is open), the stories, the drawn visual, the project and
// the figures last. One DOM order at every width.
// @req REQ-112
test.describe("Search-first home — mobile source of truth (ETNI-1513)", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  // @req REQ-112
  test("@smoke puts the search and its three examples in the first 430px fold", async ({
    page,
  }) => {
    const hero = page.locator(".home-hero");
    const inner = hero.locator(".home-hero-inner");
    const copy = inner.locator(".home-hero-copy");
    const search = copy.getByRole("search");
    const seeds = copy.getByRole("list", { name: SEEDS_LIST_NAME });

    await expect(seeds.getByRole("button")).toHaveCount(3);
    await expect(page.getByTestId(/^home-count-/)).toHaveCount(3);
    await expect(page.getByTestId("home-did-you-know")).toHaveCount(0);

    const searchBox = await elementBox(search);
    const seedsBox = await elementBox(seeds);

    expect(searchBox.y).toBeGreaterThanOrEqual(0);
    expect(bottom(searchBox)).toBeLessThanOrEqual(MOBILE_VIEWPORT.height);
    expect(seedsBox.y).toBeGreaterThanOrEqual(bottom(searchBox) - 1);

    // Reading order and the one-column visual order agree on a phone.
    const pageFlow = await page
      .locator(
        '.home-hero-copy, [data-testid="home-stories"], .home-hero-visual, [data-testid="home-project"], [data-testid="home-counts"]'
      )
      .evaluateAll((nodes) =>
        nodes.map(
          (node) =>
            node.getAttribute("data-testid") ??
            (node.classList.contains("home-hero-copy") ? "copy" : "visual")
        )
      );
    expect(pageFlow).toEqual([
      "copy",
      "home-stories",
      "visual",
      "home-project",
      "home-counts",
    ]);

    // A content-driven band keeps the same used height when only the viewport
    // height changes. The computed floors also rule out vh/svh/dvh min-size
    // constraints without inspecting implementation source text.
    const readSizing = (locator: Locator) =>
      locator.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          height: element.getBoundingClientRect().height,
          minHeight: style.minHeight,
          maxHeight: style.maxHeight,
          minBlockSize: style.minBlockSize,
          maxBlockSize: style.maxBlockSize,
        };
      });

    const heroSizing = await readSizing(hero);
    const innerSizing = await readSizing(inner);
    for (const sizing of [heroSizing, innerSizing]) {
      expect(sizing.minHeight).toBe("0px");
      expect(sizing.maxHeight).toBe("none");
      expect(sizing.minBlockSize).toBe("0px");
      expect(sizing.maxBlockSize).toBe("none");
    }

    await page.setViewportSize({ width: MOBILE_VIEWPORT.width, height: 932 });
    await expect
      .poll(async () =>
        Math.abs((await readSizing(hero)).height - heroSizing.height)
      )
      .toBeLessThanOrEqual(1);
    expect(
      Math.abs((await readSizing(inner)).height - innerSizing.height)
    ).toBeLessThanOrEqual(1);
  });
});

// @req REQ-112
test.describe("Search-first home — desktop widening pass (ETNI-1513)", () => {
  test.use({
    viewport: DESKTOP_VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  });

  // The featured answer shares the band with the search from 1200px when a
  // campaign window is open; with none open the band is one column, and the
  // spec says which case it measured rather than passing on either silently.
  // @req REQ-112
  test("sets the featured answer beside the search when a campaign is open", async ({
    page,
  }) => {
    const inner = page.locator(".home-hero .home-hero-inner");
    const copy = inner.locator(".home-hero-copy");
    const seeds = copy.getByRole("list", { name: SEEDS_LIST_NAME });
    const featured = inner.getByTestId("home-featured");

    await expect(seeds.getByRole("button")).toHaveCount(3);
    await expect(page.getByTestId(/^home-count-/)).toHaveCount(3);

    test.skip(
      (await featured.count()) === 0,
      "No featured campaign is open on this date; the band is one column."
    );

    const copyBox = await elementBox(copy);
    const featuredBox = await elementBox(featured);

    expect(right(copyBox)).toBeLessThanOrEqual(featuredBox.x);
    expect(
      Math.min(bottom(copyBox), bottom(featuredBox)) -
        Math.max(copyBox.y, featuredBox.y)
    ).toBeGreaterThan(100);
  });
});
