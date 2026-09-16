"""The one-time move from a flat `images/` to a folder per network.

    ./venv/bin/python test_migrer_dossiers_reseaux.py

Six posts in the library were rendered before `ethni_carrousel2.py` learned to
file by network (2026-09-16) and still carry the old flat layout. This holds
the move itself to a pure function of a file list, so the plan can be checked
without touching a real post.
"""
import pathlib
import sys

from migrer_dossiers_reseaux import planifier

RACINE = pathlib.Path("/post")


def test_carrousel_and_reel_go_to_their_network_folders():
    fichiers = [
        "sujet_01_carrousel_1080x1350.png",
        "sujet_01_reel_1080x1920.png",
        "RENDU.md",
    ]
    plan = planifier(RACINE, fichiers)
    cibles = {source.name: str(dest.relative_to(RACINE)) for source, dest in plan}
    origines = {source.name: str(source.relative_to(RACINE)) for source, dest in plan}
    assert cibles["sujet_01_carrousel_1080x1350.png"] == \
        "TikTok-Instagram/sujet_01_carrousel_1080x1350.png"
    assert cibles["sujet_01_reel_1080x1920.png"] == \
        "Instagram-Facebook-YouTube-X/sujet_01_reel_1080x1920.png"
    assert cibles["RENDU.md"] == "RENDU.md"
    assert origines["sujet_01_carrousel_1080x1350.png"] == \
        "images/sujet_01_carrousel_1080x1350.png"
    assert origines["RENDU.md"] == "images/RENDU.md"


def test_the_retired_linkedin_render_is_archived_not_deleted():
    plan = planifier(RACINE, ["sujet_01_linkedin_1080x1080.png"])
    (source, dest), = plan
    assert str(source.relative_to(RACINE)) == "images/sujet_01_linkedin_1080x1080.png"
    assert str(dest.relative_to(RACINE)) == "_non-publie/sujet_01_linkedin_1080x1080.png"


def test_an_unrecognised_file_is_left_where_it_is_reported_not_guessed():
    plan = planifier(RACINE, ["notes-perso.txt"])
    assert plan == []


def main():
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
