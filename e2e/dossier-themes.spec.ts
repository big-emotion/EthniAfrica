import { getDossierThemeHref } from "@/lib/dossiers/themes";
import { getLocalizedRoute, getNommerChapterRoute } from "@/lib/routing";
import { expect, test } from "@playwright/test";
import { LOCALE } from "./support/locale";

/**
 * The dossiers axis while its readings are withdrawn.
 *
 * This file used to walk the theme directory: pick a theme from the select,
 * land on its page, follow the canonical dossier. Every step of that walk now
 * ends on a 404, so the spec asserts what stands instead — the hub, the one
 * reading still offered, and the addresses that serve nothing.
 */
test.describe("Dossiers while the readings are withdrawn @cross-viewport", () => {
  // @req REQ-140
  test("names the hub Articles in English, and leads to the anecdotes", async ({
    page,
  }) => {
    test.skip(LOCALE !== "en", "English copy assertion");
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto(getLocalizedRoute(LOCALE, "dossiersHub"));

    await expect(
      page.getByRole("heading", { name: "Articles", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Anecdotes", exact: true })
    ).toHaveAttribute("href", getLocalizedRoute(LOCALE, "anecdotes"));
  });

  for (const width of [320, 375, 430, 768, 1199, 1200, 1440]) {
    // @req REQ-114
    test(`keeps the hub readable and unscrollable sideways at ${width}px`, async ({
      page,
    }) => {
      test.skip(LOCALE !== "fr", "French copy assertion");
      await page.setViewportSize({ width, height: 900 });
      await page.goto(getLocalizedRoute(LOCALE, "dossiersHub"));

      await expect(
        page.getByRole("heading", { name: "Articles", exact: true })
      ).toBeVisible();

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    });
  }

  /**
   * The menu promises four destinations and no more; the addresses of the
   * withdrawn readings serve nothing. A reader with a bookmark, a crawler with
   * an old sitemap and a shared link all arrive here.
   */
  // @req REQ-114
  test("lists four Articles destinations as links, and serves none of the withdrawn readings", async ({
    page,
  }) => {
    test.skip(LOCALE !== "fr", "French copy assertion");
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto(getLocalizedRoute(LOCALE, "dossiersHub"));

    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const tray = page.getByRole("dialog");
    await tray.getByRole("button", { name: /Articles/ }).click();

    for (const id of ["articles", "anecdotes", "proverbes"]) {
      const entry = tray.getByTestId(`site-nav-module-${id}`);
      await expect(entry).not.toContainText("Bientôt");
      await expect(entry).toHaveAttribute("href", /.+/);
    }
    await expect(tray.getByTestId("site-nav-module-nommer")).toHaveCount(0);

    for (const route of [
      getLocalizedRoute(LOCALE, "nommer"),
      getNommerChapterRoute(LOCALE, "la-personne"),
      getLocalizedRoute(LOCALE, "migrations"),
      getLocalizedRoute(LOCALE, "colonization"),
      getDossierThemeHref("noms", LOCALE),
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(404);
    }
  });

  // The one deep link the freeze must not break.
  // @req REQ-114
  test("keeps the anecdote deep link reachable", async ({ page }) => {
    test.skip(LOCALE !== "fr", "French copy assertion");
    const response = await page.goto(
      `${getLocalizedRoute(LOCALE, "anecdotes")}?a=monrovia`
    );

    expect(response?.status()).toBe(200);
    await expect(page.locator("article#monrovia")).toBeVisible();
  });
});
