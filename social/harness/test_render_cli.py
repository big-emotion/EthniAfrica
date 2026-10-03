"""Checks the headless render CLI, the engine's one door for a caller with no corpus.

    ./venv/bin/python test_render_cli.py

The caller (the portal's runner) hands over a folder of JSON and images and a
brand kit, and gets files back. What it must be able to rely on:

- **Exit codes mean something.** 0 rendered, 2 the input was wrong (the JSON error
  list on stderr names each fault), 3 the input was fine and the render failed.
- **The brand is the kit's.** Under a fictional kit all three kinds render with no
  EthniAfrica font opened and no EthniAfrica string drawn.
- **EthniAfrica does not move.** Its carousel through the CLI is the pixels of the
  pre-kit engine (`fixtures/brand-kit-baseline.json`), not merely close to them.
- **It is deterministic.** Two runs write the same bytes.
"""
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image

HARNESS = pathlib.Path(__file__).resolve().parent
CLI = HARNESS / "render_cli.py"
BASELINE = HARNESS / "fixtures" / "brand-kit-baseline.json"


def _materialise(directory, *, pillar=None, kind="carousel"):
    """Write a deck and its pictures the way the portal would hand them over."""
    import layout_fixtures as fx

    deck = fx.story_deck()
    assets = directory / "assets"
    assets.mkdir(parents=True)
    makers = {"p.png": fx.portrait_image, "d.png": fx.document_image,
              "g.png": fx.ground_image}
    for card in deck["cartes"]:
        name = card["image"]["fichier"]
        if not (assets / name).exists():
            makers[name]().save(assets / name)
    if pillar:
        deck["pilier"] = pillar
    if kind == "image":
        deck["cartes"] = deck["cartes"][1:2]
        deck["cartes"][0]["rang"] = 1
        deck["cartes"][0]["role"] = "serie"
    if kind == "reel":
        deck["montage"] = True
        deck["cartes"] = deck["cartes"][:2]
        deck["cartes"][1]["role"] = "bascule"
        for card in deck["cartes"]:
            card["duree"] = 0.4
            card["narration"] = "Une phrase lue à voix haute."
    source = directory / "in"
    source.mkdir()
    name = {"carousel": "cards.json", "image": "image.json", "reel": "scenes.json"}[kind]
    (source / name).write_text(json.dumps(deck), encoding="utf-8")
    return source, assets


def _run(kind, source, assets, out, kit=None, extra_env=None):
    args = [sys.executable, str(CLI), "--kind", kind, "--input", str(source),
            "--assets", str(assets), "--out", str(out)]
    if kit:
        args += ["--kit", str(kit)]
    return subprocess.run(args, cwd=HARNESS, capture_output=True, text=True,
                          env={**os.environ, **(extra_env or {})})


def _digest(path):
    return hashlib.sha256(Image.open(path).convert("RGB").tobytes()).hexdigest()


def _tree(out):
    return {str(p.relative_to(out)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(out.rglob("*")) if p.is_file()}


# ------------------------------------------------------------------ outputs

def test_a_carousel_gives_both_formats_for_every_card():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp)
        done = _run("carousel", source, assets, tmp / "out")
        assert done.returncode == 0, done.stderr[-1500:]
        sizes = {(p.parent.name, Image.open(p).size) for p in (tmp / "out").rglob("*.png")}
        assert sizes == {("4x5", (1080, 1350)), ("9x16", (1080, 1920))}, sizes
        assert len(list((tmp / "out" / "4x5").glob("*.png"))) == 5
        manifest = json.loads((tmp / "out" / "manifest.json").read_text(encoding="utf-8"))
        assert "4x5/card-01.png" in manifest["files"], manifest


def test_ethniafrica_carousel_through_the_cli_is_pixel_identical_to_the_pre_kit_engine():
    expected = json.loads(BASELINE.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp)
        assert _run("carousel", source, assets, tmp / "out").returncode == 0
        for rank in range(1, 6):
            got = _digest(tmp / "out" / "4x5" / f"card-{rank:02d}.png")
            assert got == expected[f"story-{rank:02d}"], f"card {rank} moved"


def test_an_image_gives_4x5_and_1x1():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp, kind="image")
        done = _run("image", source, assets, tmp / "out")
        assert done.returncode == 0, done.stderr[-1500:]
        assert Image.open(tmp / "out" / "image-4x5.png").size == (1080, 1350)
        assert Image.open(tmp / "out" / "image-1x1.png").size == (1080, 1080)


def test_a_reel_without_audio_is_a_silent_captioned_mp4():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp, kind="reel")
        done = _run("reel", source, assets, tmp / "out")
        assert done.returncode == 0, done.stderr[-1500:]
        probe = json.loads(subprocess.run(
            ["ffprobe", "-v", "error", "-show_streams", "-of", "json",
             str(tmp / "out" / "reel.mp4")], capture_output=True, text=True).stdout)
        kinds = {s["codec_type"]: s for s in probe["streams"]}
        assert (kinds["video"]["width"], kinds["video"]["height"]) == (1080, 1920), kinds
        assert "audio" in kinds, "a silent track keeps platforms from rejecting the file"


def test_two_runs_write_the_same_bytes():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp)
        assert _run("carousel", source, assets, tmp / "a").returncode == 0
        assert _run("carousel", source, assets, tmp / "b").returncode == 0
        assert _tree(tmp / "a") == _tree(tmp / "b")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp, kind="reel")
        assert _run("reel", source, assets, tmp / "a").returncode == 0
        assert _run("reel", source, assets, tmp / "b").returncode == 0
        assert _tree(tmp / "a") == _tree(tmp / "b"), "the mp4 must be reproducible"


# ----------------------------------------------------------------- exit codes

def test_exit_2_lists_every_fault_as_json_on_stderr():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp)
        deck = json.loads((source / "cards.json").read_text(encoding="utf-8"))
        deck["cartes"][0]["image"]["fichier"] = "absent.png"
        deck["cartes"][1].pop("titre")
        deck["pilier"] = "Pilier inconnu"
        (source / "cards.json").write_text(json.dumps(deck), encoding="utf-8")
        done = _run("carousel", source, assets, tmp / "out")
        assert done.returncode == 2, (done.returncode, done.stderr[-800:])
        faults = json.loads(done.stderr)["errors"]
        text = json.dumps(faults)
        assert "absent.png" in text and "titre" in text and "Pilier inconnu" in text, faults
        assert not (tmp / "out").exists() or not list((tmp / "out").rglob("*.png"))


def test_exit_2_on_malformed_json_a_missing_file_and_a_bad_kit():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp)
        kit = tmp / "bad-kit.json"
        kit.write_text(json.dumps({"name": "X"}), encoding="utf-8")
        bad_kit = _run("carousel", source, assets, tmp / "o1", kit=kit)
        assert bad_kit.returncode == 2 and "tagline" in bad_kit.stderr, bad_kit.stderr

        (source / "cards.json").write_text("{ not json", encoding="utf-8")
        assert _run("carousel", source, assets, tmp / "o2").returncode == 2

        (source / "cards.json").unlink()
        done = _run("carousel", source, assets, tmp / "o3")
        assert done.returncode == 2 and "cards.json" in done.stderr, done.stderr


def test_exit_3_when_the_input_is_valid_and_the_render_fails():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        source, assets = _materialise(tmp, kind="reel")
        deck = json.loads((source / "scenes.json").read_text(encoding="utf-8"))
        deck["audio"] = "voice.mp3"
        (source / "scenes.json").write_text(json.dumps(deck), encoding="utf-8")
        (assets / "voice.mp3").write_text("not audio", encoding="utf-8")
        done = _run("reel", source, assets, tmp / "out")
        assert done.returncode == 3, (done.returncode, done.stderr[-800:])
        assert json.loads(done.stderr.splitlines()[-1])["error"]


# ---------------------------------------------------------------- a second kit

def _probe(kind):
    """Run the CLI under the fictional kit, recording fonts opened and strings drawn."""
    from test_brand_kit import _build_fictional_kit

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        kit_dir = tmp / "kit"
        kit_dir.mkdir()
        kit = _build_fictional_kit(kit_dir)
        source, assets = _materialise_in(tmp, kind)
        done = subprocess.run(
            [sys.executable, str(pathlib.Path(__file__).resolve()), "--probe", kind,
             str(source), str(assets), str(kit), str(tmp / "out")],
            cwd=HARNESS, capture_output=True, text=True)
        assert done.returncode == 0, done.stderr[-1500:]
        seen = json.loads(done.stdout.splitlines()[-1])
        outputs = [p for p in (tmp / "out").rglob("*") if p.is_file()]
        seen["blobs"] = [p.read_bytes() for p in outputs]
        return seen


def _materialise_in(tmp, kind):
    work = tmp / "work"
    work.mkdir()
    return _materialise(work, pillar="Atelier", kind=kind)


def test_a_fictional_kit_renders_all_three_kinds_with_nothing_of_ethniafrica():
    for kind in ("carousel", "image", "reel"):
        seen = _probe(kind)
        assert seen["fonts"], kind
        for font in seen["fonts"]:
            assert "ethniafrica" not in font.lower(), (kind, font)
        assert not any(n in f for f in seen["fonts"] for n in ("Anton", "Fraunces", "Nunito")), kind
        leaked = [t for t in seen["texts"] if "ethniafrica" in t.lower()]
        assert not leaked, (kind, leaked[:3])
        assert any("luneatelier.example" in t.lower() for t in seen["texts"]), kind
        assert seen["blobs"], kind
        for blob in seen["blobs"]:
            assert b"ethniafrica" not in blob.lower(), kind


def _run_probe(argv):
    from PIL import ImageDraw, ImageFont

    kind, source, assets, kit, out = argv
    fonts, texts = [], []
    truetype, text = ImageFont.truetype, ImageDraw.ImageDraw.text

    def spy_truetype(path, *a, **k):
        fonts.append(str(path))
        return truetype(path, *a, **k)

    def spy_text(self, xy, string, *a, **k):
        texts.append(str(string))
        return text(self, xy, string, *a, **k)

    ImageFont.truetype, ImageDraw.ImageDraw.text = spy_truetype, spy_text
    import render_cli

    code = render_cli.main(["--kind", kind, "--input", source, "--assets", assets,
                            "--kit", kit, "--out", out])
    assert code == 0, code
    print(json.dumps({"fonts": sorted(set(fonts)), "texts": texts}))


def main():
    if "--probe" in sys.argv:
        _run_probe(sys.argv[sys.argv.index("--probe") + 1:])
        return 0
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for t in tests:
        try:
            t()
        except Exception as e:  # noqa: BLE001 — a runner reports, it does not raise
            failed += 1
            print(f"FAIL  {t.__name__}\n      {e}", flush=True)
        else:
            print(f"ok    {t.__name__}", flush=True)
    print(f"\n{len(tests) - failed}/{len(tests)} passent", flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
