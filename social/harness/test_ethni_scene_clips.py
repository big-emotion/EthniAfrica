"""Archive clips and the authored audio timeline, checked on decoded output.

Every fixture is synthetic (pure tones, a flat colour) so the tests can tell *where* each sound and
picture landed. A tone is a technical marker, never a stand-in for a historical recording.
"""
import copy
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import wave

import numpy as np

from ethni_scene_audio import prepare_source
from ethni_scene_mix import render_master
from ethni_scene_plan import validate_plan

RATE = 48000
NARRATION_HZ, EXCERPT_HZ, FILM_HZ, BED_HZ = 220, 880, 660, 330


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_wav(path):
    with wave.open(str(path)) as f:
        assert f.getframerate() == RATE and f.getnchannels() == 2
        raw = np.frombuffer(f.readframes(f.getnframes()), dtype="<i2").astype(np.float64) / 32768
    return raw.reshape(-1, 2).mean(axis=1)


def dominant_hz(samples, start, end):
    window = samples[round(start*RATE):round(end*RATE)]
    if not len(window) or np.sqrt(np.mean(window**2)) < 1e-3:
        return 0
    spectrum = np.abs(np.fft.rfft(window * np.hanning(len(window))))
    return round(np.fft.rfftfreq(len(window), 1/RATE)[spectrum.argmax()])


def rms_db(samples, start, end):
    window = samples[round(start*RATE):round(end*RATE)]
    return 20*np.log10(max(np.sqrt(np.mean(window**2)), 1e-9))


class Fixtures(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank = tempfile.mkdtemp()
        bank = Path(cls.bank)
        ffmpeg("-f", "lavfi", "-i", f"sine=frequency={EXCERPT_HZ}:duration=6:sample_rate=44100", "-ac", "2",
               "-af", "volume=0.5", str(bank/"excerpt.wav"))
        ffmpeg("-f", "lavfi", "-i", "color=c=red:s=320x240:r=30:d=5", "-f", "lavfi",
               "-i", f"sine=frequency={FILM_HZ}:duration=5", "-c:v", "libx264", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-shortest", str(bank/"film.mp4"))
        ffmpeg("-f", "lavfi", "-i", "color=c=red:s=320x240:r=30:d=5", "-c:v", "libx264", "-pix_fmt", "yuv420p",
               str(bank/"mute-film.mp4"))
        ffmpeg("-f", "lavfi", "-i", f"sine=frequency={BED_HZ}:duration=20:sample_rate=44100", "-ac", "2",
               "-af", "volume=0.5", str(bank/"bed.wav"))
        ffmpeg("-f", "lavfi", "-i", f"sine=frequency={EXCERPT_HZ}:duration=6:sample_rate=44100", "-ac", "2",
               "-af", "volume=0.7", str(bank/"loud.wav"))

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.bank, ignore_errors=True)

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root/"work").mkdir()
        (self.root/"narration.fr.txt").write_text("Alpha beta. Gamma delta.")
        (self.root/"post.md").write_text("**Texte validé** : oui, le 2026-09-24, par l'opérateur.")
        for name in ("excerpt.wav", "film.mp4", "mute-film.mp4", "bed.wav", "loud.wav"):
            shutil.copy(Path(self.bank)/name, self.root/name)
        ffmpeg("-f", "lavfi", "-i", f"sine=frequency={NARRATION_HZ}:duration=3:sample_rate=16000",
               "-ac", "1", "-af", "volume=0.5", str(self.root/"work/narration.wav"))
        (self.root/"work/aligned-words.json").write_text(json.dumps([
            {"word": "Alpha", "start": .2, "end": .6}, {"word": "beta.", "start": .7, "end": 1.1},
            {"word": "Gamma", "start": 1.6, "end": 2.0}, {"word": "delta.", "start": 2.1, "end": 2.5}]))
        self.plan = self.make_plan()

    def asset(self, name, credit="Synthetic tone"):
        return {"path": name, "kind": "clip", "sha256": sha(self.root/name), "credit": credit,
                "license": "Test fixture", "source": "fixture"}

    def make_plan(self, scenes=None):
        insertion = {"id": "hear-1", "at": 1.3, "asset": "excerpt", "in": 1.0, "out": 4.0,
                     "silence_before": .5, "silence_after": .5}
        evidence = {"sources": ["fixture"], "status": "illustration", "period": "Test"}
        def text_scene(name, start, end):
            return {"id": name, "type": "text", "start": start, "end": end, "title": "TEST", "text": name,
                    "purpose": "Exercise the timeline", "evidence": evidence}
        return {"version": 1, "profile": "free", "title": "Fixture", "output_dir": str(self.root/"_epreuves"),
                "source": {"source_script_sha256": sha(self.root/"narration.fr.txt"),
                           "source_audio_sha256": sha(self.root/"work/narration.wav"),
                           "cuts": [[0, 3]], "paragraphs": [0]},
                "sources": {"fixture": {"citation": "Synthetic fixture", "url": "https://example.org", "tier": "unverified"}},
                "assets": {"excerpt": self.asset("excerpt.wav"), "film": self.asset("film.mp4"),
                           "mute": self.asset("mute-film.mp4"), "bed": self.asset("bed.wav"),
                           "loud": self.asset("loud.wav")},
                "insertions": [insertion],
                "scenes": scenes or [text_scene("intro", 0, 1.3), text_scene("listen", 1.3, 5.3),
                                     text_scene("after", 5.3, 7)]}

    def prepare(self, plan=None):
        plan = plan or self.plan
        return prepare_source(self.root, plan["source"], plan)

    def master(self, plan=None):
        plan = plan or self.plan
        prepared = self.prepare(plan)
        target = self.root/"master.wav"
        report = render_master(self.root, plan, prepared, target)
        return prepared, read_wav(target), report


class InsertionValidation(Fixtures):
    def test_valid_insertion_extends_the_timeline_and_retimes_only_what_follows(self):
        prepared = self.prepare()
        self.assertAlmostEqual(prepared["duration"], 3+.5+3+.5, places=6)
        first, second = prepared["captions"]
        self.assertAlmostEqual(first["debut"], .2)
        self.assertAlmostEqual(second["debut"], 1.6+4, places=6)
        window = prepared["timeline"]["windows"][0]
        self.assertEqual([round(window[k], 6) for k in ("start", "clip_start", "clip_end", "end")], [1.3, 1.8, 4.8, 5.3])

    def test_out_of_bounds_and_degenerate_trims_fail(self):
        for change in ({"out": 6.5}, {"in": -.1}, {"in": 2.0, "out": 2.0}, {"in": 3.0, "out": 2.0},
                       {"in": 1.0, "out": 1.2}, {"in": "1"}, {"out": float("inf")}):
            plan = copy.deepcopy(self.plan)
            plan["insertions"][0].update(change)
            with self.assertRaises(ValueError, msg=str(change)):
                self.prepare(plan)

    def test_a_clip_missing_its_audio_track_fails_rather_than_playing_silence(self):
        plan = copy.deepcopy(self.plan)
        plan["insertions"][0].update(asset="mute", **{"in": 0, "out": 2})
        with self.assertRaisesRegex(ValueError, "audio"):
            self.prepare(plan)

    def test_unknown_asset_or_wrong_kind_fails(self):
        for asset in ("nowhere", "bed_image"):
            plan = copy.deepcopy(self.plan)
            plan["assets"]["bed_image"] = dict(plan["assets"]["excerpt"], kind="image")
            plan["insertions"][0]["asset"] = asset
            with self.assertRaises(ValueError):
                self.prepare(plan)

    def test_an_insertion_may_not_cut_a_caption_or_leave_the_narration(self):
        for at in (.5, 2.0, -.1, 3.5):
            plan = copy.deepcopy(self.plan)
            plan["insertions"][0]["at"] = at
            with self.assertRaises(ValueError, msg=str(at)):
                self.prepare(plan)

    def test_insertions_must_be_ordered_and_silences_bounded(self):
        plan = copy.deepcopy(self.plan)
        plan["insertions"].append(dict(plan["insertions"][0], id="hear-2", at=1.3))
        with self.assertRaisesRegex(ValueError, "order"):
            self.prepare(plan)
        for change in ({"silence_before": -1}, {"silence_after": 9}):
            plan = copy.deepcopy(self.plan)
            plan["insertions"][0].update(change)
            with self.assertRaises(ValueError):
                self.prepare(plan)

    def test_a_changed_or_missing_clip_file_is_refused_by_the_plan(self):
        prepared = self.prepare()
        (self.root/"excerpt.wav").write_bytes((self.root/"excerpt.wav").read_bytes() + b"\0\0")
        with self.assertRaisesRegex(ValueError, "hash"):
            validate_plan(self.plan, self.root, prepared["duration"], prepared["timeline"])
        (self.root/"excerpt.wav").unlink()
        with self.assertRaisesRegex(ValueError, "Missing"):
            validate_plan(self.plan, self.root, prepared["duration"], prepared["timeline"])

    def test_a_plan_without_insertions_keeps_the_legacy_result(self):
        plan = copy.deepcopy(self.plan)
        del plan["insertions"]
        prepared = self.prepare(plan)
        self.assertNotIn("timeline", prepared)
        self.assertEqual(prepared["duration"], 3)


class MasterMix(Fixtures):
    def test_each_sound_lands_in_its_window_and_nothing_overlaps_the_excerpt(self):
        prepared, audio, _ = self.master()
        self.assertEqual(len(audio), round(prepared["duration"]*RATE))
        self.assertEqual(dominant_hz(audio, .3, 1.0), NARRATION_HZ)
        self.assertEqual(dominant_hz(audio, 1.35, 1.75), 0)
        self.assertEqual(dominant_hz(audio, 1.9, 4.7), EXCERPT_HZ)
        self.assertEqual(dominant_hz(audio, 4.85, 5.25), 0)
        self.assertEqual(dominant_hz(audio, 5.7, 6.4), NARRATION_HZ)

    def test_excerpt_honours_the_authored_trim_point(self):
        # The source steps from 880 to 1760 Hz at 0.5 s; with in=0.5 that step lands 0.5 s into the excerpt window.
        ffmpeg("-f", "lavfi", "-i", "sine=frequency=880:duration=1:sample_rate=44100",
               "-f", "lavfi", "-i", "sine=frequency=1760:duration=5:sample_rate=44100",
               "-filter_complex", "[0][1]concat=n=2:v=0:a=1,pan=stereo|c0=c0|c1=c0[o]", "-map", "[o]",
               str(self.root/"excerpt.wav"))
        self.plan["assets"]["excerpt"]["sha256"] = sha(self.root/"excerpt.wav")
        self.plan["insertions"][0].update({"in": .5, "out": 2.5})
        _, audio, _ = self.master()
        self.assertEqual(dominant_hz(audio, 1.85, 2.25), 880)
        self.assertEqual(dominant_hz(audio, 2.4, 3.7), 1760)

    def test_video_clip_audio_is_the_excerpt_and_needs_no_resync(self):
        self.plan["insertions"][0].update(asset="film", **{"in": 0, "out": 2})
        prepared, audio, _ = self.master()
        self.assertEqual(dominant_hz(audio, 1.9, 3.7), FILM_HZ)

    def test_narration_never_speaks_over_the_excerpt_and_the_bed_leaves_it_alone(self):
        self.plan["bed"] = {"asset": "bed", "in": 0, "gain_db": -30, "duck_db": -6}
        prepared, audio, report = self.master()
        self.assertEqual(dominant_hz(audio, 1.9, 4.7), EXCERPT_HZ)
        self.assertLess(report["bed_under_excerpt_db"], -80)

    def test_a_bed_ducks_under_speech_and_is_measured(self):
        self.plan["bed"] = {"asset": "bed", "in": 0, "gain_db": -20, "duck_db": -10}
        _, audio, report = self.master()
        self.assertGreaterEqual(report["voice_over_bed_db"], 15)
        self.assertGreater(report["bed_in_silence_db"], report["bed_under_voice_db"])

    def test_a_bed_that_masks_the_voice_or_cannot_last_the_film_fails(self):
        self.plan["bed"] = {"asset": "bed", "in": 0, "gain_db": -3, "duck_db": 0}
        with self.assertRaisesRegex(ValueError, "voice"):
            self.master()
        self.plan["bed"] = {"asset": "bed", "in": 18, "gain_db": -30, "duck_db": 0}
        with self.assertRaisesRegex(ValueError, "bed"):
            self.master()

    def test_hot_material_is_limited_below_full_scale_and_the_reduction_reported(self):
        self.plan["insertions"][0].update(asset="loud", gain_db=6)
        _, audio, report = self.master()
        self.assertLess(np.abs(audio).max(), 10**(-1/20)+1e-3)
        self.assertLessEqual(report["peak_db"], -1+.05)
        self.assertGreater(report["limiter_gain_db"], -6.0001)

    def test_an_excerpt_too_far_from_the_narration_level_is_refused(self):
        self.plan["insertions"][0].update(gain_db=-12)
        ffmpeg("-f", "lavfi", "-i", f"sine=frequency={EXCERPT_HZ}:duration=6:sample_rate=44100", "-ac", "2",
               "-af", "volume=0.01", str(self.root/"excerpt.wav"))
        self.plan["assets"]["excerpt"]["sha256"] = sha(self.root/"excerpt.wav")
        with self.assertRaisesRegex(ValueError, "excerpt"):
            self.master()

    def test_the_master_is_byte_identical_on_a_second_render(self):
        self.master()
        first = sha(self.root/"master.wav")
        self.master()
        self.assertEqual(first, sha(self.root/"master.wav"))


class ClipScenes(Fixtures):
    def scenes(self, transition=None, kind="film", start=1.3, end=5.3):
        evidence = {"sources": ["fixture"], "status": "illustration", "period": "Test"}
        def text_scene(name, a, b):
            return {"id": name, "type": "text", "start": a, "end": b, "title": "TEST", "text": name,
                    "purpose": "Exercise the timeline", "evidence": evidence}
        clip = {"id": "clip", "type": "clip", "start": start, "end": end, "title": "TEST",
                "purpose": "Show the excerpt", "evidence": evidence, "clip": {"insertion": "hear-1", "fit": "contain"}}
        if transition:
            clip["transition"] = transition
        scenes = []
        if start > 0: scenes.append(text_scene("intro", 0, start))
        scenes.append(clip)
        if end < 7: scenes.append(text_scene("after", end, 7))
        return scenes

    def video_plan(self, **kwargs):
        plan = self.make_plan(self.scenes(**kwargs))
        plan["insertions"][0].update(asset="film", **{"in": 0, "out": 3})
        return plan

    def test_the_picture_is_the_clip_at_the_window_and_holds_on_its_first_and_last_frame(self):
        from ethni_scene_render import SceneRenderer
        plan = self.video_plan()
        prepared = self.prepare(plan)
        validate_plan(plan, self.root, prepared["duration"], prepared["timeline"])
        renderer = SceneRenderer(plan, self.root, prepared["captions"], timeline=prepared["timeline"])
        for instant in (1.4, 1.8, 3.3, 4.79, 5.2):
            frame = renderer.visual(plan["scenes"][1], instant)
            r, g, b = frame.getpixel((540, 760))
            self.assertGreater(r, 180, instant)
            self.assertLess(g+b, 120, instant)
        self.assertNotEqual(renderer.visual(plan["scenes"][0], .5).getpixel((540, 760)),
                            renderer.visual(plan["scenes"][1], 3.0).getpixel((540, 760)))

    def test_scene_window_must_contain_the_excerpt_and_the_insertion_must_exist(self):
        for kwargs in ({"start": 1.9}, {"end": 4.0}):
            plan = self.video_plan(**kwargs)
            prepared = self.prepare(plan)
            with self.assertRaisesRegex(ValueError, "window"):
                validate_plan(plan, self.root, prepared["duration"], prepared["timeline"])
        plan = self.video_plan()
        plan["scenes"][1]["clip"]["insertion"] = "hear-9"
        prepared = self.prepare(plan)
        with self.assertRaisesRegex(ValueError, "insertion"):
            validate_plan(plan, self.root, prepared["duration"], prepared["timeline"])

    def test_a_clip_scene_needs_a_picture(self):
        plan = self.make_plan(self.scenes())
        prepared = self.prepare(plan)
        with self.assertRaisesRegex(ValueError, "picture"):
            validate_plan(plan, self.root, prepared["duration"], prepared["timeline"])

    def test_transition_into_the_clip_must_finish_before_the_sound_starts(self):
        plan = self.video_plan(transition={"type": "dissolve", "duration": .4})
        prepared = self.prepare(plan)
        validate_plan(plan, self.root, prepared["duration"], prepared["timeline"])
        plan["scenes"][1]["start"] = 1.3
        plan["insertions"][0]["silence_before"] = .3
        prepared = self.prepare(plan)
        with self.assertRaisesRegex(ValueError, "transition"):
            validate_plan(plan, self.root, prepared["duration"], prepared["timeline"])

    def test_the_finished_video_carries_the_excerpt_on_time_and_decodes_completely(self):
        from ethni_scenes import run
        plan = self.video_plan(transition={"type": "dissolve", "duration": .5})
        plan["progress"] = False
        file = self.root/"scene-plan.json"
        file.write_text(json.dumps(plan))
        target = run(self.root, file)
        probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(target)],
                                          check=True, capture_output=True, text=True).stdout)
        video, audio = probe["streams"]
        self.assertEqual((video["codec_name"], audio["codec_name"]), ("h264", "aac"))
        self.assertAlmostEqual(float(video["duration"]), 7.0, delta=.05)
        self.assertAlmostEqual(float(audio["duration"]), 7.0, delta=.06)
        subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(target), "-f", "null", "-"], check=True)
        pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(target), "-vn", "-ac", "1", "-ar", str(RATE),
                              "-f", "s16le", "-"], check=True, capture_output=True).stdout
        samples = np.frombuffer(pcm, dtype="<i2").astype(np.float64)/32768
        self.assertEqual(dominant_hz(samples, 2.0, 4.6), FILM_HZ)
        self.assertEqual(dominant_hz(samples, .3, 1.0), NARRATION_HZ)
        self.assertEqual(dominant_hz(samples, 5.7, 6.4), NARRATION_HZ)
        still = subprocess.run(["ffmpeg", "-v", "error", "-ss", "3.0", "-i", str(target), "-frames:v", "1",
                                "-vf", "crop=2:2:540:760", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                               check=True, capture_output=True).stdout
        self.assertGreater(still[0], 150)
        report = json.loads((target.parent/"render-report.json").read_text())
        record = report["audio_timeline"]["insertions"][0]
        self.assertEqual((record["asset"], record["in"], record["out"]), ("film", 0, 3))
        self.assertEqual(record["sha256"], sha(self.root/"film.mp4"))
        self.assertEqual(record["credit"], "Synthetic tone")


if __name__ == "__main__":
    unittest.main()
