"""Contract tests for geographic projection and source-timed map proofs."""
import math
import unittest

from ethni_map import Camera, camera_at, excerpt_words, visible_events, partial_path


class MapTests(unittest.TestCase):
    def test_projection_preserves_geographic_directions(self):
        camera = Camera((-20, -35, 55, 38), (0, 0, 900, 900))
        centre = camera.project((0, 0))
        self.assertGreater(camera.project((1, 0))[0], centre[0])
        self.assertLess(camera.project((0, 1))[1], centre[1])
        self.assertTrue(all(math.isfinite(v) for v in camera.project((0, 90))))

    def test_fit_keeps_all_four_corners_in_view(self):
        camera = Camera((-12, 9, -7, 14), (90, 400, 800, 700))
        for lon in (-12, -7):
            for lat in (9, 14):
                x, y = camera.project((lon, lat))
                self.assertTrue(90 - 1e-8 <= x <= 890 + 1e-8)
                self.assertTrue(400 - 1e-8 <= y <= 1100 + 1e-8)

    def test_invalid_camera_fails_instead_of_flipping_a_map(self):
        with self.assertRaises(ValueError):
            Camera((10, 0, -10, 20), (0, 0, 100, 100))

    def test_camera_holds_at_ends_and_hits_keyframes(self):
        keys = [{"at": 0, "bounds": [-20, -35, 55, 38]},
                {"at": 4, "bounds": [-12, 9, -7, 14]}]
        self.assertEqual(camera_at(keys, -2), tuple(keys[0]["bounds"]))
        self.assertEqual(camera_at(keys, 4), tuple(keys[1]["bounds"]))
        self.assertEqual(camera_at(keys, 20), tuple(keys[1]["bounds"]))
        mid = camera_at(keys, 2)
        self.assertEqual(mid, (-16, -13, 24, 26))

    def test_cut_retimes_captions_without_importing_neighbouring_speech(self):
        words = [{"word": "Before", "start": 1, "end": 2},
                 {"word": "Manden", "start": 10, "end": 11},
                 {"word": "Mandé", "start": 20, "end": 21}]
        cuts = [[9, 12], [19, 22]]
        actual = excerpt_words(words, cuts)
        self.assertEqual([w["word"] for w in actual], ["Manden", "Mandé"])
        self.assertEqual([(w["start"], w["end"]) for w in actual], [(1, 2), (4, 5)])
        self.assertEqual(words[1]["start"], 10)

    def test_cut_rejects_words_split_by_an_edit(self):
        with self.assertRaises(ValueError):
            excerpt_words([{"word": "Manden", "start": 1, "end": 2}], [[1.5, 3]])

    def test_events_never_appear_before_their_spoken_cue(self):
        events = [{"at": 3, "year": "1594"}, {"at": 5, "year": "1799"}]
        self.assertEqual(visible_events(events, 2.9), [])
        self.assertEqual(visible_events(events, 3), events[:1])

    def test_progressive_path_uses_distance_not_vertex_count(self):
        self.assertEqual(partial_path([(0, 0), (9, 0), (10, 0)], .5), [(0, 0), (5, 0)])
        self.assertEqual(partial_path([(0, 0), (9, 0)], 0), [(0, 0)])
        self.assertEqual(partial_path([(0, 0), (9, 0)], 1), [(0, 0), (9, 0)])


if __name__ == "__main__":
    unittest.main()
