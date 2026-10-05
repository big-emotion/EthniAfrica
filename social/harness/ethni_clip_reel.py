"""Cut a third-party video into a captioned vertical reel, and draw its cover.

    python ethni_clip_reel.py validate plan.json
    python ethni_clip_reel.py reel plan.json out.mp4
    python ethni_clip_reel.py thumbnail plan.json out.png

**The plan is the contract.** Whoever chooses the passages — an operator, or the
`ethniafrica-clip-reel` skill — writes a JSON plan; this module checks it and draws
it, and decides nothing editorial. Every rule below exists because the first cut of
this format got it wrong once:

- a caption is **two to four words**, coloured by who speaks. A paragraph under a
  reel is unreadable at phone size, and a one-word orphan flashes by like a glitch;
- a phrase never straddles a cut — its output time would be a lie;
- a source that is a screen recording shows a player's chrome for a while: a
  `reframes` window keeps only the rectangle that is the picture, for that stretch
  of source time, instead of dropping the words spoken under the chrome;
- a plan may carry a `banner`: one complete sentence above the picture for its first
  `duration` seconds — the claim a debate is about, never chunked like a caption;
- a plan may carry a `credit_line`, drawn under the frame for the whole piece. A
  credit is information the operator may only partly have, so it never refuses;
- speakers 0 and 1 are the two people exchanging; speaker 2 is a **host** (a moderator,
  an announcer) in a neutral ink, so that their line is captioned without being
  attributed to either side;
- a cover title is **eight words at most and its last words carry the accent**
  (GABARITS-SOCIAL §1 ter): the punchline is the ending, and the copy yields when
  it does not fit, the type never shrinks.

Pure logic (chunking, timeline, validation, schedule) needs no imaging library, so
it is testable anywhere; drawing imports Pillow lazily. ffmpeg has neither the
`subtitles` nor the `drawtext` filter on every install, so captions are PNG bands
laid over the video, not filters.
"""
import json
import math
import pathlib
import re
import subprocess
import sys
import tempfile

HARNESS = pathlib.Path(__file__).resolve().parent
NBSP = " "
TOLERANCE = 0.01          # seconds — a phrase ending on a clip's last frame still belongs to it
MAX_CAPTION_WORDS = 4
MAX_TITLE_WORDS = 8
WIDTH, HEIGHT = 1080, 1920
FRAME_BOX_HEIGHT = 640    # the source frame is contained in 1080 x 640, centred at y = 640
FRAME_CENTRE_Y = 640
CAPTION_BAND_Y = 1150
CAPTION_BAND_HEIGHT = 300
WATERMARK_Y = 1620
BANNER_Y = 70             # the banner sits in the blurred ground above the frame box (which starts at y = 320)
BANNER_HEIGHT = 240
BANNER_FONT_PX = 50
BANNER_LINE_PX = 60
CREDIT_Y = 975            # the credit sits just under the frame box (which ends at y = 960), like a TV synthé
CREDIT_HEIGHT = 110
CREDIT_FONT_PX = 36
CREDIT_LINE_PX = 46
FPS = 30
HOST = 2


# ---------------------------------------------------------------- captions

def speaker_ink(speaker):
    """White for speaker 0, project gold for 1, neutral grey for the host (2)."""
    import ethni_brand
    return {0: (255, 255, 255), 1: ethni_brand.GOLD_INK, HOST: (176, 176, 176)}[speaker]


def chunk_words(text, max_words=MAX_CAPTION_WORDS):
    """Split a translated phrase into balanced captions of at most `max_words`.

    French puts a space inside « guillemets » and before ? ! : ; — a naive split on
    spaces would strand « or ? at the edge of a caption, so those spaces are made
    non-breaking first. Chunks are balanced (5 words give 3 + 2, never 4 + 1).
    """
    text = re.sub(r"«[ \t]+", "«" + NBSP, text.strip())
    text = re.sub(r"[ \t]+(»|[?!:;])", NBSP + r"\1", text)
    words = re.split(r"[ \t]+", text)
    n = len(words)
    parts = max(1, math.ceil(n / max_words))
    base, extra = divmod(n, parts)
    chunks, i = [], 0
    for j in range(parts):
        size = base + (1 if j < extra else 0)
        chunks.append(" ".join(words[i:i + size]))
        i += size
    return chunks


def caption_schedule(plan):
    """Every caption with its output-timeline window and speaker.

    A phrase's time is shared between its chunks by character count: the words of a
    long chunk take longer to say. It is an approximation of where each word falls,
    good enough to read by, and it never leaves a gap inside a phrase.
    """
    timeline = Timeline(plan["clips"])
    schedule = []
    for phrase in plan["phrases"]:
        start, end = timeline.to_out(phrase["start"]), timeline.to_out(phrase["end"])
        chunks = chunk_words(phrase["fr"])
        weight = sum(len(c) for c in chunks)
        cursor = start
        for index, chunk in enumerate(chunks):
            last = index == len(chunks) - 1
            stop = end if last else cursor + (end - start) * len(chunk) / weight
            schedule.append({"start": cursor, "end": stop, "text": chunk, "speaker": phrase["speaker"]})
            cursor = stop
    return schedule


# ---------------------------------------------------------------- timeline

class Timeline:
    """Maps a source instant to its place in the cut, given the clips kept."""

    def __init__(self, clips):
        self.clips = [(float(a), float(b)) for a, b in clips]
        self.total = sum(b - a for a, b in self.clips)

    def to_out(self, instant):
        offset = 0.0
        for start, end in self.clips:
            if start - TOLERANCE <= instant <= end + TOLERANCE:
                return offset + min(max(instant, start), end) - start
            offset += end - start
        raise ValueError(f"{instant}s falls in a stretch that was cut")

    def clip_of(self, instant):
        for index, (start, end) in enumerate(self.clips):
            if start - TOLERANCE <= instant <= end + TOLERANCE:
                return index
        return None


def video_pieces(clip, reframes):
    """A clip's video as (start, end, window or None) pieces, split at each reframe window.

    Only the picture is split: the audio of a clip stays one stretch, so a reframe
    landing mid-word never puts a fade inside the word.
    """
    start, end = float(clip[0]), float(clip[1])
    pieces, cursor = [], start
    for window in sorted(reframes, key=lambda w: w["start"]):
        a, b = max(float(window["start"]), start), min(float(window["end"]), end)
        if a >= b:
            continue
        if a > cursor:
            pieces.append((cursor, a, None))
        pieces.append((a, b, window))
        cursor = b
    if cursor < end:
        pieces.append((cursor, end, None))
    return pieces


# -------------------------------------------------------------- validation

def _word_count(text):
    return len(re.findall(r"\w+", text))


def validate_plan(plan):
    """Every reason the plan cannot be drawn, as sentences; empty means drawable."""
    errors = []
    if not plan.get("source"):
        errors.append("source: the path of the video is missing")

    clips = plan.get("clips") or []
    if not clips:
        errors.append("clips: nothing is kept")
    for index, clip in enumerate(clips):
        if len(clip) != 2 or not clip[0] < clip[1]:
            errors.append(f"clips[{index}]: needs [start, end] with start < end")
    if all(len(c) == 2 for c in clips):
        # Clips play in the order listed, which may differ from the source's; only an
        # overlap is refused, because one source instant would then sit at two output times.
        ordered = sorted(clips)
        for before, after in zip(ordered, ordered[1:]):
            if after[0] < before[1]:
                errors.append("clips: two of them overlap — one source instant has one place in the cut")
    if errors:
        return errors

    timeline = Timeline(clips)
    previous_out = -1.0
    for index, phrase in enumerate(plan.get("phrases") or []):
        label = f"phrases[{index}]"
        if phrase.get("speaker") not in (0, 1, HOST):
            errors.append(f"{label}: speaker must be 0 or 1 (the two voices) or 2 (the host) — only three inks exist")
        if not str(phrase.get("fr", "")).strip():
            errors.append(f"{label}: fr is empty")
        start, end = phrase.get("start"), phrase.get("end")
        if start is None or end is None or not start < end:
            errors.append(f"{label}: needs start < end")
            continue
        first, last = timeline.clip_of(start), timeline.clip_of(end)
        if first is None or last is None:
            errors.append(f"{label}: {start}-{end}s is outside every clip")
            continue
        played_at = timeline.to_out(start)
        if played_at < previous_out:
            errors.append(f"{label}: out of order — phrases follow the order the clips are played")
        previous_out = played_at
        if first != last:
            errors.append(f"{label}: straddles two clips — split it at the cut")

    banner = plan.get("banner")
    if banner is not None:
        if not str(banner.get("text", "")).strip():
            errors.append("banner.text: the sentence is missing")
        duration = banner.get("duration", 0)
        if not 0 < duration <= timeline.total:
            errors.append(f"banner.duration: {duration}s must be above zero and within the {timeline.total:.1f}s reel")

    reframes = plan.get("reframes") or []
    for index, window in enumerate(reframes):
        rect = window.get("rect")
        if rect is None and window.get("still_at") is None:
            errors.append(f"reframes[{index}]: needs a rect, a still_at, or both")
        elif rect is not None and not (isinstance(rect, list) and len(rect) == 4 and rect[0] >= 0
                                       and rect[1] >= 0 and rect[2] > 0 and rect[3] > 0):
            errors.append(f"reframes[{index}]: rect needs [x, y, width, height], sizes above zero")
        if not window.get("start", 0) < window.get("end", 0):
            errors.append(f"reframes[{index}]: needs start < end")
    ordered = sorted(reframes, key=lambda w: w.get("start", 0))
    for before, after in zip(ordered, ordered[1:]):
        if after.get("start", 0) < before.get("end", 0):
            errors.append("reframes: two windows overlap — one instant has one frame")

    cover = plan.get("thumbnail")
    if cover is not None:
        lines = [str(line).upper() for line in cover.get("title_lines", [])]
        if not lines:
            errors.append("thumbnail.title_lines: the title is missing")
        else:
            words = sum(_word_count(line) for line in lines)
            if words > MAX_TITLE_WORDS:
                errors.append(f"thumbnail: {words} words, the cap is eight — the copy yields, not the type")
            if not lines[-1].endswith(str(cover.get("accent", "")).upper()) or not cover.get("accent"):
                errors.append("thumbnail.accent: must be the end of the last line — the last words are the punchline")
        if "frame_at" not in cover:
            errors.append("thumbnail.frame_at: the instant of the frame is missing")
    return errors


# ----------------------------------------------------------------- drawing

def _run(command):
    subprocess.run(command, check=True)


def _checked(plan):
    problems = validate_plan(plan)
    if problems:
        raise ValueError("plan refused:\n  - " + "\n  - ".join(problems))


def _writable(path):
    import ethni_paths
    return ethni_paths.assert_writable(pathlib.Path(path).expanduser().resolve())


def _has_audio(source):
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(source)],
        capture_output=True, text=True, check=True)
    return bool(probe.stdout.strip())


def _frame_size(source):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
         "-of", "csv=p=0", str(source)], check=True, capture_output=True, text=True).stdout
    width, height = out.strip().split(",")[:2]
    return int(width), int(height)


def _blurred_ground(frame):
    """The source frame, blown up to fill 1080 x 1920, blurred and darkened."""
    from PIL import Image, ImageEnhance, ImageFilter
    ground = frame.resize((round(frame.width * HEIGHT / frame.height), HEIGHT), Image.Resampling.LANCZOS)
    left = (ground.width - WIDTH) // 2
    ground = ground.crop((left, 0, left + WIDTH, HEIGHT)).filter(ImageFilter.GaussianBlur(34))
    return ImageEnhance.Brightness(ground).enhance(0.45)


def _contain(frame):
    from PIL import Image
    scale = min(WIDTH / frame.width, FRAME_BOX_HEIGHT / frame.height)
    return frame.resize((round(frame.width * scale), round(frame.height * scale)), Image.Resampling.LANCZOS)


def wrap_banner(sentence, measure, max_width):
    """The banner sentence cut into lines no wider than `max_width`, French marks glued to their word.

    Same trap as `chunk_words`: the space inside « » and before ? ! : ; is made
    non-breaking first, or a line can open on a lone » .
    """
    text = re.sub(r"«[ \t]+", "«" + NBSP, sentence.strip())
    text = re.sub(r"[ \t]+(»|[?!:;])", NBSP + r"\1", text)
    rows, row = [], ""
    for word in re.split(r"[ \t]+", text):
        trial = f"{row} {word}".strip()
        if row and measure(trial) > max_width:
            rows.append(row)
            row = word
        else:
            row = trial
    rows.append(row)
    return rows


def _banner_band(sentence, font):
    """The banner sentence wrapped to the reel's width, centred, on a transparent band."""
    from PIL import Image, ImageDraw
    band = Image.new("RGBA", (WIDTH, BANNER_HEIGHT), (0, 0, 0, 0))
    pen = ImageDraw.Draw(band)
    rows = wrap_banner(sentence, lambda text: pen.textlength(text, font=font), WIDTH - 120)
    if len(rows) * BANNER_LINE_PX > BANNER_HEIGHT:
        raise ValueError(f"banner is {len(rows)} lines at {BANNER_FONT_PX}px — shorten the sentence, the type does not shrink")
    y = (BANNER_HEIGHT - len(rows) * BANNER_LINE_PX) // 2
    for row in rows:
        x = (WIDTH - pen.textlength(row, font=font)) / 2
        pen.text((x, y), row, font=font, fill=(255, 255, 255), stroke_width=6, stroke_fill="black")
        y += BANNER_LINE_PX
    return band


def _credit_band(credit, font):
    """The credit line, left-aligned under the frame, on a transparent band.

    A credit is information the operator may only partly have, so it never refuses:
    past two lines the end is elided rather than the plan rejected.
    """
    from PIL import Image, ImageDraw
    band = Image.new("RGBA", (WIDTH, CREDIT_HEIGHT), (0, 0, 0, 0))
    pen = ImageDraw.Draw(band)
    max_width = WIDTH - 120
    rows = wrap_banner(credit, lambda text: pen.textlength(text, font=font), max_width)
    if len(rows) > 2:
        rows = rows[:2]
        while pen.textlength(rows[1] + " …", font=font) > max_width and " " in rows[1]:
            rows[1] = rows[1].rsplit(" ", 1)[0]
        rows[1] += " …"
    y = (CREDIT_HEIGHT - len(rows) * CREDIT_LINE_PX) // 2
    for row in rows:
        pen.text((60, y), row, font=font, fill=(255, 255, 255), stroke_width=4, stroke_fill="black")
        y += CREDIT_LINE_PX
    return band


def render_reel(plan, out_path, watermark=True):
    """Cut, frame, caption and sign the video. Writes only outside a git checkout.

    `watermark=False` leaves the mark off, for a piece that is chained into a longer
    video which carries one mark of its own — a mark drawn per piece would scroll
    away with every transition. A plan's optional `credit_line` is drawn under the
    frame for the whole piece.
    """
    _checked(plan)
    if not _has_audio(plan["source"]):
        raise ValueError(f"{plan['source']} has no audio track — a reel made of a talking exchange needs one")
    out = _writable(out_path)
    import ethni_brand
    from PIL import Image, ImageDraw, ImageFont

    with tempfile.TemporaryDirectory() as work:
        work = pathlib.Path(work)
        fade, clips = 0.02, plan["clips"]
        reframes = plan.get("reframes") or []
        width, height = _frame_size(plan["source"]) if reframes else (None, None)
        graph = []
        for i, (start, end) in enumerate(clips):
            pieces = video_pieces([start, end], reframes)
            for j, (a, b, window) in enumerate(pieces):
                window = window or {}
                if window.get("still_at") is not None:
                    # One clean frame held for the window's length; the audio keeps running under it.
                    held = float(window["still_at"])
                    head = (f"[0:v]trim={held}:{held + 0.1},setpts=PTS-STARTPTS,fps={FPS},"
                            f"tpad=stop_mode=clone:stop_duration={b - a},trim=duration={b - a}")
                else:
                    head = f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,fps={FPS}"
                rect = window.get("rect")
                crop = f",crop={rect[2]}:{rect[3]}:{rect[0]}:{rect[1]}" if rect else ""
                # Every piece is brought back to the source size, or concat refuses the join.
                size = f",scale={width}:{height},setsar=1" if reframes else ""
                graph.append(f"{head}{crop}{size}[v{i}p{j}]")
            parts = "".join(f"[v{i}p{j}]" for j in range(len(pieces)))
            graph.append(f"{parts}concat=n={len(pieces)}:v=1:a=0[v{i}]")
            graph.append(f"[0:a]atrim={start}:{end},asetpts=PTS-STARTPTS,"
                         f"afade=t=in:d={fade},afade=t=out:st={end - start - fade}:d={fade}[a{i}]")
        joined = "".join(f"[v{i}][a{i}]" for i in range(len(clips)))
        graph.append(f"{joined}concat=n={len(clips)}:v=1:a=1[cv][ca]")
        graph.append(
            f"[cv]split[bg][fg];[bg]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
            f"crop={WIDTH}:{HEIGHT},boxblur=30:5,eq=brightness=-0.15[b];"
            f"[fg]scale={WIDTH}:{FRAME_BOX_HEIGHT}:force_original_aspect_ratio=decrease[f];"
            f"[b][f]overlay=(W-w)/2:{FRAME_CENTRE_Y}-h/2,format=yuv420p[out]")
        base = work / "base.mp4"
        _run(["ffmpeg", "-y", "-v", "error", "-i", str(plan["source"]), "-filter_complex", ";".join(graph),
              "-map", "[out]", "-map", "[ca]", "-c:v", "libx264", "-crf", "18", "-preset", "medium",
              "-c:a", "aac", "-b:a", "192k", str(base)])

        font = ImageFont.truetype(str(HARNESS / "fonts" / "Montserrat-ExtraBold.ttf"), 70)
        entries, cursor, lines = [], 0.0, []
        blank = work / "blank.png"
        Image.new("RGBA", (WIDTH, CAPTION_BAND_HEIGHT), (0, 0, 0, 0)).save(blank)
        for n, caption in enumerate(caption_schedule(plan)):
            band = Image.new("RGBA", (WIDTH, CAPTION_BAND_HEIGHT), (0, 0, 0, 0))
            pen = ImageDraw.Draw(band)
            words = caption["text"].split(" ")
            rows = [caption["text"]]
            if pen.textlength(caption["text"], font=font) > WIDTH - 100:
                half = len(words) // 2
                rows = [" ".join(words[:half]), " ".join(words[half:])]
            y = (CAPTION_BAND_HEIGHT - len(rows) * 88) // 2
            for row in rows:
                x = (WIDTH - pen.textlength(row, font=font)) / 2
                pen.text((x, y), row, font=font, fill=speaker_ink(caption["speaker"]), stroke_width=7, stroke_fill="black")
                y += 88
            png = work / f"caption_{n}.png"
            band.save(png)
            if caption["start"] > cursor + 0.005:
                lines += [f"file '{blank}'", f"duration {caption['start'] - cursor:.4f}"]
            lines += [f"file '{png}'", f"duration {caption['end'] - caption['start']:.4f}"]
            cursor = caption["end"]
        total = Timeline(clips).total
        if total > cursor:
            lines += [f"file '{blank}'", f"duration {total - cursor:.4f}"]
        lines.append(f"file '{blank}'")
        (work / "captions.txt").write_text("\n".join(lines))
        captions_video = work / "captions.mov"
        _run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(work / "captions.txt"),
              "-vf", f"fps={FPS},format=argb", "-c:v", "qtrle", str(captions_video)])

        out.parent.mkdir(parents=True, exist_ok=True)
        inputs = ["-i", str(base), "-i", str(captions_video)]
        steps = [f"[0:v][1:v]overlay=0:{CAPTION_BAND_Y}"]

        def lay(png, position):
            inputs.extend(["-i", str(png)])
            steps.append(f"[{len(inputs) // 2 - 1}:v]overlay={position}")

        if watermark:
            mark_png = work / "mark.png"
            ethni_brand.filigrane(ethni_brand.FILIGRANE_PX, (255, 255, 255)).save(mark_png)
            lay(mark_png, f"(W-w)/2:{WATERMARK_Y}")
        if plan.get("credit_line"):
            credit_png = work / "credit.png"
            _credit_band(plan["credit_line"], ImageFont.truetype(str(HARNESS / "fonts" / "NotoSans-Bold.ttf"),
                                                                 CREDIT_FONT_PX)).save(credit_png)
            lay(credit_png, f"0:{CREDIT_Y}")
        banner = plan.get("banner")
        if banner:
            banner_png = work / "banner.png"
            _banner_band(banner["text"], ImageFont.truetype(str(HARNESS / "fonts" / "Montserrat-ExtraBold.ttf"),
                                                            BANNER_FONT_PX)).save(banner_png)
            lay(banner_png, f"0:{BANNER_Y}:enable='lt(t,{banner['duration']})'")
        # Each overlay reads the previous step's output; the first reads the two inputs.
        stack = steps[0] + "[s0]"
        for n, step in enumerate(steps[1:], start=1):
            stack += f";[s{n - 1}]{step}[s{n}]"
        _run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", stack,
              "-map", f"[s{len(steps) - 1}]", "-map", "0:a", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
              "-c:a", "copy", "-shortest", str(out)])
    return out


def render_thumbnail(plan, out_path):
    """The cover: the source frame over its own blur, the title in Anton, the mark below."""
    _checked(plan)
    cover = plan.get("thumbnail")
    if not cover:
        raise ValueError("plan has no thumbnail block")
    out = _writable(out_path)
    import ethni_brand
    from PIL import Image, ImageDraw, ImageFont

    with tempfile.TemporaryDirectory() as work:
        still = pathlib.Path(work) / "frame.png"
        _run(["ffmpeg", "-y", "-v", "error", "-ss", str(cover["frame_at"]), "-i", str(plan["source"]),
              "-frames:v", "1", str(still)])
        frame = Image.open(still).convert("RGB")

    image = _blurred_ground(frame)
    inset = _contain(frame)
    top = FRAME_CENTRE_Y - inset.height // 2
    image.paste(inset, ((WIDTH - inset.width) // 2, top))
    pen = ImageDraw.Draw(image)
    font = ImageFont.truetype(str(HARNESS / "fonts" / "Anton-Regular.ttf"), 130)
    lines = [str(line).upper() for line in cover["title_lines"]]
    accent = str(cover["accent"]).upper()
    y = top + inset.height + 70
    for index, line in enumerate(lines):
        plain, hot = (line[:-len(accent)], accent) if index == len(lines) - 1 else (line, "")
        width = pen.textlength(plain, font=font) + pen.textlength(hot, font=font)
        if width > WIDTH - 120:
            raise ValueError(f"title line {line!r} is {width:.0f}px wide at 130px — rewrite the copy, the type does not shrink")
        x = (WIDTH - width) / 2
        pen.text((x, y), plain, font=font, fill=(255, 255, 255))
        pen.text((x + pen.textlength(plain, font=font), y), hot, font=font, fill=ethni_brand.FLAME)
        y += 150
    mark = ethni_brand.filigrane(ethni_brand.FILIGRANE_PX, (255, 255, 255))
    image.paste(mark, ((WIDTH - mark.width) // 2, WATERMARK_Y), mark)
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    return out


def main(argv):
    usage = "usage: ethni_clip_reel.py validate PLAN | reel PLAN OUT.mp4 | thumbnail PLAN OUT.png"
    if len(argv) < 3 or argv[1] not in {"validate", "reel", "thumbnail"}:
        print(usage)
        return 2
    plan = json.loads(pathlib.Path(argv[2]).read_text())
    if argv[1] == "validate":
        problems = validate_plan(plan)
        print("\n".join(problems) if problems else "plan ok")
        return 1 if problems else 0
    if len(argv) < 4:
        print(usage)
        return 2
    print((render_reel if argv[1] == "reel" else render_thumbnail)(plan, argv[3]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
