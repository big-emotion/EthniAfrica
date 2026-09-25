"""A sealed scene package can be replayed without an agent redesigning it."""
import copy
import json
from pathlib import Path
import shutil
import unittest

import test_ethni_scene_audio as audio
import test_ethni_scenes as scenes
from ethni_scene_pipeline import execute


class ScenePipelineTests(unittest.TestCase):
    def setUp(self):
        audio.AudioSourceTests.setUp(self)
        self.plan = scenes.fixture(self.root)
        self.plan['scenes'] = [self.plan['scenes'][0]]
        self.plan['scenes'][0]['end'] = 1
        self.plan['source'] = self.source
        self.plan['output_dir'] = str(self.root / '_epreuves/original')
        self.path = self.root / 'scene-plan.json'
        self.save()
        self.lock = self.root / 'work/handoff.json'
        self.out = self.root / '_epreuves/replay'

    digest = audio.AudioSourceTests.digest

    def save(self):
        self.path.write_text(json.dumps(self.plan))

    def run_action(self, action):
        return execute(action, self.root, self.path, self.lock, self.out)

    def test_prepare_then_verify_preserves_the_approved_inputs(self):
        before = (self.root / 'narration.fr.txt').read_bytes()
        self.run_action('prepare')
        result = self.run_action('verify')
        self.assertTrue(result['sample_frames_match'])
        self.assertEqual(before, (self.root / 'narration.fr.txt').read_bytes())
        self.assertTrue((self.out / 'handoff-previews/index.md').is_file())
        self.assertFalse((self.out / 'video-scenes-epreuve.mp4').exists())

    def test_relocation_does_not_change_the_composition(self):
        self.run_action('prepare')
        destination = self.root / 'moved'
        destination.mkdir()
        for name in ['narration.fr.txt', 'post.md', 'cards.json', 'cartes.json', 'map.json', 'photo.png', 'scene-plan.json']:
            shutil.copy2(self.root / name, destination / name)
        shutil.copytree(self.root / 'work', destination / 'work')
        moved = copy.deepcopy(self.plan)
        moved['output_dir'] = str(destination / '_epreuves/new')
        (destination / 'scene-plan.json').write_text(json.dumps(moved))
        result = execute('verify', destination, destination / 'scene-plan.json', destination / 'work/handoff.json', destination / '_epreuves/new')
        self.assertTrue(result['sample_frames_match'])

    def test_valid_but_changed_plan_or_alignment_invalidates_the_lock(self):
        self.run_action('prepare')
        self.plan['scenes'][0]['title'] = 'Different'
        self.save()
        with self.assertRaisesRegex(ValueError, 'changed'): self.run_action('render')
        self.plan['scenes'][0]['title'] = 'Map'
        self.save()
        alignment = self.root / 'work/aligned-words.json'
        words = json.loads(alignment.read_text())
        words[0]['start'] = .11
        alignment.write_text(json.dumps(words))
        with self.assertRaisesRegex(ValueError, 'changed'): self.run_action('verify')
        self.assertFalse((self.out / 'video-scenes-epreuve.mp4').exists())

    def test_prepare_cannot_silently_replace_a_different_baseline(self):
        self.run_action('prepare')
        original = self.lock.read_bytes()
        self.plan['scenes'][0]['title'] = 'Different'
        self.save()
        with self.assertRaisesRegex(ValueError, 'changed'): self.run_action('prepare')
        self.assertEqual(original, self.lock.read_bytes())

    def test_tampered_pixel_or_runtime_baseline_is_not_reported_as_a_match(self):
        self.run_action('prepare')
        baseline = self.lock.read_text()
        for key in ['frames', 'identity']:
            value = json.loads(baseline)
            if key == 'frames': value['frames'][0]['sha256'] = '0'*64
            else: value['identity']['runtime']['python'] = 'different'
            self.lock.write_text(json.dumps(value))
            with self.assertRaises(ValueError): self.run_action('verify')

    def test_missing_text_approval_stops_preparation(self):
        (self.root / 'post.md').write_text('Draft')
        with self.assertRaisesRegex(ValueError, 'approval'): self.run_action('prepare')
        self.assertFalse(self.lock.exists())

    def test_real_export_is_verified_and_cannot_write_into_the_repository(self):
        self.run_action('prepare')
        result = self.run_action('render')
        self.assertEqual(result['video']['frames'], 25)
        self.assertTrue(result['video']['full_decode'])
        self.assertEqual(result['video']['dimensions'], [1080, 1920])
        self.assertTrue((self.out / 'execution-report.json').is_file())
        with self.assertRaises(SystemExit):
            execute('render', self.root, self.path, self.lock, Path(__file__).parent / '_epreuves')


if __name__ == '__main__':
    unittest.main()
