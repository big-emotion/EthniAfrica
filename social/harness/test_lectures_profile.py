"""Hold the reading-list profile (`lectures-afrique`) to its rules.

Reading lists use the standard carousel layouts, the cover being the photograph, exactly like every
other deck: the profile only names the networks, validates a variable-length deck, and carries
the one licence wording the operator took responsibility for. Each cover is the full-frame
background of its own card; the opening and closing show them all (`ethni_couvertures`).
"""
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

import ethni_carousel_profiles as profiles
import ethni_compose as gab
import ethni_couvertures as covers
import ethni_tokens as tk

HARNESS = pathlib.Path(__file__).resolve().parent
NETWORKS = ["TikTok", "Instagram", "Facebook", "YouTube", "LinkedIn"]
LICENCE = "couverture © éditeur"
CLOSING_TITLE = "Notre objectif : raconter l'origine des noms, avec des sources."
CLOSING_BODY = "Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica."
def light_image(name):
    return {"fichier": f"{name}-fond.png", "w": 1080, "h": 1350, "cadrage": "50% 0%",
            "couverture": f"{name}.png", "identite": f"la couverture du livre {name}",
            "credit": "Couverture : Points", "depot": "photographie de l'opérateur",
            "licence": LICENCE, "verifie": {"par": "test", "le": "2026-09-27"}}


def card(rank, role, title, **extra):
    base = {"rang": rank, "role": role, "titre": title, "chiffre": False, "precision": "",
            "punchline": "", "corps": "", "source": "", "paires": None, "pivot": None,
            "titre_camps": None, "coupe": None, "disposition": "auto"}
    base.update(extra)
    return base


def reading_deck(books=3):
    names = ["ebene", "painter", "mudimbe", "nkrumah"][:books]
    cards = [card(1, "ouverture", "Le regard venu d'ailleurs", precision=f"{books} livres à lire",
                  image=light_image("ouverture"))]
    for i, name in enumerate(names, 2):
        cards.append(card(i, "serie", name.capitalize(), precision="Un auteur", image=light_image(name)))
    cards.append(card(books + 2, "bascule", CLOSING_TITLE, corps=CLOSING_BODY, image=light_image("ouverture")))
    return {"profil": "lectures-afrique", "campagne": "lectures-test", "pilier": "Lectures",
            "accent": "ocre", "fond": "nuit", "cartes": cards}


class ReadingListProfileTest(unittest.TestCase):
    def test_a_well_formed_reading_list_passes_the_profile_check(self):
        for books in (1, 3, 4):
            with self.subTest(books=books):
                self.assertEqual(profiles.errors(reading_deck(books)), [])

    def test_the_carousel_reaches_the_five_networks_and_never_x(self):
        deck = reading_deck()
        self.assertEqual(profiles.formats(deck, ("carrousel", "reel")), ("carrousel",))
        self.assertEqual(tk.reseaux("carrousel", deck), NETWORKS)

    def test_the_profile_adds_no_layout_of_its_own(self):
        deck = reading_deck()
        self.assertIsNone(profiles.visual(deck))
        self.assertTrue(all(profiles.uses_image(deck, c) for c in deck["cartes"]))

    def test_structure_errors_are_named_in_the_operators_language(self):
        cases = {
            "no book": lambda d: d["cartes"].__delitem__(slice(1, 4)),
            "closing first": lambda d: d["cartes"].insert(0, d["cartes"].pop()),
            "no author": lambda d: d["cartes"][1].update(precision=" "),
            "no title": lambda d: d["cartes"][2].update(titre=""),
            "no image on the opening": lambda d: d["cartes"][0].pop("image"),
            "no cover file": lambda d: d["cartes"][1]["image"].update(fichier=""),
            "closing without body": lambda d: d["cartes"][-1].update(corps=""),
            "wrong rank": lambda d: d["cartes"][2].update(rang=7),
            "unknown layout letter": lambda d: d["cartes"][1].update(disposition="X"),
            "no campaign": lambda d: d.update(campagne=" "),
        }
        for name, mutate in cases.items():
            with self.subTest(case=name):
                deck = reading_deck()
                mutate(deck)
                problems = profiles.errors(deck)
                self.assertTrue(problems, name)
                self.assertTrue(all("Lectures d'Afrique" in p for p in problems), problems)

    def test_the_layout_letters_of_the_standard_gabarit_are_allowed(self):
        for letter in ("auto", "A", "B", "C"):
            deck = reading_deck()
            deck["cartes"][1]["disposition"] = letter
            self.assertEqual(profiles.errors(deck), [], letter)

    def test_the_gates_refuse_a_broken_deck_before_any_rendering(self):
        deck = reading_deck()
        deck["cartes"][1]["precision"] = ""
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)
        self.assertTrue(gab.portes(reading_deck()["cartes"], reading_deck()).passe)

    def test_the_operator_declared_licence_clears_the_gate_only_inside_this_profile(self):
        self.assertEqual(profiles.assumed_licence(reading_deck()), LICENCE)
        verdict = gab.portes(reading_deck()["cartes"], reading_deck())
        self.assertTrue(verdict.passe, verdict.manquantes)
        self.assertEqual(verdict.licence_sortie, LICENCE)

        deck = reading_deck()
        deck["cartes"][1]["image"]["licence"] = "tous droits réservés"
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)

        plain = reading_deck(1)
        del plain["profil"]
        verdict = gab.portes(plain["cartes"], plain)
        self.assertFalse(verdict.passe)
        self.assertTrue(any("licence" in m for m in verdict.manquantes), verdict.manquantes)
        self.assertIsNone(profiles.assumed_licence(plain))

    def test_the_brief_supplies_its_guide_and_a_scaffold_without_a_music_block(self):
        run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"),
                              "--brief", "lectures-afrique"], capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        brief = json.loads(run.stdout)
        guide = HARNESS.parents[1] / brief["guide"]
        self.assertEqual(brief["instructions"], guide.read_text(encoding="utf-8"))
        self.assertNotIn("musique", brief["deck"])
        self.assertEqual(brief["deck"]["fond"], "nuit")
        self.assertEqual([c["role"] for c in brief["deck"]["cartes"]], ["ouverture", "serie", "bascule"])


class CoverPreparationTest(unittest.TestCase):
    """Each cover is drawn above the veil of its own card, so a long title never eats the book."""

    def cover(self, size=(500, 800)):
        return Image.new("RGB", size, (200, 40, 40))

    def test_a_book_card_uses_the_cover_itself_as_its_background(self):
        deck = reading_deck()
        source = self.cover((500, 800))
        image = covers.prepare_cover(source, deck["cartes"][1], deck)
        self.assertEqual(image.size, (500, 800))
        self.assertEqual(image.getpixel((250, 400)), (200, 40, 40))
        self.assertEqual(list(image.getdata()), list(source.getdata()), "the cover is never altered")

    def test_the_standard_layout_takes_the_cover_as_a_full_frame_photograph(self):
        deck = reading_deck()
        card = deck["cartes"][1]
        plan = gab.plan(card, deck, "carrousel", image=self.cover((900, 1300)))
        self.assertEqual(plan.disposition, "A")
        self.assertEqual(plan.fautes, [])

    def test_a_cover_too_small_for_full_frame_falls_back_to_the_standard_cartouche(self):
        deck = reading_deck()
        card = deck["cartes"][1]
        plan = gab.plan(card, deck, "carrousel", image=self.cover((450, 700)))
        self.assertEqual(plan.disposition, "C")

    def test_a_longer_title_leaves_a_smaller_zone(self):
        deck = reading_deck()
        deck["cartes"][1]["titre"] = "Court"
        short = covers.free_zone(deck["cartes"][1], deck)[3]
        deck["cartes"][1]["titre"] = "Un titre nettement plus long pour occuper quatre lignes de gros caractères"
        self.assertLess(covers.free_zone(deck["cartes"][1], deck)[3], short)

    def test_the_mosaic_shows_every_cover_of_the_selection(self):
        deck = reading_deck(4)
        colours = [(200, 40, 40), (40, 160, 60), (40, 60, 200), (200, 180, 40)]
        image = covers.prepare_mosaic([Image.new("RGB", (500, 800), c) for c in colours],
                                      deck["cartes"][0], deck)
        self.assertEqual(image.size, (1080, 1350))
        seen = {c for c in colours if any(image.getpixel((x, y)) == c
                                          for y in range(64, 500, 12) for x in range(90, 990, 12))}
        self.assertEqual(seen, set(colours))

    def test_preparing_a_project_writes_the_cover_as_is_and_a_mosaic_for_the_opening_and_closing(self):
        deck = reading_deck(2)
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "couvertures").mkdir()
            for name in ("ebene", "painter"):
                Image.new("RGB", (500, 800), (120, 90, 60)).save(root / "couvertures" / f"{name}.png")
            (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
            covers.prepare_project(root)
            for c in deck["cartes"]:
                with Image.open(root / "assets" / c["image"]["fichier"]) as written:
                    self.assertEqual(written.size, (500, 800) if c["role"] == "serie" else (1080, 1350))


class ReadingListRenderTest(unittest.TestCase):
    def render(self, deck, verdicts=True):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = pathlib.Path(directory.name)
        (root / "couvertures").mkdir()
        for c in deck["cartes"]:
            source = c["image"].get("couverture")
            if source and c["role"] == "serie":
                Image.new("RGB", (900, 1300), (150, 110, 70)).save(root / "couvertures" / source)
        deck["outDir"] = str(root / "delivery")
        (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
        covers.prepare_project(root)
        if verdicts:
            (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-27, par l'opérateur.\n")
            (root / "message.md").write_text("Verdict : **passe**\n")
        run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                             capture_output=True, text=True, timeout=300)
        return root, run

    def test_a_cleared_lot_ships_to_the_five_networks_in_the_standard_layout(self):
        root, run = self.render(reading_deck(3))
        self.assertEqual(run.returncode, 0, run.stderr)
        files = sorted((root / "delivery").rglob("*.png"))
        self.assertEqual(len(files), 5, run.stdout)
        self.assertEqual({f.parent.name for f in files},
                         {"TikTok-Instagram-Facebook-YouTube-LinkedIn"}, run.stdout)
        for file in files:
            with Image.open(file) as rendered:
                self.assertEqual(rendered.size, (1080, 1350))
        report = (root / "delivery" / "RENDU.md").read_text(encoding="utf-8")
        self.assertIn("Lectures d'Afrique", report)
        self.assertIn(LICENCE, report)
        self.assertNotIn("lectures-afrique-v1", report)
        self.assertNotIn("Traceback", run.stderr)

    def test_without_a_message_verdict_the_lot_is_a_proof_not_a_delivery(self):
        root, run = self.render(reading_deck(2), verdicts=False)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertFalse(list((root / "delivery").glob("TikTok*")))
        self.assertTrue(list((root / "delivery" / "_epreuves").rglob("*.png")))
        self.assertIn("message", run.stdout.lower())


if __name__ == "__main__":
    unittest.main()
