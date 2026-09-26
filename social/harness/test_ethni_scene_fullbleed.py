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


class FullbleedExtensionTests(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def plan_with(self, feature):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = "fullbleed"
        plan["scenes"][1]["image"]["motion"]["to"] = [1.03, .6, .5]
        scene = plan["scenes"][0]
        scene["map"]["layer"] = "national"
        scene["map"]["camera"] = [{"at": 0, "bounds": [-20, -5, 20, 25]}]
        scene["map"]["features"] = [dict(feature, at=0, until=5, evidence=copy.deepcopy(scene["evidence"]))]
        return plan

    def test_a_country_can_carry_the_vertical_stripes_of_its_flag(self):
        base = {"kind": "country", "code": "AAA", "label": "Land", "colour": "gold"}
        plain = self.plan_with(base)
        flagged = self.plan_with(dict(base, flag_stripes=["#00ff00", "#ffff00", "#ff0000"]))
        validate_plan(flagged, self.root, 10)
        a = SceneRenderer(plain, self.root, [], proof=False).render(1)
        b = SceneRenderer(flagged, self.root, [], proof=False).render(1)
        self.assertNotEqual(a.tobytes(), b.tobytes())

    def test_a_river_is_a_dashed_watercourse_and_says_so_in_the_legend(self):
        river = {"kind": "route", "meaning": "river", "label": "Niger", "points": [[-10, 5], [0, 12], [5, 15]],
                 "line_style": "dashed"}
        plan = self.plan_with(river)
        plan["scenes"][0]["map"]["layer"] = "physical"
        validate_plan(plan, self.root, 10)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        self.assertTrue(any("Cours d'eau" in line for line in renderer.legend(plan["scenes"][0], 1)))

    def river_plan(self, **extra):
        river = {"kind": "route", "meaning": "river", "label": "Niger", "colour": "sea", "unlabelled": True,
                 "points": [[-10, 5], [0, 12], [5, 15]], "draw_seconds": .04}
        river.update(extra)
        plan = self.plan_with(river)
        plan["scenes"][0]["map"]["layer"] = "physical"
        return plan

    def test_a_river_is_a_solid_line_in_the_sea_colour_with_a_current_that_flows(self):
        plan = self.river_plan()
        validate_plan(plan, self.root, 10)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        early, later = renderer.render(1.0), renderer.render(1.5)
        self.assertNotEqual(early.tobytes(), later.tobytes(), "the current moves along the course")
        still = SceneRenderer(plan, self.root, [], reduced_motion=True, proof=False)
        self.assertEqual(still.render(1.0).tobytes(), still.render(1.5).tobytes())
        # A dashed line would leave gaps of bare map along the course; a river is continuous.
        from ethni_map import Camera
        from ethni_scene_fullbleed import LIGHT
        with_river = renderer._map(plan["scenes"][0], 1.0, (0, 0, 1080, 1920), LIGHT)
        without = copy.deepcopy(plan)
        without["scenes"][0]["map"]["features"] = []
        bare = SceneRenderer(without, self.root, [], proof=False)._map(without["scenes"][0], 1.0, (0, 0, 1080, 1920), LIGHT)
        camera = Camera(tuple(plan["scenes"][0]["map"]["camera"][0]["bounds"]), (0, 0, 1080, 1920))
        from ethni_scene_render import river_path
        course = [camera.project(point) for point in river_path(
            plan["scenes"][0]["map"]["features"][0]["points"], amplitude=.05, wavelength=1.2, spacing=.08, fade=.6)]
        samples = course[3:-3:3]
        painted = sum(with_river.getpixel((round(x), round(y))) != bare.getpixel((round(x), round(y))) for x, y in samples)
        self.assertGreaterEqual(painted, len(samples)*.97)

    def test_a_river_bends_and_meanders_instead_of_turning_at_right_angles(self):
        import math
        from ethni_scene_render import river_path
        corner = [(0.0, 0.0), (300.0, 0.0), (300.0, 300.0), (600.0, 300.0)]
        path = river_path(corner)
        self.assertEqual(path[0], corner[0])
        self.assertEqual(path[-1], corner[-1])

        def turn(a, b, c):
            first = math.atan2(b[1]-a[1], b[0]-a[0])
            second = math.atan2(c[1]-b[1], c[0]-b[0])
            return abs((second-first+math.pi) % (2*math.pi)-math.pi)

        sharpest = max(turn(a, b, c) for a, b, c in zip(path, path[1:], path[2:]))
        self.assertLess(math.degrees(sharpest), 40, "no right-angled corner remains")
        # A meander: the middle of a straight stretch wanders a few pixels off the straight line.
        straight = river_path([(0.0, 0.0), (800.0, 0.0)])
        self.assertGreater(max(abs(y) for _, y in straight), 2)
        self.assertEqual(straight[-1], (800.0, 0.0))

    def test_a_river_with_no_current_is_still_and_its_meander_belongs_to_the_map_not_the_screen(self):
        plan = self.river_plan(flow=False, line_width=3)
        validate_plan(plan, self.root, 10)
        renderer = SceneRenderer(plan, self.root, [], proof=False)
        self.assertEqual(renderer.render(1.0).tobytes(), renderer.render(1.5).tobytes(), "no current, no motion")
        # The meander is drawn in longitude and latitude, so a camera that zooms cannot make it slide.
        from ethni_scene_render import river_path
        geo = [[-10, 5], [0, 12], [5, 15]]
        first, second = river_path(geo, amplitude=.05, wavelength=1.2, spacing=.08, fade=.6), \
            river_path(geo, amplitude=.05, wavelength=1.2, spacing=.08, fade=.6)
        self.assertEqual(first, second)
        self.assertEqual(first[0], (-10.0, 5.0))
        self.assertLess(max(abs(a[0]-b[0])+abs(a[1]-b[1]) for a, b in zip(first, first[1:])), .3, "fine steps in degrees")
        with self.assertRaisesRegex(ValueError, "flow"):
            validate_plan(self.river_plan(flow="yes"), self.root, 10)

    def test_the_sea_colour_is_a_feature_colour(self):
        validate_plan(self.river_plan(colour="sea"), self.root, 10)
        with self.assertRaisesRegex(ValueError, "colour"):
            validate_plan(self.river_plan(colour="neon"), self.root, 10)

    def test_a_busy_map_may_carry_twenty_four_features_but_not_twenty_five(self):
        marks = [{"kind": "point", "label": f"P{i}", "point": [-9+i, 5], "colour": "gold", "at": 0, "until": 5,
                  "evidence": self.plan["scenes"][0]["evidence"]} for i in range(25)]
        plan = self.plan_with({"kind": "point", "label": "x", "point": [0, 0], "colour": "gold"})
        plan["scenes"][0]["map"]["features"] = marks[:24]
        validate_plan(plan, self.root, 10)
        plan["scenes"][0]["map"]["features"] = marks
        with self.assertRaisesRegex(ValueError, "twenty-four"):
            validate_plan(plan, self.root, 10)

    def test_an_unlabelled_country_keeps_its_legend_line_but_draws_no_text(self):
        base = {"kind": "country", "code": "AAA", "label": "Land", "colour": "gold"}
        labelled, quiet = self.plan_with(base), self.plan_with(dict(base, unlabelled=True))
        validate_plan(quiet, self.root, 10)
        a = SceneRenderer(labelled, self.root, [], proof=False)
        b = SceneRenderer(quiet, self.root, [], proof=False)
        self.assertNotEqual(a.render(1).tobytes(), b.render(1).tobytes())
        self.assertTrue(any("Land" in line for line in b.legend(quiet["scenes"][0], 1)))
        quiet["scenes"][0]["map"]["features"][0]["unlabelled"] = "yes"
        with self.assertRaisesRegex(ValueError, "unlabelled"):
            validate_plan(quiet, self.root, 10)

    def speakers(self, value, **extra):
        feature = {"kind": "speakers", "label": "Pop.", "point": [0, 10], "value": value, "colour": "gold"}
        feature.update(extra)
        return self.plan_with(feature)

    def test_a_proportional_point_grows_with_the_number_it_stands_for(self):
        small, large = self.speakers(1_000_000), self.speakers(9_000_000)
        validate_plan(large, self.root, 10)
        bare = self.plan_with({"kind": "point", "label": "Pop.", "point": [0, 10], "colour": "gold"})
        for plan in (small, large, bare):
            plan["scenes"][0]["map"]["features"][0].pop("value", None)
        blank = SceneRenderer(self.speakers(1), self.root, [], proof=False)

        def footprint(plan):
            frame = SceneRenderer(plan, self.root, [], proof=False).render(1)
            reference = SceneRenderer(self.plan_with({"kind": "point", "label": "x", "point": [0, -80], "colour": "gold"}),
                                      self.root, [], proof=False).render(1)
            return numpy.count_nonzero(numpy.asarray(ImageChopsDiff(frame.crop((0, 100, 1080, 1000)), reference.crop((0, 100, 1080, 1000)))) > 8)

        small_plan, large_plan = self.speakers(1_000_000), self.speakers(9_000_000)
        self.assertGreater(footprint(large_plan), footprint(small_plan) * 2)
        with self.assertRaisesRegex(ValueError, "value"):
            validate_plan(self.speakers(0), self.root, 10)
        with self.assertRaisesRegex(ValueError, "value"):
            validate_plan(self.speakers(True), self.root, 10)
        self.assertTrue(any("proportionnelle" in line for line in blank.legend(large["scenes"][0], 1)))

    def test_a_flag_can_have_horizontal_stripes_and_only_two_orientations_exist(self):
        base = {"kind": "country", "code": "AAA", "label": "Land", "colour": "gold", "unlabelled": True,
                "flag_stripes": ["#00ff00", "#ffffff", "#0000ff"]}
        vertical = self.plan_with(dict(base))
        horizontal = self.plan_with(dict(base, flag_orientation="horizontal"))
        validate_plan(horizontal, self.root, 10)
        a = SceneRenderer(vertical, self.root, [], proof=False).render(1)
        b = SceneRenderer(horizontal, self.root, [], proof=False).render(1)
        self.assertNotEqual(a.tobytes(), b.tobytes())
        with self.assertRaisesRegex(ValueError, "flag_orientation"):
            validate_plan(self.plan_with(dict(base, flag_orientation="diagonal")), self.root, 10)

    def test_the_caption_is_plain_text_on_the_shading_and_the_middle_of_the_map_is_untouched(self):
        plan = self.fullbleed_timeline(display=None)
        plan["scenes"][1] = plan["scenes"][0]
        renderer = SceneRenderer(self.plan_with({"kind": "point", "label": "x", "point": [0, -80], "colour": "gold"}),
                                 self.root, SPOKEN, proof=False)
        bare = SceneRenderer(renderer.plan, self.root, [], proof=False)
        with_text, without = renderer.render(1), bare.render(1)
        # No caption plate: away from the words the two frames are identical, even inside the old box.
        self.assertEqual(with_text.getpixel((500, 1362)), without.getpixel((500, 1362)))
        # The shading only starts low on the frame: the map is untouched down to 900 px.
        map_only = renderer._map(renderer.plan["scenes"][0], 1, (0, 0, 1080, 1920), __import__("ethni_scene_fullbleed").LIGHT)
        self.assertEqual(with_text.getpixel((300, 890)), map_only.getpixel((300, 890)))

    def test_a_chronology_can_show_a_century_where_only_the_order_is_known(self):
        plan = self.fullbleed_timeline(display="XIIe siècle")
        validate_plan(plan, self.root, 10)
        shown = SceneRenderer(plan, self.root, [], proof=False).render(6.2)
        plain = SceneRenderer(self.fullbleed_timeline(display=None), self.root, [], proof=False).render(6.2)
        self.assertNotEqual(shown.crop((0, 150, 1080, 620)).tobytes(), plain.crop((0, 150, 1080, 620)).tobytes())
        with self.assertRaisesRegex(ValueError, "display"):
            validate_plan(self.fullbleed_timeline(display=""), self.root, 10)

    def fullbleed_timeline(self, display):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = "fullbleed"
        evidence = copy.deepcopy(plan["scenes"][0]["evidence"])
        first = {"year": 1100, "label": "Do et Kiri", "at": 1, "evidence": evidence}
        if display is not None:
            first["display"] = display
        plan["scenes"][1] = {"id": "t", "type": "timeline", "start": 5, "end": 10, "title": "Time", "purpose": "x",
                             "evidence": evidence,
                             "timeline": {"layout": "focus", "scale": "ordinal",
                                          "events": [first, {"year": 1220, "label": "War", "at": 3, "evidence": evidence}]}}
        return plan


if __name__ == "__main__":
    unittest.main()
