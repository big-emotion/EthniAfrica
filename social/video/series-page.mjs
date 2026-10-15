// The isolated page that draws one frame of the series video, full screen
// (EthniAfrica Cartes 1.4.0; map cards on satellite imagery since 1.4.1,
// with the satellite video's own shader and overlays). Its geometry and
// styles follow the design
// board handoff/video-board-full.html; the cards' words, inks and fonts come
// from the design system itself (EthniCards.render with context 'video'), so
// they match the carousel. The image fills the frame and only text sits on
// it: every letter carries its own dark outline, nothing darkens the image.
// Everything arrives from series-render.mjs; the page has no clock and no
// network.
import { FLAT_VERT, FLAT_FRAG, OVERLAY_SCRIPT } from "./page.mjs";
import { flatProject } from "./series-map.mjs";

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
/* 1.4.1: a map card on imagery, its overlays and names; all of it zooms. */
.vf-map{position:absolute;left:0;top:0;width:1080px;height:1920px}
.vf-map canvas,.vf-map svg{position:absolute;left:0;top:0;width:1080px;height:1920px;display:block}
.sm-name{position:absolute;white-space:nowrap;transform:translate(-50%,-50%);text-shadow:0 0 2px rgba(11,8,6,.95),0 0 8px rgba(11,8,6,.8),0 1px 14px rgba(11,8,6,.6)}
.sm-region{font-family:var(--font-display);font-weight:400;letter-spacing:.12em;text-indent:.12em;color:rgba(243,233,218,.94)}
.sm-area{font-family:var(--font-text);font-weight:700}
.sm-water{font:italic 700 26px/30px var(--font-text);color:#bfe0ea}
/* 1.5.0: a map sequence's name in its ink over the head's dark outline, its
   language in italic under it, in one box kept at full height. */
.sm-seq{display:flex;flex-direction:column;align-items:center;text-align:center}
.sm-self{font:700 32px/38px var(--font-text);-webkit-text-stroke:6px var(--oi-stroke);paint-order:stroke fill}
.sm-lang{font:italic 700 26px/30px var(--font-text);-webkit-text-stroke:5px var(--oi-stroke);paint-order:stroke fill}
.sm-place{position:absolute;left:0;top:0}
.sm-dot{position:absolute;width:16px;height:16px;box-sizing:border-box;border-radius:999px;background:#f3e9da;border:3px solid rgba(11,8,6,.7)}
.sm-place-name{position:absolute;font:800 28px/32px var(--font-text);color:#f3e9da;white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.8),0 1px 10px rgba(11,8,6,.6)}
.vf-keys{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px;margin-bottom:6px}
.vf-keys .vf-key{font-size:24px;line-height:30px;margin-bottom:6px}
.vf-key svg{width:36px;height:24px;flex:none;display:block}
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
<svg id="sm-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs></defs></svg>
<script>
${OVERLAY_SCRIPT}
document.querySelector("#sm-defs defs").insertAdjacentHTML("beforeend", hatchDefs());
const SAT_VERT = ${JSON.stringify(FLAT_VERT)};
const SAT_FRAG = ${JSON.stringify(FLAT_FRAG)};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const resolveAsset = (name) => "/assets/" + name;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
// The cards' French spacing (EthniCards' fr): a narrow no-break space before
// ; : ! ? » and after «.
const fr = (s) => s.replace(/[ \\u00a0]+([;:!?»])/g, "\\u202f$1").replace(/«[ \\u00a0]+/g, "«\\u202f");
const MONTHS = "(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)";
const DATE_STEPS = [[176, 156], [148, 136], [124, 118], [104, 100]];
const layers = [];
const runs = [];
let logoUrl = null;

function signature() {
  return el("div", "vf-sign", '<img src="' + logoUrl + '" alt=""><b class="oi">EthniAfrica</b>');
}

// One layer per card, built once from the design system's own render of the
// card for a video: its band, head, sources and signature words.
function buildLayer(spec, view) {
  const card = EthniCards.render(spec, { context: "video", resolve: resolveAsset, demo: false });
  const pick = (sel) => card.querySelector(sel);
  const layer = el("div", "vf-layer");
  const pic = el("div", "vf-pic");
  layer.append(pic);
  const parts = { spec, layer, pic, text: [], photo: null, map: null, date: null, slot: false, closing: spec.type === "closing" };
  const src = (spec.image && spec.image.src) || "";
  if (view && view.sequence) {
    // 1.5.0: the card's map is its run's, drawn by drawRun; the card brings
    // its head and foot.
    parts.seqView = view;
  } else if (view) {
    parts.map = mapLayer(view);
    parts.photo = parts.map;
    parts.view = view;
    parts.scale = view.scale;
    pic.append(parts.map);
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
  if (view) {
    // The key as text with the satellite swatches, two columns from three
    // items; then the source without its base map clause and the imagery.
    const box = view.key.length >= 3 ? el("div", "vf-keys") : foot;
    if (box !== foot) foot.append(box);
    for (const item of view.key) {
      const swatch = item.swatch === "text" ? "" : '<svg viewBox="0 0 44 24">' + SWATCHES[item.swatch] + "</svg>";
      const key = el("div", "vf-key oi", swatch + "<span>" + esc(fr(item.label)) + "</span>");
      key.dataset.kind = "key";
      if (item.file) key.dataset.file = item.file;
      box.append(key);
    }
    const lines = [["vf-src", "source", view.credits.source && "Source : " + view.credits.source], ["vf-cred", "credit", view.credits.imagery]];
    for (const [cls, kind, text] of lines) {
      if (!text) continue;
      const line = el("div", cls + " oi", esc(fr(text)));
      line.dataset.kind = kind;
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

// A map card on imagery (1.4.1): the satellite video's flat shader at the
// recede grade with no vignette, drawn once into the layer's own canvas;
// the overlays and names over it, in frame pixels at 100 %.
let sat = null;
async function satellite(bounds) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error("WebGL2 unavailable");
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, SAT_VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, SAT_FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  // As the satellite video loads its imagery (render.mjs, page.mjs).
  for (const [unit, url, name] of [[0, "/imagery/world.jpg", "world"], [1, "/imagery/region.jpg", "region"]]) {
    const img = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: "none" });
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
  }
  gl.uniform4f(gl.getUniformLocation(program, "bounds"), ...bounds);
  gl.uniform1f(gl.getUniformLocation(program, "grade"), 1); // recede
  gl.uniform1f(gl.getUniformLocation(program, "dim"), 0);
  gl.uniform1f(gl.getUniformLocation(program, "plain"), 1); // no vignette
  return { gl, program, canvas };
}
function paintImagery(target, camera) {
  const { gl, program, canvas } = sat;
  gl.viewport(0, 0, 1080, 1920);
  gl.uniform2f(gl.getUniformLocation(program, "centre"), 540, camera.centreY);
  gl.uniform1f(gl.getUniformLocation(program, "radius"), camera.radius);
  gl.uniform2f(gl.getUniformLocation(program, "view"), camera.lon * Math.PI / 180, camera.lat * Math.PI / 180);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
  target.getContext("2d").drawImage(canvas, 0, 0);
}
function mapLayer(view) {
  const wrap = el("div", "vf-map");
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  wrap.append(canvas);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", 1080); svg.setAttribute("height", 1920);
  svg.setAttribute("viewBox", "0 0 1080 1920");
  const groups = ["fills", "borders", "edges"].map(() => {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("fill", "none"); g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
    svg.append(g);
    return g;
  });
  const areas = view.areas.map((a) => ({ ...a, opacity: 1 }));
  groups[0].append(...areas.map(areaFill));
  groups[1].append(...view.borders.map((b) => border({ ...b, opacity: 1 })));
  groups[2].append(...areas.map(areaEdge));
  wrap.append(svg);
  for (const p of view.places) {
    const g = el("div", "sm-place");
    const dot = el("div", "sm-dot");
    Object.assign(dot.style, { left: p.x - 8 + "px", top: p.y - 8 + "px" });
    const name = el("div", "sm-place-name sm-name-box", esc(fr(p.name)));
    Object.assign(name.style, { left: p.x + 14 + "px", top: p.y - 16 + "px" });
    g.append(dot, name);
    wrap.append(g);
  }
  for (const n of view.names) {
    const name = el("div", "sm-name sm-name-box sm-" + n.style, esc(fr(n.text)));
    const lead = { region: 8, area: 6, water: 4 }[n.style];
    Object.assign(name.style, { left: n.box.x + n.box.w / 2 + "px", top: n.box.y + n.box.h / 2 + "px", fontSize: n.size + "px", lineHeight: n.size + lead + "px" });
    if (n.ink) name.style.color = INK[n.ink];
    wrap.append(name);
  }
  wrap._canvas = canvas;
  return wrap;
}

// 1.5.0: one map per run of a map sequence. Its imagery is painted once per
// still view, in setup; a frame of a change of view repaints it (the only
// frames that do). Its areas and borders are projected from longitude and
// latitude by the engine's own flat projection.
${flatProject.toString()}
const viewImagery = new Map();
let imageryPaints = 0;
const cameraKey = (c) => [c.lon, c.lat, c.radius, c.centreY].join(",");
const ringPath = (camera, ring) =>
  "M" + ring.map(([lon, lat]) => flatProject(camera, lon, lat).map((n) => +n.toFixed(1)).join(",")).join("L");
function runLayer(sequence, r) {
  const wrap = el("div", "vf-map");
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  wrap.append(canvas);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", 1080); svg.setAttribute("height", 1920);
  svg.setAttribute("viewBox", "0 0 1080 1920");
  const [fills, lines, edges] = ["fills", "borders", "edges"].map(() => {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("fill", "none"); g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
    svg.append(g);
    return g;
  });
  const areas = {};
  for (const file of sequence.order) {
    const a = sequence.areas[file];
    if (a.sequence !== sequence.runs[r].sequence) continue;
    const spec = { d: "", ink: a.ink, uncertain: a.uncertain, hatch: a.hatch, opacity: 0 };
    const fill = areaFill(spec), edge = areaEdge(spec);
    fills.append(fill); edges.append(edge);
    areas[file] = { polygons: a.polygons, groups: [fill, edge], paths: [...fill.querySelectorAll("path"), ...edge.querySelectorAll("path")] };
  }
  const borderLines = sequence.borders[r];
  let borderPaths = [];
  if (borderLines) {
    const g = border({ d: "", strong: borderLines.strong, opacity: 1 });
    lines.append(g);
    borderPaths = [...g.querySelectorAll("path")];
  }
  wrap.append(svg);
  const names = el("div");
  wrap.append(names);
  return { wrap, canvas, areas, borderLines, borderPaths, names, key: null };
}
function paintRun(node, camera) {
  const key = cameraKey(camera);
  if (node.key === key) return;
  node.key = key;
  const cached = viewImagery.get(key);
  if (cached) {
    node.canvas.getContext("2d").drawImage(cached, 0, 0);
  } else {
    paintImagery(node.canvas, camera);
    imageryPaints++;
  }
  for (const a of Object.values(node.areas)) {
    const d = a.polygons.flatMap((p) => p.map((ring) => ringPath(camera, ring) + "Z")).join("");
    a.paths.forEach((p) => p.setAttribute("d", d));
  }
  if (node.borderLines) {
    const d = node.borderLines.lines.map((l) => ringPath(camera, l)).join("");
    node.borderPaths.forEach((p) => p.setAttribute("d", d));
  }
}
function drawRun(node, map) {
  paintRun(node, map.camera);
  for (const [file, a] of Object.entries(node.areas)) {
    const shown = map.areas.find((x) => x.file === file);
    a.groups.forEach((g) => g.setAttribute("opacity", shown ? shown.opacity : 0));
  }
  node.names.replaceChildren();
  for (const n of map.names) {
    if (!(n.opacity > 0)) continue;
    const name = el("div", "sm-name sm-name-box sm-seq", '<span class="sm-self">' + esc(fr(n.text)) + "</span>" + (n.lang ? '<span class="sm-lang">' + esc(fr(n.lang)) + "</span>" : ""));
    Object.assign(name.style, { left: n.box.x + n.box.w / 2 + "px", top: n.box.y + n.box.h / 2 + "px", color: INK[n.ink], opacity: n.opacity });
    if (n.lang) name.lastChild.style.opacity = n.opacity > 0 ? n.langOpacity / n.opacity : 0;
    node.names.append(name);
  }
  node.wrap.style.transformOrigin = "540px " + map.camera.centreY + "px";
  node.wrap.style.transform = "scale(" + map.zoom + ")";
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

window.setup = async ({ tokens, cards, logo, demo, maps }) => {
  await EthniCards.installTokens(tokens, "/design/");
  logoUrl = resolveAsset(logo);
  const frame = document.getElementById("frame");
  frame.setAttribute("data-theme", cards[0].theme || "nuit");
  if (maps) sat = await satellite(maps.bounds);
  for (const [i, spec] of cards.entries()) {
    const parts = buildLayer(spec, maps && maps.views[i]);
    if (parts.view) paintImagery(parts.map._canvas, parts.view.camera);
    frame.append(parts.layer);
    layers.push(parts);
  }
  if (maps && maps.sequence) {
    for (const v of Object.values(maps.sequence.views)) {
      const key = cameraKey(v.camera);
      if (viewImagery.has(key)) continue;
      const still = document.createElement("canvas");
      still.width = 1080; still.height = 1920;
      paintImagery(still, v.camera);
      viewImagery.set(key, still);
    }
    maps.sequence.runs.forEach((_, r) => runs.push(runLayer(maps.sequence, r)));
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
    if (parts.photo && parts.photo.naturalWidth) placeImage(parts);
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
    if (l.opacity > 0 && parts.view) {
      // The subject and the names zoom with the map around (540, 1010).
      const s = parts.view.subject, z = l.zoom, cy = parts.view.camera.centreY;
      boxes.push({ id: parts.spec.id, kind: "map-subject", x: 540 + (s.x - 540) * z, y: cy + (s.y - cy) * z, w: s.w * z, h: s.h * z });
      parts.map.querySelectorAll(".sm-name-box").forEach((n) => boxes.push({ id: n.textContent, kind: "map-name", ...rect(n) }));
    }
    if (l.opacity > 0 && l.map) {
      // 1.5.0: the run's map, hosted by this layer. The subject is checked
      // on still views; a stack is one name box.
      boxes.push({ id: parts.spec.id, kind: "image", x: 0, y: 0, w: 1080, h: 1920, scale: +(l.map.scale * l.zoom).toFixed(3) });
      const s = l.map.subject, z = l.zoom, cy = l.map.camera.centreY;
      if (s) boxes.push({ id: parts.spec.id, kind: "map-subject", x: 540 + (s.x - 540) * z, y: cy + (s.y - cy) * z, w: s.w * z, h: s.h * z });
      runs[l.map.run].names.querySelectorAll(".sm-name-box").forEach((n) => boxes.push({ id: n.textContent, kind: "map-name", ...rect(n), ink: getComputedStyle(n).color }));
    }
    if (!(l.text > 0)) continue;
    const layer = parts.layer;
    layer.querySelectorAll(".vf-head > *").forEach((n) =>
      add(n, "head", { card: l.card, ...(n === parts.date && { date: { size: parts.dateSize, lines: parts.dateLines } }) })
    );
    layer.querySelectorAll(".vf-close > *").forEach((n) => {
      if (n.classList.contains("vf-pill")) boxes.push({ id: "pill", kind: "pill", ...rect(n) });
      else add(n, "ending");
    });
    // A map card's foot may start at y 1600 (1.4.1).
    layer.querySelectorAll(".vf-foot [data-kind]").forEach((n) => add(n, n.dataset.kind, parts.view || parts.seqView ? { map: true } : {}));
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
// the « image à trouver » slot, a map's place dots and the demo tape.
function backgrounds(frame) {
  const allowed = (n) => n.closest(".lit, .vf-slot, .vf-demo, .vf-key, .sm-dot") || n.classList.contains("vf-pic");
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
  const paintsBefore = imageryPaints;
  // A run's map is drawn once, in the picture of its most opaque layer: the
  // outgoing card between two cards of a run, the incoming one on a return.
  const hosts = new Map();
  for (const l of state.layers)
    if (l.map && (!hosts.has(l.map.run) || l.opacity > hosts.get(l.map.run).opacity)) hosts.set(l.map.run, l);
  for (const [r, l] of hosts) {
    drawRun(runs[r], l.map);
    if (runs[r].wrap.parentNode !== layers[l.card].pic) layers[l.card].pic.append(runs[r].wrap);
  }
  layers.forEach((parts, i) => {
    const l = state.layers.find((x) => x.card === i);
    parts.layer.style.display = l ? "block" : "none";
    if (!l) return;
    parts.layer.style.zIndex = state.layers.indexOf(l) + 1;
    parts.pic.style.opacity = l.opacity;
    for (const t of parts.text) t.style.opacity = l.text;
    // A sequence card's key items follow their areas.
    if (l.map) parts.layer.querySelectorAll(".vf-key[data-file]").forEach((k) => (k.style.opacity = l.map.keys[k.dataset.file] ?? 0));
    if (parts.photo) {
      if (parts.view) parts.photo.style.transformOrigin = "540px " + parts.view.camera.centreY + "px";
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
    return { id: p.spec.id, camera: p.view.camera, spanKm: p.view.spanKm, capped: p.view.capped, x: r.left, y: r.top, w: r.width, h: r.height };
  });
  for (const [r, l] of hosts)
    maps.push({ id: layers[l.card].spec.id, run: r, camera: l.map.camera, moving: l.map.moving, spanKm: (1080 / l.map.camera.radius) * 6371 });
  const pictures = state.layers.filter((l) => l.opacity > 0).map((l) => ({ id: layers[l.card].spec.id, ...rect(layers[l.card].pic.firstElementChild || layers[l.card].pic) }));
  return {
    boxes: frameBoxes(frame, state),
    text: frame.innerText,
    lit: frame.querySelectorAll("#subtitles .lit").length,
    maps,
    pictures,
    backgrounds: backgrounds(frame),
    imageryPaints: imageryPaints - paintsBefore,
  };
};
</script></body></html>`;
