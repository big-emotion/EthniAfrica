import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { getLocalizedRoute, getPeopleRoute } from "@/lib/routing";
import { activateFicheGlobe } from "./support/atlas";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { getSearchLabel } from "@/lib/search/searchVocabulary";
import { LOCALE } from "./support/locale";

/**
 * The people fiche had no a11y gate at all, while the family fiche has had a
 * blocking one since ETNI-463. Everything the globe gained — a listbox picker,
 * a toolbar, a drag surface, a facts panel — is new keyboard territory, and it
 * would otherwise land with no net under it.
 *
 * Three samples, because the corpus has three regimes and they render
 * different chrome: half the fiches declare one country and get no picker and
 * no "Toute l'aire" at all, the mockup was drawn on a five-country fiche, and
 * PPL_BANTU stacks 21 halos and 21 options. A pass on the middle one says
 * nothing about the other two.
 *
 * Runs on mobile-430, the source-of-truth viewport. It fails its own job, but
 * that job is not a required check — only gitleaks and build are — so a
 * violation here is red and still mergeable. Read the finding, do not read the
 * merge button.
 */
const PEOPLE_SAMPLES = [
  { id: "PPL_YORUBA", regime: "five countries — the mockup's own sample" },
  { id: "PPL_BANTU", regime: "21 countries — the widest field in the corpus" },
];

// @req REQ-115
test.describe("@nfr-a11y people fiche — axe-core", () => {
  for (const sample of PEOPLE_SAMPLES) {
    // @req REQ-115
    test(`has zero serious/critical violations on ${sample.id} (${sample.regime})`, async ({
      page,
    }) => {
      await page.goto(getPeopleRoute(LOCALE, sample.id));
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );

      expect(
        blocking,
        blocking
          .map(
            (v) =>
              `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.helpUrl}`
          )
          .join("\n")
      ).toEqual([]);
    });
  }

  // The picker exists so a country that has rotated behind the sphere is still
  // reachable. If it cannot be operated from the keyboard it has not solved
  // that for the readers who most needed it solved.
  // @req REQ-117
  test("reaches every country of presence from the keyboard alone", async ({
    page,
  }) => {
    await page.goto(getPeopleRoute(LOCALE, "PPL_YORUBA"));
    await page.waitForLoadState("networkidle");
    await activateFicheGlobe(page, "keyboard");

    // Found by its accessible name, the way the readers this test is about
    // find it. The selector here used to be `[data-atlas-picker]`, an
    // attribute no component ever carried — so the test could not fail, and
    // did not, because e2e never ran in CI either.
    const picker = page.getByRole("button", {
      name: "Choisir un pays de présence",
    });
    await picker.focus();
    await page.keyboard.press("Enter");

    const options = page.getByRole("option");
    await expect(options.first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    // Named, not just "a dialog": the cookie banner is one too, so a bare
    // role match is ambiguous and never resolved to the panel.
    await expect(
      page.getByRole("dialog", { name: /Yoruba au / })
    ).toBeVisible();

    // Escape has to hand focus back, or a keyboard reader is stranded at the
    // top of the document several tab stops from where they were.
    await picker.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(picker).toBeFocused();
  });
});

const SEARCH_URL = getLocalizedRoute(LOCALE, "search");

async function openSearchFilters(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: /^Voir aussi/ })
    .first()
    .click();
}

async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let index = 0; index < 60; index += 1) {
    if (
      await target.evaluate((element) => element === document.activeElement)
    ) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error("Keyboard navigation did not reach the expected control.");
}

async function expectCharterFocusRing(
  page: Page,
  target: Locator
): Promise<void> {
  const expected = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.boxShadow = getComputedStyle(document.documentElement)
      .getPropertyValue("--afh-ring-focus")
      .trim();
    document.body.append(probe);
    const shadow = getComputedStyle(probe).boxShadow;
    probe.remove();
    return shadow;
  });
  await expect(target).toHaveCSS("outline-style", "none");
  const actualShadow = await target.evaluate(
    (element) => getComputedStyle(element).boxShadow
  );
  expect(actualShadow).toContain(expected);
}

test.describe("search page keyboard access and narrow widths", () => {
  // @req REQ-180
  test("shows the charter focus ring on the search field, filters and onward links", async ({
    page,
  }) => {
    await page.goto(`${SEARCH_URL}?q=peul`);

    const input = page.getByRole("combobox", { name: getSearchLabel(LOCALE) });
    const filters = page
      .getByRole("navigation", { name: searchFeedCopy.fr.filters.label })
      .getByRole("button")
      .first();
    await expect(input).toBeVisible();
    await tabTo(page, input);
    await expectCharterFocusRing(page, input);

    // Opening the disclosure moves focus past the answer's many source links.
    // Check the input first so reaching it never depends on a full-page wrap.
    await openSearchFilters(page);
    await tabTo(page, filters);
    await expectCharterFocusRing(page, filters);
    await expect(filters).toHaveCSS("font-size", "14px");

    await page.goto(`${SEARCH_URL}?q=zzqxv`);
    const onwardLinks = page
      .getByTestId("feed-block-further")
      .getByRole("link");
    await expect(onwardLinks.first()).toBeVisible();
    for (const link of await onwardLinks.all()) {
      await tabTo(page, link);
      await expectCharterFocusRing(page, link);
      await expect(link).toHaveCSS("font-size", "14px");
    }
  });

  // @req REQ-180
  test("keeps filter and onward-link text at the approved 14 px across widths", async ({
    page,
  }) => {
    for (const width of [430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${SEARCH_URL}?q=peul`);
      await openSearchFilters(page);

      const filters = page
        .getByRole("navigation", { name: searchFeedCopy.fr.filters.label })
        .getByRole("button");
      await expect(filters.first()).toBeVisible();
      for (const filter of await filters.all()) {
        await expect(filter).toHaveCSS("font-size", "14px");
      }

      await page.goto(`${SEARCH_URL}?q=zzqxv`);
      const onwardLinks = page
        .getByTestId("feed-block-further")
        .getByRole("link");

      await expect(onwardLinks.first()).toBeVisible();
      for (const link of await onwardLinks.all()) {
        await expect(link).toHaveCSS("font-size", "14px");
      }
    }
  });

  // @req REQ-180
  test("keeps the unknown-name page within 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(`${SEARCH_URL}?q=zzqxv`);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
  });

  // A 215 CSS px viewport represents a 430 px device at 200% browser zoom.
  // @req REQ-180
  test("wraps a long searched name without sideways scrolling at 200% zoom", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 215, height: 812 });
    await page.goto(`${SEARCH_URL}?q=tchikayamboulassou`);

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCSS("overflow-wrap", "anywhere");
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
  });
});
