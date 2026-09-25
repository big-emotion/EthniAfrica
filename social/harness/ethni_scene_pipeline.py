"""Prepare and replay a private, fingerprinted scene package without creative edits."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import platform
import subprocess

from ethni_paths import assert_writable, resolve_project
from ethni_scene_audio import digest, prepare_source
from ethni_scene_plan import asset_path, require, validate_plan
from ethni_scene_render import SceneRenderer
from ethni_scenes import run
import ethni_tokens as tokens


def hashed_json(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def identity(project, plan):
    """Ignore delivery paths; retain every input that can change pixels or speech."""
    harness = Path(__file__).resolve().parent
    repo = harness.parents[1]
    files = sorted(set(harness.glob('ethni_*.py')) | set((harness/'fonts').glob('*.ttf')) |
                   set((tokens.GABARITS/'tokens').glob('*.css')) | {tokens.SPEC, harness/'requirements.txt'})
    inputs = ['narration.fr.txt', 'post.md', 'work/narration.wav', 'work/aligned-words.json',
              'production-brief.md', 'SOURCES.md', 'message.md', 'mythe.md']
    return {
        'plan': hashed_json({key: value for key, value in plan.items() if key != 'output_dir'}),
        'inputs': {name: digest(project/name) if (project/name).exists() else None for name in inputs},
        'assets': {key: digest(asset_path(project, asset)) for key, asset in plan['assets'].items()},
        'renderer': {str(path.relative_to(repo)): digest(path) for path in files},
        'runtime': {'python': platform.python_version(), 'platform': platform.platform(),
                    'pillow': importlib.metadata.version('Pillow'), 'numpy': importlib.metadata.version('numpy'),
                    'ffmpeg': subprocess.check_output(['ffmpeg', '-version'], text=True).strip()},
    }


def check_video(path, duration):
    data = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(path)]))
    video = next((s for s in data['streams'] if s['codec_type'] == 'video'), {})
    audio = next((s for s in data['streams'] if s['codec_type'] == 'audio'), {})
    require(video.get('codec_name') == 'h264' and audio.get('codec_name') == 'aac', 'Expected H.264 video and AAC audio')
    require([video.get('width'), video.get('height')] == [1080, 1920], 'Unexpected video dimensions')
    require(video.get('r_frame_rate') == '25/1', 'Expected 25 fps')
    require(abs(float(video['duration'])-duration) <= .041, 'Video duration differs from the approved excerpt')
    require(abs(float(audio['duration'])-float(video['duration'])) <= .05, 'Audio duration differs from video')
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-f', 'null', '-'], check=True)
    return {'frames': int(video['nb_frames']), 'dimensions': [1080, 1920],
            'duration': float(video['duration']), 'full_decode': True, 'sha256': digest(path)}


def execute(action, project, plan_path, lock_path, output, review_path=None):
    require(action in ('prepare', 'verify', 'render', 'finalize'), 'Unknown pipeline action')
    project, plan_path = Path(project).resolve(), Path(plan_path).resolve()
    lock_path, output = assert_writable(Path(lock_path).resolve()), assert_writable(Path(output).resolve())
    require(plan_path.parent == project, 'Keep the plan at the project root with its relative assets')
    if action != 'finalize':
        require('_epreuves' in output.parts and output.is_relative_to(project),
                'Output must be a private _epreuves destination inside the project')
    plan = json.loads(plan_path.read_text())
    source = prepare_source(project, plan['source'])
    validate_plan(plan, project, source['duration'])
    current = identity(project, plan)
    expected = json.loads(lock_path.read_text()) if lock_path.exists() else None
    if expected is not None:
        require(expected.get('version') == 1, 'Unsupported handoff version')
        require(expected.get('identity') == current,
                'Handoff inputs or runtime changed; review the difference and prepare a new named lock')
    elif action != 'prepare':
        raise ValueError('Missing handoff lock; prepare the reviewed package first')
    renderer = SceneRenderer(plan, project, source['captions'])
    instants = renderer.preflight()
    frames = [{'at': instant, 'sha256': hashlib.sha256(renderer.render(instant).tobytes()).hexdigest()}
              for instant in instants]
    if expected:
        require(expected.get('frames') == frames, 'Sample frames changed since handoff preparation')
    result = {'version': 1, 'action': action, 'sample_frames_match': expected is not None,
              'sample_count': len(frames), 'proof_only': True, 'paid_api_calls': 0}
    if action == 'prepare':
        previews = output/'handoff-previews'
        previews.mkdir(parents=True, exist_ok=True)
        rows = ['# Handoff cue previews', '', 'Inspect at phone size. This technical baseline is not editorial or publication approval.', '']
        for index, frame in enumerate(frames):
            name = f'cue-{index:03d}.png'
            renderer.render(frame['at']).resize((360, 640)).save(previews/name)
            rows.extend([f"## {frame['at']:.3f} seconds", '', f'![Cue preview]({name})', ''])
        (previews/'index.md').write_text('\n'.join(rows)+'\n')
        require(identity(project, json.loads(plan_path.read_text())) == current, 'Inputs changed during preparation')
        if expected is None:
            lock_path.parent.mkdir(parents=True, exist_ok=True)
            with lock_path.open('x') as target:
                json.dump({'version': 1, 'identity': current, 'frames': frames}, target, ensure_ascii=False, indent=2)
                target.write('\n')
    elif action == 'finalize':
        from ethni_scene_release import deliver
        return deliver(project, plan, lock_path, review_path, output, source, check_video,
                       lambda: identity(project, json.loads(plan_path.read_text())) == current)
    elif action == 'render':
        folder = run(project, plan_path, output_dir=output)
        result['video'] = check_video(folder, source['duration'])
        latest_plan = json.loads(plan_path.read_text())
        require(identity(project, latest_plan) == current, 'Inputs changed during export; review the proof before reuse')
        result['lock_sha256'] = digest(lock_path)
        from ethni_scene_release import review_template
        review = output/'release-review.json'
        if not review.exists():
            review.write_text(json.dumps(review_template(project, plan, lock_path, folder), indent=2)+'\n')
        (output/'execution-report.json').write_text(json.dumps(result, indent=2)+'\n')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['prepare', 'verify', 'render', 'finalize'])
    parser.add_argument('project')
    parser.add_argument('--plan', required=True, type=Path)
    parser.add_argument('--lock', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--review', type=Path)
    args = parser.parse_args()
    try:
        result = execute(args.action, resolve_project(args.project), args.plan, args.lock, args.output, args.review)
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Scene pipeline stopped: {error}\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
