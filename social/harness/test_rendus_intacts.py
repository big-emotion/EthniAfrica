"""A lot that fails a gate leaves its network folders exactly as it found them.

    ./venv/bin/python test_rendus_intacts.py

Mercator lost fifteen renders because the previous generation was carried out of
its output folder before the replacement was written — and the replacement never
was, the lot having failed gate 1 and gone to `_epreuves/`.

The engine is exercised on a real deck copied into a scratch directory, because
what is being asserted is a fact about the filesystem after a run, not about a
function's return value.
"""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

from ethni_paths import productions_root
from ethni_tokens import reseaux

HARNESS = pathlib.Path(__file__).resolve().parent

PROJETS = productions_root()

# The two folders a passing lot can write to, named after §1 bis — never
# `images/` any more, one per format.
CARROUSEL_DIR = "-".join(reseaux("carrousel"))
REEL_DIR = "-".join(reseaux("reel"))
DOSSIERS_PASSANTS = (CARROUSEL_DIR, REEL_DIR)


def _empreinte(dossier):
    """Name and size of every render, which is what « unchanged » has to mean."""
    if not dossier.exists():
        return {}
    return {f.name: f.stat().st_size
            for f in dossier.iterdir() if f.suffix.lower() in (".png", ".jpg")}


def _empreinte_qualifiee(racine, sous_dossiers):
    """Every render under a set of sibling folders, keyed by "dossier/nom".

    `carrousel` and `reel` no longer share one destination the way `images/`
    did, so two folders holding a same-named leftover must never collapse into
    one dict entry — that is exactly the ambiguity the engine's own carry-out
    step had to stop resolving by silently keeping only one of the two.
    """
    total = {}
    for nom in sous_dossiers:
        dossier = racine / nom
        if not dossier.exists():
            continue
        total.update({f"{nom}/{f.name}": f.stat().st_size
                      for f in dossier.iterdir() if f.suffix.lower() in (".png", ".jpg")})
    return total


def _empreinte_totale(sujet):
    """Every rendered file across every network folder a passing lot can use."""
    return _empreinte_qualifiee(sujet, DOSSIERS_PASSANTS)


def _empreinte_ecartes(sujet):
    """Every leftover carried into `_rendus-remplaces/`, namespaced the same way."""
    return _empreinte_qualifiee(sujet / "_rendus-remplaces", DOSSIERS_PASSANTS)


def _deck_temporaire(source_nom, bac, casser_licence):
    """A copy of a real deck, pointed at the scratch directory."""
    source = PROJETS / source_nom
    projet = bac / source_nom
    shutil.copytree(source, projet)

    sujet = bac / "sujet"
    for nom in DOSSIERS_PASSANTS:
        (sujet / nom).mkdir(parents=True)
        for i in range(3):
            # Stand-ins for a previous generation. Their content is irrelevant;
            # what matters is that they are still there, byte for byte, afterwards.
            (sujet / nom / f"ancien_{i:02d}.png").write_bytes(
                b"\x89PNG\r\n\x1a\n" + bytes(64))

    deck = json.loads((projet / "cards.json").read_text(encoding="utf-8"))
    deck["outDir"] = str(sujet)
    if casser_licence:
        deck["cartes"][0]["image"]["licence"] = ""     # gate 1 will refuse the lot
    (projet / "cards.json").write_text(json.dumps(deck, ensure_ascii=False, indent=2),
                                       encoding="utf-8")
    return projet, sujet


def _rendre(projet, *args):
    # `sys.executable`, not a venv path spelled out here: the suite must render
    # with whatever interpreter launched it. The hardcoded `venv/bin/python`
    # worked only while the engine and its virtualenv shared a directory, and
    # silently ran a *different* interpreter than the one under test as soon as
    # they did not.
    return subprocess.run(
        [sys.executable, str(HARNESS / "ethni_carrousel2.py"),
         str(projet), *args],
        capture_output=True, text=True, cwd=HARNESS)


def test_a_failed_gate_leaves_images_untouched():
    """The Mercator loss, pinned.

    A lot refused by a gate is rendered — it always is — but into `_epreuves/`.
    The network folders are not its business.
    """
    with tempfile.TemporaryDirectory() as bac:
        bac = pathlib.Path(bac)
        projet, sujet = _deck_temporaire("Pays-Benin", bac, casser_licence=True)

        avant = _empreinte_totale(sujet)
        assert avant, "le décor du test doit poser une génération précédente"

        r = _rendre(projet, "--remplacer")
        assert "ÉPREUVE" in r.stdout, r.stdout[-400:]

        apres = _empreinte_totale(sujet)
        assert apres == avant, (
            f"un dossier-réseau a changé sur un lot refusé : "
            f"{sorted(set(avant) - set(apres))} disparus, "
            f"{sorted(set(apres) - set(avant))} ajoutés")
        assert not (sujet / "_rendus-remplaces").exists(), (
            "un lot refusé ne doit rien écarter")
        assert _empreinte(sujet / "_epreuves"), "l'épreuve doit être rendue quand même"


def test_a_passing_lot_replaces_only_after_writing():
    """The set-aside happens after the write, and only over what was there before."""
    with tempfile.TemporaryDirectory() as bac:
        bac = pathlib.Path(bac)
        projet, sujet = _deck_temporaire("Pays-Benin", bac, casser_licence=False)

        avant = _empreinte_totale(sujet)
        r = _rendre(projet, "--remplacer")
        assert "ÉPREUVE" not in r.stdout, r.stdout[-400:]

        ecartes = _empreinte_ecartes(sujet)
        assert set(ecartes) == set(avant), (
            f"les écartés devraient être exactement l'ancienne génération : "
            f"{sorted(set(avant) ^ set(ecartes))}")

        nouveaux = _empreinte_totale(sujet)
        assert nouveaux, "aucun rendu écrit"
        assert not (set(nouveaux) & set(avant)), (
            "l'ancienne génération ne doit plus être dans les dossiers-réseaux")


def test_nothing_is_deleted_only_moved():
    """The atelier has no version control, so a delete here is final."""
    with tempfile.TemporaryDirectory() as bac:
        bac = pathlib.Path(bac)
        projet, sujet = _deck_temporaire("Pays-Benin", bac, casser_licence=False)

        avant = _empreinte_totale(sujet)
        _rendre(projet, "--remplacer")

        survivants = {**_empreinte_totale(sujet),
                      **_empreinte_ecartes(sujet),
                      **_empreinte(sujet / "_epreuves")}
        perdus = set(avant) - set(survivants)
        assert not perdus, f"fichiers perdus : {sorted(perdus)}"


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
