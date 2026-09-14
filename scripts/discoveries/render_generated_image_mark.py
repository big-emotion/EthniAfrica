"""Render the disclosure mark burned into every generated-image download.

Run once, by hand, with the render engine's virtualenv:

    social/harness/venv/bin/python scripts/discoveries/render_generated_image_mark.py

and commit the PNG it writes. `deriveGeneratedImages.ts` only tints, scales and
composites that file.

Why a committed raster rather than text drawn at derivation time: sharp draws
text through Pango and fontconfig, and neither reads a font file the repository
ships — measured 2026-09-14, `fontfile` and a `FONTCONFIG_FILE` pointing at
`social/harness/fonts` both rendered the same default sans at the same width.
A mark whose typeface depends on the machine running the script is not a mark.
Pillow does read the file, and the harness already pins Fraunces' weight axis,
so the glyphs here are the watermark's own.

The mark is drawn white on transparency, four times its largest use: only the
alpha channel carries information, and the derivation lays one flat ink under
it, exactly as `ethni_brand.filigrane` does.
"""
import pathlib
import sys

from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
sys.path.insert(0, str(REPO / "social" / "harness"))

import ethni_brand  # noqa: E402

LABEL = "image générée"
HEIGHT = 128  # 4 × the 32 px the derivation composites at 1080 wide
OUT = HERE / "assets" / "generated-image-mark.png"


def render():
    text_font = ethni_brand._fraunces(round(HEIGHT * 0.62), 700)
    icon = ethni_brand.logo().copy()
    icon.thumbnail((HEIGHT, HEIGHT), Image.Resampling.LANCZOS)

    probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    box = probe.textbbox((0, 0), LABEL, font=text_font)
    gap = round(HEIGHT * 0.28)
    width = icon.width + gap + (box[2] - box[0])

    canvas = Image.new("RGBA", (width, HEIGHT), (0, 0, 0, 0))
    # The icon's own colours are discarded: at 32 px a five-colour map reads as
    # a second accent (GABARITS-SOCIAL §7 bis), so only its silhouette is kept.
    silhouette = Image.new("RGBA", icon.size, (255, 255, 255, 0))
    silhouette.putalpha(icon.getchannel("A"))
    canvas.alpha_composite(silhouette, (0, (HEIGHT - icon.height) // 2))

    draw = ImageDraw.Draw(canvas)
    text_height = box[3] - box[1]
    draw.text(
        (icon.width + gap - box[0], (HEIGHT - text_height) / 2 - box[1]),
        LABEL,
        font=text_font,
        fill=(255, 255, 255, 255),
    )
    canvas = canvas.crop(canvas.getbbox())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, optimize=True)
    print(f"{OUT.relative_to(REPO)} {canvas.width}x{canvas.height}")


if __name__ == "__main__":
    render()
