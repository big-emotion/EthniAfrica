// The isolated page that draws one frame of the series video, full screen
// (EthniAfrica Cartes 1.4.0). Its geometry and styles follow the design
// board handoff/video-board-full.html; the cards' words, inks and fonts come
// from the design system itself (EthniCards.render with context 'video'), so
// they match the carousel. The image fills the frame and only text sits on
// it: every letter carries its own dark outline, nothing darkens the image.
// Everything arrives from series-render.mjs; the page has no clock and no
// network.

export const SERIES_PAGE_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="/design/components/bundle.css">
<script src="/design/components/bundle.js"></script>
<style>
/* As in the 0.4.0 page: Nunito Sans draws ʾ and ʿ in the middle of half an
   em; Noto Sans sets them against their letter. */
@font-face{font-family:"Nunito Sans";src:url(/design/fonts/NotoSans-Variable.ttf);font-weight:200 1000;unicode-range:U+02BE-02BF}
@font-face{font-family:"Noto Sans Arabic";src:url(/design/fonts/NotoSansArabic-SemiBold.ttf);font-weight:600}
html,body{margin:0;background:#000}
/* On-image inks: the tokens on-image-*, the same in Nuit and Parchemin
   (operator, 14 October 2026). */
#frame{position:relative;width:1080px;height:1920px;overflow:hidden;background:#0b0806;
  --oi-ink:var(--on-image-ink);--oi-text:var(--on-image-text);--oi-muted:var(--on-image-muted);--oi-faint:var(--on-image-faint);
  --oi-accent:var(--on-image-accent);--oi-on-accent:var(--on-image-on-accent);--oi-stroke:var(--on-image-stroke);--oi-shadow:var(--on-image-shadow)}
.vf-layer{position:absolute;inset:0;display:none}
.vf-pic{position:absolute;inset:0;overflow:hidden}
.vf-pic img{position:absolute;max-width:none;display:block}
.vf-pic svg.ec-map{position:absolute;left:0;top:0;width:1080px;height:1920px;display:block}
.vf-slot{position:absolute;inset:0;background:repeating-linear-gradient(135deg,var(--ground) 0 18px,var(--slot-stripe) 18px 22px)}
#frame[data-theme="nuit"] .vf-slot{--slot-stripe:#2a2118}
#frame[data-theme="parchemin"] .vf-slot{--slot-stripe:#ebe1d0}
.vf-slot:before{content:'';position:absolute;left:48px;top:48px;right:48px;bottom:48px;border:2px solid var(--rule)}
.vf-slot-text{position:absolute;left:120px;width:840px;top:760px;height:480px;display:flex;flex-direction:column;justify-content:center;gap:14px}
.vf-slot-label{font:800 30px/36px var(--font-text);letter-spacing:.1em;text-transform:uppercase;color:var(--oi-accent);--sw:4px}
.vf-slot-find{font:700 40px/52px var(--font-text);--sw:6px;text-wrap:pretty}
.vf-slot-label.oi{color:var(--oi-accent)}
/* The one text treatment: light letters on a dark outline painted under them. */
.oi{--area-a-ink:var(--on-image-accent);--area-b-ink:var(--area-b-ink-on-image,#6cc3b5);--area-c-ink:var(--area-c-ink-on-image,#e3876a);
  color:var(--oi-ink);paint-order:stroke fill;-webkit-text-stroke:var(--sw,4px) var(--oi-stroke);text-shadow:0 1px 8px var(--oi-shadow)}
.oi-l{text-shadow:0 2px 14px var(--oi-shadow)}
.oi .ec-accent,.oi em{color:var(--oi-accent);font-style:normal}
.vf-band{position:absolute;left:60px;top:250px;font:800 32px/40px var(--font-text);letter-spacing:.02em;--sw:4px;white-space:nowrap;z-index:3}
.vf-band .vf-sep{color:var(--oi-faint)} .vf-band .vf-ep{color:var(--oi-accent)}
.vf-head{position:absolute;left:60px;width:960px;top:318px;display:flex;flex-direction:column}
.vf-kick{font:800 30px/36px var(--font-text);letter-spacing:.02em;color:var(--oi-accent);--sw:4px;margin-bottom:10px}
.vf-title{font:400 88px/90px var(--font-display);letter-spacing:.005em;margin:0;text-wrap:balance;--sw:10px}
.vf-title--xl{font-size:116px;line-height:112px;--sw:13px}
.vf-date{font:400 176px/156px var(--font-display);letter-spacing:.01em;color:var(--oi-accent);margin:0;--sw:14px;white-space:nowrap}
.vf-label{font:800 22px/28px var(--font-text);letter-spacing:.1em;text-transform:uppercase;color:var(--oi-muted);--sw:4px;margin-top:14px}
.vf-name{font:400 76px/82px var(--font-display);--sw:8px;margin-top:2px}
.vf-close{position:absolute;left:60px;width:960px;top:318px;text-align:center;display:flex;flex-direction:column;align-items:center}
.vf-slogan{font:400 84px/88px var(--font-display);text-transform:uppercase;--sw:10px;text-wrap:balance}
.vf-sent{font:700 32px/40px var(--font-text);--sw:4px;margin-top:18px;max-width:900px;text-wrap:balance}
.vf-sent p{margin:0}
.vf-pill{margin-top:30px;display:inline-block;font:800 34px/40px var(--font-text);letter-spacing:.04em;text-transform:uppercase;color:var(--oi-accent);--sw:4px;border:3px solid var(--oi-accent);border-radius:999px;padding:14px 40px;box-shadow:0 0 0 2px var(--oi-stroke),inset 0 0 0 2px var(--oi-stroke)}
.vf-foot{position:absolute;left:60px;width:960px;bottom:134px;display:flex;flex-direction:column;gap:4px}
.vf-key{display:flex;align-items:center;gap:14px;font:800 26px/32px var(--font-text);--sw:4px;margin-bottom:10px}
.vf-key i{width:34px;height:24px;border-radius:3px;flex:none;box-shadow:0 0 0 2px var(--oi-stroke)}
.vf-src{font:700 24px/30px var(--font-text);--sw:4px}
.vf-cred{font:700 22px/28px var(--font-text);color:var(--oi-muted);--sw:4px}
.vf-sign{display:flex;align-items:center;gap:14px}
.vf-sign img{width:44px;height:44px;display:block;filter:drop-shadow(0 0 2px rgba(11,8,6,.95)) drop-shadow(0 1px 6px rgba(11,8,6,.6))}
.vf-sign b{font:600 32px/38px var(--font-wordmark);--sw:4px}
#signature{position:absolute;left:60px;top:1836px;height:48px;z-index:3}
.vf-close-foot{position:absolute;left:0;right:0;bottom:36px;display:flex;flex-direction:column;align-items:center;gap:12px}
.vf-close-foot .vf-cred{text-align:center;max-width:900px}
.vf-close-foot .vf-sign img{width:56px;height:56px}
.vf-close-foot .vf-sign b{font-size:44px;line-height:48px;--sw:5px}
.vf-demo{position:absolute;right:60px;top:178px;z-index:9;background:var(--demo-tape,#ffe58a);color:var(--demo-ink,#2b2100);font:800 22px/28px var(--font-text);letter-spacing:.06em;text-transform:uppercase;padding:10px 22px;border-radius:999px;white-space:nowrap}
/* Subtitles: Vidéo carte 0.4.0, unchanged (social/video/page.mjs): Nunito
   Sans 800 56/68, a 9 px dark stroke under the letters and a soft shadow; the
   spoken word in accent, its text in on-accent. Lines from y 1316 to 1452,
   centred on x 540, at most 900 px wide. */
#subtitles{position:absolute;left:60px;top:1316px;width:960px;height:136px;display:flex;flex-direction:column;justify-content:center;z-index:4}
.sub-line{text-align:center;white-space:pre;font:800 56px/68px var(--font-text);color:var(--oi-text)}
.sub-text{-webkit-text-stroke:9px var(--oi-stroke);paint-order:stroke fill;text-shadow:0 2px 14px var(--oi-shadow)}
.lit{background:var(--oi-accent);color:var(--oi-on-accent);border-radius:6px;box-shadow:6px 0 0 var(--oi-accent),-6px 0 0 var(--oi-accent);-webkit-text-stroke:0;text-shadow:none}
</style></head><body><div id="frame"></div>
<script>
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const resolveAsset = (name) => "/assets/" + name;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
// The cards' French spacing (EthniCards' fr): a narrow no-break space before
// ; : ! ? » and after «.
const fr = (s) => s.replace(/[ \\u00a0]+([;:!?»])/g, "\\u202f$1").replace(/«[ \\u00a0]+/g, "«\\u202f");
const MONTHS = "(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)";
const DATE_STEPS = [[176, 156], [148, 136], [124, 118], [104, 100]];
const layers = [];
let logoUrl = null;

function signature() {
  return el("div", "vf-sign", '<img src="' + logoUrl + '" alt=""><b class="oi">EthniAfrica</b>');
}

// One layer per card, built once from the design system's own render of the
// card for a video: its band, head, sources and signature words.
function buildLayer(spec) {
  const card = EthniCards.render(spec, { context: "video", resolve: resolveAsset, demo: false });
  const pick = (sel) => card.querySelector(sel);
  const layer = el("div", "vf-layer");
  const pic = el("div", "vf-pic");
  layer.append(pic);
  const parts = { spec, layer, pic, text: [], photo: null, map: null, date: null, slot: false, closing: spec.type === "closing" };
  const src = (spec.image && spec.image.src) || "";
  if (card._map) {
    const svg = pick("svg.ec-map");
    svg.setAttribute("width", 1080);
    svg.setAttribute("height", 1920);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    pic.append(svg);
    parts.map = svg;
    parts.photo = svg;
  } else if (/(^|\\/)a-trouver-[^/]*$/.test(src)) {
    pic.append(el("div", "vf-slot"));
    const t = el("div", "vf-slot-text");
    t.append(el("div", "vf-slot-label oi", "Image à trouver"));
    if (spec.image.find) t.append(el("div", "vf-slot-find oi", esc(fr(spec.image.find))));
    layer.append(t);
    parts.text.push(t);
    parts.slot = true;
  } else if (src) {
    const img = new Image();
    img.alt = "";
    img.decoding = "sync";
    img.src = resolveAsset(src);
    pic.append(img);
    parts.photo = img;
    parts.focus = spec.image.focus || [0.5, 0.5];
  }
  if (parts.closing) {
    const close = el("div", "vf-close");
    close.append(el("div", "vf-slogan oi oi-l", pick(".ec-title").innerHTML));
    if (pick(".ec-body")) close.append(el("div", "vf-sent oi", pick(".ec-body").innerHTML));
    const pill = pick(".ec-cta-pill");
    close.append(el("div", "vf-pill oi", esc((pill ? pill.textContent : "ethniafrica.com").toUpperCase())));
    layer.append(close);
    const foot = el("div", "vf-close-foot");
    if (pick(".ec-credit")) foot.append(el("div", "vf-cred oi", pick(".ec-credit").innerHTML));
    foot.append(signature());
    layer.append(foot);
    parts.text.push(close, foot);
    return parts;
  }
  const head = el("div", "vf-head");
  const kicker = pick(".ec-kicker");
  if (kicker && kicker.textContent.trim()) head.append(el("div", "vf-kick oi", kicker.innerHTML));
  if (spec.date) {
    // A date is one group: day, month and year never part.
    const html = pick(".ec-date").innerHTML
      .replace(new RegExp("(\\\\d+(?:er|<sup>er</sup>)?) " + MONTHS + " (\\\\d{3,4})", "g"), "$1\\u00a0$2\\u00a0$3")
      .replace(new RegExp(MONTHS + " (\\\\d{3,4})", "g"), "$1\\u00a0$2");
    parts.date = el("div", "vf-date oi oi-l", html);
    head.append(parts.date);
    const name = pick(".ec-field .ec-field-name");
    if (name) {
      head.append(el("div", "vf-label oi", pick(".ec-field .ec-label").innerHTML));
      head.append(el("div", "vf-name oi oi-l", name.innerHTML));
    }
  } else {
    head.append(el("h2", "vf-title oi oi-l" + (spec.type === "opener" ? " vf-title--xl" : ""), pick(".ec-title").innerHTML));
  }
  layer.append(head);
  const foot = el("div", "vf-foot");
  if (spec.map) {
    const keys = [];
    if (spec.map.highlight && spec.map.highlight.legend) keys.push([spec.map.highlight.tone || "area-a", spec.map.highlight.legend]);
    (spec.map.areas || []).forEach((a) => keys.push([a.tone || "area-a", a.legend || a.label]));
    for (const [tone, text] of keys) {
      const key = el("div", "vf-key oi", '<i style="background:var(--' + tone + ')"></i><span>' + esc(fr(text)) + "</span>");
      key.dataset.kind = "key";
      foot.append(key);
    }
    if (spec.map.caption && spec.map.caption.source) {
      const line = el("div", "vf-src oi", "Source\\u202f: " + esc(fr(spec.map.caption.source)));
      line.dataset.kind = "source";
      foot.append(line);
    }
  }
  for (const [sel, cls, kind] of [[".ec-source", "vf-src", "source"], [".ec-credit", "vf-cred", "credit"]]) {
    const line = pick(sel);
    // A slot's credit only says the image is missing: the slot says it.
    if (line && !(kind === "credit" && parts.slot)) {
      const div = el("div", cls + " oi", line.innerHTML);
      div.dataset.kind = kind;
      foot.append(div);
    }
  }
  layer.append(foot);
  parts.text.push(head, foot);
  return parts;
}

// The photograph covers the frame: its focal point brought to (540, 1000),
// the middle of the clear zone, as far as its edges allow; the slow zoom
// grows around that point.
function placeImage(parts) {
  const img = parts.photo, [fx, fy] = parts.focus;
  const W = img.naturalWidth, H = img.naturalHeight, s = Math.max(1080 / W, 1920 / H);
  const w = W * s, h = H * s;
  const left = Math.min(0, Math.max(1080 - w, 540 - fx * w));
  const top = Math.min(0, Math.max(1920 - h, 1000 - fy * h));
  Object.assign(img.style, { width: w + "px", height: h + "px", left: left + "px", top: top + "px" });
  img.style.transformOrigin = fx * w + "px " + fy * h + "px";
  parts.scale = s;
  parts.focusAt = [left + fx * w, top + fy * h];
}

// The map's own 9:16 view: map.videoView when the card gives one; otherwise
// the subject (highlight or areas) brought to (540, 1000), at the card's
// scale or up to twice closer, within the base map's drawn extent, the sea
// painted behind in the water colour. Needs the layer displayed.
function placeMap(parts) {
  const svg = parts.map;
  const vb = svg.getAttribute("viewBox").split(/[ ,]+/).map(Number);
  const water = svg.querySelector(".ec-m-water");
  if (water) parts.pic.style.background = getComputedStyle(water).fill;
  const union = (list) => list.reduce((a, b) => ({ x0: Math.min(a.x0, b.x), y0: Math.min(a.y0, b.y), x1: Math.max(a.x1, b.x + b.width), y1: Math.max(a.y1, b.y + b.height) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  const base = union([...svg.querySelectorAll("path")].map((e) => e.getBBox()));
  const subjects = [...svg.querySelectorAll(".ec-m-hl, .ec-m-area, [class*='ec-m-zone']")].map((e) => e.getBBox());
  const sb = subjects.length ? union(subjects) : { x0: vb[0], y0: vb[1], x1: vb[0] + vb[2], y1: vb[1] + vb[3] };
  let view = parts.spec.map.videoView;
  if (!view) {
    const cx = (sb.x0 + sb.x1) / 2, cy = (sb.y0 + sb.y1) / 2, cardU = vb[2] / 1080;
    let u = Math.min(cardU, (cx - base.x0) / 540, (base.x1 - cx) / 540, (base.y1 - cy) / 920, (cy - base.y0) / 1000);
    u = Math.max(u, cardU / 2, (sb.x1 - sb.x0) / 960);
    const x0 = Math.min(Math.max(cx - 540 * u, base.x0), base.x1 - 1080 * u);
    const y0 = Math.min(Math.max(cy - 1000 * u, base.y0), base.y1 - 1920 * u);
    view = [x0, y0, 1080 * u, 1920 * u];
  }
  svg.setAttribute("viewBox", view.map((n) => +n.toFixed(3)).join(" "));
  const u = view[2] / 1080;
  parts.subject = { x: (sb.x0 - view[0]) / u, y: (sb.y0 - view[1]) / u, w: (sb.x1 - sb.x0) / u, h: (sb.y1 - sb.y0) / u };
  parts.focusAt = [540, 1000];
}

// Long dates: the largest size that holds on one line in 960 px, measured
// on the drawn glyphs; else two balanced lines at 104/100.
function setDate(parts) {
  const d = parts.date;
  const ink = () => { const r = document.createRange(); r.selectNodeContents(d); return r.getBoundingClientRect().width; };
  let i = 0;
  for (; i < DATE_STEPS.length; i++) {
    d.style.fontSize = DATE_STEPS[i][0] + "px";
    d.style.lineHeight = DATE_STEPS[i][1] + "px";
    if (ink() <= 960) break;
  }
  if (i === DATE_STEPS.length) {
    i = DATE_STEPS.length - 1;
    d.style.whiteSpace = "normal";
    d.style.textWrap = "balance";
  }
  parts.dateSize = DATE_STEPS[i][0];
  parts.dateLines = Math.round(d.getBoundingClientRect().height / DATE_STEPS[i][1]);
}

window.setup = async ({ tokens, cards, logo, demo }) => {
  await EthniCards.installTokens(tokens, "/design/");
  logoUrl = resolveAsset(logo);
  const frame = document.getElementById("frame");
  frame.setAttribute("data-theme", cards[0].theme || "nuit");
  for (const spec of cards) {
    const parts = buildLayer(spec);
    frame.append(parts.layer);
    layers.push(parts);
  }
  // The band and the content cards' signature are drawn once: they never
  // fade, whatever the card change.
  const sr = EthniCards.seriesOf(cards[0]);
  const band = el("div", "vf-band oi", esc(fr(sr.name)) + '<span class="vf-sep"> · </span><span class="vf-ep">n°\\u00a0' + sr.episode + "</span>");
  frame.append(band);
  const sign = signature();
  sign.id = "signature";
  frame.append(sign);
  const subtitles = el("div");
  subtitles.id = "subtitles";
  frame.append(subtitles);
  if (demo) frame.append(el("div", "vf-demo", esc(fr(demo))));
  const images = [...frame.querySelectorAll(".vf-pic img")];
  await Promise.all(images.map((i) => i.decode().catch(() => null)));
  const broken = images.filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src"));
  const logoImg = new Image();
  logoImg.src = logoUrl;
  await logoImg.decode().catch(() => broken.push(logoUrl));
  await document.fonts.ready;
  for (const parts of layers) {
    parts.layer.style.display = "block";
    if (parts.map) placeMap(parts);
    else if (parts.photo && parts.photo.naturalWidth) placeImage(parts);
    if (parts.date) setDate(parts);
    parts.layer.style.display = "none";
  }
  const fonts = ["400 40px Anton", "800 40px 'Nunito Sans'", "600 40px Fraunces"].map((f) => document.fonts.check(f));
  return { broken, fonts, version: EthniCards.version };
};

// Boxes of the text drawn: the ink's width and the line boxes' height, as the
// 0.4.0 page measures subtitles (a glyph's content area overhangs its line).
function inkBox(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const ink = range.getBoundingClientRect(), block = node.getBoundingClientRect();
  return { x: ink.left, w: ink.width, y: block.top, h: block.height };
}
const rect = (node) => { const r = node.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
const shown = (node) => +getComputedStyle(node).opacity > 0;

function frameBoxes(frame, state) {
  const boxes = [];
  const add = (node, kind, extra) => {
    if (!node.textContent.trim()) return;
    boxes.push({ id: node.textContent.trim().slice(0, 40), kind, ...inkBox(node), ...extra });
  };
  add(frame.querySelector(".vf-band"), "band");
  const sign = document.getElementById("signature");
  if (shown(sign)) boxes.push({ id: "signature", kind: "signature", ...rect(sign) });
  for (const l of state.layers) {
    const parts = layers[l.card];
    if (l.opacity > 0 && parts.scale) boxes.push({ id: parts.spec.id, kind: "image", ...rect(parts.photo), scale: +(parts.scale * l.zoom).toFixed(3) });
    if (l.opacity > 0 && parts.subject) boxes.push({ id: parts.spec.id, kind: "map-subject", ...parts.subject });
    if (!(l.text > 0)) continue;
    const layer = parts.layer;
    layer.querySelectorAll(".vf-head > *").forEach((n) =>
      add(n, "head", { card: l.card, ...(n === parts.date && { date: { size: parts.dateSize, lines: parts.dateLines } }) })
    );
    layer.querySelectorAll(".vf-close > *").forEach((n) => {
      if (n.classList.contains("vf-pill")) boxes.push({ id: "pill", kind: "pill", ...rect(n) });
      else add(n, "ending");
    });
    layer.querySelectorAll(".vf-foot > *").forEach((n) => add(n, n.dataset.kind));
    layer.querySelectorAll(".vf-close-foot .vf-cred").forEach((n) => add(n, "ending-credit"));
    layer.querySelectorAll(".vf-close-foot .vf-sign").forEach((n) => boxes.push({ id: "signature", kind: "signature", ...rect(n) }));
    layer.querySelectorAll(".vf-slot-text > *").forEach((n) => add(n, "slot"));
  }
  frame.querySelectorAll("#subtitles .sub-line").forEach((row, i) => {
    const t = row.firstChild.getBoundingClientRect(), r = row.getBoundingClientRect();
    boxes.push({ id: "subtitle line " + (i + 1), kind: "subtitle", x: t.left, w: t.width, y: r.top, h: r.height });
  });
  const tape = frame.querySelector(".vf-demo");
  if (tape) boxes.push({ id: "tape", kind: "tape", ...rect(tape) });
  return boxes;
}

// Anything that paints a background over the image, besides the lit word,
// the « image à trouver » slot, the map's sea and the demo tape.
function backgrounds(frame) {
  const allowed = (n) => n.closest(".lit, .vf-slot, .vf-demo, .vf-key") || n.classList.contains("vf-pic");
  return [...frame.querySelectorAll("*")]
    .filter((n) => n.getClientRects().length && !allowed(n))
    .filter((n) => {
      const s = getComputedStyle(n);
      return s.backgroundImage !== "none" || !/rgba\\(\\d+, \\d+, \\d+, 0\\)|transparent/.test(s.backgroundColor);
    })
    .map((n) => n.className || n.tagName);
}

// One subtitle chunk, as the 0.4.0 page draws it: units always wrapped, lit
// or not, so the highlight changes paint only, never layout.
function drawSubtitle(subtitle) {
  const band = document.getElementById("subtitles");
  band.replaceChildren();
  if (!subtitle || subtitle.opacity <= 0) return;
  band.style.opacity = subtitle.opacity;
  for (const line of subtitle.lines) {
    const row = el("div", "sub-line"), text = el("span", "sub-text");
    let unitNode = null;
    for (const run of line) {
      let node;
      const words = fr(run.text);
      if (run.arabic) {
        node = el("bdi"); node.textContent = words; node.lang = "ar"; node.dir = "rtl";
        node.style.cssText = "font-family:'Noto Sans Arabic',sans-serif;font-style:normal;font-weight:600";
      } else if (run.italic) { node = el("i"); node.textContent = words; }
      else node = document.createTextNode(words);
      if (run.unit === undefined) { unitNode = null; text.append(node); continue; }
      if (!unitNode || unitNode.dataset.unit !== String(run.unit)) {
        unitNode = el("span");
        unitNode.dataset.unit = run.unit;
        if (run.unit === subtitle.highlight) unitNode.className = "lit";
        text.append(unitNode);
      }
      unitNode.append(node);
    }
    row.append(text);
    band.append(row);
  }
}

window.drawFrame = (state) => {
  const frame = document.getElementById("frame");
  layers.forEach((parts, i) => {
    const l = state.layers.find((x) => x.card === i);
    parts.layer.style.display = l ? "block" : "none";
    if (!l) return;
    parts.layer.style.zIndex = state.layers.indexOf(l) + 1;
    parts.pic.style.opacity = l.opacity;
    for (const t of parts.text) t.style.opacity = l.text;
    if (parts.photo) {
      parts.photo.style.transformOrigin = parts.map ? "540px 1000px" : parts.photo.style.transformOrigin;
      parts.photo.style.transform = "scale(" + l.zoom + ")";
    }
  });
  // The content cards' signature stays whole, except when the closing card,
  // which has its own centred signature, comes in.
  const closing = state.layers.find((l) => layers[l.card].closing);
  const content = state.layers.find((l) => !layers[l.card].closing);
  document.getElementById("signature").style.opacity = !content ? 0 : closing ? content.text : 1;
  drawSubtitle(state.subtitle);
  const visible = state.layers.map((l) => layers[l.card]);
  const maps = visible.filter((p) => p.map).map((p) => {
    const r = p.map.getBoundingClientRect();
    return { viewBox: p.map.getAttribute("viewBox"), x: r.left, y: r.top, w: r.width, h: r.height };
  });
  const pictures = state.layers.filter((l) => l.opacity > 0).map((l) => ({ id: layers[l.card].spec.id, ...rect(layers[l.card].pic.firstElementChild || layers[l.card].pic) }));
  return {
    boxes: frameBoxes(frame, state),
    text: frame.innerText,
    lit: frame.querySelectorAll("#subtitles .lit").length,
    maps,
    pictures,
    backgrounds: backgrounds(frame),
  };
};
</script></body></html>`;
