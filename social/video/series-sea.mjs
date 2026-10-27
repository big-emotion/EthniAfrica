// A sea voyage on the series map never crosses land (operator, 27 October
// 2026, on the Portuguese route of « Zaïre »: « le chemin traverse la terre
// africaine »). A route or an arrow marked `sea` is checked as it is drawn:
// its curve on screen in every view the card shows it, sampled every 2 px,
// each sample brought back to the ground and tested against the land. Only
// its two ends may touch the coast, within COAST_KM, since a voyage leaves
// a port and reaches one. The land is Natural Earth's countries, the file
// the map cards already verify; the check runs where that file is read
// (series-render.mjs), and refuses the video with the segment to fix.
import { arrowCurve } from "./series-paths.mjs";

// How far from either end a sample may stand on land: a port on an estuary
// or a cape is a few dozen kilometres inside Natural Earth's 1:50m coast.
export const COAST_KM = 60;
const STEP_PX = 2;
// arrowCurve samples a curve through via points 40 times a segment.
const PER_SEGMENT = 40;
const rad = Math.PI / 180;

// The inverse of series-map.mjs's flatProject (orthographic, top-down).
function unproject(camera, x, y) {
  const nx = (x - 540) / camera.radius;
  const ny = (camera.centreY - y) / camera.radius;
  const rho = Math.hypot(nx, ny);
  if (rho > 1) return null;
  if (rho === 0) return [camera.lon, camera.lat];
  const c = Math.asin(rho);
  const p0 = camera.lat * rad;
  const lat = Math.asin(
    Math.cos(c) * Math.sin(p0) + (ny * Math.sin(c) * Math.cos(p0)) / rho
  );
  const lon =
    camera.lon * rad +
    Math.atan2(
      nx * Math.sin(c),
      rho * Math.cos(p0) * Math.cos(c) - ny * Math.sin(p0) * Math.sin(c)
    );
  return [lon / rad, lat / rad];
}

const km = ([a, b], [c, d]) => {
  const h =
    Math.sin(((d - b) * rad) / 2) ** 2 +
    Math.cos(b * rad) * Math.cos(d * rad) * Math.sin(((c - a) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

function insideRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** The land of a GeoJSON FeatureCollection, each polygon with its box. */
export function landPolygons(geojson) {
  return geojson.features.flatMap((f) =>
    (f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : f.geometry.type === "MultiPolygon"
        ? f.geometry.coordinates
        : []
    ).map((rings) => {
      const xs = rings[0].map((p) => p[0]);
      const ys = rings[0].map((p) => p[1]);
      return {
        rings,
        box: [
          Math.min(...xs),
          Math.max(...xs),
          Math.min(...ys),
          Math.max(...ys),
        ],
      };
    })
  );
}

const onLand = (land, p) =>
  land.some(
    ({ rings, box }) =>
      p[0] >= box[0] &&
      p[0] <= box[1] &&
      p[1] >= box[2] &&
      p[1] <= box[3] &&
      insideRing(p, rings[0]) &&
      !rings.slice(1).some((h) => insideRing(p, h))
  );

/**
 * The first place where the route `shape` ({from, via, to, bend}, as the
 * arrows and routes give it) stands on land in one of `cameras`, or null:
 * { segment (1 for from → first stop), from, to, at }.
 */
export function seaRouteOnLand(shape, cameras, land) {
  const stops = [shape.from, ...(shape.via ?? []), shape.to];
  for (const camera of cameras) {
    const pts = arrowCurve(shape, { centreY: 1010, ...camera });
    for (let i = 0; i + 1 < pts.length; i++) {
      const segment =
        stops.length === 2
          ? 1
          : Math.min(stops.length - 1, Math.floor(i / PER_SEGMENT) + 1);
      const [a, b] = [pts[i], pts[i + 1]];
      const n = Math.max(
        1,
        Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP_PX)
      );
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const at = unproject(
          { centreY: 1010, ...camera },
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t
        );
        if (!at) continue;
        if (km(at, shape.from) < COAST_KM || km(at, shape.to) < COAST_KM)
          continue;
        if (onLand(land, at))
          return {
            segment,
            from: stops[segment - 1],
            to: stops[segment],
            at: at.map((v) => Math.round(v * 10) / 10),
          };
      }
    }
  }
  return null;
}

export function checkSeaRoute(what, shape, cameras, land) {
  const hit = seaRouteOnLand(shape, cameras, land);
  if (hit)
    throw new Error(
      `${what}: Route maritime sur la terre : le segment ${hit.segment} (${hit.from.join(", ")} → ${hit.to.join(", ")}) traverse la terre près de ${hit.at.join(", ")} ; la faire passer en mer par des points de passage (via)`
    );
}
