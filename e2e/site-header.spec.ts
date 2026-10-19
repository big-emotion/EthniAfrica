import { expect, test } from "@playwright/test";
import { PRODUCT_NAME } from "@/lib/brand";
import { LOCALE } from "./support/locale";

const PHONE_ROUTES = [
  `/${LOCALE}`,
  `/${LOCALE}/atlas/recherche?q=camara`,
] as const;

for (const width of [320, 360]) {
  for (const route of PHONE_ROUTES) {
    // @req REQ-114
    test(`@smoke brand lockup fits at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 850 });
      await page.goto(route);

      const brand = page.getByTestId("site-brand");
      const name = brand.locator(".sh-brand-name");
      await expect(name).toHaveText(PRODUCT_NAME);
      await expect(brand.locator(".sh-brand-tagline")).toBeHidden();

      expect(
        await name.evaluate((node) => node.scrollWidth <= node.clientWidth),
        "The full wordmark should fit without clipping or ellipsis"
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        ),
        `Expected no horizontal overflow at ${width}px on ${route}`
      ).toBe(true);
    });
  }
}

for (const width of [320, 360, 430, 768, 1280]) {
  // @req REQ-114 @req REQ-115
  test(`@cross-viewport visible site-header controls have 44px targets at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/${LOCALE}`);

    const header = page.getByTestId("site-header");
    const controls = header.locator(
      '.sh-bar button:visible, .sh-bar a:visible:not([data-testid="site-brand"])'
    );
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);

    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(
        box,
        "Every visible header control should have a box"
      ).not.toBeNull();
      expect(box!.width, "Header control target width").toBeGreaterThanOrEqual(
        44
      );
      expect(
        box!.height,
        "Header control target height"
      ).toBeGreaterThanOrEqual(44);
    }

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      ),
      `Expected no horizontal overflow at ${width}px`
    ).toBe(true);
  });
}
