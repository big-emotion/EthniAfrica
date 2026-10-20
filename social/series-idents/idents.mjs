// Shared by the two idents: the easing of the support film, the animated
// parchment ground, the phone with the site's search redrawn in it, the
// episode's layer and the ready signal. Every value comes from render(t):
// the same time gives the same pixels, as in the series video engine.
import { CLIPS, SAFE_ZONE, BUTTON_COLUMN } from "./shots.mjs";
import { groundMotion } from "./ground.mjs";

export const params = new URLSearchParams(location.search);
export const $ = (id) => document.getElementById(id);
export const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const P = (t, a, b) => cl((t - a) / (b - a));
export const lerp = (a, b, x) => a + (b - a) * x;
export const eo = (x) => 1 - Math.pow(1 - x, 3);
export const eo5 = (x) => 1 - Math.pow(1 - x, 5);
export const eio = (x) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
// A small overshoot for things that land: chips, devices.
export const back = (x) => {
  const c1 = 1.4,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export function S(el, o) {
  if (typeof el === "string") el = $(el);
  const op = o.op ?? 1;
  el.style.opacity = op;
  el.style.visibility = op <= 0.001 ? "hidden" : "visible";
  el.style.transform = `translate(${o.x || 0}px,${o.y || 0}px) scale(${o.s ?? 1})`;
  el.style.filter = o.blur ? `blur(${o.blur}px)` : "none";
}
// In at a over d, out at b over d2, rising by dy.
export function rise(el, t, a, d, b, d2, dy = 30) {
  const k = eo5(P(t, a, a + d));
  const o = b === undefined ? 0 : eio(P(t, b, b + d2));
  S(el, { op: k * (1 - o), y: lerp(dy, 0, k) - o * dy });
}

export const SEARCH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`;

export function ground() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div id="parch" class="ground-parch"></div><div id="glow" class="ground-glow"></div>`
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div id="grain" class="ground-grain"></div>`
  );
}
export function moveGround(t) {
  const { grain, glow } = groundMotion(t);
  $("grain").style.transform = `translate(${grain[0]}px,${grain[1]}px)`;
  $("glow").style.transform = `translate(${glow[0]}px,${glow[1]}px)`;
}

// The episode's name. The intro needs only the name; the end card needs the
// answer page's lead and forms, kept in layers/<name>.json.
export async function loadLayer() {
  const file = params.get("layers") ?? "peul";
  const layer = await (await fetch(`layers/${file}.json`)).json();
  if (params.has("name")) layer.name = params.get("name");
  return layer;
}

// The networks the project publishes on (operator, 19 October 2026: no X),
// drawn as the site's footer draws them.
export const NETWORKS = {
  Instagram: `<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>`,
  TikTok: `<circle cx="9" cy="18" r="3"/><path d="M12 18V4a4 4 0 0 0 4 4"/>`,
  Facebook: `<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>`,
  YouTube: `<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>`,
  LinkedIn: `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>`,
};
export const networkIcon = (name, size) =>
  `<svg data-network="${name}" aria-label="${name}" role="img" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${NETWORKS[name]}</svg>`;

// The phone, 620 × 1240 at scale 1, its screen 588 px wide with a 38 px
// gutter, the site's home page and its answer page drawn in it.
export function phone(host, layer) {
  host.insertAdjacentHTML(
    "beforeend",
    `<div class="device" id="ph" style="width:620px;height:1240px;border-radius:72px">
      <div class="screen" style="left:16px;top:16px;width:588px;height:1208px;border-radius:58px">
        <div class="abs" id="phFull" style="left:38px;top:0;width:512px;height:1208px">
          <div class="abs lockup" style="top:44px;gap:14px" data-role="wordmark"><img src="../brand/ethniafrica-logo.png" alt="" style="width:56px;height:56px"><span style="font-size:38px">EthniAfrica</span></div>
          <p class="abs site-title" id="phTitle" data-role="site-ui" style="top:170px;font-size:72px">D’où vient<br>ce nom ?</p>
          <div class="abs" id="phSearch" style="top:360px;width:512px">
            <div class="field" id="phField" style="height:104px;padding:0 28px;font-size:40px">
              <span style="width:40px;height:40px;display:block;color:var(--afh-color-text-soft);flex:none">${SEARCH_ICON}</span>
              <span id="phQ" data-essential style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>
            </div>
            <div class="button" id="phBtn" style="height:92px;margin-top:22px;font-size:36px">Rechercher</div>
          </div>
          <p class="abs eyebrow" id="phEyebrow" style="top:290px;font-size:31px">D’où vient ce nom</p>
          <div class="abs callout" id="phCallout" style="top:345px;width:512px;padding:26px 24px">
            <p class="site-title" data-role="site-ui" data-layer="lead" data-essential style="font-weight:600;font-size:38px;line-height:1.22">
              ${(layer.lead ?? []).map((l, i) => `<span class="abs-line" id="phL${i}" style="display:block">${l}</span>`).join("")}
            </p>
          </div>
          <div class="abs callout" id="phSkeleton" style="top:345px;width:512px;height:220px"></div>
          <p class="abs site-title" id="phFormsH" data-role="site-ui" style="font-weight:700;font-size:44px" data-essential>Les appellations</p>
          <div class="abs chips" id="phChips" data-layer="forms" style="width:512px">
            ${(layer.forms ?? [])
              .map(
                (f) =>
                  `<div class="chip" data-kind="${f.kind ?? "other"}"><span class="w" data-role="site-ui">${f.w}</span>${f.k ? `<span class="k">${f.k}</span>` : ""}</div>`
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>`
  );
  return $("ph");
}

// The search field's text: the placeholder, then the name typed letter by
// letter with its caret, from time a to b.
export function typeInto(el, t, name, a, b, caretOff) {
  el.dataset.layer = "typed";
  if (t < a) {
    el.innerHTML = `<span class="placeholder">Un peuple, une langue, un pays…</span>`;
    return;
  }
  const n = Math.min(
    name.length,
    Math.floor(P(t, a, b) * (name.length + 0.999))
  );
  const blink = t < b + 0.1 || Math.floor(t * 2.4) % 2 === 0 ? 1 : 0;
  const caret =
    t < caretOff
      ? `<span class="caret" style="height:46px;opacity:${blink}"></span>`
      : "";
  el.innerHTML = `<span style="font-weight:600">${name.slice(0, n)}</span>${caret}`;
}

export function guides() {
  const box = (kind, z) =>
    `<div data-guide="${kind}" style="left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px"></div>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    box("safe", SAFE_ZONE) + box("buttons", BUTTON_COLUMN)
  );
}

// ?shot=<id> draws that shot's time, ?t=<seconds> any time; the frame
// capture calls window.render(t) directly.
export async function start(clipId, render) {
  const clip = CLIPS.find((c) => c.id === clipId);
  window.render = render;
  window.DUR = clip.duration;
  await document.fonts.ready;
  const shot = clip.shots.find((s) => s.id === params.get("shot"));
  render(params.has("t") ? +params.get("t") : (shot?.t ?? clip.shots[0].t));
  if (params.get("guides") === "1") guides();
  window.identReady = true;
}
