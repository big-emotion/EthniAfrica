// @req REQ-186
// The series intro bumper and end card, shot by shot as the storyboard lists
// them: every text readable at 12 px in a 430 px feed, the text a viewer must
// read inside the feed safe zone, Fraunces kept to the word EthniAfrica and the
// project's sentence, and the site drawn at the scale of a 430 px phone.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { startServer } from "./serve.mjs";
import {
  CLIPS,
  WIDTH,
  HEIGHT,
  SAFE_ZONE,
  BUTTON_COLUMN,
  MIN_TEXT_PX,
  SITE_SCALE,
} from "./shots.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
let browser, server, origin;

before(async () => {
  ({ server, origin } = await startServer());
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  server?.close();
});

async function inspect(clip, shot, query = "") {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  await page.goto(
    `${origin}/social/series-idents/${clip.file}?shot=${shot.id}${query}`
  );
  await page.waitForFunction(() => window.identReady === true, null, {
    timeout: 20000,
  });
  const facts = await page.evaluate(() => {
    const shown = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (
          s.display === "none" ||
          s.visibility === "hidden" ||
          +s.opacity === 0
        )
          return false;
      }
      return true;
    };
    // The drawn text's box, not the element's: a heading is a full-width
    // block, but only its letters can sit under the apps' buttons.
    const inked = (el) => {
      const range = el.ownerDocument.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    };
    const texts = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    while (walker.nextNode()) {
      const n = walker.currentNode,
        el = n.parentElement;
      if (!n.textContent.trim() || !shown(el) || el.closest("[data-guide]"))
        continue;
      const r = el.getBoundingClientRect();
      const scale = el.offsetWidth ? r.width / el.offsetWidth : 1;
      const s = getComputedStyle(el);
      texts.push({
        text: n.textContent.trim().slice(0, 40),
        px: parseFloat(s.fontSize) * scale,
        family: s.fontFamily,
        role: el.closest("[data-role]")?.dataset.role ?? null,
      });
    }
    const essential = [...document.querySelectorAll("[data-essential]")]
      .filter(shown)
      .map((el) => {
        const r = inked(el);
        return {
          text: el.textContent.trim().slice(0, 40),
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
        };
      });
    const frame = document.querySelector("iframe.site");
    let site = null;
    if (frame && shown(frame)) {
      const doc = frame.contentDocument,
        sizes = [];
      const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode())
        if (w.currentNode.textContent.trim())
          sizes.push(
            parseFloat(
              frame.contentWindow.getComputedStyle(w.currentNode.parentElement)
                .fontSize
            )
          );
      const box = frame.getBoundingClientRect(),
        k = box.width / frame.offsetWidth;
      const port = frame.parentElement.getBoundingClientRect();
      site = {
        width: box.width,
        cssWidth: frame.offsetWidth,
        minPx: Math.min(...sizes),
        essential: [...doc.querySelectorAll("[data-essential]")].map((el) => {
          const r = inked(el);
          return {
            text: el.textContent.trim().slice(0, 40),
            x: box.left + r.left * k,
            y: box.top + r.top * k,
            w: r.width * k,
            h: r.height * k,
            clipped: box.top + r.top * k < port.top,
          };
        }),
      };
    }
    return { texts, essential, site };
  });
  await page.close();
  return facts;
}

const inside = (b, z) =>
  b.x >= z.x && b.y >= z.y && b.x + b.w <= z.x + z.w && b.y + b.h <= z.y + z.h;
const overlaps = (b, z) =>
  b.x < z.x + z.w && b.x + b.w > z.x && b.y < z.y + z.h && b.y + b.h > z.y;

for (const clip of CLIPS) {
  for (const shot of clip.shots) {
    test(`${clip.id} ${shot.id}: legible, essential text in the safe zone, fonts as the charter says`, async () => {
      const { texts, essential, site } = await inspect(clip, shot);
      assert.ok(texts.length > 0, "the shot shows some text");
      for (const t of texts) {
        assert.ok(
          t.px >= MIN_TEXT_PX - 0.5,
          `« ${t.text} » is ${t.px.toFixed(1)} px, under 12 px at 430`
        );
        if (/^"?Fraunces/.test(t.family))
          assert.ok(
            ["wordmark", "project-line"].includes(t.role),
            `« ${t.text} » is set in Fraunces`
          );
      }
      assert.ok(
        essential.length + (site?.essential.length ?? 0) > 0,
        "the shot marks what must be read"
      );
      for (const b of essential) {
        assert.ok(
          inside(b, SAFE_ZONE),
          `« ${b.text} » leaves the safe zone (${Math.round(b.x)}, ${Math.round(b.y)}, ${Math.round(b.w)} × ${Math.round(b.h)})`
        );
        assert.ok(
          !overlaps(b, BUTTON_COLUMN),
          `« ${b.text} » is under the button column`
        );
      }
      if (site) {
        assert.equal(site.cssWidth, 430, "the site is laid out at 430 px");
        assert.ok(
          Math.abs(site.width - 430 * SITE_SCALE) < 1,
          "the site fills the frame's width"
        );
        assert.ok(
          site.minPx * SITE_SCALE * (430 / WIDTH) >= 12,
          "the site's smallest text reads at 12 px or more"
        );
        // The site keeps its own 12 to 24 px gutter at 430 px, so its text
        // starts at x 30 to 60, not the feed's 120. No app covers the left
        // edge between the top bar and the caption, so only the vertical band
        // and the button column bind it.
        const band = { x: 24, y: SAFE_ZONE.y, w: 1032, h: SAFE_ZONE.h };
        assert.ok(
          site.essential.length > 0,
          "the site shot marks what must be read"
        );
        for (const b of site.essential) {
          assert.ok(
            !b.clipped && inside(b, band),
            `site « ${b.text} » leaves the safe band (${Math.round(b.x)}, ${Math.round(b.y)}, ${Math.round(b.w)} × ${Math.round(b.h)})`
          );
          assert.ok(
            !overlaps(b, BUTTON_COLUMN),
            `site « ${b.text} » is under the button column`
          );
        }
      }
    });
  }
}

test("the end card types the replaceable name and opens its own answer page", async () => {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  await page.goto(
    `${origin}/social/series-idents/endcard.html?shot=o3-result&name=peul&result=search-peul-430`
  );
  await page.waitForFunction(() => window.identReady === true, null, {
    timeout: 20000,
  });
  const seen = await page.evaluate(() => ({
    address: document.querySelector("[data-layer=address]").textContent,
    field: document
      .querySelector("iframe.site")
      .contentDocument.querySelector("input[type=search]").value,
  }));
  await page.close();
  assert.equal(seen.address, "ethniafrica.com/fr/atlas/recherche/peul");
  assert.equal(seen.field, "peul");
});

test("the intro never strikes, dims or replaces the name employed in French", async () => {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  for (const id of ["i3-forms", "i4-peoples"]) {
    await page.goto(`${origin}/social/series-idents/ident.html?shot=${id}`);
    await page.waitForFunction(() => window.identReady === true, null, {
      timeout: 20000,
    });
    const employed = await page.evaluate(() => {
      const el = document.querySelector("[data-layer=employed]");
      const s = getComputedStyle(el);
      return {
        text: el.textContent.trim(),
        opacity: +s.opacity,
        decoration: s.textDecorationLine,
        size: parseFloat(s.fontSize),
        others: [...document.querySelectorAll("[data-form]")].map((f) =>
          parseFloat(getComputedStyle(f).fontSize)
        ),
      };
    });
    assert.equal(employed.text, "Peul");
    assert.equal(employed.opacity, 1, `${id}: Peul stays at full opacity`);
    assert.equal(
      employed.decoration,
      "none",
      `${id}: Peul is never struck through`
    );
    for (const size of employed.others)
      assert.ok(
        size <= employed.size,
        `${id}: no other form is set larger than Peul`
      );
  }
  await page.close();
});
