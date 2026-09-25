"""Reusable chronology, documentary imagery and indicative geographic presence."""
import copy
import unittest
from unittest.mock import patch

from PIL import ImageChops

import test_ethni_scenes as fixtures
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

    def test_progress_is_opt_in_and_stays_inside_the_safe_area(self):
        self.plan["progress"] = True
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        box = (renderer.left, 1605, renderer.right+1, 1620)
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
        self.assertGreaterEqual(changed[1], 1605)
        self.assertLessEqual(changed[3], 1620)
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

    def focused_timeline(self):
        timeline = self.timeline()
        timeline.update(layout="focus", overview_at=4.2,
                        background={"asset": "map", "layer": "physical", "borders": True,
                                    "camera": [{"at": 0, "bounds": [-20, -5, 20, 25]}]})
        timeline["context"] = [
            {"event_year": 1594, "lane": "regional", "label": "Region", "detail": "A regional event",
             "at": 1.2, "evidence": dict(self.plan["scenes"][0]["evidence"], period="Sixteenth century")},
            {"event_year": 1594, "lane": "world", "label": "France", "detail": "A familiar contemporary",
             "at": 1.5, "evidence": dict(self.plan["scenes"][0]["evidence"], period="1589–1610")},
        ]
        return timeline

    def composed_timeline(self):
        timeline = self.focused_timeline()
        timeline["context_layout"] = "corner"
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
        self.assertNotEqual(early.crop((45, 820, 1035, 1210)).tobytes(), frame.crop((45, 820, 1035, 1210)).tobytes())
        self.assertEqual(frame.tobytes(), renderer.render(1.8).tobytes())
        self.assertIn("Town", strings)
        for call in paint.call_args_list:
            if call.args[1] in ("Almada", "Park", "Caillié"):
                self.assertLessEqual(call.args[2][1]+call.args[2][3], 820)
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
        box = (45, 820, 1035, 1210)
        self.assertEqual(renderer.render(1.1).crop(box).tobytes(), renderer.render(1.8).crop(box).tobytes())
        timeline["background"].update(layer="national", features=[], highlights=["missing"])
        with self.assertRaisesRegex(ValueError, "Unknown highlighted country"):
            validate_plan(self.plan, self.root, 10)
        timeline["background"]["highlights"] = ["AAA"]
        validate_plan(self.plan, self.root, 10)
        SceneRenderer(self.plan, self.root, []).preflight()

    def test_timeline_map_rejects_cards_that_would_cover_the_geography(self):
        timeline = self.composed_timeline()
        timeline["context_layout"] = "cards"
        with self.assertRaisesRegex(ValueError, "corner"):
            validate_plan(self.plan, self.root, 10)

    def test_focused_context_has_its_own_period_and_an_explicit_anchor(self):
        timeline = self.focused_timeline()
        validate_plan(self.plan, self.root, 10)
        for field, value in [("event_year", 1600), ("lane", "invented"), ("at", 2), ("at", .5)]:
            item = timeline["context"][0]
            original = item[field]
            item[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate_plan(self.plan, self.root, 10)
            item[field] = original
        timeline["context"].append(copy.deepcopy(timeline["context"][0]))
        with self.assertRaisesRegex(ValueError, "lane"):
            validate_plan(self.plan, self.root, 10)

    def test_focused_timeline_switches_context_and_preserves_random_access(self):
        self.focused_timeline()
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        before = renderer.render(.5)
        regional = renderer.render(1.4)
        both = renderer.render(1.9)
        next_event = renderer.render(2.8)
        overview = renderer.render(4.9)
        self.assertNotEqual(before.tobytes(), regional.tobytes())
        self.assertNotEqual(regional.tobytes(), both.tobytes())
        self.assertNotEqual(both.crop((91, 880, 900, 1310)).tobytes(), next_event.crop((91, 880, 900, 1310)).tobytes())
        self.assertNotEqual(next_event.tobytes(), overview.tobytes())
        self.assertEqual(both.tobytes(), renderer.render(1.9).tobytes())
        self.assertIn("Test fixture", " ".join(renderer.credits(self.plan["scenes"][0])))
        renderer.preflight()

    def test_focus_rejects_hidden_background_overlays_and_bad_cue_order(self):
        for change in ("overlay", "order", "overview", "asset"):
            self.plan = fixtures.fixture(self.root)
            timeline = self.focused_timeline()
            if change == "overlay": timeline["background"]["highlights"] = ["AAA"]
            if change == "order": timeline["events"][1]["at"] = .9
            if change == "overview": timeline["overview_at"] = 2
            if change == "asset": timeline["background"]["asset"] = "missing"
            with self.subTest(change=change), self.assertRaises(ValueError):
                validate_plan(self.plan, self.root, 10)

    def test_focus_checks_context_overflow_before_encoding(self):
        self.focused_timeline()["context"][0]["detail"] = "Too much text " * 100
        with self.assertRaisesRegex(ValueError, "overflow"):
            SceneRenderer(self.plan, self.root, []).preflight()

    def test_corner_note_replaces_context_without_painting_cards(self):
        timeline = self.focused_timeline()
        timeline["context_layout"] = "corner"
        for event in timeline["events"]:
            event["evidence"]["period"] = str(event["year"])
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [], reduced_motion=True)
        for instant, included, excluded in [(1.4, "A regional event", "A familiar contemporary"),
                                            (1.9, "A familiar contemporary", "A regional event")]:
            with patch.object(renderer, "paragraph", wraps=renderer.paragraph) as paint:
                frame = renderer.render(instant)
            strings = " ".join(call.args[1] for call in paint.call_args_list)
            self.assertIn(included, strings)
            self.assertNotIn(excluded, strings)
            periods = {item["evidence"]["period"] for item in timeline["context"]}
            period_boxes = [call.args[2] for call in paint.call_args_list if call.args[1] in periods]
            self.assertEqual(len(period_boxes), 1)
            self.assertLess(period_boxes[0][1], 470, "A short note must not detach its date into the map")
            no_context = copy.deepcopy(self.plan)
            no_context["scenes"][0]["timeline"]["context"] = []
            empty = SceneRenderer(no_context, self.root, [], reduced_motion=True).render(instant)
            self.assertEqual(frame.crop((91, 820, 900, 1300)).tobytes(),
                             empty.crop((91, 820, 900, 1300)).tobytes())
            self.assertEqual(frame.tobytes(), renderer.render(instant).tobytes())
        with patch.object(renderer, "paragraph", wraps=renderer.paragraph) as paint:
            renderer.render(4.9)
        self.assertFalse(any("A familiar contemporary" in call.args[1] for call in paint.call_args_list))

    def test_corner_note_rejects_ambiguous_cues_and_unknown_layout(self):
        timeline = self.focused_timeline()
        timeline["context_layout"] = "corner"
        timeline["context"][1]["at"] = timeline["context"][0]["at"]
        with self.assertRaisesRegex(ValueError, "distinct"):
            validate_plan(self.plan, self.root, 10)
        timeline["context_layout"] = "unknown"
        with self.assertRaisesRegex(ValueError, "context layout"):
            validate_plan(self.plan, self.root, 10)

    def test_corner_note_and_reserved_heading_are_checked_for_overflow(self):
        for target in ("detail", "title"):
            self.plan = fixtures.fixture(self.root)
            timeline = self.focused_timeline()
            timeline["context_layout"] = "corner"
            for event in timeline["events"]:
                event["evidence"]["period"] = str(event["year"])
            SceneRenderer(self.plan, self.root, []).preflight()
            if target == "detail": timeline["context"][0]["detail"] = "Too much context " * 30
            else: self.plan["scenes"][0]["title"] = "A heading that cannot fit beside a note"
            with self.subTest(target=target), self.assertRaisesRegex(ValueError, "overflow"):
                SceneRenderer(self.plan, self.root, []).preflight()


if __name__ == "__main__":
    unittest.main()
