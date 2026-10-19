// Shared by the two compositions: query parameters, the 1.9.0 double outline
// filters, the safe-zone guides and the ready signal the tests and the
// frame capture wait for.
import { SAFE_ZONE, BUTTON_COLUMN } from "./shots.mjs";

export const params = new URLSearchParams(location.search);

// ground: the theme's own ground (default), "image" for a preview over a
// picture, "none" for the alpha master laid over the episode's picture.
export function setUp() {
  const ground = params.get("ground") ?? "ground";
  document.body.dataset.ground = ground;
  document.documentElement.dataset.theme = params.get("theme") ?? "nuit";
  if (ground === "image")
    document.body.style.setProperty(
      "--picture",
      `url(${params.get("picture") ?? "../design-system/assets/Exemples/bulange-mengo-2018.jpg"})`
    );
  ringFilters();
  if (params.get("guides") === "1") guides();
}

// Same filter as social/video/series-page.mjs: the outlined letters grown by
// r and softened by 0.6 px in on-image-ring, the growth blurred by r in
// on-image-ring-soft, the text over both.
function ringFilters() {
  const rgba = (token) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(token)
      .trim()
      .match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  const flood = (token) => {
    const m = rgba(token);
    return `flood-color="rgb(${m[1]},${m[2]},${m[3]})" flood-opacity="${m[4]}"`;
  };
  const filters = [3, 5, 8]
    .map(
      (r) =>
        `<filter id="oi-ring-${r}" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">` +
        `<feMorphology in="SourceAlpha" operator="dilate" radius="${r}" result="d"/>` +
        `<feGaussianBlur in="d" stdDeviation="0.6" result="ds"/><feFlood ${flood("--on-image-ring")}/><feComposite in2="ds" operator="in" result="ring"/>` +
        `<feGaussianBlur in="d" stdDeviation="${r}" result="sh"/><feFlood ${flood("--on-image-ring-soft")}/><feComposite in2="sh" operator="in" result="soft"/>` +
        `<feMerge><feMergeNode in="soft"/><feMergeNode in="ring"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    )
    .join("");
  document.body.insertAdjacentHTML(
    "beforeend",
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${filters}</defs></svg>`
  );
}

function guides() {
  const box = (kind, z) =>
    `<div data-guide="${kind}" style="left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px"></div>`;
  document.body.insertAdjacentHTML(
    "beforeend",
    box("safe", SAFE_ZONE) + box("buttons", BUTTON_COLUMN)
  );
}

export async function ready() {
  await document.fonts.ready;
  window.identReady = true;
}

// Each shot is a set of visible elements and their places; everything else
// is hidden. Styles are written inline so a shot is one plain state.
export function show(states, shot) {
  const state = states[shot];
  if (!state) throw new Error(`Unknown shot ${shot}`);
  for (const el of document.querySelectorAll("[data-part]")) {
    const style = state[el.dataset.part];
    el.style.opacity = style ? 1 : 0;
    if (style) Object.assign(el.style, style);
  }
}
