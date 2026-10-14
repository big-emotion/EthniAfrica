// The isolated page that draws one frame of the series video, layout B.
// Its geometry and styles follow the design board handoff/video-board.html;
// the cards' words, inks and fonts come from the design system itself
// (EthniCards.render with context 'video'), so they match the carousel.
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
#frame{position:relative;width:1080px;height:1920px;overflow:hidden;background:var(--ground)}
.vf-layer{position:absolute;inset:0;background:var(--ground);display:none}
/* Layout B (board): band at the top of the safe zone, photograph, then the head. */
.vb-band{position:absolute;left:0;top:270px;width:1080px;z-index:3}
.vb-band .ec-series{position:relative;padding:0 120px}
.vb-photo{position:absolute;left:0;top:342px;width:1080px;height:560px;overflow:hidden}
.vb-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vb-photo svg{position:absolute;left:0;top:0;width:1080px;height:560px;display:block}
.vb-photo:after{content:'';position:absolute;left:0;right:0;bottom:0;height:220px;background:linear-gradient(to bottom,transparent,var(--ground))}
.vb-head{position:absolute;left:120px;width:640px;top:902px;height:346px;display:flex;flex-direction:column;justify-content:flex-end}
.vb-head .ec-kicker{margin-bottom:6px}
.vb-title{font:400 76px/80px var(--font-display);color:var(--ink);margin:0;text-wrap:balance}
.vb-title--xl{font-size:100px;line-height:98px}
.vb-title em,.vb-title .ec-accent{color:var(--accent);font-style:normal}
.vb-date{font:400 124px/118px var(--font-display);color:var(--accent);margin:0}
.vb-name{font:400 64px/70px var(--font-display);color:var(--ink);margin-top:6px}
.vb-label{font:800 20px/24px var(--font-text);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-muted);margin-top:14px}
.vb-foot{position:absolute;left:120px;right:120px;top:1290px}
.vb-foot .vb-src{font:400 22px/30px var(--font-text);color:var(--ink-muted)}
.vb-foot .ec-sign{margin-top:28px;justify-content:flex-start;gap:28px}
.vb-close{position:absolute;left:120px;right:120px;top:362px;text-align:center}
.vb-close .vb-slogan{font:400 72px/76px var(--font-display);color:var(--ink);text-transform:uppercase}
.vb-close .vb-sent{font:400 32px/40px var(--font-text);color:var(--ink-muted);margin-top:16px}
.vb-sent p{margin:0}
.vb-pill{position:absolute;left:0;right:0;top:872px;text-align:center}
.vb-pill span{display:inline-block;border:3px solid var(--accent);color:var(--accent);border-radius:999px;padding:14px 40px;font:800 32px/36px var(--font-text);letter-spacing:.06em}
.vb-sign{position:absolute;left:0;right:0;top:980px;display:flex;justify-content:center}
.vb-sign .ec-sign{margin:0}
.vb-sign .ec-sign-brand img{width:56px;height:56px}
.vb-sign .ec-wordmark{font:600 44px/48px var(--font-wordmark);color:var(--ink)}
.vb-sign .ec-tagline{display:none}
.vf-demo{position:absolute;left:28px;top:1856px;z-index:9;background:var(--demo-tape,#ffe58a);color:var(--demo-ink,#2b2100);font:800 22px/28px var(--font-text);letter-spacing:.06em;text-transform:uppercase;padding:10px 22px;border-radius:999px}
/* Subtitles: Vidéo carte 0.4.0, unchanged (social/video/page.mjs): Nunito
   Sans 800 56/68 in #fffaf2, a 9 px dark stroke under the letters and a soft
   shadow; the spoken word in accent, its text in on-accent. Lines from y 700
   to 836, centred, at most 840 px wide. */
#subtitles{position:absolute;left:120px;top:700px;width:840px;height:136px;display:flex;flex-direction:column;justify-content:center;z-index:4}
.sub-line{text-align:center;white-space:pre;font:800 56px/68px var(--font-text);color:#fffaf2}
.sub-text{-webkit-text-stroke:9px rgba(11,8,6,.92);paint-order:stroke fill;text-shadow:0 2px 14px rgba(11,8,6,.7)}
.lit{background:var(--accent);color:var(--on-accent);border-radius:6px;box-shadow:6px 0 0 var(--accent),-6px 0 0 var(--accent);-webkit-text-stroke:0;text-shadow:none}
</style></head><body><div id="frame"></div>
<script>
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const resolveAsset = (name) => "/assets/" + name;
const layers = [];

// One layer per card, built once: the design system renders the card for a
// video, and layout B takes its band, head, sources and signature from it.
function buildLayer(spec, logo) {
  const card = EthniCards.render(spec, { context: "video", resolve: resolveAsset, logo, demo: false });
  const pick = (sel) => card.querySelector(sel);
  const layer = el("div", "vf-layer");
  const parts = { layer, photo: null, origin: null };
  if (spec.type === "closing") {
    const close = el("div", "vb-close");
    close.append(el("div", "vb-slogan", pick(".ec-title").innerHTML));
    if (pick(".ec-body")) close.append(el("div", "vb-sent", pick(".ec-body").innerHTML));
    layer.append(close);
    const pill = el("div", "vb-pill");
    pill.append(el("span", null, pick(".ec-cta-pill").textContent.toUpperCase()));
    layer.append(pill);
    const sign = el("div", "vb-sign");
    sign.append(pick(".ec-sign"));
    layer.append(sign);
    return parts;
  }
  const photo = el("div", "vb-photo");
  if (card._map) {
    // The card's own view, top-aligned as on the card: the window shows the
    // card's first 560 px, which hold its 450 px image window.
    const svg = pick("svg.ec-map");
    photo.append(svg);
    parts.photo = svg;
    parts.origin = "540px 280px";
  } else if (spec.image) {
    const img = new Image();
    img.alt = "";
    img.decoding = "sync";
    img.src = resolveAsset(spec.image.src);
    const f = spec.image.focus || [0.5, 0.5];
    img.style.objectPosition = f[0] * 100 + "% " + f[1] * 100 + "%";
    photo.append(img);
    parts.photo = img;
    parts.focus = f;
  }
  layer.append(photo);
  const head = el("div", "vb-head");
  const kicker = pick(".ec-kicker");
  if (kicker && kicker.textContent.trim()) head.append(kicker);
  if (spec.date) {
    head.append(el("div", "vb-date", pick(".ec-date").innerHTML));
    const name = pick(".ec-field .ec-field-name");
    if (name) {
      head.append(el("div", "vb-label", pick(".ec-field .ec-label").innerHTML));
      head.append(el("div", "vb-name", name.innerHTML));
    }
  } else {
    head.append(el("h2", "vb-title" + (spec.type === "opener" ? " vb-title--xl" : ""), pick(".ec-title").innerHTML));
  }
  layer.append(head);
  const foot = el("div", "vb-foot");
  for (const sel of [".ec-source", ".ec-credit"]) {
    const line = pick(sel);
    if (line) { const div = el("div", "vb-src", line.innerHTML); div.dataset.kind = sel.slice(4); foot.append(div); }
  }
  foot.append(pick(".ec-sign"));
  layer.append(foot);
  return parts;
}

// The zoom grows around the photograph's focal point: where object-fit and
// object-position put it in the 1080 x 560 window.
function focalOrigin(parts) {
  const img = parts.photo, [fx, fy] = parts.focus;
  const s = Math.max(1080 / img.naturalWidth, 560 / img.naturalHeight);
  const [w, h] = [img.naturalWidth * s, img.naturalHeight * s];
  return ((1080 - w) * fx + fx * w) + "px " + ((560 - h) * fy + fy * h) + "px";
}

window.setup = async ({ tokens, cards, logo, demo }) => {
  await EthniCards.installTokens(tokens, "/design/");
  const frame = document.getElementById("frame");
  frame.setAttribute("data-theme", cards[0].theme || "nuit");
  for (const spec of cards) {
    const parts = buildLayer(spec, logo);
    frame.append(parts.layer);
    layers.push(parts);
  }
  const band = el("div", "vb-band");
  band.append(EthniCards.render(cards[0], { context: "video", demo: false }).querySelector(".ec-series"));
  frame.append(band);
  const subtitles = el("div");
  subtitles.id = "subtitles";
  frame.append(subtitles);
  if (demo) frame.append(el("div", "vf-demo", demo.replace(/&/g, "&amp;").replace(/</g, "&lt;")));
  const images = [...frame.querySelectorAll("img")];
  await Promise.all(images.map((i) => i.decode().catch(() => null)));
  const broken = images.filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src"));
  for (const parts of layers) if (parts.focus) parts.origin = focalOrigin(parts);
  await document.fonts.ready;
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

function textBoxes(frame) {
  const boxes = [];
  const add = (node, kind, id) => {
    if (!node.textContent.trim() && !node.querySelector("img")) return;
    boxes.push({ id: id || node.textContent.trim().slice(0, 40), kind, ...inkBox(node) });
  };
  const visible = [...frame.querySelectorAll(".vf-layer")].filter((l) => l.style.display === "block");
  add(frame.querySelector(".vb-band .ec-series-text"), "band");
  for (const layer of visible) {
    layer.querySelectorAll(".vb-head > *").forEach((n) => add(n, "head"));
    layer.querySelectorAll(".vb-close > *").forEach((n) => add(n, "ending"));
    layer.querySelectorAll(".vb-pill span").forEach((n) => { const r = n.getBoundingClientRect(); boxes.push({ id: "pill", kind: "pill", x: r.left, y: r.top, w: r.width, h: r.height }); });
    layer.querySelectorAll(".vb-src").forEach((n) => add(n, n.dataset.kind));
    layer.querySelectorAll(".ec-sign").forEach((n) => { const r = n.getBoundingClientRect(); boxes.push({ id: "signature", kind: "signature", x: r.left, y: r.top, w: r.width, h: r.height }); });
    layer.querySelectorAll(".vb-photo svg text").forEach((n) => { const r = n.getBoundingClientRect(); boxes.push({ id: n.textContent, kind: "map", x: r.left, y: r.top, w: r.width, h: r.height }); });
  }
  frame.querySelectorAll("#subtitles .sub-line").forEach((row, i) => {
    const t = row.firstChild.getBoundingClientRect(), r = row.getBoundingClientRect();
    boxes.push({ id: "subtitle line " + (i + 1), kind: "subtitle", x: t.left, w: t.width, y: r.top, h: r.height });
  });
  const tape = frame.querySelector(".vf-demo");
  if (tape) add(tape, "tape");
  return boxes;
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
      if (run.arabic) {
        node = el("bdi"); node.textContent = run.text; node.lang = "ar"; node.dir = "rtl";
        node.style.cssText = "font-family:'Noto Sans Arabic',sans-serif;font-style:normal;font-weight:600";
      } else if (run.italic) { node = el("i"); node.textContent = run.text; }
      else node = document.createTextNode(run.text);
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
    const shown = state.layers.find((l) => l.card === i);
    parts.layer.style.display = shown ? "block" : "none";
    if (!shown) return;
    parts.layer.style.zIndex = state.layers.indexOf(shown) + 1;
    parts.layer.style.opacity = shown.opacity;
    if (parts.photo) {
      parts.photo.style.transformOrigin = parts.origin;
      parts.photo.style.transform = "scale(" + shown.zoom + ")";
    }
  });
  drawSubtitle(state.subtitle);
  const visible = [...frame.querySelectorAll(".vf-layer")].filter((l) => l.style.display === "block");
  const maps = visible.flatMap((l) => [...l.querySelectorAll(".vb-photo svg.ec-map")]).map((svg) => {
    const r = svg.getBoundingClientRect();
    return { viewBox: svg.getAttribute("viewBox"), x: r.left, y: r.top, w: r.width, h: r.height };
  });
  return { boxes: textBoxes(frame), text: frame.innerText, lit: frame.querySelectorAll("#subtitles .lit").length, maps };
};
</script></body></html>`;
