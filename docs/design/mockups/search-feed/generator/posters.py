"""Draw the poster of every short the boards show, as the production pipeline's
exported cover would look: 9:16, burnt-in Anton title, last word on the accent.
The feed renders a poster as an image, so the boards must too."""
import os, sys, unicodedata
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cases import CASES

FONT = sys.argv[1]
OUT = os.path.join(HERE, "posters")
os.makedirs(OUT, exist_ok=True)
W, H = 320, 568
GROUNDS = [(91, 58, 28), (45, 59, 52), (74, 36, 24), (59, 53, 82), (58, 42, 20), (36, 64, 70)]
INK, ACCENT, DARK = (241, 231, 216), (232, 185, 106), (18, 14, 10)


def slug(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return "".join(c if c.isalnum() else "-" for c in s).strip("-")


def fit(draw, text, max_w, start):
    size = start
    while size > 20:
        f = ImageFont.truetype(FONT, size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return ImageFont.truetype(FONT, size)


names = []
for c in CASES:
    for item in c.get("shorts", {}).get("items", []):
        if item[0] not in names:
            names.append(item[0])

for i, name in enumerate(names):
    top = GROUNDS[i % len(GROUNDS)]
    img = Image.new("RGB", (W, H), DARK)
    px = img.load()
    for y in range(H):
        t = min(1.0, y / (H * 0.78))
        row = tuple(int(top[k] * (1 - t) + DARK[k] * t) for k in range(3))
        for x in range(W):
            px[x, y] = row
    d = ImageDraw.Draw(img)
    f1 = ImageFont.truetype(FONT, 44)
    f2 = fit(d, name.upper() + " ?", W - 40, 64)
    d.text((20, H - 196), "D'OÙ VIENT", font=f1, fill=INK)
    d.text((20, H - 140), name.upper() + " ?", font=f2, fill=ACCENT)
    fs = ImageFont.truetype(FONT, 16)
    d.text((20, H - 44), "ETHNIAFRICA.COM", font=fs, fill=INK)
    img.save(os.path.join(OUT, f"{slug(name)}.jpg"), "JPEG", quality=80, optimize=True)

print(len(names), "posters:", ", ".join(slug(n) for n in names))
