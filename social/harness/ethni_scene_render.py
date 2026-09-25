"""Random-access scene compositor. No clock, randomness, network or mutable timeline."""
import json
import math

from PIL import Image, ImageColor, ImageDraw, ImageOps, ImageFilter

import ethni_tokens as tokens
from ethni_type import font
from ethni_map import Camera, camera_at, mix, partial_path, smooth
from ethni_scene_plan import STATUS, asset_path, scene_at, transition_at, require
from ethni_scene_timeline import draw_timeline


def scene_map(scene):
    return scene.get("map") if scene["type"] == "map" else scene.get("timeline", {}).get("background")


def dashed_line(draw, points, colour, width=2):
    """Keep dash phase across short geographic segments, including tiny rings."""
    phase = 0.0
    for a, b in zip(points, points[1:]):
        length = math.dist(a, b)
        position = 0.0
        while position < length:
            step = min(length-position, 10-phase if phase < 10 else 18-phase)
            if phase < 10:
                draw.line([tuple(v+(u-v)*t/length for v, u in zip(a, b))
                           for t in (position, position+step)], fill=colour, width=width)
            position += step
            phase = (phase+step) % 18


class SceneRenderer:
    width, height = 1080, 1920
    # Text remains outside the right-hand social controls and the bottom interface.
    left, right = 91, 900
    content = (45, 480, 1035, 1170)

    def __init__(self, plan, root, captions, reduced_motion=False):
        self.plan, self.root, self.captions = plan, root, captions
        self.reduced_motion = reduced_motion
        self.palette = tokens.palette()
        self.duration = plan["scenes"][-1]["end"]
        self.assets = {}
        for key, asset in plan["assets"].items():
            path = asset_path(root, asset)
            if asset["kind"] == "geojson":
                self.assets[key] = json.loads(path.read_text())
            else:
                with Image.open(path) as image:
                    self.assets[key] = ImageOps.exif_transpose(image).convert("RGB")

    def face(self, role, weight=700):
        return font(tokens.type_size(role, "reel"),
                    "anton" if role in ("Titre de série", "Paire — terme") else "nunito", weight)

    def paragraph(self, draw, value, box, role="Corps", colour=None, weight=700):
        """Wrap by measured glyph width; never silently truncate or shrink text."""
        x, y, width, height = box
        face = self.face(role, weight)
        lines = []
        for paragraph in value.split("\n"):
            line = ""
            for word in paragraph.split():
                require(draw.textlength(word, font=face) <= width, f"Text overflow: {word}")
                candidate = (line + " " + word).strip()
                if draw.textlength(candidate, font=face) > width:
                    lines.append(line)
                    line = word
                else:
                    line = candidate
            lines.append(line)
        step = round(tokens.type_size(role, "reel") * 1.2)
        require(len(lines)*step <= height, f"Text overflow in {role}: {value[:80]}")
        for index, line in enumerate(lines):
            draw.text((x, y+index*step), line, font=face, fill=colour or self.palette["white"], anchor="lt")
        return len(lines)*step

    def _image(self, scene, local):
        value = scene["image"]
        source = self.assets[value["asset"]]
        x0, y0, x1, y1 = self.content
        w, h = x1-x0, y1-y0
        motion = value.get("motion", {"from": [1, .5, .5], "to": [1, .5, .5]})
        progress = 0 if self.reduced_motion else smooth(local/(scene["end"]-scene["start"]))
        zoom, fx, fy = [a+(b-a)*progress for a, b in zip(motion["from"], motion["to"])]
        scale = (min if value["fit"] == "contain" else max)(w/source.width, h/source.height)*zoom
        require(scale <= tokens.SUR_ECH_MAX, "Image enlargement exceeds the charter ceiling")
        resized = source.resize((round(source.width*scale), round(source.height*scale)), Image.Resampling.LANCZOS)
        out = Image.new("RGB", (w, h), self.palette["ground"])
        if value["fit"] == "contain":
            out.paste(resized, ((w-resized.width)//2, (h-resized.height)//2))
        else:
            left = round((resized.width-w)*fx)
            top = round((resized.height-h)*fy)
            out = resized.crop((left, top, left+w, top+h))
        return out

    def _map(self, scene, local, viewport=None):
        cfg = scene["map"]
        x0, y0, x1, y1 = viewport or self.content
        w, h = x1-x0, y1-y0
        canvas = Image.new("RGB", (w, h), self.palette["ground"])
        draw = ImageDraw.Draw(canvas)
        when = 0 if self.reduced_motion else local
        camera = Camera(camera_at(cfg["camera"], when), (0, 0, w, h))
        p = self.palette
        if cfg.get("graticule", True):
            colour = mix(p["ground"], p["night-ink-3"], .15)
            for lon in range(-180, 181, 5):
                draw.line([camera.project((lon, -85)), camera.project((lon, 85))], fill=colour)
            for lat in range(-80, 81, 5):
                draw.line([camera.project((-180, lat)), camera.project((180, lat))], fill=colour)
        # Uniform country fills with no strokes form the physical land surface.
        # Borders are an independent optional overlay, never the people layer.
        boundaries = []
        for feature in self.assets[cfg["asset"]]["features"]:
            geometry = feature["geometry"]
            polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
            highlighted = feature["properties"]["ADM0_A3"] in cfg.get("highlights", [])
            for rings in polygons:
                points = [camera.project(point) for point in rings[0]]
                draw.polygon(points, fill=mix(p["ground"], p["gold"] if highlighted else p["night-ink-2"], .22))
                for hole in rings[1:]:
                    draw.polygon([camera.project(point) for point in hole], fill=p["ground"])
                boundaries.append(points)
        # Draw all boundaries after all land fills so adjacent countries cannot erase them.
        if cfg["borders"]:
            boundary_ink = mix(p["ground"], p["night-ink-2"], .6)
            for points in boundaries:
                if cfg.get("border_style", "solid") == "dashed":
                    dashed_line(draw, points, boundary_ink)
                else:
                    draw.line(points, fill=boundary_ink, width=2)
        label_boxes = []
        features = sorted(cfg.get("features", []), key=lambda f: f.get("role") != "context")
        for feature in features:
            if not feature["at"] <= local < feature["until"]:
                continue
            reveal = 1 if self.reduced_motion or "fade_seconds" not in feature else smooth((local-feature["at"])/feature["fade_seconds"])
            below = canvas.copy() if reveal < 1 else None
            colour = p[feature.get("colour", "gold")]
            if feature.get("role") == "context":
                colour = "#%02x%02x%02x" % mix(p["ground"], colour, .55)
            kind = feature["kind"]
            if kind in ("point", "presence"):
                x, y = camera.project(feature["point"])
                if kind == "presence":
                    # Equal-size locators deliberately encode no unmeasured density.
                    for radius in range(38, 7, -3):
                        draw.ellipse((x-radius, y-radius, x+radius, y+radius),
                                     fill=mix(p["ground"], colour, .15 + .4*(1-radius/38)))
                draw.ellipse((x-7, y-7, x+7, y+7), fill=colour)
                stripes = feature.get("flag_stripes", [])
                for i, stripe in enumerate(stripes):
                    draw.rectangle((x+i*12-18, y-40, x+(i+1)*12-18, y-18), fill=stripe)
            elif kind == "presence-zone":
                points = [camera.project(point) for point in feature["points"]]
                mask = Image.new("L", canvas.size)
                ImageDraw.Draw(mask).polygon(points, fill=125)
                mask = mask.filter(ImageFilter.GaussianBlur(18))
                # The feathered edge represents uncertainty, not population density.
                canvas.paste(Image.new("RGB", canvas.size, colour), (0, 0), mask)
                x, y = points[0]
            elif kind == "territory":
                points = [camera.project(point) for point in feature["points"]]
                overlay = Image.new("RGBA", canvas.size)
                od = ImageDraw.Draw(overlay)
                od.polygon(points, fill=ImageColor.getrgb(colour)+(round(feature.get("fill_opacity", 65/255)*255),))
                # Dashed outlines make estimated/hypothetical extents distinguishable without colour.
                if feature["evidence"]["status"] in ("estimate", "hypothesis"):
                    for a, b in zip(points, points[1:]):
                        distance = math.dist(a, b)
                        for offset in range(0, int(distance), 18):
                            t0, t1 = offset/max(1, distance), min(1, (offset+9)/max(1, distance))
                            od.line([tuple(v+(u-v)*t0 for v, u in zip(a, b)),
                                     tuple(v+(u-v)*t1 for v, u in zip(a, b))], fill=colour, width=3)
                else:
                    od.line(points, fill=colour, width=3)
                canvas.paste(overlay, (0, 0), overlay)
                x, y = points[0]
            else:
                draw_seconds = feature.get("draw_seconds", feature["until"]-feature["at"])
                progress = 1 if self.reduced_motion else min(1, (local-feature["at"])/draw_seconds)
                points = partial_path([camera.project(point) for point in feature["points"]], progress)
                if len(points) > 1:
                    width = feature.get("line_width", 5)
                    if feature.get("line_style", "solid") == "dashed":
                        dashed_line(draw, points, colour, width)
                    else:
                        draw.line(points, fill=colour, width=width, joint="curve")
                    a, b = points[-2:]
                    angle = math.atan2(b[1]-a[1], b[0]-a[0])
                    draw.polygon([b, (b[0]-18*math.cos(angle-.45), b[1]-18*math.sin(angle-.45)),
                                  (b[0]-18*math.cos(angle+.45), b[1]-18*math.sin(angle+.45))], fill=colour)
                x, y = camera.project(feature["points"][0])
            # Off-screen features remain available as legend entries, not false clamped locations.
            dx, dy = feature.get("offset", [18, -30])
            label_width = draw.textlength(feature["label"], font=self.face("Bandeau"))
            annotated = "annotation" in feature
            if annotated: label_width = max(label_width, 300)
            label_height = 146 if annotated else 36
            if 0 <= x+dx and x+dx+label_width <= self.right-x0 and 0 <= y+dy <= h-label_height:
                box = (x+dx, y+dy, x+dx+label_width, y+dy+label_height)
                require(not any(box[0] < b[2]+8 and box[2]+8 > b[0] and box[1] < b[3]+8 and box[3]+8 > b[1]
                                for b in label_boxes), f"Map label overlap: {feature['label']}")
                label_boxes.append(box)
                ink = p[feature.get("label_colour", feature.get("colour", "gold"))]
                if feature.get("role") == "context": ink = mix(p["ground"], ink, .65)
                if annotated:
                    edge = (max(box[0], min(x, box[2])), max(box[1], min(y, box[3])))
                    draw.line(((x, y), edge), fill=ink, width=2)
                self.paragraph(draw, feature["label"], (x+dx, y+dy, label_width+1, 40), "Bandeau", ink)
                if annotated:
                    self.paragraph(draw, feature["annotation"], (x+dx, y+dy+42, label_width, 104),
                                   "Bandeau", ink, weight=400)
            if below is not None:
                canvas = Image.blend(below, canvas, reveal)
                draw = ImageDraw.Draw(canvas)
        return canvas

    def _document(self, image, draw, scene):
        value, p = scene["document"], self.palette
        source = self.assets[value["asset"]]
        draw.rounded_rectangle((65, 490, 957, 1230), radius=20, fill=mix(p["ground"], p["gold"], .075))
        scale = min(470/source.width, 690/source.height)
        require(scale <= tokens.SUR_ECH_MAX, "Document enlargement exceeds the charter ceiling")
        document = source.resize((round(source.width*scale), round(source.height*scale)), Image.Resampling.LANCZOS)
        image.paste(document, (91+(470-document.width)//2, 510+(690-document.height)//2))
        draw.line((597, 552, 597, 1140), fill=mix(p["ground"], p["gold"], .35), width=2)
        self.paragraph(draw, value["label"], (625, 570, 275, 180), "Paire — terme", p["gold"])
        self.paragraph(draw, value["body"], (625, 795, 275, 365), "Corps")

    def visual(self, scene, instant):
        image = Image.new("RGB", (self.width, self.height), self.palette["ground"])
        draw = ImageDraw.Draw(image)
        local = min(scene["end"]-scene["start"]-1e-6, max(0, instant-scene["start"]))
        kind = scene["type"]
        if kind in ("map", "image"):
            content = self._map(scene, local) if kind == "map" else self._image(scene, local)
            image.paste(content, self.content[:2])
        elif kind == "timeline":
            background = scene["timeline"].get("background")
            if background:
                composed = bool(background.get("features") or background.get("highlights"))
                viewport = (45, 820, 1035, 1210) if composed else self.content
                content = self._map({"map": background}, local, viewport)
                if not composed:
                    content = Image.blend(Image.new("RGB", content.size, self.palette["ground"]), content, .6)
                image.paste(content, viewport[:2])
            draw_timeline(self, draw, scene, local)
        elif kind == "document":
            self._document(image, draw, scene)
        elif kind == "text":
            self.paragraph(draw, scene["text"], (self.left, 640, self.right-self.left, 470), "Corps")
        else:
            for index, item in enumerate(scene["comparison"]):
                if local < item.get("at", 0):
                    continue
                top = 540+index*210
                self.paragraph(draw, item["label"], (self.left, top, self.right-self.left, 100), "Paire — terme", self.palette["gold"])
                self.paragraph(draw, item["body"], (self.left, top+94, self.right-self.left, 100), "Corps")
        legend = []
        geographic = scene_map(scene)
        if geographic and (kind == "map" or geographic.get("features") or geographic.get("highlights")):
            legend.append(("Frontières actuelles en pointillé · Mercator" if geographic.get("border_style") == "dashed"
                           else "Frontières actuelles · Mercator") if geographic["borders"] else "Sans frontières actuelles · Mercator")
            for feature in geographic.get("features", []):
                if feature["at"] <= local < feature["until"]:
                    e = feature["evidence"]
                    meaning = {"journey": "Trajet", "migration": "Migration", "language-diffusion": "Diffusion linguistique",
                               "name-circulation": "Circulation du nom"}.get(feature.get("meaning"))
                    role = "Voisinage : " if feature.get("role") == "context" else ""
                    legend.append(f"{role}{feature['label']} · {e['period']} · {STATUS[e['status']]}" + (f" · {meaning}" if meaning else ""))
                    if feature.get("geometry_note"): legend.append(feature["geometry_note"])
        self.paragraph(draw, "\n".join(legend), (self.left, 1215 if kind == "timeline" else 1190, self.right-self.left, 115 if kind == "timeline" else 142), "Crédit", self.palette["night-ink-2"])
        return image

    def credits(self, scene):
        kind = scene["type"]
        credits = []
        asset_source = None
        asset_id = scene[kind]["asset"] if kind in ("map", "image", "document") else None
        if kind == "timeline" and "background" in scene["timeline"]:
            asset_id = scene["timeline"]["background"]["asset"]
        if asset_id:
            asset = self.plan["assets"][asset_id]
            credits.append(f"{asset['credit']} · {asset['license']}")
            asset_source = asset["source"]
        source_keys = list(scene["evidence"]["sources"])
        if kind == "timeline":
            for event in scene["timeline"]["events"] + scene["timeline"].get("context", []):
                source_keys.extend(event["evidence"]["sources"])
        geographic = scene_map(scene)
        if geographic:
            for feature in geographic.get("features", []):
                source_keys.extend(feature["evidence"]["sources"])
        refs = [self.plan["sources"][key] for key in dict.fromkeys(source_keys) if key != asset_source]
        if refs:
            credits.append(" · ".join(source.get("label", source["citation"]) for source in refs))
        return credits

    def render(self, instant):
        scene = scene_at(self.plan["scenes"], instant)
        transition = None if self.reduced_motion else transition_at(self.plan["scenes"], instant)
        image = self.visual(scene, instant)
        credits = self.credits(scene)
        heading = scene
        if transition:
            before, after, progress = transition
            previous = self.plan["scenes"][before]
            heading = previous if progress < .5 else scene
            old = self.visual(previous, previous["end"]-1e-6)
            if scene["transition"]["type"] == "fade":
                blank = Image.new("RGB", image.size, self.palette["ground"])
                image = Image.blend(old, blank, progress*2) if progress < .5 else Image.blend(blank, image, (progress-.5)*2)
            else:
                image = Image.blend(old, image, smooth(progress))
            credits = list(dict.fromkeys(self.credits(previous)+credits))
        draw = ImageDraw.Draw(image)
        # Switch the heading once; crossfading words makes both titles unreadable.
        corner = heading.get("timeline", {}).get("context_layout") == "corner"
        heading_width = 440 if corner else self.right-self.left
        self.paragraph(draw, heading["title"], (self.left, 198, heading_width, 215), "Titre de série", self.palette["gold"])
        ev = heading["evidence"]
        self.paragraph(draw, f"{ev['period']} · {STATUS[ev['status']]}",
                       (self.left, 426, heading_width, 85 if corner else 45), "Bandeau", self.palette["night-ink-2"])
        self.paragraph(draw, "ETHNIAFRICA", (self.left, 65, 380, 45), "Bandeau", self.palette["night-ink-2"])
        self.paragraph(draw, "L’AFRIQUE À TRAVERS SES NOMS", (self.left, 132, self.right-self.left, 45), "Bandeau", self.palette["night-ink-2"])
        caption = next((c for c in self.captions if c["debut"] <= instant < c["fin"]), None)
        if caption:
            self.paragraph(draw, caption["texte"], (self.left, 1380, self.right-self.left, 140), "Corps")
        self.paragraph(draw, "\n".join(credits), (self.left, 1530, self.right-self.left, 88), "Crédit", self.palette["night-ink-2"])
        if self.plan.get("progress", False):
            fraction = max(0, min(1, instant/self.duration))
            draw.line((self.left, 1615, self.right, 1615), fill=self.palette["night-ink-3"], width=3)
            if fraction:
                draw.line((self.left, 1615, self.left+(self.right-self.left)*fraction, 1615),
                          fill=self.palette["gold"], width=5)
        badge = Image.new("RGBA", (620, 68), ImageColor.getrgb(self.palette["ground"])+(240,))
        self.paragraph(ImageDraw.Draw(badge), "ÉPREUVE — NE PAS PUBLIER", (16, 12, 590, 50), "Bandeau", self.palette["night-ink-2"])
        badge = badge.rotate(-15, expand=True, resample=Image.Resampling.BICUBIC)
        image.paste(badge, (460, 25), badge)
        return image

    def preflight(self):
        """Inspect all caption content and scene/event/camera boundaries before encoding."""
        draw = ImageDraw.Draw(Image.new("RGB", (self.width, self.height)))
        for caption in self.captions:
            self.paragraph(draw, caption["texte"], (self.left, 1380, self.right-self.left, 140), "Corps")
        instants = set()
        for scene in self.plan["scenes"]:
            start, end = scene["start"], scene["end"]
            instants.update((start, (start+end)/2, end-1e-6))
            length = scene.get("transition", {}).get("duration", 0)
            if length: instants.add(start+length/2)
            geographic = scene_map(scene)
            if geographic:
                instants.update(start+k["at"] for k in geographic["camera"] if start+k["at"] < end)
                for f in geographic.get("features", []):
                    instants.update((start+f["at"], start+f["until"]-1e-6, min(end-1e-6, start+f["until"])))
                    if "draw_seconds" in f:
                        instants.add(start+f["at"]+f["draw_seconds"]/2)
                        instants.add(min(end-1e-6, start+f["at"]+f["draw_seconds"]))
                    if "fade_seconds" in f:
                        instants.update((start+f["at"]+f["fade_seconds"]/2,
                                         min(end-1e-6, start+f["at"]+f["fade_seconds"])))
            if scene["type"] == "comparison":
                instants.update(start+i.get("at", 0) for i in scene["comparison"] if start+i.get("at", 0) < end)
            if scene["type"] == "timeline":
                timeline = scene["timeline"]
                cues = [i["at"] for i in timeline["events"]+timeline.get("context", [])]
                instants.update(start+cue for cue in cues)
                if timeline.get("layout") == "focus":
                    instants.update(min(end-1e-6, start+cue+delta) for cue in cues for delta in (.25, .85))
                    if "overview_at" in timeline:
                        instants.update(min(end-1e-6, start+timeline["overview_at"]+delta) for delta in (0, .55, 1.1))
        for instant in sorted(instants):
            self.render(instant)
        return sorted(instants)
