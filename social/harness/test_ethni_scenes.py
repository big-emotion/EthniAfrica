"""Scene contracts: invalid plans fail before any expensive render starts."""
import copy
import hashlib
import json
import pathlib
import tempfile
import unittest

from PIL import Image

from ethni_scene_plan import validate_plan, scene_at, transition_at


def fixture(root):
    image = root / "photo.png"
    Image.new("RGB", (1200, 1200), "gray").save(image)
    geo = root / "map.json"
    geo.write_text(json.dumps({"type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": {"ADM0_A3": "AAA"},
        "geometry": {"type": "Polygon", "coordinates": [[[-10, 0], [10, 0], [10, 20], [-10, 20], [-10, 0]]]}}]}))
    assets = {name: {"path": p.name, "kind": kind, "sha256": hashlib.sha256(p.read_bytes()).hexdigest(),
                     "credit": "Test fixture", "license": "CC0", "source": "test"}
              for name, p, kind in [("photo", image, "image"), ("map", geo, "geojson")]}
    evidence = {"sources": ["test"], "status": "illustration", "period": "Simulation"}
    return {"version": 1, "profile": "free", "title": "Test", "assets": assets,
            "sources": {"test": {"citation": "Synthetic test data", "url": "https://example.org", "tier": "unverified"}},
            "scenes": [{"id": "a", "type": "map", "start": 0, "end": 5, "title": "Map",
                        "purpose": "Locate the subject", "evidence": evidence,
                        "map": {"asset": "map", "layer": "physical", "borders": False,
                                "camera": [{"at": 0, "bounds": [-20, -5, 20, 25]}], "features": []}},
                       {"id": "b", "type": "image", "start": 5, "end": 10, "title": "Photo",
                        "purpose": "Observe the document", "evidence": evidence,
                        "image": {"asset": "photo", "fit": "cover", "motion": {"from": [1, .5, .5], "to": [1.1, .6, .5]}},
                        "transition": {"type": "dissolve", "duration": .4}}]}


class ScenePlanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.plan = fixture(self.root)

    def test_mixed_plan_is_valid_and_validation_does_not_mutate_it(self):
        before = copy.deepcopy(self.plan)
        validate_plan(self.plan, self.root, 10)
        self.assertEqual(self.plan, before)

    def test_transition_never_superimposes_scene_headings(self):
        from ethni_scene_render import SceneRenderer
        renderer = SceneRenderer(self.plan, self.root, [])
        heading = (0, 198, 1080, 475)
        for instant, reference in ((5.1, 4.9), (5.3, 5.5)):
            self.assertEqual(renderer.render(instant).crop(heading).tobytes(),
                             renderer.render(reference).crop(heading).tobytes())

    def test_gap_overlap_and_missing_audio_tail_fail(self):
        for change in (4.9, 5.1):
            p = copy.deepcopy(self.plan)
            p["scenes"][1]["start"] = change
            with self.assertRaisesRegex(ValueError, "contiguous"):
                validate_plan(p, self.root, 10)
        with self.assertRaisesRegex(ValueError, "audio"):
            validate_plan(self.plan, self.root, 11)

    def test_boundary_belongs_to_incoming_scene_without_changing_duration(self):
        self.assertEqual(scene_at(self.plan["scenes"], 4.99)["id"], "a")
        self.assertEqual(scene_at(self.plan["scenes"], 5)["id"], "b")
        self.assertEqual(transition_at(self.plan["scenes"], 5.2), (0, 1, .5))
        self.assertIsNone(transition_at(self.plan["scenes"], 5.4))

    def test_unknown_fields_and_scene_types_fail_instead_of_being_ignored(self):
        for key, value in (("typ", "image"), ("type", "magic")):
            p = copy.deepcopy(self.plan)
            p["scenes"][1][key] = value
            with self.assertRaises(ValueError):
                validate_plan(p, self.root, 10)

    def test_changed_asset_hash_and_missing_license_fail(self):
        self.plan["assets"]["photo"]["sha256"] = "0" * 64
        with self.assertRaisesRegex(ValueError, "hash"):
            validate_plan(self.plan, self.root, 10)
        self.plan = fixture(self.root)
        self.plan["assets"]["photo"]["license"] = ""
        with self.assertRaisesRegex(ValueError, "license"):
            validate_plan(self.plan, self.root, 10)

    def test_asset_path_cannot_escape_the_handoff_directory(self):
        self.plan["assets"]["photo"]["path"] = "../photo.png"
        with self.assertRaisesRegex(ValueError, "relative"):
            validate_plan(self.plan, self.root, 10)

    def test_historical_or_people_layers_cannot_fill_modern_countries(self):
        for layer in ("political", "people"):
            p = copy.deepcopy(self.plan)
            p["scenes"][0]["map"].update(layer=layer, highlights=["AAA"])
            with self.assertRaisesRegex(ValueError, "national"):
                validate_plan(p, self.root, 10)

    def test_route_requires_meaning_source_period_and_certainty(self):
        feature = {"kind": "route", "points": [[0, 0], [4, 4]], "label": "Route", "at": 0, "until": 4,
                   "meaning": "name-circulation", "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"])}
        self.plan["scenes"][0]["map"]["features"] = [feature]
        validate_plan(self.plan, self.root, 10)
        for field in ("meaning", "evidence"):
            p = copy.deepcopy(self.plan)
            del p["scenes"][0]["map"]["features"][0][field]
            with self.assertRaises(ValueError):
                validate_plan(p, self.root, 10)

    def test_territory_needs_closed_geometry_and_a_source(self):
        feature = {"kind": "territory", "points": [[0, 0], [4, 0], [4, 4]], "label": "Extent",
                   "at": 0, "until": 5, "evidence": self.plan["scenes"][0]["evidence"]}
        self.plan["scenes"][0]["map"]["features"] = [feature]
        with self.assertRaisesRegex(ValueError, "closed"):
            validate_plan(self.plan, self.root, 10)

    def test_nonfinite_coordinates_duplicate_ids_and_camera_times_fail(self):
        p = copy.deepcopy(self.plan)
        p["scenes"][0]["map"]["camera"][0]["bounds"][0] = float("nan")
        with self.assertRaises(ValueError): validate_plan(p, self.root, 10)
        p = copy.deepcopy(self.plan)
        p["scenes"][1]["id"] = "a"
        with self.assertRaisesRegex(ValueError, "unique"): validate_plan(p, self.root, 10)
        p = copy.deepcopy(self.plan)
        p["scenes"][0]["map"]["camera"] *= 2
        with self.assertRaisesRegex(ValueError, "increasing"): validate_plan(p, self.root, 10)

    def test_transition_cannot_consume_a_whole_scene(self):
        self.plan["scenes"][1]["transition"]["duration"] = 5
        with self.assertRaisesRegex(ValueError, "transition"):
            validate_plan(self.plan, self.root, 10)

    def test_complete_profile_requires_its_editorial_beats(self):
        self.plan.update(profile="thematic-analysis", coverage="complete")
        with self.assertRaisesRegex(ValueError, "requires beats"):
            validate_plan(self.plan, self.root, 10)

    def test_unknown_and_boolean_versions_are_rejected(self):
        for version in (True, 2, "1"):
            self.plan["version"] = version
            with self.assertRaisesRegex(ValueError, "version"):
                validate_plan(self.plan, self.root, 10)

    def test_renderer_is_independent_of_frame_request_order(self):
        from ethni_scene_render import SceneRenderer
        renderer = SceneRenderer(self.plan, self.root, [])
        first = renderer.render(2).tobytes()
        renderer.render(7)
        self.assertEqual(first, renderer.render(2).tobytes())
        self.assertNotEqual(renderer.render(5.1).tobytes(), renderer.render(7).tobytes())

    def test_borders_are_a_rendering_choice_not_a_country_fill(self):
        from ethni_scene_render import SceneRenderer
        first = SceneRenderer(self.plan, self.root, []).render(2)
        self.plan["scenes"][0]["map"]["borders"] = True
        second = SceneRenderer(self.plan, self.root, []).render(2)
        self.assertNotEqual(first.tobytes(), second.tobytes())

    def test_text_overflow_and_caption_overflow_fail_preflight(self):
        from ethni_scene_render import SceneRenderer
        self.plan["scenes"][0]["title"] = "A title " * 80
        with self.assertRaisesRegex(ValueError, "overflow"):
            SceneRenderer(self.plan, self.root, []).preflight()
        self.plan = fixture(self.root)
        captions = [{"debut": 0, "fin": 1, "texte": "A caption " * 100}]
        with self.assertRaisesRegex(ValueError, "overflow"):
            SceneRenderer(self.plan, self.root, captions).preflight()

    def test_tiny_images_are_rejected_instead_of_upscaled_without_limit(self):
        from ethni_scene_render import SceneRenderer
        Image.new("RGB", (10, 10)).save(self.root / "photo.png")
        with self.assertRaisesRegex(ValueError, "enlargement"):
            SceneRenderer(self.plan, self.root, []).preflight()

    def test_overlapping_map_labels_are_rejected(self):
        from ethni_scene_render import SceneRenderer
        scene = self.plan["scenes"][0]
        feature = {"kind": "point", "point": [0, 10], "label": "A label", "at": 0, "until": 5,
                   "evidence": scene["evidence"]}
        scene["map"]["features"] = [feature, copy.deepcopy(feature)]
        with self.assertRaisesRegex(ValueError, "overlap"):
            SceneRenderer(self.plan, self.root, []).preflight()

    def test_estimated_territory_presence_and_route_render_with_all_tokens(self):
        from ethni_scene_render import SceneRenderer
        scene = self.plan["scenes"][0]
        scene["map"]["layer"] = "people"
        evidence = dict(scene["evidence"], status="estimate")
        scene["map"]["features"] = [
            {"kind": "territory", "points": [[-8, 2], [-3, 2], [-3, 6], [-8, 2]], "label": "A",
             "at": 0, "until": 5, "evidence": evidence, "colour": "teal"},
            {"kind": "presence", "point": [5, 15], "label": "B", "at": 0, "until": 5,
             "evidence": evidence, "colour": "perv"},
            {"kind": "route", "points": [[-8, 18], [0, 10]], "label": "C", "at": 0, "until": 5,
             "evidence": evidence, "meaning": "migration"}]
        validate_plan(self.plan, self.root, 10)
        renderer = SceneRenderer(self.plan, self.root, [])
        self.assertNotEqual(renderer.render(1).tobytes(), renderer.render(4).tobytes())


if __name__ == "__main__":
    unittest.main()
