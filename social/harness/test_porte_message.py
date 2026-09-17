"""§5 — the message gate, the one the engine could not see.

    ./venv/bin/python test_porte_message.py

`ethniafrica-produire` describes five gates. Four were the engine's; the fifth —
« le message passe » — lived only in the skill's head, so a lot that cleared the
four mechanical gates went straight to the network folders however the message
audit had ruled. Measured on `diallo-djallo`, 2026-09-16: `message.md` said
« ne passe pas » and the twelve renders were filed as publishable anyway.

The gate reads two verdicts written beside the deck — `message.md` and
`mythe.md` — and it is as strict about their date as about their wording: a
verdict older than the text it judges has judged a different text.
"""
import pathlib
import sys
import tempfile
import time

import ethni_compose as gab

HARNESS = pathlib.Path(__file__).resolve().parent

PASSE = "# Audit du message\n\nÉcrit le 2026-09-16 · verdict : **passe**\n"
NE_PASSE_PAS = "# Audit du message\n\nÉcrit le 2026-09-16 · verdict : **ne passe pas**\n"
MYTHE_OK = "# Mythe\n\nÉcrit le 2026-09-16 · verdict : **explique**\n"
MYTHE_KO = "# Mythe\n\nÉcrit le 2026-09-16 · verdict : **ne passe pas**\n"


def _sujet(bac, *, message=PASSE, mythe=MYTHE_OK, message_perime=False):
    """A deck folder carrying the files the gate reads, and nothing else."""
    racine = pathlib.Path(bac)
    (racine / "cards.json").write_text("{}", encoding="utf-8")
    (racine / "post.md").write_text("# post\n", encoding="utf-8")
    if message is not None:
        (racine / "message.md").write_text(message, encoding="utf-8")
    if mythe is not None:
        (racine / "mythe.md").write_text(mythe, encoding="utf-8")

    if message_perime:
        # The text edited after the verdict was written. One second is enough:
        # what is compared is an order, not a duration.
        time.sleep(0.01)
        (racine / "cards.json").write_text("{ }", encoding="utf-8")
    return racine


def test_a_passing_message_opens_the_gate():
    with tempfile.TemporaryDirectory() as bac:
        assert gab.porte_message(_sujet(bac)) == []


def test_a_refused_message_closes_it():
    with tempfile.TemporaryDirectory() as bac:
        manquantes = gab.porte_message(_sujet(bac, message=NE_PASSE_PAS))
        assert len(manquantes) == 1, manquantes
        assert "message" in manquantes[0].lower()


def test_ne_passe_pas_is_not_read_as_passe():
    """« ne passe pas » contains « passe ». A substring test would clear it."""
    with tempfile.TemporaryDirectory() as bac:
        assert gab.porte_message(_sujet(bac, message=NE_PASSE_PAS)) != []


def test_a_missing_audit_closes_the_gate():
    """No verdict is not a pass. The gate exists because nobody had looked."""
    with tempfile.TemporaryDirectory() as bac:
        assert gab.porte_message(_sujet(bac, message=None)) != []


def test_a_stale_audit_closes_the_gate():
    """A verdict older than the text judges a text that no longer exists."""
    with tempfile.TemporaryDirectory() as bac:
        manquantes = gab.porte_message(_sujet(bac, message_perime=True))
        assert manquantes, "un verdict plus ancien que cards.json ne juge plus le lot"
        assert "plus ancien" in manquantes[0] or "périmé" in manquantes[0], manquantes


def test_the_myth_verdict_closes_it_too_but_only_when_it_refuses():
    with tempfile.TemporaryDirectory() as bac:
        assert gab.porte_message(_sujet(bac, mythe=MYTHE_KO)) != []
    with tempfile.TemporaryDirectory() as bac:
        # « explique » is a valid verdict and blocks nothing.
        assert gab.porte_message(_sujet(bac, mythe=MYTHE_OK)) == []
    with tempfile.TemporaryDirectory() as bac:
        # A myth check that was never run is not this gate's business: only
        # `message.md` is required. `ethniafrica-mythe` says so itself — an
        # absent verdict is not a refusal.
        assert gab.porte_message(_sujet(bac, mythe=None)) == []


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
