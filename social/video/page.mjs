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
.plate{height:54px;padding:0 22px;display:flex;align-items:center;border-radius:999px;background:rgba(243,233,218,.95);box-shadow:0 2px 10px rgba(11,8,6,.45);font-family:Anton,"Noto Sans",sans-serif;font-size:38px;line-height:54px;color:#15100b;white-space:nowrap}
</style></head><body><div id="frame">
<canvas id="earth" width="1080" height="1920"></canvas>
<svg id="lines" width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true"><defs><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs><g id="rivers" fill="none" stroke-linecap="round" stroke-linejoin="round"></g></svg>
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
  for (const l of f.labels) {
    if (l.opacity <= 0) continue;
    const plate = el("div", \`position:absolute;left:\${l.x}px;top:\${l.y - 27}px;transform:translateX(-50%);opacity:\${l.opacity}\`, l.name);
    plate.className = "plate";
    names.append(plate);
  }

  const head = document.getElementById("head");
  head.replaceChildren();
  const signature = el("div", "display:flex;align-items:center;gap:12px");
  const logo = el("img", "width:36px;height:36px;display:block");
  logo.src = "/logo.png"; logo.alt = "Logo EthniAfrica";
  signature.append(logo, el("span", "font-family:Fraunces,Georgia,serif;font-weight:600;font-size:28px;line-height:36px;color:#f3e9da", "EthniAfrica"));
  if (f.demo) signature.append(el("span", "margin-left:8px;padding:3px 12px;border-radius:999px;background:#ffe58a;color:#2b2100;font-size:16px;line-height:22px;font-weight:800", "Texte illustratif"));
  const title = el("h1", "margin:0;font-family:Anton,'Noto Sans',sans-serif;font-weight:400;font-size:76px;line-height:80px;color:#f3e9da;text-shadow:0 0 2px rgba(11,8,6,.9),0 2px 14px rgba(11,8,6,.7)");
  for (const part of f.title) title.append(part.water ? el("span", "color:#8fd3e6", part.text) : document.createTextNode(part.text));
  head.append(signature, title);

  const panel = document.getElementById("panel");
  panel.replaceChildren();
  const legend = el("div", "display:flex;flex-wrap:wrap;gap:12px 28px");
  for (const item of f.legend) {
    const row = el("div", \`display:flex;align-items:center;gap:12px;opacity:\${item.opacity}\`);
    const swatch = document.createElementNS(SVG, "svg");
    swatch.setAttribute("width", 44); swatch.setAttribute("height", 24);
    swatch.innerHTML = '<line x1="4" y1="12" x2="40" y2="12" stroke="#6fcbe2" stroke-width="12" stroke-linecap="round" opacity="0.45"/><line x1="4" y1="12" x2="40" y2="12" stroke="#e4f6fb" stroke-width="4.5" stroke-linecap="round"/>';
    row.append(swatch, el("span", \`font-size:\${f.legend.length > 1 ? 24 : 26}px;line-height:32px;font-weight:700;color:#f3e9da\`, item.label));
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
  for (const n of names.querySelectorAll(".place,.plate")) add(n.textContent, n);
  return boxes;
};
</script></body></html>`;
