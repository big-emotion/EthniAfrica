"""The silent closing card of a montage.

    ./venv/bin/python test_carte_muette.py

A reel can end on a message nobody reads aloud — a condolence, a dedication —
that the operator wants on screen and not in the voice. The engine times every
scene off the narration, one paragraph per card, so such a card cannot be one of
them: given a paragraph it would be spoken, given none the counts disagree and
every scene's duration is guessed.

A card marked `muette` therefore sits outside the timing. It carries its own
`duree`, is drawn after the sign-off card, and the narration does not mention it.
"""
import sys

import ethni_muettes as mu


def carte(rang, **plus):
    return {"rang": rang, "role": "scene", "titre": f"carte {rang}", **plus}


def test_a_deck_without_a_silent_card_is_left_as_it_was():
    cartes = [carte(1), carte(2), carte(3, role="bascule")]
    parlees, muettes = mu.separer(cartes)
    assert parlees == cartes
    assert muettes == []


def test_the_silent_card_is_split_from_the_spoken_ones():
    cartes = [carte(1), carte(2, role="bascule"), carte(3, muette=True, duree=6)]
    parlees, muettes = mu.separer(cartes)
    assert [c["rang"] for c in parlees] == [1, 2]
    assert [c["rang"] for c in muettes] == [3]


def test_a_silent_card_before_a_spoken_one_is_refused():
    cartes = [carte(1), carte(2, muette=True, duree=6), carte(3)]
    try:
        mu.separer(cartes)
    except ValueError as erreur:
        assert "après" in str(erreur)
    else:
        raise AssertionError("une carte muette au milieu du deck doit être refusée")


def test_a_silent_card_without_a_duration_is_refused():
    for plus in ({}, {"duree": 0}, {"duree": -3}, {"duree": "long"}):
        try:
            mu.separer([carte(1), carte(2, muette=True, **plus)])
        except ValueError:
            continue
        raise AssertionError(f"une durée {plus!r} doit être refusée")


def test_a_silent_card_cannot_hold_the_frame_for_ever():
    try:
        mu.separer([carte(1), carte(2, muette=True, duree=60)])
    except ValueError as erreur:
        assert "12" in str(erreur)
    else:
        raise AssertionError("une carte muette de 60 s doit être refusée")


def test_a_deck_of_silent_cards_only_is_refused():
    try:
        mu.separer([carte(1, muette=True, duree=5)])
    except ValueError:
        return
    raise AssertionError("un deck sans aucune carte parlée doit être refusé")


def test_the_frames_of_the_silent_cards_are_counted_from_their_durations():
    muettes = [carte(3, muette=True, duree=6), carte(4, muette=True, duree=2.5)]
    assert mu.images_muettes(muettes, 30) == 180 + 75
    assert mu.images_muettes([], 30) == 0


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    echecs = 0
    for test in tests:
        try:
            test()
            print(f"ok    {test.__name__}")
        except AssertionError as erreur:
            echecs += 1
            print(f"ECHEC {test.__name__} — {erreur}")
    print(f"\n{len(tests) - echecs}/{len(tests)} passent")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
