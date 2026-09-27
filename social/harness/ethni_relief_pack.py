"""Cut a region pack out of the world relief, for the globe map scene.

The Natural Earth relief is a 700 MB world raster that stays in the private workshop. A
production takes only the region it shows: a JPEG of that window, its exact bounds, and the
river, lake and border layers cropped to it. Nothing here is drawn or judged: the scene
engine reads the pack through the plan's `relief` and `vector` assets.

    python ethni_relief_pack.py --source HYP_HR_SR_OB_DR.tif --bounds -30 -40 60 45 \\
        --out assets/relief --width 4000 --layer rivers=ne_10m_rivers_lake_centerlines.geojson
"""
import argparse
import json
import math
import pathlib

from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # the world raster is a trusted local file, far above Pillow's default guard
EPSILON = 1e-6


def pixel_window(bounds, size):
    """Pixel box covering `bounds` in a raster spanning the whole world, and the bounds that box really has.

    The box rounds outwards, so the request is never clipped; the returned bounds are what the pack must
    declare, since the scene engine trusts them to place every pixel."""
    west, south, east, north = bounds
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise ValueError("bounds must be west, south, east, north inside the world")
    width, height = size
    step_x, step_y = 360 / width, 180 / height
    left = math.floor((west + 180) / step_x + EPSILON)
    right = math.ceil((east + 180) / step_x - EPSILON)
    top = math.floor((90 - north) / step_y + EPSILON)
    bottom = math.ceil((90 - south) / step_y - EPSILON)
    actual = (round(-180 + left * step_x, 6), round(90 - bottom * step_y, 6),
              round(-180 + right * step_x, 6), round(90 - top * step_y, 6))
    return (left, top, right, bottom), actual


def _extent(geometry):
    stack, xs, ys = [geometry["coordinates"]], [], []
    while stack:
        item = stack.pop()
        if item and isinstance(item[0], (int, float)):
            xs.append(item[0]); ys.append(item[1])
        else:
            stack.extend(item)
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def crop_layer(layer, bounds):
    """The features of a GeoJSON layer whose extent reaches `bounds`."""
    west, south, east, north = bounds
    kept = []
    for feature in layer["features"]:
        extent = _extent(feature["geometry"])
        if extent is None:
            continue  # the source layers carry a few empty geometries
        x0, y0, x1, y1 = extent
        if x1 >= west and x0 <= east and y1 >= south and y0 <= north:
            kept.append(feature)
    if not kept:
        raise ValueError("No feature of this layer reaches the window")
    return {"type": "FeatureCollection", "features": kept}


def build_pack(source, bounds, out_dir, width, layers=None, quality=88):
    out_dir = pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as world:
        box, actual = pixel_window(bounds, world.size)
        region = world.convert("RGB").crop(box)
    region = region.resize((width, max(1, round(width * region.height / region.width))), Image.Resampling.LANCZOS)
    relief = out_dir / "relief.jpg"
    region.save(relief, quality=quality, optimize=True)
    written = {}
    for name, path in (layers or {}).items():
        cropped = crop_layer(json.loads(pathlib.Path(path).read_text()), actual)
        target = out_dir / f"{name}.geojson"
        target.write_text(json.dumps(cropped, separators=(",", ":")))
        written[name] = str(target)
    return {"relief": str(relief), "bounds": list(actual), "layers": written}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True)
    parser.add_argument("--bounds", required=True, nargs=4, type=float, metavar=("W", "S", "E", "N"))
    parser.add_argument("--out", required=True)
    parser.add_argument("--width", type=int, default=4000)
    parser.add_argument("--layer", action="append", default=[], metavar="NAME=PATH")
    args = parser.parse_args()
    pairs = dict(item.split("=", 1) for item in args.layer)
    print(json.dumps(build_pack(args.source, tuple(args.bounds), args.out, args.width, pairs), indent=2))


if __name__ == "__main__":
    main()
