"""Reviewed clean delivery, independent from carousel gates and publication APIs."""
import json
from pathlib import Path
import tempfile

from ethni_scene_audio import digest
from ethni_scene_outro import total_seconds
from ethni_scene_plan import require, text
from ethni_scene_render import SceneRenderer
from ethni_scenes import encode

CHECKS = ('visual', 'listening', 'history', 'message', 'myth', 'voice_rights', 'license_compatibility', 'closing')
DOCUMENTS = ('production-brief.md', 'SOURCES.md', 'message.md', 'mythe.md')


def review_template(project, plan, lock, proof):
    pending = lambda: {'status': 'pending', 'evidence': ''}
    return {'version': 1, 'lock_sha256': digest(lock),
            'proof': {'path': str(proof.relative_to(project)), 'sha256': digest(proof)},
            'reviewer': '', 'approval_reference': '', 'intended_release': plan.get('coverage', 'excerpt'),
            'output_license': '', 'checks': {name: pending() for name in CHECKS},
            'assets': {key: dict(pending(), license=asset['license'], credit=asset['credit'])
                       for key, asset in plan['assets'].items()}}


def validate_review(project, plan, lock, review):
    require(review.get('version') == 1, 'Unsupported release review version')
    require(review.get('lock_sha256') == digest(lock), 'Release review refers to a different handoff')
    entry = review.get('proof', {})
    path = Path(entry.get('path', ''))
    proof = (project/path).resolve()
    require(not path.is_absolute() and proof.is_relative_to(project) and '_epreuves' in proof.parts
            and proof.is_file(), 'Review requires the project proof')
    require(digest(proof) == entry.get('sha256'), 'Reviewed proof changed')
    report = json.loads((proof.parent/'execution-report.json').read_text())
    require(report.get('lock_sha256') == digest(lock) and report.get('proof_only') is True
            and report.get('video', {}).get('sha256') == digest(proof), 'Proof report does not match reviewed handoff')
    for name in DOCUMENTS:
        require((project/name).is_file() and (project/name).read_text().strip(), f'Missing release review document: {name}')
    for field in ('reviewer', 'approval_reference', 'output_license'):
        text(review.get(field), f'Release review {field}')
    require(review.get('intended_release') == plan.get('coverage', 'excerpt'), 'Review must approve the actual release coverage')
    checks = review.get('checks', {})
    require(set(checks) == set(CHECKS), 'Release review must include all checks')
    for name, check in checks.items():
        require(check.get('status') == 'pass', f'Release review pending or failed: {name}')
        text(check.get('evidence'), f'Release review evidence: {name}')
    assets = review.get('assets', {})
    require(set(assets) == set(plan['assets']), 'Release review must cover every asset')
    for key, asset in assets.items():
        expected = plan['assets'][key]
        require(asset.get('status') == 'pass' and asset.get('license') == expected['license']
                and asset.get('credit') == expected['credit'], f'Unreviewed or changed asset: {key}')
        text(asset.get('evidence'), f'Asset identity and rights review: {key}')
    return proof


def subtitles(captions):
    def stamp(seconds):
        ms = round(seconds*1000)
        hours, ms = divmod(ms, 3600000)
        minutes, ms = divmod(ms, 60000)
        seconds, ms = divmod(ms, 1000)
        return f'{hours:02}:{minutes:02}:{seconds:02},{ms:03}'
    return '\n\n'.join(f"{i}\n{stamp(c['debut'])} --> {stamp(c['fin'])}\n{c['texte']}"
                       for i, c in enumerate(captions, 1))+'\n'


def deliver(project, plan, lock, review_path, output, source, check_video, unchanged):
    require(review_path is not None, 'Finalization needs a release review')
    review_path = Path(review_path).resolve()
    review_bytes = review_path.read_bytes()
    review = json.loads(review_bytes)
    proof = validate_review(project, plan, lock, review)
    require(not output.exists(), 'Delivery folder already exists; choose a new version')
    require('_epreuves' not in output.parts, 'A final delivery must be outside _epreuves')
    renderer = SceneRenderer(plan, project, source['captions'], proof=False)
    renderer.preflight()
    output.parent.mkdir(parents=True, exist_ok=True)
    # Nothing is exposed as a final delivery until all checks pass.
    with tempfile.TemporaryDirectory(prefix='.release-', dir=output.parent) as temporary:
        stage = Path(temporary)/'delivery'
        stage.mkdir()
        video = stage/'video.mp4'
        encode(renderer, source['audio'], plan['source']['cuts'], video)
        result = {'version': 1, 'action': 'finalize', 'proof_only': False, 'ready_to_publish': True,
                  'published': False, 'paid_api_calls': 0, 'coverage': plan.get('coverage', 'excerpt'),
                  'lock_sha256': digest(lock), 'review_sha256': digest(review_path),
                  'video': check_video(video, total_seconds(plan, source['captions'], source['duration']))}
        require(review_path.read_bytes() == review_bytes, 'Review changed during export')
        validate_review(project, plan, lock, review)
        require(unchanged(), 'Inputs changed during final export')
        (stage/'captions.srt').write_text(subtitles(source['captions']))
        (stage/'narration.fr.txt').write_text(source['narration']+'\n')
        rows = ['# Publication credits', '', f"Output licence: {review['output_license']}", '',
                'Licence compatibility and voice rights are reviewer attestations, not an automatic legal verdict.', '',
                '## Assets', '']
        for key, asset in plan['assets'].items():
            rows.append(f"- {key}: {asset['credit']} — {asset['license']} — {plan['sources'][asset['source']]['url']}")
        rows += ['', '## Sources', '']
        rows += [f"- {s['citation']} — {s['url']} ({s['tier']})" for s in plan['sources'].values()]
        rows += ['', '## Voice rights', '', review['checks']['voice_rights']['evidence'], '',
                 '## Release scope', '', review['intended_release'], '', '## Review', '',
                 f"{review['reviewer']}: {review['approval_reference']}"]
        (stage/'CREDITS.md').write_text('\n'.join(rows)+'\n')
        (stage/'release-review.json').write_bytes(review_bytes)
        renderer.render(renderer.duration/2).resize((360, 640)).save(stage/'mobile-preview.png')
        result['files'] = {p.name: digest(p) for p in sorted(stage.iterdir())}
        (stage/'delivery.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
        require(not output.exists(), 'Delivery folder already exists')
        stage.rename(output)
    return result
