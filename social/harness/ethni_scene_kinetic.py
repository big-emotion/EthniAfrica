"""Kinetic text: lines that arrive one after another, each on its narrated word.

A card is the scene's title as its header and up to four lines stacked top to bottom. A line fades in
and rises into place, easing out with no overshoot: a bounce would make a restitution look playful
(the reasoning of `ethni_type`'s plates, which this borrows). Lines are laid on with a coverage mask,
so they hold over any picture and a dissolve can fade them independently of the ground.
"""
from PIL import Image, ImageDraw

from ethni_scene_plan import accent_span, require
from ethni_type import ENTER_RISE, ease

ARRIVAL = .5                     # slower than a plate's 0.38 s: a line is read, not glimpsed
TOP, PITCH = 540, 200            # first line, and the step between lines
DETAIL_TOP, DETAIL_HEIGHT = 80, 84
BLOCK_HEIGHT = DETAIL_TOP+DETAIL_HEIGHT  # a line and its detail: 164 px, so 36 px of air before the next


def arrival(renderer, line, local):
    """0 before the cue, 1 once settled. Reduced motion keeps the cue and drops the movement."""
    if local < line["at"]:
        return 0
    return 1 if renderer.reduced_motion else ease((local-line["at"])/ARRIVAL)


def coverage(renderer, line, width):
    """The line's glyph coverage per ink : (colour, mask) pairs, the accent word apart from the rest."""
    palette, face = renderer.palette, renderer.face("Paire — terme")
    text, span = line["text"], accent_span(line)
    pieces = [(text, "white")] if not span else [
        (text[:span[0]], "white"), (text[span[0]:span[1]], "gold"), (text[span[1]:], "white")]
    layers = {}
    x = 0
    baseline = face.getmetrics()[0]  # the font's own, so every piece of the line stands on the same one
    for piece, ink in pieces:
        mask = layers.setdefault(ink, Image.new("L", (width, BLOCK_HEIGHT), 0))
        ImageDraw.Draw(mask).text((x, baseline), piece, font=face, fill=255, anchor="ls")
        x += ImageDraw.Draw(mask).textlength(piece, font=face)
    require(x <= width, f"Text overflow in kinetic line: {text[:80]}")
    if "detail" in line:
        mask = layers.setdefault("night-ink-2", Image.new("L", (width, BLOCK_HEIGHT), 0))
        renderer.paragraph(ImageDraw.Draw(mask), line["detail"], (0, DETAIL_TOP, width, DETAIL_HEIGHT), "Corps", 255)
    return [(palette[ink], mask) for ink, mask in layers.items()]


def draw_kinetic(renderer, image, scene, local, opacity=1.0):
    """Lay every line that has reached its cue onto `image`. `opacity` fades the whole card, for a dissolve."""
    width = renderer.right-renderer.left
    for index, line in enumerate(scene["kinetic"]["lines"]):
        shown = arrival(renderer, line, local)
        if shown <= 0 or opacity <= 0:
            continue
        top = TOP+index*PITCH+round(ENTER_RISE*(1-shown))
        for colour, mask in coverage(renderer, line, width):
            image.paste(colour, (renderer.left, top), mask.point(lambda v: round(v*shown*opacity)))


def cues(scene):
    """The instants a preflight must look at: each cue, halfway through its arrival, and settled."""
    return [line["at"]+delta for line in scene["kinetic"]["lines"] for delta in (0, ARRIVAL/2, ARRIVAL)]
