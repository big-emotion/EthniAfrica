"""Contract tests for the orthographic globe: projection, camera, easing and relief sampling."""
import math
import unittest

import numpy as np

from ethni_globe import GlobeCamera, ease, globe_camera_at, sample_bilinear


def camera(**kw):
    values = dict(center=(20.0, 0.0), span=40.0, tilt=0.0, heading=0.0, viewport=(0, 0, 1000, 2000))
    values.update(kw)
    return GlobeCamera(**values)


class GlobeProjectionTests(unittest.TestCase):
    def test_the_centre_projects_to_the_viewport_centre(self):
        x, y = camera().project((20.0, 0.0))
        self.assertAlmostEqual(x, 500, places=6)
        self.assertAlmostEqual(y, 1000, places=6)

    def test_span_is_the_longitude_width_the_viewport_covers_at_the_centre(self):
        x, _ = camera().project((40.0, 0.0))
        self.assertAlmostEqual(x, 1000, places=6)
        x, _ = camera().project((0.0, 0.0))
        self.assertAlmostEqual(x, 0, places=6)

    def test_east_is_right_and_north_is_up(self):
        c = camera()
        cx, cy = c.project((20.0, 0.0))
        self.assertGreater(c.project((25.0, 0.0))[0], cx)
        self.assertLess(c.project((20.0, 5.0))[1], cy)

    def test_the_far_side_of_the_earth_is_hidden_and_lands_on_the_limb(self):
        c = camera()
        self.assertTrue(c.visible((20.0, 0.0)))
        self.assertFalse(c.visible((-160.0, 0.0)))
        x, y = c.project((-160.0, 0.0))
        self.assertTrue(math.isfinite(x) and math.isfinite(y))
        radius = math.hypot(x - 500, y - 1000)
        self.assertAlmostEqual(radius, c.radius, places=4)

    def test_projection_and_inversion_agree(self):
        c = camera(tilt=30.0, heading=25.0)
        for point in [(20.0, 0.0), (33.5, -12.25), (5.0, 18.0), (28.0, 40.0)]:
            x, y = c.project(point)
            lon, lat = c.unproject((x, y))
            self.assertAlmostEqual(lon, point[0], places=5)
            self.assertAlmostEqual(lat, point[1], places=5)

    def test_heading_turns_the_map_so_that_the_chosen_bearing_points_up(self):
        c = camera(heading=90.0)
        cx, cy = c.project((20.0, 0.0))
        east = c.project((25.0, 0.0))
        north = c.project((20.0, 5.0))
        self.assertLess(east[1], cy)      # east now points up
        self.assertLess(north[0], cx)     # north now points left

    def test_a_tilt_turns_height_into_a_screen_direction(self):
        flat = camera(tilt=0.0)
        self.assertAlmostEqual(flat.project((20.0, 0.0), height=60)[1], flat.project((20.0, 0.0))[1], places=6)
        tilted = camera(tilt=40.0)
        self.assertLess(tilted.project((20.0, 0.0), height=60)[1], tilted.project((20.0, 0.0))[1] - 5)

    def test_the_pixel_grid_recovers_the_centre_and_masks_the_sky(self):
        c = camera(viewport=(0, 0, 100, 200), span=40.0)
        lon, lat, inside = c.grid(100, 200)
        self.assertEqual(lon.shape, (200, 100))
        self.assertAlmostEqual(float(lon[100, 50]), 20.0, delta=0.5)
        self.assertAlmostEqual(float(lat[100, 50]), 0.0, delta=0.5)
        self.assertTrue(inside[100, 50])
        far = camera(viewport=(0, 0, 100, 200), span=350.0)
        _, _, inside = far.grid(100, 200)
        self.assertFalse(inside.all())

    def test_an_invalid_camera_fails_instead_of_drawing_nonsense(self):
        with self.assertRaises(ValueError):
            camera(span=0)
        with self.assertRaises(ValueError):
            camera(span=400)
        with self.assertRaises(ValueError):
            camera(center=(20.0, 95.0))
        with self.assertRaises(ValueError):
            camera(tilt=85.0)


class EasingTests(unittest.TestCase):
    def test_every_easing_starts_at_zero_ends_at_one_and_never_overshoots(self):
        for name in ("linear", "smooth", "cubic", "spring"):
            values = [ease(name, u / 200) for u in range(201)]
            self.assertAlmostEqual(values[0], 0.0, places=9, msg=name)
            self.assertAlmostEqual(values[-1], 1.0, places=9, msg=name)
            self.assertTrue(all(b >= a - 1e-12 for a, b in zip(values, values[1:])), name)
            self.assertLessEqual(max(values), 1.0 + 1e-12, name)

    def test_the_spring_leaves_fast_and_settles_slowly(self):
        self.assertGreater(ease("spring", .2), ease("smooth", .2))
        self.assertGreater(ease("spring", .8), ease("linear", .8))

    def test_unknown_easing_is_refused(self):
        with self.assertRaises(ValueError):
            ease("bounce", .5)


class GlobeCameraKeyframeTests(unittest.TestCase):
    keys = [
        {"at": 0, "center": [170.0, 10.0], "span": 40.0, "ease": "linear"},
        {"at": 4, "center": [-170.0, 30.0], "span": 160.0},
    ]

    def test_it_holds_at_both_ends(self):
        self.assertEqual(globe_camera_at(self.keys, -1)["center"], (170.0, 10.0))
        self.assertEqual(globe_camera_at(self.keys, 9)["center"], (-170.0, 30.0))

    def test_longitude_takes_the_short_way_round(self):
        mid = globe_camera_at(self.keys, 2)
        self.assertAlmostEqual(abs(mid["center"][0]), 180.0, places=6)
        self.assertAlmostEqual(mid["center"][1], 20.0, places=6)

    def test_span_interpolates_geometrically_so_a_zoom_feels_even(self):
        mid = globe_camera_at(self.keys, 2)
        self.assertAlmostEqual(mid["span"], math.sqrt(40.0 * 160.0), places=6)

    def test_tilt_and_heading_default_to_zero(self):
        mid = globe_camera_at(self.keys, 2)
        self.assertEqual((mid["tilt"], mid["heading"]), (0.0, 0.0))


class ReliefSamplingTests(unittest.TestCase):
    def raster(self):
        # Channel 0 carries the longitude and channel 1 the latitude of each pixel centre.
        width, height, west, south, east, north = 201, 101, -10.0, -5.0, 10.0, 5.0
        lon = west + (np.arange(width) + .5) * (east - west) / width
        lat = north - (np.arange(height) + .5) * (north - south) / height
        data = np.zeros((height, width, 2), np.float32)
        data[:, :, 0] = lon[None, :]
        data[:, :, 1] = lat[:, None]
        return data, (west, south, east, north)

    def test_sampling_returns_the_coordinates_it_asks_for(self):
        data, bounds = self.raster()
        lon = np.array([[-8.0, 0.0], [3.3, 9.0]])
        lat = np.array([[4.0, 0.0], [-2.2, -3.9]])
        out, inside = sample_bilinear(data, bounds, lon, lat)
        self.assertTrue(inside.all())
        np.testing.assert_allclose(out[:, :, 0], lon, atol=1e-3)
        np.testing.assert_allclose(out[:, :, 1], lat, atol=1e-3)

    def test_points_outside_the_raster_are_flagged_and_clamped(self):
        data, bounds = self.raster()
        lon, lat = np.array([[-20.0, 0.0]]), np.array([[0.0, 30.0]])
        out, inside = sample_bilinear(data, bounds, lon, lat)
        self.assertEqual(inside.tolist(), [[False, False]])
        self.assertTrue(np.isfinite(out).all())


if __name__ == "__main__":
    unittest.main()
