"""Archive excerpts on the film's timeline.

Narration defines the film, so an excerpt is *inserted* into it: at a caption boundary the voice stops,
an authored silence lets the room settle, the excerpt plays alone, and the voice resumes. Nothing ever
speaks over an excerpt — the featured sound is heard, not buried. Authors give a position in narration
time; this module derives the master timeline (where every block, word and caption lands in the film)
so no one computes it by hand and a re-timed narration cannot leave an excerpt stranded.
"""
import json
import math
from pathlib import Path
import shutil
import subprocess
import tempfile
import weakref

from PIL import Image

from ethni_scene_plan import asset_path, keys, number, require, text

FPS = 25
# Below half a second an excerpt is a blip, not something a listener can attend to.
MIN_EXCERPT_S, MAX_SILENCE_S, MAX_GAIN_DB = .5, 3.0, 12.0
BED_GAIN_RANGE, DUCK_RANGE = (-60, 0), (-30, 0)
INSERTION_FIELDS = "id at asset in out silence_before silence_after gain_db"
BED_FIELDS = "asset in gain_db duck_db"


def probe(path):
    """What the file really holds; the plan never declares a duration it could get wrong."""
    data = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,duration",
         "-of", "json", str(path)], check=True, capture_output=True, text=True).stdout)
    kinds = {stream["codec_type"] for stream in data["streams"]}
    return {"duration": float(data["format"]["duration"]), "has_audio": "audio" in kinds, "has_video": "video" in kinds}


def clip_asset(plan, key, where):
    asset = plan["assets"].get(key)
    require(asset is not None and asset["kind"] == "clip", f"{where}: a clip asset is required")
    return asset


def validate_insertion(root, plan, item, narration_end, previous_at):
    keys(item, INSERTION_FIELDS, "insertion")
    text(item.get("id"), "insertion.id")
    at = number(item.get("at"), "insertion.at", 0, narration_end)
    require(at > previous_at, "Insertions must be in order of increasing narration position")
    asset = clip_asset(plan, item.get("asset"), f"insertion {item['id']}")
    start = number(item.get("in"), "insertion.in", 0)
    end = number(item.get("out"), "insertion.out", 0)
    require(end-start >= MIN_EXCERPT_S, f"insertion {item['id']}: an excerpt needs at least {MIN_EXCERPT_S} s")
    media = probe(asset_path(root, asset))
    require(end <= media["duration"]+.001, f"insertion {item['id']}: out exceeds the source duration {media['duration']:.3f} s")
    require(media["has_audio"], f"insertion {item['id']}: the clip has no audio track")
    number(item.get("silence_before", 0), "insertion.silence_before", 0, MAX_SILENCE_S)
    number(item.get("silence_after", 0), "insertion.silence_after", 0, MAX_SILENCE_S)
    number(item.get("gain_db", 0), "insertion.gain_db", -MAX_GAIN_DB, MAX_GAIN_DB)
    return at, media


def arrange(root, plan, prepared):
    """Master timeline for a plan with insertions and/or a bed; retimes words and captions in place."""
    items = plan.get("insertions", [])
    require(isinstance(items, list), "insertions must be a list")
    narration_end = prepared["duration"]
    windows, shift, previous_at, ids = [], 0.0, -1.0, set()
    shifts = []
    for item in items:
        at, media = validate_insertion(root, plan, item, narration_end, previous_at)
        require(item["id"] not in ids, "Insertion ids must be unique")
        ids.add(item["id"])
        require(not any(c["debut"] < at < c["fin"] for c in prepared["captions"]),
                f"insertion {item['id']}: position {at} splits a caption; use a caption boundary")
        before, after = item.get("silence_before", 0), item.get("silence_after", 0)
        length = item["out"]-item["in"]
        start = at+shift
        windows.append({"id": item["id"], "asset": item["asset"], "in": item["in"], "out": item["out"],
                        "at": at, "start": start, "clip_start": start+before, "clip_end": start+before+length,
                        "end": start+before+length+after, "gain_db": item.get("gain_db", 0),
                        "silence_before": before, "silence_after": after, "has_video": media["has_video"]})
        shifts.append((at, before+length+after))
        shift += before+length+after
        previous_at = at

    def later(moment):
        return moment+sum(block for at, block in shifts if at <= moment+1e-9)

    prepared["words"] = [dict(w, start=later(w["start"]), end=later(w["start"])+(w["end"]-w["start"]))
                         for w in prepared["words"]]
    prepared["captions"] = [dict(c, debut=later(c["debut"]), fin=later(c["debut"])+(c["fin"]-c["debut"]))
                            for c in prepared["captions"]]
    prepared["duration"] = round(narration_end+shift, 6)
    bed = plan.get("bed")
    if bed is not None:
        keys(bed, BED_FIELDS, "bed")
        asset = clip_asset(plan, bed.get("asset"), "bed")
        start = number(bed.get("in", 0), "bed.in", 0)
        number(bed.get("gain_db"), "bed.gain_db", *BED_GAIN_RANGE)
        number(bed.get("duck_db", 0), "bed.duck_db", *DUCK_RANGE)
        media = probe(asset_path(root, asset))
        require(media["has_audio"], "The bed clip has no audio track")
        require(start+prepared["duration"] <= media["duration"]+.001,
                "The bed is shorter than the film from its start point; it is never looped or padded")
    prepared["timeline"] = {"duration": prepared["duration"], "narration_duration": narration_end,
                            "windows": windows, "bed": bed}
    return prepared


def window_for(timeline, insertion_id):
    return next((w for w in (timeline or {}).get("windows", []) if w["id"] == insertion_id), None)


class ClipFrames:
    """Decoded pictures of video insertions, cached on disk so a long excerpt never fills memory."""

    def __init__(self, root, plan, timeline):
        self.root, self.plan, self.timeline = Path(root), plan, timeline
        self.cache = tempfile.mkdtemp(prefix=".clipframes-")
        weakref.finalize(self, shutil.rmtree, self.cache, True)
        self.counts = {}

    def _extract(self, window):
        target = Path(self.cache)/window["id"]
        target.mkdir()
        source = asset_path(self.root, self.plan["assets"][window["asset"]])
        count = math.ceil((window["out"]-window["in"])*FPS-1e-7)
        subprocess.run(["ffmpeg", "-v", "error", "-ss", str(window["in"]), "-t", str(window["out"]-window["in"]),
                        "-i", str(source), "-an", "-vf", f"fps={FPS}", "-frames:v", str(count),
                        str(target/"%05d.png")], check=True)
        self.counts[window["id"]] = len(list(target.glob("*.png")))
        require(self.counts[window["id"]] > 0, f"insertion {window['id']}: no picture could be decoded")

    def frame(self, window, instant):
        """The excerpt's picture at a film instant; the first and last frames hold through the silences."""
        if window["id"] not in self.counts:
            self._extract(window)
        local = min(window["out"]-window["in"], max(0, instant-window["clip_start"]))
        index = min(self.counts[window["id"]]-1, int(local*FPS+1e-6))
        with Image.open(Path(self.cache)/window["id"]/f"{index+1:05d}.png") as picture:
            return picture.convert("RGB")
