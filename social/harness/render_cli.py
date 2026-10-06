#!/usr/bin/env python3
"""Headless render of one piece under any brand kit — the engine's one door for a caller.

    ./venv/bin/python render_cli.py --kind carousel|image|reel \\
        --input <dir holding cards.json | image.json | scenes.json> \\
        --assets <dir holding the pictures> --kit <brand-kit.json> --out <dir>

The contract, its input schemas and the output layout are in `RENDER-CLI.md`.

Exit codes: 0 rendered; 2 the input is wrong, with `{"errors": [{path, message}]}`
on stderr; 3 the input was fine and the render failed, with `{"error": …}` as the
last stderr line.

What this deliberately does not do. The project-folder scripts (`ethni_carrousel2.py`
and `ethni_montage.py`) resolve a workshop on the operator's disk and run the
publication gates — licences, enlargement, layout quota, message audit — that
need that corpus. This door takes everything it needs as arguments and runs no
gate: a caller that publishes verifies licences and sources itself, before and
after. It never touches the network.
"""
import argparse
import json
import os
import pathlib
import subprocess
import sys
import tempfile

HARNESS = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HARNESS))

INPUT_FILE = {"carousel": "cards.json", "image": "image.json", "reel": "scenes.json"}
THEMES = ("nuit", "parchemin")
FPS = 25
REEL_SIZE = "1080x1920"
MAX_SCENE_SECONDS = 60


class InvalidInput(Exception):
    """Carries the whole list of faults, so the caller fixes them in one pass."""

    def __init__(self, errors):
        super().__init__(f"{len(errors)} fault(s)")
        self.errors = errors


class _Parser(argparse.ArgumentParser):
    def error(self, message):
        _fail_input([{"path": "argv", "message": message}])


def _fail_input(errors):
    print(json.dumps({"errors": errors}, ensure_ascii=False), file=sys.stderr)
    raise SystemExit(2)


def _fault(path, message):
    return {"path": path, "message": message}


def _read_json(path, label):
    try:
        return json.loads(path.read_text(encoding="utf-8")), []
    except FileNotFoundError:
        return None, [_fault(label, f"{path.name} not found in the input folder")]
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        return None, [_fault(label, f"{path.name} is not valid JSON: {error}")]


def _check_deck(deck, kind, assets, tokens):
    """Every fault the engine would otherwise meet halfway through a render."""
    from PIL import Image

    errors = []
    if not isinstance(deck, dict):
        return [_fault("$", "the input must be a JSON object")]

    pillar = tokens.pilier_courant(str(deck.get("pilier") or ""))
    if pillar not in tokens.PILIER_ACCENT:
        errors.append(_fault("pilier", f"pillar {deck.get('pilier')!r} is not in the brand kit "
                                       f"(known: {', '.join(sorted(tokens.PILIER_ACCENT))})"))
    accents = {name for name, _ in tokens.ACCENT_TOKEN}
    if deck.get("accent") not in accents:
        errors.append(_fault("accent", f"accent {deck.get('accent')!r} is not one of "
                                       f"{', '.join(sorted(accents))}"))
    if deck.get("fond") not in THEMES:
        errors.append(_fault("fond", f"fond must be one of {', '.join(THEMES)}"))

    cards = deck.get("cartes")
    if not isinstance(cards, list) or not cards:
        return errors + [_fault("cartes", "cartes must be a non-empty list")]
    if kind == "image" and len(cards) != 1:
        errors.append(_fault("cartes", "an image holds exactly one card"))

    ranks = set()
    for index, card in enumerate(cards):
        where = f"cartes[{index}]"
        if not isinstance(card, dict):
            errors.append(_fault(where, "a card must be an object"))
            continue
        rank = card.get("rang")
        if not isinstance(rank, int) or isinstance(rank, bool) or rank in ranks:
            errors.append(_fault(f"{where}.rang", "rang must be a unique integer"))
        ranks.add(rank)
        if not isinstance(card.get("titre"), str) or not card["titre"].strip():
            errors.append(_fault(f"{where}.titre", "titre must be a non-empty string"))

        name = (card.get("image") or {}).get("fichier") if isinstance(card.get("image"), dict) else None
        if not isinstance(name, str):
            errors.append(_fault(f"{where}.image.fichier", "image.fichier must name a picture"))
        elif not (assets / name).is_file():
            errors.append(_fault(f"{where}.image.fichier", f"{name} is not in the assets folder"))
        else:
            try:
                with Image.open(assets / name) as picture:
                    picture.verify()
            except Exception as error:  # noqa: BLE001 — any decode fault is the caller's input
                errors.append(_fault(f"{where}.image.fichier", f"{name} is not a readable image: {error}"))

        if kind == "reel":
            seconds = card.get("duree")
            if (not isinstance(seconds, (int, float)) or isinstance(seconds, bool)
                    or not 0 < seconds <= MAX_SCENE_SECONDS):
                errors.append(_fault(f"{where}.duree",
                                     f"duree must be a number of seconds in (0, {MAX_SCENE_SECONDS}]"))
            if "narration" in card and not isinstance(card["narration"], str):
                errors.append(_fault(f"{where}.narration", "narration must be a string"))

    audio = deck.get("audio")
    if kind == "reel" and audio is not None:
        if not isinstance(audio, str) or not (assets / audio).is_file():
            errors.append(_fault("audio", f"{audio!r} is not in the assets folder"))
    return errors


def _load_pictures(deck, assets):
    from PIL import Image

    pictures = {}
    for card in deck["cartes"]:
        with Image.open(assets / card["image"]["fichier"]) as picture:
            pictures[card["rang"]] = picture.convert("RGB")
    return pictures


def _render_stills(kind, deck, pictures, out):
    import ethni_compose as gab

    if kind == "carousel":
        folders = {"carrousel": "4x5", "reel": "9x16"}
        names = lambda rank, folder: f"{folder}/card-{rank:02d}.png"  # noqa: E731
    else:
        folders = {"carrousel": "4x5", "linkedin": "1x1"}
        names = lambda rank, folder: f"image-{folder}.png"  # noqa: E731

    written = []
    for card in deck["cartes"]:
        for fmt_key, folder in folders.items():
            target = out / names(card["rang"], folder)
            target.parent.mkdir(parents=True, exist_ok=True)
            gab.composer(card, deck, fmt_key, image=pictures[card["rang"]]).convert("RGB").save(target)
            written.append(target)
    return written


def _render_reel(deck, pictures, assets, out):
    import ethni_compose as gab

    frames = []
    for card in deck["cartes"]:
        narration = (card.get("narration") or "").strip()
        caption = {"lignes": [narration], "pivot": ""} if narration else None
        still = gab.peindre_video(card, deck, image=pictures[card["rang"]], sous_titre=caption)
        frames.append((still.convert("RGB").tobytes(), max(1, round(card["duree"] * FPS))))

    total = sum(count for _, count in frames) / FPS
    audio_in = (["-i", str(assets / deck["audio"])] if deck.get("audio")
                else ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"])
    target = out / "reel.mp4"
    out.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", REEL_SIZE,
           "-r", str(FPS), "-i", "pipe:0", *audio_in, "-map", "0:v", "-map", "1:a",
           "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "128k", "-af", "apad", "-t", f"{total:.3f}",
           "-map_metadata", "-1", "-fflags", "+bitexact", "-flags:v", "+bitexact",
           "-flags:a", "+bitexact", "-movflags", "+faststart", str(target)]
    with tempfile.TemporaryFile() as errors:
        process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=errors)
        try:
            for blob, count in frames:
                for _ in range(count):
                    process.stdin.write(blob)
            process.stdin.close()
        except BrokenPipeError:
            pass  # ffmpeg stopped reading; its exit status and log say why
        if process.wait() != 0:
            errors.seek(0)
            raise RuntimeError(f"ffmpeg failed: {errors.read().decode(errors='replace')[-600:]}")
    return [target]


def main(argv=None):
    parser = _Parser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--kind", required=True, choices=sorted(INPUT_FILE))
    parser.add_argument("--input", required=True, type=pathlib.Path)
    parser.add_argument("--assets", required=True, type=pathlib.Path)
    parser.add_argument("--kit", type=pathlib.Path)
    parser.add_argument("--out", required=True, type=pathlib.Path)
    args = parser.parse_args(argv)

    import ethni_kit

    if args.kit:
        try:
            kit_name = ethni_kit.load(args.kit)["name"]
        except (OSError, ValueError) as error:
            _fail_input([_fault("kit", f"{args.kit.name}: {error}")])
        # Bound once at import by the engine, so it is set before the engine is imported.
        os.environ[ethni_kit.KIT_ENV] = str(args.kit.resolve())

    import ethni_tokens as tokens

    deck, errors = _read_json(args.input / INPUT_FILE[args.kind], INPUT_FILE[args.kind])
    if not errors:
        errors = _check_deck(deck, args.kind, args.assets, tokens)
    if errors:
        _fail_input(errors)

    try:
        pictures = _load_pictures(deck, args.assets)
        written = (_render_reel(deck, pictures, args.assets, args.out) if args.kind == "reel"
                   else _render_stills(args.kind, deck, pictures, args.out))
        manifest = {"kind": args.kind, "kit": ethni_kit.active()["name"],
                    "files": sorted(p.relative_to(args.out).as_posix() for p in written)}
        (args.out / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except Exception as error:  # noqa: BLE001 — every render fault maps to one exit code
        print(json.dumps({"error": f"{type(error).__name__}: {error}"}, ensure_ascii=False),
              file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    sys.exit(main())
