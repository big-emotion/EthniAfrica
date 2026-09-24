"""Versioned, fail-closed input contract for the local scene renderer."""
import hashlib
import math
from pathlib import Path

from PIL import Image

from ethni_map import Camera

PROFILES = {
    "name-origin": ("question", "usages", "evidence", "limits", "answer", "closing"),
    "history-geography": ("question", "context", "evidence", "evolution", "limits", "closing"),
    "thematic-analysis": ("question", "definitions", "case", "evidence", "limits", "position", "closing"),
    "free": (),
}
STATUS = {"documented": "Documenté", "estimate": "Estimation", "hypothesis": "Hypothèse",
          "illustration": "Illustration", "editorial": "Position éditoriale"}
COLOURS = ("gold", "white", "night-ink-2", "teal", "perv")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def keys(value, allowed, where):
    require(isinstance(value, dict), f"{where}: expected an object")
    require(not set(value) - set(allowed.split()), f"{where}: unknown fields {set(value) - set(allowed.split())}")


def number(value, where, low=None, high=None):
    require(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value),
            f"{where}: expected a finite number")
    require((low is None or value >= low) and (high is None or value <= high), f"{where}: out of range")
    return value


def text(value, where):
    require(isinstance(value, str) and bool(value.strip()), f"{where}: non-empty text required")


def asset_path(root, asset):
    path = Path(asset["path"])
    resolved = (root / path).resolve()
    require(not path.is_absolute() and resolved.is_relative_to(root.resolve()),
            "asset path must be relative and remain inside the storyboard directory")
    require(resolved.is_file(), f"Missing asset: {path}")
    return resolved


def evidence(value, sources, where):
    keys(value, "sources status period", where)
    require(value.get("status") in STATUS, f"{where}: unknown evidence status")
    text(value.get("period"), f"{where}.period")
    refs = value.get("sources")
    require(isinstance(refs, list) and refs and all(isinstance(s, str) and s in sources for s in refs),
            f"{where}: known sources required")


def point(value, where):
    require(isinstance(value, (list, tuple)) and len(value) == 2, f"{where}: longitude/latitude required")
    number(value[0], where, -180, 180)
    number(value[1], where, -85, 85)


def validate_geometry(geo):
    require(geo.get("type") == "FeatureCollection" and geo.get("features"), "Expected a nonempty GeoJSON FeatureCollection")
    for feature in geo["features"]:
        shape = feature.get("geometry", {})
        require(shape.get("type") in ("Polygon", "MultiPolygon"), "Basemap requires Polygon or MultiPolygon")
        text(feature.get("properties", {}).get("ADM0_A3"), "Basemap country code")
        polygons = [shape["coordinates"]] if shape["type"] == "Polygon" else shape["coordinates"]
        for rings in polygons:
            require(bool(rings), "Polygon needs rings")
            for ring in rings:
                require(len(ring) >= 4 and ring[0] == ring[-1], "Polygon ring must be closed")
                for p in ring:
                    point(p, "Basemap coordinate")


def validate_map(value, duration, assets, sources):
    keys(value, "asset layer borders border_style highlights camera features graticule", "map")
    require(value.get("asset") in assets and assets[value["asset"]]["kind"] == "geojson", "map: geographic asset required")
    require(value.get("layer") in ("national", "political", "people", "physical"), "map: unknown layer")
    require(type(value.get("borders")) is bool, "map.borders must be explicit")
    require(value.get("border_style", "solid") in ("solid", "dashed"), "Unknown border_style")
    if "graticule" in value:
        require(type(value["graticule"]) is bool, "map.graticule must be boolean")
    require(isinstance(value.get("highlights", []), list), "map.highlights must be a list")
    require(not value.get("highlights") or value["layer"] == "national", "Country highlights require the national layer")
    camera = value.get("camera")
    require(isinstance(camera, list) and camera and camera[0].get("at") == 0, "camera must start at zero")
    previous = -1
    for frame in camera:
        keys(frame, "at bounds", "camera keyframe")
        at = number(frame.get("at"), "camera.at", 0, duration)
        require(at > previous, "camera times must be strictly increasing")
        previous = at
        bounds = frame.get("bounds")
        require(isinstance(bounds, list) and len(bounds) == 4, "camera.bounds needs four coordinates")
        for v in bounds: number(v, "camera.bounds")
        Camera(tuple(bounds), (0, 0, 800, 800))
    features = value.get("features", [])
    require(isinstance(features, list) and len(features) <= 12, "map supports at most twelve authored features")
    for feature in features:
        keys(feature, "kind point points label at until colour evidence meaning offset flag_stripes geometry_note", "map feature")
        kind = feature.get("kind")
        require(kind in ("point", "presence", "presence-zone", "territory", "route"), "Unknown map feature kind")
        text(feature.get("label"), "feature.label")
        evidence(feature.get("evidence"), sources, "feature.evidence")
        start = number(feature.get("at"), "feature.at", 0, duration)
        end = number(feature.get("until"), "feature.until", 0, duration)
        require(end > start, "feature.until must follow at")
        require(feature.get("colour", "gold") in COLOURS, "Unknown feature colour token")
        if "offset" in feature:
            require(isinstance(feature["offset"], list) and len(feature["offset"]) == 2, "offset requires x/y")
            for v in feature["offset"]: number(v, "offset", -400, 400)
        if kind in ("point", "presence"):
            point(feature.get("point"), "feature.point")
            require("points" not in feature and "meaning" not in feature, "Point feature has route fields")
        else:
            points = feature.get("points")
            require(isinstance(points, list) and len(points) >= 2, "feature.points needs a path")
            for p in points: point(p, "feature.points")
            if kind in ("territory", "presence-zone"):
                require(len(points) >= 4 and points[0] == points[-1], "territory needs a closed ring")
                require(value["layer"] in ("political", "people"), "territory requires political or people layer")
                if kind == "presence-zone":
                    require(value["layer"] == "people", "presence-zone requires the people layer")
                    require(feature["evidence"]["status"] in ("estimate", "hypothesis"), "presence-zone must be an estimate or hypothesis")
                    text(feature.get("geometry_note"), "presence-zone.geometry_note")
            else:
                require(feature.get("meaning") in ("migration", "language-diffusion", "name-circulation"),
                        "route.meaning must distinguish migration, language diffusion or name circulation")
        if "flag_stripes" in feature:
            import re
            require(kind == "point" and value["layer"] == "national", "Flags require a point in the national layer")
            require(isinstance(feature["flag_stripes"], list) and len(feature["flag_stripes"]) == 3 and
                    all(isinstance(c, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", c) for c in feature["flag_stripes"]),
                    "flag_stripes requires three hex colours")


def validate_timeline(value, duration, sources):
    keys(value, "scale events context", "timeline")
    require(value.get("scale") == "ordinal", "timeline.scale must be ordinal; spacing is explicitly not proportional")
    events, context = value.get("events"), value.get("context", [])
    require(isinstance(events, list) and 2 <= len(events) <= 3, "timeline needs two or three primary events")
    require(isinstance(context, list) and len(context) <= 2, "timeline supports at most two context events")
    years = []
    for lane in (events, context):
        for event in lane:
            keys(event, "year label detail at evidence" if lane is context else "year label at evidence", "timeline event")
            require(type(event.get("year")) is int and event["year"] != 0, "event.year must be a nonzero integer")
            text(event.get("label"), "event.label")
            if lane is context: text(event.get("detail"), "event.detail")
            number(event.get("at"), "event.at", 0, duration-.04)
            evidence(event.get("evidence"), sources, "event.evidence")
        if lane is events:
            years = [event["year"] for event in events]
            require(all(a < b for a, b in zip(years, years[1:])), "Primary events must be in chronological order")
    require(all(event["year"] in years for event in context), "Context must share the same year as a primary event")
    require(len({event["year"] for event in context}) == len(context), "Group same-year context into one event")


def validate_plan(plan, root, duration):
    """Validate shape, local assets, provenance and complete audio coverage."""
    import json
    keys(plan, "version profile coverage title source output_dir sources assets scenes", "plan")
    require(type(plan.get("version")) is int and plan["version"] == 1, "Unsupported scene plan version")
    require(plan.get("profile") in PROFILES, "Unknown editorial profile")
    require(plan.get("coverage", "excerpt") in ("excerpt", "complete"), "Unknown coverage")
    text(plan.get("title"), "plan.title")
    number(duration, "audio duration", .04)
    sources = plan.get("sources")
    require(isinstance(sources, dict) and sources, "A source register is required")
    for key, source in sources.items():
        keys(source, "citation url tier label", f"source {key}")
        for field in ("citation", "url", "tier"): text(source.get(field), f"source.{field}")
        if "label" in source: text(source["label"], "source.label")
    assets = plan.get("assets")
    require(isinstance(assets, dict), "assets must be an object")
    for key, asset in assets.items():
        keys(asset, "path kind sha256 credit license source", f"asset {key}")
        require(asset.get("kind") in ("geojson", "image"), "Unknown asset kind")
        for field in ("path", "credit", "license", "sha256"): text(asset.get(field), f"asset.{field}")
        require(asset.get("source") in sources, "asset source is missing")
        path = asset_path(root, asset)
        require(hashlib.sha256(path.read_bytes()).hexdigest() == asset["sha256"], f"Asset hash changed: {key}")
        if asset["kind"] == "geojson":
            validate_geometry(json.loads(path.read_text()))
        else:
            with Image.open(path) as image: image.verify()
    scenes = plan.get("scenes")
    require(isinstance(scenes, list) and scenes, "scenes must be a nonempty list")
    ids, previous = set(), 0.0
    for index, scene in enumerate(scenes):
        where = f"scene {index+1}"
        keys(scene, "id type start end title purpose evidence beat map image text comparison timeline document transition", where)
        text(scene.get("id"), f"{where}.id")
        require(scene["id"] not in ids, "Scene ids must be unique")
        ids.add(scene["id"])
        start = number(scene.get("start"), f"{where}.start", 0)
        end = number(scene.get("end"), f"{where}.end", 0)
        require(abs(start-previous) < 1e-9, "Scenes must be contiguous without overlap")
        require(end-start >= 1, "A scene needs at least one second of reading time")
        previous = end
        for field in ("title", "purpose"): text(scene.get(field), f"{where}.{field}")
        evidence(scene.get("evidence"), sources, f"{where}.evidence")
        kind = scene.get("type")
        require(kind in ("map", "image", "text", "comparison", "timeline", "document"), "Unknown scene type")
        require(all(field == kind or field not in scene for field in ("map", "image", "text", "comparison", "timeline", "document")),
                f"{where}: content for another scene type")
        if kind == "map":
            validate_map(scene.get("map"), end-start, assets, sources)
            map_data = json.loads(asset_path(root, assets[scene["map"]["asset"]]).read_text())
            codes = {f["properties"]["ADM0_A3"] for f in map_data["features"]}
            require(all(c in codes for c in scene["map"].get("highlights", [])), "Unknown highlighted country")
        elif kind == "image":
            value = scene.get("image")
            keys(value, "asset fit motion", "image")
            require(value.get("asset") in assets and assets[value["asset"]]["kind"] == "image", "image asset required")
            require(value.get("fit") in ("contain", "cover"), "image.fit must be contain or cover")
            if "motion" in value:
                keys(value["motion"], "from to", "image.motion")
                for field in ("from", "to"):
                    k = value["motion"].get(field)
                    require(isinstance(k, list) and len(k) == 3, "motion needs [zoom, focusX, focusY]")
                    number(k[0], "zoom", 1, 1.25)
                    number(k[1], "focusX", 0, 1)
                    number(k[2], "focusY", 0, 1)
                require(value["fit"] == "cover" or all(k[0] == 1 for k in value["motion"].values()),
                        "contain preserves the full document; use zoom 1 or explicitly choose cover")
        elif kind == "timeline":
            validate_timeline(scene.get("timeline"), end-start, sources)
        elif kind == "document":
            value = scene.get("document")
            keys(value, "asset label body", "document")
            require(value.get("asset") in assets and assets[value["asset"]]["kind"] == "image", "document image asset required")
            for field in ("label", "body"): text(value.get(field), f"document.{field}")
        elif kind == "text":
            text(scene.get("text"), "scene.text")
        else:
            items = scene.get("comparison")
            require(isinstance(items, list) and 2 <= len(items) <= 3, "comparison needs two or three items")
            for item in items:
                keys(item, "label body at", "comparison item")
                text(item.get("label"), "comparison.label")
                text(item.get("body"), "comparison.body")
                number(item.get("at", 0), "comparison.at", 0, end-start-.04)
        transition = scene.get("transition", {"type": "cut", "duration": 0})
        keys(transition, "type duration", "transition")
        require(transition.get("type") in ("cut", "dissolve", "fade"), "Unknown transition")
        length = number(transition.get("duration"), "transition.duration", 0, .8)
        require((transition["type"] == "cut") == (length == 0), "cut transition must have zero duration")
        require(length < (end-start)/2 and (index != 0 or length == 0), "Invalid transition duration or first scene")
    require(abs(previous-duration) < .001, "Scenes must cover the entire selected audio")
    if plan.get("coverage") == "complete":
        required = PROFILES[plan["profile"]]
        beats = [s.get("beat") for s in scenes]
        require(all(beat in beats for beat in required), f"Complete {plan['profile']} requires beats {required}")
    return plan


def scene_at(scenes, instant):
    return next((s for s in scenes if s["start"] <= instant < s["end"]), scenes[-1])


def transition_at(scenes, instant):
    for index, scene in enumerate(scenes[1:], 1):
        length = scene.get("transition", {}).get("duration", 0)
        if length and scene["start"] <= instant < scene["start"] + length - 1e-9:
            return index-1, index, round((instant-scene["start"])/length, 9)
    return None
