"""Assemble the film's master audio from the arranged timeline, and measure what was assembled.

Mixing happens on decoded samples rather than in an ffmpeg filter graph because the acceptance
criteria are measurements — how far the bed sits below the voice, how loud the excerpt is against
the narration, how much the limiter had to give up — and a number we hold is a number we can refuse on.
"""
import subprocess
import wave

import numpy as np

from ethni_scene_plan import asset_path, require

RATE = 48000
CEILING_DB = -1.0
# A limiter that has to give up more than this is hiding a bad gain choice, not protecting a mix.
MAX_LIMITER_REDUCTION_DB = 6.0
# Technical floor for a bed under speech; whether the result is *comfortable* is still a listening call.
MIN_VOICE_OVER_BED_DB = 15.0
EXCERPT_OVER_VOICE_DB = (-15.0, 10.0)
RAMP_S, GATE_S = .25, .15
FLOOR_DB = -120.0


def db(value):
    return 20*np.log10(max(float(value), 10**(FLOOR_DB/20)))


def rms(samples):
    return float(np.sqrt(np.mean(samples**2))) if len(samples) else 0.0


def decode(path, start, duration):
    """Exactly `duration` seconds of stereo float samples; a source that ends early is an error, not padding."""
    wanted = round(duration*RATE)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(duration), "-i", str(path),
                          "-vn", "-ac", "2", "-ar", str(RATE), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    samples = np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(np.float64)
    require(len(samples) >= wanted-RATE//20, f"{path.name}: only {len(samples)/RATE:.2f} s decoded of {duration:.2f} s")
    return np.pad(samples, ((0, max(0, wanted-len(samples))), (0, 0)))[:wanted]


def span(instant):
    return round(instant*RATE)


def smooth(mask, seconds):
    """Centred moving average: a hard mask becomes a ramp so the bed never clicks."""
    size = max(1, span(seconds))
    edge = np.cumsum(np.pad(mask.astype(np.float64), (size//2+1, size//2)))
    return (edge[size:size+len(mask)]-edge[:len(mask)])/size


def mask(length, intervals):
    result = np.zeros(length, dtype=bool)
    for a, b in intervals:
        result[span(a):min(length, span(b))] = True
    return result


def render_master(project, plan, prepared, target):
    timeline = prepared["timeline"]
    length = span(timeline["duration"])
    voice, feature = np.zeros((length, 2)), np.zeros((length, 2))
    narration = np.concatenate([decode(prepared["audio"], a, b-a) for a, b in plan["source"]["cuts"]])
    boundaries = [0.0]+[w["at"] for w in timeline["windows"]]+[timeline["narration_duration"]]
    shift = 0.0
    for index in range(len(boundaries)-1):
        piece = narration[span(boundaries[index]):span(boundaries[index+1])]
        place = span(boundaries[index]+shift)
        voice[place:place+len(piece)] = piece[:max(0, length-place)]
        if index < len(timeline["windows"]):
            window = timeline["windows"][index]
            shift += window["end"]-window["start"]
    excerpts = []
    voiced_intervals = [(c["debut"], c["fin"]) for c in prepared["captions"]]
    voiced = mask(length, voiced_intervals)
    voice_db = db(rms(voice[voiced]))
    for window in timeline["windows"]:
        clip = decode(asset_path(project, plan["assets"][window["asset"]]), window["in"], window["out"]-window["in"])
        clip *= 10**(window["gain_db"]/20)
        place = span(window["clip_start"])
        feature[place:place+len(clip)] = clip[:max(0, length-place)]
        level = db(rms(clip))
        require(EXCERPT_OVER_VOICE_DB[0] <= level-voice_db <= EXCERPT_OVER_VOICE_DB[1],
                f"insertion {window['id']}: the excerpt sits {level-voice_db:+.1f} dB from the narration; "
                f"adjust gain_db so it is neither buried nor overwhelming")
        excerpts.append({"id": window["id"], "rms_db": round(level, 2), "over_voice_db": round(level-voice_db, 2)})
    report = {"sample_rate": RATE, "voice_rms_db": round(voice_db, 2), "excerpts": excerpts,
              "voice_over_bed_db": None, "bed_under_voice_db": None, "bed_in_silence_db": None,
              "bed_under_excerpt_db": None}
    mixed = voice+feature
    bed = timeline["bed"]
    if bed:
        stem = decode(asset_path(project, plan["assets"][bed["asset"]]), bed.get("in", 0), timeline["duration"])
        stem = stem[:length]*10**(bed["gain_db"]/20)
        speech = smooth(voiced, RAMP_S)
        blocks = smooth(mask(length, [(w["start"], w["end"]) for w in timeline["windows"]]), GATE_S)
        duck = 10**(bed.get("duck_db", 0)/20)
        stem = stem*((1-(1-duck)*speech)*(1-blocks))[:, None]
        under_voice, in_silence = (speech >= .999)&(blocks <= .001), (speech <= .001)&(blocks <= .001)
        under_excerpt = mask(length, [(w["clip_start"], w["clip_end"]) for w in timeline["windows"]])
        report["bed_under_voice_db"] = round(db(rms(stem[under_voice])), 2)
        report["bed_in_silence_db"] = round(db(rms(stem[in_silence])), 2) if in_silence.any() else None
        report["bed_under_excerpt_db"] = round(db(rms(stem[under_excerpt])), 2) if under_excerpt.any() else None
        report["voice_over_bed_db"] = round(voice_db-report["bed_under_voice_db"], 2)
        require(report["voice_over_bed_db"] >= MIN_VOICE_OVER_BED_DB,
                f"The bed masks the voice: only {report['voice_over_bed_db']:.1f} dB below it, "
                f"{MIN_VOICE_OVER_BED_DB:.0f} required; lower bed.gain_db or bed.duck_db")
        mixed = mixed+stem
    peak = float(np.abs(mixed).max())
    ceiling = 10**(CEILING_DB/20)
    reduction = db(ceiling/peak) if peak > ceiling else 0.0
    require(reduction >= -MAX_LIMITER_REDUCTION_DB,
            f"The mix peaks {db(peak):.1f} dBFS; limiting it would cost {-reduction:.1f} dB. Lower a gain_db")
    mixed = mixed*(10**(reduction/20))
    pcm = np.round(mixed*32767).clip(-32768, 32767).astype("<i2")
    with wave.open(str(target), "wb") as out:
        out.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
        out.writeframes(pcm.tobytes())
    report["limiter_gain_db"] = round(reduction, 3)
    report["peak_db"] = round(db(np.abs(pcm).max()/32768), 3)
    return report
