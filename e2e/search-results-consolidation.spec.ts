import { expect, test } from "@playwright/test";
import { getLocalizedRoute } from "@/lib/routing";
import { LOCALE } from "./support/locale";

/**
 * The rendered-page rules behind REQ-178 and DEC-057, verified against the
 * reviewed feed (`SearchFeed`) rather than the retired `NameAnswer` page this
 * spec asserted until ETNI-1966: the result count owns the page title, and no
 * form of a shared or disambiguated name is promoted over another — every
 * subject a name answers to is listed, none moved into a side rail or
 * dropped. Unit tests (`SearchFeed.test.tsx`) cover the branching grammar
 * with synthetic fixtures; this spec covers the live-corpus and breakpoint
 * layout contract those fixtures cannot.
 */

const SERP_URL = getLocalizedRoute(LOCALE, "search");

// "Yoruba" is an exact name shared by a people and a language in the live
// AFRIK corpus — a cross-type clash, not the same-type one ("Bassa", three
// peoples) the reviewed feed's synthetic tests cover. The page must keep
// every subject and ask which one the reader means instead of promoting any
// of them (`hasCrossTypeDisambiguation` in SearchFeed.tsx).
const DISAMBIGUATED_QUERY = "Yoruba";
// Long enough to be well past the corpus, short enough to stay a single
// query — guaranteed zero hits, so the page must admit that the atlas does not
// know the name instead of presenting a zero-result count as its answer.
const NO_MATCH_QUERY = "zzzznonexistentqueryxyz12345";

test.beforeEach(async ({ page }) => {
  // Same consent bypass as e2e/home-search-first.spec.ts: this is a headless
  // run against a local dev server, not a human meeting the cookie banner —
  // setting the flag before navigation keeps the banner from ever mounting.
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
});

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
      document.documentElement.clientWidth
  );
}

// The answer lives under « Tout »: the default lens is the name history
// whenever a searched subject carries one (REQ-198), as Yoruba's people does.
async function openAnswerLens(page: import("@playwright/test").Page) {
  const all = page.getByRole("button", { name: "Tout", exact: true });
  await all.click();
  await expect(all).toHaveAttribute("aria-pressed", "true");
}

test.describe("SERP title and answer rule (REQ-178, DEC-057)", () => {
  // @req REQ-124
  test("shows the brand title before any query is run", async ({ page }) => {
    await page.goto(SERP_URL);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("Recherche");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  // @req REQ-124
  test("keeps the result count in h1 and disambiguates every subject below it, none promoted", async ({
    page,
  }) => {
    await page.goto(`${SERP_URL}?q=${encodeURIComponent(DISAMBIGUATED_QUERY)}`);
    const headings = page.getByRole("heading", { level: 1 });
    // The page opens on « Histoire du nom » once the Yoruba people carries a
    // name history (#1622, REQ-198). That lens must not crown the subject it
    // has a history for either: the shared name stays the one title.
    await expect(
      page.getByRole("button", { name: "Histoire du nom" })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(headings).toHaveCount(1);
    await expect(headings.first()).toContainText(DISAMBIGUATED_QUERY);

    await openAnswerLens(page);
    await expect(headings).toHaveCount(1);
    await expect(headings.first()).toContainText(DISAMBIGUATED_QUERY);

    // Two or more subjects answer to the same name: each gets its own answer
    // (its own « what it is » block, with its type label) and its own button
    // to its fiche; none is the page's single answer.
    const answers = page.locator('[data-feed-block="answer-what"]');
    await expect(answers.first()).toBeVisible();
    expect(await answers.count()).toBeGreaterThanOrEqual(2);
    for (const answer of await answers.all()) {
      await expect(answer).toContainText(DISAMBIGUATED_QUERY);
    }
    expect(
      await page.locator('[data-feed-block="fiche-link"] a').count()
    ).toBeGreaterThanOrEqual(2);
    // `search-pivot` was the retired dominant-answer side rail (DEC-057);
    // this asserts its absence rather than the shape that replaced it, since
    // the replacement is the per-subject answers, already asserted above.
    await expect(page.getByTestId("search-pivot")).toHaveCount(0);
  });

  // @req REQ-124
  test("names the searched form in h1 and admits when the atlas does not know it", async ({
    page,
  }) => {
    await page.goto(`${SERP_URL}?q=${encodeURIComponent(NO_MATCH_QUERY)}`);
    // The reviewed feed's h1 is the searched form itself, unknown or not; the
    // retired page kept the generic "Recherche" title instead.
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toHaveText(NO_MATCH_QUERY);
    // SearchFeed's "unknown" state — no result, no lead — draws the
    // confession in its verdict panel rather than a dedicated testid; the
    // retired page's `name-answer-unknown` had no reviewed-feed counterpart
    // to rename onto, since the confession is now the verdict text itself.
    await expect(
      page.getByText("Nous ne connaissons pas ce nom.")
    ).toBeVisible();
  });
});

test.describe("SERP one-column answer rule (REQ-178, DEC-057)", () => {
  for (const viewport of [
    { name: "mobile", width: 430, height: 812 },
    { name: "tablet", width: 720, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    // @req REQ-178
    test(`keeps the answer in the result column on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(
        `${SERP_URL}?q=${encodeURIComponent(DISAMBIGUATED_QUERY)}`
      );

      // `feed-layout` is SearchFeedLayout's own root: one reading column, the
      // answer's blocks in its flow. What DEC-057 rules out — the answer
      // pinned or floated out of the normal flow — is what stays asserted.
      const layout = page.getByTestId("feed-layout");
      await expect(layout).toBeVisible();
      expect(await noHorizontalScroll(page)).toBe(true);

      await openAnswerLens(page);
      const answer = page.locator('[data-feed-block="answer-what"]').first();
      await expect(answer).toBeVisible();

      const position = await answer.evaluate(
        (element) => getComputedStyle(element).position
      );
      expect(position).not.toBe("sticky");
      expect(await noHorizontalScroll(page)).toBe(true);
    });
  }
});
