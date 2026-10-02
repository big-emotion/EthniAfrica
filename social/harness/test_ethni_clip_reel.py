"""The cut of a third-party video into a captioned vertical reel: plan, timeline, captions.

    ./venv/bin/python test_ethni_clip_reel.py

The plan is the contract between whoever chooses the passages (a person, or the
`ethniafrica-clip-reel` skill) and the renderer. What must hold is decided here,
through the module's public surface: a plan that would misplace a caption is
refused before ffmpeg runs, not discovered on a rendered frame.
"""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

import ethni_clip_reel as reel

HARNESS = pathlib.Path(__file__).resolve().parent
CLIPS = [[10.0, 20.0], [50.0, 60.0]]


def plan(**over):
    base = {
        "source": "source.mp4",
        "clips": CLIPS,
        "phrases": [
            {"start": 10.0, "end": 14.0, "speaker": 0, "fr": "Bonne question. Je ne suis pas sûr."},
            {"start": 14.0, "end": 20.0, "speaker": 1, "fr": "C'était un Portugais, en 1452."},
            {"start": 50.0, "end": 60.0, "speaker": 1, "fr": "Ce système a été créé pour priver les Noirs de leurs droits."},
        ],
        "thumbnail": {
            "frame_at": 15.0,
            "title_lines": ["QUI A INVENTÉ", "LA « RACE » ?"],
            "accent": "« RACE » ?",
        },
    }
    base.update(over)
    return base


def test_the_example_plan_shipped_with_the_skill_stays_valid():
    example = HARNESS.parents[1] / ".claude/skills/ethniafrica-clip-reel/references/plan.example.json"
    assert reel.validate_plan(json.loads(example.read_text())) == []


# ------------------------------------------------------------------ chunking

def test_a_caption_is_never_more_than_four_words_nor_fewer_than_two():
    for n in range(2, 40):
        texte = " ".join(f"mot{i}" for i in range(n))
        blocs = reel.chunk_words(texte)
        tailles = [len(b.split()) for b in blocs]
        assert max(tailles) <= 4, f"{n} mots → {tailles}"
        assert min(tailles) >= 2, f"{n} mots → {tailles}"


def test_a_single_word_stays_alone():
    assert reel.chunk_words("Oui.") == ["Oui."]


def test_chunks_are_balanced_rather_than_leaving_an_orphan_word():
    # 5 words must be 3+2, not 4+1: an orphan word flashes by and reads as a glitch.
    assert [len(b.split()) for b in reel.chunk_words("un deux trois quatre cinq")] == [3, 2]


def test_chunks_keep_the_words_in_order():
    texte = "Après la création de la race, ils ont pratiqué l'esclavage de propriété"
    assert " ".join(reel.chunk_words(texte)) == texte


def test_french_quotes_and_marks_never_start_or_end_a_chunk_alone():
    texte = "Pourquoi dis-tu « racisme systémique » et pas simplement « racisme » ?"
    for bloc in reel.chunk_words(texte):
        assert not bloc.startswith(("»", "?", "!", ":", ";")), bloc
        assert not bloc.endswith("«"), bloc


# ------------------------------------------------------------------ timeline

def test_the_output_time_of_a_source_instant_skips_what_was_cut():
    tl = reel.Timeline(CLIPS)
    assert tl.total == 20.0
    assert tl.to_out(10.0) == 0.0
    assert tl.to_out(15.0) == 5.0
    assert tl.to_out(50.0) == 10.0
    assert tl.to_out(59.0) == 19.0


def test_an_instant_inside_a_cut_has_no_output_time():
    try:
        reel.Timeline(CLIPS).to_out(30.0)
    except ValueError:
        return
    raise AssertionError("30 s falls between two clips and must be refused")


# ---------------------------------------------------------------- validation

def test_a_well_formed_plan_has_no_error():
    assert reel.validate_plan(plan()) == []


def test_a_phrase_may_not_straddle_two_clips():
    p = plan(phrases=[{"start": 18.0, "end": 52.0, "speaker": 0, "fr": "Un deux"}])
    assert any("straddles" in e for e in reel.validate_plan(p))


def test_a_phrase_outside_every_clip_is_refused():
    p = plan(phrases=[{"start": 30.0, "end": 35.0, "speaker": 0, "fr": "Un deux"}])
    assert any("outside" in e for e in reel.validate_plan(p))


def test_overlapping_clips_are_refused():
    assert reel.validate_plan(plan(clips=[[10.0, 20.0], [15.0, 25.0]]))


def test_a_host_may_speak_as_a_third_ink_but_a_fourth_voice_is_refused():
    host = plan(phrases=[{"start": 10.0, "end": 12.0, "speaker": 2, "fr": "Un deux"}])
    assert reel.validate_plan(host) == []
    fourth = plan(phrases=[{"start": 10.0, "end": 12.0, "speaker": 3, "fr": "Un deux"}])
    assert any("speaker" in e for e in reel.validate_plan(fourth))


def test_the_host_ink_is_distinct_from_both_debaters():
    inks = [reel.speaker_ink(n) for n in (0, 1, 2)]
    assert len(set(inks)) == 3


def test_a_banner_needs_its_sentence_and_a_positive_duration_within_the_reel():
    ok = plan(banner={"text": "Affirmation débattue : le racisme systémique sert d'excuse.", "duration": 8})
    assert reel.validate_plan(ok) == []
    assert any("banner.text" in e for e in reel.validate_plan(plan(banner={"text": " ", "duration": 8})))
    assert any("banner.duration" in e for e in reel.validate_plan(plan(banner={"text": "Un", "duration": 0})))
    # the reel in this fixture runs 20 s: a banner outliving it is a typo, not a choice
    assert any("banner.duration" in e for e in reel.validate_plan(plan(banner={"text": "Un", "duration": 21})))


def test_a_thumbnail_title_longer_than_eight_words_is_refused():
    p = plan()
    p["thumbnail"]["title_lines"] = ["UN DEUX TROIS QUATRE CINQ", "SIX SEPT HUIT NEUF"]
    p["thumbnail"]["accent"] = "NEUF"
    assert any("eight" in e for e in reel.validate_plan(p))


def test_the_accent_must_close_the_title_because_the_last_word_is_the_punchline():
    p = plan()
    p["thumbnail"]["accent"] = "INVENTÉ"
    assert any("accent" in e for e in reel.validate_plan(p))


# ------------------------------------------------------------------ schedule

def test_a_phrase_is_covered_by_its_chunks_without_gap_or_overlap():
    p = plan()
    tl = reel.Timeline(p["clips"])
    schedule = reel.caption_schedule(p)
    for phrase in p["phrases"]:
        a, b = tl.to_out(phrase["start"]), tl.to_out(phrase["end"])
        mine = [c for c in schedule if a - 1e-6 <= c["start"] and c["end"] <= b + 1e-6]
        assert abs(mine[0]["start"] - a) < 1e-6
        assert abs(mine[-1]["end"] - b) < 1e-6
        for prev, nxt in zip(mine, mine[1:]):
            assert abs(prev["end"] - nxt["start"]) < 1e-6


def test_a_chunk_carries_the_speaker_of_its_phrase():
    speakers = [c["speaker"] for c in reel.caption_schedule(plan())]
    assert speakers[0] == 0 and speakers[-1] == 1


def test_a_longer_chunk_stays_on_screen_longer():
    schedule = reel.caption_schedule(plan(phrases=[
        {"start": 10.0, "end": 20.0, "speaker": 0, "fr": "Un deux trois quatre. Cinq six sept huit neuf dix onze douze."}]))
    longest = max(schedule, key=lambda c: len(c["text"]))
    shortest = min(schedule, key=lambda c: len(c["text"]))
    assert longest["end"] - longest["start"] >= shortest["end"] - shortest["start"]


# ----------------------------------------------------------------- reframes
# A source can be a screen recording: for a few seconds the picture sits inside a
# player's chrome. A reframe names the rectangle that is the picture, for a window
# of source time, so the passage can be kept without publishing the chrome.

RECT = [0, 114, 872, 491]


def test_a_clip_without_reframes_is_one_piece_left_as_it_is():
    assert reel.video_pieces([1.0, 10.0], []) == [(1.0, 10.0, None)]


def test_a_reframe_window_splits_its_clip_into_pieces_in_order():
    window = {"start": 2.0, "end": 4.0, "rect": RECT}
    pieces = reel.video_pieces([1.0, 10.0], [window])
    assert pieces == [(1.0, 2.0, None), (2.0, 4.0, window), (4.0, 10.0, None)]


def test_a_reframe_window_is_clamped_to_the_clip_and_ignored_outside_it():
    window = {"start": 0.0, "end": 3.0, "rect": RECT}
    windows = [window, {"start": 20.0, "end": 30.0, "rect": [0, 0, 16, 9]}]
    assert reel.video_pieces([1.0, 10.0], windows) == [(1.0, 3.0, window), (3.0, 10.0, None)]


def test_a_well_formed_reframe_is_accepted():
    assert reel.validate_plan(plan(reframes=[{"start": 10.0, "end": 12.0, "rect": RECT}])) == []


def test_a_reframe_needs_a_rectangle_of_four_positive_sizes():
    errors = reel.validate_plan(plan(reframes=[{"start": 10.0, "end": 12.0, "rect": [0, 0, 0, 9]}]))
    assert any("reframes[0]" in e for e in errors)


def test_a_reframe_may_hold_a_still_instead_of_a_rectangle():
    window = {"start": 10.0, "end": 12.0, "still_at": 15.0}
    assert reel.validate_plan(plan(reframes=[window])) == []
    assert reel.video_pieces([10.0, 20.0], [window]) == [(10.0, 12.0, window), (12.0, 20.0, None)]


def test_a_reframe_with_neither_rectangle_nor_still_is_refused():
    errors = reel.validate_plan(plan(reframes=[{"start": 10.0, "end": 12.0}]))
    assert any("reframes[0]" in e for e in errors)


def test_overlapping_reframes_are_refused_because_one_instant_has_one_frame():
    errors = reel.validate_plan(plan(reframes=[{"start": 10.0, "end": 13.0, "rect": RECT},
                                               {"start": 12.0, "end": 14.0, "rect": RECT}]))
    assert any("reframes" in e for e in errors)


# ------------------------------------------------------------- rendered files

def _synthetic_source(path):
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=size=640x360:rate=25:duration=12",
         "-f", "lavfi", "-i", "sine=frequency=440:duration=12", "-shortest",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(path)],
        check=True)


def _probe(path, entries):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", entries, "-of", "json", str(path)],
        check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def test_the_reel_is_a_vertical_1080_by_1920_and_as_long_as_the_clips():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        src = tmp / "source.mp4"
        _synthetic_source(src)
        p = plan(source=str(src), clips=[[1.0, 4.0], [7.0, 10.0]],
                 phrases=[{"start": 1.0, "end": 4.0, "speaker": 0, "fr": "Bonne question, je ne suis pas sûr."},
                          {"start": 7.0, "end": 10.0, "speaker": 1, "fr": "Ce système a été créé."}])
        p["thumbnail"]["frame_at"] = 2.0
        out = tmp / "reel.mp4"
        reel.render_reel(p, out)
        info = _probe(out, "stream=width,height:format=duration")
        video = [s for s in info["streams"] if "width" in s][0]
        assert (video["width"], video["height"]) == (1080, 1920)
        assert abs(float(info["format"]["duration"]) - 6.0) < 0.2


def _split_source(path):
    """Left half red, right half blue: which half fills the frame says what was kept."""
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "color=red:size=320x360:rate=25:duration=6",
         "-f", "lavfi", "-i", "color=blue:size=320x360:rate=25:duration=6",
         "-f", "lavfi", "-i", "sine=frequency=440:duration=6",
         "-filter_complex", "[0:v][1:v]hstack[v]", "-map", "[v]", "-map", "2:a", "-shortest",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(path)],
        check=True)


def _pixel_at(video, instant, xy):
    from PIL import Image
    with tempfile.TemporaryDirectory() as tmp:
        still = pathlib.Path(tmp) / "f.png"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(instant), "-i", str(video),
                        "-frames:v", "1", str(still)], check=True)
        return Image.open(still).convert("RGB").getpixel(xy)


def test_a_reframed_window_shows_only_its_rectangle_and_the_rest_is_untouched():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        src = tmp / "source.mp4"
        _split_source(src)
        p = plan(source=str(src), clips=[[0.0, 4.0]],
                 phrases=[{"start": 0.0, "end": 4.0, "speaker": 0, "fr": "Bonne question."}],
                 reframes=[{"start": 0.0, "end": 2.0, "rect": [0, 0, 320, 180]}])
        out = tmp / "reel.mp4"
        reel.render_reel(p, out)
        right_of_centre = (800, reel.FRAME_CENTRE_Y)
        red, _, blue = _pixel_at(out, 1.0, right_of_centre)
        assert red > 150 and blue < 100, "inside the window the red quarter fills the frame"
        red, _, blue = _pixel_at(out, 3.0, right_of_centre)
        assert blue > 150 and red < 100, "after the window the whole source is back"
        duration = float(_probe(out, "format=duration")["format"]["duration"])
        assert abs(duration - 4.0) < 0.2


def _red_then_blue_source(path):
    """Red for three seconds, then blue: the colour on screen says which instant is shown."""
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "color=red:size=640x360:rate=25:duration=3",
         "-f", "lavfi", "-i", "color=blue:size=640x360:rate=25:duration=3",
         "-f", "lavfi", "-i", "sine=frequency=440:duration=6",
         "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]", "-map", "[v]", "-map", "2:a", "-shortest",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(path)],
        check=True)


def test_a_still_window_holds_the_frame_it_names_for_its_whole_length():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        src = tmp / "source.mp4"
        _red_then_blue_source(src)
        p = plan(source=str(src), clips=[[0.0, 4.0]],
                 phrases=[{"start": 0.0, "end": 4.0, "speaker": 0, "fr": "Bonne question."}],
                 reframes=[{"start": 0.0, "end": 2.0, "still_at": 4.5}])
        out = tmp / "reel.mp4"
        reel.render_reel(p, out)
        centre = (540, reel.FRAME_CENTRE_Y)
        red, _, blue = _pixel_at(out, 1.0, centre)
        assert blue > 150 and red < 100, "inside the window the blue still stands in for the red"
        red, _, blue = _pixel_at(out, 2.5, centre)
        assert red > 150 and blue < 100, "after the window the source plays again"
        duration = float(_probe(out, "format=duration")["format"]["duration"])
        assert abs(duration - 4.0) < 0.2


def _count_white_pixels(video, instant, rows):
    from PIL import Image
    with tempfile.TemporaryDirectory() as tmp:
        still = pathlib.Path(tmp) / "f.png"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", str(instant), "-i", str(video),
                        "-frames:v", "1", str(still)], check=True)
        band = Image.open(still).convert("RGB").crop((0, rows[0], reel.WIDTH, rows[1]))
        return sum(1 for r, g, b in band.getdata() if min(r, g, b) > 235)


def test_the_banner_stands_above_the_frame_for_its_duration_then_leaves():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        src = tmp / "source.mp4"
        _split_source(src)
        p = plan(source=str(src), clips=[[0.0, 5.0]],
                 phrases=[{"start": 0.0, "end": 5.0, "speaker": 2, "fr": "Je dois faire une pause."}],
                 banner={"text": "Affirmation débattue : le racisme systémique sert d'excuse pour éviter la responsabilité personnelle.",
                         "duration": 3})
        out = tmp / "reel.mp4"
        reel.render_reel(p, out)
        above_frame = (reel.BANNER_Y, reel.FRAME_CENTRE_Y - reel.FRAME_BOX_HEIGHT // 2)
        assert _count_white_pixels(out, 1.0, above_frame) > 300, "the sentence is drawn above the picture"
        assert _count_white_pixels(out, 4.0, above_frame) == 0, "after its duration the top is clear again"


def test_the_thumbnail_is_a_vertical_1080_by_1920_png():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        src = tmp / "source.mp4"
        _synthetic_source(src)
        p = plan(source=str(src))
        p["thumbnail"]["frame_at"] = 3.0
        out = tmp / "cover.png"
        reel.render_thumbnail(p, out)
        from PIL import Image
        assert Image.open(out).size == (1080, 1920)


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
