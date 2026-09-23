"""Subtitle cuts, checked against every narration the project has actually shipped.

    ./venv/bin/python test_ethni_soustitre.py

The corpus is the point. A segmenter can be made to pass on invented sentences;
what matters is whether it still tears « Congo portaient le » off its verb on the
twelve narrations already recorded.
"""
import json
import pathlib
import sys

import ethni_soustitre as st
from ethni_paths import productions_root


PROJETS = productions_root()

CONGO = ("Onze villes du Congo portaient le nom d'un Belge. "
         "Parce que c'est l'administration coloniale qui les a nommées.")


def narrations():
    for f in sorted(PROJETS.glob("*/narration.fr.txt")):
        texte = f.read_text(encoding="utf-8").strip()
        if texte:
            yield f.parent.name, texte


# ---------------------------------------------------------------- the defect


def test_the_congo_cut_no_longer_tears_a_noun_from_its_verb():
    """The caption the retired pipeline produced, by counting to three."""
    captions = st.segmenter(CONGO)
    assert not any(c.strip().endswith(" le") for c in captions), captions
    assert not any(c.strip() == "Congo portaient le" for c in captions), captions
    # And the first caption is a whole thought.
    assert captions[0] == "Onze villes du Congo portaient le nom d'un Belge.", captions


def test_no_caption_ends_on_a_word_that_points_forward():
    """« du », « le », « et », « est » — a line ending there leaves a viewer mid-thought."""
    fautes = []
    for sujet, texte in narrations():
        for c in st.segmenter(texte):
            dernier = c.split()[-1] if c.split() else ""
            if not st._peut_finir(dernier):
                fautes.append(f"{sujet} : « …{dernier} » clôt « {c} »")
    assert not fautes, "coupes qui laissent la phrase en suspens :\n  " + "\n  ".join(fautes[:10])


# ---------------------------------------------------------------- §9 shape


def test_every_caption_fits_two_lines():
    fautes = []
    for sujet, texte in narrations():
        for c in st.segmenter(texte):
            lignes = st.envelopper(c)
            if len(lignes) > st.LIGNES_MAX:
                fautes.append(f"{sujet} : {len(lignes)} lignes pour « {c} »")
            for l in lignes:
                if len(l) > st.SIGNES_PAR_LIGNE * 1.4:
                    fautes.append(f"{sujet} : ligne de {len(l)} signes — « {l} »")
    assert not fautes, "\n  " + "\n  ".join(fautes[:10])


def test_a_wrapped_caption_is_balanced_not_greedy():
    """A greedy wrap fills line one and leaves a stub, which reads as an accident."""
    lignes = st.envelopper("Onze villes du Congo portaient le nom d'un Belge autrefois")
    assert len(lignes) == 2
    court, long = sorted(len(l) for l in lignes)
    assert court >= long * 0.45, f"lignes déséquilibrées : {lignes}"


def test_nothing_is_lost_or_invented():
    """Segmentation reorders nothing and drops nothing."""
    for sujet, texte in narrations():
        recompose = " ".join(st.segmenter(texte)).split()
        assert recompose == texte.split(), f"{sujet} : le texte a changé au découpage"


# ---------------------------------------------------------------- timing


def test_times_are_hung_on_cuts_already_made():
    """The aligner is asked *when*, never *where*."""
    for sujet in ("Libreville", "Villes-Congo", "Brazzaville"):
        mots = PROJETS / sujet / "work" / "aligned-words.json"
        narration = PROJETS / sujet / "narration.fr.txt"
        if not (mots.exists() and narration.exists()):
            continue

        alignes = json.loads(mots.read_text(encoding="utf-8"))
        captions = st.segmenter(narration.read_text(encoding="utf-8"))
        minutees = st.minuter(captions, alignes)

        assert minutees, f"{sujet} : aucun sous-titre minuté"
        for a, b in zip(minutees, minutees[1:]):
            assert a["debut"] <= a["fin"], f"{sujet} : sous-titre à durée négative"
            assert a["fin"] <= b["debut"] + 0.01, f"{sujet} : sous-titres qui se chevauchent"
        print(f"      {sujet} : {len(minutees)} sous-titres minutés", flush=True)


def test_a_mismatched_word_does_not_drop_a_caption():
    """The aligner writes « Libreville, » with its comma; the narration may not."""
    captions = ["Libreville au Gabon", "est née de cinquante-deux personnes"]
    alignes = [{"word": w, "start": i * 0.5, "end": i * 0.5 + 0.4}
               for i, w in enumerate("Libreville, au Gabon, est née de cinquante-deux "
                                     "personnes".split())]
    minutees = st.minuter(captions, alignes)
    assert len(minutees) == 2, minutees


COMORES = ("Et aux Comores, comment les appartenances à une île s’articulent-elles "
           "avec une identité comorienne ? Des noms que portent des personnes. "
           "Quand vous dites « Mali », de quelle histoire parlez-vous ?")


def test_french_spaced_punctuation_never_becomes_a_caption_of_its_own():
    """A long sentence cut just before « ? » left the mark alone as a caption.

    It carries no word, so `minuter` found nothing to time and stopped there:
    every caption after it was dropped, and the sign-off card cued on the last
    one that survived — at 54,72 s of a 109 s reel (Comprendre-Afrique-Noms).
    """
    captions = st.segmenter(COMORES)
    for c in captions:
        assert st.TOKEN_PATTERN.findall(c), f"sous-titre sans mot : {c!r} dans {captions}"
    assert " ".join(captions).split() == COMORES.split()

    mots = [m for m in COMORES.replace("« ", "").replace(" »", "").split()
            if st.TOKEN_PATTERN.findall(m)]
    alignes = [{"word": w, "start": i * 0.3, "end": i * 0.3 + 0.2} for i, w in enumerate(mots)]
    assert len(st.minuter(captions, alignes)) == len(captions)


# ---------------------------------------------------------------- the pivot


def test_one_pivot_word_and_only_one():
    avant, mot, apres = st.pivot("Onze villes du Congo portaient le nom d'un Belge", "congo")
    assert mot == "Congo"
    assert avant == "Onze villes du"
    assert apres == "portaient le nom d'un Belge"


def test_an_absent_pivot_colours_nothing():
    avant, mot, apres = st.pivot("Onze villes du Congo", "kinshasa")
    assert mot == "" and apres == "" and avant == "Onze villes du Congo"


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
