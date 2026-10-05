"""The brand the engine draws, read from one JSON file.

Everything that makes a card *EthniAfrica's* rather than anybody's — the name, the
tagline, the logo, the faces, the exit address, the footer, which pillar takes
which accent — lives in `brand-kit.json`. The engine keeps what is true of any
card: geometry, the type scale, the licence arithmetic, the contrast rules.

`ETHNI_BRAND_KIT` points at another kit file and is read once, at import: the
engine's constants are bound then, so a second brand is a second process, not a
switch flipped mid-render. Paths inside a kit (faces, logo) are relative to the
kit's own directory, so a kit travels as a folder.

A kit missing a key is refused by name. The alternative — falling back to the
EthniAfrica value — would put EthniAfrica's footer on someone else's cards
without a single error.
"""
import json
import os
import pathlib

HARNESS = pathlib.Path(__file__).resolve().parent
DEFAULT_KIT = HARNESS / "brand-kit.json"
KIT_ENV = "ETHNI_BRAND_KIT"

REQUIRED = ("name", "tagline", "logo", "wordmark_face", "call_to_action", "footer_line",
            "faces", "pillar_accent", "accent_tokens")
FACE_ROLES = ("anton", "nunito")

_active = None


def load(path):
    """Read and validate a kit; resolve its file paths to absolute ones."""
    path = pathlib.Path(path).resolve()
    kit = json.loads(path.read_text(encoding="utf-8"))
    missing = [key for key in REQUIRED if key not in kit]
    if missing:
        raise ValueError(f"{path.name}: missing {', '.join(missing)}")
    if set(kit["faces"]) != set(FACE_ROLES):
        raise ValueError(f"{path.name}: `faces` must name exactly {', '.join(FACE_ROLES)}")

    here = path.parent
    kit = dict(kit, retired_pillars=kit.get("retired_pillars", {}))
    kit["faces"] = {role: str(here / name) for role, name in kit["faces"].items()}
    kit["wordmark_face"] = str(here / kit["wordmark_face"])
    kit["logo"] = str(here / kit["logo"])
    # JSON has no tuple keys, so "ocre|nuit" stands for ("ocre", "nuit").
    kit["accent_tokens"] = dict(kit["accent_tokens"])
    return kit


def active():
    """The kit this process draws: `ETHNI_BRAND_KIT`, else EthniAfrica's own."""
    global _active
    if _active is None:
        _active = load(os.environ.get(KIT_ENV) or DEFAULT_KIT)
    return _active
