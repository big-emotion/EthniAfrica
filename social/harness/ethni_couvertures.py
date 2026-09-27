"""Images for a reading list: each cover is the photograph of its own card.

    ./venv/bin/python ethni_couvertures.py <Sujet>

Every carousel keeps the account's look, so a book card is the standard layout: the
cover, cut out and straightened beforehand, fills the frame like any photograph and the
usual text column sits over it. A cover too small for the full frame falls back to the
standard cartouche by the engine's own resolution rule; nothing here decides that.

Only the opening and the closing need an image made: every cover of the selection side
by side, on the deck's ground, above the start of that card's own veil. Covers are read
from `<projet>/couvertures/<image.couverture>` and the images are written to
`<projet>/assets/<image.fichier>`.
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter

import ethni_compose as gab
from ethni_paths import resolve_project

W, H = 1080, 1350
TOP = 64
LEFT, WIDTH = 90, 900
MIN_ZONE = 200
# How far into the veil ramp a mosaic may reach: it melts into the ground like a photograph.
RAMP_KEEP = 190


def _ground(deck):
    return gab._rgb(gab._fond(deck))


def free_zone(card, deck):
    """(x, y, w, h) above the veil the engine will draw under this card's own text."""
    blank = Image.new("RGB", (W, H), _ground(deck))
    plan = gab.plan(card, deck, "carrousel", image=blank)
    banner = plan.bloc("entete-bandeau")
    ramp = plan.bloc("voile-rampe")
    if banner.y < H // 4:
        # Layout B puts the banner at the top and the title lower: the zone is what lies between.
        top = banner.y + banner.h + 24
        return (LEFT, top, WIDTH, max(MIN_ZONE, plan.bloc("titre").y - 24 - top))
    return (LEFT, TOP, WIDTH, max(MIN_ZONE, min(ramp.y + RAMP_KEEP, banner.y - 12) - TOP))


def _shadow(canvas, x, y, w, h):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rectangle((x, y + 8, x + w, y + h + 8), fill=(0, 0, 0, 120))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(14)))


def _place(canvas, cover, box):
    bx, by, bw, bh = box
    scale = min(bw / cover.width, bh / cover.height)
    w, h = round(cover.width * scale), round(cover.height * scale)
    x, y = bx + (bw - w) // 2, by + (bh - h) // 2
    _shadow(canvas, x, y, w, h)
    canvas.paste(cover.convert("RGB").resize((w, h), Image.Resampling.LANCZOS), (x, y))


def prepare_cover(cover, card, deck):
    """A book card's photograph is the cover, unaltered."""
    return cover.convert("RGB")


def prepare_mosaic(covers, card, deck):
    """Every cover of the selection side by side, in one or two rows, whichever shows them larger."""
    x, y, w, h = free_zone(card, deck)
    best = None
    for rows in (1, 2):
        cols = -(-len(covers) // rows)
        cell_w, cell_h = w / cols, h / rows
        area = sum(min(cell_w / c.width, cell_h / c.height) ** 2 * c.width * c.height for c in covers)
        if best is None or area > best[0]:
            best = (area, rows, cols)
    _, rows, cols = best
    cell_w, cell_h = w / cols, h / rows
    canvas = Image.new("RGBA", (W, H), _ground(deck) + (255,))
    for i, cover in enumerate(covers):
        row, col = divmod(i, cols)
        in_row = min(cols, len(covers) - row * cols)
        indent = (cols - in_row) * cell_w / 2  # a short last row stays centred
        _place(canvas, cover, (round(x + indent + col * cell_w + 8), round(y + row * cell_h + 6),
                               round(cell_w - 16), round(cell_h - 12)))
    return canvas.convert("RGB")


def prepare_project(root):
    root = pathlib.Path(root)
    deck = json.loads((root / "cards.json").read_text(encoding="utf-8"))
    sources = root / "couvertures"
    assets = root / "assets"
    assets.mkdir(exist_ok=True)
    books = [Image.open(sources / c["image"]["couverture"]).convert("RGB")
             for c in deck["cartes"] if c["role"] == "serie"]
    for card in deck["cartes"]:
        if card["role"] == "serie":
            image = prepare_cover(Image.open(sources / card["image"]["couverture"]), card, deck)
        else:
            image = prepare_mosaic(books, card, deck)
        image.save(assets / card["image"]["fichier"])
    return deck


def main():
    root = resolve_project(sys.argv[1] if len(sys.argv) > 1 else None)
    prepare_project(root)
    print(f"images écrites dans {root / 'assets'}")


if __name__ == "__main__":
    main()
