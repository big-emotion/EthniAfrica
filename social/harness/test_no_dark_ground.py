"""There is no dark, plain or solid-colour background mode: a full-frame image sits behind every
carousel card and every reel scene, and a missing one is refused instead of painted over."""
import copy
import json
import pathlib
import unittest

import numpy
from PIL import Image

import ethni_carousel_profiles as profiles
import ethni_compose as gab
import ethni_couvertures as covers
import layout_fixtures as fx
import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer

PROFILES = pathlib.Path(__file__).resolve().parent / "carousel-profiles"
GROUND_KEYS = {"fond", "ground", "background", "plain", "solid", "colour", "color"}


def keys_of(value):
    if isinstance(value, dict):
        for key, inner in value.items():
            yield key
            yield from keys_of(inner)
    elif isinstance(value, list):
        for inner in value:
            yield from keys_of(inner)


class ReelSceneTests(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def scene(self, kind, **content):
        plan = copy.deepcopy(self.plan)
        plan["scenes"] = [{"id": "s", "type": kind, "start": 0, "end": 10, "title": "Titre",
                           "purpose": "Show the subject",
                           "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"]), **content}]
        return plan

    def test_the_dark_panel_layout_is_refused(self):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = "panel"
        with self.assertRaisesRegex(ValueError, "panel"):
            validate_plan(plan, self.root, 10)

    def test_a_plan_without_a_layout_is_the_full_frame_one(self):
        validate_plan(self.plan, self.root, 10)
        frame = SceneRenderer(self.plan, self.root, [], proof=False).render(1)
        middle = numpy.asarray(frame.convert("L"), dtype=float)[900:1000, 20:1060]
        self.assertGreater(middle.mean(), 130, "the sea of the map fills the frame, not a dark panel")

    def test_scenes_with_no_full_frame_picture_are_refused(self):
        for kind, content in (("text", {"text": "Words"}),
                              ("document", {"document": {"asset": "photo", "label": "L", "body": "B"}})):
            with self.subTest(kind), self.assertRaisesRegex(ValueError, "full-frame"):
                validate_plan(self.scene(kind, **content), self.root, 10)

    def test_a_kinetic_card_needs_a_picture_behind_its_lines(self):
        lines = {"kinetic": {"lines": [{"text": "le pays : la carte", "at": 1.0}]}}
        with self.assertRaisesRegex(ValueError, "backdrop"):
            validate_plan(self.scene("kinetic", **lines), self.root, 10)
        backed = self.scene("kinetic", backdrop={"image": {"asset": "photo", "fit": "cover"}}, **lines)
        validate_plan(backed, self.root, 10)

    def test_a_kinetic_card_shows_its_picture_where_no_line_is_drawn(self):
        lines = {"kinetic": {"lines": [{"text": "le pays : la carte", "at": 1.0}]}}
        plan = self.scene("kinetic", backdrop={"image": {"asset": "photo", "fit": "cover"}}, **lines)
        frame = SceneRenderer(plan, self.root, [], proof=False).render(0.2)
        band = numpy.asarray(frame.convert("RGB"), dtype=int)[700:900, 20:60].mean()
        self.assertGreater(band, 40, "the grey photograph shows through the scrim; the night ground is about 14")

    def test_a_chronology_needs_a_map_behind_it(self):
        evidence = copy.deepcopy(self.plan["scenes"][0]["evidence"])
        timeline = {"layout": "focus", "scale": "ordinal",
                    "events": [{"year": 1900, "label": "Un fait", "at": 1.0, "evidence": evidence},
                               {"year": 1960, "label": "Un autre", "at": 4.0, "evidence": evidence}]}
        with self.assertRaisesRegex(ValueError, "background"):
            validate_plan(self.scene("timeline", timeline=timeline), self.root, 10)


class CarouselTests(unittest.TestCase):
    def test_no_carousel_profile_declares_a_ground(self):
        for path in sorted(PROFILES.glob("*.json")):
            with self.subTest(path.name):
                found = GROUND_KEYS & set(keys_of(json.loads(path.read_text(encoding="utf-8"))))
                self.assertFalse(found, f"{path.name} declares {sorted(found)}")

    def test_a_deck_with_a_card_lacking_its_image_is_refused(self):
        deck = fx.story_deck()
        deck["cartes"][1]["image"] = {}
        problems = profiles.image_errors(deck)
        self.assertEqual(len(problems), 1)
        self.assertIn("carte 2", problems[0])
        self.assertIn("image", problems[0])

    def test_a_deck_without_a_profile_is_held_to_the_same_rule(self):
        deck = {"campagne": "nom", "cartes": [{"rang": 1, "image": {"fichier": "a.png"}},
                                              {"rang": 2}]}
        self.assertEqual(len(profiles.image_errors(deck)), 1)
        self.assertEqual(profiles.image_errors({"cartes": [{"rang": 1, "image": {"fichier": "a.png"}}]}), [])

    def test_the_compositor_refuses_a_card_with_no_image_instead_of_painting_a_ground(self):
        deck = fx.story_deck()
        card = deck["cartes"][0]
        for build in (lambda: gab.plan(card, deck, "carrousel", image=None),
                      lambda: gab.composer(card, deck, "carrousel", image=None),
                      lambda: gab.plan_video(card, deck, image=None)):
            with self.assertRaisesRegex(ValueError, "image"):
                build()

    def test_the_reading_list_mosaic_stands_on_a_picture_not_on_the_deck_ground(self):
        deck = fx.story_deck()
        red = Image.new("RGB", (500, 800), (200, 40, 40))
        mosaic = covers.prepare_mosaic([red, red.copy()], deck["cartes"][0], deck)
        corner = mosaic.getpixel((4, 4))
        self.assertGreater(corner[0] - corner[2], 40, "the corner shows the cover's own picture, blurred")

    def test_every_card_of_the_fixture_decks_is_drawn_over_its_image(self):
        image = Image.new("RGB", (2160, 2700), (200, 60, 60))
        deck = fx.story_deck()
        card = deck["cartes"][0]
        frame = numpy.asarray(gab.composer(card, deck, "carrousel", image=image).convert("RGB"), dtype=int)
        band = frame[700:800, :].reshape(-1, 3).mean(axis=0)
        self.assertGreater(band[0] - band[2], 20, "the picture's red reaches the middle of the card")


if __name__ == "__main__":
    unittest.main()
