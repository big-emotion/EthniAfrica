"""Full-frame overlays: words that arrive on a cue over a picture or a globe, and a camera with keys."""
import copy
import unittest

import numpy
from PIL import Image, ImageChops

import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer

ITEMS = [{"label": "mtu · watu", "body": "Kiswahili", "at": 1.0},
         {"label": "umuntu · abantu", "body": "isiZulu", "at": 3.0}]
REGION = (470, 1330)  # the band of the frame that the items own, between the heading and the caption


def band(frame):
    return frame.crop((0, REGION[0], 1080, REGION[1]))


def changed_rows(a, b):
    """The rows of the item band where two frames differ."""
    difference = numpy.asarray(ImageChops.difference(band(a).convert("L"), band(b).convert("L")))
    rows = numpy.nonzero(difference.max(axis=1) > 12)[0]
    return (rows.min(), rows.max()) if len(rows) else None


class OverlayFixture(unittest.TestCase):
    """The synthetic plan of the scene tests, turned into a full-frame plan on demand."""
    setUp = fixtures.ScenePlanTests.setUp

    def keyed(self, keys, fit="cover"):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = "fullbleed"
        plan["scenes"][1]["image"] = {"asset": "photo", "fit": fit, "motion": {"keys": keys}}
        del plan["scenes"][1]["transition"]
        return plan

    def overlay(self, items=None, backdrop="image", layout="fullbleed"):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = layout
        plan["scenes"][1]["image"]["motion"]["to"] = [1.03, .6, .5]
        scene = plan["scenes"][1]
        del scene["image"], scene["transition"]
        scene.update(type="comparison", title="Person",
                     comparison=copy.deepcopy(ITEMS if items is None else items))
        if backdrop == "image":
            scene["backdrop"] = {"image": {"asset": "photo", "fit": "cover"}}
        elif backdrop == "map":
            scene["backdrop"] = {"map": {"asset": "map", "layer": "physical", "borders": False,
                                         "camera": [{"at": 0, "bounds": [-20, -5, 20, 25]}], "features": []}}
        return plan


class OverlayPlanTests(OverlayFixture):
    def test_a_full_frame_comparison_needs_a_backdrop_and_the_panel_layout_refuses_one(self):
        validate_plan(self.overlay(), self.root, 10)
        validate_plan(self.overlay(backdrop="map"), self.root, 10)
        with self.assertRaisesRegex(ValueError, "backdrop"):
            validate_plan(self.overlay(backdrop=None), self.root, 10)
        with self.assertRaisesRegex(ValueError, "backdrop"):
            validate_plan(self.overlay(layout="panel"), self.root, 10)

    def test_a_backdrop_is_exactly_one_picture_or_map_checked_like_a_scene(self):
        for backdrop in ({}, {"image": {"asset": "photo", "fit": "cover"}, "map": {"asset": "map"}},
                         {"video": {"asset": "photo"}}, {"image": {"asset": "nowhere", "fit": "cover"}},
                         {"image": {"asset": "map", "fit": "cover"}},
                         {"image": {"asset": "photo", "fit": "stretch"}},
                         {"map": {"asset": "photo", "layer": "physical", "camera": [{"at": 0, "bounds": [-20, -5, 20, 25]}]}}):
            plan = self.overlay()
            plan["scenes"][1]["backdrop"] = backdrop
            with self.assertRaises(ValueError, msg=str(backdrop)):
                validate_plan(plan, self.root, 10)

    def test_a_full_frame_comparison_holds_two_to_five_items_and_the_panel_two_or_three(self):
        many = [{"label": f"L{i}", "body": "b", "at": i} for i in range(6)]
        validate_plan(self.overlay(items=many[:5]), self.root, 10)
        with self.assertRaisesRegex(ValueError, "two to five"):
            validate_plan(self.overlay(items=many), self.root, 10)
        with self.assertRaisesRegex(ValueError, "two to five"):
            validate_plan(self.overlay(items=many[:1]), self.root, 10)
        plain = self.overlay(items=many[:4], backdrop=None, layout="panel")
        with self.assertRaisesRegex(ValueError, "two or three"):
            validate_plan(plain, self.root, 10)

    def test_an_item_cue_cannot_fall_after_the_scene_ends(self):
        late = [dict(ITEMS[0]), dict(ITEMS[1], at=5.0)]
        with self.assertRaisesRegex(ValueError, "comparison.at"):
            validate_plan(self.overlay(items=late), self.root, 10)

    def test_a_camera_of_keys_may_zoom_past_the_legacy_film_limit(self):
        keys = [{"at": 0, "view": [1, .5, .5]}, {"at": 2, "view": [2, .3, .3]}]
        validate_plan(self.keyed(keys), self.root, 10)

    def test_keys_are_ordered_start_at_zero_stay_in_the_scene_and_exclude_from_and_to(self):
        good = [{"at": 0, "view": [1, .5, .5]}, {"at": 2, "view": [2, .3, .3]}]
        bad = {"a single key": [good[0]],
               "not starting at zero": [dict(good[0], at=.5), good[1]],
               "not increasing": [good[0], dict(good[1], at=0)],
               "past the scene": [good[0], dict(good[1], at=5)],
               "zoom out of range": [good[0], dict(good[1], view=[3.5, .3, .3])],
               "focus out of range": [good[0], dict(good[1], view=[2, 1.3, .3])],
               "an unknown field": [good[0], dict(good[1], speed=3)]}
        for name, keys in bad.items():
            with self.assertRaises(ValueError, msg=name):
                validate_plan(self.keyed(keys), self.root, 10)
        mixed = self.keyed(good)
        mixed["scenes"][1]["image"]["motion"]["from"] = [1, .5, .5]
        with self.assertRaisesRegex(ValueError, "keys"):
            validate_plan(mixed, self.root, 10)
        with self.assertRaisesRegex(ValueError, "cover"):
            validate_plan(self.keyed(good, fit="contain"), self.root, 10)

    def test_from_and_to_keep_their_five_percent_limit_in_the_full_frame_layout(self):
        plan = self.keyed([])
        plan["scenes"][1]["image"]["motion"] = {"from": [1, .5, .5], "to": [1.2, .5, .5]}
        with self.assertRaisesRegex(ValueError, "zoom"):
            validate_plan(plan, self.root, 10)


class OverlayRenderTests(OverlayFixture):
    def renderer(self, plan, **extra):
        return SceneRenderer(plan, self.root, [], proof=False, **extra)

    def test_each_item_arrives_on_its_cue_below_the_previous_one_and_then_stays(self):
        renderer = self.renderer(self.overlay())
        start = 5
        before, first, second, held = (renderer.render(start + t) for t in (.5, 1.8, 3.8, 4.8))
        one, two = changed_rows(before, first), changed_rows(first, second)
        self.assertIsNotNone(one)
        self.assertIsNotNone(two)
        self.assertLess(one[1], two[0], "the second item lands below the first, in a place kept for it")
        self.assertIsNone(changed_rows(second, held), "nothing moves or disappears once everything has arrived")
        self.assertIsNone(changed_rows(first, renderer.render(start + 2.6)), "a cue leaves the earlier items alone")

    def test_an_item_that_has_arrived_never_moves_when_another_one_joins_it(self):
        renderer = self.renderer(self.overlay())
        first, joined = renderer.render(5 + 2.0), renderer.render(5 + 3.9)
        top, bottom = changed_rows(renderer.render(5 + .5), first)
        rows = slice(top, bottom + 1)
        self.assertEqual(numpy.asarray(band(first))[rows].tobytes(), numpy.asarray(band(joined))[rows].tobytes())

    def test_the_concept_is_the_title_at_the_top_and_nothing_low_left(self):
        plan = self.overlay()
        other = copy.deepcopy(plan)
        other["scenes"][1]["title"] = "Something else"
        a, b = self.renderer(plan).render(5 + 4), self.renderer(other).render(5 + 4)
        difference = numpy.asarray(ImageChops.difference(a.convert("L"), b.convert("L")))
        ys = numpy.nonzero(difference.max(axis=1) > 12)[0]
        self.assertGreater(len(ys), 0)
        self.assertLess(ys.max(), REGION[0], "the title sits above the items")
        self.assertGreater(ys.min(), 150, "and below the status line")

    def test_the_picture_shows_through_and_words_sit_on_a_plate_that_keeps_them_readable(self):
        renderer = self.renderer(self.overlay())
        white = Image.new("RGB", (1200, 1200), (250, 250, 250))
        renderer.assets["photo"] = white
        frame = renderer.render(5 + 4)
        margin = numpy.asarray(frame.convert("L"), dtype=float)[700:760, 2:20].mean()
        plate = numpy.asarray(frame.convert("L"), dtype=float)[REGION[0]:REGION[0] + 60, 100:700].mean()
        self.assertGreater(margin, 200, "the picture is visible beside the words")
        self.assertLess(plate, 150, "the words sit on a dark plate, not straight on a bright picture")

    def test_a_map_can_be_the_backdrop_and_its_legend_and_credit_are_kept(self):
        plan = self.overlay(backdrop="map")
        renderer = self.renderer(plan)
        scene = plan["scenes"][1]
        self.assertTrue(any("Sans frontières" in line for line in renderer.legend(scene, 4)))
        self.assertIn("Test fixture · CC0", renderer.credits(scene, 4))
        picture = self.overlay()
        self.assertIn("Test fixture · CC0", self.renderer(picture).credits(picture["scenes"][1], 4))
        self.assertNotEqual(renderer.render(5 + 4).tobytes(), self.renderer(picture).render(5 + 4).tobytes())

    def test_words_that_do_not_fit_fail_loudly_instead_of_shrinking(self):
        long = [dict(ITEMS[0], body="A very long sentence about words that goes on " * 30), ITEMS[1]]
        renderer = self.renderer(self.overlay(items=long))
        with self.assertRaisesRegex(ValueError, "overflow"):
            renderer.render(5 + 4)

    def test_reduced_motion_shows_every_item_at_once(self):
        still = self.renderer(self.overlay(), reduced_motion=True)
        self.assertEqual(still.render(5 + .2).tobytes(), still.render(5 + 4.5).tobytes())

    def test_preflight_looks_at_each_arrival_and_at_each_camera_key(self):
        instants = self.renderer(self.overlay()).preflight()
        for wanted in (5 + 1.0, 5 + 3.0, 5 + 1.0 + .32, 5 + 3.0 + .32):
            self.assertTrue(any(abs(i - wanted) < .01 for i in instants), wanted)
        keyed = self.renderer(self.keyed([{"at": 0, "view": [1, .5, .5]}, {"at": 2, "view": [1.2, .3, .3]}])).preflight()
        self.assertTrue(any(abs(i - 7.0) < .01 for i in keyed))


class CameraRenderTests(OverlayFixture):
    def quadrants(self):
        """A picture of four flat colours, so that where the camera looks can be read from one pixel."""
        image = Image.new("RGB", (2000, 2000))
        for box, colour in (((0, 0, 1000, 1000), (220, 30, 30)), ((1000, 0, 2000, 1000), (30, 200, 30)),
                            ((0, 1000, 1000, 2000), (30, 30, 220)), ((1000, 1000, 2000, 2000), (230, 220, 30))):
            image.paste(colour, box)
        return image

    def camera(self, backdrop=False):
        keys = [{"at": 0, "view": [1, 0, .5]}, {"at": 2, "view": [2, 1, 0]}]
        if backdrop:
            plan = self.overlay()
            plan["scenes"][1]["backdrop"]["image"]["motion"] = {"keys": keys}
        else:
            plan = self.keyed(keys)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        renderer.assets["photo"] = self.quadrants()
        return renderer

    def test_a_keyed_camera_moves_between_its_keys_and_holds_after_the_last(self):
        renderer = self.camera()
        red, green = numpy.array([220, 30, 30]), numpy.array([30, 200, 30])
        first = numpy.array(renderer.render(5).getpixel((300, 700)))
        last = numpy.array(renderer.render(5 + 2.2).getpixel((300, 700)))
        self.assertLess(abs(first - red).max(), 40, "the opening view looks at the top-left corner")
        self.assertLess(abs(last - green).max(), 40, "the closing view has zoomed into the top-right quarter")
        middle = renderer.render(5 + 1).tobytes()
        self.assertNotEqual(middle, renderer.render(5).tobytes(), "the camera has left its first view")
        self.assertNotEqual(middle, renderer.render(5 + 2.2).tobytes(), "and has not yet reached its last")
        self.assertEqual(renderer.render(5 + 2.5).tobytes(), renderer.render(5 + 4).tobytes(), "the last key is held")

    def test_the_backdrop_of_an_overlay_can_carry_the_same_camera(self):
        renderer = self.camera(backdrop=True)
        self.assertNotEqual(renderer.render(5 + .2).getpixel((10, 700)), renderer.render(5 + 2.4).getpixel((10, 700)))

    def test_the_enlargement_ceiling_still_stops_a_camera_that_zooms_too_far(self):
        plan = self.keyed([{"at": 0, "view": [1, .5, .5]}, {"at": 2, "view": [2, .5, .5]}])
        # The fixture photo is 1200 px: the cover scale is already 1.6, and a 2x view would enlarge it 3.2 times.
        with self.assertRaisesRegex(ValueError, "enlargement"):
            SceneRenderer(plan, self.root, [], proof=False).render(5 + 2)


if __name__ == "__main__":
    unittest.main()
