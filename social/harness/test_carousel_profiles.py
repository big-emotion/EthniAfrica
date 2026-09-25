"""Exercise the musical carousel through its preparation, gates and renderer."""
import copy
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

import ethni_compose as gab
import ethni_tokens as tk

HARNESS = pathlib.Path(__file__).resolve().parent
STAGES = ("accroche", "contexte", "histoire", "detail-musical", "ecoute", "references")


def musical_deck():
    cards = []
    for rank, stage in enumerate(STAGES, 1):
        cards.append({
            "rang": rank, "etape": stage,
            "role": "ouverture" if rank == 1 else "serie",
            "titre": "Une guitare à écouter" if rank == 1 else "Le son voyage",
            "corps": "" if rank == 1 else "Écoutons la guitare dans cet enregistrement.",
            "source": "" if rank == 1 else "Recording and interview, test fixture",
            "image": {
                "fichier": "guitar.png", "w": 1600, "h": 2000,
                "identite": "A guitar", "credit": "A guitar",
                "depot": "Test fixture", "licence": "CC0",
                "verifie": {"par": "test", "le": "2026-09-25"},
            },
            "disposition": "auto",
        })
    return {
        "campagne": "music-fixture", "profil": "memoires-sonores",
        "pilier": "EthniAfrica", "accent": "terre", "fond": "nuit",
        "musique": {
            "titre": "Recording fixture", "artiste": "Test artist",
            "version": "Studio", "extrait": "Opening guitar phrase",
            "plateformes": {
                network: {"reference": f"test-sound-{network}",
                          "usage": "Synthetic fixture cleared for this test",
                          "verifie": True}
                for network in ("tiktok", "instagram")
            },
        },
        "cartes": cards,
    }


class CarouselProfilesTest(unittest.TestCase):
    def test_brief_reads_the_canonical_instructions_and_supplies_six_steps(self):
        run = subprocess.run(
            [sys.executable, str(HARNESS / "ethni_carrousel2.py"),
             "--brief", "memoires-sonores"], capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        brief = json.loads(run.stdout)
        self.assertEqual(brief["profile"]["cadence"], {
            "day": "sunday", "intervalWeeks": 2, "subjects": 3,
        })
        guide = HARNESS.parents[1] / brief["guide"]
        self.assertEqual(brief["instructions"], guide.read_text(encoding="utf-8"))
        deck = brief["deck"]
        self.assertEqual(tuple(c["etape"] for c in deck["cartes"]), STAGES)
        self.assertEqual(deck["profil"], "memoires-sonores")
        self.assertEqual(deck["serie"], "Mémoires sonores")
        self.assertNotIn("sitePath", deck)
        self.assertFalse(gab.portes(deck["cartes"], deck).passe,
                         "An empty preparation template is not approved content")

    def test_musical_story_passes_without_a_myth_or_site_record(self):
        deck = musical_deck()
        verdict = gab.portes(deck["cartes"], deck)
        self.assertTrue(verdict.passe, verdict.manquantes)

    def test_missing_listening_card_and_reordered_story_are_rejected(self):
        for alteration in ("missing", "order", "rank", "closing"):
            with self.subTest(alteration=alteration):
                deck = musical_deck()
                if alteration == "missing":
                    deck["cartes"].pop(4)
                elif alteration == "order":
                    deck["cartes"][2]["etape"] = "ecoute"
                elif alteration == "rank":
                    deck["cartes"][4]["rang"] = 3
                else:
                    deck["cartes"][-1]["role"] = "bascule"
                verdict = gab.portes(deck["cartes"], deck)
                self.assertFalse(verdict.passe, alteration)
                self.assertTrue(any("Mémoires sonores" in e for e in verdict.manquantes))

    def test_missing_sources_or_platform_audio_review_cannot_pass(self):
        for alteration in ("source", "audio", "platform", "empty", "wrong-type", "pending-audio"):
            with self.subTest(alteration=alteration):
                deck = musical_deck()
                if alteration == "source":
                    deck["cartes"][-1]["source"] = ""
                elif alteration == "audio":
                    del deck["musique"]
                elif alteration == "platform":
                    del deck["musique"]["plateformes"]["instagram"]
                elif alteration == "empty":
                    deck["cartes"][3]["corps"] = " "
                elif alteration == "pending-audio":
                    deck["musique"]["plateformes"]["instagram"]["verifie"] = False
                else:
                    deck["musique"]["plateformes"] = []
                self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_unknown_profile_cannot_fall_back_to_all_networks(self):
        deck = musical_deck()
        deck["profil"] = "memoires-sonore"
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
            run = subprocess.run(
                [sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                capture_output=True, text=True)
            self.assertNotEqual(run.returncode, 0)
            self.assertIn("profil", run.stderr.lower())
            self.assertNotIn("Traceback", run.stderr)
            self.assertEqual(list(root.iterdir()), [root / "cards.json"])

    def test_malformed_profile_and_card_metadata_fail_cleanly(self):
        for name in (None, [], {}, "", "../memoires-sonores"):
            with self.subTest(name=name):
                deck = musical_deck()
                deck["profil"] = name
                self.assertFalse(gab.portes(deck["cartes"], deck).passe)
        deck = musical_deck()
        deck["cartes"][2] = None
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)
        for field in ("image", "campagne"):
            with self.subTest(field=field):
                deck = musical_deck()
                if field == "image":
                    deck["cartes"][2]["image"] = None
                else:
                    deck["campagne"] = " "
                self.assertFalse(gab.portes(deck["cartes"], deck).passe)

    def test_unknown_brief_is_a_clear_error_not_a_traceback(self):
        run = subprocess.run(
            [sys.executable, str(HARNESS / "ethni_carrousel2.py"), "--brief", "missing"],
            capture_output=True, text=True)
        self.assertNotEqual(run.returncode, 0)
        self.assertIn("profil", run.stderr)
        self.assertNotIn("Traceback", run.stderr)

    def test_music_identity_reaches_the_composition_without_a_site_call_to_action(self):
        deck = musical_deck()
        image = Image.new("RGB", (1600, 2000), (55, 60, 65))
        for card in (deck["cartes"][0], deck["cartes"][-1]):
            plan = gab.plan(card, deck, "carrousel", image=image)
            self.assertIn("MÉMOIRES SONORES", [b.texte for b in plan.blocs])
            self.assertNotIn("appel-action", [b.nom for b in plan.blocs])
            self.assertEqual(plan.fautes, [])

    def test_real_render_delivers_only_six_swipeable_music_cards(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "assets").mkdir()
            Image.new("RGB", (1600, 2000), (55, 60, 65)).save(root / "assets/guitar.png")
            deck = musical_deck()
            deck["outDir"] = str(root / "delivery")
            (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
            (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-25, par l’opérateur.\n")
            (root / "message.md").write_text("Verdict : **passe**\n")
            run = subprocess.run(
                [sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                capture_output=True, text=True, timeout=180)
            self.assertEqual(run.returncode, 0, run.stderr)
            delivery = root / "delivery"
            files = sorted(delivery.rglob("*.png"))
            self.assertEqual(len(files), 6, run.stdout)
            self.assertEqual({f.parent.name for f in files}, {"TikTok-Instagram"}, run.stdout)
            for file in files:
                with Image.open(file) as rendered:
                    self.assertEqual(rendered.size, (1080, 1350))
            report = (delivery / "RENDU.md").read_text(encoding="utf-8")
            self.assertIn("Mémoires sonores", report)
            self.assertIn("Recording fixture", report)
            self.assertIn("test-sound-instagram", report)
            self.assertFalse(any("_reel_" in f.name for f in files))

    def test_regular_deck_keeps_its_networks_and_gates(self):
        deck = musical_deck()
        del deck["profil"]
        del deck["musique"]
        deck["cartes"] = deck["cartes"][:2]
        self.assertTrue(gab.portes(deck["cartes"], deck).passe)
        self.assertEqual(tk.reseaux("carrousel"),
                         ["TikTok", "Instagram", "Facebook", "YouTube", "LinkedIn"])
        broken = copy.deepcopy(deck)
        broken["cartes"][0]["image"]["licence"] = ""
        self.assertFalse(gab.portes(broken["cartes"], broken).passe)


if __name__ == "__main__":
    unittest.main()
