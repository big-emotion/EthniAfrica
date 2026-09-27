"""The globe map scene: contract validation, geographic orientation, borders, volume and determinism."""
import copy
import hashlib
import json
import unittest

import numpy
from PIL import Image

import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer

RELIEF_BOUNDS = [-30, -40, 60, 45]


def register(plan, root, key, path, kind, **extra):
    plan["assets"][key] = {"path": path.name, "kind": kind, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                           "credit": "Test fixture", "license": "CC0", "source": "test", **extra}


class GlobeSceneCase(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def globe(self):
        """A relief whose red channel grows eastwards and whose green channel grows northwards."""
        width, height = 360, 340
        columns = numpy.linspace(0, 255, width, dtype=numpy.uint8)[None, :].repeat(height, 0)
        rows = numpy.linspace(255, 0, height, dtype=numpy.uint8)[:, None].repeat(width, 1)
        relief = self.root / "relief.png"
        Image.fromarray(numpy.dstack([columns, rows, numpy.full_like(columns, 90)])).save(relief)
        rivers = self.root / "rivers.json"
        rivers.write_text(json.dumps({"type": "FeatureCollection", "features": [{
            "type": "Feature", "properties": {"name": "River"},
            "geometry": {"type": "LineString", "coordinates": [[0, 2], [4, 8], [8, 12]]}}]}))
        lakes = self.root / "lakes.json"
        lakes.write_text(json.dumps({"type": "FeatureCollection", "features": [{
            "type": "Feature", "properties": {"name": "Lake"},
            "geometry": {"type": "Polygon", "coordinates": [[[2, 12], [4, 12], [4, 14], [2, 14], [2, 12]]]}}]}))
        register(self.plan, self.root, "relief", relief, "relief", bounds=RELIEF_BOUNDS)
        register(self.plan, self.root, "rivers", rivers, "vector")
        register(self.plan, self.root, "lakes", lakes, "vector")
        scene = self.plan["scenes"][0]
        scene["map"] = {"asset": "map", "layer": "national", "borders": True, "border_style": "solid",
                        "projection": "globe", "relief": "relief", "rivers": "rivers", "lakes": "lakes",
                        "camera": [{"at": 0, "center": [5, 10], "span": 40}], "features": []}
        return scene["map"]

    def frame(self, instant=2.0):
        return SceneRenderer(self.plan, self.root, [])._map(self.plan["scenes"][0], instant)

    def feature(self, **fields):
        base = {"kind": "country", "code": "AAA", "label": "Land", "at": 0, "until": 5,
                "colour": "gold", "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"])}
        base.update(fields)
        return base


class GlobeContractTests(GlobeSceneCase):
    def rejects(self, message):
        with self.assertRaisesRegex(ValueError, message):
            validate_plan(self.plan, self.root, 10)

    def test_a_complete_globe_plan_is_valid(self):
        self.globe()
        validate_plan(self.plan, self.root, 10)

    def test_a_globe_needs_a_relief_asset(self):
        cfg = self.globe()
        del cfg["relief"]
        self.rejects("relief")
        cfg["relief"] = "map"
        self.rejects("relief")

    def test_relief_bounds_must_be_a_real_box(self):
        self.globe()
        for bounds in ([10, -40, 5, 45], [-30, -40, 60], [-30, -95, 60, 45], "world"):
            self.plan["assets"]["relief"]["bounds"] = bounds
            self.rejects("bounds")
        del self.plan["assets"]["relief"]["bounds"]
        self.rejects("bounds")

    def test_only_a_relief_asset_carries_bounds(self):
        self.globe()
        self.plan["assets"]["photo"]["bounds"] = RELIEF_BOUNDS
        self.rejects("bounds")

    def test_globe_only_options_are_refused_on_a_mercator_map(self):
        cfg = self.globe()
        cfg["projection"] = "mercator"
        cfg["camera"] = [{"at": 0, "bounds": [-20, -5, 20, 25]}]
        self.rejects("globe")

    def test_the_two_camera_shapes_cannot_be_mixed(self):
        cfg = self.globe()
        cfg["camera"][0]["bounds"] = [-20, -5, 20, 25]
        self.rejects("camera")

    def test_invalid_globe_cameras_fail_before_rendering(self):
        cfg = self.globe()
        for change in ({"span": 0}, {"span": 400}, {"tilt": 85}, {"center": [5, 95]}, {"ease": "bounce"}, {"center": [5]}):
            cfg["camera"] = [{"at": 0, "center": [5, 10], "span": 40, **change}]
            self.rejects(".")

    def test_border_styles_are_a_closed_list_and_width_is_bounded(self):
        cfg = self.globe()
        for style in ("solid", "soft", "glow", "dashed", "none"):
            cfg["border_style"] = style
            validate_plan(self.plan, self.root, 10)
        cfg["border_style"] = "wavy"
        self.rejects("border_style")
        cfg["border_style"] = "solid"
        cfg["border_width"] = 30
        self.rejects("border_width")

    def test_extrusion_and_drawing_time_are_bounded_and_belong_to_a_country_or_a_zone(self):
        cfg = self.globe()
        cfg["features"] = [self.feature(extrude=40, draw_seconds=1.5)]
        validate_plan(self.plan, self.root, 10)
        cfg["features"] = [self.feature(extrude=90)]
        self.rejects("extrude")
        cfg["features"] = [{"kind": "point", "point": [5, 10], "label": "P", "at": 0, "until": 5, "extrude": 10,
                            "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"])}]
        self.rejects("extrude")

    def test_a_label_feature_names_a_place_or_a_sea(self):
        cfg = self.globe()
        evidence = copy.deepcopy(self.plan["scenes"][0]["evidence"])
        cfg["features"] = [{"kind": "label", "point": [-10, 5], "label": "ATLANTIQUE", "style": "sea",
                            "at": 0, "until": 5, "evidence": evidence}]
        validate_plan(self.plan, self.root, 10)
        cfg["features"][0]["style"] = "ocean"
        self.rejects("style")


class GlobeRenderTests(GlobeSceneCase):
    def test_the_relief_is_drawn_the_right_way_round(self):
        self.globe()["borders"] = False
        image = numpy.asarray(self.frame())
        h, w = image.shape[:2]
        west, east = image[h//2, w//4].astype(int), image[h//2, 3*w//4].astype(int)
        north, south = image[h//4, w//2].astype(int), image[3*h//4, w//2].astype(int)
        self.assertLess(west[0], east[0])
        self.assertGreater(north[1], south[1])

    def test_the_space_around_the_globe_keeps_the_ground_colour(self):
        cfg = self.globe()
        cfg["borders"] = False
        cfg["camera"] = [{"at": 0, "center": [5, 10], "span": 300}]
        ground = SceneRenderer(self.plan, self.root, []).palette["ground"]
        corner = self.frame().getpixel((2, 2))
        self.assertEqual(tuple(corner), tuple(int(ground[i:i+2], 16) for i in (1, 3, 5)) if isinstance(ground, str) else tuple(ground))

    def test_a_frame_is_identical_whatever_order_frames_are_rendered_in(self):
        self.globe()
        renderer = SceneRenderer(self.plan, self.root, [])
        scene = self.plan["scenes"][0]
        first = renderer._map(scene, 2).tobytes()
        renderer._map(scene, 1)
        self.assertEqual(first, renderer._map(scene, 2).tobytes())

    def test_a_moving_camera_changes_the_picture_and_a_still_one_does_not(self):
        cfg = self.globe()
        still = SceneRenderer(self.plan, self.root, [])
        self.assertEqual(still._map(self.plan["scenes"][0], 1).tobytes(), still._map(self.plan["scenes"][0], 4).tobytes())
        cfg["camera"] = [{"at": 0, "center": [5, 10], "span": 40}, {"at": 4, "center": [20, 0], "span": 25, "tilt": 30}]
        moving = SceneRenderer(self.plan, self.root, [])
        self.assertNotEqual(moving._map(self.plan["scenes"][0], 1).tobytes(), moving._map(self.plan["scenes"][0], 4).tobytes())

    def test_border_styles_are_visibly_different_and_none_draws_nothing(self):
        cfg = self.globe()
        images = {}
        for style in ("none", "solid", "dashed", "soft", "glow"):
            cfg["border_style"] = style
            images[style] = numpy.asarray(self.frame()).astype(int)
        cfg["borders"] = False
        off = numpy.asarray(self.frame()).astype(int)
        self.assertTrue((images["none"] == off).all())
        touched = {style: int((image != off).any(axis=2).sum()) for style, image in images.items()}
        self.assertGreater(touched["solid"], 0)
        self.assertLess(touched["dashed"], touched["solid"])
        self.assertGreater(touched["glow"], touched["solid"])
        self.assertGreater(touched["soft"], 0)

    def test_rivers_and_lakes_are_drawn_over_the_relief(self):
        cfg = self.globe()
        cfg["borders"] = False
        with_water = numpy.asarray(self.frame()).astype(int)
        del cfg["rivers"], cfg["lakes"]
        without = numpy.asarray(self.frame()).astype(int)
        self.assertGreater(int((with_water != without).any(axis=2).sum()), 100)

    def test_a_country_stroke_draws_itself_before_the_fill_rises(self):
        cfg = self.globe()
        cfg["features"] = [self.feature(draw_seconds=2.0)]
        cfg["borders"] = False
        base = numpy.asarray(self.frame(2.0)).astype(int)
        cfg["features"] = []
        empty = numpy.asarray(self.frame(2.0)).astype(int)
        cfg["features"] = [self.feature(draw_seconds=2.0)]
        early = int((numpy.asarray(self.frame(.5)).astype(int) != empty).any(axis=2).sum())
        late = int((base != empty).any(axis=2).sum())
        self.assertGreater(late, early)
        self.assertGreater(early, 0)

    def test_a_tilt_lifts_an_extruded_country_upwards_on_screen(self):
        cfg = self.globe()
        cfg["borders"] = False
        cfg["camera"] = [{"at": 0, "center": [0, 10], "span": 40, "tilt": 50}]
        empty = numpy.asarray(self.frame(4.0)).astype(int)

        def top_row(extrude):
            cfg["features"] = [self.feature(extrude=extrude)]
            changed = (numpy.asarray(self.frame(4.0)).astype(int) != empty).any(axis=2)
            return int(numpy.flatnonzero(changed.any(axis=1))[0])

        self.assertLess(top_row(50), top_row(0) - 10)

    def test_a_raised_zone_is_at_least_as_visible_as_a_flat_one(self):
        cfg = self.globe()
        cfg["layer"], cfg["borders"] = "people", False
        cfg["camera"] = [{"at": 0, "center": [0, 10], "span": 40, "tilt": 45}]
        empty = numpy.asarray(self.frame(4.0)).astype(int)

        def strength(extrude):
            zone = {"kind": "presence-zone", "points": [[-6, 5], [6, 5], [6, 15], [-6, 15], [-6, 5]], "label": "Zone",
                    "at": 0, "until": 5, "colour": "gold", "geometry_note": "Approximate", "unlabelled": True,
                    "evidence": {**copy.deepcopy(self.plan["scenes"][0]["evidence"]), "status": "estimate"}}
            if extrude: zone["extrude"] = extrude
            cfg["features"] = [zone]
            return int(numpy.abs(numpy.asarray(self.frame(4.0)).astype(int) - empty).sum())

        self.assertGreaterEqual(strength(40), .8*strength(0))

    def test_the_legend_names_the_globe_and_its_borders_not_a_mercator_map(self):
        cfg = self.globe()
        scene = self.plan["scenes"][0]
        renderer = SceneRenderer(self.plan, self.root, [])
        for style, expected in (("solid", "Frontières actuelles"), ("dashed", "pointillé"), ("glow", "Frontières actuelles")):
            cfg["border_style"] = style
            first = renderer.legend(scene, 2)[0]
            self.assertIn("Globe", first)
            self.assertNotIn("Mercator", first)
            self.assertIn(expected, first)
        cfg["borders"] = False
        self.assertIn("Sans frontières actuelles", renderer.legend(scene, 2)[0])

    def test_a_feature_on_the_far_side_of_the_earth_is_not_drawn(self):
        cfg = self.globe()
        cfg["features"] = [{"kind": "point", "point": [-170, 10], "label": "Far", "at": 0, "until": 5,
                            "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"])}]
        with_point = self.frame().tobytes()
        cfg["features"] = []
        self.assertEqual(with_point, self.frame().tobytes())

    def test_a_sea_label_is_written_on_the_water(self):
        cfg = self.globe()
        cfg["borders"] = False
        before = numpy.asarray(self.frame()).astype(int)
        cfg["features"] = [{"kind": "label", "point": [-5, 5], "label": "ATLANTIQUE", "style": "sea", "at": 0,
                            "until": 5, "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"])}]
        after = numpy.asarray(self.frame()).astype(int)
        self.assertGreater(int((after != before).any(axis=2).sum()), 50)


if __name__ == "__main__":
    unittest.main()
