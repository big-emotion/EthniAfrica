/**
 * Comments per passage on the search result page (brief 21, REQ-212) at
 * 430px: a passage's footer opens its thread in a sheet, a comment is sent
 * with an address, and the sheet says to check the mailbox. The API is
 * routed, as in `name-timeline.spec.ts`: the search answers with lingala,
 * its fiche with the condensed lingala history, and the comments read and
 * write against stubs, so the spec does not depend on a database or a mail
 * server.
 */
import { expect, test } from "@playwright/test";

import { getLocalizedRoute } from "../src/lib/routing";
import { LINGALA_HISTORY } from "../src/lib/search/__fixtures__/nameTimelineFixtures";
import { LOCALE } from "./support/locale";

const SEARCH_ENVELOPE = {
  data: {
    peoples: [],
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    quizzes: [],
    languages: [
      {
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
      },
    ],
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

const NAMING = "language:lin:naming";

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
  await page.route("**/api/v2/comments?**", (route) =>
    route.fulfill({
      status: 200,
      json: {
        data: [
          {
            block_key: NAMING,
            count: 1,
            corrected_at: null,
            threads: [
              {
                id: "9c81ca0d-ae45-4f08-8f53-2ac0a9673abd",
                public_slug: "00EZK83QDV",
                flag_kind: "other",
                body: "Chez nous, on dit aussi Ngala pour le fleuve.",
                counter_source_url: null,
                counter_source_citation: null,
                proposed_rewrite: null,
                knowledge_basis: "language",
                status: "open",
                remediation_state: null,
                display_name: null,
                created_at: "2026-11-09T10:00:00.000Z",
                replies: [],
              },
            ],
          },
        ],
      },
    })
  );
  // An easy challenge: the browser still solves it in its worker.
  await page.route("**/api/v2/antibot/challenge**", (route) =>
    route.fulfill({
      status: 200,
      json: {
        data: {
          salt: "e2e-salt",
          difficultyBits: 1,
          expiresAt: Date.now() + 600_000,
          signature: "e2e-signature",
        },
      },
    })
  );
});

// @req REQ-212
test("@smoke a passage's footer opens its thread, and a sent comment waits for the mailbox", async ({
  page,
}) => {
  let posted: Record<string, unknown> | undefined;
  await page.route("**/api/v2/flags", async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      json: {
        data: {
          id: "f-1",
          public_slug: "NEWSLUG001",
          status: "open",
          created_at: "2026-11-18T10:00:00.000Z",
        },
      },
    });
  });

  await page.goto(`${getLocalizedRoute(LOCALE, "search")}?q=lingala`);

  const count = page.getByRole("button", { name: "1 commentaire" }).first();
  await expect(count).toBeVisible();
  const box = await count.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);

  await count.click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Commentaires sur ce passage")).toBeVisible();
  await expect(sheet.getByText("Un lecteur", { exact: true })).toBeVisible();

  await sheet
    .getByLabel("Votre commentaire")
    .fill("Le nom vient aussi des gens du fleuve, chez nous.");
  await sheet.getByLabel("Votre adresse e-mail").fill("lectrice@exemple.fr");
  await sheet.getByLabel("J'ai 15 ans ou plus").check();
  await expect(sheet.getByTestId("antibot-status")).toHaveAttribute(
    "data-phase",
    "solved"
  );
  await sheet.getByRole("button", { name: "Envoyer mon commentaire" }).click();

  await expect(sheet.getByText("Vérifiez votre boîte mail")).toBeVisible();
  expect(posted).toMatchObject({
    target_type: "language",
    target_id: "lin",
    block_key: NAMING,
    reporter_email: "lectrice@exemple.fr",
    age_confirmed: true,
  });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );
  expect(overflow).toBe(false);
});
