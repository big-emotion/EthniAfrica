"""Hold the composition library and its reading profiles to their contracts.

Reading profiles (`reading-story`, `reading-comparison`, `reading-listening`) are
opt-in, like the two before them. A card names a composition; a composition is a
slot contract plus checks over the one compositor. These tests exercise that
through the profile and the compositor, never through helpers' internals.
"""
import copy
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

from PIL import Image, ImageChops

import ethni_carousel_layouts as layouts
import ethni_carousel_profiles as profiles
import ethni_compose as gab
import layout_fixtures as fx

HARNESS = pathlib.Path(__file__).resolve().parent
FAMILY_FIXTURES = HARNESS.parents[0] / "tools/narration/families/fixtures"

# Measured on the unmodified compositor before the comparison divider existed.
NAME_CAROUSEL_DIGEST = "1946b8c06ef742dc343e2cb5df3ee508fa2c0b967f65f462da776ed911c51e32"


def errors(deck):
    return profiles.errors(deck)


def geometry_digest(deck):
    images = fx.images_for(deck)
    rows = []
    for card in deck["cartes"]:
        plan = gab.plan(card, deck, "carrousel", image=images[card["rang"]])
        rows.append([plan.disposition, plan.fautes,
                     [[b.nom, b.x, b.y, b.w, b.h, b.texte, b.couleur, b.corps]
                      for b in plan.blocs]])
    return hashlib.sha256(json.dumps(rows, ensure_ascii=False).encode()).hexdigest()


class ProfileResolutionTest(unittest.TestCase):
    def test_the_three_reading_profiles_resolve_and_the_fixtures_pass(self):
        for deck in (fx.story_deck(), fx.route_deck(), fx.comparison_deck(), fx.listening_deck()):
            with self.subTest(profile=deck["profil"], campaign=deck["campagne"]):
                self.assertEqual(errors(deck), [])
                verdict = gab.portes(deck["cartes"], deck)
                self.assertTrue(verdict.passe, verdict.manquantes)

    def test_unknown_profile_fails_before_any_asset_is_read(self):
        deck = fx.story_deck()
        deck["profil"] = "reading-storey"
        self.assertTrue(errors(deck))
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
            run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                                 capture_output=True, text=True)
            self.assertNotEqual(run.returncode, 0)
            self.assertIn("profil", run.stderr.lower())
            self.assertNotIn("Traceback", run.stderr)
            self.assertEqual(list(root.iterdir()), [root / "cards.json"])

    def test_unknown_or_foreign_composition_is_refused_by_name(self):
        deck = fx.story_deck()
        deck["cartes"][1]["composition"] = "collage"
        self.assertTrue(any("collage" in e for e in errors(deck)))
        deck = fx.story_deck()
        deck["cartes"][1]["composition"] = "listening"  # exists, but not in this profile
        self.assertTrue(any("listening" in e for e in errors(deck)))
        deck = fx.story_deck()
        del deck["cartes"][1]["composition"]
        self.assertTrue(any("composition" in e for e in errors(deck)))

    def test_opening_is_a_cover_and_a_cover_is_only_an_opening(self):
        deck = fx.story_deck()
        deck["cartes"][0]["composition"] = "portrait"
        self.assertTrue(errors(deck))
        deck = fx.story_deck()
        deck["cartes"][2]["composition"] = "cover"
        self.assertTrue(errors(deck))


class CardCountTest(unittest.TestCase):
    """The count belongs to the profile: nothing inherits Mémoires sonores' six."""

    def grow(self, deck, size):
        deck = fx.clone(deck)
        middle = deck["cartes"][1]
        while len(deck["cartes"]) < size:
            extra = fx.clone({"c": middle})["c"]
            deck["cartes"].insert(-1, extra)
        deck["cartes"] = deck["cartes"][:size - 1] + deck["cartes"][-1:] \
            if len(deck["cartes"]) > size else deck["cartes"]
        for rank, card in enumerate(deck["cartes"], 1):
            card["rang"] = rank
        return deck

    def test_each_profile_states_its_own_range(self):
        story = profiles.load("reading-story")["reading"]
        comparison = profiles.load("reading-comparison")["reading"]
        listening = profiles.load("reading-listening")["reading"]
        self.assertEqual((story["min"], story["max"]), (4, 9))
        self.assertEqual((comparison["min"], comparison["max"]), (4, 7))
        self.assertEqual((listening["min"], listening["max"]), (3, 8))

    def test_story_accepts_its_range_and_refuses_outside_it(self):
        for size, valid in ((3, False), (4, True), (5, True), (9, True), (10, False)):
            with self.subTest(size=size):
                deck = self.grow(fx.story_deck(), size)
                self.assertEqual(len(deck["cartes"]), size)
                self.assertEqual(not errors(deck), valid, errors(deck))

    def test_five_cards_are_valid_here_and_invalid_for_the_music_series(self):
        self.assertEqual(errors(fx.story_deck()), [])
        music = fx.story_deck()
        music["profil"] = "memoires-sonores"
        self.assertTrue(errors(music))


class SlotContractTest(unittest.TestCase):
    def test_a_missing_required_slot_is_named(self):
        cases = {
            "portrait": ("precision", "source"),
            "document": ("corps", "source"),
            "map": ("precision", "corps", "source"),
            "credits": ("corps", "source"),
        }
        for composition, slots in cases.items():
            for slot in slots:
                with self.subTest(composition=composition, slot=slot):
                    deck = fx.route_deck() if composition == "map" else fx.story_deck()
                    card = next(c for c in deck["cartes"] if c["composition"] == composition)
                    card[slot] = " "
                    problems = errors(deck)
                    self.assertTrue(any(slot in p and f"carte {card['rang']}" in p
                                        for p in problems), problems)

    def test_subject_zone_is_required_where_a_face_or_a_route_can_be_lost(self):
        for composition, factory in (("portrait", fx.story_deck), ("document", fx.story_deck),
                                     ("map", fx.route_deck), ("cover", fx.story_deck)):
            with self.subTest(composition=composition):
                deck = factory()
                card = next(c for c in deck["cartes"] if c["composition"] == composition)
                del card["image"]["sujet"]
                self.assertTrue(any("sujet" in p for p in errors(deck)), composition)

    def test_subject_zone_must_be_an_ordered_box_inside_the_picture(self):
        for bad in ([0.5, 0.1, 0.4, 0.3], [0.1, 0.1, 1.2, 0.3], [0.1, 0.1, 0.3], "top", [0, 0, 0, 0]):
            with self.subTest(sujet=bad):
                deck = fx.story_deck()
                deck["cartes"][0]["image"]["sujet"] = bad
                self.assertTrue(any("sujet" in p for p in errors(deck)))

    def test_timeline_needs_dated_terms_and_two_to_four_entries(self):
        deck = fx.story_deck()
        deck["cartes"][2]["paires"][0]["terme"] = "Autrefois"
        self.assertTrue(any("date" in p for p in errors(deck)))
        deck = fx.story_deck()
        deck["cartes"][2]["paires"] = deck["cartes"][2]["paires"][:1]
        self.assertTrue(errors(deck))
        deck = fx.story_deck()
        deck["cartes"][2]["paires"] = [{"terme": str(1950 + i), "glose": "fait"} for i in range(5)]
        self.assertTrue(errors(deck))

    def test_comparison_must_declare_its_relation_and_give_every_case_a_gloss(self):
        deck = fx.comparison_deck()
        del deck["cartes"][2]["relation"]
        self.assertTrue(any("relation" in p for p in errors(deck)))
        deck = fx.comparison_deck()
        deck["cartes"][2]["paires"][1]["glose"] = ""
        self.assertTrue(any("glose" in p for p in errors(deck)))

    def test_only_a_comparison_may_declare_a_comparison_relation(self):
        deck = fx.story_deck()
        deck["cartes"][2]["relation"] = "comparaison"
        self.assertTrue(any("relation" in p for p in errors(deck)))

    def test_listening_card_carries_a_timecode_and_the_profile_its_music_notes(self):
        for bad in ("", "au début", "12", "1:5"):
            with self.subTest(precision=bad):
                deck = fx.listening_deck()
                deck["cartes"][1]["precision"] = bad
                self.assertTrue(any("timecode" in p for p in errors(deck)))
        for good in ("0:12", "0:12–0:19", "1:05-1:20"):
            with self.subTest(precision=good):
                deck = fx.listening_deck()
                deck["cartes"][1]["precision"] = good
                self.assertEqual(errors(deck), [])
        deck = fx.listening_deck()
        del deck["musique"]
        self.assertTrue(any("musique" in p for p in errors(deck)))
        deck = fx.listening_deck()
        deck["musique"]["plateformes"]["instagram"]["verifie"] = False
        self.assertTrue(errors(deck))

    def test_cover_title_keeps_the_thumbnail_ceiling_of_eight_words(self):
        deck = fx.story_deck()
        deck["cartes"][0]["titre"] = "un deux trois quatre cinq six sept huit neuf"
        self.assertTrue(any("mots" in p for p in errors(deck)))

    def test_a_reading_deck_has_a_campaign_and_sources_on_every_card_but_the_cover(self):
        deck = fx.story_deck()
        deck["campagne"] = " "
        self.assertTrue(errors(deck))
        deck = fx.story_deck()
        deck["cartes"][3]["source"] = ""
        self.assertTrue(errors(deck))


class PhoneReadabilityTest(unittest.TestCase):
    """Criteria fixed before the boards were drawn. They are the engine's own
    minimums seen at 320 px, so they catch a composition that shrinks type; they
    do not bless a layout the operator has not looked at."""

    def plans(self, deck, fmt="carrousel"):
        images = fx.images_for(deck)
        return [(c, gab.plan(c, deck, fmt, image=images[c["rang"]])) for c in deck["cartes"]]

    def test_every_fixture_card_fits_and_reads_at_320_px(self):
        for deck in (fx.story_deck(), fx.route_deck(), fx.comparison_deck(), fx.listening_deck()):
            for card, plan in self.plans(deck):
                with self.subTest(deck=deck["campagne"], rank=card["rang"]):
                    self.assertEqual(layouts.readability_problems(plan, "carrousel"), [])

    def test_text_that_does_not_fit_is_reported_not_shrunk(self):
        deck = fx.story_deck()
        deck["cartes"][3]["corps"] = "Un très long texte de document. " * 40
        card, plan = self.plans(deck)[3]
        problems = layouts.readability_problems(plan, "carrousel")
        self.assertTrue(problems)

    def test_type_below_the_phone_floor_is_reported(self):
        deck = fx.story_deck()
        card, plan = self.plans(deck)[1]
        for bloc in plan.blocs:
            if bloc.nom == "titre":
                bloc.corps = 40
        self.assertTrue(any("titre" in p for p in layouts.readability_problems(plan, "carrousel")))

    def test_every_cover_still_names_its_subject_at_thumbnail_width(self):
        for deck in (fx.story_deck(), fx.route_deck(), fx.comparison_deck(), fx.listening_deck()):
            card, plan = self.plans(deck)[0]
            with self.subTest(deck=deck["campagne"]):
                self.assertEqual(layouts.thumbnail_problems(plan, "carrousel"), [])

    def test_a_cover_title_that_shrank_is_caught_at_thumbnail_width(self):
        card, plan = self.plans(fx.story_deck())[0]
        plan.bloc("titre").corps = 60
        self.assertTrue(layouts.thumbnail_problems(plan, "carrousel"))

    def test_viewport_ladder_starts_at_the_phone(self):
        self.assertEqual(layouts.VIEWPORTS[:3], (320, 390, 430))
        self.assertLess(layouts.VIEWPORTS[2], layouts.VIEWPORTS[3])


class DestinationCropTest(unittest.TestCase):
    def check(self, deck, rank, fmt="carrousel"):
        card = deck["cartes"][rank - 1]
        image = fx.images_for(deck)[rank]
        plan = gab.plan(card, deck, fmt, image=image)
        return layouts.zone_problems(card, plan, fmt, image)

    def test_fixture_subjects_survive_their_destination(self):
        for deck in (fx.story_deck(), fx.route_deck(), fx.comparison_deck()):
            for card in deck["cartes"]:
                if "sujet" in card["image"]:
                    with self.subTest(deck=deck["campagne"], rank=card["rang"]):
                        self.assertEqual(self.check(deck, card["rang"]), [])

    def test_a_focal_point_that_crops_the_subject_out_is_caught(self):
        deck = fx.story_deck()
        deck["cartes"][0]["image"]["w"], deck["cartes"][0]["image"]["h"] = fx.W, fx.H
        # Widen the source so the 4:5 cover crop must discard the sides, then aim
        # the crop away from a subject sitting at the left edge.
        wide = Image.new("RGB", (4000, 2700), (40, 40, 40))
        card = deck["cartes"][0]
        card["image"]["sujet"] = [0.02, 0.10, 0.20, 0.40]
        card["image"]["cadrage"] = "100% 50%"
        plan = gab.plan(card, deck, "carrousel", image=wide)
        problems = layouts.zone_problems(card, plan, "carrousel", wide)
        self.assertTrue(any("recadrage" in p or "crop" in p for p in problems), problems)
        card["image"]["cadrage"] = "0% 50%"
        plan = gab.plan(card, deck, "carrousel", image=wide)
        self.assertEqual(layouts.zone_problems(card, plan, "carrousel", wide), [])

    def test_a_subject_under_the_text_column_is_caught(self):
        deck = fx.story_deck()
        card = deck["cartes"][1]
        card["image"]["sujet"] = [0.20, 0.70, 0.80, 0.95]
        problems = self.check(deck, 2)
        self.assertTrue(any("texte" in p for p in problems), problems)

    def test_a_subject_sunk_into_the_scrim_ramp_is_caught_before_it_meets_any_text(self):
        deck = fx.story_deck()
        card = deck["cartes"][3]
        image = fx.images_for(deck)[4]
        plan = gab.plan(card, deck, "carrousel", image=image)
        ramp = plan.bloc("voile-rampe")
        first_text = min(b.y for b in plan.blocs if b.texte and not b.nom.startswith("entete"))
        # Just clear of the text, but well inside the ramp that darkens the photograph.
        bottom = (first_text - 4) / 1350
        top = bottom - 0.10
        self.assertGreater(first_text - 4, ramp.y + 0.55 * ramp.h)
        card["image"]["sujet"] = [0.20, top, 0.80, bottom]
        problems = layouts.zone_problems(card, plan, "carrousel", image)
        self.assertTrue(any("voile" in p for p in problems), problems)

    def test_a_subject_in_the_platform_interface_band_of_a_reel_is_caught(self):
        deck = fx.story_deck()
        card = deck["cartes"][0]
        image = fx.images_for(deck)[1]
        card["image"]["sujet"] = [0.20, 0.86, 0.80, 0.98]
        plan = gab.plan(card, deck, "reel", image=image)
        problems = layouts.zone_problems(card, plan, "reel", image)
        self.assertTrue(any("1620" in p for p in problems), problems)

    def test_profiles_declare_the_crops_they_are_reviewed_at(self):
        for name in ("reading-story", "reading-comparison", "reading-listening"):
            self.assertEqual(profiles.load(name)["crops"], ["carrousel"])


class ComparisonDividerTest(unittest.TestCase):
    """A derivation pair says « became »; a comparison must not."""

    def plan(self, deck, rank):
        card = deck["cartes"][rank - 1]
        return gab.plan(card, deck, "carrousel", image=fx.images_for(deck)[rank])

    def test_comparison_shows_both_cases_in_the_same_ink_with_no_arrow(self):
        plan = self.plan(fx.comparison_deck(), 3)
        first, second = plan.bloc("couple-0-terme"), plan.bloc("couple-1-terme")
        self.assertEqual(first.couleur, second.couleur)
        self.assertIsNone(plan.bloc("couple-fleche-1"))
        self.assertIsNotNone(plan.bloc("couple-separateur-1"))
        self.assertNotIn("→", plan.bloc("couple-separateur-1").texte)

    def test_timeline_keeps_its_arrow_but_crowns_no_date(self):
        deck = fx.story_deck()
        deck["cartes"][2]["relation"] = "chronologie"
        self.assertEqual(errors(deck), [])
        plan = self.plan(deck, 3)
        inks = {plan.bloc(f"couple-{i}-terme").couleur for i in range(3)}
        self.assertEqual(len(inks), 1)
        self.assertEqual(plan.bloc("couple-fleche-1").texte, "→")
        self.assertIsNone(plan.bloc("couple-separateur-1"))

    def test_only_two_relations_exist_and_each_belongs_to_its_composition(self):
        deck = fx.story_deck()
        deck["cartes"][2]["relation"] = "hiérarchie"
        self.assertTrue(any("relation" in p for p in errors(deck)))
        deck = fx.comparison_deck()
        deck["cartes"][2]["relation"] = "chronologie"
        self.assertTrue(any("relation" in p for p in errors(deck)))

    def test_derivation_pair_is_unchanged(self):
        deck = fx.name_carousel_deck()
        plan = self.plan(deck, 4)
        self.assertEqual(plan.bloc("couple-fleche-1").texte, "→")
        self.assertNotEqual(plan.bloc("couple-0-terme").couleur,
                            plan.bloc("couple-1-terme").couleur)
        self.assertIsNone(plan.bloc("couple-separateur-1"))


class RegressionTest(unittest.TestCase):
    def test_name_carousel_keeps_its_gates_layouts_and_geometry(self):
        deck = fx.name_carousel_deck()
        self.assertEqual(errors(deck), [])
        self.assertTrue(gab.portes(deck["cartes"], deck).passe)
        self.assertEqual(geometry_digest(deck), NAME_CAROUSEL_DIGEST)

    def test_music_profile_is_still_the_standard_gabarit_pixel_for_pixel(self):
        from test_carousel_profiles import musical_deck
        from test_memoires_layout import ordinary_twin
        deck = musical_deck()
        twin = ordinary_twin(deck)
        photo = Image.new("RGB", (1600, 2000), (90, 70, 50))
        for card, plain in zip(deck["cartes"], twin["cartes"]):
            actual = gab.composer(card, deck, "carrousel", image=photo).convert("RGB")
            expected = gab.composer(plain, twin, "carrousel", image=photo).convert("RGB")
            self.assertIsNone(ImageChops.difference(actual, expected).getbbox())
        self.assertEqual(len(deck["cartes"]), 6)

    def test_existing_profile_files_are_untouched_in_kind(self):
        self.assertNotIn("reading", profiles.load("memoires-sonores"))
        self.assertNotIn("reading", profiles.load("lectures-afrique"))


class FamilyExamplesTest(unittest.TestCase):
    """Six narrative-to-layout examples, as data, drift-checked against S3's families."""

    def table(self):
        return json.loads((HARNESS / "layout-examples/family-layouts.json")
                          .read_text(encoding="utf-8"))

    def test_every_narrative_family_has_a_layout_example(self):
        families = {json.loads(f.read_text(encoding="utf-8"))["edition"]["family"]
                    for f in FAMILY_FIXTURES.glob("*.brief.json")}
        self.assertEqual(len(families), 6)
        self.assertEqual(set(self.table()["families"]), families)

    def test_each_example_fits_the_profile_it_names(self):
        for family, example in self.table()["families"].items():
            with self.subTest(family=family):
                if example["profile"] is None:
                    self.assertEqual(family, "name-investigation")
                    continue
                selected = profiles.load(example["profile"])["reading"]
                sequence = example["cards"]
                self.assertGreaterEqual(len(sequence), selected["min"])
                self.assertLessEqual(len(sequence), selected["max"])
                self.assertEqual(sequence[0], "cover")
                for composition in sequence:
                    self.assertIn(composition, layouts.COMPOSITIONS)
                    self.assertIn(composition,
                                  selected["compositions"] + ["cover"])

    def test_no_family_needs_its_own_renderer(self):
        used = {c for e in self.table()["families"].values() for c in e.get("cards", [])}
        self.assertLessEqual(used, set(layouts.COMPOSITIONS))
        self.assertLessEqual(len(layouts.COMPOSITIONS), 8)


class CliTest(unittest.TestCase):
    def test_brief_scaffolds_a_reading_profile_without_music_or_six_cards(self):
        run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"),
                              "--brief", "reading-story"], capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)
        brief = json.loads(run.stdout)
        self.assertEqual(brief["deck"]["profil"], "reading-story")
        self.assertNotIn("musique", brief["deck"])
        self.assertEqual(brief["deck"]["cartes"][0]["composition"], "cover")
        self.assertFalse(gab.portes(brief["deck"]["cartes"], brief["deck"]).passe)

    def test_real_render_of_a_reading_deck_delivers_its_own_card_count(self):
        deck = fx.story_deck()
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "assets").mkdir()
            for name, image in (("p.png", fx.portrait_image()), ("d.png", fx.document_image()),
                                ("g.png", fx.ground_image())):
                image.save(root / "assets" / name)
            deck["outDir"] = str(root / "delivery")
            (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
            (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-29, par l’opérateur.\n")
            (root / "message.md").write_text("Verdict : **passe**\n")
            run = subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                                 capture_output=True, text=True, timeout=240)
            self.assertEqual(run.returncode, 0, run.stderr + run.stdout)
            files = sorted((root / "delivery").rglob("*.png"))
            self.assertEqual(len(files), 5, run.stdout)
            for file in files:
                with Image.open(file) as rendered:
                    self.assertEqual(rendered.size, (1080, 1350))


class RenderBlocksACroppedSubjectTest(unittest.TestCase):
    def test_a_lot_whose_crop_loses_the_subject_is_a_proof_that_says_why(self):
        deck = fx.story_deck()
        deck["cartes"][0]["image"].update({"sujet": [0.02, 0.10, 0.20, 0.40], "cadrage": "100% 50%"})
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            (root / "assets").mkdir()
            Image.new("RGB", (4000, 2700), (50, 44, 40)).save(root / "assets/p.png")
            fx.document_image().save(root / "assets/d.png")
            fx.ground_image().save(root / "assets/g.png")
            deck["outDir"] = str(root / "delivery")
            (root / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
            (root / "post.md").write_text("**Texte validé** : oui, le 2026-09-29, par l’opérateur.\n")
            (root / "message.md").write_text("Verdict : **passe**\n")
            subprocess.run([sys.executable, str(HARNESS / "ethni_carrousel2.py"), str(root)],
                           capture_output=True, text=True, timeout=240)
            reports = list((root / "delivery").rglob("RENDU.md"))
            self.assertTrue(reports)
            self.assertIn("recadrage", reports[0].read_text(encoding="utf-8"))
            self.assertFalse(any(f.parent.name.startswith("TikTok")
                                 for f in (root / "delivery").rglob("*.png")))


if __name__ == "__main__":
    unittest.main()
