"""Reusable chronology, documentary imagery and indicative geographic presence."""
import copy
import unittest

from PIL import ImageChops

import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer


class VisualExtensionTests(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def timeline(self):
        scene = self.plan["scenes"][0]
        scene.pop("map")
        scene["type"] = "timeline"
        scene["timeline"] = {
            "scale": "ordinal",
            "events": [{"year": year, "label": label, "at": at,
                        "evidence": copy.deepcopy(scene["evidence"])}
                       for year, label, at in [(1594, "Almada", 1), (1799, "Park", 2), (1830, "Caillié", 3)]],
            "context": [{"year": 1799, "label": "Egypt", "detail": "A contemporary event",
                         "at": 2, "evidence": copy.deepcopy(scene["evidence"])}]}
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
        for lane in ("events", "context"):
            for change in ("source", "cue"):
                self.plan = fixtures.fixture(self.root)
                timeline = self.timeline()
                event = timeline[lane][0]
                if change == "source": del event["evidence"]
                else: event["at"] = 5
                with self.assertRaises(ValueError): validate_plan(self.plan, self.root, 10)

    def test_chronology_must_be_ordered_and_shared_context_year_must_match(self):
        timeline = self.timeline()
        timeline["events"].reverse()
        with self.assertRaisesRegex(ValueError, "chronological"):
            validate_plan(self.plan, self.root, 10)
        timeline["events"].reverse()
        timeline["context"][0]["year"] = 1800
        with self.assertRaisesRegex(ValueError, "same year"):
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

    def test_context_sources_are_in_the_visible_credit_register(self):
        timeline = self.timeline()
        self.plan["sources"]["context"] = {"citation": "Museum archive", "url": "https://example.org/context", "tier": "primary"}
        timeline["context"][0]["evidence"]["sources"] = ["context"]
        renderer = SceneRenderer(self.plan, self.root, [])
        self.assertIn("Museum archive", " ".join(renderer.credits(self.plan["scenes"][0])))

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

    def test_document_contains_an_attributed_image_and_readable_text(self):
        scene = self.plan["scenes"][0]
        scene.pop("map")
        scene.update(type="document", document={"asset": "photo", "label": "1799", "body": "A historical document"})
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        renderer.preflight()
        self.assertIn("Test fixture", " ".join(renderer.credits(scene)))
        scene["document"]["body"] = "Long text " * 100
        with self.assertRaisesRegex(ValueError, "overflow"):
            SceneRenderer(self.plan, self.root, []).preflight()

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


if __name__ == "__main__":
    unittest.main()
