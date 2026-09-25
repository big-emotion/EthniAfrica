"""The scene video opens on its thumbnail and ends on the approved social-networks outro."""
import copy
import json
import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy
from PIL import Image

import test_ethni_scene_audio as audio
import test_ethni_scenes as scenes
from ethni_scene_outro import cue, frames, total_seconds
from ethni_scene_pipeline import execute
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer

SPOKEN = [{"debut": 0.0, "fin": 2.0, "texte": "A first spoken sentence."},
          {"debut": 2.2, "fin": 4.0, "texte": "A last spoken sentence."}]


class OutroCueTests(unittest.TestCase):
    def test_the_outro_cuts_in_where_the_narration_ends_on_the_frame_grid(self):
        self.assertEqual(cue(SPOKEN), 4.0)
        self.assertEqual(cue([{"debut": 0, "fin": 173.06, "texte": "x"}]), 173.04)

    def test_the_video_only_grows_when_the_plan_asks_for_the_outro(self):
        self.assertEqual(total_seconds({}, SPOKEN, 10.0), 10.0)
        self.assertEqual(total_seconds({"outro": True}, SPOKEN, 10.0), 10.0)
        self.assertEqual(total_seconds({"outro": True}, SPOKEN, 4.5), 9.0)

    def test_only_the_approved_outro_file_is_used(self):
        with patch("ethni_scene_outro.FIN_SHA256", "0000000000000"):
            with self.assertRaisesRegex(ValueError, "approved"):
                next(frames(3))

    def test_the_outro_supplies_full_size_frames_of_the_requested_count(self):
        received = list(frames(3))
        self.assertEqual(len(received), 3)
        self.assertEqual(received[0].size, (1080, 1920))


class OutroPlanTests(unittest.TestCase):
    setUp = scenes.ScenePlanTests.setUp

    def test_cover_and_outro_are_plain_booleans(self):
        for field in ("cover", "outro"):
            plan = copy.deepcopy(self.plan)
            plan[field] = True
            validate_plan(plan, self.root, 10)
            plan[field] = "yes"
            with self.assertRaisesRegex(ValueError, field):
                validate_plan(plan, self.root, 10)


class CoverTests(unittest.TestCase):
    setUp = scenes.ScenePlanTests.setUp

    def test_the_first_seconds_carry_the_title_alone(self):
        self.plan["cover"] = True
        with_captions = SceneRenderer(self.plan, self.root, SPOKEN)
        bare = SceneRenderer(self.plan, self.root, [])
        self.assertEqual(with_captions.render(0.5).tobytes(), bare.render(0.5).tobytes())
        self.assertNotEqual(with_captions.render(2.5).tobytes(), bare.render(2.5).tobytes())

    def test_without_the_cover_flag_captions_start_as_before(self):
        with_captions = SceneRenderer(self.plan, self.root, SPOKEN)
        bare = SceneRenderer(self.plan, self.root, [])
        self.assertNotEqual(with_captions.render(0.5).tobytes(), bare.render(0.5).tobytes())


class OutroExportTests(unittest.TestCase):
    def setUp(self):
        audio.AudioSourceTests.setUp(self)
        self.plan = scenes.fixture(self.root)
        self.plan["scenes"] = [self.plan["scenes"][0]]
        self.plan["scenes"][0]["end"] = 1
        self.plan["source"] = self.source
        self.plan["output_dir"] = str(self.root / "_epreuves/original")
        self.plan["cover"] = True
        self.plan["outro"] = True
        self.path = self.root / "scene-plan.json"
        self.lock = self.root / "work/handoff.json"
        self.out = self.root / "_epreuves/replay"

    digest = audio.AudioSourceTests.digest

    def test_the_export_ends_on_the_outro_and_files_the_thumbnail_beside_it(self):
        self.path.write_text(json.dumps(self.plan))
        execute("prepare", self.root, self.path, self.lock, self.out)
        result = execute("render", self.root, self.path, self.lock, self.out)
        captions = json.loads((self.out / "captions.json").read_text())
        self.assertAlmostEqual(result["video"]["duration"], cue(captions) + 5.0, delta=.05)
        video = self.out / "video-scenes-epreuve.mp4"
        last = self.out / "last.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.2", "-i", str(video),
                        "-frames:v", "1", str(last)], check=True)
        # The outro card is a light page; the scene it follows is a dark one.
        self.assertGreater(numpy.asarray(Image.open(last).convert("L")).mean(), 180)
        cover = Image.open(self.out / "cover.png")
        self.assertEqual(cover.size, (1080, 1920))


if __name__ == "__main__":
    unittest.main()
