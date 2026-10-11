import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  rm,
  rename,
  open,
  realpath,
  access,
} from "node:fs/promises";
import {
  resolve,
  relative,
  join,
  dirname,
  basename,
  extname,
  isAbsolute,
} from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { inspectCard } from "./browser.mjs";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const defaultDesign = resolve(here, "../design-system");
const sha = (data) => createHash("sha256").update(data).digest("hex");
const required = (ok, message) => {
  if (!ok) throw new Error(message);
};
const normal = (s) =>
  String(s ?? "")
    .normalize("NFC")
    .replace(/[\u00a0\u202f\s]+/g, " ")
    .trim();
const plain = (s) =>
  normal(
    String(s ?? "")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\{area-[abc]:([^}]+)\}/g, "$1")
  );
const nonempty = (s) => typeof s === "string" && s.trim().length > 0;
const types = new Set([
  "opener",
  "explanation",
  "document",
  "dated",
  "map",
  "closing",
]);
const modes = new Set(["final", "proof", "diagnostic"]);

function safePath(path) {
  required(
    nonempty(path) &&
      !isAbsolute(path) &&
      !/[\\:%?#\u0000]/.test(path) &&
      !path.split("/").some((p) => !p || p === "." || p === ".."),
    "Invalid local asset path"
  );
  return path;
}

export function validateInput(data, mode = "final", version) {
  required(modes.has(mode), "Unknown render mode");
  required(
    data && data.version === version,
    "Input design version does not match accepted version"
  );
  required(
    Array.isArray(data.cards) && data.cards.length > 0,
    "Empty card sequence"
  );
  safePath(data.logo);
  const ids = new Set();
  for (const [i, c] of data.cards.entries()) {
    required(
      c && /^[a-zA-Z0-9_-]+$/.test(c.id || "") && !ids.has(c.id),
      "Invalid or duplicate card ID"
    );
    ids.add(c.id);
    required(types.has(c.type), `Unknown card type: ${c.type}`);
    required(
      ["nuit", "parchemin"].includes(c.theme || "nuit"),
      "Unknown theme"
    );
    if (mode !== "diagnostic") {
      required(
        (c.theme || "nuit") === (data.cards[0].theme || "nuit"),
        "Mixed themes in one sequence"
      );
      required(
        c.folio ===
          `${String(i + 1).padStart(2, "0")}/${String(data.cards.length).padStart(2, "0")}`,
        "Folio order does not match sequence"
      );
    }
    if (mode === "final")
      required(
        !Object.hasOwn(c, "demo"),
        "Demo content cannot be exported as final"
      );
    required(
      c.type === "dated"
        ? c.date && nonempty(c.date.display)
        : nonempty(c.title),
      "Missing card title or date"
    );
    if (c.type === "dated")
      required(
        nonempty(c.date.name) || c.date.branches?.length === 2,
        "Missing dated name"
      );
    required(
      !(c.recap && c.type !== "closing"),
      "Timeline recap belongs only on closing cards"
    );
    required(
      !(c.body && ["map", "opener"].includes(c.type)),
      "Running text is not allowed on this card type"
    );
    if (c.image) {
      safePath(c.image.src);
      required(c.image.w > 0 && c.image.h > 0, "Missing image dimensions");
      for (const key of ["focus", "anchor"]) {
        required(
          Array.isArray(c.image[key]) &&
            c.image[key].length === 2 &&
            c.image[key].every((x) => Number.isFinite(x) && x >= 0 && x <= 1),
          `Invalid image ${key}`
        );
      }
      required(
        c.image.zoom == null ||
          (Number.isFinite(c.image.zoom) && c.image.zoom > 0),
        "Invalid image zoom"
      );
    }
    for (const inset of c.insets || []) safePath(inset.src);
    if (c.type === "map") {
      required(c.map && (c.map.dataRef || c.map.data), "Missing map data");
      if (c.map.dataRef) safePath(c.map.dataRef);
      required(
        ["none", "quiet", "strong"].includes(c.map.borders || "none"),
        "Unknown border layer"
      );
      required(
        ["what", "when", "source"].every((k) => nonempty(c.map.caption?.[k])),
        "Map caption needs subject, period and source"
      );
      if (c.map.view)
        required(
          c.map.view.length === 4 &&
            c.map.view.every(Number.isFinite) &&
            c.map.view[2] > 0 &&
            c.map.view[3] > 0,
          "Invalid map view"
        );
      if (c.map.highlight || c.map.choropleth)
        required(
          c.map.borders === "quiet",
          "Distribution maps require quiet borders"
        );
    }
    required(c.alt == null || nonempty(c.alt), "Empty alternative text");
  }
  return data;
}

// Every supported supplied text must survive typesetting. This is DOM fidelity,
// not OCR or a historical fact check. Generated labels are covered in the alt text.
function expectedText(c) {
  const values = [
    "kicker",
    "title",
    "body",
    "note",
    "source",
    "credit",
    "cue",
    "footer",
  ].flatMap((k) => c[k] || []);
  if (c.date) {
    values.push(
      ...["display", "name", "designated", "usedBy", "usedByLabel"].map(
        (k) => c.date[k] || ""
      )
    );
    for (const b of c.date.branches || [])
      values.push(b.label, b.name, b.designated, b.usedBy);
  }
  if (c.forms?.layout === "pair")
    values.push(
      ...["searchedLabel", "searched", "selfLabel", "self"].map(
        (k) => c.forms[k]
      )
    );
  else values.push(...(c.forms?.rows || []).flat());
  if (c.quote)
    values.push(
      c.quote.translation,
      c.quote.translationLabel,
      c.quote.attribution
    );
  if (typeof c.status === "object")
    values.push(
      c.status.label,
      typeof c.status.band === "string" ? c.status.band : ""
    );
  for (const r of c.recap || []) values.push(r.date, r.name);
  for (const inset of c.insets || []) values.push(inset.label);
  if (c.map) {
    values.push(...Object.values(c.map.caption || {}));
    for (const l of c.map.legend || []) values.push(l.text);
    for (const cl of c.map.choropleth?.classes || []) values.push(cl.label);
  }
  if (c.cta?.text) values.push(c.cta.text);
  return values.filter(Boolean).map(plain);
}

function roots(options) {
  const design = resolve(options.design || defaultDesign);
  return {
    design,
    assets: resolve(options.assets || join(design, "assets")),
    renderer: here,
  };
}

async function snapshot(options) {
  const input = resolve(options.input);
  const bytes = await readFile(input);
  const data = JSON.parse(bytes);
  const dirs = roots(options);
  const dependencies = [],
    routes = new Map();
  async function load(kind, path) {
    safePath(path);
    const root = await realpath(dirs[kind]);
    const full = await realpath(join(root, path));
    const rel = relative(root, full);
    required(
      rel && !rel.startsWith("..") && !isAbsolute(rel),
      "Asset escapes its allowed root"
    );
    const route = `/${kind}/${path}`;
    if (routes.has(route)) return routes.get(route);
    const content = await readFile(full);
    dependencies.push({ kind, path, sha256: sha(content) });
    routes.set(route, content);
    return content;
  }
  const version = JSON.parse(await load("design", "version.json"));
  required(
    version.status === "accepted",
    "Design version has not been accepted"
  );
  const mode = options.mode || "final";
  validateInput(data, mode, version.version);
  const tokens = JSON.parse(await load("design", "tokens.json"));
  await load("design", "components/bundle.js");
  await load("design", "components/bundle.css");
  await load("renderer", "render.mjs");
  await load("renderer", "browser.mjs");
  const runtime = JSON.parse(await load("renderer", "runtime.json"));
  required(
    createRequire(import.meta.url)("@playwright/test/package.json").version ===
      runtime.playwright,
    "Playwright version differs from verified runtime"
  );
  for (const f of tokens.type.fonts) await load("design", f.file);
  await load("assets", data.logo);
  for (const c of data.cards) {
    if (c.image) await load("assets", c.image.src);
    for (const i of c.insets || []) await load("assets", i.src);
    if (c.map?.dataRef)
      c.map.data = JSON.parse(await load("assets", c.map.dataRef));
    if (c.map) {
      required(nonempty(c.map.data?.land), "Invalid map geometry");
      const d = c.map.data;
      const paths = [
        d.land,
        d.borders,
        d.inset?.d,
        ...(d.countries || []).map((x) => x.d),
        ...(d.lakes || []).map((x) => x.d),
        ...(c.map.areas || []).flatMap((a) => a.paths || []),
      ].filter((x) => x != null);
      required(
        paths.every(
          (p) =>
            typeof p === "string" &&
            /^[MmZzLlHhVvCcSsQqTtAaEe0-9.,+\-\s]*$/.test(p)
        ),
        "Invalid SVG map geometry"
      );
    }
  }
  return {
    data,
    tokens,
    version,
    dependencies,
    routes,
    inputHash: sha(bytes),
    mode,
    runtime,
  };
}

const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

export async function renderSequence(options) {
  const snap = await snapshot(options);
  const output = resolve(options.output);
  await mkdir(dirname(output), { recursive: true });
  const lockPath = `${output}.lock`;
  const lock = await open(lockPath, "wx").catch(() => {
    throw new Error(
      "Output lock already exists; inspect the interrupted or active run"
    );
  });
  let temp, browser;
  try {
    await access(output).then(
      () => {
        throw new Error(
          "Output already exists; choose a new revision directory"
        );
      },
      () => {}
    );
    temp = await mkdtemp(join(dirname(output), `.${basename(output)}-`));
    browser = await chromium.launch({ headless: true });
    required(
      browser.version() === snap.runtime.chromium,
      "Chromium version differs from verified runtime"
    );
    const context = await browser.newContext({
      viewport: { width: 1080, height: 1350 },
      deviceScaleFactor: 1,
      locale: "fr-FR",
      timezoneId: "UTC",
      colorScheme: "light",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const requestErrors = [];
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      const path = decodeURIComponent(url.pathname);
      if (url.origin !== "http://ethnia.test") {
        requestErrors.push("External request refused");
        return route.abort();
      }
      if (path === "/")
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}</style></head><body><div id="out"></div></body></html>',
        });
      const bytes = snap.routes.get(path);
      if (!bytes) {
        requestErrors.push(`Missing asset: ${path}`);
        return route.abort();
      }
      return route.fulfill({
        contentType: mime[extname(path)] || "application/octet-stream",
        body: bytes,
      });
    });
    await page.goto("http://ethnia.test/");
    await page.addStyleTag({ url: "/design/components/bundle.css" });
    await page.addScriptTag({ url: "/design/components/bundle.js" });
    await page.evaluate(async (tokens) => {
      await window.EthniCards.installTokens(tokens, "/design/");
    }, snap.tokens);
    const engineVersion = await page.evaluate(() => window.EthniCards.version);
    required(
      engineVersion === snap.version.version,
      "Renderer version does not match accepted design"
    );
    const report = {
      schema: 1,
      mode: snap.mode,
      productionReady: false,
      designVersion: snap.version.version,
      engineVersion,
      browser: browser.version(),
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      deviceScaleFactor: 1,
      inputHash: snap.inputHash,
      dependencies: snap.dependencies,
      cards: [],
    };
    for (const [i, spec] of snap.data.cards.entries()) {
      await page.evaluate(
        async ({ spec, logo, diagnose }) => {
          document.getElementById("out").replaceChildren();
          await window.EthniCards.mount(document.getElementById("out"), spec, {
            width: 1080,
            logo,
            resolve: (name) => "/assets/" + name,
            diagnose,
          });
        },
        {
          spec,
          logo: snap.data.logo,
          diagnose: snap.mode === "diagnostic" && spec.id === "overflow",
        }
      );
      const observation = await page.evaluate(inspectCard);
      const visible = normal(observation.visibleText);
      const missing = expectedText(spec).filter((s) => !visible.includes(s));
      if (
        spec.quote?.original &&
        !visible.includes(normal(spec.quote.original))
      )
        missing.push(spec.quote.original);
      required(
        !missing.length,
        `Rendered text differs from data for ${spec.id}: ${missing.join(" | ")}`
      );
      required(!requestErrors.length, requestErrors.join("; "));
      required(
        !observation.errors.some((s) => /decode|dimensions|font/i.test(s)),
        observation.errors.join("; ")
      );
      required(
        nonempty(observation.alt),
        `Missing alternative text: ${spec.id}`
      );
      if (snap.mode !== "diagnostic")
        required(
          observation.fit.ok && !observation.errors.length,
          `Layout/fit refused for ${spec.id}: ${[...observation.fit.warnings, ...observation.errors].join("; ")}`
        );
      const file = `${String(i + 1).padStart(2, "0")}.png`;
      const buffer = await page
        .locator(".ec-card")
        .screenshot({ type: "png", animations: "disabled", timeout: 15000 });
      const png = await sharp(buffer)
        .toColourspace("srgb")
        .withIccProfile("srgb")
        .png()
        .toBuffer();
      const meta = await sharp(png).metadata();
      required(
        meta.width === 1080 && meta.height === 1350,
        "Unexpected export dimensions"
      );
      await writeFile(join(temp, file), png);
      report.cards.push({
        id: spec.id,
        file,
        sha256: sha(png),
        ...observation,
      });
    }
    report.productionReady = snap.mode === "final";
    const review = reviewHtml(report);
    report.reviewSha256 = sha(review);
    await writeFile(join(temp, "review.html"), review);
    await writeFile(
      join(temp, "report.json"),
      JSON.stringify(report, null, 2) + "\n"
    );
    await verifyOutput({ ...options, output: temp });
    await rename(temp, output);
    temp = null;
    return report;
  } finally {
    if (browser) await browser.close();
    if (temp) await rm(temp, { recursive: true, force: true });
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

function reviewHtml(report) {
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Card review</title><style>body{margin:16px;font:16px system-ui;background:#ddd;color:#111}header{margin-bottom:24px}main{display:flex;gap:24px;flex-wrap:wrap}figure{margin:0;width:var(--reading,320px);max-width:100%}img{display:block;width:100%;height:auto}figcaption{padding:8px 0}select{font:inherit}</style>
<header><h1>Card review — ${esc(report.mode)}</h1><p>Rendering checks do not grant publication approval.</p>
<label>Reading width <select onchange="document.documentElement.style.setProperty('--reading',this.value+'px')"><option value="320">Phone 320 px</option><option value="375">Phone 375 px</option><option value="430">Phone 430 px</option><option value="600">Tablet feed 600 px (viewport 768–1199 px)</option><option value="470">Desktop feed 470 px (viewport ≥1200 px)</option></select></label></header>
<main>${report.cards.map((c) => `<figure><img src="${esc(c.file)}" alt="${esc(c.alt)}"><figcaption>${esc(c.id)} · ${esc(c.file)}</figcaption></figure>`).join("")}</main></html>`;
}

export async function verifyOutput(options) {
  const report = JSON.parse(
    await readFile(join(options.output, "report.json"))
  );
  const bytes = await readFile(options.input);
  required(
    report.schema === 1 && report.inputHash === sha(bytes),
    "Stale input or report schema"
  );
  const data = JSON.parse(bytes);
  validateInput(data, report.mode, report.designVersion);
  required(
    Array.isArray(report.cards) &&
      report.cards.length > 0 &&
      report.cards.length === data.cards.length,
    "Report cards count is empty or incomplete"
  );
  const current = await snapshot({ ...options, mode: report.mode });
  required(
    JSON.stringify(current.dependencies) ===
      JSON.stringify(report.dependencies),
    "Stale design, renderer or asset dependency"
  );
  required(
    report.productionReady === (report.mode === "final"),
    "Invalid readiness state"
  );
  required(
    sha(await readFile(join(options.output, "review.html"))) ===
      report.reviewSha256,
    "Review export hash mismatch"
  );
  for (const [i, card] of report.cards.entries()) {
    required(
      card.id === data.cards[i].id &&
        card.file === `${String(i + 1).padStart(2, "0")}.png`,
      "Report card order mismatch"
    );
    const png = await readFile(join(options.output, card.file));
    required(sha(png) === card.sha256, "Export hash mismatch");
    const meta = await sharp(png).metadata();
    required(
      meta.width === 1080 && meta.height === 1350 && meta.space === "srgb",
      "Invalid export dimensions or colour space"
    );
    required(nonempty(card.alt), "Missing alternative text");
    required(
      card.fit?.id === card.id &&
        Array.isArray(card.fit.warnings) &&
        Number.isFinite(card.fit.panelHeight) &&
        Array.isArray(card.errors),
      "Incomplete fit report"
    );
    required(
      card.fonts?.length === current.tokens.type.fonts.length &&
        card.fonts.every((f) => f.status === "loaded"),
      "Incomplete font report"
    );
    if (report.mode !== "diagnostic")
      required(
        card.fit.ok &&
          !card.fit.overflow &&
          card.fit.panelHeight <= 900 &&
          !card.fit.warnings.length &&
          !card.errors.length,
        "Invalid final/proof layout report"
      );
    if (report.mode === "final")
      required(card.demo === false, "Demo in final report");
  }
  return report;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [command, input, output, ...flags] = process.argv.slice(2);
  const options = { input, output };
  for (const flag of flags) {
    const match = /^--(mode|assets|design)=(.+)$/.exec(flag);
    if (!match) throw new Error(`Unknown option: ${flag}`);
    options[match[1]] = match[2];
  }
  if (!["render", "verify"].includes(command) || !input || !output) {
    console.error(
      "Usage: node social/renderer/render.mjs render|verify INPUT_JSON OUTPUT_DIR [--mode=final|proof|diagnostic] [--assets=DIR]"
    );
    process.exitCode = 1;
  } else {
    try {
      const report = await (command === "render"
        ? renderSequence(options)
        : verifyOutput(options));
      console.log(
        JSON.stringify({
          mode: report.mode,
          cards: report.cards.length,
          productionReady: report.productionReady,
        })
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
