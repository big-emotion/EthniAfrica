import { expect, test } from "@playwright/test";
import { LOCALE } from "./support/locale";

const french = LOCALE === "fr";
const intro = french ? "Essayez avec" : "Try";
const renew = french ? "Autres exemples" : "More examples";

for (const width of [320, 390, 430, 768, 1199, 1440]) {
  // @req REQ-112
  test(`@smoke compact home fits and renews examples at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${LOCALE}`);
    const search = page.getByRole("search");
    await expect(search).toBeVisible();
    const examples = page.getByRole("list", { name: intro });
    const chips = examples.getByRole("button");
    await expect(chips).toHaveCount(4);
    const before = await chips.allTextContents();
    await page.getByRole("button", { name: renew, exact: true }).click();
    await expect.poll(() => chips.allTextContents()).not.toEqual(before);
    const flow = page.locator(
      '.home-hero, [data-testid="home-contribute"], [data-testid="home-project"]'
    );
    expect(
      await flow.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-testid") ?? node.className)
      )
    ).toEqual(["home-hero", "home-contribute", "home-project"]);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("main h2")).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    for (const chip of await chips.all()) {
      const box = await chip.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    const word = await chips.first().innerText();
    await chips.first().click();
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}/atlas/`));
    expect(new URL(page.url()).searchParams.get("q")).toBe(word);
  });
}

// @req REQ-115
test("contribution invitation opens the contribution page", async ({
  page,
}) => {
  await page.goto(`/${LOCALE}`);
  const contribution = page.getByTestId("home-contribute");
  await contribution
    .getByRole("link", {
      name: french ? "Contribuer" : "Contribute",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/contribute$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
