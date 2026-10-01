"""Reusable chronology, documentary imagery and indicative geographic presence."""
import copy
import unittest
from unittest.mock import patch

import numpy
from PIL import Image, ImageChops, ImageDraw

import test_ethni_scenes as fixtures
from ethni_map import smooth
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer


class VisualExtensionTests(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def annotated_point(self):
        feature = {"kind": "point", "point": [0, 10], "label": "Town", "at": 0, "until": 5,
                   "offset": [40, -120], "role": "context", "annotation": "A dated context",
                   "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"])}
        self.plan["scenes"][0]["map"]["features"] = [feature]
        return feature

    def test_map_annotation_has_a_locator_and_credits_its_own_source(self):
        feature = self.annotated_point()
        self.plan["sources"]["context"] = dict(self.plan["sources"]["test"], citation="Context source")
        feature["evidence"]["sources"] = ["context"]
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        with patch.object(renderer, "paragraph", wraps=renderer.paragraph) as paint:
            frame = renderer.render(1)
        self.assertIn("A dated context", [call.args[1] for call in paint.call_args_list])
        self.assertIn("Context source", " ".join(renderer.credits(self.plan["scenes"][0])))
        self.assertEqual(frame.tobytes(), renderer.render(1).tobytes())
        renderer.preflight()

    def test_map_annotation_rejects_empty_text_and_nonpoint_marks(self):
        feature = self.annotated_point()
        feature["annotation"] = ""
        with self.assertRaisesRegex(ValueError, "annotation"):
            validate_plan(self.plan, self.root, 10)
        feature["annotation"] = "Context"
        feature["kind"] = "territory"
        with self.assertRaisesRegex(ValueError, "annotation"):
            validate_plan(self.plan, self.root, 10)

    def test_map_annotation_overflow_and_collision_fail_before_export(self):
        feature = self.annotated_point()
        feature["annotation"] = "Too much context " * 30
        with self.assertRaisesRegex(ValueError, "overflow"):
            SceneRenderer(self.plan, self.root, []).preflight()
        feature["annotation"] = "Short context"
        second = copy.deepcopy(feature)
        second["point"] = [-1, 10]
        self.plan["scenes"][0]["map"]["features"].append(second)
        with self.assertRaisesRegex(ValueError, "overlap"):
            SceneRenderer(self.plan, self.root, []).preflight()

    def timeline(self):
        scene = self.plan["scenes"][0]
        scene.pop("map")
        scene["type"] = "timeline"
        scene["timeline"] = {
            "layout": "focus", "scale": "ordinal",
            "background": {"asset": "map", "layer": "physical", "borders": True,
                           "camera": [{"at": 0, "bounds": [-20, -5, 20, 25]}]},
            "events": [{"year": year, "label": label, "at": at,
                        "evidence": copy.deepcopy(scene["evidence"])}
                       for year, label, at in [(1594, "Almada", 1), (1799, "Park", 2), (1830, "Caillié", 3)]]}
        return scene["timeline"]

    def test_timeline_renders_before_and_after_cues_without_frame_history(self):
        self.timeline()
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        opening = renderer.render(.5)
        completed = renderer.render(4)
        self.assertIsNotNone(ImageChops.difference(opening, completed).getbbox())
        self.assertEqual(opening.tobytes(), renderer.render(.5).tobytes())
        renderer.preflight()

    def test_every_event_needs_evidence_and_cannot_reveal_after_the_scene(self):
        for change in ("source", "cue"):
            self.plan = fixtures.fixture(self.root)
            event = self.timeline()["events"][0]
            if change == "source": del event["evidence"]
            else: event["at"] = 5
            with self.assertRaises(ValueError): validate_plan(self.plan, self.root, 10)

    def test_chronology_must_be_ordered_in_time_and_in_cues(self):
        timeline = self.timeline()
        timeline["events"].reverse()
        with self.assertRaisesRegex(ValueError, "chronological"):
            validate_plan(self.plan, self.root, 10)

    def test_false_linear_scale_and_overcrowding_are_rejected(self):
        timeline = self.timeline()
        timeline["scale"] = "linear"
        with self.assertRaisesRegex(ValueError, "ordinal"):
            validate_plan(self.plan, self.root, 10)
        timeline["scale"] = "ordinal"
        timeline["events"].append(copy.deepcopy(timeline["events"][-1]))
        with self.assertRaisesRegex(ValueError, "two or three"):
            validate_plan(self.plan, self.root, 10)

    def test_timeline_copy_overflow_is_detected_even_before_reveal(self):
        self.timeline()["events"][-1]["label"] = "Unreasonably long event " * 20
        with self.assertRaisesRegex(ValueError, "overflow"):
            SceneRenderer(self.plan, self.root, []).preflight()

    def test_dashed_boundaries_have_gaps_and_do_not_change_land_fill(self):
        scene = self.plan["scenes"][0]
        scene["map"].update(borders=True, border_style="dashed", graticule=False)
        validate_plan(self.plan, self.root, 10)
        dashed = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        scene["map"]["border_style"] = "solid"
        solid = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        scene["map"]["borders"] = False
        plain = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        count = lambda a: sum(ImageChops.difference(a, plain).convert("L").histogram()[1:])
        self.assertGreater(count(dashed), 0)
        self.assertLess(count(dashed), count(solid))
        self.assertEqual(dashed.getpixel((495, 345)), plain.getpixel((495, 345)))

    def zone(self):
        scene = self.plan["scenes"][0]
        scene["map"]["layer"] = "people"
        zone = {"kind": "presence-zone", "points": [[-8, 5], [6, 5], [6, 15], [-8, 15], [-8, 5]],
                "label": "Presence", "at": 0, "until": 5, "colour": "teal",
                "geometry_note": "Indicative extent; no measured boundary",
                "evidence": dict(scene["evidence"], status="estimate")}
        scene["map"]["features"] = [zone]
        return zone

    def test_soft_zone_requires_an_explicit_nonmeasured_extent_notice(self):
        zone = self.zone()
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        renderer.preflight()
        coloured = renderer.render(2)
        self.plan["scenes"][0]["map"]["features"] = []
        plain = SceneRenderer(self.plan, self.root, []).render(2)
        self.assertIsNotNone(ImageChops.difference(coloured, plain).getbbox())
        self.plan["scenes"][0]["map"]["features"] = [zone]
        del zone["geometry_note"]
        with self.assertRaisesRegex(ValueError, "geometry_note"):
            validate_plan(self.plan, self.root, 10)

    def test_soft_zone_cannot_claim_documented_exact_extent_or_national_layer(self):
        zone = self.zone()
        zone["evidence"]["status"] = "documented"
        with self.assertRaisesRegex(ValueError, "estimate"):
            validate_plan(self.plan, self.root, 10)
        zone["evidence"]["status"] = "estimate"
        self.plan["scenes"][0]["map"]["layer"] = "national"
        with self.assertRaisesRegex(ValueError, "people"):
            validate_plan(self.plan, self.root, 10)

    def test_crisp_territory_opacity_changes_fill_without_changing_its_footprint(self):
        zone = self.zone()
        zone.update(kind="territory", fill_opacity=.8)
        validate_plan(self.plan, self.root, 10)
        scene = self.plan["scenes"][0]
        bright = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        zone["fill_opacity"] = .2
        faint = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        self.assertNotEqual(bright.getpixel((495, 345)), faint.getpixel((495, 345)))
        self.assertEqual(bright.getpixel((10, 10)), faint.getpixel((10, 10)))
        zone["fill_opacity"] = 1.01
        with self.assertRaisesRegex(ValueError, "fill_opacity"):
            validate_plan(self.plan, self.root, 10)

    def route(self):
        scene = self.plan["scenes"][0]
        route = {"kind": "route", "points": [[-8, 5], [0, 15], [6, 5]],
                 "label": "Journey", "at": 0, "until": 5, "meaning": "journey",
                 "draw_seconds": 2, "line_style": "dashed", "line_width": 8,
                 "geometry_note": "Schematic links, not a literal itinerary",
                 "evidence": dict(scene["evidence"], status="hypothesis")}
        scene["map"]["features"] = [route]
        return route

    def test_label_can_contrast_with_its_fill_without_changing_the_territory(self):
        zone = self.zone()
        zone.update(kind="territory", fill_opacity=.8, label_colour="white")
        validate_plan(self.plan, self.root, 10)
        scene = self.plan["scenes"][0]
        white = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        zone["label_colour"] = "gold"
        gold = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        self.assertEqual(white.getpixel((495, 345)), gold.getpixel((495, 345)))
        self.assertIsNotNone(ImageChops.difference(white, gold).getbbox())
        zone["label_colour"] = "invented"
        with self.assertRaisesRegex(ValueError, "label colour"):
            validate_plan(self.plan, self.root, 10)

    def test_journey_draws_then_holds_and_can_render_out_of_order(self):
        self.route()
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        end = renderer.render(4)
        start = renderer.render(.5)
        self.assertNotEqual(end.tobytes(), start.tobytes())
        self.assertEqual(end.tobytes(), renderer.render(2).tobytes())
        self.assertEqual(start.tobytes(), renderer.render(.5).tobytes())
        renderer.preflight()

    def test_schematic_journey_dashes_have_gaps(self):
        route = self.route()
        scene = self.plan["scenes"][0]
        dashed = SceneRenderer(self.plan, self.root, [])._map(scene, 3)
        route["line_style"] = "solid"
        solid = SceneRenderer(self.plan, self.root, [])._map(scene, 3)
        self.assertIsNotNone(ImageChops.difference(dashed, solid).getbbox())

    def test_new_feature_controls_reject_wrong_types_ranges_and_kinds(self):
        for field, bad_values in {"draw_seconds": [0, 6, True],
                                  "line_style": ["dotted", None],
                                  "line_width": [0, 13, 2.5, True]}.items():
            for value in bad_values:
                route = self.route()
                route[field] = value
                with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                    validate_plan(self.plan, self.root, 10)
        for field, value in {"draw_seconds": 2, "line_style": "dashed", "line_width": 8,
                             "fill_opacity": .8}.items():
            zone = self.zone()
            zone[field] = value
            with self.subTest(wrong_kind=field), self.assertRaises(ValueError):
                validate_plan(self.plan, self.root, 10)

    def test_progress_is_opt_in_and_stays_inside_the_safe_area(self):
        self.plan["progress"] = True
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        box = (renderer.left, 1795, renderer.right+1, 1810)
        early = renderer.render(1).crop(box)
        self.assertNotEqual(early.tobytes(), renderer.render(4).crop(box).tobytes())
        self.assertEqual(early.tobytes(), renderer.render(1).crop(box).tobytes())
        enabled = renderer.render(1)
        self.plan["progress"] = False
        disabled = SceneRenderer(self.plan, self.root, []).render(1)
        del self.plan["progress"]
        self.assertEqual(disabled.tobytes(), SceneRenderer(self.plan, self.root, []).render(1).tobytes())
        changed = ImageChops.difference(enabled, disabled).getbbox()
        self.assertIsNotNone(changed)
        self.assertGreaterEqual(changed[1], 1795)
        self.assertLessEqual(changed[3], 1810)
        self.plan["progress"] = "yes"
        with self.assertRaisesRegex(ValueError, "progress"):
            validate_plan(self.plan, self.root, 10)

    def test_context_is_dimmed_and_always_drawn_below_the_subject(self):
        subject = self.zone()
        subject.update(kind="territory", fill_opacity=.8)
        context = dict(subject, label="Neighbour", role="context", colour="perv", offset=[18, 40])
        scene = self.plan["scenes"][0]
        scene["map"]["features"] = [subject, context]
        validate_plan(self.plan, self.root, 10)
        first = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        scene["map"]["features"].reverse()
        self.assertEqual(first.tobytes(), SceneRenderer(self.plan, self.root, [])._map(scene, 2).tobytes())
        scene["map"]["features"] = [context]
        dim = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        context["role"] = "subject"
        bright = SceneRenderer(self.plan, self.root, [])._map(scene, 2)
        self.assertNotEqual(dim.getpixel((495, 345)), bright.getpixel((495, 345)))

    def test_reveal_fades_in_then_holds_and_rejects_invalid_duration(self):
        zone = self.zone()
        zone.update(kind="territory", fade_seconds=1)
        validate_plan(self.plan, self.root, 10)
        scene = self.plan["scenes"][0]
        renderer = SceneRenderer(self.plan, self.root, [])
        before = renderer._map(scene, 0)
        during = renderer._map(scene, .5)
        after = renderer._map(scene, 1)
        self.assertNotEqual(before.tobytes(), during.tobytes())
        self.assertNotEqual(during.tobytes(), after.tobytes())
        self.assertEqual(after.tobytes(), renderer._map(scene, 4).tobytes())
        for value in [True, 0, 6]:
            zone["fade_seconds"] = value
            with self.assertRaisesRegex(ValueError, "fade_seconds"):
                validate_plan(self.plan, self.root, 10)
        del zone["fade_seconds"]
        zone["role"] = "backgroundish"
        with self.assertRaisesRegex(ValueError, "role"):
            validate_plan(self.plan, self.root, 10)

    def composed_timeline(self):
        timeline = self.timeline()
        for event in timeline["events"]:
            event["evidence"]["period"] = str(event["year"])
        ev = dict(self.plan["scenes"][0]["evidence"], sources=["geo"])
        self.plan["sources"]["geo"] = dict(self.plan["sources"]["test"], citation="Geographic evidence")
        timeline["background"]["layer"] = "political"
        timeline["background"]["features"] = [
            {"kind": "territory", "label": "Region", "points": [[-9, 4], [-3, 4], [-3, 8], [-9, 4]],
             "at": .6, "until": 4.8, "evidence": ev, "offset": [-120, 20]},
            {"kind": "point", "label": "Town", "point": [6, 18], "at": .7, "until": 4.6,
             "evidence": ev, "offset": [15, -40]},
            {"kind": "route", "label": "Journey", "points": [[-6, 6], [6, 18]],
             "meaning": "journey", "at": .9, "until": 4.7, "draw_seconds": 1.7,
             "evidence": ev, "offset": [30, 35]}]
        return timeline

    def test_timeline_composes_map_features_with_evidence_and_random_access(self):
        self.composed_timeline()
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        with patch.object(renderer, "paragraph", wraps=renderer.paragraph) as paint:
            frame = renderer.render(1.8)
        strings = " ".join(call.args[1] for call in paint.call_args_list)
        self.assertIn("Journey · Simulation", strings)
        self.assertIn("Geographic evidence", " ".join(renderer.credits(self.plan["scenes"][0])))
        early = renderer.render(1.1)
        self.assertNotEqual(early.tobytes(), frame.tobytes())
        self.assertEqual(frame.tobytes(), renderer.render(1.8).tobytes())
        self.assertIn("Town", strings)
        with patch.object(renderer, "paragraph", wraps=renderer.paragraph) as paint:
            renderer.render(4.99)
        self.assertNotIn("Journey", " ".join(call.args[1] for call in paint.call_args_list))

    def test_timeline_map_preflight_covers_reveal_and_expiry(self):
        timeline = self.composed_timeline()
        renderer = SceneRenderer(self.plan, self.root, [])
        instants = renderer.preflight()
        self.assertIn(.7, instants)
        self.assertIn(2.6, instants)
        self.assertIn(4.6, instants)
        feature = timeline["background"]["features"][1]
        del feature["evidence"]
        with self.assertRaises(ValueError): validate_plan(self.plan, self.root, 10)

    def test_timeline_map_reduced_motion_and_country_validation(self):
        timeline = self.composed_timeline()
        renderer = SceneRenderer(self.plan, self.root, [], reduced_motion=True)
        box = (45, 480, 1035, 820)
        self.assertEqual(renderer.render(1.1).crop(box).tobytes(), renderer.render(1.8).crop(box).tobytes())
        timeline["background"].update(layer="national", features=[], highlights=["missing"])
        with self.assertRaisesRegex(ValueError, "Unknown highlighted country"):
            validate_plan(self.plan, self.root, 10)
        timeline["background"]["highlights"] = ["AAA"]
        validate_plan(self.plan, self.root, 10)
        SceneRenderer(self.plan, self.root, []).preflight()

    def test_a_chronology_refuses_context_cards_overview_cues_and_a_missing_map(self):
        for change in ("context", "overview_at", "context_layout", "no-background", "overview", "asset", "order"):
            self.plan = fixtures.fixture(self.root)
            timeline = self.timeline()
            if change == "context": timeline["context"] = []
            if change == "overview_at": timeline["overview_at"] = 4
            if change == "context_layout": timeline["context_layout"] = "corner"
            if change == "no-background": del timeline["background"]
            if change == "overview": timeline["layout"] = "overview"
            if change == "asset": timeline["background"]["asset"] = "missing"
            if change == "order": timeline["events"][1]["at"] = .9
            with self.subTest(change=change), self.assertRaises(ValueError):
                validate_plan(self.plan, self.root, 10)


class ImageMotionSmoothnessTests(unittest.TestCase):
    """A slow push-in or pan must not stair-step: sub-pixel motion, not integer rounding."""
    setUp = fixtures.ScenePlanTests.setUp

    def blob_renderer(self, motion, size=(1600, 1600)):
        blob = Image.new("L", size, 0)
        cx, cy = size[0] // 2, size[1] // 2
        ImageDraw.Draw(blob).ellipse((cx - 40, cy - 40, cx + 40, cy + 40), fill=255)
        renderer = SceneRenderer(self.plan, self.root, [])
        renderer.assets["photo"] = blob.filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(18)).convert("RGB")
        scene = copy.deepcopy(self.plan["scenes"][1])
        scene["image"]["motion"] = motion
        return renderer, scene

    @staticmethod
    def centroid(frame):
        grey = numpy.asarray(frame.convert("L"), dtype=float)
        total = grey.sum()
        ys, xs = numpy.indices(grey.shape)
        return (xs * grey).sum() / total, (ys * grey).sum() / total

    def track(self, motion):
        renderer, scene = self.blob_renderer(motion)
        duration = scene["end"] - scene["start"]
        return [self.centroid(renderer._image(scene, i / 25, (990, 690))) for i in range(int(duration * 25))]

    def test_a_feature_at_the_zoom_centre_does_not_wobble(self):
        points = self.track({"from": [1, .5, .5], "to": [1.05, .5, .5]})
        xs = numpy.array([p[0] for p in points])
        ys = numpy.array([p[1] for p in points])
        self.assertLess(numpy.ptp(xs), .2)
        self.assertLess(numpy.ptp(ys), .2)

    def test_a_slow_pan_advances_without_stair_steps(self):
        # The square photo fits the window's width, so the pan runs vertically (window 690 px,
        # photo scaled to 990 px). Rounding to whole pixels strayed by up to half a pixel from
        # the eased path; the fractional window stays within a tenth.
        points = self.track({"from": [1, .5, .45], "to": [1, .5, .55]})
        measured = numpy.array([p[1] for p in points])
        ideal = numpy.array([-(990 - 690) * (.45 + .1 * smooth(i / 25 / 5)) for i in range(len(points))])
        deviation = (measured - measured[0]) - (ideal - ideal[0])
        self.assertLess(numpy.abs(deviation).max(), .1)


if __name__ == "__main__":
    unittest.main()
