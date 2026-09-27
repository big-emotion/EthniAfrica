"""Hold the reading-list carousel (`lectures-afrique`) to its own layout and gates.

The profile is a variable-length deck: one opening card, one card per book, one
closing card. A book card shows the cover cut out and straightened on the night
ground, with its title, author and credit — no scrim, no full-bleed photograph.
"""
import copy
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

import ethni_carousel_profiles as profiles
import ethni_compose as gab
import ethni_tokens as tk

HARNESS = pathlib.Path(__file__).resolve().parent
NETWORKS = ["TikTok", "Instagram", "Facebook", "YouTube", "LinkedIn"]
CLOSING_TITLE = "Notre objectif : raconter l'origine des noms, avec des sources."
CLOSING_BODY = "Vous avez une histoire, un nom transmis ou une source ? Partagez-la sur EthniAfrica."


def book(rank, title, author, size=(600, 900)):
    return {
        "rang": rank, "role": "serie", "titre": title, "precision": author,
        "corps": "", "punchline": "", "source": "",
        "image": {
            "fichier": f"cover-{rank}.png", "w": size[0], "h": size[1],
            "cadrage": "50% 50%", "identite": f"La couverture de {title}",
            "credit": "Couverture : Points, photographiée par l'opérateur",
            "depot": "photographie de l'opérateur", "licence": "CC0",
            "verifie": {"par": "test", "le": "2026-09-27"},
        },
        "disposition": "auto",
    }


def reading_deck(books=3):
    cards = [{"rang": 1, "role": "ouverture", "titre": "Le regard venu d'ailleurs",
              "precision": "", "corps": "", "punchline": "", "source": "", "disposition": "auto"}]
    titles = [("Ébène", "Ryszard Kapuściński"), ("Histoire des Blancs", "Nell Irvin Painter"),
              ("L'Invention de l'Afrique", "Valentin-Yves Mudimbe"), ("Le Consciencisme", "Kwame Nkrumah")]
    for i in range(books):
        cards.append(book(i + 2, *titles[i]))
    cards.append({"rang": books + 2, "role": "cloture", "titre": CLOSING_TITLE,
                  "corps": CLOSING_BODY, "precision": "", "punchline": "", "source": "",
                  "disposition": "auto"})
    return {"profil": "lectures-afrique", "campagne": "lectures-test", "pilier": "Lectures",
            "accent": "ocre", "fond": "nuit", "cartes": cards}


class ReadingListProfileTest(unittest.TestCase):
    def test_a_well_formed_reading_list_passes_the_profile_check(self):
        for books in (1, 3, 4):
            with self.subTest(books=books):
                deck = reading_deck(books)
                self.assertEqual(profiles.errors(deck), [])

    def test_only_the_carousel_reaches_the_five_networks_that_receive_it(self):
        deck = reading_deck()
        self.assertEqual(profiles.formats(deck, ("carrousel", "reel")), ("carrousel",))
        self.assertEqual(tk.reseaux("carrousel", deck), NETWORKS)
        self.assertNotIn("X", tk.reseaux("carrousel", deck))

    def test_only_book_cards_carry_an_image(self):
        deck = reading_deck()
        uses = [profiles.uses_image(deck, c) for c in deck["cartes"]]
        self.assertEqual(uses, [False, True, True, True, False])

    def test_structure_errors_are_named_in_the_operators_language(self):
        def broken(mutate):
            deck = reading_deck()
            mutate(deck)
            return profiles.errors(deck)

        cases = {
            "no book": lambda d: d["cartes"].__delitem__(slice(1, 4)),
            "closing first": lambda d: d["cartes"].insert(0, d["cartes"].pop()),
            "no author": lambda d: d["cartes"][1].update(precision=" "),
            "no title": lambda d: d["cartes"][2].update(titre=""),
            "no cover file": lambda d: d["cartes"][1]["image"].update(fichier=""),
            "closing without body": lambda d: d["cartes"][-1].update(corps=""),
            "wrong rank": lambda d: d["cartes"][2].update(rang=7),
            "forced layout": lambda d: d["cartes"][1].update(disposition="B"),
            "no campaign": lambda d: d.update(campagne=" "),
        }
        for name, mutate in cases.items():
            with self.subTest(case=name):
                problems = broken(mutate)
                self.assertTrue(problems, name)
                self.assertTrue(all("Lectures d'Afrique" in p for p in problems), problems)

    def test_the_gates_refuse_a_broken_deck_before_any_rendering(self):
        deck = reading_deck()
        deck["cartes"][1]["precision"] = ""
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)
        self.assertTrue(gab.portes(reading_deck()["cartes"], reading_deck()).passe)

    def test_a_licence_gate_still_applies_to_every_cover(self):
        deck = reading_deck()
        deck["cartes"][1]["image"]["licence"] = "tous droits réservés"
        verdict = gab.portes(deck["cartes"], deck)
        self.assertFalse(verdict.passe)
        self.assertTrue(any("licence" in m for m in verdict.manquantes), verdict.manquantes)

    def test_the_operator_declared_licence_clears_the_gate_only_inside_this_profile(self):
        assumed = profiles.assumed_licence(reading_deck())
        self.assertIn("assumée par l'opérateur", assumed)

        deck = reading_deck()
        for card in deck["cartes"]:
            if card.get("image"):
                card["image"]["licence"] = assumed
        verdict = gab.portes(deck["cartes"], deck)
        self.assertTrue(verdict.passe, verdict.manquantes)
        self.assertEqual(verdict.licence_sortie, assumed)

        # Any other unnamed licence in the same deck is still refused.
        deck["cartes"][1]["image"]["licence"] = "tous droits réservés"
        self.assertFalse(gab.portes(deck["cartes"], deck).passe)

        # The same words on a deck without the profile prove nothing.
        plain = reading_deck(1)
        del plain["profil"]
        plain["cartes"][1]["image"]["licence"] = assumed
        verdict = gab.portes(plain["cartes"], plain)
        self.assertFalse(verdict.passe)
        self.assertTrue(any("licence" in m for m in verdict.manquantes), verdict.manquantes)
        self.assertIsNone(profiles.assumed_licence(plain))

    def test_the_operator_approved_the_look_on_the_date_of_the_decision(self):
        visual = profiles.visual(reading_deck())
        self.assertEqual(visual["status"], "approved")
        self.assertEqual(visual["approvedOn"], "2026-09-27")

    def test_the_brief_supplies_its_guide_without_inventing_a_music_block(self):
        run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"),
                              "--brief", "lectures-afrique"], capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        brief = json.loads(run.stdout)
        guide = HARNESS.parents[1] / brief["guide"]
        self.assertEqual(brief["instructions"], guide.read_text(encoding="utf-8"))
        self.assertEqual(brief["deck"]["profil"], "lectures-afrique")
        self.assertNotIn("musique", brief["deck"])
        self.assertEqual([c["role"] for c in brief["deck"]["cartes"]],
                         ["ouverture", "serie", "cloture"])

    def test_memoires_sonores_keeps_its_own_layout(self):
        from test_carousel_profiles import musical_deck
        self.assertEqual(profiles.layout(musical_deck()).__name__, "ethni_memoires")
        self.assertEqual(profiles.layout(reading_deck()).__name__, "ethni_lectures")
        self.assertIsNone(profiles.layout({"cartes": []}))


class ReadingListLayoutTest(unittest.TestCase):
    def plan_for(self, rank, deck=None, image_size=(600, 900)):
        deck = deck or reading_deck()
        card = deck["cartes"][rank - 1]
        image = Image.new("RGB", image_size, (120, 90, 60)) if profiles.uses_image(deck, card) else None
        return deck, card, image, gab.plan(card, deck, "carrousel", image=image)

    def test_the_cover_is_contained_whole_never_cropped_or_stretched(self):
        for size in ((600, 900), (949, 715), (469, 767), (1100, 1100)):
            with self.subTest(size=size):
                _, _, _, plan = self.plan_for(2, image_size=size)
                cover = plan.bloc("bande-image")
                self.assertEqual(plan.fautes, [])
                self.assertAlmostEqual(cover.w / cover.h, size[0] / size[1], delta=0.01)
                self.assertGreaterEqual(cover.x, 68)
                self.assertLessEqual(cover.x + cover.w, 1012)
                self.assertGreaterEqual(cover.y, 210)
                self.assertLessEqual(cover.y + cover.h, 1000)

    def test_a_cover_too_small_to_enlarge_is_refused_not_upscaled_silently(self):
        _, _, _, plan = self.plan_for(2, image_size=(120, 180))
        self.assertTrue(any("agrandissement" in f for f in plan.fautes), plan.fautes)

    def test_title_author_and_credit_sit_between_the_cover_and_the_footer(self):
        _, _, _, plan = self.plan_for(2)
        cover = plan.bloc("bande-image")
        for name in ("titre", "precision", "credit"):
            block = plan.bloc(name)
            self.assertIsNotNone(block, name)
            self.assertGreaterEqual(block.y, cover.y + cover.h, name)
            self.assertLessEqual(block.y + block.h, 1198, name)

    def test_a_long_title_wraps_on_two_lines_and_a_longer_one_is_a_fault_not_smaller_type(self):
        deck = reading_deck()
        deck["cartes"][1]["titre"] = "Histoire générale de l'Afrique, I : Méthodologie et préhistoire africaine"
        _, _, _, plan = self.plan_for(2, deck)
        self.assertEqual(plan.fautes, [])
        self.assertLessEqual(len(plan.bloc("titre").lignes), 2)
        size = plan.bloc("titre").corps

        deck["cartes"][1]["titre"] = " ".join(["Histoire générale de l'Afrique, méthodologie"] * 4)
        _, _, _, long_plan = self.plan_for(2, deck)
        self.assertTrue(long_plan.fautes, "an overflowing title must not pass")
        self.assertEqual(long_plan.bloc("titre").corps, size, "type is never shrunk to fit")

    def test_the_opening_states_the_number_of_books_counted_from_the_deck(self):
        for books, expected in ((1, "1 LIVRE"), (3, "3 LIVRES"), (4, "4 LIVRES")):
            with self.subTest(books=books):
                deck = reading_deck(books)
                _, _, _, plan = self.plan_for(1, deck)
                self.assertEqual(plan.fautes, [])
                self.assertIn(expected, [b.texte for b in plan.blocs])

    def test_the_rank_shows_the_card_and_the_total(self):
        deck = reading_deck(3)
        for rank, expected in ((1, "01 / 05"), (3, "03 / 05"), (5, "05 / 05")):
            _, _, _, plan = self.plan_for(rank, deck)
            self.assertIn(expected, [b.texte for b in plan.blocs], rank)

    def test_the_closing_is_the_unique_closing_and_carries_no_link_or_vision_line(self):
        _, _, _, plan = self.plan_for(5)
        texts = [b.texte for b in plan.blocs]
        self.assertEqual(plan.fautes, [])
        self.assertIn(CLOSING_TITLE.upper(), [t.upper() for t in texts])
        self.assertIn(CLOSING_BODY, texts)
        self.assertNotIn("appel-action", [b.nom for b in plan.blocs])

    def test_every_planned_block_is_actually_painted(self):
        deck = reading_deck(3)
        for rank in range(1, 6):
            with self.subTest(rank=rank):
                deck_, card, image, _ = self.plan_for(rank, deck)
                self.assertEqual(gab.blocs_non_peints(card, deck_, "carrousel", image=image), [])

    def test_a_book_card_is_a_1080_by_1350_frame_with_the_cover_pixels_on_it(self):
        deck, card, _, plan = self.plan_for(2)
        cover = Image.new("RGB", (600, 900), (200, 40, 40))
        frame = gab.composer(card, deck, "carrousel", image=cover).convert("RGB")
        self.assertEqual(frame.size, (1080, 1350))
        block = plan.bloc("bande-image")
        centre = (block.x + block.w // 2, block.y + block.h // 2)
        self.assertEqual(frame.getpixel(centre), (200, 40, 40))
        # Outside the cover the night ground stays clean: no scrim over a photograph.
        ground = frame.getpixel((20, 700))
        self.assertLess(sum(ground), 150)

    def test_the_layout_is_a_carousel_layout_and_refuses_the_reel_format(self):
        deck = reading_deck()
        with self.assertRaises(ValueError):
            gab.plan(deck["cartes"][1], deck, "reel", image=Image.new("RGB", (600, 900)))


class ReadingListRenderTest(unittest.TestCase):
    def render(self, deck, with_verdicts=True):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = pathlib.Path(directory.name)
        (root / "assets").mkdir()
        for card in deck["cartes"]:
            if card.get("image"):
                Image.new("RGB", (card["image"]["w"], card["image"]["h"]),
                          (150, 110, 70)).save(root / "assets" / card["image"]["fichier"])
        deck["outDir"] = str(root / "delivery")
        (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
        if with_verdicts:
            (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-27, par l'opérateur.\n")
            (root / "message.md").write_text("Verdict : **passe**\n")
        run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                             capture_output=True, text=True, timeout=240)
        return root, run

    def test_a_cleared_lot_ships_every_card_to_the_five_networks_without_a_quota(self):
        root, run = self.render(reading_deck(4))
        self.assertEqual(run.returncode, 0, run.stderr)
        files = sorted((root / "delivery").rglob("*.png"))
        self.assertEqual(len(files), 6, run.stdout)
        self.assertEqual({f.parent.name for f in files},
                         {"TikTok-Instagram-Facebook-YouTube-LinkedIn"}, run.stdout)
        for file in files:
            with Image.open(file) as rendered:
                self.assertEqual(rendered.size, (1080, 1350))
        report = (root / "delivery" / "RENDU.md").read_text(encoding="utf-8")
        self.assertIn("Lectures d'Afrique", report)
        self.assertNotIn("Présentation musicale", report)
        self.assertNotIn("Traceback", run.stderr)

    def test_without_a_message_verdict_the_lot_is_a_proof_not_a_delivery(self):
        root, run = self.render(reading_deck(2), with_verdicts=False)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertFalse(list((root / "delivery").glob("TikTok*")))
        self.assertTrue(list((root / "delivery" / "_epreuves").rglob("*.png")))
        self.assertIn("message", run.stdout.lower())


if __name__ == "__main__":
    unittest.main()
