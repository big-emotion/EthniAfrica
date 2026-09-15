"""The minimum pause after each word, as the audio pass tops gaps up to it.

Kept out of `ethni_audio.py`, which runs as a script from its first line, so the
targets can be tested without a take, a transcription or a project on disk.
"""

# In final (post-tempo) seconds. The hook gets the long landing the format asks
# for; other block breaks get a change-of-idea beat. A subject overrides any of
# these from `production.json` → `pauses`; one it does not name keeps its default.
PAUSES_DEFAUT = {
    "virgule": 0.20,
    "phrase": 0.40,
    "accroche": 0.76,
    "question": 0.64,
    "paragraphe": 0.48,
}


def cibles_de_pause(lignes, decouper, reglages=None):
    """{token index: minimum pause} over the narration's paragraphs.

    `decouper` splits a paragraph into the same tokens the aligner times, so the
    indices here address the aligned words one to one.
    """
    pauses = {**PAUSES_DEFAUT, **(reglages or {})}
    cibles = {}
    decalage = 0
    for li, ligne in enumerate(lignes):
        jetons = decouper(ligne)
        for j, jeton in enumerate(jetons[:-1]):
            if jeton.endswith(","):
                cibles[decalage + j] = pauses["virgule"]
            elif jeton.endswith((".", "?", "!")):
                cibles[decalage + j] = pauses["phrase"]
        decalage += len(jetons)
        if li < len(lignes) - 1:
            if li == 0:
                cibles[decalage - 1] = pauses["accroche"]
            elif ligne.endswith("?"):
                cibles[decalage - 1] = pauses["question"]
            else:
                cibles[decalage - 1] = pauses["paragraphe"]
    return cibles
