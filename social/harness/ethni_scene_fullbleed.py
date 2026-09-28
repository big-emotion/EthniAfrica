"""Full-frame layout in the legacy film's grammar.

The picture, or the map, fills the whole screen; shading carries the text: a label at the
top, the title low on the left, the narration in a translucent box, the credits at the foot.
A plan opts in with `"layout": "fullbleed"`. The map is the subject, so it gets a light,
warm palette of its own instead of the dark panel palette; the shading is what keeps the
text readable over it.
"""
from PIL import Image, ImageColor, ImageDraw

import ethni_tokens as tokens
from ethni_map import smooth
from ethni_montage import MINIATURE_S
from ethni_scene_plan import STATUS, require, scene_at, transition_at

W, H = 1080, 1920

# Names match the engine palette so the map code is shared; values are light and warm.
LIGHT = {"ground": "#c9dde3", "land": "#f2ead8", "land-highlight": "#e3b658", "border": "#a08d68",
         "gold": "#d4922a", "white": "#2b2118", "night-ink-2": "#4a3d2a", "night-ink-3": "#8b7b5c",
         "teal": "#0f6f73", "perv": "#6a3fa0", "sea": "#79aabf"}

INSERT_WIDTH, INSERT_HEIGHT, INSERT_TOP, FADE = 380, 430, 480, .35

# An overlay: words that arrive on a cue over the picture or the globe, and then stay. The band below the concept
# and above the caption belongs to the items; each item owns its place from the first frame, so nothing moves
# when another one joins it.
OVERLAY_TOP, OVERLAY_BOTTOM, PLATE_PAD, ITEM_GAP, RISE = 480, 1330, 20, 24, 26
PLATE_ALPHA = 150
REVEAL_S = tokens.duree("slow")


def shade(renderer):
    """Top and bottom gradients, built once: dark enough to carry white text over any picture."""
    if not hasattr(renderer, "_shade"):
        alpha = Image.new("L", (W, H), 0)
        draw = ImageDraw.Draw(alpha)
        for y in range(H):
            top = 190*(1-y/460) if y < 460 else 0
            # Nothing above 900 px: the map is the subject. Text sits on the shading and a drop shadow.
            bottom = 0 if y < 900 else 165*(y-900)/400 if y < 1300 else 165+50*min(1, (y-1300)/260)
            draw.line((0, y, W, y), fill=round(max(top, bottom)))
        shading = Image.new("RGBA", (W, H), ImageColor.getrgb(renderer.palette["ground"])+(0,))
        shading.putalpha(alpha)
        renderer._shade = shading
    return renderer._shade


def shadowed(renderer, draw, value, box, role):
    """White text with a soft dark drop shadow, so it holds over the light map without a plate."""
    x, y, width, height = box
    for dx, dy in ((3, 4), (-1, 3), (2, 2)):
        renderer.paragraph(draw, value, (x+dx, y+dy, width, height), role, renderer.palette["ground"])
    return renderer.paragraph(draw, value, box, role, renderer.palette["white"])


def background(renderer, scene, local):
    kind = scene["type"]
    if kind == "image":
        return renderer._image(scene, local, size=(W, H))
    if kind == "comparison":
        backdrop = scene["backdrop"]
        if "image" in backdrop:
            return renderer._image({"image": backdrop["image"], "start": scene["start"], "end": scene["end"]}, local, size=(W, H))
        return renderer._map({"map": backdrop["map"]}, local, (0, 0, W, H), LIGHT)
    if kind == "map":
        frame = renderer._map(scene, local, (0, 0, W, H), LIGHT)
    else:
        map_config = scene["timeline"].get("background")
        frame = (renderer._map({"map": map_config}, local, (0, 0, W, H), LIGHT) if map_config
                 else Image.new("RGB", (W, H), LIGHT["ground"]))
    for card in (map_config if kind == "timeline" and map_config else scene.get("map", {})).get("inserts", []) \
            if kind in ("map", "timeline") else []:
        if card["at"] <= local < card["until"]:
            frame = draw_insert(renderer, frame, card, local)
    return frame


def draw_insert(renderer, frame, card, local):
    """A small framed picture laid on the map while the narration cites it; the map keeps moving."""
    source = renderer.assets[card["asset"]]
    scale = min(INSERT_WIDTH/source.width, INSERT_HEIGHT/source.height)
    require(scale <= tokens.SUR_ECH_MAX, "Insert enlargement exceeds the charter ceiling")
    key = ("insert", card["asset"])
    if key not in renderer._base_cache:
        renderer._base_cache[key] = source.resize((round(source.width*scale), round(source.height*scale)),
                                                  Image.Resampling.LANCZOS)
    picture = renderer._base_cache[key]
    border = 8
    x = W-65-picture.width-2*border if card["side"] == "right" else 65
    layer = frame.copy()
    draw = ImageDraw.Draw(layer)
    draw.rectangle((x, INSERT_TOP, x+picture.width+2*border, INSERT_TOP+picture.height+2*border), fill="#ffffff")
    layer.paste(picture, (x+border, INSERT_TOP+border))
    bottom = INSERT_TOP+picture.height+2*border
    # A narrow portrait still gets a label plate wide enough to read, flush with the card's outer edge.
    outer = picture.width+2*border
    plate = max(outer, 310)
    plate_x = x+outer-plate if card["side"] == "right" else x
    draw.rounded_rectangle((plate_x, bottom+14, plate_x+plate, bottom+64), radius=12, fill=renderer.palette["ground"])
    renderer.paragraph(draw, card["label"], (plate_x+14, bottom+22, plate-28, 40), "Bandeau")
    fade = min(1, (local-card["at"])/FADE, (card["until"]-local)/FADE)
    return Image.blend(frame, layer, smooth(max(0, fade)))


def draw_band(renderer, frame, scene, local):
    """The chronology as a band over the map: the active year large, the rail with every event."""
    events = scene["timeline"]["events"]
    active = [i for i, event in enumerate(events) if local >= event["at"]]
    if not active:
        return frame
    index = max(active)
    event = events[index]
    palette = renderer.palette
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(panel).rounded_rectangle((65, 170, 1015, 570), radius=24,
                                            fill=ImageColor.getrgb(palette["ground"])+(190,))
    frame = Image.alpha_composite(frame.convert("RGBA"), panel).convert("RGB")
    draw = ImageDraw.Draw(frame)
    year = event.get("display") or (str(event["year"]) if event["year"] > 0 else f"{abs(event['year'])} av.")
    renderer.paragraph(draw, year, (renderer.left, 195, 809, 125), "Titre de série", palette["gold"])
    renderer.paragraph(draw, event["label"], (renderer.left, 325, 809, 50), "Corps")
    renderer.paragraph(draw, event["evidence"]["period"], (renderer.left, 388, 809, 34), "Crédit", palette["night-ink-2"])
    rail_y = 480
    draw.line((renderer.left, rail_y, renderer.right, rail_y), fill=palette["night-ink-3"], width=3)
    step = (renderer.right-renderer.left)/len(events)
    for i in range(len(events)):
        x = renderer.left+step*(i+.5)
        reached = i <= index
        radius = 13 if i == index else 9
        draw.ellipse((x-radius, rail_y-radius, x+radius, rail_y+radius),
                     fill=palette["gold"] if reached else palette["ground"], outline=palette["gold"] if reached else palette["night-ink-3"], width=3)
    renderer.paragraph(draw, "Espacement non proportionnel aux années", (renderer.left, 525, 809, 34), "Crédit", palette["night-ink-2"])
    return frame


def draw_overlay(renderer, frame, scene, local):
    """The items of a comparison, each on a translucent plate, arriving on its cue and then staying.

    The layout is measured from every item at once, and an item that has not arrived yet is only absent, never
    missing from the measure: a word that lands must not push the words already there. Text is never shrunk to
    fit; an overflow is refused, as everywhere in this engine.
    """
    palette, items = renderer.palette, scene["comparison"]
    width = renderer.right-renderer.left-2*PLATE_PAD
    measure = ImageDraw.Draw(Image.new("RGB", (W, H)))
    blocks, top = [], OVERLAY_TOP
    for item in items:
        label = renderer.paragraph(measure, item["label"], (0, 0, width, 10_000), "Paire — terme")
        body = renderer.paragraph(measure, item["body"], (0, 0, width, 10_000), "Corps")
        height = 2*PLATE_PAD+label+body
        blocks.append((top, label, body, height))
        top += height+ITEM_GAP
    require(top-ITEM_GAP <= OVERLAY_BOTTOM, "Text overflow in the overlay: the items do not fit between the concept and the caption")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    ground, gold, white = (ImageColor.getrgb(palette[name]) for name in ("ground", "gold", "white"))
    for item, (top, label, body, height) in zip(items, blocks):
        if local < item.get("at", 0) and not renderer.reduced_motion:
            continue  # reduced motion is the version to judge a composition from: every item on the first frame
        arrival = 1 if renderer.reduced_motion else smooth(min(1, (local-item.get("at", 0))/REVEAL_S))
        lift = round((1-arrival)*RISE)
        draw.rounded_rectangle((renderer.left-PLATE_PAD, top+lift, renderer.right+PLATE_PAD, top+height+lift), radius=18,
                               fill=ground+(round(PLATE_ALPHA*arrival),))
        opaque = round(255*arrival)
        x, y = renderer.left, top+PLATE_PAD+lift
        renderer.paragraph(draw, item["label"], (x, y, width, label), "Paire — terme", gold+(opaque,))
        renderer.paragraph(draw, item["body"], (x, y+label, width, body), "Corps", white+(opaque,))
    return Image.alpha_composite(frame.convert("RGBA"), layer).convert("RGB")


def render(renderer, instant):
    scenes = renderer.plan["scenes"]
    scene = scene_at(scenes, instant)
    local = min(scene["end"]-scene["start"]-1e-6, max(0, instant-scene["start"]))
    picture = background(renderer, scene, local)
    heading, credit_scene, credit_local = scene, scene, local
    transition = None if renderer.reduced_motion else transition_at(scenes, instant)
    if transition:
        before, _, progress = transition
        previous = scenes[before]
        old = background(renderer, previous, previous["end"]-previous["start"]-1e-6)
        picture = Image.blend(old, picture, smooth(progress))
        if progress < .5:
            heading, credit_scene, credit_local = previous, previous, previous["end"]-previous["start"]-1e-6
    frame = Image.alpha_composite(picture.convert("RGBA"), shade(renderer))
    caption = next((c for c in renderer.captions if c["debut"] <= instant < c["fin"]), None)
    frame = frame.convert("RGB")
    if heading["type"] == "timeline":
        frame = draw_band(renderer, frame, heading, credit_local)
    if heading["type"] == "comparison":
        frame = draw_overlay(renderer, frame, heading, credit_local)
    draw = ImageDraw.Draw(frame)
    palette = renderer.palette
    evidence = heading["evidence"]
    renderer.paragraph(draw, f"{evidence['period']} · {STATUS[evidence['status']]}",
                       (renderer.left, 118, 809, 45), "Bandeau", palette["white"])
    height = renderer.paragraph(ImageDraw.Draw(Image.new("RGB", (W, H))), heading["title"],
                                (renderer.left, 0, 809, 260), "Titre de série", palette["white"])
    # The concept of an overlay heads it, at the top; every other scene keeps its title low on the left.
    shadowed(renderer, draw, heading["title"], (renderer.left, 190 if heading["type"] == "comparison" else 1290-height, 809, 260),
             "Titre de série")
    if caption and not (renderer.plan.get("cover") and instant < MINIATURE_S):
        shadowed(renderer, draw, caption["texte"], (renderer.left, 1380, 809, 140), "Corps")
    lines = renderer.legend(credit_scene, credit_local) + renderer.credits(credit_scene, credit_local)
    renderer.paragraph(draw, "\n".join(lines), (renderer.left, 1540, 809, 300), "Crédit", palette["night-ink-2"])
    renderer.paragraph(draw, "ETHNIAFRICA", (renderer.left, 1850, 380, 40), "Bandeau", palette["gold"])
    if renderer.proof:
        badge = Image.new("RGBA", (620, 68), ImageColor.getrgb(palette["ground"])+(240,))
        renderer.paragraph(ImageDraw.Draw(badge), "ÉPREUVE — NE PAS PUBLIER", (16, 12, 590, 50), "Bandeau", palette["night-ink-2"])
        badge = badge.rotate(-15, expand=True, resample=Image.Resampling.BICUBIC)
        frame.paste(badge, (460, 25), badge)
    return frame
