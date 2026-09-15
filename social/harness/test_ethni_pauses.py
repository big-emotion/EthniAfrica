"""The pause targets of the audio pass, and the per-subject override of them.

    ./venv/bin/python test_ethni_pauses.py

The audio pass tops every gap up to a minimum pause. Those minimums were fixed in
code, so a subject cut for a TikTok rhythm — silences tightened to 0,2 s — came
back out of the pass with 0,40 s after every sentence and 0,48 s between scenes:
the rhythm the operator chose by ear was undone by a constant.
"""
import sys

import ethni_pauses as pz


def test_the_defaults_are_the_targets_the_audio_pass_always_used():
    lignes = ["Un deux, trois.", "Quatre sept?", "Cinq. six.", "Huit neuf."]
    # Un(0) deux,(1) trois.(2) | Quatre(3) sept?(4) | Cinq.(5) six.(6) | Huit(7) neuf.(8)
    assert pz.cibles_de_pause(lignes, str.split) == {
        1: 0.20,   # comma
        2: 0.76,   # the hook's landing, after the first paragraph
        4: 0.64,   # a paragraph ending on a question
        5: 0.40,   # a sentence inside a paragraph
        6: 0.48,   # any other paragraph break
    }


def test_a_subject_can_tighten_every_pause_from_its_production_settings():
    lignes = ["Un deux, trois.", "Quatre sept?", "Cinq. six.", "Huit neuf."]
    reglages = {"virgule": 0.10, "phrase": 0.20, "question": 0.30,
                "paragraphe": 0.25, "accroche": 0.35}
    assert pz.cibles_de_pause(lignes, str.split, reglages) == {
        1: 0.10, 2: 0.35, 4: 0.30, 5: 0.20, 6: 0.25}


def test_a_partial_override_keeps_the_defaults_it_does_not_name():
    lignes = ["Un deux, trois.", "Quatre sept."]
    assert pz.cibles_de_pause(lignes, str.split, {"virgule": 0.05}) == {1: 0.05, 2: 0.76}


def main():
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
