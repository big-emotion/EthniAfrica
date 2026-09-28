"""Versioned, fail-closed input contract for the local scene renderer."""
import hashlib
import json
import math
from pathlib import Path

from PIL import Image

from ethni_globe import EASINGS, GlobeCamera
from ethni_map import Camera

PROFILES = {
    "name-origin": ("question", "usages", "evidence", "limits", "answer", "closing"),
    "history-geography": ("question", "context", "evidence", "evolution", "limits", "closing"),
    "thematic-analysis": ("question", "definitions", "case", "evidence", "limits", "position", "closing"),
    "free": (),
}
STATUS = {"documented": "Documenté", "estimate": "Estimation", "hypothesis": "Hypothèse",
          "illustration": "Illustration", "editorial": "Position éditoriale"}
COLOURS = ("gold", "white", "night-ink-2", "teal", "perv", "sea")
BORDER_STYLES = ("solid", "dashed", "soft", "glow", "none")
LABEL_STYLES = ("sea", "place")
GLOBE_ONLY = ("projection", "relief", "rivers", "lakes", "atmosphere")


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
    keys(value, "asset layer borders border_style border_width highlights camera features graticule inserts "
                "projection relief rivers lakes atmosphere", "map")
    globe = value.get("projection", "mercator")
    require(globe in ("mercator", "globe"), "Unknown map.projection")
    globe = globe == "globe"
    require(globe or not set(GLOBE_ONLY) & set(value), "Options for the globe need projection: globe")
    if globe:
        require(value.get("relief") in assets and assets[value["relief"]]["kind"] == "relief", "A globe needs a relief asset")
        for layer in ("rivers", "lakes"):
            if layer in value:
                require(value[layer] in assets and assets[value[layer]]["kind"] == "vector", f"map.{layer} needs a vector asset")
        if "atmosphere" in value:
            require(type(value["atmosphere"]) is bool, "map.atmosphere must be boolean")
    if "border_width" in value:
        number(value["border_width"], "map.border_width", 1, 12)
    inserts = value.get("inserts", [])
    require(isinstance(inserts, list) and len(inserts) <= 3, "map supports at most three inserts")
    for card in inserts:
        keys(card, "asset at until side label", "map insert")
        require(card.get("asset") in assets and assets[card["asset"]]["kind"] == "image", "insert image asset required")
        shown = number(card.get("at"), "insert.at", 0, duration)
        require(number(card.get("until"), "insert.until", 0, duration) > shown, "insert.until must follow at")
        require(card.get("side") in ("left", "right"), "insert side must be left or right")
        text(card.get("label"), "insert.label")
    require(value.get("asset") in assets and assets[value["asset"]]["kind"] == "geojson", "map: geographic asset required")
    require(value.get("layer") in ("national", "political", "people", "physical"), "map: unknown layer")
    require(type(value.get("borders")) is bool, "map.borders must be explicit")
    require(value.get("border_style", "solid") in BORDER_STYLES, "Unknown border_style")
    if "graticule" in value:
        require(type(value["graticule"]) is bool, "map.graticule must be boolean")
    require(isinstance(value.get("highlights", []), list), "map.highlights must be a list")
    require(not value.get("highlights") or value["layer"] == "national", "Country highlights require the national layer")
    camera = value.get("camera")
    require(isinstance(camera, list) and camera and camera[0].get("at") == 0, "camera must start at zero")
    previous = -1
    for frame in camera:
        require(isinstance(frame, dict) and (globe == ("bounds" not in frame)),
                "A globe camera uses center and span, a Mercator camera uses bounds: the two cannot be mixed")
        at = number(frame.get("at"), "camera.at", 0, duration)
        require(at > previous, "camera times must be strictly increasing")
        previous = at
        if globe:
            validate_globe_camera(frame)
            continue
        keys(frame, "at bounds", "camera keyframe")
        bounds = frame.get("bounds")
        require(isinstance(bounds, list) and len(bounds) == 4, "camera.bounds needs four coordinates")
        for v in bounds: number(v, "camera.bounds")
        Camera(tuple(bounds), (0, 0, 800, 800))
    features = value.get("features", [])
    require(isinstance(features, list) and len(features) <= 24, "map supports at most twenty-four authored features")
    for feature in features:
        keys(feature, "kind point points label at until colour label_colour evidence meaning offset flag_stripes geometry_note fill_opacity draw_seconds line_style line_width role fade_seconds annotation code unlabelled value flag_orientation flow style extrude", "map feature")
        if "flow" in feature:
            require(type(feature["flow"]) is bool, "feature.flow must be boolean")
        if "unlabelled" in feature:
            require(type(feature["unlabelled"]) is bool, "feature.unlabelled must be boolean")
        kind = feature.get("kind")
        require(kind in ("point", "presence", "presence-zone", "territory", "route", "country", "speakers", "label"), "Unknown map feature kind")
        require(globe or kind != "label", "A label feature needs the globe projection")
        require("style" not in feature or (kind == "label" and feature["style"] in LABEL_STYLES),
                "Unknown label style: style belongs to a label")
        if "extrude" in feature:
            require(globe and kind in ("country", "presence-zone"), "extrude belongs to a country or a zone on the globe")
            number(feature["extrude"], "feature.extrude", 0, 60)
        require("value" not in feature or kind == "speakers", "Only a speakers feature carries a value")
        text(feature.get("label"), "feature.label")
        evidence(feature.get("evidence"), sources, "feature.evidence")
        start = number(feature.get("at"), "feature.at", 0, duration)
        end = number(feature.get("until"), "feature.until", 0, duration)
        require(end > start, "feature.until must follow at")
        require(feature.get("role", "subject") in ("subject", "context"), "Unknown feature role")
        require(feature.get("role") != "context" or kind in ("territory", "point"), "Context role requires a territory or point")
        if "annotation" in feature:
            require(kind == "point", "annotation requires a point")
            text(feature["annotation"], "feature.annotation")
        if "fade_seconds" in feature:
            number(feature["fade_seconds"], "feature.fade_seconds", .04, end-start)
        require(feature.get("colour", "gold") in COLOURS, "Unknown feature colour token")
        if "label_colour" in feature:
            require(feature["label_colour"] in COLOURS, "Unknown label colour token")
        if "geometry_note" in feature:
            text(feature["geometry_note"], "feature.geometry_note")
        if "fill_opacity" in feature:
            require(kind == "territory", "fill_opacity requires a territory")
            number(feature["fill_opacity"], "feature.fill_opacity", 0, 1)
        for field in ("draw_seconds", "line_style", "line_width"):
            if field in feature:
                require(kind == "route" or (field == "draw_seconds" and kind == "country" and globe),
                        f"{field} requires a route")
        if "draw_seconds" in feature:
            number(feature["draw_seconds"], "route.draw_seconds", .04, end-start)
        if "line_style" in feature:
            require(feature["line_style"] in ("solid", "dashed"), "Unknown route.line_style")
        if "line_width" in feature:
            require(type(feature["line_width"]) is int, "route.line_width must be an integer")
            number(feature["line_width"], "route.line_width", 1, 12)
        if "offset" in feature:
            require(isinstance(feature["offset"], list) and len(feature["offset"]) == 2, "offset requires x/y")
            for v in feature["offset"]: number(v, "offset", -400, 400)
        if kind in ("point", "presence", "speakers", "label"):
            point(feature.get("point"), "feature.point")
            require("points" not in feature and "meaning" not in feature, "Point feature has route fields")
            if kind == "speakers":
                # A circle whose area follows a figure: the figure must exist and its source be in the evidence.
                require(type(feature.get("value")) is int and feature["value"] > 0,
                        "A speakers feature needs a positive integer value")
        elif kind == "country":
            # A whole present-day country switched on at a cue, on the national layer only.
            require(value["layer"] == "national", "A country feature needs the national layer")
            text(feature.get("code"), "feature.code")
            require(not {"point", "points", "meaning"} & set(feature), "Country feature has point or route fields")
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
                require(feature.get("meaning") in ("journey", "migration", "language-diffusion", "name-circulation", "river"),
                        "route.meaning must distinguish a journey, migration, language diffusion, name circulation or river")
        if "flag_orientation" in feature:
            require("flag_stripes" in feature and feature["flag_orientation"] in ("vertical", "horizontal"),
                    "flag_orientation must be vertical or horizontal and needs flag_stripes")
        if "flag_stripes" in feature:
            import re
            require(kind in ("point", "country") and value["layer"] == "national",
                    "Flags require a point or a country in the national layer")
            require(isinstance(feature["flag_stripes"], list) and len(feature["flag_stripes"]) == 3 and
                    all(isinstance(c, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", c) for c in feature["flag_stripes"]),
                    "flag_stripes requires three hex colours")


def validate_vector(geo):
    """Rivers and lakes: any line or polygon layer, none of it a country, so no code is required."""
    require(geo.get("type") == "FeatureCollection" and geo.get("features"), "Expected a nonempty GeoJSON FeatureCollection")
    for feature in geo["features"]:
        require(feature.get("geometry", {}).get("type") in ("LineString", "MultiLineString", "Polygon", "MultiPolygon"),
                "A vector layer requires lines or polygons")


def validate_relief_bounds(bounds):
    require(isinstance(bounds, list) and len(bounds) == 4, "relief bounds need west, south, east and north")
    west, south, east, north = (number(v, "relief bounds") for v in bounds)
    require(-180 <= west < east <= 180 and -90 <= south < north <= 90, "relief bounds must be a real box in degrees")


def validate_globe_camera(frame):
    keys(frame, "at center span tilt heading ease offset", "globe camera keyframe")
    center = frame.get("center")
    require(isinstance(center, list) and len(center) == 2, "camera.center needs longitude and latitude")
    for v in center: number(v, "camera.center")
    require("ease" not in frame or frame["ease"] in EASINGS, "Unknown camera.ease")
    if "offset" in frame:
        require(isinstance(frame["offset"], list) and len(frame["offset"]) == 2, "camera.offset needs x/y fractions")
        for v in frame["offset"]: number(v, "camera.offset", -1, 1)
    GlobeCamera(tuple(center), number(frame.get("span"), "camera.span"), (0, 0, 800, 800),
                tilt=number(frame.get("tilt", 0), "camera.tilt"), heading=number(frame.get("heading", 0), "camera.heading"))


def validate_timeline(value, duration, sources, assets=None):
    keys(value, "scale events context layout background overview_at context_layout", "timeline")
    layout = value.get("layout", "overview")
    require(layout in ("overview", "focus"), "Unknown timeline layout")
    if layout == "focus":
        validate_focused_timeline(value, duration, sources, assets or {})
        return
    require(not any(key in value for key in ("background", "overview_at", "context_layout")), "Focus options require the focus layout")
    require(value.get("scale") == "ordinal", "timeline.scale must be ordinal; spacing is explicitly not proportional")
    events, context = value.get("events"), value.get("context", [])
    require(isinstance(events, list) and 2 <= len(events) <= 3, "timeline needs two or three primary events")
    require(isinstance(context, list) and len(context) <= 2, "timeline supports at most two context events")
    years = []
    for lane in (events, context):
        for event in lane:
            keys(event, "year label detail at evidence" if lane is context else "year label at evidence display", "timeline event")
            require(type(event.get("year")) is int and event["year"] != 0, "event.year must be a nonzero integer")
            # `display` replaces the printed year when sources give only a century: the year then
            # only orders the events and is never shown.
            if "display" in event: text(event["display"], "event.display")
            text(event.get("label"), "event.label")
            if lane is context: text(event.get("detail"), "event.detail")
            number(event.get("at"), "event.at", 0, duration-.04)
            evidence(event.get("evidence"), sources, "event.evidence")
        if lane is events:
            years = [event["year"] for event in events]
            require(all(a < b for a, b in zip(years, years[1:])), "Primary events must be in chronological order")
    require(all(event["year"] in years for event in context), "Context must share the same year as a primary event")
    require(len({event["year"] for event in context}) == len(context), "Group same-year context into one event")


def validate_focused_timeline(value, duration, sources, assets):
    """Anchor context to a scene cue without pretending its period is that year."""
    primary = {key: value[key] for key in ("scale", "events") if key in value}
    validate_timeline(primary, duration, sources)
    require(value.get("context_layout", "cards") in ("cards", "corner"), "Unknown context layout")
    events = value["events"]
    require(all(a["at"] < b["at"] for a, b in zip(events, events[1:])),
            "Focus event cues must be chronological")
    overview = value.get("overview_at", duration)
    number(overview, "overview_at", events[-1]["at"], duration)
    require(overview > events[-1]["at"], "Overview must follow the final event")
    windows = {event["year"]: (event["at"], events[i+1]["at"] if i+1 < len(events) else overview)
               for i, event in enumerate(events)}
    context = value.get("context", [])
    require(isinstance(context, list) and len(context) <= 2*len(events), "Focus supports two lanes per event")
    used = set()
    for item in context:
        keys(item, "event_year lane label detail at evidence", "focus context")
        anchor = item.get("event_year")
        require(type(anchor) is int and anchor in windows, "Context event_year must reference a primary event")
        require(item.get("lane") in ("regional", "world"), "Unknown context lane")
        pair = (anchor, item["lane"])
        require(pair not in used, "Only one context per lane and primary event")
        used.add(pair)
        for field in ("label", "detail"): text(item.get(field), "context."+field)
        evidence(item.get("evidence"), sources, "context.evidence")
        start, end = windows[anchor]
        cue = number(item.get("at"), "context.at", start)
        require(cue < end, "Context must appear within its event window")
    if value.get("context_layout") == "corner":
        require(len({item["at"] for item in context}) == len(context),
                "Corner context cues must be distinct; one note is visible at a time")
    if "background" in value:
        background = value["background"]
        validate_map(background, duration, assets, sources)
        if background.get("features") or background.get("highlights"):
            require(not context or value.get("context_layout") == "corner",
                    "Composed timeline maps require corner context to keep geography visible")


def validate_image(value, assets, layout, duration):
    """An image scene's picture, or the picture behind an overlay: the same contract in both places."""
    keys(value, "asset fit motion", "image")
    require(value.get("asset") in assets and assets[value["asset"]]["kind"] == "image", "image asset required")
    require(value.get("fit") in ("contain", "cover"), "image.fit must be contain or cover")
    motion = value.get("motion")
    if motion is None:
        return
    if "keys" in motion:
        # A camera of keys is a deliberate move, eased between views, so it may go far beyond the five percent
        # that a slow push-in is allowed in the full-frame layout. The charter's enlargement ceiling still applies
        # at render time, and the preflight renders every key.
        keys(motion, "keys", "image.motion with keys")
        require(value["fit"] == "cover", "image.motion.keys needs fit cover: a document held whole does not move")
        steps = motion["keys"]
        require(isinstance(steps, list) and len(steps) >= 2, "image.motion.keys needs at least two keys")
        previous = -1
        for step in steps:
            keys(step, "at view", "image.motion.keys")
            at = number(step.get("at"), "key.at", 0, duration-.04)
            require(at > previous, "image.motion.keys must increase in time")
            previous = at
            view = step.get("view")
            require(isinstance(view, list) and len(view) == 3, "a key view is [zoom, focusX, focusY]")
            number(view[0], "zoom", 1, 3)
            number(view[1], "focusX", 0, 1)
            number(view[2], "focusY", 0, 1)
        require(steps[0]["at"] == 0, "image.motion.keys must start at 0")
        return
    keys(motion, "from to", "image.motion")
    for field in ("from", "to"):
        k = motion.get(field)
        require(isinstance(k, list) and len(k) == 3, "motion needs [zoom, focusX, focusY]")
        number(k[0], "zoom", 1, 1.25)
        number(k[1], "focusX", 0, 1)
        number(k[2], "focusY", 0, 1)
    require(value["fit"] == "cover" or all(k[0] == 1 for k in motion.values()),
            "contain preserves the full document; use zoom 1 or explicitly choose cover")
    # The legacy film zooms 3.5 percent over a scene; a bigger push-in reads as a jolt.
    require(layout != "fullbleed" or all(k[0] <= 1.05 for k in motion.values()),
            "fullbleed images zoom at most five percent")


def validate_map_scene(value, duration, root, assets, sources):
    """A map with its countries checked against the basemap it names."""
    validate_map(value, duration, assets, sources)
    require(assets[value["asset"]]["kind"] == "geojson", "map asset must be geojson")
    data = json.loads(asset_path(root, assets[value["asset"]]).read_text())
    codes = {f["properties"]["ADM0_A3"] for f in data["features"]}
    require(all(c in codes for c in value.get("highlights", [])), "Unknown highlighted country")
    require(all(f["code"] in codes for f in value.get("features", []) if f["kind"] == "country"),
            "Unknown country in a country feature")


def validate_backdrop(value, duration, root, assets, sources):
    """What an overlay is drawn over: exactly one picture or map, checked as it would be as a scene of its own."""
    require(isinstance(value, dict) and len(value) == 1 and next(iter(value)) in ("image", "map"),
            "backdrop is exactly one image or one map")
    (kind, config), = value.items()
    if kind == "image":
        validate_image(config, assets, "fullbleed", duration)
    else:
        validate_map_scene(config, duration, root, assets, sources)


def validate_plan(plan, root, duration):
    """Validate shape, local assets, provenance and complete audio coverage."""
    keys(plan, "version profile coverage title source output_dir sources assets scenes progress cover outro layout", "plan")
    layout = plan.get("layout", "panel")
    require(layout in ("panel", "fullbleed"), "Unknown layout")
    for flag in ("progress", "cover", "outro"):
        if flag in plan:
            require(type(plan[flag]) is bool, f"{flag} must be boolean")
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
        keys(asset, "path kind sha256 credit license source bounds", f"asset {key}")
        require(asset.get("kind") in ("geojson", "image", "relief", "vector"), "Unknown asset kind")
        require(("bounds" in asset) == (asset["kind"] == "relief"), "Only a relief asset carries bounds, and it must")
        if asset["kind"] == "relief": validate_relief_bounds(asset["bounds"])
        for field in ("path", "credit", "license", "sha256"): text(asset.get(field), f"asset.{field}")
        require(asset.get("source") in sources, "asset source is missing")
        path = asset_path(root, asset)
        require(hashlib.sha256(path.read_bytes()).hexdigest() == asset["sha256"], f"Asset hash changed: {key}")
        if asset["kind"] == "geojson":
            validate_geometry(json.loads(path.read_text()))
        elif asset["kind"] == "vector":
            validate_vector(json.loads(path.read_text()))
        else:
            with Image.open(path) as image: image.verify()
    scenes = plan.get("scenes")
    require(isinstance(scenes, list) and scenes, "scenes must be a nonempty list")
    ids, previous = set(), 0.0
    for index, scene in enumerate(scenes):
        where = f"scene {index+1}"
        keys(scene, "id type start end title purpose evidence beat map image text comparison backdrop timeline document transition", where)
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
        # The full-frame layout draws words only as an overlay: a comparison whose items arrive over a picture or a map.
        require(layout != "fullbleed" or kind in ("map", "image", "timeline", "comparison"),
                f"{where}: the fullbleed layout cannot draw a {kind} scene")
        if kind == "comparison" and layout == "fullbleed":
            require("backdrop" in scene, f"{where}: a full-frame comparison needs a backdrop, or it is words on a black screen")
            validate_backdrop(scene["backdrop"], end-start, root, assets, sources)
        else:
            require("backdrop" not in scene, f"{where}: a backdrop belongs to a comparison in the full-frame layout")
        if kind == "map":
            validate_map_scene(scene.get("map"), end-start, root, assets, sources)
        elif kind == "image":
            validate_image(scene.get("image"), assets, layout, end-start)
        elif kind == "timeline":
            validate_timeline(scene.get("timeline"), end-start, sources, assets)
            require(layout != "fullbleed" or (scene["timeline"].get("layout") == "focus" and not scene["timeline"].get("context")),
                    f"{where}: the fullbleed layout draws a focused chronology without context cards")
            background = scene["timeline"].get("background")
            if background:
                data = json.loads(asset_path(root, assets[background["asset"]]).read_text())
                codes = {f["properties"]["ADM0_A3"] for f in data["features"]}
                require(all(c in codes for c in background.get("highlights", [])), "Unknown highlighted country")
                require(all(f["code"] in codes for f in background.get("features", []) if f["kind"] == "country"),
                        "Unknown country in a country feature")
        elif kind == "document":
            value = scene.get("document")
            keys(value, "asset label body", "document")
            require(value.get("asset") in assets and assets[value["asset"]]["kind"] == "image", "document image asset required")
            for field in ("label", "body"): text(value.get(field), f"document.{field}")
        elif kind == "text":
            text(scene.get("text"), "scene.text")
        else:
            items = scene.get("comparison")
            full = layout == "fullbleed"
            require(isinstance(items, list) and 2 <= len(items) <= (5 if full else 3),
                    "comparison needs two to five items in the full-frame layout" if full
                    else "comparison needs two or three items")
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
