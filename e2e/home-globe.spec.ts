import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LOCALE } from "./support/locale";

// The map and its activation control were retired from the home on
// 2026-09-23. Atlas and fiche browser suites cover the shared globe itself.
for (const theme of ["light", "dark"]) {
  // @req REQ-112
  test(`home stays accessible without retired sections in ${theme} mode`, async ({
    page,
  }) => {
    await page.addInitScript(
      (mode) => localStorage.setItem("theme", mode),
      theme
    );
    await page.setViewportSize({ width: 430, height: 900 });
    await page.goto(`/${LOCALE}`);
    await expect(page.getByRole("search")).toBeVisible();
    await expect(
      page.locator(
        '.home-hero-visual, [data-testid="home-stories"], [data-testid="home-counts"], [data-testid="home-featured"]'
      )
    ).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      result.violations.filter((violation) =>
        ["serious", "critical"].includes(violation.impact ?? "")
      )
    ).toEqual([]);
  });
}
