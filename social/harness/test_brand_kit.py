"""Checks that the brand lives in `brand-kit.json`, not in the engine.

    ./venv/bin/python test_brand_kit.py

Three promises, each a way the extraction could fail quietly:

- **EthniAfrica does not change.** Every reference render is hashed on the engine
  as it was before the kit existed (`fixtures/brand-kit-baseline.json`). The
  refactor is allowed 0.1 % of pixels; the hashes ask for none, because moving a
  literal into a file has no reason to move a pixel.
- **A second brand is really a second brand.** A fictional kit, with its own faces
  and logo, is rendered in a fresh interpreter while every font opened and every
  string drawn is recorded. Nothing of EthniAfrica may be among them: a name left
  in a footer is invisible to anyone who only looks at the cards the project's
  own kit produces.
- **The kit is read, not mirrored.** The engine's constants equal the kit's
  values, so editing the file is what changes the render.

Run `./venv/bin/python test_brand_kit.py --write-baseline` only to re-pin the
hashes after a deliberate change of the EthniAfrica look.
"""
import copy
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

HARNESS = pathlib.Path(__file__).resolve().parent
BASELINE = HARNESS / "fixtures" / "brand-kit-baseline.json"
KIT_ENV = "ETHNI_BRAND_KIT"


def _reference_decks():
    """Every deck whose pixels carry brand: the footer, the call to action, the
    watermark, the lockup and the reel's opening and closing."""
    import layout_boards as lb
    import layout_fixtures as fx

    decks = lb.decks()
    credited = fx.story_deck()
    for card in credited["cartes"]:
        card["image"].update({"credit": "Jane Doe", "depot": "Wikimedia Commons",
                              "licence": "CC BY-SA 4.0"})
    credited["cartes"][-1]["role"] = "bascule"
    credited["licence_sortie"] = "CC BY-SA 4.0"
    decks["credit-bascule"] = credited
    return decks


def reference_renders(pillar=None):
    """(name, RGB image) for the whole reference set, under the active kit."""
    import ethni_brand
    import ethni_compose as gab
    import layout_fixtures as fx
    from PIL import Image

    for name, deck in _reference_decks().items():
        if pillar:
            deck["pilier"] = pillar
        images = fx.images_for(deck)
        for card in deck["cartes"]:
            im = gab.composer(card, deck, "carrousel", image=images[card["rang"]])
            yield f"{name}-{card['rang']:02d}", im.convert("RGB")

    for role in ("ouverture", "bascule"):
        deck = fx.story_deck()
        deck["montage"] = True
        if pillar:
            deck["pilier"] = pillar
        card = copy.deepcopy(deck["cartes"][0])
        card["role"] = role
        im = gab.peindre_video(card, deck, image=fx.images_for(deck)[card["rang"]])
        yield f"video-{role}", im.convert("RGB")

    ground = Image.new("RGBA", (1080, 1920), (30, 24, 20, 255))
    ethni_brand.draw_lockup(ground)
    yield "lockup", ground.convert("RGB")


def _digest(image):
    return hashlib.sha256(image.tobytes()).hexdigest()


def write_baseline():
    BASELINE.parent.mkdir(exist_ok=True)
    hashes = {name: _digest(im) for name, im in reference_renders()}
    BASELINE.write_text(json.dumps(hashes, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{len(hashes)} hashes written")


# ---------------------------------------------------------------- the kit

def test_the_kit_declares_everything_the_engine_draws_from_it():
    import ethni_kit

    kit = ethni_kit.load(HARNESS / "brand-kit.json")
    for key in ("name", "tagline", "logo", "call_to_action", "footer_line", "faces",
                "wordmark_face", "pillar_accent", "accent_tokens"):
        assert key in kit, f"brand-kit.json lacks `{key}`"
    assert set(kit["faces"]) == {"anton", "nunito"}, kit["faces"]


def test_the_engine_reads_the_kit_it_was_given():
    import ethni_brand
    import ethni_compose as gab
    import ethni_kit
    import ethni_tokens as tk

    kit = ethni_kit.active()
    assert gab.APPEL_DEFAUT == kit["call_to_action"]
    assert ethni_brand.TAGLINE == kit["tagline"]
    assert tk.PILIER_ACCENT == kit["pillar_accent"]
    assert {f"{a}|{f}": t for (a, f), t in tk.ACCENT_TOKEN.items()} == kit["accent_tokens"]
    for role, path in gab.FACES.items():
        assert pathlib.Path(path).name == pathlib.Path(kit["faces"][role]).name, role


def test_a_kit_missing_a_key_is_refused_by_name():
    import ethni_kit

    with tempfile.TemporaryDirectory() as tmp:
        broken = pathlib.Path(tmp) / "brand-kit.json"
        broken.write_text(json.dumps({"name": "X"}), encoding="utf-8")
        try:
            ethni_kit.load(broken)
        except ValueError as e:
            assert "tagline" in str(e), e
        else:
            raise AssertionError("an incomplete kit was accepted")


# ----------------------------------------------------- EthniAfrica unchanged

def test_ethniafrica_decks_are_pixel_identical_to_the_pre_kit_engine():
    expected = json.loads(BASELINE.read_text(encoding="utf-8"))
    got = {name: _digest(im) for name, im in reference_renders()}
    assert set(got) == set(expected), sorted(set(got) ^ set(expected))
    moved = sorted(name for name in got if got[name] != expected[name])
    assert not moved, f"{len(moved)}/{len(got)} renders moved: {moved[:5]}"


# ------------------------------------------------------------- a second kit

FICTIONAL = {
    "name": "Lune Atelier",
    "tagline": "Des ateliers sous la lune",
    "logo": "mark.png",
    "call_to_action": "luneatelier.example",
    "footer_line": "luneatelier.example · @luneatelier",
    "faces": {"anton": "fonts/display.ttf", "nunito": "fonts/body.ttf"},
    "wordmark_face": "fonts/wordmark.ttf",
    "pillar_accent": {"Atelier": "teal"},
    "accent_tokens": {
        "teal|nuit": "--afh-cat-teal", "teal|parchemin": "--afh-cat-teal-ink",
        "ocre|nuit": "--afh-night-ocre-soft", "ocre|parchemin": "--afh-cat-ocre-ink",
        "terre|nuit": "--afh-cat-terre-ink-night", "terre|parchemin": "--afh-cat-terre-ink",
        "perv|nuit": "--afh-cat-perv", "perv|parchemin": "--afh-cat-perv-ink",
    },
    "retired_pillars": {},
}


def _build_fictional_kit(directory):
    """A kit whose files carry nothing of the project's name, fonts included."""
    from PIL import Image, ImageDraw

    (directory / "fonts").mkdir()
    shutil.copy(HARNESS / "fonts" / "Montserrat-ExtraBold.ttf", directory / "fonts" / "display.ttf")
    shutil.copy(HARNESS / "fonts" / "NotoSans-Bold.ttf", directory / "fonts" / "body.ttf")
    shutil.copy(HARNESS / "fonts" / "TikTokSans-Bold.ttf", directory / "fonts" / "wordmark.ttf")
    mark = Image.new("RGBA", (120, 120), (0, 0, 0, 0))
    ImageDraw.Draw(mark).ellipse((10, 10, 110, 110), fill=(120, 160, 255, 255))
    mark.save(directory / "mark.png")
    path = directory / "brand-kit.json"
    path.write_text(json.dumps(FICTIONAL, indent=2), encoding="utf-8")
    return path


def test_a_second_kit_renders_with_nothing_of_ethniafrica():
    with tempfile.TemporaryDirectory() as tmp:
        kit_path = _build_fictional_kit(pathlib.Path(tmp))
        out = subprocess.run(
            [sys.executable, str(pathlib.Path(__file__).resolve()), "--probe"],
            cwd=HARNESS, capture_output=True, text=True,
            env={**os.environ, KIT_ENV: str(kit_path)},
        )
        assert out.returncode == 0, out.stderr[-2000:]
        seen = json.loads(out.stdout.splitlines()[-1])

    assert seen["fonts"], "the probe saw no font opened"
    for font in seen["fonts"]:
        assert "ethniafrica" not in font.lower(), font
    assert any(f.endswith("display.ttf") for f in seen["fonts"]), seen["fonts"]
    assert any(f.endswith("wordmark.ttf") for f in seen["fonts"]), seen["fonts"]
    assert not any("Anton" in f or "Fraunces" in f or "Nunito" in f for f in seen["fonts"]), seen["fonts"]

    drawn = " | ".join(seen["texts"])
    leaked = [t for t in seen["texts"] if "ethniafrica" in t.lower()]
    assert not leaked, f"drawn under the second kit: {leaked[:3]}"
    for own in ("luneatelier.example", "Des ateliers sous la lune", "Lune Atelier"):
        assert own.upper() in drawn.upper(), f"{own!r} never drawn: {drawn[:300]}"


def test_a_second_kit_changes_the_pixels_not_just_the_strings():
    expected = json.loads(BASELINE.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory() as tmp:
        kit_path = _build_fictional_kit(pathlib.Path(tmp))
        out = subprocess.run(
            [sys.executable, str(pathlib.Path(__file__).resolve()), "--hashes"],
            cwd=HARNESS, capture_output=True, text=True,
            env={**os.environ, KIT_ENV: str(kit_path)},
        )
    assert out.returncode == 0, out.stderr[-2000:]
    got = json.loads(out.stdout.splitlines()[-1])
    assert got["lockup"] != expected["lockup"]
    assert got["video-bascule"] != expected["video-bascule"]


def _probe():
    """Run under the fictional kit: print every font opened and every string drawn."""
    from PIL import ImageDraw, ImageFont

    fonts, texts = [], []
    truetype, text = ImageFont.truetype, ImageDraw.ImageDraw.text

    def spy_truetype(path, *a, **k):
        fonts.append(str(path))
        return truetype(path, *a, **k)

    def spy_text(self, xy, string, *a, **k):
        texts.append(str(string))
        return text(self, xy, string, *a, **k)

    ImageFont.truetype, ImageDraw.ImageDraw.text = spy_truetype, spy_text
    for _ in reference_renders(pillar="Atelier"):
        pass
    print(json.dumps({"fonts": sorted(set(fonts)), "texts": texts}))


def main():
    if "--write-baseline" in sys.argv:
        write_baseline()
        return 0
    if "--probe" in sys.argv:
        _probe()
        return 0
    if "--hashes" in sys.argv:
        print(json.dumps({n: _digest(im) for n, im in reference_renders(pillar="Atelier")}))
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
