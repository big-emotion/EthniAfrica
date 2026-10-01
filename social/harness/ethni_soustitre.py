"""Cut a narration into subtitles on breath groups, then hang the times on them.

The order matters and it is the whole fix. The retired pipeline cut the *aligned
words* every three words and produced « Congo portaient le » — a caption that
breaks a noun off its verb because a counter reached three. Segmentation is a
property of the sentence, so it is computed on the narration text, before
alignment, and the aligner is then only asked when each piece is spoken.

§9 in full:

- two lines maximum, cut on sense groups;
- Nunito Sans on an opaque plate, never a thick outline on a display face — an
  outline is a patch over contrast, and the plate does the work properly;
- the band lives in the plan between the content column and the foot;
- one pivot word per scene may take the accent. One.
"""
import math
import re
import unicodedata

# Must count words exactly like `hf-workflows/subtitles/scripts/audio_to_captions.py`'s
# TOKEN_PATTERN, because `minuter()` below walks `mots_alignes` — an array built by
# tokenizing the script with that exact pattern — using this count as its stride.
# A plain `.split()` sees a bare em-dash as its own word; TOKEN_PATTERN, needing a
# leading word character, does not. One script with two em-dashes was enough to
# desync every caption after them by two words: measured on an 11-paragraph
# narration, `aligned-words.json` held 274 entries against 285 from `.split()`,
# and the gap compounded until the caption band ran a full sentence behind the
# scene it was cut against.
TOKEN_PATTERN = re.compile(r"[^\W_]+(?:[-'’][^\W_]+)*[.,!?;:]?", re.UNICODE)

# Where French prose lets a caption break without tearing anything.
#
# Punctuation first, because a comma or a full stop is a breath the speaker
# actually takes. Then the function words that open a group: a caption may start
# with « parce que » or « et », never end on them.
#
# A closing mark (« » », a closing bracket) belongs to the sentence it closes: the cut
# falls after it, never between the full stop and it. French sets « monde. » with a
# space, so a cut right after the full stop left « » » at the head of the next caption,
# and at a paragraph end it carried the blank line with it.
PONCTUATION = re.compile(
    r"(?:(?<=[.!?…:;,])|(?<=[.!?…:;,][»”’)\]])|(?<=[.!?…:;,][   ][»”’)\]]))\s+(?![»”’)\]])")

# Marks that open what follows; every other wordless mark closes what precedes.
OUVRANTS = frozenset("«“‘([")

# A group opens on these; cutting *before* them is safe, cutting after is not.
OUVREURS = frozenset("""
et ou mais donc or ni car parce puisque comme quand lorsque si que qui
dans sur sous vers chez pour avec sans depuis pendant avant apres
le la les un une des du de au aux ce cette ces son sa ses leur leurs
""".split())

# Never leave one of these dangling at the end of a caption: they point forward,
# and a line that ends on them leaves the viewer mid-thought.
JAMAIS_EN_FIN = OUVREURS | frozenset("""
est sont etait etaient a ont avait avaient
mon ton notre votre nos vos mes tes
""".split())

# §9 — two lines, and a line that fits the column at the subtitle size.
LIGNES_MAX = 2
SIGNES_PAR_LIGNE = 42


# Sentence-final punctuation. A caption ending on one is a complete thought,
# whatever its last word happens to be.
FIN_DE_PHRASE = ".!?…"


def _plie(mot):
    """Lower-cased, stripped, accents removed — for matching a spoken word.

    Used to find a pivot, where « Congo » and « congo, » are the same word.
    **Not** used for the function-word lookup: see `_nu`.
    """
    sans = unicodedata.normalize("NFKD", mot.lower())
    return "".join(c for c in sans if not unicodedata.combining(c)).strip(".,;:!?…«»\"'")


def _nu(mot):
    """Lower-cased and stripped, accents **kept**.

    French function words carry no accent, so folding gains nothing here and costs
    a collision: « là » folds onto « la », and « à ce moment là » was refused for
    ending on an article.
    """
    return mot.lower().strip(".,;:!?…«»\"'")


def _peut_finir(mot):
    if mot and mot[-1] in FIN_DE_PHRASE:
        return True
    return _nu(mot) not in JAMAIS_EN_FIN


def segmenter(texte, signes_max=SIGNES_PAR_LIGNE * LIGNES_MAX):
    """Cut a narration into captions, each at most two lines' worth of text.

    Punctuation is honoured first: it marks a breath the speaker takes, so a cut
    there costs nothing. Only where a sentence runs longer than a caption can
    hold does the function look for a seam, and it looks for the *latest* one that
    fits rather than the first — a caption that stops early wastes the line and
    doubles the number of cuts.
    """
    captions = []
    for phrase in PONCTUATION.split(texte.strip()):
        phrase = phrase.strip()
        if not phrase:
            continue
        if len(phrase) <= signes_max:
            captions.append(phrase)
            continue

        mots = _souder_la_ponctuation(phrase.split())
        courante = []
        for mot in mots:
            essai = courante + [mot]
            if len(" ".join(essai)) <= signes_max:
                courante = essai
                continue

            # Full: back off to the last word that may end a caption.
            coupe = len(courante)
            while coupe > 1 and not _peut_finir(courante[coupe - 1]):
                coupe -= 1
            if coupe <= 1:
                coupe = len(courante)      # no seam: take the whole thing rather
                                           # than emit a one-word caption
            captions.append(" ".join(courante[:coupe]))
            courante = courante[coupe:] + [mot]
        if courante:
            captions.append(" ".join(courante))
    return _refondre(captions, signes_max)


def _souder_la_ponctuation(mots):
    """Weld French spaced punctuation to the word it belongs to.

    French typesets « ? », « : » and guillemets apart, so `split()` hands them over
    as words. A cut landing before one left a caption holding no word at all, and
    `minuter` stops at the first caption it cannot time — measured on
    Comprendre-Afrique-Noms, where a lone « ? » dropped the last 24 captions.
    """
    soudes = []
    attente = ""
    for mot in mots:
        if TOKEN_PATTERN.search(mot):
            soudes.append(f"{attente} {mot}" if attente else mot)
            attente = ""
        elif mot in OUVRANTS:
            attente = f"{attente} {mot}".strip()
        elif soudes:
            soudes[-1] = f"{soudes[-1]} {mot}"
        else:
            attente = f"{attente} {mot}".strip()
    if attente:
        if soudes:
            soudes[-1] = f"{soudes[-1]} {attente}"
        else:
            soudes.append(attente)
    return soudes


def _refondre(captions, signes_max):
    """Merge neighbours that a comma split into fragments too short to read.

    « Un roi, » / « Léopold II, » / « pour Léopoldville. » is three captions of two
    words each. The speaker does pause on those commas, so the cut is honest — but
    on screen it is three flashes where one line would do, and a caption that
    leaves before it is read is worse than one that holds a beat too long.

    A merge never crosses a full stop: sentence boundaries are the one seam that
    always survives, because they are where the argument turns.
    """
    fondues = []
    for caption in captions:
        if not fondues:
            fondues.append(caption)
            continue

        precedent = fondues[-1]
        ferme = precedent.rstrip()[-1:] in FIN_DE_PHRASE
        ensemble = f"{precedent} {caption}"
        if not ferme and len(ensemble) <= signes_max:
            fondues[-1] = ensemble
        else:
            fondues.append(caption)
    return fondues


def envelopper(caption, signes_par_ligne=SIGNES_PAR_LIGNE, mesure=None, largeur_max=None):
    """Break one caption into at most two lines, balanced.

    Balanced rather than greedy: a greedy wrap fills the first line and leaves a
    stub on the second, which reads as an accident.

    `mesure` is the function that will actually draw the text, and `largeur_max`
    the box it has to fit. Given them, the wrap is decided in pixels. Without
    them it falls back to a character count — which is fine for deciding how much
    a caption may hold before a font is chosen, and wrong for anything that
    draws: fifty-one characters of Nunito 800 at 46 px is 1 100 px, and the band
    is 898.
    """
    mots = caption.split()

    def trop_large(texte):
        if mesure and largeur_max:
            return mesure(texte) > largeur_max
        return len(texte) > signes_par_ligne

    if not trop_large(" ".join(mots)):
        return [caption]

    taille = mesure if (mesure and largeur_max) else len
    plafond = largeur_max if (mesure and largeur_max) else signes_par_ligne * 1.4

    milieu = taille(" ".join(mots)) / 2
    meilleur, cout_min = 1, None
    for i in range(1, len(mots)):
        if taille(" ".join(mots[i:])) > plafond:
            continue
        cout = abs(taille(" ".join(mots[:i])) - milieu)

        # A break between two capitalised words splits a name: « Albert / premier »,
        # « Léopold / II ». It is the same fault as the one this module exists to
        # fix, one scale down, so it is priced rather than forbidden — a caption
        # that cannot break anywhere else still has to break somewhere.
        precedent, suivant = mots[i - 1], mots[i]
        if precedent[:1].isupper() and (suivant[:1].isupper() or suivant[:1].isdigit()):
            cout += plafond

        # A break just before a word that opens a group reads naturally.
        if _nu(suivant) in OUVREURS:
            cout -= plafond * 0.15

        if cout_min is None or cout < cout_min:
            meilleur, cout_min = i, cout
    return [" ".join(mots[:meilleur]), " ".join(mots[meilleur:])]


def minuter(captions, mots_alignes):
    """Hang the aligner's times on captions that were already cut.

    The aligner is asked *when*, never *where*. Matching is by word order rather
    than by string equality: the aligner writes « Libreville, » with its comma and
    the narration may not, and a mismatch there would silently drop a caption.
    """
    minutees = []
    curseur = 0
    for caption in captions:
        n = len(TOKEN_PATTERN.findall(caption))
        tranche = mots_alignes[curseur:curseur + n]
        if not tranche:
            break
        minutees.append({
            "texte": caption,
            "debut": tranche[0]["start"],
            "fin": tranche[-1]["end"],
            # Kept whole so a renderer can reveal the caption word by word without
            # asking the aligner again. Legacy callers read the three keys above only.
            "mots": [{"texte": m.get("word"), "debut": m.get("start"), "fin": m.get("end")}
                     for m in tranche],
        })
        curseur += n
    return minutees


# A group outlives its last word by this long: a caption that leaves the instant
# it is finished is gone before it is read.
MAINTIEN_S = 0.25

# Two groups closer than this are one breath, not a silence: the first stays until
# the second arrives, so the screen never blinks between them. Further apart, the
# speaker has stopped and the words leave with him.
PONT_S = 0.6

# Between two private-use marks a welded word (« Mali ») travels through the line
# breaker as one piece; `str.split()` would tear it at its inner space.
_SOUDURE = ""

_PAUSES = ",;:.!?…"


def _mots_minutes(caption):
    """The caption's display words, each with the time its first spoken token starts.

    A display word is what sits between two spaces. It may hold several spoken
    tokens (« Congo—Kinshasa ») or none: a spaced « ? » or a guillemet is not
    spoken, so it is welded to the word it closes, or to the one it opens, and
    appears with it. Anything that cannot be timed is refused rather than spread
    evenly over the caption, because an approximate onset reads as a misread word.
    """
    unites = caption["texte"].split()
    attendu = sum(len(TOKEN_PATTERN.findall(u)) for u in unites)
    alignes = caption.get("mots") or []
    if len(alignes) != attendu:
        raise ValueError(f"Caption cannot be timed word by word "
                         f"({len(alignes)} aligned words for {attendu} spoken): {caption['texte']!r}")

    precedent = None
    for mot in alignes:
        debut, fin = mot.get("debut"), mot.get("fin")
        for valeur in (debut, fin):
            if isinstance(valeur, bool) or not isinstance(valeur, (int, float)) or not math.isfinite(valeur):
                raise ValueError(f"Word {mot.get('texte')!r} has no valid debut/fin: {caption['texte']!r}")
        if fin < debut:
            raise ValueError(f"Word {mot['texte']!r} ends before it starts: {caption['texte']!r}")
        if precedent is not None and debut < precedent - 1e-6:
            raise ValueError(f"Word {mot['texte']!r} starts before the previous word: aligned words out of order")
        precedent = debut

    sortie, attente, curseur = [], "", 0
    for unite in unites:
        n = len(TOKEN_PATTERN.findall(unite))
        if not n:
            if set(unite) <= OUVRANTS or not sortie:
                attente = f"{attente} {unite}".strip()
            else:
                sortie[-1]["texte"] += f" {unite}"
            continue
        tranche = alignes[curseur:curseur + n]
        curseur += n
        sortie.append({"texte": f"{attente} {unite}".strip(), "debut": tranche[0]["debut"],
                       "fin": tranche[-1]["fin"]})
        attente = ""
    if attente and sortie:
        sortie[-1]["texte"] += f" {attente}"
    return sortie


def _finissable(texte):
    """Whether a group may stop after this display word."""
    if texte.rstrip("»”’)] ")[-1:] in FIN_DE_PHRASE:
        return True
    # « d'un » is « un »: an elision hides the function word behind the apostrophe.
    dernier = re.split(r"['’]", TOKEN_PATTERN.findall(texte)[-1])[-1]
    return _nu(dernier) not in JAMAIS_EN_FIN


def _lignes(mots, mesure, largeur_max):
    """Line breaks of a group as lists of word indexes, or None if two lines cannot hold it."""
    soudes = [m["texte"].replace(" ", _SOUDURE) for m in mots]
    dessine = lambda t: mesure(t.replace(_SOUDURE, " "))
    lignes = envelopper(" ".join(soudes), mesure=dessine, largeur_max=largeur_max)
    if len(lignes) > 2 or any(dessine(ligne) > largeur_max for ligne in lignes):
        return None
    coupe = len(lignes[0].split())
    return [list(range(coupe))] + ([list(range(coupe, len(mots)))] if len(lignes) == 2 else [])


def _coupe(mots):
    """How many words of a full group to keep before the next one starts.

    Where the speaker breathes when that keeps at least half of them, otherwise the
    latest word a group may end on. Never after a word that points forward.
    """
    permises = [c for c in range(len(mots), 0, -1) if _finissable(mots[c - 1]["texte"])]
    pauses = [c for c in permises if mots[c - 1]["texte"].rstrip("»”’)] ")[-1:] in _PAUSES]
    if pauses and pauses[0] * 2 >= len(mots):
        return pauses[0]
    return permises[0] if permises else len(mots)


def grouper(captions, mesure, largeur_max):
    """Cut timed captions into the groups that are read, each revealed word by word.

    A group is what the eye takes in at once: at most two lines of `largeur_max`
    as `mesure` draws them, cut where the speaker breathes. Its lines are decided
    here, once, from every word of it, so a word that arrives later has always had
    its place and nothing already on screen moves to make room.

    A word wider than the column is refused; the engine never shrinks text.
    """
    groupes = []
    for caption in captions:
        courant = []
        for mot in _mots_minutes(caption):
            courant.append(mot)
            while _lignes(courant, mesure, largeur_max) is None:
                if len(courant) == 1:
                    raise ValueError(f"Text overflow: {courant[0]['texte']!r} is wider than the caption column")
                plein = courant[:-1]
                coupe = _coupe(plein)
                groupes.append(plein[:coupe])
                courant = plein[coupe:] + [mot]
        groupes.append(courant)

    groupes = [{"mots": mots, "lignes": _lignes(mots, mesure, largeur_max),
                "debut": mots[0]["debut"], "fin": mots[-1]["fin"]} for mots in groupes if mots]
    for groupe, suivant in zip(groupes, groupes[1:] + [None]):
        pont = suivant and suivant["debut"] - groupe["fin"] <= PONT_S
        groupe["jusqua"] = max(groupe["fin"], suivant["debut"]) if pont else groupe["fin"] + MAINTIEN_S
    return groupes


def pivot(caption, mot):
    """Split a caption around its one accent word, for the plate to colour.

    Returns three pieces — before, the pivot, after — so the renderer never has
    to search the string again and cannot accidentally colour a second one.
    """
    if not mot:
        return caption, "", ""
    cible = _plie(mot)
    mots = caption.split()
    for i, m in enumerate(mots):
        if _plie(m) == cible:
            return " ".join(mots[:i]), mots[i], " ".join(mots[i + 1:])
    return caption, "", ""


def mot_accentue(groupe, accents):
    """Index of the one word of a group that takes the accent, or None.

    Whole words only, blind to case and accent: « Belge » does not light « Belges ».
    A group takes at most one, the first: an accent on every second word is the
    absence of an accent.
    """
    cibles = {_plie(a) for a in accents}
    for i, mot in enumerate(groupe["mots"]):
        if any(_plie(piece) in cibles for piece in mot["texte"].split()):
            return i
    return None


def contient(groupes, mot):
    """Whether a spoken word appears in any of the groups, by the same reading as `mot_accentue`."""
    return any(mot_accentue(g, [mot]) is not None for g in groupes)
