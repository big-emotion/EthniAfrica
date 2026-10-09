/**
 * The search result page opens on the name-history timeline (ETNI-2012,
 * REQ-198) at 430px. The API is routed: the search answers with the lingala
 * language alone, and its fiche with the condensed lingala history the unit
 * tests use, so the spec does not depend on what a database holds.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { getLocalizedRoute } from "../src/lib/routing";
import { LINGALA_HISTORY } from "../src/lib/search/__fixtures__/nameTimelineFixtures";
import { searchFeedCopy } from "../src/lib/i18n/copy/searchFeed";
import { LOCALE } from "./support/locale";

const LINGALA_ROW = {
  id: "lin",
  name: "Lingala",
  nameEn: "Lingala",
  familyId: "FLG_BANTU",
  familyName: "Bantou",
  familyNameEn: "Bantu",
  relevance: 1,
  exactMatch: true,
  snippet: null,
  content: { peoples: [] },
};

const SEARCH_ENVELOPE = {
  data: {
    peoples: [],
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    quizzes: [],
    languages: [LINGALA_ROW],
    places: [],
    peoplesTotal: 0,
    countriesTotal: 0,
    familiesTotal: 0,
    personsTotal: 0,
    patronymesTotal: 0,
    quizzesTotal: 0,
    languagesTotal: 1,
    placesTotal: 0,
    total: 1,
    leads: [],
    nearNames: [],
    nameAnswers: [],
    wordAnswers: [],
    nameSuggestions: [],
  },
};

const EMPTY_COMPANIONS = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v2/search**", async (route) => {
    const { pathname } = new URL(route.request().url());
    await route.fulfill({
      status: 200,
      json:
        pathname === "/api/v2/search/companions"
          ? { data: EMPTY_COMPANIONS }
          : SEARCH_ENVELOPE,
    });
  });
  await page.route("**/api/v2/languages/lin", (route) =>
    route.fulfill({
      status: 200,
      json: { data: { id: "lin", nameHistory: LINGALA_HISTORY } },
    })
  );
});

// @req REQ-198
test("@smoke a search for lingala opens on its name-history timeline", async ({
  page,
}) => {
  await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=lingala`);

  // Exact: « Histoire du nom » is also the start of the tile list's name.
  const timelineLens = page.getByRole("button", {
    name: searchFeedCopy.fr.filters.timeline,
    exact: true,
  });
  await expect(timelineLens).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Lingala · cherché" })
  ).toHaveAttribute("aria-pressed", "true");

  const birth = page.locator('[data-placement="birth"]');
  await expect(birth).toContainText("Naissance du nom Lingala");
  await expect(birth).toContainText("1902");
  await expect(page.locator('[data-placement="before"]')).toHaveCount(2);

  await page
    .getByRole("button", { name: "Pendant ce temps, ailleurs" })
    .click();
  await expect(page.locator("[data-elsewhere]").first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow).toBe(false);

  const results = await new AxeBuilder({ page })
    .include("[data-name-timeline]")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`)
  ).toEqual([]);
});

// The diamond after a passage (ETNI-2015): a 24px target around a small
// coloured mark, opening the sources with the key to the colours.
// @req REQ-198
test("@smoke a passage's diamond opens its sources and the colour key", async ({
  page,
}) => {
  await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=lingala`);

  const diamond = page
    .locator("[data-name-timeline]")
    .getByRole("button", { name: /^Sources? : .* — voir les sources$/ })
    .first();
  await expect(diamond).toBeVisible();

  const target = await diamond.boundingBox();
  expect(target?.width).toBeGreaterThanOrEqual(24);
  expect(target?.height).toBeGreaterThanOrEqual(24);
  const mark = await diamond.locator(".afh-source-diamond-mark").boundingBox();
  // Rotated 45°, the 8px mark's box is about 11px across.
  expect(mark?.width).toBeLessThan(16);

  await page.keyboard.press("Shift+Tab");
  await diamond.focus();
  const ring = await diamond.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).not.toBe("none");

  await diamond.click();
  const sheet = page.getByRole("dialog");
  await expect(
    sheet.getByRole("region", {
      name: "La couleur du losange indique le type de source",
    })
  ).toBeVisible();
  await expect(
    sheet.getByRole("listitem").filter({ hasText: "Archive" }).first()
  ).toBeVisible();
});

// « Tout » is one tap away and brings the answer back.
// @req REQ-198
test("@smoke « Tout » leaves the timeline for the answer", async ({ page }) => {
  await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=lingala`);
  await page
    .getByRole("button", { name: searchFeedCopy.fr.filters.all })
    .click();

  await expect(page.locator("[data-name-timeline]")).toHaveCount(0);
});
