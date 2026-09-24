"""Prepare approved narration excerpts without generating or retiming speech."""
import hashlib
import json
import subprocess

from ethni_map import excerpt_words
from ethni_scene_plan import keys, number, require
import ethni_soustitre as subtitles


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare_source(project, source):
    keys(source, "source_script_sha256 source_audio_sha256 cuts paragraphs", "source")
    script = project / "narration.fr.txt"
    approval = project / "post.md"
    require(approval.is_file() and "**Texte validé** : oui" in approval.read_text(), "Source narration needs operator approval")
    for path in (script, project / "cards.json", project / "cartes.json"):
        if path.exists():
            require(path.stat().st_mtime <= approval.stat().st_mtime, "Source changed after operator approval")
    require(digest(script) == source.get("source_script_sha256"), "Source script hash changed")
    audio = project / "work/narration.wav"
    require(digest(audio) == source.get("source_audio_sha256"), "Source audio hash changed")
    words = json.loads((project / "work/aligned-words.json").read_text())
    from ethni_montage import alignement_a_jour
    error = alignement_a_jour(project, script.read_text())
    require(not error, error)
    cuts, paragraphs = source.get("cuts"), source.get("paragraphs")
    require(isinstance(cuts, list) and cuts, "Nonempty audio cuts required")
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(audio)],
                           check=True, capture_output=True, text=True)
    recording_duration = float(json.loads(probe.stdout)["format"]["duration"])
    previous = 0
    for cut in cuts:
        require(isinstance(cut, list) and len(cut) == 2, "A cut needs start and end")
        a, b = cut
        number(a, "cut.start", 0)
        number(b, "cut.end", 0)
        require(previous <= a < b <= recording_duration+.001, "Cuts must be ordered, nonoverlapping and within the recording")
        previous = b
    previous = -1
    for word in words:
        a = number(word["start"], "word.start", 0)
        b = number(word["end"], "word.end", a)
        require(a >= previous and b <= recording_duration+.001, "Invalid aligned word order or recording duration")
        previous = a
    selected = excerpt_words(words, cuts)
    blocks = script.read_text().strip().split("\n\n")
    require(isinstance(paragraphs, list) and paragraphs and
            all(type(i) is int and 0 <= i < len(blocks) for i in paragraphs), "Valid paragraph indexes required")
    narration = "\n\n".join(blocks[i] for i in paragraphs)
    letters = lambda value: "".join(c for c in value.lower() if c.isalnum())
    require(letters(narration) == letters("".join(w["word"] for w in selected)),
            "Cuts must contain exactly the selected complete approved paragraphs")
    return {"audio": audio, "narration": narration, "words": selected,
            "captions": subtitles.minuter(subtitles.segmenter(narration), selected),
            "duration": round(sum(b-a for a, b in cuts), 6)}
