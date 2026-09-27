"""Hold Mémoires sonores to the standard carousel gabarit.

The profile keeps its own rules (six ordered stages, TikTok and Instagram only,
per-platform sound review). It draws nothing of its own: a card of the profile is
composed exactly like the same card of an ordinary deck, so the account keeps the
one look the operator approved (Lingala, Rastafari, reading lists).
"""
import copy
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from PIL import Image, ImageChops

import ethni_compose as gab
import ethni_carousel_profiles as profiles
from test_carousel_profiles import STAGES, musical_deck

HARNESS = pathlib.Path(__file__).resolve().parent
PHOTO = (1600, 2000)


def ordinary_twin(deck):
    """The same deck without the profile: what the standard gabarit would draw."""
    twin = copy.deepcopy(deck)
    del twin["profil"], twin["musique"]
    twin["serie"] = "Mémoires sonores"
    for card in twin["cartes"]:
        del card["etape"]
    return twin


class StandardLayoutTest(unittest.TestCase):
    def test_profile_declares_no_layout_of_its_own(self):
        self.assertNotIn("visual", profiles.load("memoires-sonores"))
        self.assertIsNone(profiles.visual(musical_deck()))

    def test_every_card_is_composed_exactly_like_the_standard_gabarit(self):
        deck = musical_deck()
        twin = ordinary_twin(deck)
        photo = Image.new("RGB", PHOTO, (90, 70, 50))
        for card, plain in zip(deck["cartes"], twin["cartes"]):
            with self.subTest(rank=card["rang"]):
                actual = gab.composer(card, deck, "carrousel", image=photo).convert("RGB")
                expected = gab.composer(plain, twin, "carrousel", image=photo).convert("RGB")
                self.assertIsNone(ImageChops.difference(actual, expected).getbbox())

    def test_layout_is_one_of_the_three_standard_dispositions(self):
        deck = musical_deck()
        photo = Image.new("RGB", PHOTO, (90, 70, 50))
        for card in deck["cartes"]:
            with self.subTest(rank=card["rang"]):
                plan = gab.plan(card, deck, "carrousel", image=photo)
                self.assertIn(plan.disposition, ("A", "B", "C"))
                self.assertEqual(plan.fautes, [])

    def test_scaffold_asks_for_a_photograph_on_every_card(self):
        brief = profiles.brief("memoires-sonores")
        cards = brief["deck"]["cartes"]
        self.assertEqual(tuple(c["etape"] for c in cards), STAGES)
        self.assertTrue(all("image" in c for c in cards))
        self.assertNotIn("visual", brief["profile"])

    def test_a_text_only_card_is_refused_because_every_card_carries_a_photograph(self):
        deck = musical_deck()
        del deck["cartes"][2]["image"]
        self.assertTrue(profiles.errors(deck))
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_standard_fields_are_accepted_on_any_stage(self):
        deck = musical_deck()
        for card in deck["cartes"]:
            card.update(precision="Une précision", punchline="Une chute", disposition="A")
        self.assertEqual(profiles.errors(deck), [])

    def test_the_words_may_sit_in_any_standard_slot_but_a_card_needs_some(self):
        deck = musical_deck()
        for card in deck["cartes"][1:]:
            card.update(precision=card.pop("corps"), punchline="")
        self.assertEqual(profiles.errors(deck), [])
        deck["cartes"][2].update(precision="", punchline=" ")
        self.assertTrue(profiles.errors(deck))
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_the_retired_layout_name_and_malformed_fields_are_refused(self):
        mutations = [
            lambda d: d.update(sujet=[]),
            lambda d: d["cartes"][0].update(coupe="a string is not a list of lines"),
            lambda d: d["cartes"][4]["image"].update(cadrage="not a focal point"),
            lambda d: d["cartes"][2].update(disposition="memoires-sonores-v1"),
            lambda d: d["cartes"][0].update(corps=["not text"]),
            lambda d: d["cartes"][0]["image"].update(credit=["not text"]),
        ]
        for mutate in mutations:
            deck = musical_deck()
            mutate(deck)
            self.assertTrue(profiles.errors(deck))
            self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_night_and_parchment_grounds_are_both_the_standard_choice(self):
        for ground in ("nuit", "parchemin"):
            with self.subTest(ground=ground):
                deck = musical_deck()
                deck["fond"] = ground
                self.assertEqual(profiles.errors(deck), [])

    def test_real_command_delivers_six_standard_cards_and_keeps_failures_in_proofs(self):
        for unsourced in (False, True):
            with self.subTest(unsourced=unsourced), tempfile.TemporaryDirectory() as directory:
                root = pathlib.Path(directory)
                (root / "assets").mkdir()
                Image.new("RGB", PHOTO, "gray").save(root / "assets/guitar.png")
                deck = musical_deck()
                deck["outDir"] = str(root / "delivery")
                if unsourced:
                    deck["cartes"][2]["image"]["licence"] = ""
                (root / "cards.json").write_text(json.dumps(deck))
                (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-27, par l’opérateur.\n")
                (root / "message.md").write_text("Verdict : **passe**\n")
                run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                                     capture_output=True, text=True)
                self.assertEqual(run.returncode, 0, run.stderr)
                target = root / "delivery" / ("_epreuves" if unsourced else "TikTok-Instagram")
                self.assertEqual(len(list(target.glob("*.png"))), 6, run.stdout)
                if unsourced:
                    self.assertFalse((root / "delivery/TikTok-Instagram").exists())
                else:
                    report = (root / "delivery/RENDU.md").read_text()
                    self.assertNotIn("memoires-sonores-v1", report)
                    self.assertIn("Gabarit standard", report)
                    self.assertFalse(list((root / "delivery").rglob("*_reel_*")))


if __name__ == "__main__":
    unittest.main()
