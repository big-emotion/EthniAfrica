"""Reading-list carousel: one cut-out cover per card on the night ground.

An opening card names the list and counts its books, each book card shows its
cover whole with title, author and credit, and the closing card is the project's
unique closing. Copy wraps at its fixed size; a title that does not fit is a
proof, never smaller type. Geometry is measured here and painted in `render`.
"""
from PIL import Image, ImageDraw, ImageFilter

import ethni_tokens as tk

STYLE = "lectures-afrique-v1"
REPORT_TITLE = "Présentation des lectures"
REPORT_NOTE = [
    "Une carte d'ouverture, une carte par livre (couverture entière sur fond nuit) et la clôture unique.",
    "Le quota A/B/C des carrousels de noms ne s'applique pas à ce profil.",
]

LEFT, WIDTH = 68, 944
COVER_BOX = (LEFT, 215, WIDTH, 785)  # x, y, w, h — the cover is contained inside


def _wrap(value, font, width, measure):
    from ethni_compose import largeur_texte
    lines = []
    for paragraph in value.split("\n"):
        current = ""
        for word in paragraph.split():
            trial = (current + " " + word).strip()
            if current and largeur_texte(trial, font) > width:
                lines.append(current)
                current = word
            else:
                current = trial
        if current:
            lines.append(current)
    return lines


def plan(card, deck, fmt_key, image):
    from ethni_compose import Bloc, Plan, fonte

    if fmt_key != "carrousel":
        raise ValueError("Lectures d'Afrique : seul le carrousel 1080 × 1350 existe")
    p = Plan(disposition=STYLE)
    ink = tk.color("--afh-night-ink")
    muted = tk.color("--afh-night-ink-2")
    accent = tk.color("--afh-night-ocre-soft")
    measure = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    cards = deck["cartes"]
    total = len(cards)
    role = card["role"]

    def text(name, value, x, y, size, width, bottom, color=ink,
             face="nunito", weight=700, step=None, max_lines=None):
        """Place wrapped copy; returns its height so the next block can follow."""
        if not value:
            return 0
        font = fonte(face, size, weight)
        lines = _wrap(value, font, width, measure)
        if not lines:
            return 0
        leading = step or round(size * 1.3)
        actual_width = max(measure.textbbox((0, 0), line, font=font)[2] for line in lines)
        height = (len(lines) - 1) * leading + max(
            measure.textbbox((0, 0), line, font=font)[3] for line in lines)
        p.blocs.append(Bloc(name, x, y, actual_width, height, value, color,
                            size, face, weight, tuple(lines), leading / size))
        if actual_width > width or y + height > bottom or (max_lines and len(lines) > max_lines):
            p.fautes.append(f"{name} déborde sa zone : raccourcir le texte, sans réduire le corps")
        return height

    text("marque", "ETHNIAFRICA", LEFT, 74, 29, 760, 129)
    text("entete-rang", f"{card['rang']:02d} / {total:02d}", 894, 74, 29, 118, 129, accent)
    banner = "Lectures d'Afrique" if role == "ouverture" else cards[0]["titre"]
    text("entete-bandeau", banner.upper(), LEFT, 158, 26, WIDTH, 202, accent)
    text("signature", "ETHNIAFRICA", LEFT, 1228, 31, 830, 1269)
    text("signature-detail", "LECTURES D'AFRIQUE", LEFT, 1272, 22, 830, 1310, muted)

    if role == "ouverture":
        books = sum(1 for c in cards if c["role"] == "serie")
        top = 300
        height = text("titre", card["titre"].upper(), LEFT, top, 118, WIDTH, 800,
                      face="anton", weight=400, step=140, max_lines=4)
        count = f"{books} LIVRE" + ("S" if books > 1 else "")
        text("compte", count, LEFT, top + height + 44, 146, WIDTH, 1000, accent,
             "anton", 400, max_lines=1)
        text("corps", "Le titre, l'année et de quoi ils parlent : dans la légende.",
             LEFT, 1040, 40, 900, 1150, muted, weight=600, max_lines=2)
    elif role == "serie":
        if image is None:
            p.fautes.append("image manquante")
        else:
            bx, by, bw, bh = COVER_BOX
            scale = min(bw / image.width, bh / image.height)
            w, h = round(image.width * scale), round(image.height * scale)
            p.blocs.append(Bloc("bande-image", bx + (bw - w) // 2, by + (bh - h) // 2, w, h))
            if scale > tk.SUR_ECH_MAX:
                p.fautes.append(f"agrandissement ×{scale:.2f} : choisir une image mieux définie")
        # 38 px is the size at which the longest real title on the shelf (73
        # characters) still fits two lines; it is one size for every book.
        height = text("titre", card["titre"], LEFT, 1012, 38, WIDTH, 1110, step=48, max_lines=2)
        text("precision", card.get("precision") or "", LEFT, 1012 + height + 8, 31, WIDTH,
             1160, accent, weight=600, max_lines=1)
        asset = card.get("image") or {}
        text("credit", card.get("source") or asset.get("credit") or "", LEFT, 1162, 22,
             WIDTH, 1196, muted, weight=600, max_lines=1)
    else:
        height = text("titre", card["titre"].upper(), LEFT, 282, 96, WIDTH, 700,
                      face="anton", weight=400, step=120, max_lines=4)
        body = text("corps", card.get("corps") or "", LEFT, 282 + height + 40, 52, 920, 1010,
                    weight=600, step=68, max_lines=4)
        text("adresse", "ETHNIAFRICA.COM", LEFT, 282 + height + body + 90, 64, WIDTH, 1190,
             accent, "anton", 400, max_lines=1)
    return p


def _shadow(size, box, offset=10, radius=18, alpha=150):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    x, y, w, h = box
    ImageDraw.Draw(layer).rectangle((x, y + offset, x + w, y + h + offset), fill=(0, 0, 0, alpha))
    return layer.filter(ImageFilter.GaussianBlur(radius))


def render(card, deck, fmt_key, image, p, *, text=True, proof=None):
    from ethni_compose import fonte, peindre_texte, _tamponner_epreuve

    im = Image.new("RGBA", (1080, 1350), tk.color("--afh-night-ground"))
    draw = ImageDraw.Draw(im)
    accent = tk.color("--afh-night-ocre-soft")
    for y in (129, 1198):
        draw.line((LEFT, y, 1012, y), fill=accent, width=2)
    if card["rang"] < len(deck["cartes"]):
        draw.line((938, 1254, 989, 1254), fill=accent, width=4)
        draw.line((975, 1240, 989, 1254, 975, 1268), fill=accent, width=4)
    cover = p.bloc("bande-image")
    if cover and image is not None:
        im.alpha_composite(_shadow(im.size, (cover.x, cover.y, cover.w, cover.h)))
        fitted = image.convert("RGB").resize((cover.w, cover.h), Image.Resampling.LANCZOS)
        im.paste(fitted, (cover.x, cover.y))
    if text:
        for block in p.blocs:
            if not block.texte:
                continue
            for row, line in enumerate(block.lignes):
                peindre_texte(draw, (block.x, block.y + row * round(block.corps * block.interligne)),
                              line, fonte(block.face, block.corps, block.graisse), block.couleur)
    if proof:
        _tamponner_epreuve(im, proof, deck, p)
    return im
