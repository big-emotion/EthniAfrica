"""Render a map prototype using excerpts of an already approved narration.

Invoked through ethni_montage.py <subject> --map-proof <storyboard.json>.
No network calls, voice generation, publication or production-ledger mutations.
"""
import hashlib
import json
import math
import pathlib
import subprocess
import tempfile

from ethni_map import MapProof, excerpt_words
from ethni_paths import assert_writable
import ethni_soustitre as subtitles


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render_proof(project, storyboard_path, reduced_motion=False):
    storyboard_path = pathlib.Path(storyboard_path).resolve()
    config = json.loads(storyboard_path.read_text())
    script = project / "narration.fr.txt"
    approval = project / "post.md"
    if "**Texte validé** : oui" not in approval.read_text():
        raise ValueError("The source narration needs operator approval")
    for source in (script, project / "cards.json", project / "cartes.json"):
        if source.stat().st_mtime > approval.stat().st_mtime:
            raise ValueError("The source text changed after operator approval")
    if digest(script) != config["source_script_sha256"]:
        raise ValueError("The storyboard no longer matches the approved source script")
    audio = project / "work/narration.wav"
    if digest(audio) != config["source_audio_sha256"]:
        raise ValueError("The audio changed: verify excerpt timing before rendering")
    words = json.loads((project / "work/aligned-words.json").read_text())
    # Reuse the existing alignment guard without introducing another tokeniser.
    from ethni_montage import alignement_a_jour
    error = alignement_a_jour(project, script.read_text())
    if error:
        raise ValueError(error)
    selected = excerpt_words(words, config["cuts"])
    blocks = script.read_text().strip().split("\n\n")
    narration = "\n\n".join(blocks[i] for i in config["paragraphs"])
    letters = lambda value: "".join(c for c in value.lower() if c.isalnum())
    if letters(narration) != letters("".join(w["word"] for w in selected)):
        raise ValueError("Audio cuts do not contain exactly the selected approved paragraphs")
    captions = subtitles.minuter(subtitles.segmenter(narration), selected)
    duration = sum(end - start for start, end in config["cuts"])
    config["duration"] = duration
    geometry = json.loads((storyboard_path.parent / config["geometry"]).read_text())
    renderer = MapProof(config, geometry, captions)
    output = assert_writable(pathlib.Path(config["output_dir"]).resolve())
    if "_epreuves" not in output.parts:
        raise ValueError("A map prototype must be delivered under _epreuves")
    output.mkdir(parents=True, exist_ok=True)
    suffix = "-controle" if reduced_motion else ""
    target = output / f"carte-animee{suffix}-epreuve.mp4"
    fps = 25
    count = math.ceil(duration * fps)
    with tempfile.TemporaryDirectory(prefix=".map-render-", dir=output) as scratch:
        scratch = pathlib.Path(scratch)
        excerpt = scratch / "narration.wav"
        parts = [f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{i}]"
                 for i, (start, end) in enumerate(config["cuts"])]
        parts.append("".join(f"[a{i}]" for i in range(len(config["cuts"]))) +
                     f"concat=n={len(config['cuts'])}:v=0:a=1[out]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(audio),
                        "-filter_complex", ";".join(parts), "-map", "[out]", str(excerpt)], check=True)
        temporary_video = scratch / "proof.mp4"
        cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
               "-s", f"{renderer.width}x{renderer.height}", "-r", str(fps), "-i", "pipe:0",
               "-i", str(excerpt), "-map", "0:v", "-map", "1:a", "-c:v", "libx264",
               "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac",
               "-b:a", "192k", "-af", "apad", "-t", str(count/fps),
               "-movflags", "+faststart", str(temporary_video)]
        with (scratch / "ffmpeg.log").open("w+") as errors:
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=errors)
            try:
                for frame in range(count):
                    image = renderer.render(frame / fps, reduced_motion)
                    process.stdin.write(image.tobytes())
                    if frame % (fps * 5) == 0:
                        print(f"Map proof: {frame/fps:.0f}/{duration:.1f}s", flush=True)
                process.stdin.close()
                if process.wait() != 0:
                    errors.seek(0)
                    raise RuntimeError(errors.read())
            except BaseException:
                process.kill()
                process.wait()
                raise
        temporary_video.replace(target)
    for instant in (0, 6, 15, min(25, duration-1)):
        renderer.render(instant, reduced_motion).save(output / f"preview{suffix}-{instant:02.0f}s.png")
    (output / "narration-excerpt.fr.txt").write_text(narration + "\n")
    (output / "captions.json").write_text(json.dumps(captions, ensure_ascii=False, indent=2))
    (output / "render-report.json").write_text(json.dumps({
        "duration_seconds": count/fps, "dimensions": [renderer.width, renderer.height],
        "fps": fps, "source_script_sha256": config["source_script_sha256"],
        "source_audio_sha256": config["source_audio_sha256"], "cuts": config["cuts"],
        "paid_api_calls": 0, "proof_only": True,
        "limitations": ["Excerpt, not a complete historical narrative", "Contemporary borders are locators only",
                        "No historical boundary or migration route inferred", "Experimental map composition"],
    }, indent=2) + "\n")
    print(target, flush=True)
    return target
