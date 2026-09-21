"""Cards a montage shows without saying them.

`ethni_montage.py` times every scene off the narration, one paragraph per card.
A card marked `muette` is the exception: a message the operator wants on screen
and not read aloud. It stays out of that timing, and out of the narration, and
carries the only duration the montage cannot measure — its own.

It must come last. The sign-off card is cued on the last *spoken* sentence, so a
silent card in the middle would sit under a voice that is already talking about
something else; a silent card at the end is drawn after the sign-off card, which
is where a dedication belongs and where the operator asked for it.
"""

# One dedication is read, not skimmed; but a card that holds the frame for a
# minute is a still image with an audio track missing, not a message.
DUREE_MAX = 12


def separer(cartes):
    """`(parlees, muettes)`. The muettes are the trailing cards marked as such."""
    parlees = [c for c in cartes if not c.get("muette")]
    muettes = [c for c in cartes if c.get("muette")]
    if not muettes:
        return list(cartes), []
    if not parlees:
        raise ValueError("un deck sans aucune carte parlée : rien à minuter ni à dire")
    if cartes[len(parlees):] != muettes:
        raise ValueError(
            "une carte muette vient après les cartes parlées, jamais au milieu : "
            "la carte de fin se cale sur la dernière phrase dite")
    for carte in muettes:
        duree = carte.get("duree")
        if not isinstance(duree, (int, float)) or isinstance(duree, bool) or duree <= 0:
            raise ValueError(
                f"carte {carte.get('rang', '?')} muette sans `duree` en secondes : "
                f"aucune narration ne la mesure")
        if duree > DUREE_MAX:
            raise ValueError(
                f"carte {carte.get('rang', '?')} muette de {duree} s : "
                f"au plus {DUREE_MAX} s")
    return parlees, muettes


def images_muettes(muettes, fps):
    """How many frames the silent cards add to the film."""
    return sum(round(float(c["duree"]) * fps) for c in muettes)
