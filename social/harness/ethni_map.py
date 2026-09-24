"""Source-timed animated maps, rendered locally from explicit GeoJSON.

This proof layer does not infer territories, routes or historical boundaries.
Its camera, point labels and dated events are supplied by the storyboard.
"""
from dataclasses import dataclass
import math

from PIL import Image, ImageDraw, ImageColor

import ethni_tokens as tokens
from ethni_type import font


def mercator(latitude):
    latitude = max(-85, min(85, latitude))
    return math.degrees(math.log(math.tan(math.pi / 4 + math.radians(latitude) / 2)))


@dataclass
class Camera:
    bounds: tuple
    viewport: tuple

    def __post_init__(self):
        west, south, east, north = self.bounds
        x, y, width, height = self.viewport
        if not (-180 <= west < east <= 180 and -85 <= south < north <= 85
                and width > 0 and height > 0):
            raise ValueError("Invalid geographic bounds or viewport")
        bottom, top = mercator(south), mercator(north)
        self.scale = min(width / (east - west), height / (top - bottom))
        self.centre = ((west + east) / 2, (top + bottom) / 2)
        self.origin = (x + width / 2, y + height / 2)

    def project(self, point):
        lon, lat = point
        return (self.origin[0] + (lon - self.centre[0]) * self.scale,
                self.origin[1] - (mercator(lat) - self.centre[1]) * self.scale)


def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


def camera_at(keys, instant):
    if instant <= keys[0]["at"]:
        return tuple(keys[0]["bounds"])
    for left, right in zip(keys, keys[1:]):
        if instant <= right["at"]:
            u = smooth((instant - left["at"]) / (right["at"] - left["at"]))
            return tuple(a + (b - a) * u for a, b in zip(left["bounds"], right["bounds"]))
    return tuple(keys[-1]["bounds"])


def excerpt_words(words, cuts):
    """Retain complete aligned words and rebase them onto the edited audio."""
    out, offset = [], 0.0
    for start, end in cuts:
        if not 0 <= start < end:
            raise ValueError("Audio cuts must have positive duration")
        for word in words:
            a, b = word["start"], word["end"]
            if b <= start or a >= end:
                continue
            if a < start - .001 or b > end + .001:
                raise ValueError(f"Audio cut splits the word {word['word']!r}")
            out.append(dict(word, start=a - start + offset, end=b - start + offset))
        offset += end - start
    return out


def visible_events(events, instant):
    return [event for event in events if event["at"] <= instant]


def partial_path(points, progress):
    """Reveal a polyline by distance; never invent intermediate route points."""
    if not points:
        return []
    distances = [math.dist(a, b) for a, b in zip(points, points[1:])]
    remaining = sum(distances) * max(0, min(1, progress))
    result = [points[0]]
    if remaining == 0:
        return result
    for a, b, length in zip(points, points[1:], distances):
        if remaining >= length:
            result.append(b)
            remaining -= length
        elif length:
            result.append(tuple(x + (y - x) * remaining / length for x, y in zip(a, b)))
            break
    return result


def mix(a, b, fraction):
    a, b = ImageColor.getrgb(a), ImageColor.getrgb(b)
    return tuple(round(x + (y - x) * fraction) for x, y in zip(a, b))


class MapProof:
    """A vertical geographic proof with a moving camera and timed evidence."""
    def __init__(self, config, geometry, captions):
        self.config, self.captions = config, captions
        self.palette = tokens.palette()
        self.width, self.height = tokens.fmt("reel")["w"], tokens.fmt("reel")["h"]
        self.margin = round(84 * tokens.fmt("reel")["k"])
        self.safe_right = self.width - 180
        self.polygons = []
        for feature in geometry["features"]:
            geom = feature["geometry"]
            if geom["type"] not in ("Polygon", "MultiPolygon"):
                raise ValueError("The basemap must contain polygons")
            polygons = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
            for rings in polygons:
                self.polygons.append((feature["properties"]["ADM0_A3"], rings))
        self.sizes = {role: tokens.type_size(role, "reel") for role in
                      ("Bandeau", "Rang", "Titre de série", "Paire — terme", "Corps", "Source", "Crédit")}
        self.ground = self.palette["ground"]

    def text(self, draw, point, text, role="Corps", colour=None, anchor="la"):
        face = "anton" if role in ("Titre de série", "Paire — terme") else "nunito"
        draw.text(point, text, font=font(self.sizes[role], face, 700),
                  fill=colour or self.palette["white"], anchor=anchor)

    def render(self, instant, reduced_motion=False):
        p = self.palette
        image = Image.new("RGB", (self.width, self.height), self.ground)
        draw = ImageDraw.Draw(image)
        section = next(s for s in reversed(self.config["sections"]) if s["at"] <= instant)
        camera_time = section.get("camera_hold", instant) if reduced_motion else instant
        camera = Camera(camera_at(self.config["camera"], camera_time), (35, 440, 980, 735))
        map_layer = Image.new("RGB", image.size, self.ground)
        md = ImageDraw.Draw(map_layer)
        grid = mix(self.ground, p["night-ink-3"], .17)
        for lon in range(-180, 181, 5):
            md.line([camera.project((lon, -80)), camera.project((lon, 80))], fill=grid, width=1)
        for lat in range(-80, 81, 5):
            md.line([camera.project((-180, lat)), camera.project((180, lat))], fill=grid, width=1)
        for iso, rings in self.polygons:
            ring = [camera.project(point) for point in rings[0]]
            xs, ys = zip(*ring)
            if max(xs) < 0 or min(xs) > self.width or max(ys) < 430 or min(ys) > 1200:
                continue
            highlight = iso in self.config.get("highlight_countries", [])
            fill = mix(self.ground, p["gold"] if highlight else p["night-ink-2"], .20 if highlight else .12)
            md.polygon(ring, fill=fill)
            md.line(ring, fill=mix(self.ground, p["night-ink-2"], .5), width=2, joint="curve")
            for hole in rings[1:]:
                md.polygon([camera.project(point) for point in hole], fill=self.ground)

        # A locator is explicitly a point, not an invented historical polygon.
        if instant >= self.config.get("markers_at", 0):
            for marker in self.config.get("markers", []):
                x, y = camera.project(marker["point"])
                if not (50 < x < self.safe_right - 70 and 470 < y < 1090):
                    continue
                pulse = 16 if reduced_motion else 16 + 7 * (1 + math.sin(instant * 2))
                md.ellipse((x-pulse, y-pulse, x+pulse, y+pulse),
                           outline=mix(self.ground, p["gold"], .5), width=2)
                md.ellipse((x-5, y-5, x+5, y+5), fill=p["gold"])
                dx, dy = marker.get("offset", [25, -25])
                self.text(md, (x+dx, y+dy), marker["label"], "Corps")
        for label in self.config.get("country_labels", []):
            if instant < label.get("at", 0):
                continue
            if camera.bounds[2] - camera.bounds[0] > label.get("max_span", 360):
                continue
            x, y = camera.project(label["point"])
            if 80 < x < self.safe_right - 150 and 470 < y < 1090:
                # Flag colours come from cited national-flag assets, not brand tokens.
                stripes = label.get("flag_stripes", [])
                for i, colour in enumerate(stripes):
                    md.rectangle((x+i*12, y, x+(i+1)*12, y+24), fill=colour)
                self.text(md, (x+49, y-4), label["label"], "Bandeau", p["night-ink-2"])
        image.paste(map_layer.crop((0, 430, self.width, 1200)), (0, 430))
        draw = ImageDraw.Draw(image)

        # A soft edge lets the geographic scene occupy the frame without a card border.
        for y in range(430, 470):
            alpha = round(255 * (1 - (y-430)/40))
            veil = Image.new("RGBA", (self.width, 1), ImageColor.getrgb(self.ground)+(alpha,))
            image.paste(veil, (0, y), veil)
        for y in range(1150, 1200):
            alpha = round(255 * ((y-1150)/50))
            veil = Image.new("RGBA", (self.width, 1), ImageColor.getrgb(self.ground)+(alpha,))
            image.paste(veil, (0, y), veil)

        self.text(draw, (self.margin, 132), self.config["eyebrow"], "Bandeau", p["night-ink-2"])
        self.text(draw, (self.margin, 198), section["title"], "Titre de série", p["gold"])
        self.text(draw, (self.margin, 340), section["subtitle"], "Corps", p["night-ink-2"])
        self.text(draw, (self.margin, 410), section["chapter"], "Rang", p["night-ink-2"])

        # Timelines represent documentary dates only. No map route is inferred from them.
        events = self.config.get("events", [])
        shown = visible_events(events, instant)
        if events and instant >= events[0]["at"]:
            xs = [self.margin + i * 270 for i in range(len(events))]
            y = 1255
            draw.line((xs[0], y, xs[-1], y), fill=p["night-ink-3"], width=2)
            for i, event in enumerate(events):
                active = event in shown
                colour = p["gold"] if active else p["night-ink-3"]
                draw.ellipse((xs[i]-5, y-5, xs[i]+5, y+5), fill=colour)
                if active:
                    self.text(draw, (xs[i], y-80), event["year"], "Paire — terme", colour)
                    self.text(draw, (xs[i], y+22), event["label"], "Bandeau", p["night-ink-2"])
        else:
            self.text(draw, (self.margin, 1220), self.config["locator_title"], "Paire — terme")
            self.text(draw, (self.margin, 1300), self.config["locator_subtitle"], "Corps", p["night-ink-2"])

        caption = next((c for c in self.captions if c["debut"] <= instant < c["fin"]), None)
        if caption:
            import ethni_soustitre as subtitles
            f = font(self.sizes["Corps"], "nunito", 700)
            lines = subtitles.envelopper(caption["texte"], mesure=lambda t: draw.textlength(t, font=f),
                                         largeur_max=self.safe_right-self.margin-10)
            for i, line in enumerate(lines):
                self.text(draw, (self.margin, 1410+i*49), line, "Corps")
        self.text(draw, (self.margin, 1540), section["source"], "Crédit", p["night-ink-2"])
        self.text(draw, (self.margin, 1572), self.config["map_credit"], "Crédit", p["night-ink-2"])

        # Always visibly a proof, even when detached from its filename or folder.
        badge = Image.new("RGBA", (620, 64), ImageColor.getrgb(self.ground)+(240,))
        bd = ImageDraw.Draw(badge)
        self.text(bd, (16, 13), "ÉPREUVE — NE PAS PUBLIER", "Bandeau", p["night-ink-2"])
        badge = badge.rotate(-15, expand=True, resample=Image.Resampling.BICUBIC)
        image.paste(badge, (460, 25), badge)
        self.text(draw, (self.margin, 65), "ETHNIAFRICA · POC", "Rang", p["night-ink-2"])
        draw.line((self.margin, 1840, self.margin+(self.safe_right-self.margin)*min(1, instant/self.config["duration"]), 1840),
                  fill=p["gold"], width=3)
        return image
