"""Source approval and audio provenance are independent from visual composition."""
import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
import wave

from ethni_scene_audio import prepare_source


class AudioSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "work").mkdir()
        (self.root / "narration.fr.txt").write_text("Hello world.")
        for name in ("cards.json", "cartes.json"):
            (self.root / name).write_text("{}")
        with wave.open(str(self.root / "work/narration.wav"), "wb") as f:
            f.setparams((1, 2, 8000, 8000, "NONE", "not compressed"))
            f.writeframes(b"\0" * 16000)
        (self.root / "work/aligned-words.json").write_text(json.dumps([
            {"word": "Hello", "start": .1, "end": .3}, {"word": "world.", "start": .4, "end": .8}]))
        (self.root / "post.md").write_text("**Texte validé** : oui, le 2026-09-24, par l'opérateur.")
        self.source = {"source_script_sha256": self.digest("narration.fr.txt"),
                       "source_audio_sha256": self.digest("work/narration.wav"),
                       "cuts": [[0, 1]], "paragraphs": [0]}

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def test_valid_approved_source_produces_its_exact_text_and_timing(self):
        result = prepare_source(self.root, self.source)
        self.assertEqual(result["narration"], "Hello world.")
        self.assertEqual(result["duration"], 1)
        self.assertEqual(result["words"][-1]["end"], .8)

    def test_missing_or_stale_operator_approval_fails(self):
        (self.root / "post.md").write_text("Draft")
        with self.assertRaisesRegex(ValueError, "approval"):
            prepare_source(self.root, self.source)
        (self.root / "post.md").write_text("**Texte validé** : oui")
        os.utime(self.root / "post.md", (1, 1))
        with self.assertRaisesRegex(ValueError, "approval"):
            prepare_source(self.root, self.source)

    def test_stale_script_hash_and_changed_recording_fail(self):
        for key in ("source_script_sha256", "source_audio_sha256"):
            source = dict(self.source, **{key: "0"*64})
            with self.assertRaisesRegex(ValueError, "hash"):
                prepare_source(self.root, source)

    def test_cut_after_audio_end_is_not_silently_padded(self):
        self.source["cuts"] = [[0, 2]]
        with self.assertRaisesRegex(ValueError, "recording"):
            prepare_source(self.root, self.source)

    def test_incomplete_paragraph_or_empty_excerpt_fails(self):
        for cuts in ([[0, .35]], []):
            self.source["cuts"] = cuts
            with self.assertRaises(ValueError): prepare_source(self.root, self.source)

    def test_montage_scene_pipeline_exports_real_video_with_provenance(self):
        from ethni_scenes import run
        import subprocess
        plan = {"version": 1, "profile": "free", "title": "Fixture", "source": self.source,
                "output_dir": str(self.root/"_epreuves"), "assets": {},
                "sources": {"test": {"citation": "Test fixture", "url": "https://example.org", "tier": "unverified"}},
                "scenes": [{"id": "one", "start": 0, "end": 1, "type": "text", "title": "TEST",
                            "text": "Hello world.", "purpose": "Exercise the complete render path",
                            "evidence": {"sources": ["test"], "status": "illustration", "period": "Test"}}]}
        file = self.root/"scene-plan.json"
        file.write_text(json.dumps(plan))
        target = run(self.root, file)
        probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(target)],
                                          check=True, capture_output=True, text=True).stdout)
        self.assertEqual([s["codec_name"] for s in probe["streams"]], ["h264", "aac"])
        self.assertEqual(probe["streams"][0]["nb_frames"], "25")
        self.assertEqual(probe["streams"][0]["width"], 1080)
        report = json.loads((target.parent/"render-report.json").read_text())
        self.assertTrue(report["proof_only"])
        self.assertEqual(report["plan_sha256"], self.digest("scene-plan.json"))
        self.assertEqual(list(target.parent.glob(".scenes-*")), [])


if __name__ == "__main__":
    unittest.main()
