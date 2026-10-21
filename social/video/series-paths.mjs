// The paths the animated map draws along (Cartes 1.11.0; shared since 1.14.0
// so the figures on the map follow the arrows' own curves): an arrow's curve
// on screen, its cumulative length, a point at a length, the polyline
// between two lengths and the notched head.
import { flatProject } from "./series-map.mjs";

// An arrow's path on screen: a quadratic curve bent by `bend` of its length
// to one side, or a Catmull-Rom curve through its via points.
export function arrowCurve(a, camera) {
  const pts = [a.from, ...(a.via ?? []), a.to].map((p) =>
    flatProject(camera, ...p)
  );
  const out = [];
  if (pts.length === 2) {
    const [A, B] = pts;
    const [dx, dy] = [B[0] - A[0], B[1] - A[1]];
    const C = [
      (A[0] + B[0]) / 2 - dy * a.bend,
      (A[1] + B[1]) / 2 + dx * a.bend,
    ];
    for (let i = 0; i <= 80; i++) {
      const s = i / 80;
      const u = 1 - s;
      out.push([
        u * u * A[0] + 2 * u * s * C[0] + s * s * B[0],
        u * u * A[1] + 2 * u * s * C[1] + s * s * B[1],
      ]);
    }
    return out;
  }
  for (let k = 0; k < pts.length - 1; k++) {
    const [p0, p1, p2, p3] = [
      pts[Math.max(0, k - 1)],
      pts[k],
      pts[k + 1],
      pts[Math.min(pts.length - 1, k + 2)],
    ];
    for (let j = 0; j < 40; j++) {
      const u = j / 40;
      const [u2, u3] = [u * u, u * u * u];
      out.push(
        [0, 1].map(
          (c) =>
            0.5 *
            (2 * p1[c] +
              (-p0[c] + p2[c]) * u +
              (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u2 +
              (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u3)
        )
      );
    }
  }
  out.push(pts.at(-1));
  return out;
}
export const cumulative = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++)
    c.push(
      c[i - 1] +
        Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    );
  return c;
};
export function pointAt(pts, cum, length) {
  const L = Math.min(Math.max(length, 0), cum.at(-1));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < L) i++;
  const s = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  const [a, b] = [pts[i - 1], pts[i]];
  return {
    x: a[0] + (b[0] - a[0]) * s,
    y: a[1] + (b[1] - a[1]) * s,
    angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
  };
}
const xy = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
export function polyline(pts, cum, a, b) {
  const p = pointAt(pts, cum, a);
  const q = pointAt(pts, cum, b);
  const inner = pts.filter((_, i) => cum[i] > a && cum[i] < b);
  return "M" + [[p.x, p.y], ...inner, [q.x, q.y]].map(xy).join("L");
}
// The notched head, 3.6 w long and 3.2 w wide, its point on the tip.
export function arrowHead(p, w) {
  const [L, W] = [3.6 * w, 3.2 * w];
  const [c, s] = [Math.cos(p.angle), Math.sin(p.angle)];
  const P = (f, g) => [p.x + c * f - s * g, p.y + s * f + c * g];
  return {
    x: p.x,
    y: p.y,
    angle: p.angle,
    d:
      "M" +
      [P(0, 0), P(-L, W / 2), P(-L * 0.72, 0), P(-L, -W / 2)]
        .map(xy)
        .join("L") +
      "Z",
  };
}
