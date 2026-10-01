#!/usr/bin/env python3
"""Transcribe a video with word timestamps, locally.

    <venv>/bin/python transcribe.py VIDEO OUT.json [--model small.en] [--lang en]

Needs `faster-whisper` and an `ffmpeg` on the PATH. The audio is decoded by ffmpeg
and handed over as an array: faster-whisper's own decoder (PyAV) fails on some
releases with `open() got an unexpected keyword argument 'metadata_errors'`, and
the failure has nothing to do with the video.

Segment boundaries are coarse and can merge two overlapping speakers. **Cut on the
word times, never on the segment times.**
"""
import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

SAMPLE_RATE = 16000


def decode(video):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", video, "-vn", "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    video, out = argv[1], argv[2]
    model = argv[argv.index("--model") + 1] if "--model" in argv else "small.en"
    lang = argv[argv.index("--lang") + 1] if "--lang" in argv else "en"
    segments, _ = WhisperModel(model, device="cpu", compute_type="int8").transcribe(
        decode(video), language=lang, word_timestamps=True)
    rows = []
    for s in segments:
        rows.append({
            "start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
            "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)} for w in s.words],
        })
        print(f"{s.start:7.2f} {s.end:7.2f} {s.text.strip()}")
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(rows, handle, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
