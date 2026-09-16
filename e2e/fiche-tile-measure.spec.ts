import { expect, test, type Locator, type Page } from "@playwright/test";

import { countryCopy } from "@/lib/i18n/copy/country";
import { getCountryRoute } from "@/lib/routing";

import { LOCALE } from "./support/locale";

/**
 * Brand charter §8.7 — two columns on a phone admit only atomic cells.
 *
 * A tile's measure is a rendered value: it falls out of the viewport, the
 * parchment's container query and the loaded face together, and none of the
 * three exists in jsdom. That is exactly how `.afh-tiles` shipped at two
 * columns of twelve characters on a phone under a green unit suite, so this
 * spec measures the opened tile on the page a reader gets.
 *
 * Morocco because that is the record the failure was measured on
 * (2026-09-16): its culture chapter carries the long unbroken passages that
 * made 140 px of measure visible.
 */
const COUNTRY_FICHE_URL = getCountryRoute(LOCALE, "MAR");
const CULTURE_CHAPTER = countryCopy[LOCALE].sections.culture;

const PHONE = { width: 430, height: 812 };

/**
 * Wide enough for the parchment's content box to cross the 760 px container
 * threshold. The spec asserts the crossing rather than assuming it: the
 * parchment's own inline padding keeps a 768 px viewport under the query, so
 * a viewport number alone proves nothing.
 */
const WIDE = { width: 1200, height: 900 };

/**
 * The first thirty-five characters of the very sentence that fell on five
 * lines. Thirty-five is the absolute mobile floor of §8.7 — well under the
 * 45-75 comfort range — and taking the sample from the corpus rather than
 * from repeated glyphs keeps the accents, the spaces and the parenthesis
 * that decide a real line's width.
 */
const MEASURE_FLOOR_SAMPLE = "Islam sunnite (école malékite major";

async function openCultureChapter(page: Page, viewport: typeof PHONE) {
  await page.setViewportSize(viewport);
  const response = await page.goto(COUNTRY_FICHE_URL, { waitUntil: "load" });
  expect(response?.status(), COUNTRY_FICHE_URL).toBeLessThan(400);

  const chapter = page.locator(`[data-fiche-section="${CULTURE_CHAPTER}"]`);
  await chapter.waitFor();
  // The sample is set in the page's own face, so an unresolved webfont would
  // measure a fallback and quietly move the floor.
  await page.evaluate(() => document.fonts.ready);
  return chapter;
}

/** The track count the grid computes, not the one the source declares. */
function columnCount(grid: Locator) {
  return grid.evaluate(
    (node) =>
      getComputedStyle(node).gridTemplateColumns.trim().split(/\s+/).length
  );
}

test.describe("@phase-1 fiche tiles — a tile of prose keeps its measure", () => {
  // @req REQ-153
  test("a culture tile opened on a phone clears the mobile measure floor", async ({
    page,
  }) => {
    const chapter = await openCultureChapter(page, PHONE);
    const grid = chapter.locator(".afh-tiles").first();

    expect(await columnCount(grid)).toBe(1);

    const tile = grid.locator("details.afh-tile").first();
    await tile.locator("summary").click();
    await expect(tile).toHaveAttribute("open", "");

    const body = tile.locator(".afh-tile-body");
    const { measure, floor } = await body.evaluate((node, sample) => {
      // A ruler inside the body inherits the body's type, so the floor is
      // stated in the same glyphs the reader is looking at.
      const ruler = document.createElement("span");
      ruler.textContent = sample;
      ruler.style.whiteSpace = "pre";
      ruler.style.position = "absolute";
      ruler.style.visibility = "hidden";
      node.append(ruler);
      const floorWidth = ruler.getBoundingClientRect().width;
      ruler.remove();

      const style = getComputedStyle(node);
      return {
        measure:
          node.getBoundingClientRect().width -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight),
        floor: floorWidth,
      };
    }, MEASURE_FLOOR_SAMPLE);

    expect(
      measure,
      `${Math.round(measure)}px of measure against ${Math.round(floor)}px for thirty-five characters`
    ).toBeGreaterThanOrEqual(floor);
  });

  // @req REQ-153
  test("the tiles return to two columns once the parchment crosses 760px", async ({
    page,
  }) => {
    const chapter = await openCultureChapter(page, WIDE);
    const grid = chapter.locator(".afh-tiles").first();

    const containerWidth = await grid.evaluate((node) => {
      const parchment = node.closest<HTMLElement>(".afh-parchment")!;
      const style = getComputedStyle(parchment);
      return (
        parchment.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight)
      );
    });

    expect(
      containerWidth,
      "the query container was not crossed"
    ).toBeGreaterThanOrEqual(760);
    expect(await columnCount(grid), `container ${containerWidth}px`).toBe(2);
  });
});
