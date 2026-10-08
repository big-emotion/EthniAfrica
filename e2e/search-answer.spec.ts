/**
 * Acceptance criteria of the answer page (plan: docs/design/search-answer-plan.md,
 * lot F). Written first and red by design: the page it describes is lot B+G,
 * and this spec must be green in that PR before it merges.
 *
 * What the page owes this spec, so B+G knows what to emit:
 * - each answer block is a `data-feed-block` named `answer-what`,
 *   `answer-origin`, `answer-names`, `answer-where`, `answer-next`,
 *   `answer-sources`, in that DOM order; a block with no data is absent;
 * - the "read more" control of the origin block carries
 *   `data-answer-read-more`;
 * - the filters are the existing `nav` named by `searchFeedCopy.filters.label`.
 *
 * Words: interface strings come from the copy dictionaries; the sentences of
 * the answers come from the shared fixtures, so a mockup, a component test and
 * this spec say the same thing. At 768 and 1280 px the mockup is the same
 * 430 px board, so only layout invariants are asserted there.
 */
import { expect, test, type Page } from "@playwright/test";

import {
  ANSWER_FIXTURES,
  type AnswerFixture,
  type AnswerFixtureCase,
} from "../src/lib/search/__fixtures__/answerFixtures";
import type { SearchAnswer } from "../src/lib/search/answer";
import { nameAnswerCopy } from "../src/lib/i18n/copy/nameAnswer";
import { searchFeedCopy } from "../src/lib/i18n/copy/searchFeed";

import {
  routeSearchAnswerFixtures,
  searchAnswerUrl,
} from "./support/search-feed-fixture";

const WIDTHS = [320, 430, 768, 1280];
// The thin desktop feed's bound: no line of text stretches past it.
const READING_WIDTH_MAX = 880.5;
// Characters per line, averaged over a wrapped paragraph: the measure the
// search-result charter §7 rules (about 70, never past 80).
const READING_CHARS_MAX = 80;
const ANSWER_BLOCK = '[data-feed-block^="answer-"]';

const tidy = (text: string) => text.replace(/[  ]/g, " ").replace(/\s+/g, " ");
const firstSentence = (text: string) =>
  tidy(text).match(/^.*?[.!?](?=\s|$)/)?.[0] ?? tidy(text);

function expectedBlocks(
  answer: SearchAnswer,
  originShownAbove = false
): string[] {
  return [
    "answer-what",
    ...(answer.origin && !originShownAbove ? ["answer-origin"] : []),
    ...(answer.names.length > 0 || answer.path ? ["answer-names"] : []),
    ...(answer.where ? ["answer-where"] : []),
    ...(answer.next ? ["answer-next"] : []),
    "answer-sources",
  ];
}

function answersOf(fixture: AnswerFixture): SearchAnswer[] {
  return [
    ...fixture.answers,
    ...(fixture.andAlso ?? []),
    ...(fixture.wordAnswers ?? []),
  ];
}

/**
 * Two subjects that tell the very same origin (the two Congos) say it once,
 * before their own blocks, instead of twice in a row.
 */
function sharesOneOrigin(answers: SearchAnswer[]): boolean {
  const texts = (answer: SearchAnswer) =>
    JSON.stringify(answer.origin?.accounts.map(({ text }) => text) ?? null);
  return (
    answers.length > 1 &&
    answers.every(
      (answer) => answer.origin && texts(answer) === texts(answers[0])
    )
  );
}

/**
 * Two countries bearing the name are told once: one of each block, the
 * follow-up being the one a fiche wrote (a template speaks for one country).
 */
function expectedCountriesBlocks(countries: SearchAnswer[]): string[] {
  const writtenFollowUp = countries.some(
    (answer) => answer.next && "question" in answer.next
  );
  return [
    "answer-what",
    ...(countries.some((answer) => answer.origin) ? ["answer-origin"] : []),
    ...(countries.some((answer) => answer.names.length > 0)
      ? ["answer-names"]
      : []),
    ...(countries.some((answer) => answer.where) ? ["answer-where"] : []),
    ...(writtenFollowUp ? ["answer-next"] : []),
    "answer-sources",
  ];
}

function expectedPage(answers: SearchAnswer[]): string[] {
  const countries = answers.filter(({ kind }) => kind === "country");
  const merged = countries.length > 1;
  const singles = merged
    ? answers.filter(({ kind }) => kind !== "country")
    : answers;
  const shared = sharesOneOrigin(singles);
  return [
    ...(shared ? ["answer-origin"] : []),
    ...(merged ? expectedCountriesBlocks(countries) : []),
    ...singles.flatMap((answer) => expectedBlocks(answer, shared)),
  ];
}

async function openAnswer(page: Page, fixture: AnswerFixture): Promise<void> {
  await routeSearchAnswerFixtures(page);
  await page.goto(searchAnswerUrl(fixture));
  await expect(page.locator("[data-feed-root]")).toBeVisible();
  await expect(page.locator(ANSWER_BLOCK).first()).toBeVisible();
}

async function expectNoHorizontalScroll(
  page: Page,
  width: number
): Promise<void> {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect.soft(geometry.viewport).toBe(width);
  expect.soft(geometry.document).toBeLessThanOrEqual(width);
  expect.soft(geometry.body).toBeLessThanOrEqual(width);
}

async function expectBlocksInOrder(
  page: Page,
  fixture: AnswerFixture
): Promise<void> {
  const rendered = await page
    .locator(ANSWER_BLOCK)
    .evaluateAll((blocks) =>
      blocks.map((block) => block.getAttribute("data-feed-block"))
    );
  expect(rendered).toEqual(expectedPage(answersOf(fixture)));
}

async function expectTabsNeverEmpty(page: Page): Promise<void> {
  const nav = page.getByRole("navigation", {
    name: searchFeedCopy.fr.filters.label,
  });
  const tabs = nav.getByRole("button");
  const labels = await tabs.evaluateAll((buttons) =>
    buttons.map((button) => (button.textContent ?? "").trim())
  );
  expect(labels[0]).toContain(searchFeedCopy.fr.filters.all);
  await expect(tabs.first()).toHaveAttribute("aria-pressed", "true");
  for (const label of labels) {
    // A lens with nothing behind it is not offered: no tab ends on a 0 count.
    expect(label, `tab "${label}"`).not.toMatch(/(^|\D)0$/);
  }
}

async function expectReadingWidthBounded(page: Page): Promise<void> {
  const widths = await page
    .locator(ANSWER_BLOCK)
    .evaluateAll((blocks) =>
      blocks.map((block) => block.getBoundingClientRect().width)
    );
  for (const width of widths) {
    expect.soft(width).toBeLessThanOrEqual(READING_WIDTH_MAX);
  }
}

async function expectEveryReadingBeforeReadMore(
  page: Page,
  answer: SearchAnswer
): Promise<void> {
  const origin = page.locator('[data-feed-block="answer-origin"]').first();
  await expect(origin.locator("[data-answer-read-more]")).toBeVisible();
  const text = tidy(await origin.innerText());
  for (const account of answer.origin?.accounts ?? []) {
    expect(text).toContain(firstSentence(account.text));
  }
  const readMoreComesLast = await origin.evaluate((block) => {
    const control = block.querySelector("[data-answer-read-more]");
    if (!control) return false;
    return Array.from(block.querySelectorAll("p, li, blockquote")).every(
      (node) =>
        node.contains(control) ||
        Boolean(
          node.compareDocumentPosition(control) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
    );
  });
  expect(readMoreComesLast).toBe(true);
}

async function expectSpeakersInMillions(
  page: Page,
  answer: SearchAnswer
): Promise<void> {
  const where = page.locator('[data-feed-block="answer-where"]').first();
  const text = tidy(await where.innerText());
  for (const row of answer.where?.rows ?? []) {
    if (row.value === null) continue;
    const millions = (row.value / 1_000_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    });
    expect(text).toMatch(new RegExp(`${millions} M(?![a-z])`));
  }
  // No raw head count: 34 000 000, 34.000.000 or 34000000.
  expect(text).not.toMatch(/\d{1,3}([ .,]\d{3}){2}|\d{7,}/);
}

// @req REQ-178
test.describe("search answer page", () => {
  for (const [id, fixture] of Object.entries(ANSWER_FIXTURES) as Array<
    [AnswerFixtureCase, AnswerFixture]
  >) {
    // @req REQ-178
    test(`${id} answers in ordered blocks at every width`, async ({ page }) => {
      await openAnswer(page, fixture);

      for (const width of WIDTHS) {
        await test.step(`${width}px`, async () => {
          await page.setViewportSize({ width, height: 800 });
          await expectNoHorizontalScroll(page, width);
          await expectBlocksInOrder(page, fixture);
          await expectTabsNeverEmpty(page);
          if (width >= 768) await expectReadingWidthBounded(page);
        });
      }
    });
  }

  for (const id of ["lingala", "camara"] as const) {
    // @req REQ-178
    test(`${id} shows every reading of its origin before "read more"`, async ({
      page,
    }) => {
      const fixture = ANSWER_FIXTURES[id];
      await openAnswer(page, fixture);
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await expectEveryReadingBeforeReadMore(page, fixture.answers[0]);
      }
    });
  }

  for (const id of ["lingala", "bantou"] as const) {
    // @req REQ-178
    test(`${id} gives speakers in millions, never raw counts`, async ({
      page,
    }) => {
      const fixture = ANSWER_FIXTURES[id];
      await openAnswer(page, fixture);
      await page.setViewportSize({ width: 430, height: 800 });
      await expectSpeakersInMillions(page, fixture.answers[0]);
    });
  }

  // @req REQ-178
  test("bantou asks what is wanted and counts the peoples from the data", async ({
    page,
  }) => {
    const fixture = ANSWER_FIXTURES.bantou;
    await openAnswer(page, fixture);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await expect(
        page.getByRole("heading", { name: "Que cherchez-vous ?" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: `Voir les ${fixture.answers[0].what.facts.peopleCount} peuples`,
        })
      ).toBeVisible();
    }
  });

  // « pharaon » is the case that carries filter tabs in the fixtures.
  for (const id of [
    "peul",
    "bantou",
    "congo",
    "lingala",
    "camara",
    "pharaon",
  ] as const) {
    // @req REQ-178
    test(`${id} has no touch target under 44 px at 320 and 430 px`, async ({
      page,
    }) => {
      await openAnswer(page, ANSWER_FIXTURES[id]);
      for (const width of [320, 430]) {
        await page.setViewportSize({ width, height: 800 });
        const small = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLElement>(
              "[data-feed-root] a, [data-feed-root] button"
            )
          )
            .filter((control) => {
              const box = control.getBoundingClientRect();
              // A link inside a sentence is exempt; a sr-only control has no box.
              return (
                box.width > 1 &&
                box.height > 1 &&
                !control.closest("p, li > span") &&
                (box.height < 43.5 || box.width < 43.5)
              );
            })
            .map((control) => control.textContent?.trim().slice(0, 40))
        );
        expect(small, `${id} at ${width}px`).toEqual([]);
      }
    });
  }

  for (const width of [768, 1280]) {
    // @req REQ-178
    test(`a paragraph holds about 70 characters a line at ${width} px`, async ({
      page,
    }) => {
      await openAnswer(page, ANSWER_FIXTURES.bantou);
      await page.setViewportSize({ width, height: 800 });
      const perLine = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-feed-block^="answer-"] p'
          )
        ).flatMap((paragraph) => {
          const style = getComputedStyle(paragraph);
          const lineHeight = parseFloat(style.lineHeight);
          const lines = Math.round(
            paragraph.getBoundingClientRect().height / lineHeight
          );
          // Only a paragraph that wraps says anything about the measure.
          return lines >= 3
            ? [(paragraph.textContent ?? "").length / lines]
            : [];
        })
      );
      expect(perLine.length).toBeGreaterThan(0);
      for (const count of perLine) {
        expect(count).toBeLessThanOrEqual(READING_CHARS_MAX);
      }
    });
  }

  for (const id of ["peul", "bantou", "congo", "lingala", "camara"] as const) {
    // @req REQ-178
    test(`${id} draws one title per subject block and one page h1`, async ({
      page,
    }) => {
      await openAnswer(page, ANSWER_FIXTURES[id]);
      for (const width of [320, 430, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await expect(page.locator("h1")).toHaveCount(1);
        const perBlock = await page
          .locator('[data-feed-block="answer-what"]')
          .evaluateAll((blocks) =>
            blocks.map((block) => block.querySelectorAll("h1, h2").length)
          );
        expect(perBlock.length).toBeGreaterThan(0);
        expect(perBlock, `${id} at ${width}px`).toEqual(perBlock.map(() => 1));
      }
    });
  }

  for (const id of ["peul", "bantou", "congo", "lingala", "camara"] as const) {
    // @req REQ-178
    test(`${id} has at most one solid primary button among its fiche links`, async ({
      page,
    }) => {
      await openAnswer(page, ANSWER_FIXTURES[id]);
      for (const width of [320, 430, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const links = page.locator('[data-feed-block="fiche-link"] a');
        const solid = await links.evaluateAll(
          (anchors) =>
            anchors.filter((anchor) => {
              const [red, green, blue, alpha = "1"] =
                getComputedStyle(anchor).backgroundColor.match(/[\d.]+/g) ?? [];
              // An ocre fill is saturated; the white surface of a quiet
              // button is not.
              return (
                Number(alpha) > 0 &&
                Math.max(+red, +green, +blue) - Math.min(+red, +green, +blue) >
                  40
              );
            }).length
        );
        expect(solid, `${id} at ${width}px`).toBeLessThanOrEqual(1);
        // Several fiches are equal ways on: none of them is the solid one.
        if ((await links.count()) > 1) expect(solid).toBe(0);
      }
    });
  }

  // @req REQ-178
  test("pharaon renders the word page, not the unknown-name confession", async ({
    page,
  }) => {
    const fixture = ANSWER_FIXTURES.pharaon;
    const word = fixture.wordAnswers![0];
    await openAnswer(page, fixture);
    await expect(page.getByText(nameAnswerCopy.fr.unknownName)).toHaveCount(0);
    const text = tidy(await page.locator("[data-feed-root]").innerText());
    expect(text).toContain(tidy(word.what.lead!));
    for (const step of word.path!) expect(text).toContain(step.form);
  });
});
