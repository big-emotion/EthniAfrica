"""Chain found clips from several sources into one « Swipe », and draw its cover.

    python ethni_swipe.py validate plan.json
    python ethni_swipe.py swipe plan.json out.mp4
    python ethni_swipe.py thumbnail plan.json out.png

A Swipe (docs/design/gabarits-social/LE-SWIPE.md) is a list of **segments**, one per
source. Each segment is drawn by the clip-reel engine — same frame, blur, captions
and reframes — with its credit under the frame and, if it has one, a short context
marker above it; then the segments are chained by a feed scroll and the project
mark is laid once over the whole, so it does not scroll away with every clip.

Findings come in two kinds, by operator ruling (2026-10-05):

- an **error** is a plan that cannot be drawn correctly, and it is refused;
- a **warning** is an editorial limit the operator may knowingly exceed: a credit
  with nothing in it, a context marker past eight words, a total past 3:00.

The scroll first copied a finger's flick on an Instagram feed (0.25 s, cubic
ease-out). On the first real Swipe (2026-10-05) the operator found it unreadable:
the next clip seemed to appear from nowhere. In a feed the viewer makes the gesture
and expects the change; in a montage nothing warns the eye, so the push now lasts
0.6 s and eases in and out — a soft start, a soft landing.

The incoming clip's sound starts at full level while the outgoing one fades: a fade-in
swallowed the first word of every clip.
"""
import json
import pathlib
import subprocess
import sys
import tempfile

import ethni_clip_reel as reel

DEFAULT_TRANSITION = 0.6
DEFAULT_LAYOUT = "auto"   # each source framed by its own shape, never cropped
MIN_REST = 0.5            # seconds a clip must be on screen, still, between two scrolls
MAX_MARKER_WORDS = 8
MAX_TOTAL = 180.0         # past 3:00 a Reel is probably no longer placed in Instagram's Reels tab
CREDIT_ORDER = ("title", "author", "channel", "year")

# Push upward, eased in and out: P runs from 1 to 0, so ld(1) = 1 - P is the elapsed
# share; ld(2) is how far the incoming clip has risen, in rows of the plane being drawn.
_PUSH_UP = (
    "st(1,1-P);"
    "st(2,H*if(lt(ld(1),0.5),4*pow(ld(1),3),1-pow(2-2*ld(1),3)/2));"
    "if(lt(Y,H-ld(2)),"
    "if(eq(PLANE,0),a0(X,Y+ld(2)),if(eq(PLANE,1),a1(X,Y+ld(2)),a2(X,Y+ld(2)))),"
    "if(eq(PLANE,0),b0(X,Y-H+ld(2)),if(eq(PLANE,1),b1(X,Y-H+ld(2)),b2(X,Y-H+ld(2)))))"
)


def credit_line(credit):
    """Whatever credit fields are known, in a fixed order, joined by a middle dot."""
    if not credit:
        return ""
    return " · ".join(str(credit[key]).strip() for key in CREDIT_ORDER
                      if credit.get(key) not in (None, "") and str(credit[key]).strip())


def segment_duration(segment):
    return reel.Timeline(segment.get("clips") or []).total


def total_duration(durations, transition):
    return sum(durations) - transition * max(0, len(durations) - 1)


def transition_offsets(durations, transition):
    """Where each scroll starts on the output timeline: one transition before the end of what is joined."""
    offsets, joined = [], durations[0] if durations else 0.0
    for duration in durations[1:]:
        offsets.append(round(joined - transition, 6))
        joined += duration - transition
    return offsets


def segment_plan(segment, plan=None):
    """The clip-reel plan one segment is drawn from.

    `layout` and `focus_x` set on the plan apply to every segment; a segment's own
    value wins, because one wide two-shot may need a different focus from the rest.
    """
    sub = {key: segment[key] for key in ("source", "clips", "phrases", "reframes") if key in segment}
    sub.setdefault("phrases", [])
    for key in ("layout", "focus_x"):
        value = segment.get(key, (plan or {}).get(key))
        if value is not None:
            sub[key] = value
    sub.setdefault("layout", DEFAULT_LAYOUT)
    if segment.get("marker"):
        sub["banner"] = segment["marker"]
    line = credit_line(segment.get("credit"))
    if line:
        sub["credit_line"] = line
    return sub


def check_plan(plan):
    """(errors, warnings) as sentences; no error means drawable."""
    errors, warnings = [], []
    segments = plan.get("segments") or []
    if len(segments) < 2:
        errors.append("segments: a Swipe needs at least two segments — one source is a clip-reel")
    transition = plan.get("transition", DEFAULT_TRANSITION)
    if not 0 < transition <= 1.0:
        errors.append(f"transition: {transition}s must be above zero and at most 1s")

    durations = []
    for index, segment in enumerate(segments):
        label = f"segments[{index}]"
        sub = segment_plan(segment, plan)
        marker = segment.get("marker")
        if marker is not None:
            text = str(marker.get("text", "")).strip()
            if not text or not marker.get("duration", 0) > 0:
                errors.append(f"{label}.marker: needs its text and a duration above zero")
                sub.pop("banner", None)
            elif reel._word_count(text) > MAX_MARKER_WORDS:
                warnings.append(f"{label}.marker: {reel._word_count(text)} words — a marker situates "
                                f"(place, date, broadcaster), past {MAX_MARKER_WORDS} it starts to comment")
        errors += [f"{label}: {problem}" for problem in reel.validate_plan(sub)]
        if not credit_line(segment.get("credit")):
            warnings.append(f"{label}.credit: nothing to show — the clip plays uncredited")
        durations.append(segment_duration(segment))

    if durations and 0 < transition <= 1.0:
        for index, duration in enumerate(durations):
            joins = (index > 0) + (index < len(durations) - 1)
            if duration - joins * transition < MIN_REST:
                errors.append(f"segments[{index}]: {duration:.2f}s leaves under {MIN_REST}s at rest between "
                              f"its transitions — lengthen the clip or shorten the transition")
        total = total_duration(durations, transition)
        if total > MAX_TOTAL:
            minutes, seconds = divmod(round(total), 60)
            warnings.append(f"total: {minutes}:{seconds:02d}, over 3:00 — probably out of Instagram's Reels tab")

    cover = plan.get("thumbnail")
    if cover is not None:
        index = cover.get("segment")
        if not isinstance(index, int) or not 0 <= index < len(segments):
            errors.append(f"thumbnail.segment: {index!r} names no segment")
        else:
            title = {k: v for k, v in cover.items() if k != "segment"}
            errors += [problem for problem in reel.validate_plan(dict(segment_plan(segments[index], plan), thumbnail=title))
                       if problem.startswith("thumbnail")]
    return errors, warnings


def _checked(plan):
    errors, warnings = check_plan(plan)
    if errors:
        raise ValueError("plan refused:\n  - " + "\n  - ".join(errors))
    return warnings


def _audio_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a:0", "-show_entries", "stream=duration",
                          "-of", "csv=p=0", str(path)], check=True, capture_output=True, text=True).stdout
    return float(out.strip())


def render_swipe(plan, out_path):
    """Draw every segment, chain them with the push, lay the mark once. Writes only outside a git checkout."""
    warnings = _checked(plan)
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    out = reel._writable(out_path)
    import ethni_brand
    transition = plan.get("transition", DEFAULT_TRANSITION)
    segments = plan["segments"]

    with tempfile.TemporaryDirectory() as work:
        work = pathlib.Path(work)
        pieces = []
        for index, segment in enumerate(segments):
            piece = work / f"segment_{index}.mp4"
            reel.render_reel(segment_plan(segment, plan), piece, watermark=False)
            pieces.append(piece)

        # A rendered piece's picture can end a few frames before its sound (measured:
        # 1.9 s of video under 2.0 s of audio). xfade stops where its first input stops,
        # so a scroll timed on the plan ran past the picture and cut to the next clip.
        # Every piece is held to its own audio length, and the offsets are timed on that.
        durations = [_audio_duration(piece) for piece in pieces]
        graph = [f"[{i}:v]tpad=stop_mode=clone:stop_duration=1,trim=duration={d},setpts=PTS-STARTPTS[p{i}]"
                 for i, d in enumerate(durations)]
        video, audio = "[p0]", "[0:a]"
        for n, offset in enumerate(transition_offsets(durations, transition), start=1):
            graph.append(f"{video}[p{n}]xfade=transition=custom:duration={transition}:offset={offset}:"
                         f"expr='{_PUSH_UP}'[v{n}]")
            graph.append(f"{audio}[{n}:a]acrossfade=d={transition}:c1=tri:c2=nofade[a{n}]")
            video, audio = f"[v{n}]", f"[a{n}]"
        mark_png = work / "mark.png"
        ethni_brand.filigrane(ethni_brand.FILIGRANE_PX, (255, 255, 255)).save(mark_png)
        graph.append(f"{video}[{len(pieces)}:v]overlay=(W-w)/2:{reel.WATERMARK_Y},format=yuv420p[out]")
        inputs = [arg for piece in pieces for arg in ("-i", str(piece))] + ["-i", str(mark_png)]
        out.parent.mkdir(parents=True, exist_ok=True)
        reel._run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(graph),
                   "-map", "[out]", "-map", audio, "-c:v", "libx264", "-crf", "18", "-preset", "medium",
                   "-c:a", "aac", "-b:a", "192k", str(out)])
    return out


def render_thumbnail(plan, out_path):
    """The cover, drawn by the clip-reel engine from the segment the thumbnail names."""
    _checked(plan)
    cover = plan.get("thumbnail")
    if not cover:
        raise ValueError("plan has no thumbnail block")
    sub = segment_plan(plan["segments"][cover["segment"]], plan)
    sub["thumbnail"] = {k: v for k, v in cover.items() if k != "segment"}
    return reel.render_thumbnail(sub, out_path)


def main(argv):
    usage = "usage: ethni_swipe.py validate PLAN | swipe PLAN OUT.mp4 | thumbnail PLAN OUT.png"
    if len(argv) < 3 or argv[1] not in {"validate", "swipe", "thumbnail"}:
        print(usage)
        return 2
    plan = json.loads(pathlib.Path(argv[2]).read_text())
    if argv[1] == "validate":
        errors, warnings = check_plan(plan)
        for warning in warnings:
            print(f"warning: {warning}")
        print("\n".join(errors) if errors else "plan ok")
        return 1 if errors else 0
    if len(argv) < 4:
        print(usage)
        return 2
    print((render_swipe if argv[1] == "swipe" else render_thumbnail)(plan, argv[3]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
