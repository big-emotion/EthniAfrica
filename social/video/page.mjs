// The isolated page that draws one frame. Everything it shows arrives in the
// payload computed by render.mjs; the page has no clock and no network.

export const PAGE_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><style>
@font-face{font-family:Anton;src:url(/fonts/Anton-Regular.ttf)}
@font-face{font-family:Fraunces;src:url(/fonts/Fraunces.ttf);font-weight:100 900}
@font-face{font-family:"Nunito Sans";src:url(/fonts/NunitoSans.ttf);font-weight:200 1000}
@font-face{font-family:"Noto Sans";src:url(/fonts/NotoSans-Variable.ttf);font-weight:100 900}
html,body{margin:0;background:#070605}
#frame{position:relative;width:1080px;height:1920px;overflow:hidden;background:#070605;color:#f3e9da;font-family:"Nunito Sans","Noto Sans",sans-serif}
#frame>*{position:absolute;left:0;top:0}
.halo{text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.8),0 1px 10px rgba(11,8,6,.6)}
.dot{width:16px;height:16px;box-sizing:border-box;border-radius:999px;background:#f3e9da;border:3px solid rgba(11,8,6,.7)}
.place{font-size:28px;line-height:32px;font-weight:800;white-space:nowrap}
.area-name{font-family:Anton,"Noto Sans",sans-serif;font-size:36px;line-height:44px;white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.85),0 1px 10px rgba(11,8,6,.6)}
.water{font-size:26px;line-height:30px;font-weight:700;font-style:italic;color:#bfe0ea;white-space:pre;text-align:center;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.8)}
.region{font-family:Anton,"Noto Sans",sans-serif;font-size:52px;line-height:60px;letter-spacing:.12em;color:rgba(243,233,218,.92);white-space:pre;text-align:center}
.plate{height:54px;padding:0 22px;display:flex;align-items:center;border-radius:999px;background:rgba(243,233,218,.95);box-shadow:0 2px 10px rgba(11,8,6,.45);font-family:Anton,"Noto Sans",sans-serif;font-size:38px;line-height:54px;color:#15100b;white-space:nowrap}
</style></head><body><div id="frame">
<canvas id="earth" width="1080" height="1920"></canvas>
<svg id="lines" width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter><pattern id="hatch-a" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><rect width="18" height="18" fill="#e8b96a" fill-opacity="0.10"/><line x1="9" y1="0" x2="9" y2="18" stroke="#0b0806" stroke-opacity="0.45" stroke-width="8"/><line x1="9" y1="0" x2="9" y2="18" stroke="#e8b96a" stroke-width="4"/></pattern><pattern id="swatch-hatch-a" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#e8b96a" stroke-width="2"/></pattern><pattern id="hatch-b" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><rect width="18" height="18" fill="#6cc3b5" fill-opacity="0.10"/><line x1="9" y1="0" x2="9" y2="18" stroke="#0b0806" stroke-opacity="0.45" stroke-width="8"/><line x1="9" y1="0" x2="9" y2="18" stroke="#6cc3b5" stroke-width="4"/></pattern><pattern id="swatch-hatch-b" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#6cc3b5" stroke-width="2"/></pattern><pattern id="hatch-c" patternUnits="userSpaceOnUse" width="18" height="18" patternTransform="rotate(45)"><rect width="18" height="18" fill="#e3876a" fill-opacity="0.10"/><line x1="9" y1="0" x2="9" y2="18" stroke="#0b0806" stroke-opacity="0.45" stroke-width="8"/><line x1="9" y1="0" x2="9" y2="18" stroke="#e3876a" stroke-width="4"/></pattern><pattern id="swatch-hatch-c" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#e3876a" stroke-width="2"/></pattern></defs><g id="fills"></g><g id="borders" fill="none" stroke-linecap="round" stroke-linejoin="round"></g><g id="edges" fill="none" stroke-linecap="round" stroke-linejoin="round"></g><g id="rivers" fill="none" stroke-linecap="round" stroke-linejoin="round"></g></svg>
<div style="width:1080px;height:600px;background:linear-gradient(180deg,rgba(7,6,5,.72) 0px,rgba(7,6,5,.55) 420px,rgba(7,6,5,0) 600px)"></div>
<div id="names"></div>
<div style="top:940px;width:1080px;height:980px;background:linear-gradient(180deg,rgba(21,16,11,0) 0px,rgba(21,16,11,.92) 130px,rgba(21,16,11,.92) 980px)"></div>
<div id="head" style="left:120px;top:290px;width:840px;display:flex;flex-direction:column;gap:12px"></div>
<div id="panel" style="left:120px;top:1064px;width:660px;height:176px;display:flex;flex-direction:column;justify-content:flex-end;gap:16px"></div>
</div>
<script>
const VERT = \`#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }\`;
// Grade, limb darkening, atmosphere and vignette follow the design's
// render.py (board 1); the parameters are mixed from base to recede.
const FRAG = \`#version 300 es
precision highp float;
uniform vec2 centre; uniform float radius; uniform vec2 view;
uniform sampler2D world; uniform sampler2D region; uniform vec4 bounds;
uniform float grade;
out vec4 colour;
const float PI = 3.141592653589793;
const vec3 SPACE = vec3(7.0, 6.0, 5.0) / 255.0;
const vec3 ATMOS = vec3(143.0, 184.0, 204.0) / 255.0;
const vec3 WARM = vec3(255.0, 238.0, 221.0) / 255.0;
vec3 graded(vec3 c) {
  float sat = mix(0.85, 0.70, grade), expo = mix(0.90, 0.76, grade);
  float con = mix(1.06, 0.96, grade), warm = mix(0.35, 0.45, grade);
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = vec3(lum) + sat * (c - vec3(lum));
  c = (c * expo - 0.5) * con + 0.5;
  return clamp(c * (1.0 - warm + warm * WARM), 0.0, 1.0);
}
void main() {
  vec2 px = vec2(gl_FragCoord.x, 1920.0 - gl_FragCoord.y);
  float x = (px.x - centre.x) / radius, y = -(px.y - centre.y) / radius;
  float rho = length(vec2(x, y));
  float d = (rho - 1.0) * radius;
  float glow = exp(-max(d, 0.0) / max(0.045 * radius, 1.0)) * 0.55;
  vec3 space = mix(SPACE, ATMOS, glow);
  vec3 land = space;
  if (rho < 1.0) {
    float cc = sqrt(1.0 - rho * rho);
    float lat0 = view.y, lon0 = view.x;
    float lat = rho > 0.0 ? asin(clamp(cc * sin(lat0) + y * rho * cos(lat0) / rho, -1.0, 1.0)) : lat0;
    float lon = lon0 + (rho > 0.0 ? atan(x * rho, rho * cc * cos(lat0) - y * rho * sin(lat0)) : 0.0);
    float lonD = degrees(lon), latD = degrees(lat);
    lonD = mod(lonD + 180.0, 360.0) - 180.0;
    vec3 c;
    if (lonD >= bounds.x && lonD <= bounds.y && latD >= bounds.z && latD <= bounds.w)
      c = texture(region, vec2((lonD - bounds.x) / (bounds.y - bounds.x), (bounds.w - latD) / (bounds.w - bounds.z))).rgb;
    else
      c = texture(world, vec2((lonD + 180.0) / 360.0, (90.0 - latD) / 180.0)).rgb;
    c = graded(c) * (0.62 + 0.38 * sqrt(cc));
    float haze = 0.28 * pow(1.0 - cc, 3.0);
    land = c * (1.0 - haze) + ATMOS * haze * mix(0.55, 0.4, grade);
  }
  // Antialiased limb: blend over one pixel instead of a hard edge.
  vec3 c = mix(land, space, smoothstep(-0.5, 0.5, d));
  float nx = (px.x / 1080.0 - 0.5) * 2.0;
  float ny = (px.y / 1920.0 - 0.36) * 2.0 * (1920.0 / 1080.0) * 0.6;
  float t = smoothstep(0.0, 1.0, clamp((sqrt(nx * nx * 0.8 + ny * ny) - 0.6) / 0.75, 0.0, 1.0));
  colour = vec4(c * (1.0 - 0.24 * t), 1.0);
}\`;

const gl = document.getElementById("earth").getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
let program;
function compile(type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
async function texture(unit, url) {
  const img = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: "none" });
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
window.setup = async (bounds) => {
  if (!gl) throw new Error("WebGL2 unavailable");
  program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  await texture(0, "/imagery/world.jpg");
  await texture(1, "/imagery/region.jpg");
  gl.uniform1i(gl.getUniformLocation(program, "world"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "region"), 1);
  gl.uniform4f(gl.getUniformLocation(program, "bounds"), ...bounds);
  await document.fonts.load('38px Anton'); await document.fonts.load('600 28px Fraunces');
  await document.fonts.load('800 28px "Nunito Sans"'); await document.fonts.load('400 22px "Nunito Sans"'); await document.fonts.load('400 22px "Noto Sans"');
  await document.fonts.ready;
  return [...document.fonts].map((f) => ({ family: f.family, status: f.status }));
};

const el = (tag, style, text) => {
  const e = document.createElement(tag);
  if (style) e.setAttribute("style", style);
  if (text !== undefined) e.textContent = text;
  return e;
};
const SVG = "http://www.w3.org/2000/svg";
const INK = { a: "#e8b96a", b: "#6cc3b5", c: "#e3876a" };
function path(d, attrs) {
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("d", d);
  for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v);
  return p;
}
function group(opacity, ...children) {
  const g = document.createElementNS(SVG, "g");
  g.setAttribute("opacity", opacity);
  g.append(...children);
  return g;
}
// Board 2: certain areas filled at 30 % with a solid edge; uncertain areas
// hatched with a dashed edge; every bright stroke over a dark keyline.
function areaFill(a) {
  return group(a.opacity, path(a.d, a.uncertain
    ? { fill: \`url(#hatch-\${a.ink})\`, "fill-rule": "evenodd" }
    : { fill: INK[a.ink], "fill-opacity": 0.3, "fill-rule": "evenodd" }));
}
function areaEdge(a) {
  const dash = a.uncertain ? { "stroke-dasharray": "16 10" } : {};
  return group(a.opacity,
    path(a.d, { stroke: "#0b0806", "stroke-opacity": 0.55, "stroke-width": 8, ...dash }),
    path(a.d, { stroke: INK[a.ink], "stroke-width": 4, ...dash }));
}
function border(b) {
  return group(b.opacity, ...(b.strong
    ? [path(b.d, { stroke: "#0b0806", "stroke-opacity": 0.55, "stroke-width": 8 }),
       path(b.d, { stroke: "#f3e9da", "stroke-opacity": 0.92, "stroke-width": 3.5 })]
    : [path(b.d, { stroke: "#0b0806", "stroke-opacity": 0.35, "stroke-width": 5 }),
       path(b.d, { stroke: "#f3e9da", "stroke-opacity": 0.7, "stroke-width": 2, "stroke-dasharray": "9 7" })]));
}
const SWATCHES = {
  river: '<line x1="4" y1="12" x2="40" y2="12" stroke="#6fcbe2" stroke-width="12" stroke-linecap="round" opacity="0.45"/><line x1="4" y1="12" x2="40" y2="12" stroke="#e4f6fb" stroke-width="4.5" stroke-linecap="round"/>',
  "border-quiet": '<line x1="2" y1="12" x2="42" y2="12" stroke="#f3e9da" stroke-opacity="0.8" stroke-width="2.5" stroke-dasharray="7 5"/>',
  "border-strong": '<line x1="2" y1="12" x2="42" y2="12" stroke="#0b0806" stroke-opacity="0.55" stroke-width="8"/><line x1="2" y1="12" x2="42" y2="12" stroke="#f3e9da" stroke-opacity="0.92" stroke-width="3.5"/>',
};
for (const [k, v] of Object.entries(INK)) {
  SWATCHES["certain-" + k] = \`<rect x="2" y="2" width="40" height="20" rx="3" fill="\${v}" fill-opacity="0.35" stroke="\${v}" stroke-width="3"/>\`;
  SWATCHES["uncertain-" + k] = \`<rect x="2" y="2" width="40" height="20" rx="3" fill="url(#swatch-hatch-\${k})" stroke="\${v}" stroke-width="3" stroke-dasharray="6 4"/>\`;
}

function river(d, state) {
  const g = document.createElementNS(SVG, "g");
  for (const [stroke, width, opacity, extra] of [
    ["#6fcbe2", 16, state.glow, { filter: "url(#glow)" }],
    ["#0b0806", 9, 0.5 * state.core, {}],
    ["#e4f6fb", 4.5, state.core, {}],
  ]) {
    const p = document.createElementNS(SVG, "path");
    p.setAttribute("d", d); p.setAttribute("stroke", stroke);
    p.setAttribute("stroke-width", width); p.setAttribute("opacity", opacity);
    for (const [k, v] of Object.entries(extra)) p.setAttribute(k, v);
    g.append(p);
  }
  return g;
}

window.drawFrame = (f) => {
  gl.viewport(0, 0, 1080, 1920);
  gl.uniform2f(gl.getUniformLocation(program, "centre"), f.centre.x, f.centre.y);
  gl.uniform1f(gl.getUniformLocation(program, "radius"), f.camera.radius);
  gl.uniform2f(gl.getUniformLocation(program, "view"), f.camera.lon * Math.PI / 180, f.camera.lat * Math.PI / 180);
  gl.uniform1f(gl.getUniformLocation(program, "grade"), f.grade);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();

  document.getElementById("fills").replaceChildren(...f.areas.filter((a) => a.opacity > 0).map(areaFill));
  document.getElementById("borders").replaceChildren(...f.borders.filter((b) => b.opacity > 0).map(border));
  document.getElementById("edges").replaceChildren(...f.areas.filter((a) => a.opacity > 0).map(areaEdge));
  const rivers = document.getElementById("rivers");
  rivers.replaceChildren(...f.rivers.filter((r) => r.state.core > 0 || r.state.glow > 0).map((r) => river(r.d, r.state)));

  const names = document.getElementById("names");
  names.replaceChildren();
  for (const p of f.places) {
    if (p.opacity <= 0) continue;
    const g = el("div", \`position:absolute;left:0;top:0;width:1080px;height:1920px;opacity:\${p.opacity}\`);
    g.append(el("div", \`position:absolute;left:\${p.x - 8}px;top:\${p.y - 8}px\`));
    g.lastChild.className = "dot";
    const name = el("div", p.side === "left"
      ? \`position:absolute;right:\${1080 - (p.x - 14)}px;top:\${p.y - 16}px;text-align:right\`
      : \`position:absolute;left:\${p.x + 14}px;top:\${p.y - 16}px\`, p.name);
    name.className = "place halo";
    g.append(name);
    names.append(g);
  }
  for (const l of [...f.labels, ...f.names]) {
    if (l.opacity <= 0) continue;
    const centred = \`position:absolute;left:\${l.x}px;top:\${l.y}px;transform:translate(-50%,-50%);opacity:\${l.opacity}\`;
    const name = el("div", l.colour ? centred + ";color:" + l.colour : centred, l.name);
    name.className = { plate: "plate", area: "area-name", water: "water halo", region: "region halo" }[l.style];
    names.append(name);
  }

  const head = document.getElementById("head");
  head.replaceChildren();
  const signature = el("div", "display:flex;align-items:center;gap:12px");
  const logo = el("img", "width:36px;height:36px;display:block");
  logo.src = "/logo.png"; logo.alt = "Logo EthniAfrica";
  signature.append(logo, el("span", "font-family:Fraunces,Georgia,serif;font-weight:600;font-size:28px;line-height:36px;color:#f3e9da", "EthniAfrica"));
  if (f.demo) signature.append(el("span", "margin-left:8px;padding:3px 12px;border-radius:999px;background:#ffe58a;color:#2b2100;font-size:16px;line-height:22px;font-weight:800", "Texte illustratif"));
  const title = el("h1", "margin:0;font-family:Anton,'Noto Sans',sans-serif;font-weight:400;font-size:76px;line-height:80px;color:#f3e9da;text-shadow:0 0 2px rgba(11,8,6,.9),0 2px 14px rgba(11,8,6,.7)");
  for (const part of f.title) title.append(part.colour ? el("span", "color:" + part.colour, part.text) : document.createTextNode(part.text));
  head.append(signature, title);

  const panel = document.getElementById("panel");
  panel.replaceChildren();
  // Up to two items on one row each; three or four share a two-column grid.
  const legend = el("div", f.legend.length > 2
    ? "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px"
    : "display:flex;flex-wrap:wrap;gap:12px 28px");
  for (const item of f.legend) {
    const row = el("div", \`display:flex;align-items:center;gap:12px;opacity:\${item.opacity}\`);
    const swatch = document.createElementNS(SVG, "svg");
    swatch.setAttribute("width", 44); swatch.setAttribute("height", 24);
    swatch.innerHTML = SWATCHES[item.swatch];
    row.append(swatch, el("span", \`font-size:\${f.legend.length > 1 ? 24 : 26}px;line-height:32px;font-weight:700;color:\${item.colour}\`, item.label));
    legend.append(row);
  }
  const caption = el("p", "margin:0;font-size:22px;line-height:28px;color:#cbbba3");
  f.caption.forEach(([label, text], i) => {
    if (i) caption.append(el("br"));
    caption.append(el("b", "font-weight:700;color:#f3e9da", label + "\\u00a0:"), document.createTextNode(" " + text));
  });
  panel.append(legend, caption);

  // Report the real glyph boxes so the safe zone is checked on what was drawn.
  const boxes = [];
  const add = (id, node) => { const r = node.getBoundingClientRect(); boxes.push({ id, box: { x: r.left, y: r.top, w: r.width, h: r.height } }); };
  add("signature", signature); add("title", title); add("legend", legend); add("caption", caption);
  for (const n of names.querySelectorAll(".place,.plate,.area-name,.water,.region")) add(n.textContent, n);
  return boxes;
};
</script></body></html>`;
