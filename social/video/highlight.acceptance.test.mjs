// @req REQ-186
// The spoken-word highlight of Vidéo carte 0.4.0: an accent box behind the
// unit being said that never changes a word's width, so the line never
// reflows. Measured on the glyph boxes the pinned Chromium draws with the
// engine's own page and fonts.
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { PAGE_HTML } from "./page.mjs";
import { chunkLines } from "./sequence.mjs";

const runtime = JSON.parse(
  await readFile(new URL("../renderer/runtime.json", import.meta.url))
);
const fonts = new URL("../design-system/fonts/", import.meta.url);

let browser;
let page;
before(async () => {
  browser = await chromium.launch({ headless: true });
  assert.equal(browser.version(), runtime.chromium);
  page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/")
      return route.fulfill({ contentType: "text/html", body: PAGE_HTML });
    if (url.pathname.startsWith("/fonts/"))
      return route.fulfill({
        contentType: "font/ttf",
        body: await readFile(new URL(url.pathname.slice(7), fonts)),
      });
    return route.abort();
  });
  await page.goto("http://ethnia.test/");
});
after(() => browser?.close());

const draw = (lines, highlight) =>
  page.evaluate(
    async (subtitle) => {
      await document.fonts.load('800 56px "Nunito Sans"');
      await document.fonts.load('italic 800 56px "Nunito Sans"');
      await document.fonts.load('600 56px "Noto Sans Arabic"', "صحراء");
      return window.drawSubtitle(subtitle);
    },
    { lines, opacity: 1, highlight }
  );

const rgbAt = async (png, x, y) => {
  const data = await sharp(png)
    .extract({ left: Math.round(x), top: Math.round(y), width: 1, height: 1 })
    .raw()
    .toBuffer();
  return [data[0], data[1], data[2]];
};
const distance = (rgb, hex) =>
  Math.hypot(
    ...rgb.map((v, i) => v - parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16))
  );

for (const text of [
  "entre le pays des Berbères",
  "*ṣaḥrāʾ* (صحراء), « désert ».",
  "l'Afrique à l'ouest de l'Égypte.",
])
  // @req REQ-186
  test(`the highlight never moves a word: « ${text} »`, async () => {
    const lines = chunkLines(text);
    const plain = await draw(lines, null);
    const units = plain.units.length;
    assert.ok(units >= 2);
    for (let unit = 0; unit < units; unit++) {
      const lit = await draw(lines, unit);
      lit.units.forEach((box, i) => {
        for (const key of ["x", "y", "w", "h"])
          assert.ok(
            Math.abs(box[key] - plain.units[i][key]) <= 0.1,
            `unit ${i} ${key} moved by ${box[key] - plain.units[i][key]} px with unit ${unit} lit`
          );
      });
    }
  });

// @req REQ-186
test("the box is the accent, text on-accent, extended 6 px on each side, and centred on x 540", async () => {
  const lines = chunkLines("entre le pays des Berbères");
  const plain = await draw(lines, null);
  const lit = await draw(lines, 2);
  const shot = await page.screenshot({ type: "png" });
  const word = lit.units[2];
  // 3 px outside the word's own box: only the side shadow paints there.
  assert.ok(
    distance(await rgbAt(shot, word.x - 3, word.y + word.h / 2), "#e8b96a") < 8
  );
  assert.ok(
    distance(
      await rgbAt(shot, word.x + word.w + 3, word.y + word.h / 2),
      "#e8b96a"
    ) < 8
  );
  assert.ok(
    distance(await rgbAt(shot, word.x - 9, word.y + word.h / 2), "#e8b96a") > 60
  );
  // The darkest ink inside the box is the on-accent text, not the stroke.
  const { data, info } = await sharp(shot)
    .extract({
      left: Math.round(word.x),
      top: Math.round(word.y),
      width: Math.round(word.w),
      height: Math.round(word.h),
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let accent = 0;
  let onAccent = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const rgb = [data[i], data[i + 1], data[i + 2]];
    if (distance(rgb, "#e8b96a") < 12) accent++;
    if (distance(rgb, "#1a120a") < 12) onAccent++;
  }
  assert.ok(accent > 0.4 * info.width * info.height, "accent background");
  assert.ok(onAccent > 200, "on-accent letters");
  // The line is centred on the frame's axis.
  const [line] = plain.lines;
  assert.ok(
    Math.abs(line.x + line.w / 2 - 540) <= 1,
    `line centre ${line.x + line.w / 2}`
  );
  assert.ok(line.y >= 1316 && line.y + line.h <= 1452);
});
