"""The approved social-networks outro, appended where the narration ends.

The legacy montage cues this card on the end of the last spoken sentence and holds it for
the asset's own length (§9 bis): it signs the film, it never replaces the closing. A scene
plan opts in with `"outro": true`; without it the export is exactly the narration's length.
"""
import hashlib
import subprocess

from PIL import Image

from ethni_montage import FIN, FIN_SECONDES, FIN_SHA256, FPS

WIDTH, HEIGHT = 1080, 1920


def cue(captions):
    """Seconds at which the outro cuts in: the end of the last caption, on the frame grid."""
    return round(captions[-1]["fin"]*FPS)/FPS


def total_seconds(plan, captions, duration):
    if not plan.get("outro"):
        return duration
    return max(duration, cue(captions)+FIN_SECONDES)


def frames(count):
    """The outro's first `count` frames at full size, holding the last one if the file is short."""
    digest = hashlib.sha256(FIN.read_bytes()).hexdigest()
    if not digest.startswith(FIN_SHA256):
        raise ValueError(f"The social-networks outro is not the approved asset: {digest[:14]}")
    size = WIDTH*HEIGHT*3
    pipe = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", str(FIN), "-an", "-vf", f"scale={WIDTH}:{HEIGHT},setsar=1",
         "-frames:v", str(count), "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    last = None
    try:
        for _ in range(count):
            raw = pipe.stdout.read(size)
            if len(raw) == size:
                last = Image.frombytes("RGB", (WIDTH, HEIGHT), raw)
            elif last is None:
                raise ValueError("The social-networks outro could not be read")
            yield last
    finally:
        pipe.stdout.close()
        pipe.wait()
