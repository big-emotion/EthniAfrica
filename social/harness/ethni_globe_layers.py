"""The picture layers of the relief globe: base, hydrography, borders, atmosphere and volume.

Each function draws from geography and a camera only, never from a previous frame, so any
frame renders alone. Everything expensive that depends on the camera alone is meant to be
cached by the caller: a still camera then costs one base render per scene.
"""
import math

import numpy as np
from PIL import Image, ImageColor, ImageDraw, ImageFilter

from ethni_globe import sample_bilinear
from ethni_map import mix, partial_path

# The relief is soft by nature, so it is resampled at half the frame and enlarged: a quarter of
# the pixels to compute, and no visible loss under the vector layers drawn on top at full size.
BASE_SCALE = .5
HALO = .07          # the atmosphere extends this fraction of the radius beyond the limb
MAX_WALL_POINTS = 320


def rings_of(geometry):
    """Every ring of a Polygon or MultiPolygon, holes included, as lists of (lon, lat)."""
    shapes = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return [ring for rings in shapes for ring in rings]


def outer_rings(geometry):
    """The outer ring of every polygon: the shape to fill, without its holes."""
    shapes = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return [rings[0] for rings in shapes]


def lines_of(geometry):
    kind, coords = geometry["type"], geometry["coordinates"]
    if kind == "LineString":
        return [coords]
    if kind == "MultiLineString":
        return list(coords)
    return rings_of(geometry)


def visible_runs(camera, coords, height=0.0):
    """Split a path into the stretches that face the viewer, as lists of screen points."""
    pixels, seen = camera.project_many(np.asarray(coords, dtype=float)[:, :2], height)
    runs, run = [], []
    for point, ok in zip(pixels.tolist(), seen.tolist()):
        if ok:
            run.append(tuple(point))
        else:
            if len(run) > 1: runs.append(run)
            run = []
    if len(run) > 1: runs.append(run)
    return runs


def relief_base(raster, bounds, camera, size, ground):
    """The Earth as seen from the camera: the relief resampled onto the sphere, ground colour around it."""
    width, height = size
    small = (max(1, round(width*BASE_SCALE)), max(1, round(height*BASE_SCALE)))
    lon, lat, disc = camera.grid(*small)
    samples, covered = sample_bilinear(raster, bounds, lon, lat)
    backdrop = np.array(ImageColor.getrgb(ground), np.float32)
    # Where the pack does not reach, the sphere is shown dimmed instead of smeared from the pack's edge.
    picture = np.where(covered[..., None], samples, backdrop*2.0)
    picture = np.where(disc[..., None], picture, backdrop)
    image = Image.fromarray(np.clip(picture, 0, 255).astype(np.uint8), "RGB")
    return image.resize(size, Image.Resampling.BILINEAR)


def atmosphere(image, camera, ground, glow):
    """Limb darkening on the globe and a thin halo just outside it."""
    width, height = image.size
    (ox, oy), radius = camera.disc()
    ys, xs = np.mgrid[0:height, 0:width].astype(np.float32)
    r = np.hypot(xs + .5 - ox, ys + .5 - oy) / radius
    picture = np.asarray(image, np.float32)
    dark = 1 - .55*np.clip((r-.5)/.5, 0, 1)**2
    picture = np.where((r <= 1)[..., None], picture*dark[..., None], picture)
    halo = np.clip(1 - (r-1)/HALO, 0, 1)**2.2 * (r > 1) * .6
    tint = np.array(ImageColor.getrgb(glow), np.float32)
    picture = picture*(1 - halo[..., None]) + tint*halo[..., None]
    return Image.fromarray(np.clip(picture, 0, 255).astype(np.uint8), "RGB")


def draw_lines(canvas, camera, layer, colour, width, alpha=255):
    """Rivers: crisp lines over the relief. `layer` is a GeoJSON FeatureCollection of lines."""
    mask = Image.new("L", canvas.size)
    draw = ImageDraw.Draw(mask)
    for feature in layer["features"]:
        for coords in lines_of(feature["geometry"]):
            for run in visible_runs(camera, coords):
                draw.line(run, fill=alpha, width=width, joint="curve")
    canvas.paste(Image.new("RGB", canvas.size, colour), (0, 0), mask)


def draw_lakes(canvas, camera, layer, fill, edge):
    mask = Image.new("L", canvas.size)
    draw = ImageDraw.Draw(mask)
    outline = Image.new("L", canvas.size)
    outline_draw = ImageDraw.Draw(outline)
    for feature in layer["features"]:
        if feature["geometry"]["type"] not in ("Polygon", "MultiPolygon"):
            continue
        for ring in rings_of(feature["geometry"]):
            pixels, seen = camera.project_many(np.asarray(ring, dtype=float)[:, :2])
            if seen.all() and len(ring) > 2:
                draw.polygon([tuple(p) for p in pixels.tolist()], fill=255)
                outline_draw.line([tuple(p) for p in pixels.tolist()], fill=255, width=1)
    canvas.paste(Image.new("RGB", canvas.size, fill), (0, 0), mask)
    canvas.paste(Image.new("RGB", canvas.size, edge), (0, 0), outline)


def draw_borders(canvas, camera, countries, style, width, palette, dashed_line):
    """Country borders in one of the styles a physical map can use. `none` draws nothing."""
    if style == "none":
        return
    mask = Image.new("L", canvas.size)
    draw = ImageDraw.Draw(mask)
    grow = {"glow": 8, "soft": 4}.get(style, 0)
    for feature in countries["features"]:
        for ring in rings_of(feature["geometry"]):
            for run in visible_runs(camera, ring):
                if style == "dashed":
                    dashed_line(draw, run, 255, width)
                else:
                    draw.line(run, fill=255, width=width+grow, joint="curve")
    if style == "soft":
        blurred = mask.filter(ImageFilter.GaussianBlur(3)).point(lambda v: round(v*.6))
        canvas.paste(Image.new("RGB", canvas.size, palette["ground"]), (0, 0), blurred)
        return
    if style == "glow":
        halo = mask.filter(ImageFilter.GaussianBlur(7)).point(lambda v: min(255, round(v*1.6)))
        canvas.paste(Image.new("RGB", canvas.size, palette["gold"]), (0, 0), halo)
        core = Image.new("L", canvas.size)
        core_draw = ImageDraw.Draw(core)
        for feature in countries["features"]:
            for ring in rings_of(feature["geometry"]):
                for run in visible_runs(camera, ring):
                    core_draw.line(run, fill=255, width=width, joint="curve")
        canvas.paste(Image.new("RGB", canvas.size, palette["white"]), (0, 0), core)
        return
    mask = mask.point(lambda v: round(v*.85))
    canvas.paste(Image.new("RGB", canvas.size, palette["ground"]), (0, 0), mask)


def solid_country(canvas, camera, rings, colour, ground, progress, rise, extrude, stroke=3):
    """A country as a drawn outline that, once complete, fills and lifts into a solid.

    `progress` is the share of the outline already drawn; `rise` how far up the lift has gone.
    The footprint stays on the ground as a soft shadow while the top face is raised."""
    lift = extrude*rise
    rgb = ImageColor.getrgb(colour)
    overlay = Image.new("RGBA", canvas.size)
    draw = ImageDraw.Draw(overlay)
    outlines = [[tuple(p) for p in camera.project_many(np.asarray(r, dtype=float)[:, :2])[0].tolist()] for r in rings]
    if progress > 0:
        for outline in outlines:
            draw.line(partial_path(outline, progress), fill=rgb+(255,), width=stroke, joint="curve")
    if rise > 0:
        if lift > 0:
            shadow = Image.new("L", canvas.size)
            for outline in outlines:
                ImageDraw.Draw(shadow).polygon(outline, fill=110)
            canvas.paste(Image.new("RGB", canvas.size, ground), (0, 0), shadow.filter(ImageFilter.GaussianBlur(9)))
            walls = mix(colour, ground, .5)
            edges = []
            for ring in rings:
                stride = max(1, len(ring)//MAX_WALL_POINTS)
                pts = np.asarray(ring[::stride] + [ring[0]], dtype=float)[:, :2]
                low, seen = camera.project_many(pts)
                high, _ = camera.project_many(pts, lift)
                for i in range(len(pts)-1):
                    if seen[i] and seen[i+1]:
                        edges.append((float(low[i][1]+low[i+1][1]), [tuple(low[i]), tuple(low[i+1]), tuple(high[i+1]), tuple(high[i])]))
            for _, quad in sorted(edges, key=lambda e: e[0]):
                draw.polygon(quad, fill=walls+(215,))
        tops = [[tuple(p) for p in camera.project_many(np.asarray(r, dtype=float)[:, :2], lift)[0].tolist()] for r in rings]
        for top in tops:
            draw.polygon(top, fill=rgb+(165,))
        for top in tops:
            draw.line(partial_path(top, progress), fill=rgb+(255,), width=stroke, joint="curve")
    canvas.paste(overlay, (0, 0), overlay)


def raised_field(canvas, camera, ring, colour, extrude, layers=6, feather=18, strength=125):
    """A feathered field, lifted as a stack of soft layers. It gains volume, never an outline."""
    mask = Image.new("L", canvas.size)
    pts = np.asarray(ring, dtype=float)[:, :2]
    step = max(1, layers-1)
    for k in range(layers):
        pixels = camera.project_many(pts, extrude*k/step)[0]
        ImageDraw.Draw(mask).polygon([tuple(p) for p in pixels.tolist()], fill=round(strength/ (1 + k*.35)))
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    canvas.paste(Image.new("RGB", canvas.size, colour), (0, 0), mask)
