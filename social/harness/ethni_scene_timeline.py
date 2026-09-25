"""A compact mobile chronology: shared years align across two labelled lanes."""
from ethni_map import mix, smooth
from ethni_scene_plan import STATUS


def draw_timeline(renderer, draw, scene, local):
    value, p = scene["timeline"], renderer.palette
    if value.get("layout") == "focus":
        draw_focused_timeline(renderer, draw, scene, local)
        return
    events = value["events"]
    xs = [220 + index*550/(len(events)-1) for index in range(len(events))]
    positions = dict(zip((event["year"] for event in events), xs))
    panel = "#%02x%02x%02x" % mix(p["ground"], p["gold"], .065)
    muted = mix(p["ground"], p["night-ink-2"], .48)
    draw.rounded_rectangle((65, 495, 957, 1180), radius=24, fill=panel)
    # A quiet drafting grid gives the axis a surface without imitating an archive.
    for x in range(90, 940, 30):
        for y in range(520, 1170, 30):
            draw.ellipse((x, y, x+1, y+1), fill=mix(panel, p["gold"], .17))
    renderer.paragraph(draw, "REPÈRES CHRONOLOGIQUES", (101, 526, 790, 45), "Bandeau", p["night-ink-2"])
    draw.line((155, 810, 890, 810), fill=muted, width=3)
    draw.polygon([(900, 810), (886, 802), (886, 818)], fill=muted)
    # Voice cues control the highlight, never the historical distance between dates.
    revealed = [i for i, event in enumerate(events) if local >= event["at"]]
    if revealed:
        index = max(revealed)
        previous = xs[max(0, index-1)]
        progress = 1 if renderer.reduced_motion else smooth(min(1, max(0, (local-events[index]["at"])/.45)))
        cursor = previous+(xs[index]-previous)*progress
        draw.line((155, 810, cursor, 810), fill=p["gold"], width=6)
    for event, x in zip(events, xs):
        active = local >= event["at"]
        ink = p["gold"] if active else muted
        draw.rounded_rectangle((x-120, 591, x+120, 774), radius=16,
                               fill=mix(panel, p["gold"], .08 if active else .025))
        year = str(event["year"]) if event["year"] > 0 else f"{abs(event['year'])} av."
        renderer.paragraph(draw, year, (x-102, 613, 210, 95), "Paire — terme", ink)
        if active:
            renderer.paragraph(draw, event["label"], (x-102, 700, 210, 46), "Corps")
            renderer.paragraph(draw, STATUS[event["evidence"]["status"]], (x-102, 750, 220, 30), "Crédit", p["night-ink-2"])
        draw.line((x, 782, x, 796), fill=ink, width=2)
        draw.ellipse((x-10, 800, x+10, 820), fill=panel, outline=ink, width=4)
    context = value.get("context", [])
    renderer.paragraph(draw, "AILLEURS, LA MÊME ANNÉE" if context else "ORDRE DES ÉVÉNEMENTS",
                       (101, 862, 790, 45), "Bandeau", p["teal"])
    if not context:
        renderer.paragraph(draw, "De gauche à droite, du plus ancien au plus récent.", (101, 963, 790, 110), "Corps", p["night-ink-2"])
    for event in context:
        if local < event["at"]: continue
        x = positions[event["year"]]
        width = 390 if len(context) == 1 else 240
        left = max(101, min(x-width/2, 890-width))
        for y in range(828, 851, 14): draw.line((x, y, x, y+6), fill=p["teal"], width=2)
        draw.rounded_rectangle((left, 915, left+width, 1160), radius=14, fill=mix(panel, p["teal"], .12))
        renderer.paragraph(draw, event["label"], (left+15, 937, width-30, 45), "Bandeau", p["teal"])
        renderer.paragraph(draw, event.get("detail", str(event["year"])), (left+15, 993, width-30, 135), "Corps")
        renderer.paragraph(draw, STATUS[event["evidence"]["status"]], (left+15, 1133, width-30, 28), "Crédit", p["night-ink-2"])
    renderer.paragraph(draw, "Espacement non proportionnel aux années", (101, 1210, 790, 44), "Crédit", p["night-ink-2"])


def draw_focused_timeline(renderer, draw, scene, local):
    """Travel along an ordinal rail; only the active event owns context cards."""
    value, p = scene["timeline"], renderer.palette
    events = value["events"]
    active = [i for i, event in enumerate(events) if local >= event["at"]]
    index = max(active) if active else 0
    overview_at = value.get("overview_at", scene["end"]-scene["start"])
    overview = local >= overview_at
    elapsed = local-events[index]["at"]
    travel = 1 if renderer.reduced_motion else smooth(max(0, min(1, elapsed/.85)))
    centre = max(0, index-1)+(index-max(0, index-1))*travel
    pullback = (1 if renderer.reduced_motion else smooth(min(1, (local-overview_at)/1.1))) if overview else 0
    centre += ((len(events)-1)/2-centre)*pullback
    spacing = 660+(554/(len(events)-1)-660)*pullback
    muted = mix(p["ground"], p["night-ink-2"], .55)
    # The continuous rail moves; its spacing deliberately does not encode years.
    draw.line((renderer.left, 810, renderer.right, 810), fill=muted, width=3)
    for i, event in enumerate(events):
        x = 495+(i-centre)*spacing
        if renderer.left+12 <= x <= renderer.right-12:
            ink = p["gold"] if i <= index and active else muted
            draw.ellipse((x-10, 800, x+10, 820), fill=p["ground"], outline=ink, width=4)
            if overview and pullback > .8:
                renderer.paragraph(draw, str(event["year"]), (x-105, 675, 225, 100), "Paire — terme", p["gold"])
                renderer.paragraph(draw, event["label"], (x-115, 851, 235, 130), "Corps")
                renderer.paragraph(draw, event["evidence"]["period"], (x-115, 994, 235, 55), "Crédit", p["night-ink-2"])
    if not active:
        renderer.paragraph(draw, "UNE HISTOIRE EN MOUVEMENT", (renderer.left, 630, 809, 110), "Corps", p["gold"])
    elif not overview:
        event = events[index]
        corner = value.get("context_layout") == "corner"
        renderer.paragraph(draw, event["evidence"]["period"], (renderer.left, 535, 440 if corner else 809, 140), "Titre de série", p["gold"])
        renderer.paragraph(draw, event["label"], (renderer.left, 705, 809, 85), "Corps")
        visible = [item for item in value.get("context", [])
                   if item["event_year"] == event["year"] and local >= item["at"]]
        if corner and visible:
            draw_corner_note(renderer, draw, max(visible, key=lambda item: item["at"]), local)
        for item in ([] if corner else visible):
            amount = 1 if renderer.reduced_motion else smooth(min(1, (local-item["at"])/.5))
            top = (875 if item["lane"] == "regional" else 1100)+round(22*(1-amount))
            colour = p["teal"] if item["lane"] == "regional" else p["perv"]
            panel = mix(p["ground"], colour, .12*amount)
            draw.rounded_rectangle((renderer.left, top, renderer.right, top+193), radius=18, fill=panel)
            draw.line((renderer.left, top+16, renderer.left, top+177), fill=mix(p["ground"], colour, amount), width=5)
            lane = "DANS LA RÉGION" if item["lane"] == "regional" else "AILLEURS DANS LE MONDE"
            renderer.paragraph(draw, lane+" · "+item["label"], (renderer.left+20, top+17, 769, 40), "Bandeau",
                               mix(p["ground"], p["white"], amount))
            renderer.paragraph(draw, item["detail"], (renderer.left+20, top+63, 769, 88), "Corps",
                               mix(p["ground"], p["white"], amount))
            renderer.paragraph(draw, item["evidence"]["period"]+" · "+STATUS[item["evidence"]["status"]],
                               (renderer.left+20, top+160, 769, 30), "Crédit", mix(p["ground"], p["night-ink-2"], amount))
    notice = "Espacement non proportionnel aux années"
    if "background" in value:
        notice += " · Mercator"
    renderer.paragraph(draw, notice, (renderer.left, 1331, 809, 30), "Crédit", p["night-ink-2"])


def draw_corner_note(renderer, draw, item, local):
    """A fixed marginal note replaces its predecessor without displacing the story."""
    p = renderer.palette
    amount = 1 if renderer.reduced_motion else smooth(min(1, (local-item["at"])/.25))
    ink = mix(p["ground"], p["night-ink-2"], amount)
    renderer.paragraph(draw, "À cette époque", (570, 205, 330, 40), "Bandeau", ink, weight=400)
    body_height = renderer.paragraph(draw, item["label"]+"\n"+item["detail"],
                                      (570, 258, 330, 210), "Corps", ink, weight=400)
    period_top = 258+body_height+14
    period_height = renderer.paragraph(draw, item["evidence"]["period"],
                                        (570, period_top, 330, 100), "Bandeau", ink, weight=400)
    draw.line((548, 208, 548, period_top+period_height+8),
              fill=mix(p["ground"], p["night-ink-2"], .5*amount), width=2)
