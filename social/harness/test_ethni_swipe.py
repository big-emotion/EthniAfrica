"""Le Swipe: found clips from several sources, credited, chained by a feed scroll.

    ./venv/bin/python test_ethni_swipe.py

The plan is the contract between whoever chooses the clips (the operator, or the
`ethniafrica-koulechov` skill) and the renderer. Two kinds of findings, on purpose:
an **error** is a plan that cannot be drawn correctly and is refused; a **warning**
is an editorial limit the operator may knowingly exceed (operator ruling,
2026-10-05) — a missing credit field, a long context marker, a Swipe over 3:00.
"""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

import ethni_clip_reel as reel
import ethni_swipe as swipe

HARNESS = pathlib.Path(__file__).resolve().parent


def segment(**over):
    base = {
        "source": "a.mp4",
        "clips": [[10.0, 20.0]],
        "phrases": [{"start": 10.0, "end": 20.0, "speaker": 0, "fr": "Le lingala vient du fleuve."}],
        "credit": {"title": "Journal", "channel": "OZRT", "year": 1974},
    }
    base.update(over)
    return base


def plan(**over):
    base = {"segments": [segment(), segment(source="b.mp4")], "transition": 0.25}
    base.update(over)
    return base


# ---------------------------------------------------------------- the credit line

def test_the_credit_line_joins_whatever_fields_are_known_in_a_fixed_order():
    assert swipe.credit_line({"title": "Journal", "author": "J. Dupont", "channel": "OZRT", "year": 1974}) \
        == "Journal · J. Dupont · OZRT · 1974"


def test_a_credit_may_be_only_a_network_handle():
    assert swipe.credit_line({"channel": "@archives.kin"}) == "@archives.kin"


def test_no_credit_at_all_gives_no_line():
    assert swipe.credit_line({}) == ""
    assert swipe.credit_line(None) == ""


# ---------------------------------------------------------------- validation

def test_a_well_formed_plan_has_neither_error_nor_warning():
    assert swipe.check_plan(plan()) == ([], [])


def test_a_missing_credit_is_a_warning_never_an_error():
    errors, warnings = swipe.check_plan(plan(segments=[segment(credit=None), segment()]))
    assert errors == []
    assert any("segments[0]" in w and "credit" in w for w in warnings)


def test_a_partial_credit_passes_without_a_finding():
    errors, warnings = swipe.check_plan(plan(segments=[segment(credit={"channel": "@chaine"}), segment()]))
    assert (errors, warnings) == ([], [])


def test_a_context_marker_over_eight_words_is_a_warning_never_an_error():
    long_marker = {"text": "Kinshasa en 1974 pendant le grand match de boxe du siècle", "duration": 3}
    errors, warnings = swipe.check_plan(plan(segments=[segment(marker=long_marker), segment()]))
    assert errors == []
    assert any("marker" in w for w in warnings)


def test_a_marker_without_text_or_with_no_duration_is_an_error():
    errors, _ = swipe.check_plan(plan(segments=[segment(marker={"text": "", "duration": 3}), segment()]))
    assert any("marker" in e for e in errors)
    errors, _ = swipe.check_plan(plan(segments=[segment(marker={"text": "Kinshasa, 1974", "duration": 0}), segment()]))
    assert any("marker" in e for e in errors)


def test_a_swipe_over_three_minutes_is_a_warning_never_an_error():
    long_clip = segment(clips=[[0.0, 100.0]],
                        phrases=[{"start": 0.0, "end": 100.0, "speaker": 0, "fr": "Une longue explication."}])
    errors, warnings = swipe.check_plan(plan(segments=[long_clip, dict(long_clip, source="b.mp4")]))
    assert errors == []
    assert any("3:00" in w for w in warnings)


def test_a_transition_that_would_leave_a_clip_never_at_rest_is_an_error():
    short = segment(clips=[[10.0, 10.4]], phrases=[])
    errors, _ = swipe.check_plan(plan(segments=[segment(), short, segment()]))
    assert any("transition" in e for e in errors)


def test_a_segment_error_from_the_reel_rules_names_its_segment():
    straddling = segment(clips=[[10.0, 12.0], [20.0, 22.0]],
                         phrases=[{"start": 11.0, "end": 21.0, "speaker": 0, "fr": "À cheval."}])
    errors, _ = swipe.check_plan(plan(segments=[segment(), straddling]))
    assert any(e.startswith("segments[1]") and "straddles" in e for e in errors)


def test_a_swipe_needs_at_least_two_segments():
    errors, _ = swipe.check_plan(plan(segments=[segment()]))
    assert any("two segments" in e for e in errors)


def test_the_thumbnail_must_name_an_existing_segment():
    cover = {"segment": 5, "frame_at": 12.0, "title_lines": ["LINGALA"], "accent": "LINGALA"}
    errors, _ = swipe.check_plan(plan(thumbnail=cover))
    assert any("thumbnail.segment" in e for e in errors)


def test_the_example_plan_shipped_with_the_skill_has_no_error():
    example = HARNESS.parent.parent / ".claude/skills/ethniafrica-koulechov/references/swipe-plan.example.json"
    errors, _ = swipe.check_plan(json.loads(example.read_text()))
    assert errors == []


def test_a_plan_wide_layout_reaches_every_segment_and_a_segment_may_override_it():
    p = plan(layout="fill", segments=[segment(), segment(source="b.mp4", layout="frame", focus_x=0.2)])
    assert swipe.check_plan(p) == ([], [])
    first, second = (swipe.segment_plan(s, p) for s in p["segments"])
    assert first["layout"] == "fill"
    assert (second["layout"], second["focus_x"]) == ("frame", 0.2)


def test_a_segment_is_framed_by_its_own_shape_unless_the_plan_says_otherwise():
    assert swipe.segment_plan(segment(), plan())["layout"] == "auto"


# ---------------------------------------------------------------- the timeline

def test_the_total_is_the_segments_minus_one_transition_per_join():
    assert abs(swipe.total_duration([10.0, 8.0, 6.0], 0.25) - 23.5) < 1e-9


def test_each_transition_starts_one_transition_before_the_end_of_what_is_already_joined():
    assert swipe.transition_offsets([10.0, 8.0, 6.0], 0.25) == [9.75, 17.5]


# ---------------------------------------------------------------- rendered files

def _colour_source(path, colour, seconds=3):
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color={colour}:size=640x360:rate=25:duration={seconds}",
         "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}", "-shortest",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(path)],
        check=True)


def _probe(path, entries):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", entries, "-of", "json", str(path)],
                         check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def _frame(video, instant):
    from PIL import Image
    with tempfile.TemporaryDirectory() as tmp:
        still = pathlib.Path(tmp) / "f.png"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(instant), "-i", str(video),
                        "-frames:v", "1", str(still)], check=True)
        return Image.open(still).convert("RGB")


def _redder(pixel):
    return pixel[0] > pixel[2] + 20


def _bluer(pixel):
    return pixel[2] > pixel[0] + 20


def _two_colour_plan(tmp):
    red, blue = tmp / "red.mp4", tmp / "blue.mp4"
    _colour_source(red, "red")
    _colour_source(blue, "blue")
    return {
        "segments": [
            {"source": str(red), "clips": [[0.0, 2.0]], "phrases": [], "credit": {"channel": "@rouge"}},
            {"source": str(blue), "clips": [[0.0, 2.0]], "phrases": [], "credit": {"channel": "@bleu"}},
        ],
        "transition": 0.25,
    }


def test_the_swipe_is_vertical_and_as_long_as_its_segments_minus_the_transitions():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        out = tmp / "swipe.mp4"
        swipe.render_swipe(_two_colour_plan(tmp), out)
        info = _probe(out, "stream=width,height,codec_type:format=duration")
        video = [s for s in info["streams"] if s.get("codec_type") == "video"][0]
        assert (video["width"], video["height"]) == (1080, 1920)
        assert any(s.get("codec_type") == "audio" for s in info["streams"])
        assert abs(float(info["format"]["duration"]) - 3.75) < 0.2


def test_the_next_clip_pushes_the_previous_one_upward():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        out = tmp / "swipe.mp4"
        swipe.render_swipe(_two_colour_plan(tmp), out)
        # Halfway through the scroll the eased push has moved most of a screen: the
        # top still shows the outgoing clip, the bottom already the incoming one.
        middle = _frame(out, 1.75 + 0.125)
        assert _redder(middle.getpixel((20, 60)))
        assert _bluer(middle.getpixel((20, 1860)))
        before, after = _frame(out, 1.0), _frame(out, 3.0)
        assert _redder(before.getpixel((20, 1860)))
        assert _bluer(after.getpixel((20, 60)))


def _incoming_share(frame):
    """How much of the screen height the incoming (blue) clip covers, read down the left edge."""
    rows = [y for y in range(0, 1920, 8) if _bluer(frame.getpixel((20, y)))]
    return len(rows) / (1920 / 8)


def test_without_a_transition_set_the_scroll_lasts_long_enough_to_be_seen_and_eases_in_and_out():
    # Measured on the first real Swipe (2026-10-05): at 0.25 s eased out, the next clip
    # seemed to appear from nowhere. 0.6 s, eased in and out, reads as a movement.
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        p = _two_colour_plan(tmp)
        del p["transition"]
        out = tmp / "swipe.mp4"
        swipe.render_swipe(p, out)
        assert abs(float(_probe(out, "format=duration")["format"]["duration"]) - 3.4) < 0.2
        start = 2.0 - 0.6
        assert _incoming_share(_frame(out, start + 0.07)) < 0.05, "a soft start, not a jump"
        assert 0.35 < _incoming_share(_frame(out, start + 0.3)) < 0.65, "halfway through, about half the screen"
        assert _incoming_share(_frame(out, start + 0.54)) > 0.93, "a soft landing, almost there"


def _tone_source(path, audible, seconds=3):
    audio = "sine=frequency=440:duration=3" if audible else "anullsrc=r=44100:cl=mono"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"color=gray:size=640x360:rate=25:duration={seconds}",
         "-f", "lavfi", "-t", str(seconds), "-i", audio, "-shortest",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(path)],
        check=True)


def _loudness(video, start, length):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(length), "-i", str(video),
                          "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    samples = np.frombuffer(raw, dtype=np.float32)
    return float(np.sqrt(np.mean(samples ** 2)))


def test_the_next_clip_is_heard_from_its_first_word_not_faded_in():
    # A fade-in on the incoming sound swallowed the first word of every clip
    # (« La … chose » for « La seule bonne chose »).
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        silent, tone = tmp / "silent.mp4", tmp / "tone.mp4"
        _tone_source(silent, audible=False)
        _tone_source(tone, audible=True)
        p = {"segments": [{"source": str(silent), "clips": [[0.0, 2.0]], "phrases": []},
                          {"source": str(tone), "clips": [[0.0, 2.0]], "phrases": []}],
             "transition": 0.6}
        out = tmp / "swipe.mp4"
        swipe.render_swipe(p, out)
        settled = _loudness(out, 2.5, 0.3)
        right_at_the_join = _loudness(out, 1.42, 0.1)
        assert settled > 0.05
        assert right_at_the_join > 0.8 * settled, "the incoming sound starts at full level"


def test_a_credit_line_is_drawn_under_the_frame_and_absent_without_one():
    def brightest_in_credit_band(credit):
        with tempfile.TemporaryDirectory() as tmp:
            tmp = pathlib.Path(tmp)
            src = tmp / "red.mp4"
            _colour_source(src, "red")
            p = {"source": str(src), "clips": [[0.0, 2.0]], "phrases": []}
            if credit:
                p["credit_line"] = credit
            out = tmp / "reel.mp4"
            reel.render_reel(p, out, watermark=False)
            frame = _frame(out, 1.0)
            band = frame.crop((0, reel.CREDIT_Y, reel.WIDTH, reel.CREDIT_Y + reel.CREDIT_HEIGHT))
            from PIL import ImageChops
            r, g, b = band.split()
            return ImageChops.darker(ImageChops.darker(r, g), b).getextrema()[1]

    assert brightest_in_credit_band("Journal · OZRT · 1974") > 200
    assert brightest_in_credit_band(None) < 120


def test_the_thumbnail_is_drawn_from_the_segment_it_names():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        p = _two_colour_plan(tmp)
        p["thumbnail"] = {"segment": 1, "frame_at": 1.0, "title_lines": ["LINGALA"], "accent": "LINGALA"}
        out = tmp / "cover.png"
        swipe.render_thumbnail(p, out)
        from PIL import Image
        cover = Image.open(out).convert("RGB")
        assert cover.size == (1080, 1920)
        assert _bluer(cover.getpixel((540, 640)))


def main():
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print("ffmpeg / ffprobe introuvables : les suites de rendu ne peuvent pas tourner")
        return 1
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    echecs = 0
    for test in tests:
        try:
            test()
            print(f"ok    {test.__name__}")
        except Exception as e:  # noqa: BLE001 — every failure is reported, none stops the run
            echecs += 1
            print(f"FAIL  {test.__name__}\n      {e}")
    print(f"\n{len(tests) - echecs}/{len(tests)} passent")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
