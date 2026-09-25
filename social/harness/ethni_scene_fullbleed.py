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
         "teal": "#0f6f73", "perv": "#6a3fa0"}

INSERT_WIDTH, INSERT_HEIGHT, INSERT_TOP, FADE = 380, 520, 600, .35


def shade(renderer):
    """Top and bottom gradients, built once: dark enough to carry white text over any picture."""
    if not hasattr(renderer, "_shade"):
        alpha = Image.new("L", (W, H), 0)
        draw = ImageDraw.Draw(alpha)
        for y in range(H):
            top = 150*(1-y/430) if y < 430 else 0
            bottom = min(225, 225*(y-1000)/430) if y > 1000 else 0
            draw.line((0, y, W, y), fill=round(max(top, bottom)))
        shading = Image.new("RGBA", (W, H), ImageColor.getrgb(renderer.palette["ground"])+(0,))
        shading.putalpha(alpha)
        renderer._shade = shading
    return renderer._shade


def background(renderer, scene, local):
    kind = scene["type"]
    if kind == "image":
        return renderer._image(scene, local, size=(W, H))
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
    draw.rounded_rectangle((x, bottom+14, x+picture.width+2*border, bottom+64), radius=12, fill=renderer.palette["ground"])
    renderer.paragraph(draw, card["label"], (x+14, bottom+22, picture.width+2*border-28, 40), "Bandeau")
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
    if caption and not (renderer.plan.get("cover") and instant < MINIATURE_S):
        box = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(box).rounded_rectangle((65, 1352, 957, 1548), radius=22,
                                              fill=ImageColor.getrgb(renderer.palette["ground"])+(175,))
        frame = Image.alpha_composite(frame, box)
    frame = frame.convert("RGB")
    if heading["type"] == "timeline":
        frame = draw_band(renderer, frame, heading, credit_local)
    draw = ImageDraw.Draw(frame)
    palette = renderer.palette
    evidence = heading["evidence"]
    renderer.paragraph(draw, f"{evidence['period']} · {STATUS[evidence['status']]}",
                       (renderer.left, 118, 809, 45), "Bandeau", palette["white"])
    height = renderer.paragraph(ImageDraw.Draw(Image.new("RGB", (W, H))), heading["title"],
                                (renderer.left, 0, 809, 260), "Titre de série", palette["white"])
    renderer.paragraph(draw, heading["title"], (renderer.left, 1290-height, 809, 260), "Titre de série", palette["white"])
    if caption and not (renderer.plan.get("cover") and instant < MINIATURE_S):
        renderer.paragraph(draw, caption["texte"], (renderer.left, 1380, 809, 140), "Corps")
    lines = renderer.legend(credit_scene, credit_local) + renderer.credits(credit_scene, credit_local)
    renderer.paragraph(draw, "\n".join(lines), (renderer.left, 1690, 809, 150), "Crédit", palette["night-ink-2"])
    renderer.paragraph(draw, "ETHNIAFRICA", (renderer.left, 1850, 380, 40), "Bandeau", palette["gold"])
    if renderer.proof:
        badge = Image.new("RGBA", (620, 68), ImageColor.getrgb(palette["ground"])+(240,))
        renderer.paragraph(ImageDraw.Draw(badge), "ÉPREUVE — NE PAS PUBLIER", (16, 12, 590, 50), "Bandeau", palette["night-ink-2"])
        badge = badge.rotate(-15, expand=True, resample=Image.Resampling.BICUBIC)
        frame.paste(badge, (460, 25), badge)
    return frame
