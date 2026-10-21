// A general flash detector for the series video (Cartes 1.13.0, handoff.md
// « Renderer integration of 1.13.0 », check 5), after WCAG 2.3.1 « Three
// flashes or below threshold »: a flash is a pair of opposing changes in
// relative luminance of 10 % or more of the maximum, the darker image under
// 0.80, over a quarter of the frame at once; never three in a second.
//
// Each pixel follows its luminance from its last turning point, so a change
// spread over several frames (the warm flash rises in 4 frames) still counts
// once, when it has gone 0.10 one way. A frame is a transition when a
// quarter of the frame completes a change the same way on it; consecutive
// transitions the same way are one. The frame is sampled every 6 px, which
// the flash's radial light, smooth over hundreds of pixels, does not notice.
const STEP = 6;
const CHANGE = 0.1;
const DARKER = 0.8;
const AREA = 0.25;
const FPS = 30;

const linear = (() => {
  const t = new Float64Array(256);
  for (let v = 0; v < 256; v++) {
    const c = v / 255;
    t[v] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
  return t;
})();

function luminance(rgb, width, height) {
  const out = [];
  for (let y = 0; y < height; y += STEP)
    for (let x = 0; x < width; x += STEP) {
      const i = 3 * (y * width + x);
      out.push(
        0.2126 * linear[rgb[i]] +
          0.7152 * linear[rgb[i + 1]] +
          0.0722 * linear[rgb[i + 2]]
      );
    }
  return out;
}

// `frames` are consecutive RGB buffers (3 bytes a pixel). Returns the
// transitions (frame index, +1 or -1), the flashes counted and the most
// flashes in any second.
export function flashesPerSecond(frames, width, height) {
  const lums = frames.map((f) => luminance(f, width, height));
  const n = lums[0].length;
  const anchor = Float64Array.from(lums[0]);
  const direction = new Int8Array(n);
  const transitions = [];
  for (let k = 1; k < lums.length; k++) {
    let up = 0;
    let down = 0;
    for (let p = 0; p < n; p++) {
      const l = lums[k][p];
      const change = l - anchor[p];
      const darker = Math.min(l, anchor[p]);
      if (Math.abs(change) >= CHANGE && darker < DARKER) {
        if (change > 0) up++;
        else down++;
        direction[p] = Math.sign(change);
        anchor[p] = l;
      } else if (Math.sign(l - lums[k - 1][p]) === -direction[p]) {
        // Turning back before the threshold: the turning point moves.
        anchor[p] =
          direction[p] > 0
            ? Math.max(anchor[p], lums[k - 1][p])
            : Math.min(anchor[p], lums[k - 1][p]);
      }
    }
    const sign = up / n >= AREA ? 1 : down / n >= AREA ? -1 : 0;
    if (sign && transitions.at(-1)?.sign !== sign)
      transitions.push({ frame: k, sign });
  }
  // A flash is a pair of opposing transitions.
  const flashes = Math.floor(transitions.length / 2);
  let most = 0;
  for (const t of transitions) {
    const inSecond = transitions.filter(
      (u) => u.frame >= t.frame && u.frame < t.frame + FPS
    ).length;
    most = Math.max(most, Math.floor(inSecond / 2));
  }
  return { transitions, flashes, most };
}
