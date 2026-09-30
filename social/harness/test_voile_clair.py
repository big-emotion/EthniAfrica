"""§4 — the veil follows the picture: light ink on a dark one, dark ink on a light one.

    ./venv/bin/python test_voile_clair.py

Operator ruling, 2026-10-01, after the proof of the Bleek carousel: five cards built on
light scanned book pages still had a near-black lower half, because the ink was always
light and so the scrim was always dark. « Texte sombre sur voile clair pour les images
claires. » The rule, stated once: on a light image the veil is light and the ink dark;
on a dark image the ink is light; there is never a dark plate over a light image.

Every assertion reads rendered pixels or the plan's own block colours; none reaches for
a private helper. The images are synthetic so the suite runs without the workshop: a
flat tone, and a « scan » — white paper with dark printed lines, which is what a book
page is and what a percentile-of-the-paper solve cannot see through.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

import ethni_compose as gab
import ethni_tokens as tk

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from test_voile_adaptatif import carte, DECK, blocs_contenu  # noqa: E402

FORMATS = ("carrousel", "linkedin", "reel")
PARCHEMIN_FOND = gab._rgb(tk.color("--afh-color-bg"))
ENCRE_SOMBRE = tk.color("--afh-color-text")
ENCRE_CLAIRE = tk.color("--afh-night-ink")
# The cap the light veil may never exceed: above it the picture is an opaque cream plate.
PLAFOND_CLAIR = gab.VOILE_CLAIR_PLAFOND


def plat(ton, w=3000, h=4000):
    return Image.new("RGB", (w, h), (ton, ton, ton))


def scan(w=3000, h=4000):
    """White paper ruled with dark printed lines, 30 px thick every 90 px."""
    a = np.full((h, w, 3), 250, dtype=np.uint8)
    for y in range(0, h, 90):
        a[y:y + 30] = 25
    return Image.fromarray(a, "RGB")


def rendu(image, fmt="carrousel", disposition="A"):
    return gab.fond_et_plan(carte(), DECK, fmt, image=image, disposition=disposition)


def seuil(bloc):
    return 3.0 if bloc.nom in ("titre", "punchline", "chiffre") else 4.5


def textes(p):
    return [b for b in p.blocs if b.texte and getattr(b, "couleur", None)]


# ── light image → light veil, dark ink ───────────────────────────────────────

def test_a_light_image_sets_every_text_block_in_dark_ink():
    for ton in (255, 235, 215):
        for fmt in FORMATS:
            _, p = rendu(plat(ton), fmt)
            assert p.theme == "parchemin", f"{fmt} ton {ton} : thème {p.theme}"
            clairs = [b.nom for b in textes(p)
                      if gab._luminance(gab._rgb(b.couleur)) > 0.3
                      and b.nom not in ("appel-action", "defilement")]
            assert not clairs, f"{fmt} ton {ton} : encre claire sur image claire — {clairs}"


def test_a_light_image_gets_a_light_translucent_veil_never_a_dark_plate():
    for fmt in FORMATS:
        fond, _ = rendu(plat(215), fmt)
        rangees = np.asarray(fond.convert("L"), dtype=float).mean(axis=1)
        # Nowhere is the card darker than the picture it carries: the veil only lightens.
        assert rangees.min() >= 215 - 2, f"{fmt} : rangée à {rangees.min():.0f} sur une image à 215"
        # And a veil that became an opaque cream plate would erase the picture: at the cap
        # the picture still contributes (1 - cap) of the row.
        bg = np.asarray(Image.new("RGB", (1, 1), PARCHEMIN_FOND).convert("L"))[0, 0]
        assert rangees.max() <= 215 + PLAFOND_CLAIR * (bg - 215) + 2


def test_the_light_veil_is_capped_and_lets_the_picture_show_through():
    image = scan()
    for fmt in FORMATS:
        fond, p = rendu(image, fmt)
        colonne = p.bloc("voile-colonne")
        assert colonne is not None
        # One column of pixels down the column's height crosses several printed lines.
        rang = np.asarray(fond.convert("L"), dtype=float)[colonne.y:, 0]
        # Without a veil the swing is 250 - 25; the veil may take at most its cap of it.
        assert rang.max() - rang.min() >= (1 - PLAFOND_CLAIR) * (250 - 25) * 0.6, (
            f"{fmt} : l'image a disparu sous le voile ({rang.max() - rang.min():.0f} de contraste)")


def test_contrast_reaches_the_engine_floors_on_light_images():
    fautes = []
    for fmt in FORMATS:
        for nom, image in (("blanc", plat(255)), ("clair", plat(215)), ("scan", scan())):
            fond, p = rendu(image, fmt)
            for b in textes(p):
                if b.nom in gab._NON_PEINTS:
                    continue
                r = gab.contraste_mesure(fond, b)
                if r < seuil(b):
                    fautes.append(f"{fmt} {nom} {b.nom} : {r:.2f}:1 < {seuil(b)}")
    assert not fautes, "\n  " + "\n  ".join(fautes[:12])


def test_contrast_holds_under_the_darkest_printed_line_not_only_the_paper():
    """The solve protects the dark tail: dark ink over a black rule is the failure this pins."""
    fond, p = rendu(scan())
    pixels = np.asarray(fond.convert("RGB"), dtype=float)
    for b in textes(p):
        if b.nom in gab._NON_PEINTS:
            continue
        zone = pixels[b.y:b.y + b.h, b.x:b.x + b.w].reshape(-1, 3)
        sombre = np.percentile(zone, 8, axis=0)
        l_fond = gab._luminance(tuple(sombre))
        r = (l_fond + 0.05) / (gab._luminance(gab._rgb(b.couleur)) + 0.05)
        assert r >= seuil(b) * 0.95, f"{b.nom} : {r:.2f}:1 sous la ligne imprimée la plus sombre"


# ── dark and mid images keep the light ink ───────────────────────────────────

def test_a_dark_image_keeps_light_ink_on_the_lightest_night_scrim():
    for fmt in FORMATS:
        for ton in (20, 60):
            fond, p = rendu(plat(ton), fmt)
            assert p.theme == "nuit"
            dans_le_texte = [b for b in textes(p) if b.nom in ("titre", "corps")]
            assert dans_le_texte
            for b in dans_le_texte:
                assert b.couleur == ENCRE_CLAIRE or gab._luminance(gab._rgb(b.couleur)) > 0.3
            bas = np.asarray(fond.convert("L"), dtype=float)[int(fond.height * 0.95)].mean()
            assert bas <= ton + 10, f"{fmt} ton {ton} : plus clair que l'image ({bas:.0f})"


def test_the_switch_sits_between_the_dark_landscapes_and_the_scanned_pages():
    # Measured on the Bleek deck's pictures, region under the text column (median relative
    # luminance): the three landscapes 0,16 to 0,29; the five scanned pages 0,88 to 1,00.
    assert 0.29 < gab.LUMINANCE_CLAIRE < 0.88
    assert rendu(plat(150))[1].theme == "nuit"      # Y = 0,30, mid-tone: light ink, solved scrim
    assert rendu(plat(200))[1].theme == "parchemin"  # Y = 0,58


def test_a_mid_tone_keeps_its_contrast_whichever_side_it_falls():
    fautes = []
    for ton in (120, 150, 170, 190):
        fond, p = rendu(plat(ton))
        for b in textes(p):
            if b.nom in gab._NON_PEINTS:
                continue
            r = gab.contraste_mesure(fond, b)
            if r < seuil(b):
                fautes.append(f"ton {ton} ({p.theme}) {b.nom} : {r:.2f}:1")
    assert not fautes, "\n  " + "\n  ".join(fautes)


# ── no floor, no plate, and the decision is the image's ──────────────────────

def test_no_scrim_floor_comes_back():
    assert gab.VOILE_PLANCHER == 0
    fond, _ = rendu(plat(255))
    # Dark ink on bare white paper needs no veil: the card is the picture.
    assert np.asarray(fond.convert("L"), dtype=float)[int(fond.height * 0.95)].mean() >= 245


def test_the_theme_is_the_images_not_the_decks():
    """A deck filed `fond: parchemin` still gets light ink only where the picture is light."""
    clair = dict(DECK, fond="parchemin")
    _, sombre = gab.fond_et_plan(carte(), clair, "carrousel", image=plat(30), disposition="A")
    assert sombre.theme == "nuit"
    assert {b.couleur for b in textes(sombre) if b.nom == "titre"} == {ENCRE_CLAIRE}


def test_the_proof_box_follows_the_card_and_is_not_a_dark_block_on_a_light_image():
    manquantes = ["licence de l'image 2 en attente"] * 3
    im = gab.composer(carte(), DECK, "carrousel", image=plat(235), epreuve=manquantes)
    p = gab.plan(carte(), DECK, "carrousel", image=plat(235))
    pied = min(b.y for b in p.blocs if b.nom.startswith("credit"))
    ligne = np.asarray(im.convert("L"), dtype=float)[pied - 40, :]
    # The box is translucent and light; only the ink of its own lines is dark.
    assert np.median(ligne) >= 180, f"encart de l'épreuve à {np.median(ligne):.0f} sur une image claire"


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001 — a runner reports, it does not raise
            failed += 1
            print(f"FAIL  {t.__name__}\n      {e}", flush=True)
        else:
            print(f"ok    {t.__name__}", flush=True)
    print(f"\n{len(tests) - failed}/{len(tests)} passent", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
