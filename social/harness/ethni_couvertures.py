"""Light 4:5 images for a reading list: each cover on the deck's ground, above its own veil.

    ./venv/bin/python ethni_couvertures.py <Sujet>

The standard layout A writes its text column over a prepared image, as the Griot deck's
light cards do. A book cover is an object with its own margins, so it must not sit under
that column: the free zone is read from the engine's own plan for *this* card, because a
long title makes a taller column and a shorter zone. Covers are read from
`<projet>/couvertures/<image.couverture>` (cut out and straightened beforehand) and the
prepared images are written to `<projet>/assets/<image.fichier>`.
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
# How far into the veil ramp a cover may reach: it melts into the ground like a photograph
# of the other decks instead of stopping on a hard line above a void.
RAMP_KEEP = 190


def _ground(deck):
    return gab._rgb(gab._fond(deck))


def free_zone(card, deck):
    """(x, y, w, h) above the veil the engine will draw under this card's own text."""
    blank = Image.new("RGB", (W, H), _ground(deck))
    ramp = gab.plan(card, deck, "carrousel", image=blank).bloc("voile-rampe")
    return (LEFT, TOP, WIDTH, max(MIN_ZONE, ramp.y + RAMP_KEEP - TOP))


def _shadow(canvas, x, y, w, h):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).rectangle((x, y + 8, x + w, y + h + 8), fill=(60, 40, 20, 95))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(14)))


def _place(canvas, cover, box):
    bx, by, bw, bh = box
    scale = min(bw / cover.width, bh / cover.height)
    w, h = round(cover.width * scale), round(cover.height * scale)
    x, y = bx + (bw - w) // 2, by + (bh - h) // 2
    _shadow(canvas, x, y, w, h)
    canvas.paste(cover.convert("RGB").resize((w, h), Image.Resampling.LANCZOS), (x, y))


def prepare_cover(cover, card, deck):
    canvas = Image.new("RGBA", (W, H), _ground(deck) + (255,))
    _place(canvas, cover, free_zone(card, deck))
    return canvas.convert("RGB")


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
        out = assets / card["image"]["fichier"]
        if card["role"] == "serie":
            image = prepare_cover(Image.open(sources / card["image"]["couverture"]), card, deck)
        else:
            image = prepare_mosaic(books, card, deck)
        image.save(out)
    return deck


def main():
    root = resolve_project(sys.argv[1] if len(sys.argv) > 1 else None)
    prepare_project(root)
    print(f"images claires écrites dans {root / 'assets'}")


if __name__ == "__main__":
    main()
