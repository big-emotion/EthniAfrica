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

import { LOCALE } from "./support/locale";
import {
  routeSearchAnswerFixtures,
  searchAnswerUrl,
} from "./support/search-feed-fixture";

const WIDTHS = [320, 430, 768, 1280];
// The thin desktop feed's bound: no line of text stretches past it.
const READING_WIDTH_MAX = 880.5;
const ANSWER_BLOCK = '[data-feed-block^="answer-"]';

const tidy = (text: string) => text.replace(/[  ]/g, " ").replace(/\s+/g, " ");
const firstSentence = (text: string) =>
  tidy(text).match(/^.*?[.!?](?=\s|$)/)?.[0] ?? tidy(text);

function expectedBlocks(answer: SearchAnswer): string[] {
  return [
    "answer-what",
    ...(answer.origin ? ["answer-origin"] : []),
    ...(answer.names.length > 0 || answer.path ? ["answer-names"] : []),
    ...(answer.where ? ["answer-where"] : []),
    ...(answer.next ? ["answer-next"] : []),
    "answer-sources",
  ];
}

function answersOf(fixture: AnswerFixture): SearchAnswer[] {
  return [...fixture.answers, ...(fixture.wordAnswers ?? [])];
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
  expect(rendered).toEqual(answersOf(fixture).flatMap(expectedBlocks));
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
  test.skip(LOCALE !== "fr", "The approved answer copy is French");

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
