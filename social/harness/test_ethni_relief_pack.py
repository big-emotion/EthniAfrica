"""Cutting a region pack out of the world relief: the window, the layers and what is written."""
import json
import pathlib
import tempfile
import unittest

import numpy
from PIL import Image

from ethni_relief_pack import build_pack, crop_layer, pixel_window


class WindowTests(unittest.TestCase):
    def test_a_window_covers_the_request_and_reports_the_bounds_it_really_has(self):
        box, actual = pixel_window((-30, -40, 60, 45), (3600, 1800))
        self.assertEqual(box, (1500, 450, 2400, 1300))
        self.assertEqual(actual, (-30.0, -40.0, 60.0, 45.0))

    def test_a_window_rounds_outwards_so_the_request_is_never_clipped(self):
        box, actual = pixel_window((-30.04, -40.04, 60.04, 45.04), (3600, 1800))
        self.assertLessEqual(actual[0], -30.04)
        self.assertLessEqual(actual[1], -40.04)
        self.assertGreaterEqual(actual[2], 60.04)
        self.assertGreaterEqual(actual[3], 45.04)
        self.assertEqual(box[2] - box[0], round((actual[2] - actual[0]) * 10))

    def test_a_window_outside_the_world_is_refused(self):
        with self.assertRaises(ValueError):
            pixel_window((-200, 0, 10, 10), (3600, 1800))
        with self.assertRaises(ValueError):
            pixel_window((10, 0, 5, 10), (3600, 1800))


class LayerTests(unittest.TestCase):
    def layer(self):
        def line(name, coords):
            return {"type": "Feature", "properties": {"name": name}, "geometry": {"type": "LineString", "coordinates": coords}}
        return {"type": "FeatureCollection", "features": [
            line("inside", [[10, 0], [12, 2]]), line("crossing", [[55, 0], [70, 0]]), line("outside", [[100, 10], [110, 12]])]}

    def test_only_features_reaching_the_window_are_kept(self):
        kept = crop_layer(self.layer(), (-30, -40, 60, 45))
        self.assertEqual([f["properties"]["name"] for f in kept["features"]], ["inside", "crossing"])

    def test_a_feature_without_coordinates_is_skipped_not_fatal(self):
        layer = self.layer()
        layer["features"].append({"type": "Feature", "properties": {"name": "empty"},
                                  "geometry": {"type": "MultiLineString", "coordinates": []}})
        kept = crop_layer(layer, (-30, -40, 60, 45))
        self.assertEqual([f["properties"]["name"] for f in kept["features"]], ["inside", "crossing"])

    def test_a_feature_beyond_the_engines_latitude_limit_is_dropped(self):
        layer = self.layer()
        layer["features"].append({"type": "Feature", "properties": {"name": "polar"},
                                  "geometry": {"type": "LineString", "coordinates": [[10, -84], [12, -90]]}})
        kept = crop_layer(layer, (-30, -90, 60, 45), max_latitude=85)
        self.assertNotIn("polar", [f["properties"]["name"] for f in kept["features"]])
        self.assertIn("polar", [f["properties"]["name"] for f in crop_layer(layer, (-30, -90, 60, 45))["features"]])

    def test_a_layer_with_nothing_in_the_window_is_refused_rather_than_written_empty(self):
        with self.assertRaises(ValueError):
            crop_layer(self.layer(), (-170, -80, -160, -70))


class PackTests(unittest.TestCase):
    def test_a_pack_is_a_jpeg_with_its_bounds_and_the_cropped_layers(self):
        with tempfile.TemporaryDirectory() as temp:
            temp = pathlib.Path(temp)
            world = temp / "world.png"
            Image.fromarray(numpy.zeros((180, 360, 3), numpy.uint8)).save(world)
            rivers = temp / "rivers.geojson"
            rivers.write_text(json.dumps({"type": "FeatureCollection", "features": [
                {"type": "Feature", "properties": {}, "geometry": {"type": "LineString", "coordinates": [[10, 0], [12, 2]]}}]}))
            pack = build_pack(world, (-30, -40, 60, 45), temp / "pack", width=200, layers={"rivers": rivers})
            self.assertTrue((temp / "pack" / "relief.jpg").is_file())
            self.assertTrue((temp / "pack" / "rivers.geojson").is_file())
            self.assertEqual(pack["bounds"], [-30.0, -40.0, 60.0, 45.0])
            with Image.open(temp / "pack" / "relief.jpg") as image:
                self.assertEqual(image.width, 200)


if __name__ == "__main__":
    unittest.main()
