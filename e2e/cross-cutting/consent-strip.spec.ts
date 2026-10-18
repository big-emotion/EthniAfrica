import { expect, test, type Locator, type Page } from "@playwright/test";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";
import { getStaticPageRoute } from "@/lib/routing";
import { LOCALE } from "../support/locale";

/**
 * The consent strip of brief 12 part C, as drawn on the `Main` board
 * (« Composants · bandeau de consentement (brief 12) »).
 *
 * The gate compares what the browser computes, not class names: a refusal
 * drawn lighter than the acceptance passes any class check and still makes
 * accepting the easier answer.
 */

// The board's measured heights (« Hauteurs mesurées »), one per layout. The
// code switches layout at 768 and 1200 px, so 720 keeps the 430 layout and
// 800 the 768 one.
const BOARD_HEIGHT = { narrow: 233, medium: 133, wide: 105 } as const;
type Layout = keyof typeof BOARD_HEIGHT;

const layoutFor = (width: number): Layout =>
  width < 768 ? "narrow" : width < 1200 ? "medium" : "wide";

// Reading order and focus order, at every width (approval record item 5).
const CONTROL_ORDER = [
  "Refuser",
  "Accepter",
  "Personnaliser",
  "Politique de données",
];

const STYLE_KEYS = [
  "backgroundColor",
  "color",
  "borderTopColor",
  "borderTopWidth",
  "borderTopStyle",
  "fontWeight",
  "fontSize",
] as const;

function strip(page: Page): Locator {
  return page.getByRole("dialog", { name: "Gestion des cookies" });
}

function controls(page: Page): Locator[] {
  const dialog = strip(page);
  return [
    dialog.getByRole("button", { name: "Refuser", exact: true }),
    dialog.getByRole("button", { name: "Accepter", exact: true }),
    dialog.getByRole("button", { name: "Personnaliser", exact: true }),
    dialog.getByRole("link", { name: "Politique de données", exact: true }),
  ];
}

async function answerStyle(locator: Locator) {
  return locator.evaluate(
    (element, keys) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(
        keys.map((key) => [key, style[key as keyof CSSStyleDeclaration]])
      );
    },
    [...STYLE_KEYS]
  );
}

// A token resolved the way the browser paints it, so the comparison holds in
// whatever colour syntax the engine reports.
async function tokenColour(page: Page, value: string): Promise<string> {
  return page.evaluate((cssValue) => {
    const probe = document.createElement("span");
    probe.style.color = cssValue;
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, value);
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

test.describe("@cross-viewport consent strip", () => {
  // The suite seeds a returning reader's consent; this reader has none.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto(getStaticPageRoute(LOCALE, "dataPolicy"));
    // The strip mounts on the first scroll after hydration. A scroll sent
    // before the listener exists is lost, so it is repeated until it lands.
    await expect(async () => {
      await page.evaluate(() => window.scrollBy(0, 200));
      await expect(strip(page)).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
  });

  test("sits on the bottom edge, full width, no taller than the board", async ({
    page,
  }) => {
    // @req REQ-046
    const viewport = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
    }));
    const box = await boxOf(strip(page));

    expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThanOrEqual(
      1
    );
    expect(Math.abs(box.width - viewport.width)).toBeLessThanOrEqual(1);
    expect(Math.round(box.height)).toBeLessThanOrEqual(
      BOARD_HEIGHT[layoutFor(viewport.width)]
    );
  });

  test("draws « Refuser » and « Accepter » the same, in ink, unfilled", async ({
    page,
  }) => {
    // @req REQ-088
    const [refuse, accept] = controls(page);
    const ink = await tokenColour(page, "var(--afh-text)");
    const refuseStyle = await answerStyle(refuse);

    expect(await answerStyle(accept)).toEqual(refuseStyle);
    expect(refuseStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(refuseStyle.color).toBe(ink);
    expect(refuseStyle.borderTopColor).toBe(ink);
    expect(refuseStyle.borderTopStyle).toBe("solid");
    expect(
      Math.abs((await boxOf(refuse)).width - (await boxOf(accept)).width)
    ).toBeLessThanOrEqual(1);
  });

  test("gives every control a 44 px target", async ({ page }) => {
    // @req REQ-046
    for (const control of controls(page)) {
      const box = await boxOf(control);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("lays the controls out in two rows below 768 px and in one row from 768 px", async ({
    page,
  }) => {
    // @req REQ-046
    const width = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    const boxes = await Promise.all(controls(page).map(boxOf));
    const middle = boxes.map((box) => box.y + box.height / 2);
    const [refuse, accept, customise, policy] = middle;

    if (layoutFor(width) === "narrow") {
      expect(Math.abs(refuse - accept)).toBeLessThanOrEqual(1);
      expect(Math.abs(customise - policy)).toBeLessThanOrEqual(1);
      expect(boxes[2].y).toBeGreaterThanOrEqual(boxes[0].y + boxes[0].height);
    } else {
      for (const centre of middle) {
        expect(Math.abs(centre - refuse)).toBeLessThanOrEqual(1);
      }
    }

    if (layoutFor(width) === "wide") {
      const text = await boxOf(strip(page).getByText(/Avec votre accord/));
      expect(text.x + text.width).toBeLessThanOrEqual(boxes[0].x);
    }
  });

  test("reads and tabs through the controls in the same order", async ({
    page,
    browserName,
  }) => {
    // @req REQ-046
    const placed = await Promise.all(
      controls(page).map(async (control) => ({
        label: (await control.textContent())?.trim(),
        box: await boxOf(control),
      }))
    );
    const onScreen = [...placed]
      .sort((a, b) => {
        const rowGap =
          a.box.y + a.box.height / 2 - (b.box.y + b.box.height / 2);
        return Math.abs(rowGap) > 4 ? rowGap : a.box.x - b.box.x;
      })
      .map((control) => control.label);
    expect(onScreen).toEqual(CONTROL_ORDER);

    await expect(strip(page)).toBeFocused();
    // WebKit, like Safari by default, tabs to form fields only; Option+Tab
    // is its key for walking every control.
    const nextControl = browserName === "webkit" ? "Alt+Tab" : "Tab";
    const tabbed: (string | undefined)[] = [];
    for (let i = 0; i < CONTROL_ORDER.length; i += 1) {
      await page.keyboard.press(nextControl);
      tabbed.push(
        await page.evaluate(() => document.activeElement?.textContent?.trim())
      );
    }
    expect(tabbed).toEqual(CONTROL_ORDER);
  });

  test("holds the focus itself on arrival, without a ring", async ({
    page,
  }) => {
    // @req REQ-088
    const dialog = strip(page);
    await expect(dialog).toBeFocused();
    expect(
      await dialog.evaluate((element) => getComputedStyle(element).outlineStyle)
    ).toBe("none");
    const [refuse, accept] = controls(page);
    await expect(refuse).not.toBeFocused();
    await expect(accept).not.toBeFocused();
  });

  test("opens « Personnaliser » above the answers, with nothing in terracotta", async ({
    page,
  }) => {
    // @req REQ-088
    const dialog = strip(page);
    const [refuse, , customise] = controls(page);
    await customise.click();
    await expect(customise).toHaveAttribute("aria-expanded", "true");

    const panel = page.locator(
      `[id="${await customise.getAttribute("aria-controls")}"]`
    );
    await expect(panel).toBeVisible();
    const panelBox = await boxOf(panel);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(
      (await boxOf(refuse)).y
    );

    const save = dialog.getByRole("button", {
      name: "Enregistrer mes préférences",
    });
    expect(await answerStyle(save)).toEqual(await answerStyle(refuse));
    expect((await boxOf(save)).height).toBeGreaterThanOrEqual(44);

    const switches = dialog.getByRole("switch");
    await expect(switches).toHaveCount(3);
    for (const target of await switches.all()) {
      const box = await boxOf(target);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    // Locked on, the essential switch keeps the full ink rather than dimming
    // into the look of an off switch.
    expect(
      await dialog
        .getByRole("switch", { name: "Cookies essentiels" })
        .evaluate((element) => getComputedStyle(element).opacity)
    ).toBe("1");

    const forbidden = [
      await tokenColour(page, "var(--afh-terracotta)"),
      await tokenColour(page, "hsl(var(--primary))"),
    ];
    const painted = await dialog.evaluate((root) =>
      [root, ...root.querySelectorAll("*")].flatMap((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.color, style.borderTopColor];
      })
    );
    for (const colour of forbidden) {
      expect(painted).not.toContain(colour);
    }

    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect((await boxOf(dialog)).height).toBeLessThanOrEqual(viewportHeight);
  });

  test("refuses on Escape", async ({ page }) => {
    // @req REQ-088
    await expect(strip(page)).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(strip(page)).toBeHidden();

    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      CONSENT_STORAGE_KEY
    );
    expect(stored).toMatchObject({
      hasConsented: true,
      preferences: { analytics: false, embeds: false },
    });
  });
});
