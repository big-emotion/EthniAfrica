"""Validate, preview and render a declarative scene plan through the montage CLI."""
import hashlib
import json
import math
from pathlib import Path
import platform
import subprocess
import tempfile

import PIL

from ethni_paths import assert_writable
from ethni_scene_audio import prepare_source, digest
from ethni_scene_plan import validate_plan, require
from ethni_scene_render import SceneRenderer


def encode(renderer, audio, cuts, target):
    """Atomically deliver a constant-frame-rate video; clean all scratch on failure."""
    fps = 25
    count = math.ceil(renderer.duration*fps-1e-7)
    with tempfile.TemporaryDirectory(prefix=".scenes-", dir=target.parent) as scratch:
        scratch = Path(scratch)
        excerpt = scratch / "voice.wav"
        filters = [f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]" for i, (a, b) in enumerate(cuts)]
        filters.append("".join(f"[a{i}]" for i in range(len(cuts))) + f"concat=n={len(cuts)}:v=0:a=1[out]")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(audio), "-filter_complex", ";".join(filters),
                        "-map", "[out]", str(excerpt)], check=True)
        temporary_video = scratch / "video.mp4"
        cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "1080x1920",
               "-r", str(fps), "-i", "pipe:0", "-i", str(excerpt), "-map", "0:v", "-map", "1:a",
               "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "192k", "-af", "apad", "-t", str(count/fps),
               "-movflags", "+faststart", str(temporary_video)]
        with (scratch / "encode.log").open("w+") as errors:
            process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=errors)
            try:
                for frame in range(count):
                    process.stdin.write(renderer.render(frame/fps).tobytes())
                    if frame % (fps*5) == 0:
                        print(f"Scene render: {frame/fps:.0f}/{renderer.duration:.1f}s", flush=True)
                process.stdin.close()
                if process.wait() != 0:
                    errors.seek(0)
                    raise RuntimeError(errors.read())
            except BrokenPipeError as error:
                process.wait()
                errors.seek(0)
                raise RuntimeError(f"Video encoder failed: {errors.read()}") from error
            finally:
                if process.poll() is None:
                    process.kill()
                    process.wait()
                if not process.stdin.closed: process.stdin.close()
        temporary_video.replace(target)
    return count


def run(project, plan_path, reduced_motion=False, validate_only=False, previews_only=False):
    plan_path = Path(plan_path).resolve()
    plan = json.loads(plan_path.read_text())
    output = assert_writable(Path(plan["output_dir"]).expanduser().resolve())
    require("_epreuves" in output.parts, "Scene exports currently require an _epreuves directory")
    source = prepare_source(project, plan["source"])
    validate_plan(plan, plan_path.parent, source["duration"])
    renderer = SceneRenderer(plan, plan_path.parent, source["captions"], reduced_motion)
    instants = renderer.preflight()
    print(f"Validated {len(plan['scenes'])} scenes, {source['duration']:.2f}s, {len(instants)} visual checks", flush=True)
    if validate_only:
        return None
    output.mkdir(parents=True, exist_ok=True)
    suffix = "-controle" if reduced_motion else ""
    preview_rows = []
    for index, scene in enumerate(plan["scenes"]):
        instant = (scene["start"]+scene["end"])/2
        frame = renderer.render(instant)
        name = f"scene-{index+1:02d}{suffix}.png"
        frame.save(output/name)
        phone = frame.resize((360, 640))
        phone.save(output/f"mobile-{index+1:02d}{suffix}.png")
        preview_rows.append(f"| {index+1} | {scene['type']} | {scene['start']:.2f}–{scene['end']:.2f} | {scene['purpose']} | {name} |")
    frames = None
    target = output/f"video-scenes{suffix}-epreuve.mp4"
    if not previews_only:
        frames = encode(renderer, source["audio"], plan["source"]["cuts"], target)
    (output/"narration-excerpt.fr.txt").write_text(source["narration"]+"\n")
    (output/"captions.json").write_text(json.dumps(source["captions"], ensure_ascii=False, indent=2)+"\n")
    audit = "# Scene proof review\n\nNot approved for publication. New visuals require editorial and operator review.\n\n"
    audit += "| Scene | Type | Seconds | Purpose | Preview |\n| --- | --- | --- | --- | --- |\n" + "\n".join(preview_rows)
    audit += "\n\n## Sources\n\n" + "\n".join(f"- {key}: {v['citation']} — {v['url']} ({v['tier']})" for key,v in plan["sources"].items())
    audit += "\n\nFrame order is deterministic for pinned inputs and runtime. Human listening and visual approval remain necessary.\n"
    (output/"REVIEW.md").write_text(audit)
    report = {"version": 1, "proof_only": True, "profile": plan["profile"], "coverage": plan.get("coverage", "excerpt"),
              "rendered_video": not previews_only, "frames": frames, "fps": 25, "dimensions": [1080, 1920],
              "audio_duration": source["duration"], "video_duration": frames/25 if frames else None,
              "plan_sha256": digest(plan_path), "source": plan["source"], "assets": plan["assets"],
              "alignment_sha256": digest(project/"work/aligned-words.json"),
              "python": platform.python_version(), "pillow": PIL.__version__,
              "ffmpeg": subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, check=True).stdout.splitlines()[0],
              "paid_api_calls": 0, "preflight_frames": instants,
              "open_gates": ["Editorial review of the new composition", "Human listening and visual approval",
                             "Publication license compatibility", "Historical source interpretation"],
              "preview_frame_sha256": hashlib.sha256(renderer.render(instants[0]).tobytes()).hexdigest()}
    harness = Path(__file__).resolve().parent
    tracked_inputs = list(harness.glob("ethni_scene*.py")) + [harness/"ethni_map.py", harness/"ethni_type.py",
                      harness/"ethni_tokens.py", harness/"ethni_soustitre.py"] + list((harness/"fonts").glob("*.ttf"))
    report["renderer_inputs"] = {str(path.relative_to(harness)): digest(path) for path in sorted(tracked_inputs)}
    (output/f"render-report{suffix}.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n")
    print(output if previews_only else target, flush=True)
    return output if previews_only else target
