// @req REQ-186
// The series intro bumper and end card, shot by shot as the storyboard lists
// them: every text readable at 12 px in a 430 px feed and at 4.5:1 against
// what is behind it, the text a viewer must read inside the feed safe zone,
// Fraunces kept to the wordmark, the project's sentence and the site's own
// interface, the episode's name replaceable, and the name searched never
// struck or dimmed beside the others.
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
  MIN_CONTRAST,
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

async function open(file, query) {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
  });
  await page.goto(`${origin}/social/series-idents/${file}?${query}`);
  await page.waitForFunction(() => window.identReady === true, null, {
    timeout: 20000,
  });
  return page;
}

async function inspect(clip, shot) {
  const page = await open(clip.file, `shot=${shot.id}`);
  const facts = await page.evaluate(() => {
    const opacity = (el) => {
      let o = 1;
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === "none" || s.visibility === "hidden") return 0;
        o *= +s.opacity;
      }
      return o;
    };
    // Mixed colours come back as color(srgb r g b [/ a]) in 0 to 1.
    const rgb = (c) => {
      const v = c.match(/[\d.]+/g).map(Number);
      return c.startsWith("color(srgb")
        ? v.map((x, i) => (i < 3 ? x * 255 : x))
        : v;
    };
    const lum = ([r, g, b]) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ground = getComputedStyle(document.documentElement)
      .getPropertyValue("--afh-color-bg")
      .trim();
    const behind = (el) => {
      for (let n = el; n; n = n.parentElement) {
        const c = getComputedStyle(n).backgroundColor;
        const v = rgb(c);
        if (v.length === 3 || v[3] === 1) return v.slice(0, 3);
      }
      const h = ground.replace("#", "");
      return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    };
    // The drawn text's box, not the element's.
    const inked = (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      // Text cut by its own box (an ellipsis) is not drawn past it.
      const box = el.getBoundingClientRect();
      const right = Math.min(r.right, box.right);
      return {
        left: r.left,
        top: r.top,
        width: right - r.left,
        height: r.height,
      };
    };
    const texts = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    while (walker.nextNode()) {
      const n = walker.currentNode,
        el = n.parentElement;
      if (!n.textContent.trim() || el.closest("[data-guide]")) continue;
      if (opacity(el) < 0.99) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > 1920 || r.right < 0 || r.left > 1080)
        continue;
      const scale = el.offsetWidth ? r.width / el.offsetWidth : 1;
      const s = getComputedStyle(el);
      const a = lum(rgb(s.color)),
        b = lum(behind(el));
      texts.push({
        text: n.textContent.trim().slice(0, 40),
        px: parseFloat(s.fontSize) * scale,
        family: s.fontFamily,
        role: el.closest("[data-role]")?.dataset.role ?? null,
        contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      });
    }
    const essential = [...document.querySelectorAll("[data-essential]")]
      .filter((el) => opacity(el) >= 0.99)
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
    return { texts, essential };
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
    test(`${clip.id} ${shot.id}: legible, contrasted, essential text in the safe zone, Fraunces where the charter allows`, async () => {
      const { texts, essential } = await inspect(clip, shot);
      assert.ok(texts.length > 0, "the shot shows some text");
      for (const t of texts) {
        assert.ok(
          t.px >= MIN_TEXT_PX - 0.5,
          `« ${t.text} » is ${t.px.toFixed(1)} px, under 12 px at 430`
        );
        assert.ok(
          t.contrast >= MIN_CONTRAST,
          `« ${t.text} » reads at ${t.contrast.toFixed(2)}:1`
        );
        if (/^"?Fraunces/.test(t.family))
          assert.ok(
            ["wordmark", "project-line", "site-ui"].includes(t.role),
            `« ${t.text} » is set in Fraunces`
          );
      }
      assert.ok(essential.length > 0, "the shot marks what must be read");
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
    });
  }
}

test("the intro follows the account, then opens ethniafrica.com from the profile's link", async () => {
  const read = async (shot) => {
    const page = await open("ident.html", `shot=${shot}`);
    const seen = await page.evaluate(() => {
      const text = (sel) => document.querySelector(sel)?.textContent.trim();
      return {
        handle: text("[data-layer=handle]"),
        link: text("[data-layer=link]"),
        follow: text("[data-layer=follow]"),
        address: text("[data-layer=address]"),
        browser: +getComputedStyle(document.querySelector("#browser")).opacity,
      };
    });
    await page.close();
    return seen;
  };
  const profile = await read("i1-profile");
  assert.equal(profile.handle, "@ethniafrica");
  assert.equal(profile.link, "ethniafrica.com");
  assert.equal(profile.follow, "S’abonner");
  assert.equal(profile.browser, 0, "the browser is not open yet");
  assert.match((await read("i2-follow")).follow, /^Abonné/);
  const site = await read("i5-site");
  assert.equal(site.browser, 1);
  assert.equal(site.address, "ethniafrica.com");
});

test("the end card shows Instagram, TikTok, Facebook, YouTube and LinkedIn, and not X", async () => {
  const page = await open("endcard.html", "shot=o5-end");
  const networks = await page.evaluate(() =>
    [...document.querySelectorAll("[data-network]")]
      .filter((el) => +getComputedStyle(el.parentElement).opacity > 0.99)
      .map((el) => el.dataset.network)
  );
  await page.close();
  assert.deepEqual(networks, [
    "Instagram",
    "TikTok",
    "Facebook",
    "YouTube",
    "LinkedIn",
  ]);
});

test("the end card answers with the layer's name and its forms, the name searched kept whole", async () => {
  const page = await open("endcard.html", "shot=o4-forms&layers=peul");
  const seen = await page.evaluate(() => ({
    typed: document.querySelector("[data-layer=typed]").textContent.trim(),
    lead: document.querySelector("[data-layer=lead]").textContent,
    chips: [...document.querySelectorAll("[data-layer=forms] .chip")].map(
      (c) => {
        const s = getComputedStyle(c);
        return {
          w: c.querySelector(".w").textContent,
          kind: c.dataset.kind,
          opacity: +s.opacity,
          decoration: getComputedStyle(c.querySelector(".w"))
            .textDecorationLine,
        };
      }
    ),
  }));
  await page.close();
  assert.equal(seen.typed, "Peul");
  assert.match(seen.lead, /Vous avez cherché Peul\./);
  const searched = seen.chips.find((c) => c.kind === "searched");
  assert.equal(searched.w, "Peul");
  assert.ok(seen.chips.some((c) => c.kind === "self"));
  for (const c of seen.chips) {
    assert.equal(c.opacity, 1, `${c.w} is fully shown`);
    assert.equal(c.decoration, "none", `${c.w} is never struck through`);
  }
});
