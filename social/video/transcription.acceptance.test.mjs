// @req REQ-186
// A transcription such as *ṣaḥrāʾ* must read as one word in the
// subtitles. Nunito Sans has U+02BE and U+02BF, but draws each half ring in the
// middle of half an em, so « ṣaḥrāʾ » showed as « ṣaḥrā ʾ ». The gap is
// measured on the ink the pinned Chromium draws with the engine's own fonts,
// because the layout boxes of the two letters touch either way.
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { PAGE_HTML } from "./page.mjs";

const runtime = JSON.parse(
  await readFile(new URL("../renderer/runtime.json", import.meta.url))
);
const fonts = new URL("../design-system/fonts/", import.meta.url);
// The subtitle's size and weight in 0.4.0 « plein écran ».
const SUBTITLE = "font-size:56px;line-height:68px;font-weight:800";
// At 36 px Noto Sans set its ʾ 4 px after ā and Nunito Sans' half ring sat
// 11 to 12 px away; at 56 px the gaps scale by 56 ÷ 36, so 9 px still
// parts the two faces with room for antialiasing.
const MAX_GAP = 9;

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

// Columns of the band that carry text ink, on a fixed clip so an italic
// overhang is never cut off by the element's own box.
async function inkColumns(html) {
  const box = await page.evaluate(
    ([markup, style]) => {
      const frame = document.getElementById("frame");
      frame.querySelector("[data-probe]")?.remove();
      const line = document.createElement("div");
      line.dataset.probe = "";
      line.setAttribute(
        "style",
        `left:120px;top:948px;white-space:pre;color:#f3e9da;${style}`
      );
      line.innerHTML = markup;
      frame.append(line);
      return document.fonts.ready.then(() => {
        const r = line.getBoundingClientRect();
        return { y: r.top, height: r.height };
      });
    },
    [html, SUBTITLE]
  );
  const png = await page.screenshot({
    clip: { x: 100, y: box.y, width: 500, height: box.height },
  });
  const { data, info } = await sharp(png)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Array.from({ length: info.width }, (_, x) => {
    for (let y = 0; y < info.height; y++)
      if (data[y * info.width + x] > 128) return true;
    return false;
  });
}

// Blank columns between the end of `stem` and the first ink of `mark`.
async function inkGap(stem, mark, italic) {
  const wrap = (text) => (italic ? `<i>${text}</i>` : text);
  const before = await inkColumns(wrap(stem));
  const whole = await inkColumns(wrap(stem + mark));
  const end = before.lastIndexOf(true);
  let start = end + 1;
  while (start < whole.length && !whole[start]) start++;
  assert.ok(start < whole.length, `no ink after « ${stem} »`);
  return start - end - 1;
}

// The hamza after its letter, the ayn before one, as the subtitle sets a
// transcription (italic) and as a caption or name would (upright).
for (const italic of [true, false])
  // @req REQ-186
  test(`ʾ and ʿ sit against their letter, ${italic ? "italic" : "upright"}`, async () => {
    for (const [stem, mark] of [
      ["ṣaḥrā", "ʾ"],
      ["ʿ", "arab"],
    ]) {
      const gap = await inkGap(stem, mark, italic);
      assert.ok(
        gap <= MAX_GAP,
        `${stem}|${mark}: ${gap} px of blank, at most ${MAX_GAP}`
      );
    }
  });

// @req REQ-186
test("other transcription letters keep Nunito Sans and Arabic keeps its face", async () => {
  await inkColumns(
    `<i id="latin">ṣaḥrāīū</i> (<bdi id="arabic" lang="ar" dir="rtl" style="font-family:'Noto Sans Arabic',sans-serif;font-style:normal;font-weight:600">صحراء</bdi>)`
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const faces = async (selector) => {
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    const { fonts: used } = await cdp.send("CSS.getPlatformFontsForNode", {
      nodeId,
    });
    return used.map((f) => f.postScriptName);
  };
  const latin = await faces("#latin");
  assert.equal(latin.length, 1, `one face for ṣ ḥ ā ī ū: ${latin}`);
  assert.match(latin[0], /^NunitoSans/);
  assert.deepEqual(await faces("#arabic"), ["NotoSansArabic-SemiBold"]);
});
