"""The full-frame layout: the picture or the map fills the screen, in the legacy film's grammar."""
import copy
import unittest

import numpy
from PIL import Image

import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer

SPOKEN = [{"debut": 0.0, "fin": 4.0, "texte": "A spoken sentence for the caption box."}]


class FullbleedTests(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def fullbleed(self):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = "fullbleed"
        plan["scenes"][1]["image"]["motion"]["to"] = [1.03, .6, .5]
        return plan

    def evidence(self):
        return copy.deepcopy(self.plan["scenes"][0]["evidence"])

    def test_the_layout_is_named_and_only_two_are_known(self):
        plan = self.fullbleed()
        validate_plan(plan, self.root, 10)
        plan["layout"] = "sideways"
        with self.assertRaisesRegex(ValueError, "layout"):
            validate_plan(plan, self.root, 10)

    def test_full_frame_layout_refuses_scenes_it_cannot_draw(self):
        plan = self.fullbleed()
        plan["scenes"][1]["type"] = "text"
        plan["scenes"][1]["text"] = "Words"
        del plan["scenes"][1]["image"]
        with self.assertRaisesRegex(ValueError, "fullbleed"):
            validate_plan(plan, self.root, 10)

    def test_images_zoom_at_most_a_few_percent_like_the_legacy_film(self):
        plan = self.fullbleed()
        plan["scenes"][1]["image"]["motion"] = {"from": [1, .5, .5], "to": [1.2, .5, .5]}
        with self.assertRaisesRegex(ValueError, "zoom"):
            validate_plan(plan, self.root, 10)

    def test_the_frame_is_filled_by_the_map_and_the_title_sits_low_left(self):
        plan = self.fullbleed()
        renderer = SceneRenderer(plan, self.root, SPOKEN, proof=False)
        frame = renderer.render(1)
        self.assertEqual(frame.size, (1080, 1920))
        grey = numpy.asarray(frame.convert("L"), dtype=float)
        # The sea is a light colour edge to edge in the middle of the frame, not a dark panel.
        self.assertGreater(grey[900:1000, 20:1060].mean(), 130)
        # The title is drawn in the lower left, over the shading.
        without = copy.deepcopy(plan)
        without["scenes"][0]["title"] = "Different"
        other = SceneRenderer(without, self.root, SPOKEN, proof=False).render(1)
        changed = numpy.asarray(ImageChopsDiff(frame, other))
        ys, xs = numpy.nonzero(changed)
        self.assertGreater(ys.min(), 900)
        self.assertLess(xs.max(), 960)

    def test_the_caption_rides_a_translucent_box_and_yields_to_the_cover(self):
        plan = self.fullbleed()
        plan["cover"] = True
        with_caption = SceneRenderer(plan, self.root, SPOKEN, proof=False)
        bare = SceneRenderer(plan, self.root, [], proof=False)
        self.assertEqual(with_caption.render(.5).tobytes(), bare.render(.5).tobytes())
        self.assertNotEqual(with_caption.render(2.5).tobytes(), bare.render(2.5).tobytes())

    def test_a_short_landscape_photo_gets_a_blurred_backdrop_instead_of_empty_bands(self):
        plan = self.fullbleed()
        photo = Image.new("RGB", (1360, 740), (200, 40, 40))
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        renderer.assets["photo"] = photo
        scene = plan["scenes"][1]
        scene["image"] = {"asset": "photo", "fit": "contain"}
        frame = renderer.render(scene["start"] + 1)
        top, middle = frame.getpixel((540, 700)), frame.getpixel((540, 960))
        self.assertGreater(top[0], top[1] + 20, "the backdrop repeats the photo's colour above it")
        self.assertGreater(middle[0], middle[1] + 60)

    def test_a_country_switches_on_at_its_cue_and_needs_the_national_layer(self):
        plan = self.fullbleed()
        scene = plan["scenes"][0]
        scene["map"]["layer"] = "national"
        scene["map"]["camera"] = [{"at": 0, "bounds": [-20, -5, 20, 25]}]
        scene["map"]["features"] = [{"kind": "country", "code": "AAA", "label": "Land", "at": 2, "until": 5,
                                     "fade_seconds": .5, "colour": "gold", "evidence": self.evidence()}]
        validate_plan(plan, self.root, 10)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        before, after = renderer.render(1.5), renderer.render(3)
        self.assertNotEqual(before.tobytes(), after.tobytes())
        scene["map"]["layer"] = "political"
        with self.assertRaisesRegex(ValueError, "national"):
            validate_plan(plan, self.root, 10)
        scene["map"]["layer"] = "national"
        scene["map"]["features"][0]["code"] = "ZZZ"
        with self.assertRaisesRegex(ValueError, "country"):
            validate_plan(plan, self.root, 10)

    def test_an_insert_card_sits_on_the_map_between_its_cues_and_credits_its_image(self):
        plan = self.fullbleed()
        scene = plan["scenes"][0]
        scene["map"]["inserts"] = [{"asset": "photo", "at": 1, "until": 4, "side": "right", "label": "A page"}]
        validate_plan(plan, self.root, 10)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        self.assertNotEqual(renderer.render(.5).tobytes(), renderer.render(2).tobytes())
        self.assertEqual(renderer.render(.5).tobytes(), renderer.render(4.5).tobytes())
        # The basemap and the inserted photo share this fixture credit: the photo adds a second line.
        self.assertEqual(renderer.credits(scene, 2).count("Test fixture · CC0"), 2)
        self.assertEqual(renderer.credits(scene, .5).count("Test fixture · CC0"), 1)
        scene["map"]["inserts"][0]["side"] = "centre"
        with self.assertRaisesRegex(ValueError, "side"):
            validate_plan(plan, self.root, 10)

    def test_the_chronology_is_a_band_over_the_map_that_shows_the_active_year(self):
        plan = self.fullbleed()
        evidence = self.evidence()
        plan["scenes"][1] = {"id": "t", "type": "timeline", "start": 5, "end": 10, "title": "Time",
                             "purpose": "Chronology", "evidence": evidence,
                             "timeline": {"layout": "focus", "scale": "ordinal",
                                          "background": {"asset": "map", "layer": "national", "borders": True,
                                                         "camera": [{"at": 0, "bounds": [-20, -5, 20, 25]}]},
                                          "events": [{"year": 1220, "label": "War", "at": 1, "evidence": evidence},
                                                     {"year": 1235, "label": "Victory", "at": 3, "evidence": evidence}]}}
        validate_plan(plan, self.root, 10)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        first, second = renderer.render(6.5), renderer.render(8.5)
        self.assertNotEqual(first.crop((0, 150, 1080, 620)).tobytes(), second.crop((0, 150, 1080, 620)).tobytes())
        plan["scenes"][1]["timeline"]["context"] = [{"event_year": 1220, "lane": "world", "label": "X",
                                                     "detail": "Y", "at": 2, "evidence": evidence}]
        with self.assertRaisesRegex(ValueError, "fullbleed"):
            validate_plan(plan, self.root, 10)


def ImageChopsDiff(a, b):
    from PIL import ImageChops
    return ImageChops.difference(a.convert("L"), b.convert("L"))


if __name__ == "__main__":
    unittest.main()
