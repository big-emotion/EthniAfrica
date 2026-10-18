/**
 * The search result page opens on the name-history timeline (ETNI-2012,
 * REQ-198) at 430px. The API is routed: the search answers with the lingala
 * language alone, and its fiche with the condensed lingala history the unit
 * tests use, so the spec does not depend on what a database holds.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
  await expect(birth).toContainText(
    "Origine la plus ancienne connue du nom Lingala"
  );
  await expect(birth).toContainText("1902");
  await expect(page.locator('[data-placement="before"]')).toHaveCount(2);

  await page.getByRole("button", { name: "Ailleurs à la même époque" }).click();
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

// The sources button after a passage (ETNI-2015, brief 11 §3): a small
// coloured mark and its label, a 44px target (charter §8 as amended
// 2026-10-17), opening the sources with the key to the colours.
// @req REQ-198
// @req REQ-194
test("@smoke a passage's sources button opens its sources and the colour key", async ({
  page,
}) => {
  await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=lingala`);

  const diamond = page
    .locator("[data-name-timeline]")
    .getByRole("button", { name: /^Sources? : .*, voir les sources$/ })
    .first();
  await expect(diamond).toBeVisible();
  await expect(diamond).toHaveText(/^Sources?$/);

  const target = await diamond.boundingBox();
  expect(target?.width).toBeGreaterThanOrEqual(44);
  expect(target?.height).toBeGreaterThanOrEqual(44);
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

// The shared focus utility compiled to a shadow colour and drew no ring, so a
// keyboard reader lost their place on every control below. The ring is a 2px
// band outside a 2px gap of the ground, in day and in night; the bands are the
// --afh-focus-ring inks, 3:1 or more on their ground.
// @req REQ-047
test("@smoke @nfr-a11y every representative control shows its focus ring", async ({
  page,
}) => {
  await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=lingala`);
  const timeline = page.locator("[data-name-timeline]");
  await expect(timeline).toBeVisible();

  const controls = {
    "lens tab": page.getByRole("button", {
      name: searchFeedCopy.fr.filters.timeline,
      exact: true,
    }),
    "timeline name chip": page.getByRole("button", { name: "Mangala" }),
    "source diamond": timeline
      .getByRole("button", { name: /^Sources? : .*, voir les sources$/ })
      .first(),
    "lens « Tout »": page.getByRole("button", {
      name: searchFeedCopy.fr.filters.all,
    }),
  };

  // :focus-visible only follows a keyboard: one Tab first, then focus().
  await page.keyboard.press("Tab");
  const ringsIn = async (theme: "day" | "night") => {
    await page.evaluate(
      (night) => document.documentElement.classList.toggle("dark", night),
      theme === "night"
    );
    const rings: Record<string, string> = {};
    for (const [name, control] of Object.entries(controls)) {
      await control.focus();
      rings[name] = await control.evaluate(
        (el) => getComputedStyle(el).boxShadow
      );
    }
    return rings;
  };

  const band = (rgb: string) =>
    new RegExp(`0px 0px 0px 2px, rgb\\(${rgb}\\) 0px 0px 0px 4px$`);
  for (const [name, ring] of Object.entries(await ringsIn("day"))) {
    expect(ring, name).toMatch(band("182, 78, 39"));
  }
  for (const [name, ring] of Object.entries(await ringsIn("night"))) {
    expect(ring, name).toMatch(band("205, 114, 94"));
  }

  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  const results = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`)
  ).toEqual([]);
});

// Brief 11 on the Peul page (boards search-peul-430, search-state-peul-
// fulbe-open-430): the Fula fiche's own name history, and one short made on
// the people, routed so the spec does not depend on a database.
test.describe("?q=peul hands the reader on to Fulɓe", () => {
  const FULA = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json"
      ),
      "utf8"
    )
  );
  const PEUL_ROW = {
    id: "PPL_FULA",
    nameMain: "Peul",
    languageFamilyId: "FLG_ATLANTIQUE",
    languageFamilyName: "Atlantique",
    languageFamilyNameEn: "Atlantic",
    currentCountries: ["SEN", "GIN", "MLI"],
    relevance: 1,
    exactMatch: true,
    snippet: null,
    content: { appellations: {} },
  };
  const FULBE_SHORT = {
    id: "fulbe-personne-appele-comme-ca",
    href: "/fr/decouvertes/videos/fulbe-personne-appele-comme-ca",
    name: "Fulbe",
    description: "Peul, Fulbe, Foulani, Fellata : d'où viennent ces noms ?",
    publishedAt: "2026-09-14",
    durationSeconds: 155,
    watchUrl: "https://www.youtube.com/shorts/_znLd1YO_iU",
    poster: {
      src: "/images/discoveries/videos/fulbe-personne-appele-comme-ca.jpg",
      alt: "Affiche de la vidéo sur le nom Fulbe",
      width: 540,
      height: 960,
    },
    source: { title: "Fulbe — EthniAfrica", url: null, tier: "referenced" },
    match: { relation: "exact", entityType: "people", entityId: "PPL_FULA" },
  };

  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v2/search**", async (route) => {
      const { pathname } = new URL(route.request().url());
      await route.fulfill({
        status: 200,
        json:
          pathname === "/api/v2/search/companions"
            ? {
                data: {
                  ...EMPTY_COMPANIONS,
                  subjects: [{ entityType: "people", entityId: "PPL_FULA" }],
                  shorts: { count: 1, items: [FULBE_SHORT] },
                },
              }
            : {
                data: {
                  ...SEARCH_ENVELOPE.data,
                  peoples: [PEUL_ROW],
                  peoplesTotal: 1,
                  languages: [],
                  languagesTotal: 0,
                },
              },
      });
    });
    await page.route("**/api/v2/peoples/PPL_FULA", (route) =>
      route.fulfill({
        status: 200,
        json: { data: { id: "PPL_FULA", nameHistory: FULA.nameHistory } },
      })
    );
    await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=peul`);
    await expect(page.locator("[data-name-timeline]")).toBeVisible();
  });

  // Charter §8 as amended 2026-10-17: the sources button is not a link in a
  // sentence; its 44px comes from padding the line does not see.
  // @req REQ-194
  test("@smoke every sources button is a 44px target and no passage line grows", async ({
    page,
  }) => {
    const measures = await page
      .locator("[data-name-timeline] .afh-name-timeline-statement")
      .evaluateAll((passages) =>
        passages.map((passage) => {
          const lineHeight = parseFloat(getComputedStyle(passage).lineHeight);
          const lines = passage.getBoundingClientRect().height / lineHeight;
          const button = passage.querySelector("button.afh-source-diamond");
          const box = button?.getBoundingClientRect();
          const style = button ? getComputedStyle(button) : null;
          return {
            lines,
            width: box?.width ?? 44,
            height: box?.height ?? 44,
            layoutHeight: box
              ? box.height +
                parseFloat(style!.marginTop) +
                parseFloat(style!.marginBottom)
              : 0,
            lineHeight,
          };
        })
      );

    expect(measures.length).toBeGreaterThan(0);
    for (const measure of measures) {
      expect(measure.width).toBeGreaterThanOrEqual(44);
      expect(measure.height).toBeGreaterThanOrEqual(44);
      expect(measure.layoutHeight).toBeLessThanOrEqual(measure.lineHeight);
      // A whole number of lines: the button opened no taller line.
      expect(Math.abs(measure.lines - Math.round(measure.lines))).toBeLessThan(
        0.05
      );
    }
  });

  // @req REQ-198
  // @req REQ-180
  test("@smoke the hand-off and the video row are 44px targets, and the hand-off lands on Fulɓe's chips", async ({
    page,
  }) => {
    const handOff = page.getByRole("button", {
      name: "Lire l'histoire du nom Fulɓe",
    });
    const video = page.getByRole("link", { name: /^Une vidéo sur ce peuple/ });
    await expect(video).toHaveAttribute("href", FULBE_SHORT.href);
    expect((await handOff.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await video.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator("video, iframe")).toHaveCount(0);

    await handOff.click();
    // Exact: the lead's own name also holds « Fulɓe ».
    const fulbe = page.getByRole("button", { name: "Fulɓe", exact: true });
    await expect(fulbe).toHaveAttribute("aria-pressed", "true");
    await expect(fulbe).toBeFocused();
    const chips = page.getByRole("group", { name: "Les noms de Peul" });
    await expect
      .poll(async () => (await chips.boundingBox())!.y, { timeout: 5_000 })
      .toBeLessThan(page.viewportSize()!.height / 2);
    await expect(
      page.locator(".afh-name-timeline-intro", {
        hasText: "Ils se nomment Fulɓe au pluriel et Pullo au singulier.",
      })
    ).toBeInViewport();
    await expect(
      page.getByText(
        "Fin de ce que nos recherches retracent pour le nom Fulɓe."
      )
    ).toBeAttached();
  });
});
