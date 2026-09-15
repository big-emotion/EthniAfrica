"""La miniature : la première image d'un carrousel et d'un reel.

    ./venv/bin/python test_miniature.py

Décidé le 2026-09-16, après que l'opérateur a comparé sa grille TikTok. Les
vidéos ouvraient sur un titre de 76 px au tiers bas, doublé par la plaque de
narration : à la taille d'une vignette de grille, ce titre fait 17 px et ne se
lit pas. Les carrousels, eux, ouvraient en grand et se lisaient. La miniature
décide qui regarde ; elle porte donc le titre à la taille couverture, et rien
d'autre ne vient la charger.
"""

import pathlib
import sys
import tempfile

from PIL import Image

import ethni_compose as gab
import ethni_montage as mt
from test_ethni_compose import DECK, carte, image_test


# Huit mots, la limite de la règle : ce titre doit tenir sans faute.
TITRE_HUIT_MOTS = "Personne ne s'est jamais appelé comme ça, ici"


def test_a_carousel_opening_is_set_at_cover_size():
    image = image_test(3000, 4000)
    ouverture = gab.plan(carte(role="ouverture", corps="", precision=""), DECK,
                         "carrousel", image=image, disposition="A")
    serie = gab.plan(carte(corps="", precision=""), DECK, "carrousel",
                     image=image, disposition="A")

    couverture = gab._role_type("Titre de couverture", "carrousel")["corps"]
    assert ouverture.bloc("titre").corps == couverture, (
        "l'ouverture prend le rang « Titre de série », qui est celui des cartes "
        "de développement")
    assert serie.bloc("titre").corps < couverture, (
        "une carte de série doit rester sous la taille couverture")


def test_a_video_opening_is_set_at_cover_size_and_not_at_seventy_six():
    image = image_test(3000, 4000)
    ouverture = gab.plan_video(carte(role="ouverture"), DECK, image=image)
    scene = gab.plan_video(carte(), DECK, image=image)

    couverture = gab._role_type("Titre de couverture", "reel")["corps"]
    assert ouverture.bloc("v-titre").corps == couverture
    assert scene.bloc("v-titre").corps == gab.V_TITRE_CORPS, (
        "une scène ordinaire garde les emplacements fixes du §9 bis")


def test_a_video_opening_title_holds_above_the_narration_slot():
    p = gab.plan_video(carte(role="ouverture", titre=TITRE_HUIT_MOTS), DECK,
                       image=image_test(3000, 4000))
    titre = p.bloc("v-titre")

    assert not p.fautes, p.fautes
    assert titre.y + titre.h <= gab.V_NARRATION[0], (
        "le titre de miniature descend dans l'emplacement de narration")
    assert titre.y >= gab.V_PLAQUE_H, (
        "le titre remonte sous le nom de série, dans la plaque haute")


def test_the_video_opening_carries_no_caption_while_it_is_the_thumbnail():
    """La première image circule dans le fil bien plus longtemps qu'à l'écran.

    Une légende de narration posée dessus la double : le spectateur lit deux
    fois la même phrase, en petit sous la grande.
    """
    sous_titre = {"lignes": ["Une ligne de narration"], "pivot": "narration"}
    ouverture = carte(role="ouverture")

    assert mt.sous_titre_de_scene(ouverture, 0.0, sous_titre) is None
    assert mt.sous_titre_de_scene(ouverture, mt.MINIATURE_S + 0.1,
                                  sous_titre) == sous_titre
    assert mt.sous_titre_de_scene(carte(), 0.0, sous_titre) == sous_titre


def test_the_video_opening_punch_is_its_last_word():
    p = gab.plan_video(carte(role="ouverture", titre=TITRE_HUIT_MOTS), DECK,
                       image=image_test(3000, 4000))

    assert p.bloc("v-titre").accent_depuis == gab._chute(TITRE_HUIT_MOTS)


def test_the_cover_is_the_first_frame_filed_beside_the_montage():
    """Le réseau propose la première image comme couverture, jamais un cadre choisi.

    L'opérateur la reçoit en PNG, pour la poser telle quelle sur TikTok,
    Instagram et YouTube.
    """
    with tempfile.TemporaryDirectory() as dossier:
        images = pathlib.Path(dossier) / "images"
        images.mkdir()
        Image.new("RGB", (8, 8), (200, 30, 30)).save(images / "000000.png")
        Image.new("RGB", (8, 8), (10, 10, 10)).save(images / "000001.png")
        sortie = pathlib.Path(dossier) / "sujet-couverture.png"

        mt.exporter_couverture(images, sortie)

        assert sortie.exists(), "aucune couverture écrite à côté du montage"
        assert Image.open(sortie).convert("RGB").getpixel((0, 0)) == (200, 30, 30)


def test_an_opening_title_longer_than_eight_words_is_remarked():
    long = "un deux trois quatre cinq six sept huit neuf"
    verdict = gab.portes([carte(rang=1, role="ouverture", titre=long)], DECK)
    tenu = gab.portes([carte(rang=1, role="ouverture", titre=TITRE_HUIT_MOTS)],
                      DECK)

    assert any("miniature" in r for r in verdict.remarques), verdict.remarques
    assert not any("miniature" in r for r in tenu.remarques), tenu.remarques


def test_an_opening_title_is_never_shrunk_to_fit():
    """§1 ter — la miniature ne cède pas son corps, c'est la copie qui cède.

    Mesuré le 2026-09-16 sur l'atelier : six ouvertures sur seize tombaient à
    106 ou 88 px pour tenir dans leur bandeau, dont les deux que l'opérateur
    avait relevées sur sa grille. Le titre rétrécissait sans que personne ne le
    demande, et sans que rien ne le dise.
    """
    trop_long = ("Le fondateur de cette ville est mort en exil après avoir "
                 "résisté pendant six années entières à la colonisation")
    image = image_test(3000, 4000)

    ouverture = gab.plan(carte(role="ouverture", titre=trop_long), DECK,
                         "carrousel", image=image, disposition="C")
    serie = gab.plan(carte(titre=trop_long), DECK, "carrousel",
                     image=image, disposition="C")

    couverture = gab._role_type("Titre de couverture", "carrousel")["corps"]
    assert ouverture.bloc("titre").corps == couverture, (
        "le titre de l'ouverture a été réduit pour tenir")
    assert not ouverture.comprime, "une ouverture ne se comprime pas"
    assert any("miniature" in f for f in ouverture.fautes), ouverture.fautes

    assert serie.comprime, (
        "une carte de série, elle, cède toujours son corps avant sa copie")


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
