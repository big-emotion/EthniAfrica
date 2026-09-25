"""Publication delivery requires review of the exact proof and stays atomic."""
import copy
import json
import hashlib
import subprocess
from pathlib import Path
import unittest
from unittest.mock import patch

import test_ethni_scene_pipeline as pipeline_tests
from ethni_scene_pipeline import execute
from ethni_scene_render import SceneRenderer


class SceneReleaseTests(unittest.TestCase):
    digest = pipeline_tests.ScenePipelineTests.digest
    save = pipeline_tests.ScenePipelineTests.save
    run_action = pipeline_tests.ScenePipelineTests.run_action

    def setUp(self):
        pipeline_tests.ScenePipelineTests.setUp(self)
        for name in ('SOURCES.md', 'message.md', 'mythe.md', 'production-brief.md'):
            (self.root / name).write_text('Reviewed test fixture, not a real editorial verdict.')
        self.run_action('prepare')
        self.run_action('render')
        self.review = self.out / 'release-review.json'
        self.final = self.root / 'video/release-01'

    def approve(self):
        value = json.loads(self.review.read_text())
        value.update(reviewer='Fixture reviewer', approval_reference='Test-only explicit approval',
                     output_license='Test fixture permission', intended_release='excerpt')
        for check in value['checks'].values():
            check.update(status='pass', evidence='Test fixture evidence')
        for asset in value['assets'].values():
            asset.update(status='pass', evidence='Test fixture identity and permission')
        self.review.write_text(json.dumps(value))

    def finalize(self):
        return execute('finalize', self.root, self.path, self.lock, self.final, review_path=self.review)

    def test_pending_and_stale_reviews_cannot_create_a_master(self):
        with self.assertRaisesRegex(ValueError, 'review|Review'): self.finalize()
        self.approve()
        data = json.loads(self.review.read_text())
        data['proof']['sha256'] = '0' * 64
        self.review.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'proof'): self.finalize()
        self.assertFalse(self.final.exists())

    def test_missing_asset_review_or_voice_rights_fails_closed(self):
        self.approve()
        original = json.loads(self.review.read_text())
        missing_voice = copy.deepcopy(original)
        missing_voice['checks']['voice_rights']['status'] = 'pending'
        missing_asset = copy.deepcopy(original)
        missing_asset['assets'].pop(next(iter(missing_asset['assets'])))
        for value in (missing_voice, missing_asset):
            self.review.write_text(json.dumps(value))
            with self.assertRaises(ValueError): self.finalize()
        self.assertFalse(self.final.exists())

    def test_clean_master_keeps_composition_audio_credits_and_proof(self):
        self.approve()
        proof = self.out / 'video-scenes-epreuve.mp4'
        before = proof.read_bytes()
        result = self.finalize()
        self.assertFalse(result['proof_only'])
        self.assertTrue(result['ready_to_publish'])
        self.assertTrue(result['video']['full_decode'])
        for name in ('video.mp4', 'captions.srt', 'CREDITS.md', 'delivery.json', 'release-review.json'):
            self.assertTrue((self.final / name).is_file(), name)
        self.assertIn('Hello world.', (self.final / 'captions.srt').read_text())
        self.assertIn('Test fixture permission', (self.final / 'CREDITS.md').read_text())
        self.assertEqual(before, proof.read_bytes())
        def pcm_hash(path):
            pcm = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path),
                                           '-map', '0:a:0', '-f', 's16le', '-'])
            return hashlib.sha256(pcm).hexdigest()
        self.assertEqual(pcm_hash(proof), pcm_hash(self.final / 'video.mp4'))
        renderer = SceneRenderer(self.plan, self.root, [], proof=False)
        clean = renderer.render(.5)
        proof_frame = SceneRenderer(self.plan, self.root, []).render(.5)
        self.assertNotEqual(clean.tobytes(), proof_frame.tobytes())
        self.assertEqual(clean.crop((0, 380, 1080, 1920)).tobytes(),
                         proof_frame.crop((0, 380, 1080, 1920)).tobytes())
        with self.assertRaisesRegex(ValueError, 'exists'): self.finalize()

    def test_failed_encoding_leaves_no_publishable_folder(self):
        self.approve()
        with patch('ethni_scene_release.encode', side_effect=RuntimeError('Encoder failed')):
            with self.assertRaises(RuntimeError): self.finalize()
        self.assertFalse(self.final.exists())
        self.assertEqual(list(self.final.parent.glob('.release-*')), [])

    def test_wrong_scope_and_missing_review_documents_fail(self):
        self.approve()
        original = self.review.read_text()
        value = json.loads(original)
        value['intended_release'] = 'complete'
        self.review.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, 'coverage'): self.finalize()
        self.review.write_text(original)
        (self.root / 'message.md').unlink()
        with self.assertRaisesRegex(ValueError, 'changed'): self.finalize()
        self.assertFalse(self.final.exists())

    def test_changed_input_and_review_cannot_be_bypassed(self):
        self.approve()
        (self.root / 'SOURCES.md').write_text('Changed facts')
        with self.assertRaisesRegex(ValueError, 'changed'): self.finalize()
        self.assertFalse(self.final.exists())


if __name__ == '__main__':
    unittest.main()
