"""An orthographic globe for the scene engine: camera, easing and relief sampling.

The globe is a sphere seen from far away. The camera looks at `center`; `span` is the
number of degrees of longitude the viewport width covers there, `heading` the compass
bearing that points up the screen, and `tilt` how far the view is pitched from straight
above. A tilt turns a height above the ground into a screen direction, which is how an
extruded zone reads as a solid without a 3D engine.

Everything is plain NumPy, deterministic, and independent of any other frame.
"""
import math

import numpy as np

MAX_TILT = 75.0
MAX_SPAN = 360.0
EASINGS = ("linear", "smooth", "cubic", "spring")
_SPRING_OMEGA = 7.0


def _rotation_z(angle):
    c, s = math.cos(angle), math.sin(angle)
    return np.array([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]])


def _rotation_y(angle):
    c, s = math.cos(angle), math.sin(angle)
    return np.array([[c, 0.0, s], [0.0, 1.0, 0.0], [-s, 0.0, c]])


def _unit_vector(lon, lat):
    lon, lat = np.radians(lon), np.radians(lat)
    return np.array([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)])


class GlobeCamera:
    def __init__(self, center, span, viewport, tilt=0.0, heading=0.0, offset=(0.0, 0.0)):
        lon, lat = center
        if not (0 < span <= MAX_SPAN):
            raise ValueError("Globe span must be between 0 and 360 degrees")
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError("Globe centre outside the valid coordinates")
        if not (0 <= tilt <= MAX_TILT):
            raise ValueError(f"Globe tilt must be between 0 and {MAX_TILT} degrees")
        x, y, width, height = viewport
        if width <= 0 or height <= 0:
            raise ValueError("Invalid viewport")
        self.center, self.span, self.tilt, self.heading = (lon, lat), span, tilt, heading
        self.viewport = viewport
        # Up to a half-turn the globe grows until the limb reaches the viewport edges; beyond
        # that it shrinks in proportion, so a zoom-out keeps a continuous scale.
        if span <= 180:
            self.radius = (width / 2) / math.sin(math.radians(span) / 2)
        else:
            self.radius = (width / 2) * 180 / span
        # World -> camera: put the centre on the +x axis, then read (east, north, toward the viewer).
        to_centre = _rotation_y(math.radians(lat)) @ _rotation_z(-math.radians(lon))
        axes = np.array([[0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0]])
        h = math.radians(heading)
        c, s = math.cos(h), math.sin(h)
        turn = np.array([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]])
        t = math.radians(tilt)
        c, s = math.cos(t), math.sin(t)
        pitch = np.array([[1.0, 0.0, 0.0], [0.0, c, s], [0.0, -s, c]])
        self._matrix = pitch @ turn @ axes @ to_centre
        cx, cy, _ = self._matrix @ _unit_vector(lon, lat)
        # Translate so that the centre sits at the middle of the viewport, plus the optional offset.
        self._origin = (x + width / 2 + offset[0] * width - self.radius * cx,
                        y + height / 2 + offset[1] * height + self.radius * cy)

    def _camera(self, lon, lat, height):
        return self._matrix @ (_unit_vector(lon, lat) * (1 + height / self.radius))

    def visible(self, point, height=0.0):
        return bool(self._camera(point[0], point[1], height)[2] > 0)

    def project(self, point, height=0.0):
        """Screen position of a longitude/latitude, lifted `height` pixels above the ground.

        A point behind the horizon is returned on the limb, so that a polygon crossing the
        horizon wraps along the edge of the globe instead of flying off the screen."""
        cx, cy, cz = self._camera(point[0], point[1], height)
        if cz <= 0:
            norm = math.hypot(cx, cy)
            cx, cy = (cx / norm, cy / norm) if norm > 1e-12 else (1.0, 0.0)
        return (self._origin[0] + self.radius * cx, self._origin[1] - self.radius * cy)

    def project_many(self, points, height=0.0):
        """Vectorised `project` for an (N, 2) array; returns (N, 2) pixels and an (N,) visibility mask."""
        pts = np.asarray(points, dtype=float)
        unit = np.stack([np.cos(np.radians(pts[:, 1])) * np.cos(np.radians(pts[:, 0])),
                         np.cos(np.radians(pts[:, 1])) * np.sin(np.radians(pts[:, 0])),
                         np.sin(np.radians(pts[:, 1]))]) * (1 + height / self.radius)
        cam = self._matrix @ unit
        visible = cam[2] > 0
        norm = np.hypot(cam[0], cam[1])
        norm = np.where(norm > 1e-12, norm, 1.0)
        cx = np.where(visible, cam[0], cam[0] / norm)
        cy = np.where(visible, cam[1], cam[1] / norm)
        return np.stack([self._origin[0] + self.radius * cx, self._origin[1] - self.radius * cy], axis=1), visible

    def unproject(self, pixel):
        """Longitude and latitude under a pixel of the sphere's disc."""
        cx = (pixel[0] - self._origin[0]) / self.radius
        cy = -(pixel[1] - self._origin[1]) / self.radius
        cz = math.sqrt(max(0.0, 1 - cx * cx - cy * cy))
        p = self._matrix.T @ np.array([cx, cy, cz])
        return math.degrees(math.atan2(p[1], p[0])), math.degrees(math.asin(max(-1.0, min(1.0, p[2]))))

    def grid(self, width, height):
        """Longitude and latitude for every pixel of a `width` x `height` raster covering the viewport.

        Returns (lon, lat, inside); `inside` is False where the pixel sees space, not the Earth."""
        x0, y0, vw, vh = self.viewport
        xs = x0 + (np.arange(width) + .5) * vw / width
        ys = y0 + (np.arange(height) + .5) * vh / height
        cx = (xs[None, :] - self._origin[0]) / self.radius
        cy = -(ys[:, None] - self._origin[1]) / self.radius
        cx, cy = np.broadcast_arrays(cx, cy)
        r2 = cx * cx + cy * cy
        inside = r2 <= 1.0
        cz = np.sqrt(np.clip(1.0 - r2, 0.0, None))
        cam = np.stack([cx, cy, cz])
        world = np.tensordot(self._matrix.T, cam, axes=(1, 0))
        lon = np.degrees(np.arctan2(world[1], world[0]))
        lat = np.degrees(np.arcsin(np.clip(world[2], -1.0, 1.0)))
        return lon, lat, inside

    def disc(self):
        """Centre and radius of the whole sphere on screen."""
        return self._origin, self.radius


def ease(name, u):
    """A named easing of the unit interval, with no overshoot."""
    if name not in EASINGS:
        raise ValueError(f"Unknown easing {name!r}")
    u = max(0.0, min(1.0, u))
    if name == "linear":
        return u
    if name == "smooth":
        return u * u * (3 - 2 * u)
    if name == "cubic":
        return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
    # A critically damped spring, rescaled so that it lands exactly on 1 at the end of the interval.
    w = _SPRING_OMEGA
    return (1 - (1 + w * u) * math.exp(-w * u)) / (1 - (1 + w) * math.exp(-w))


def _shortest(a, b):
    return ((b - a + 180.0) % 360.0) - 180.0


def _wrap(lon):
    return ((lon + 180.0) % 360.0) - 180.0


def _values(key):
    return {"center": (float(key["center"][0]), float(key["center"][1])), "span": float(key["span"]),
            "tilt": float(key.get("tilt", 0.0)), "heading": float(key.get("heading", 0.0)),
            "offset": tuple(key.get("offset", (0.0, 0.0)))}


def globe_camera_at(keys, instant):
    """Camera state at `instant`. The easing named on a keyframe shapes the move that leaves it."""
    if instant <= keys[0]["at"]:
        return _values(keys[0])
    for left, right in zip(keys, keys[1:]):
        if instant <= right["at"]:
            u = ease(left.get("ease", "smooth"), (instant - left["at"]) / (right["at"] - left["at"]))
            a, b = _values(left), _values(right)
            lon = _wrap(a["center"][0] + _shortest(a["center"][0], b["center"][0]) * u)
            lat = a["center"][1] + (b["center"][1] - a["center"][1]) * u
            return {"center": (lon, lat),
                    "span": math.exp(math.log(a["span"]) + (math.log(b["span"]) - math.log(a["span"])) * u),
                    "tilt": a["tilt"] + (b["tilt"] - a["tilt"]) * u,
                    "heading": a["heading"] + _shortest(a["heading"], b["heading"]) * u,
                    "offset": tuple(p + (q - p) * u for p, q in zip(a["offset"], b["offset"]))}
    return _values(keys[-1])


def sample_bilinear(raster, bounds, lon, lat):
    """Bilinear samples of an equirectangular raster at arrays of longitude and latitude.

    Pixel centres sit half a pixel inside `bounds`, as in the Natural Earth rasters. Returns the
    samples and a mask that is False where the point falls outside `bounds` (its sample is the
    nearest edge pixel, never garbage)."""
    west, south, east, north = bounds
    height, width = raster.shape[:2]
    inside = (lon >= west) & (lon <= east) & (lat >= south) & (lat <= north)
    x = np.clip((lon - west) / (east - west) * width - .5, 0, width - 1)
    y = np.clip((north - lat) / (north - south) * height - .5, 0, height - 1)
    x0 = np.minimum(np.floor(x).astype(np.int64), width - 2) if width > 1 else np.zeros_like(x, dtype=np.int64)
    y0 = np.minimum(np.floor(y).astype(np.int64), height - 2) if height > 1 else np.zeros_like(y, dtype=np.int64)
    fx = (x - x0)[..., None].astype(np.float32)
    fy = (y - y0)[..., None].astype(np.float32)
    flat = raster.reshape(height * width, -1)
    x1, y1 = np.minimum(x0 + 1, width - 1), np.minimum(y0 + 1, height - 1)

    def corner(yy, xx):
        return flat[yy * width + xx].astype(np.float32)

    top = corner(y0, x0) * (1 - fx) + corner(y0, x1) * fx
    bottom = corner(y1, x0) * (1 - fx) + corner(y1, x1) * fx
    return top * (1 - fy) + bottom * fy, inside
