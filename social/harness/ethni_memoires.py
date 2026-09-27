"""Approved Mémoires sonores composition, measured before it is painted.

The six fixed stages follow MEMOIRES-SONORES.md and its approved PNGs. Copy
wraps at its approved size; overflow becomes a proof, never smaller type.
"""
from PIL import Image, ImageDraw, ImageOps

import ethni_tokens as tk

STYLE = "memoires-sonores-v1"
SECTIONS = {
    "accroche": "", "contexte": "Le contexte", "histoire": "L’histoire",
    "detail-musical": "Le détail musical", "ecoute": "L’écoute",
    "references": "Les références",
}


def plan(card, deck, fmt_key, image):
    from ethni_compose import Bloc, Plan, fonte, largeur_texte

    p = Plan(disposition=STYLE)
    if fmt_key != "carrousel":
        raise ValueError("Mémoires sonores : seul le carrousel 1080 × 1350 est approuvé")
    ink = tk.color("--afh-night-ink")
    muted = tk.color("--afh-night-ink-2")
    accent = tk.color("--afh-night-ocre-soft")
    stage = card["etape"]
    measure = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    def text(name, value, x, y, size, width, bottom, color=ink,
             face="nunito", weight=700, step=None):
        if not value:
            return
        font = fonte(face, size, weight)
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
        if not lines:
            return
        leading = step or round(size * 1.3)
        actual_width = max(measure.textbbox((0, 0), line, font=font)[2] for line in lines)
        height = (len(lines) - 1) * leading + max(
            measure.textbbox((0, 0), line, font=font)[3] for line in lines)
        p.blocs.append(Bloc(name, x, y, actual_width, height, value, color,
                            size, face, weight, tuple(lines), leading / size))
        if actual_width > width or y + height > bottom:
            p.fautes.append(f"{name} déborde sa zone : raccourcir le texte, sans réduire le corps")

    text("marque", "ETHNIAFRICA", 68, 74, 29, 760, 129)
    text("entete-rang", f"{card['rang']:02d} / 06", 894, 74, 29, 118, 129, accent)
    text("entete-bandeau", "MÉMOIRES SONORES", 68, 158, 29, 944, 202, accent)
    section = (deck.get("sujet") or deck["musique"]["artiste"]) if stage == "accroche" else SECTIONS[stage]
    text("section", section.upper(), 68, 207, 25, 944, 262, muted)
    text("signature", "ETHNIAFRICA", 68, 1228, 31, 830, 1269)
    text("signature-detail", "MUSIQUES · HISTOIRES · TRANSMISSIONS", 68, 1272, 22, 830, 1310, muted)
    if card["rang"] == 6:
        text("fin", "06", 936, 1230, 48, 76, 1310, accent)

    title = "\n".join(card.get("coupe") or [card["titre"]]).upper()
    body, note = card.get("corps") or "", card.get("punchline") or ""
    if stage == "accroche":
        text("titre", title, 68, 300, 103, 490, 950, face="anton", weight=400, step=128)
        text("corps", body, 68, 970, 31, 490, 1012, accent)
        text("punchline", note, 68, 1014, 31, 490, 1114, muted)
    elif stage == "contexte":
        text("titre", title, 68, 286, 110, 944, 433, face="anton", weight=400)
        text("precision", card.get("precision") or "", 68, 433, 146, 944, 660, accent, "anton", 400)
        text("corps", body, 68, 675, 57, 915, 1015, weight=600)
        text("punchline", note, 68, 1028, 30, 944, 1123, muted)
    elif stage == "histoire":
        text("titre", title, 68, 279, 96, 944, 590, face="anton", weight=400, step=120)
        text("corps", body, 68, 602, 59, 914, 837, weight=600)
        text("punchline", note, 68, 850, 53, 914, 1123, accent, weight=600)
    elif stage == "detail-musical":
        text("titre", title, 68, 319, 157, 944, 600, accent, "anton", 400)
        text("corps", body, 68, 612, 60, 920, 857, weight=600)
        text("punchline", note, 68, 869, 53, 920, 1123, muted, weight=600)
    elif stage == "ecoute":
        text("titre", title, 68, 738, 83, 944, 845, face="anton", weight=400)
        text("precision", card.get("precision") or deck["musique"]["artiste"], 68, 855, 36, 944, 918, accent)
        text("corps", body, 68, 931, 42, 924, 1114, weight=600)
    else:
        text("titre", title, 68, 282, 105, 940, 616, face="anton", weight=400, step=128)
        text("corps", body, 68, 629, 52, 920, 892, weight=600)
        text("punchline", note, 68, 904, 43, 920, 1123, muted, weight=600)

    if stage in ("accroche", "ecoute"):
        if image is None:
            p.fautes.append("image manquante")
        else:
            if stage == "accroche":
                # A whole portrait; the approved cover never crops away the face.
                fitted = ImageOps.contain(image, (435, 844))
                x, y, width, height = 577 + (435 - fitted.width) // 2, 270, *fitted.size
                scale = width / image.width
            else:
                x, y, width, height = 68, 270, 944, 432
                scale = max(width / image.width, height / image.height)
            p.blocs.append(Bloc("bande-image", x, y, width, height))
            if scale > tk.SUR_ECH_MAX:
                p.fautes.append(f"agrandissement ×{scale:.2f} : choisir une image mieux définie")
        asset = card.get("image") or {}
        credit = " · ".join(filter(None, (asset.get("credit"), asset.get("licence"))))
        text("credit", credit, 68, 1123, 23, 944, 1158, muted)
        source = card.get("source") or "Sources, images et licences : voir la légende."
        text("source", source, 68, 1160, 22, 944, 1198, muted)
    else:
        text("source", card.get("source") or "", 68, 1138, 26, 944, 1198, muted)
    return p


def render(card, deck, fmt_key, image, p, *, text=True, proof=None):
    from ethni_compose import fonte, peindre_texte, _tamponner_epreuve

    im = Image.new("RGBA", (1080, 1350), tk.color("--afh-night-ground"))
    draw = ImageDraw.Draw(im)
    accent = tk.color("--afh-night-ocre-soft")
    for y in (129, 1198):
        draw.line((68, y, 1012, y), fill=accent, width=2)
    if card["rang"] < 6:
        draw.line((938, 1254, 989, 1254), fill=accent, width=4)
        draw.line((975, 1240, 989, 1254, 975, 1268), fill=accent, width=4)
    photo = p.bloc("bande-image")
    if photo and image is not None:
        if card["etape"] == "accroche":
            fitted = image.resize((photo.w, photo.h), Image.Resampling.LANCZOS)
        else:
            focal = (card.get("image") or {}).get("cadrage", "50% 50%")
            center = tuple(float(v.rstrip("%")) / 100 for v in focal.split())
            fitted = ImageOps.fit(image, (photo.w, photo.h), Image.Resampling.LANCZOS, centering=center)
        im.paste(fitted, (photo.x, photo.y))
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
