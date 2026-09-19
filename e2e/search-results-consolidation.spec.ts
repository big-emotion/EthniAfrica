import { expect, test } from "@playwright/test";
import { getLocalizedRoute } from "@/lib/routing";
import { LOCALE } from "./support/locale";

// English UI copy lands per translation wave (REQ-142 to REQ-146). Until it
// does, the labels this spec reads are French, so the English matrix leg
// skips it rather than fail on copy it was never asked to check — and the
// leg's report says so, instead of counting the journey as covered.
test.skip(
  LOCALE !== "fr",
  "English copy lands per wave — this spec reads French UI copy"
);

/**
 * The rendered-page rules behind REQ-178 and DEC-057: the result count owns
 * the page title, while `NameAnswer` answers the reader's name without
 * promoting one form or moving the answer into a side rail. Unit tests cover
 * the branching grammar; this spec covers its live-corpus and breakpoint
 * layout contract.
 */

const SERP_URL = getLocalizedRoute(LOCALE, "search");

// "Yoruba" is an exact name shared by a people and a language in the live
// AFRIK corpus. The page must keep both subjects and ask which one the reader
// means instead of promoting either result.
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

test.describe("SERP title and answer rule (REQ-178, DEC-057)", () => {
  // @req REQ-124
  test("shows the brand title before any query is run", async ({ page }) => {
    await page.goto(SERP_URL);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("Recherche");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  // @req REQ-124
  test("keeps the result count in h1 and disambiguates exact subjects below it", async ({
    page,
  }) => {
    await page.goto(`${SERP_URL}?q=${encodeURIComponent(DISAMBIGUATED_QUERY)}`);
    const headings = page.getByRole("heading", { level: 1 });
    await expect(headings).toHaveCount(1);
    await expect(headings.first()).toContainText("résultat");
    await expect(headings.first()).toContainText(DISAMBIGUATED_QUERY);

    const answer = page.getByTestId("name-answer-disambiguation");
    await expect(answer).toBeVisible();
    await expect(answer.getByRole("heading", { level: 2 }).first()).toHaveText(
      "Lequel cherchez-vous ?"
    );
    await expect(
      answer.getByRole("link", { name: DISAMBIGUATED_QUERY, exact: true })
    ).toHaveCount(2);
    await expect(page.getByTestId("search-pivot")).toHaveCount(0);
  });

  // @req REQ-124
  test("keeps the default title and admits when the atlas does not know the name", async ({
    page,
  }) => {
    await page.goto(`${SERP_URL}?q=${encodeURIComponent(NO_MATCH_QUERY)}`);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("Recherche");
    await expect(page.getByTestId("name-answer-unknown")).toBeVisible();
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

      const layout = page.getByTestId("search-results-layout");
      const answer = page.getByTestId("name-answer-disambiguation");
      await expect(layout).toBeVisible();
      await expect(answer).toBeVisible();

      const [layoutBox, answerBox, position] = await Promise.all([
        layout.boundingBox(),
        answer.boundingBox(),
        answer.evaluate((element) => getComputedStyle(element).position),
      ]);
      expect(layoutBox).not.toBeNull();
      expect(answerBox).not.toBeNull();
      expect(Math.abs(answerBox!.x - layoutBox!.x)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(
          answerBox!.x + answerBox!.width - (layoutBox!.x + layoutBox!.width)
        )
      ).toBeLessThanOrEqual(1);
      expect(position).not.toBe("sticky");
      expect(await noHorizontalScroll(page)).toBe(true);
    });
  }
});
