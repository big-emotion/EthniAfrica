// Preview bench for EthniAfrica Cartes 1.3.0-proposition. It mounts the
// models with the unchanged 1.2.0 engine, adds the prototype series band, and
// lays a card out in the 9:16 video frame. Previews only: production exports
// stay with social/renderer once the operator accepts a version.
//
//   node social/design-system/proposals/1.3.0-proposition/preview.mjs OUT_DIR
//
// ETHNIAFRICA_CHROMIUM may point at the pinned Chromium (runtime.json) when the
// installed Playwright ships another browser build.
import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { seriesById, loadModels, closingLine } from "./series.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const designRoot = resolve(here, "../..");
const ORIGIN = "http://ethnia.test";
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
};

const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="/ds/components/bundle.css">
<link rel="stylesheet" href="/p/series-band.css">
<style>
html,body{margin:0;background:#000}
#out{display:flex;flex-wrap:wrap;gap:24px;padding:0}
.sheet #out{padding:24px;background:#3a3129}
.stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:var(--ground)}
.stage>.ec-frame{position:absolute;left:0;top:285px}
.subtitle{position:absolute;left:90px;width:900px;top:1660px;text-align:center;
  font:800 56px/68px var(--font-text,"Nunito Sans",sans-serif);color:#fffaf2;
  -webkit-text-stroke:9px #15100b;paint-order:stroke fill;
  text-shadow:0 2px 12px rgba(0,0,0,.45)}
.subtitle .lit{background:var(--accent);color:var(--on-accent);-webkit-text-stroke:0;
  text-shadow:none;box-shadow:6px 0 0 var(--accent),-6px 0 0 var(--accent);border-radius:4px}
.zone{position:absolute;background:repeating-linear-gradient(45deg,rgba(220,40,40,.35) 0 14px,rgba(220,40,40,.12) 14px 28px);
  outline:3px solid rgba(220,40,40,.9);outline-offset:-3px}
.zone span{position:absolute;left:12px;top:8px;font:800 24px/30px sans-serif;color:#fff;-webkit-text-stroke:0}
</style>
<script src="/ds/components/bundle.js"></script>
<script src="/p/series-band.js"></script>
</head><body><div id="out"></div><script>
window.__setup = async function () {
  var tokens = await (await fetch('/ds/tokens.json')).json();
  await EthniCards.installTokens(tokens, '/ds/');
  window.__maps = {};
};
function resolveAsset(n) { return '/ds/assets/' + n; }
async function prep(spec) {
  spec = JSON.parse(JSON.stringify(spec));
  if (spec.map && spec.map.dataRef) {
    var ref = spec.map.dataRef;
    __maps[ref] = __maps[ref] || await (await fetch(resolveAsset(ref))).json();
    spec.map.data = __maps[ref];
  }
  return spec;
}
window.__mount = async function (spec, band, width, logo, target) {
  var res = await EthniCards.mount(target || document.getElementById('out'), await prep(spec),
    { width: width, resolve: resolveAsset, logo: logo, demo: true });
  var r = res.report;
  return { id: spec.id, ok: r.ok, warnings: r.warnings || [], panelHeight: r.panelHeight,
    panelTop: r.panelTop, collisions: Array.isArray(r.collisions) ? r.collisions.length : (r.collisions || 0),
    band: band ? EthniSeriesBand.apply(res.card, band) : null };
};
window.__video = async function (spec, band, logo, subtitle, lit, zones) {
  var out = document.getElementById('out');
  var stage = document.createElement('div');
  stage.className = 'stage';
  stage.setAttribute('data-theme', spec.theme || 'nuit');
  out.appendChild(stage);
  var report = await __mount(spec, band, 1080, logo, stage);
  var frame = stage.querySelector('.ec-frame').getBoundingClientRect();
  var sub = null;
  if (subtitle) {
    var div = document.createElement('div');
    div.className = 'subtitle';
    subtitle.split(' ').forEach(function (word, i) {
      if (i) div.appendChild(document.createTextNode(' '));
      var s = document.createElement('span');
      s.textContent = EthniSeriesBand.frenchSpacing(word);
      if (i === lit) s.className = 'lit';
      div.appendChild(s);
    });
    stage.appendChild(div);
    var spans = div.querySelectorAll('span');
    var rows = Array.prototype.map.call(spans, function (s) { return s.getBoundingClientRect(); });
    // Line boxes (68 px each) set the band, as in Vidéo carte; the glyph
    // boxes of a 56 px face overhang them by a few pixels.
    var lines = div.getBoundingClientRect();
    sub = { top: lines.top, bottom: lines.bottom,
      left: Math.min.apply(null, rows.map(function (r) { return r.left; })),
      right: Math.max.apply(null, rows.map(function (r) { return r.right; })) };
  }
  (zones || []).forEach(function (z) {
    var d = document.createElement('div');
    d.className = 'zone';
    d.style.cssText = 'left:' + z[0] + 'px;top:' + z[1] + 'px;width:' + (z[2] - z[0]) + 'px;height:' + (z[3] - z[1]) + 'px';
    var label = document.createElement('span'); label.textContent = z[4]; d.appendChild(label);
    stage.appendChild(d);
  });
  return { report: report, card: { top: frame.top, bottom: frame.bottom }, subtitle: sub };
};
</script></body></html>`;

function bandOf(spec) {
  if (!spec.series) return null;
  const s = seriesById(spec.series.id);
  return { name: s.name, episode: spec.series.episode };
}

export async function openBench() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.ETHNIAFRICA_CHROMIUM || undefined,
  });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1,
    locale: "fr-FR",
    timezoneId: "UTC",
  });
  const page = await context.newPage();
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== ORIGIN) return route.abort();
    const path = decodeURIComponent(url.pathname);
    if (path === "/")
      return route.fulfill({ contentType: "text/html", body: PAGE });
    const [, scope, rest] = path.match(/^\/(ds|p)\/(.+)$/) || [];
    if (!scope || rest.includes("..")) return route.abort();
    const file = join(scope === "ds" ? designRoot : here, rest);
    const body = await readFile(file).catch(() => null);
    if (!body) return route.abort();
    return route.fulfill({
      contentType: mime[extname(file)] || "application/octet-stream",
      body,
    });
  });

  async function reset(width, height, sheet = false) {
    await page.setViewportSize({ width, height });
    await page.goto(ORIGIN + "/");
    await page.evaluate((s) => {
      document.body.className = s ? "sheet" : "";
    }, sheet);
    await page.evaluate(() => window.__setup());
  }

  async function mount(spec, logo, width) {
    const r = await page.evaluate(
      ([spec, band, width, logo]) => window.__mount(spec, band, width, logo),
      [spec, bandOf(spec), width, logo]
    );
    if (r.band?.hidden.length) {
      r.ok = false;
      r.warnings.push(`Under the band: ${r.band.hidden.join(", ")}`);
    }
    return r;
  }

  return {
    close: () => browser.close(),

    async measureBand({ id, episode }) {
      await reset(1080, 1350);
      const spec = {
        id: "band",
        type: "opener",
        title: "Bandeau",
        series: { id, episode },
      };
      return (await mount(spec, null, 1080)).band;
    },

    async renderModel(data, { dir } = {}) {
      const reports = [];
      for (const [i, spec] of data.cards.entries()) {
        await reset(1080, 1350);
        reports.push(await mount(spec, data.logo, 1080));
        if (dir)
          await page.locator(".ec-frame").screenshot({
            path: join(dir, `${String(i + 1).padStart(2, "0")}.png`),
          });
      }
      return reports;
    },

    async sheet(cards, logo, width, path) {
      const perRow = 4;
      await reset(perRow * width + (perRow + 1) * 24, 800, true);
      for (const spec of cards) await mount(spec, logo, width);
      await page.screenshot({ path, fullPage: true });
    },

    async videoFrame(data, { card, subtitle, lit = -1, zones, path }) {
      await reset(1080, 1920);
      const spec = data.cards[card];
      const frame = await page.evaluate(
        ([spec, band, logo, subtitle, lit, zones]) =>
          window.__video(spec, band, logo, subtitle, lit, zones),
        [spec, bandOf(spec), data.logo, subtitle, lit, zones]
      );
      if (path) await page.locator(".stage").screenshot({ path });
      return { size: [1080, 1920], ...frame };
    },
  };
}

// Outside the 12-second video's safe zone (social/video/README.md): what the
// apps may cover in the feed. Plein écran accepted this for subtitles.
const FEED_COVER = [
  [0, 0, 1080, 270, "Interface de l'application"],
  [780, 840, 1080, 1920, "Boutons TikTok"],
  [0, 1248, 780, 1920, "Légende et compte"],
];

async function main(outDir) {
  const out = resolve(outDir);
  const bench = await openBench();
  const models = await loadModels();
  const summary = [];
  try {
    for (const { series, data } of models) {
      const dir = join(
        out,
        `${String(series.number).padStart(2, "0")}-${series.id}`
      );
      await mkdir(dir, { recursive: true });
      const reports = await bench.renderModel(data, { dir });
      await bench.sheet(
        data.cards,
        data.logo,
        430,
        join(dir, "lecture-430.png")
      );
      await bench.sheet(
        data.cards,
        data.logo,
        320,
        join(dir, "lecture-320.png")
      );
      summary.push({ series: series.id, reports });
    }

    const bandDir = join(out, "bandeau");
    await mkdir(bandDir, { recursive: true });
    const openers = models.map(({ series, data }) => ({
      ...data.cards[0],
      id: `bandeau-${series.id}`,
      series: { id: series.id, episode: 100 },
    }));
    const logo = models[0].data.logo;
    await bench.sheet(openers, logo, 430, join(bandDir, "sept-series-430.png"));
    await bench.sheet(openers, logo, 320, join(bandDir, "sept-series-320.png"));

    const videoDir = join(out, "video");
    await mkdir(videoDir, { recursive: true });
    const video = JSON.parse(
      await readFile(join(here, "video.model.json"), "utf8")
    );
    const pays = models[0].data;
    await bench.videoFrame(pays, {
      card: 0,
      path: join(videoDir, "00-couverture.png"),
    });
    const stills = [];
    let n = 0;
    for (const [i, beat] of video.beats.entries()) {
      for (const [j, chunk] of beat.chunks.entries()) {
        const path = join(
          videoDir,
          `chunk-${String(++n).padStart(2, "0")}.png`
        );
        await bench.videoFrame(pays, {
          card: i,
          subtitle: chunk.text,
          lit: 0,
          path,
        });
        stills.push({ path, duration: chunk.duration });
        if (j === 0)
          await bench.videoFrame(pays, {
            card: i,
            subtitle: chunk.text,
            lit: 0,
            path: join(videoDir, `${String(i + 1).padStart(2, "0")}.png`),
          });
      }
    }
    stills.at(-1).duration += video.hold;
    await bench.videoFrame(pays, {
      card: 2,
      subtitle: video.beats[2].chunks[0].text,
      lit: 0,
      zones: FEED_COVER,
      path: join(videoDir, "zones-couvertes.png"),
    });
    // The concat demuxer drops the last entry's duration unless the file is
    // listed again; -t then cuts the video at the model's exact length.
    const list = stills
      .map((s) => `file '${s.path}'\nduration ${s.duration}`)
      .concat(`file '${stills.at(-1).path}'`)
      .join("\n");
    const seconds = stills.reduce((sum, s) => sum + s.duration, 0);
    const listPath = join(videoDir, "animatic.txt");
    await writeFile(listPath, list + "\n");
    execFileSync("ffmpeg", [
      "-t",
      seconds.toFixed(2),
      "-y",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-vf",
      "fps=30,format=yuv420p",
      "-c:v",
      "libx264",
      join(videoDir, "animatic-sans-voix.mp4"),
    ]);
    await rm(listPath);
    await writeFile(
      join(out, "rapports.json"),
      JSON.stringify(summary, null, 2)
    );
  } finally {
    await bench.close();
  }
  const failing = summary.flatMap((s) => s.reports.filter((r) => !r.ok));
  console.log(
    `${summary.reduce((n, s) => n + s.reports.length, 0)} cards, ${failing.length} refused` +
      (failing.length ? `: ${failing.map((r) => r.id).join(", ")}` : "")
  );
  console.log(`Closing sentence: ${closingLine("[nom]")}`);
  console.log(`Previews in ${out}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    console.error("Usage: node preview.mjs OUT_DIR");
    process.exit(2);
  }
  await main(process.argv[2]);
}
