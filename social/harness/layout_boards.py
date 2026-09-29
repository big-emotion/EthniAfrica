#!/usr/bin/env python3
"""Draw the synthetic fixture decks and lay them out as review boards.

    ./venv/bin/python layout_boards.py --out <directory outside the repository>

One contact sheet per deck and per viewing width, phone widths first, so a review
starts at 320 px and only then looks larger. Everything drawn is a placeholder from
`layout_fixtures.py`: the boards judge composition, never an episode's copy.
"""
import argparse
import pathlib

from PIL import Image, ImageDraw

import ethni_carousel_layouts as layouts
import ethni_compose as gab
import layout_fixtures as fx
from test_carousel_profiles import musical_deck

GAP = 16
BACKDROP = (236, 232, 224)


def decks():
    music = musical_deck()
    for card in music["cartes"]:
        card["image"].update({"fichier": "p.png", "w": fx.W, "h": fx.H})
    return {
        "story": fx.story_deck(), "route": fx.route_deck(),
        "comparison": fx.comparison_deck(), "listening": fx.listening_deck(),
        "music-series": music, "name-control": fx.name_carousel_deck(),
    }


def compose_all(deck):
    images = fx.images_for(deck)
    return [(card, gab.composer(card, deck, "carrousel", image=images[card["rang"]]).convert("RGB"),
             gab.plan(card, deck, "carrousel", image=images[card["rang"]]))
            for card in deck["cartes"]]


def sheet(rendered, width):
    """Cards side by side at `width` px each, wrapped to the phone-sized row a
    reviewer would scroll: three per row at 320-430, five at larger widths."""
    per_row = 3 if width <= 430 else 5
    scale = width / rendered[0][1].width
    height = round(rendered[0][1].height * scale)
    rows = -(-len(rendered) // per_row)
    canvas = Image.new("RGB", (per_row * (width + GAP) + GAP, rows * (height + 40 + GAP) + GAP),
                       BACKDROP)
    draw = ImageDraw.Draw(canvas)
    for index, (card, image, plan) in enumerate(rendered):
        x = GAP + (index % per_row) * (width + GAP)
        y = GAP + (index // per_row) * (height + 40 + GAP)
        canvas.paste(image.resize((width, height), Image.Resampling.LANCZOS), (x, y + 40))
        if width < 320:  # thumbnail strip: only the cover is judged at this width
            problems = (layouts.thumbnail_problems(plan, "carrousel")
                        if card.get("composition") == "cover" else [])
        else:
            problems = layouts.readability_problems(plan, "carrousel", width)
        label = f"{card['rang']} {card.get('composition') or 'standard'} {plan.disposition}"
        draw.text((x, y + 12), label + ("  ! " + problems[0][:40] if problems else ""),
                  fill=(20, 20, 20))
    return canvas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--widths", default="160,320,390,430,768")
    args = parser.parse_args()
    out = pathlib.Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for name, deck in decks().items():
        rendered = compose_all(deck)
        for width in (int(w) for w in args.widths.split(",")):
            sheet(rendered, width).save(out / f"{name}-{width}.png")
        for card, image, _ in rendered:
            image.save(out / f"{name}-card{card['rang']:02d}.png")
        print(f"{name}: {len(rendered)} cards")


if __name__ == "__main__":
    main()
