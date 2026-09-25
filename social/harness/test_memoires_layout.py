"""Hold the approved musical layouts to their visual references and delivery gates."""
import copy
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from PIL import Image, ImageChops, ImageDraw

import ethni_compose as gab
import ethni_carousel_profiles as profiles
from test_carousel_profiles import musical_deck

HARNESS = pathlib.Path(__file__).resolve().parent
REFERENCES = HARNESS.parents[1] / "docs/design/gabarits-social/memoires-sonores-approved"


def approved_deck():
    deck = musical_deck()
    deck.update(accent="ocre", sujet="Kassav’ · Jacob Desvarieux")
    copy_fields = [
        ("Une chanson pour Tshala Muana ?", "", "Le récit de Jacob Desvarieux", "rapporté par ADIAC.", ""),
        ("Kinshasa", "2008", "Un concert pour Tshala Muana.\nJacob Desvarieux prend la parole et raconte une tentative de séduction.", "Un souvenir rapporté par Nioni Masela, ADIAC.", "Source · ADIAC, 2 août 2021"),
        ("Chanter pour\nla séduire", "", "Selon ce récit, il aurait écrit « Mwen malad aw » pour attirer son attention.", "La chanson n’aurait pas changé ses sentiments.", "Source · Nioni Masela, ADIAC, 2 août 2021"),
        ("Maboko", "", "Desvarieux aurait ajouté des mots en lingala pour lui plaire.", "L’article signale ce mot dans la chanson.", "Source · Nioni Masela, ADIAC, 2 août 2021"),
        ("Mwen malad aw", "Jacob Desvarieux", "Repérez « maboko », le mot signalé dans le récit. Puis revenez à l’histoire.", "", "Sources, images et licences : voir la légende de la maquette."),
        ("D’où vient\nce récit ?", "", "Nioni Masela\nLes Dépêches / ADIAC\n2 août 2021", "Un récit de scène rapporté par la presse. L’enregistrement de 2008 reste à retrouver pour le recouper.", "Références complètes et crédits dans la légende."),
    ]
    for card, fields in zip(deck["cartes"], copy_fields):
        card.update(zip(("titre", "precision", "corps", "punchline", "source"), fields))
        if card["rang"] not in (1, 5):
            del card["image"]
    return deck


class ApprovedMusicLayoutTest(unittest.TestCase):
    def test_cover_and_listening_match_outside_the_variable_photographs(self):
        deck = approved_deck()
        for rank, credit, licence, box in (
            (1, "Jacob Desvarieux · Béziers, 2012 · Geehair", "CC BY-SA 3.0", (577, 270, 1012, 1114)),
            (5, "Kassav’ · Ouidah, 2025 · Borisghost", "CC0", (68, 270, 1012, 702)),
        ):
            with self.subTest(rank=rank):
                card = deck["cartes"][rank - 1]
                card["image"].update(credit=credit, licence=licence)
                card["source"] = "Sources, images et licences : voir la légende de la maquette."
                photo = Image.new("RGB", (455, 883), "gray")
                actual = gab.composer(card, deck, "carrousel", image=photo).convert("RGB")
                reference = Image.open(REFERENCES / f"carte-{rank:02d}.png").convert("RGB")
                for im in (actual, reference):
                    ImageDraw.Draw(im).rectangle(box, fill="black")
                crop = (0, 45, 1080, 1350)
                self.assertIsNone(ImageChops.difference(actual.crop(crop), reference.crop(crop)).getbbox())

    def test_reference_cards_reproduce_the_approved_pixels(self):
        deck = approved_deck()
        for rank in (2, 3, 4, 6):
            with self.subTest(rank=rank):
                card = deck["cartes"][rank - 1]
                plan = gab.plan(card, deck, "carrousel", image=None)
                self.assertEqual(plan.fautes, [])
                actual = gab.composer(card, deck, "carrousel", image=None).convert("RGB")
                reference = Image.open(REFERENCES / f"carte-{rank:02d}.png").convert("RGB")
                # The proof-only top banner is not part of a publishable card.
                box = (0, 45, 1080, 1350)
                self.assertIsNone(ImageChops.difference(actual.crop(box), reference.crop(box)).getbbox())
                self.assertEqual(gab.blocs_non_peints(card, deck, "carrousel", image=None), [])

    def test_portrait_is_contained_and_actual_enlargement_is_checked(self):
        deck = approved_deck()
        card = deck["cartes"][0]
        image = Image.new("RGB", (455, 883), "white")
        plan = gab.plan(card, deck, "carrousel", image=image)
        portrait = plan.bloc("bande-image")
        self.assertLessEqual(portrait.w, 435)
        self.assertLessEqual(portrait.h, 844)
        self.assertAlmostEqual(portrait.w / portrait.h, 455 / 883, places=2)
        self.assertEqual(plan.fautes, [])
        small = gab.plan(card, deck, "carrousel", image=Image.new("RGB", (50, 100)))
        self.assertTrue(any("agrandissement" in error for error in small.fautes))

    def test_long_copy_and_unbreakable_words_cannot_shrink_or_escape(self):
        deck = approved_deck()
        for value in ("Une histoire à raconter. " * 40, "X" * 200):
            card = copy.deepcopy(deck["cartes"][2])
            card["corps"] = value
            plan = gab.plan(card, deck, "carrousel", image=None)
            self.assertTrue(plan.fautes)
            self.assertEqual(plan.bloc("corps").corps, 59)

    def test_scaffold_only_requests_the_two_photos_it_renders(self):
        brief = profiles.brief("memoires-sonores")
        self.assertEqual([c["rang"] for c in brief["deck"]["cartes"] if "image" in c], [1, 5])
        self.assertEqual(brief["profile"]["visual"]["status"], "approved")
        deck = approved_deck()
        self.assertTrue(gab.portes(deck["cartes"], deck).passe)
        deck["cartes"][4]["image"]["licence"] = ""
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_invalid_visual_overrides_are_rejected_before_drawing(self):
        mutations = [
            lambda d: d.update(sujet=[]),
            lambda d: d.update(fond="parchemin"),
            lambda d: d.update(accent="terre"),
            lambda d: d["cartes"][0].update(coupe="a string is not a list of lines"),
            lambda d: d["cartes"][4]["image"].update(cadrage="not a focal point"),
            lambda d: d["cartes"][2].update(disposition="A"),
            lambda d: d["cartes"][2].update(precision="This field would disappear"),
            lambda d: d["cartes"][0].update(corps=["not text"]),
            lambda d: d["cartes"][0]["image"].update(credit=["not text"]),
        ]
        for mutate in mutations:
            deck = approved_deck()
            mutate(deck)
            self.assertTrue(profiles.errors(deck))
            self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_real_command_exports_six_new_layouts_and_keeps_failures_in_proofs(self):
        for oversized in (False, True):
            with self.subTest(oversized=oversized), tempfile.TemporaryDirectory() as directory:
                root = pathlib.Path(directory)
                (root / "assets").mkdir()
                Image.new("RGB", (1600, 2000), "gray").save(root / "assets/guitar.png")
                deck = approved_deck()
                deck["outDir"] = str(root / "delivery")
                if oversized:
                    deck["cartes"][2]["corps"] *= 30
                (root / "cards.json").write_text(json.dumps(deck))
                (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-25, par l’opérateur.\n")
                (root / "message.md").write_text("Verdict : **passe**\n")
                run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                                     capture_output=True, text=True)
                self.assertEqual(run.returncode, 0, run.stderr)
                target = root / "delivery" / ("_epreuves" if oversized else "TikTok-Instagram")
                self.assertEqual(len(list(target.glob("*.png"))), 6, run.stdout)
                if oversized:
                    self.assertFalse((root / "delivery/TikTok-Instagram").exists())
                else:
                    report = (root / "delivery/RENDU.md").read_text()
                    self.assertIn("memoires-sonores-v1", report)
                    self.assertNotIn("hors quota", report)


if __name__ == "__main__":
    unittest.main()
