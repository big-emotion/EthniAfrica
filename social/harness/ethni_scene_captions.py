"""Narration captions of a scene video: revealed word by word, large, and never on top of the subject.

A caption is what the eye reads while the voice says it, so a word appears when it is spoken (the aligner's
times, untouched) and the group it belongs to keeps its shape from the first word to the last: the lines are
decided once from every word, so an arriving word never pushes one already there.

Where a group sits is decided per scene, not per frame. The low band is the default; where a map, a highlighted
country, a protected region or the scene's own text stands in it, the group rises to the lowest place that is
clear, and every group of that scene shares it. A caption that has nowhere to go is a validation error at
preflight: covering the subject quietly is the defect this module exists to prevent.
"""
from PIL import Image, ImageDraw

import ethni_soustitre as st
import ethni_tokens as tokens
from ethni_montage import MINIATURE_S
from ethni_map import smooth
from ethni_scene_plan import require, scene_at

ROLE, WEIGHT = "Sous-titre parlé", 800
FADE_S = tokens.duree("fast")
W = 1080

# The foot: the credits start at 1530, and a caption's last line rests on 1520.
BOTTOM = 1520
# Above this y the evidence line, the brand and the proof badge live.
HEADER = 260
# Air kept between a caption and a subject, a protected region or a label; a country is not a tight shape on screen.
PAD = 16
SUBJECT_PAD = 40
SEARCH_STEP = 10
SHADOWS = ((3, 4), (-1, 3), (2, 2))


def size():
    return tokens.type_size(ROLE, "reel")


def line_step():
    return round(tokens.type_size(ROLE, "reel")*tokens.type_role(ROLE)["interligne"])


def overlaps(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def _inflate(box, by):
    return (box[0]-by, box[1]-by, box[2]+by, box[3]+by)


def _reserved(renderer, scene):
    """What the scene's own text and picture chrome occupy: never available to a caption."""
    import ethni_scene_fullbleed as fullbleed
    reserved = [(0, 0, W, HEADER)]
    if scene["type"] in ("kinetic", "comparison"):
        reserved.append((0, HEADER, W, fullbleed.OVERLAY_BOTTOM))
    elif scene["type"] == "timeline":
        reserved.append((0, HEADER, W, 580))
    else:
        top = fullbleed.title_top(renderer, scene)
        reserved.append((renderer.left, top, renderer.right, fullbleed.TITLE_BOTTOM))
    return reserved


def _sample_instants(scene):
    """Enough moments of a scene to catch every place its subject passes through: the camera and the features move."""
    length = scene["end"]-scene["start"]
    instants = {length*i/6 for i in range(6)} | {length-1e-6}
    geographic = scene.get("map") or scene.get("backdrop", {}).get("map") or scene.get("timeline", {}).get("background") or {}
    instants |= {k["at"] for k in geographic.get("camera", [])}
    for feature in geographic.get("features", []):
        instants |= {feature["at"], max(feature["at"], feature["until"]-1e-6)}
    return sorted(t for t in instants if 0 <= t < length)


def _subjects(renderer, scene):
    boxes = []
    for local in _sample_instants(scene):
        boxes += renderer.subject_boxes(scene, local)
    import ethni_scene_fullbleed as fullbleed
    boxes += fullbleed.insert_boxes(scene)
    return [_inflate(box, SUBJECT_PAD) for box in boxes]


def _anchor(renderer, span, group, height):
    """The lowest baseline at which a group of `height` is clear of everything the scenes it crosses put there."""
    fixed, avoided = [], []
    for scene in span:
        fixed += _reserved(renderer, scene)
        avoided += _subjects(renderer, scene)
        avoided += [_inflate(tuple(box), PAD) for box in scene.get("protect", [])]
    for bottom in range(BOTTOM, HEADER+height-1, -SEARCH_STEP):
        block = (renderer.left, bottom-height, renderer.right, bottom)
        if not any(overlaps(block, box) for box in fixed+avoided):
            return bottom
    names = ", ".join(scene["id"] for scene in span)
    raise ValueError(f"No caption placement in scene {names} at {group['debut']:.2f} s: the caption band is taken by "
                     f"the scene's own text, a map subject or a protected region; move the subject, shrink the "
                     f"region or shorten the narration there")


def _lay_out(renderer, group, bottom, face):
    """Fix every word of a group in place, bottom-aligned on the scene's baseline."""
    step, left = line_step(), renderer.left
    top = bottom-len(group["lignes"])*step
    for row, line in enumerate(group["lignes"]):
        y = top+row*step
        for position, index in enumerate(line):
            word = group["mots"][index]
            before = " ".join(group["mots"][i]["texte"] for i in line[:position])
            x = left+(face.getlength(before+" ") if before else 0)
            word["box"] = (x, y, x+face.getlength(word["texte"]), y+step)
    boxes = [w["box"] for w in group["mots"]]
    group["box"] = (left, top, max(b[2] for b in boxes), bottom)


def layout(renderer):
    """Every caption group of the video, timed, cut, placed and accented; computed once per renderer."""
    cached = renderer.__dict__.get("_caption_layout")
    if cached is not None:
        return cached
    face = renderer.face(ROLE, WEIGHT)
    groups = st.grouper(renderer.captions, face.getlength, renderer.right-renderer.left)
    scenes, anchors = renderer.plan["scenes"], {}
    for group in groups:
        span = [s for s in scenes if s["start"] < group["jusqua"] and s["end"] > group["debut"]]
        span = span or [scene_at(scenes, min(group["debut"], scenes[-1]["end"]-1e-6))]
        key = tuple(s["id"] for s in span)
        if key not in anchors:
            anchors[key] = _anchor(renderer, span, group, 2*line_step())
        _lay_out(renderer, group, anchors[key], face)
        owner = scene_at(scenes, min(group["debut"], scenes[-1]["end"]-1e-6))
        chosen = st.mot_accentue(group, owner.get("emphasis", []))
        if chosen is not None:
            group["mots"][chosen]["accent"] = True
    for scene in scenes if groups else []:
        spoken = [g for g in groups if scene["start"] <= g["debut"] < scene["end"]]
        for word in scene.get("emphasis", []):
            require(st.contient(spoken, word),
                    f"Scene {scene['id']}: the emphasis word {word!r} is never spoken while it is on screen")
    renderer._caption_layout = groups
    return groups


def draw(renderer, frame, instant):
    """Lay the caption spoken at `instant` on the frame, each word fading in from its onset.

    Reduced motion (`--controle`) shows the whole group from its first word: it is the version to judge a
    composition from, as for the overlays.
    """
    if renderer.plan.get("cover") and instant < MINIATURE_S:
        return
    group = next((g for g in reversed(layout(renderer)) if g["debut"] <= instant < g["jusqua"]), None)
    if group is None:
        return
    face, palette = renderer.face(ROLE, WEIGHT), renderer.palette
    x0, y0, x1, y1 = (round(v) for v in _inflate(group["box"], 6))
    masks = {name: Image.new("L", (x1-x0, y1-y0), 0) for name in ("shadow", "plain", "accent")}
    pens = {name: ImageDraw.Draw(mask) for name, mask in masks.items()}
    for word in group["mots"]:
        if not renderer.reduced_motion and instant < word["debut"]:
            continue
        arrival = 1 if renderer.reduced_motion else smooth((instant-word["debut"])/FADE_S)
        strength = round(255*arrival)
        x, y = word["box"][0]-x0, word["box"][1]-y0
        for dx, dy in SHADOWS:
            pens["shadow"].text((x+dx, y+dy), word["texte"], font=face, fill=strength, anchor="la")
        pens["accent" if word.get("accent") else "plain"].text((x, y), word["texte"], font=face, fill=strength, anchor="la")
    for name, colour in (("shadow", "ground"), ("plain", "white"), ("accent", "gold")):
        frame.paste(palette[colour], (x0, y0), masks[name])
