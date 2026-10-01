"""The composition library: what a reading-profile card must carry, and what must
still be true of it once it is cropped for a destination.

A composition is **a slot contract plus checks over the one compositor**, not a
renderer. `ethni_compose.py` still draws every card in one of the three standard
dispositions; a composition only says which slots that card owes, which optional
block (a dated pair, a comparison pair, a subject zone) it is built on, and which
mistakes the machine can catch before a person has to look. Six narrative families
therefore need eight compositions between them, not six engines.
"""
import re

# Phone first: the ladder a review walks down, then up (tablet and desktop only
# ever see the same 1080-wide export scaled, so they can lose nothing that 320 keeps).
VIEWPORTS = (320, 390, 430, 768, 1200)

# §3's opening ceiling: past eight words the cover wraps a fifth line and stops
# reading as a thumbnail. Mirrors ethni_compose.MINIATURE_MOTS_MAX, which is not
# imported because the compositor imports the profiles that import this module.
COVER_WORDS_MAX = 8

TIMECODE = re.compile(r"^(\d{1,2}):(\d{2})(?:\s?[–-]\s?(\d{1,2}):(\d{2}))?$")

# The card fields that reach the reader, in the order the compositor reads them.
SLOT_LABEL = {"titre": "titre", "precision": "precision", "corps": "corps", "source": "source"}

COMPOSITIONS = {
    # the opening: a subject to recognise at thumbnail size
    "cover": {"slots": ("titre",), "subject": True},
    # a person, object or place shown and named, with one dated line under the title
    "portrait": {"slots": ("titre", "precision", "source"), "subject": True},
    # an archive sheet or scan the reader has to be able to see: never the word-only B
    "document": {"slots": ("titre", "corps", "source"), "subject": True, "refuse": ("B",)},
    # two to four dated entries side by side; the arrow means « then »
    "timeline": {"slots": ("titre", "corps", "source"), "pairs": "dated"},
    # two to four cases at equal weight; the divider claims no derivation
    "comparison": {"slots": ("titre", "corps", "source"), "pairs": "comparison"},
    # the route or the place, with the uncertain stretch said as uncertain
    "map": {"slots": ("titre", "precision", "corps", "source"), "subject": True},
    # one thing to hear, at a stated timecode, and what it carries
    "listening": {"slots": ("titre", "precision", "corps", "source"), "timecode": True},
    # the closing: sources and credits, never an appeal on its own
    "credits": {"slots": ("titre", "corps", "source")},
}

# Type floors as seen at 320 px, in CSS pixels. Measured on the standard gabarit's
# own sizes (title 96-120, precision 36, body 32, pair term 56, gloss 28, source 20 at
# k = 1) and rounded down, so they catch a composition that shrinks type below what
# the standard already draws and nothing else. They do NOT say 320 px is comfortable:
# the standard body is 9.5 px there. That is an open decision for the operator, not
# something a profile may quietly fix. Credits and the watermark are annexes, exempt.
PHONE_FLOOR = {"titre": 24, "chiffre": 24, "punchline": 18, "precision": 10,
               "corps": 9, "source": 5.5, "couple-terme": 14, "couple-glose": 8}
_EXEMPT = ("credit", "filigrane", "entete", "rang", "defilement")


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def _subject_problem(image):
    box = image.get("sujet")
    if box is None:
        return None
    ok = (isinstance(box, list) and len(box) == 4
          and all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in box)
          and 0 <= box[0] < box[2] <= 1 and 0 <= box[1] < box[3] <= 1)
    return None if ok else "`image.sujet` attend [x0, y0, x1, y1], des fractions de l'image " \
                           "avec x0 < x1 et y0 < y1"


def _pair_problems(kind, card):
    pairs = card.get("paires")
    if not isinstance(pairs, list) or not 2 <= len(pairs) <= 4:
        return ["`paires` attend de deux à quatre entrées"]
    problems = []
    if kind == "dated":
        for entry in pairs:
            if not re.search(r"\d", (entry or {}).get("terme") or ""):
                problems.append("chaque entrée d'une chronologie porte une date en chiffres "
                                f"dans `terme` (« {(entry or {}).get('terme')} »)")
    else:
        for entry in pairs:
            if not _text((entry or {}).get("glose")):
                problems.append("chaque cas d'une comparaison porte sa `glose`")
        if card.get("relation") != "comparaison":
            problems.append("`relation` doit valoir « comparaison » : sans elle la paire "
                            "s'affiche avec la flèche de la dérivation")
    return problems


def card_errors(card, prefix, rank, composition, allowed):
    """Every reason this card breaks its composition's contract, by field name."""
    where = f"{prefix} : carte {rank}"
    if composition not in COMPOSITIONS:
        return [f"{where}, composition inconnue « {composition} » ; attendu "
                f"{', '.join(sorted(COMPOSITIONS))}"]
    if composition != "cover" and composition not in allowed:
        return [f"{where}, la composition « {composition} » n'existe pas dans ce profil ; "
                f"attendu {', '.join(sorted(allowed))}"]
    spec = COMPOSITIONS[composition]
    problems = []
    for slot in spec["slots"]:
        if not _text(card.get(slot)):
            problems.append(f"{where}, `{slot}` doit être renseigné ({composition})")
    image = card.get("image") if isinstance(card.get("image"), dict) else {}
    if spec.get("subject") and image.get("sujet") is None:
        problems.append(f"{where}, `image.sujet` doit délimiter ce qui ne doit pas être "
                        f"rogné ni recouvert ({composition})")
    bad = _subject_problem(image)
    if bad:
        problems.append(f"{where}, {bad}")
    if spec.get("pairs"):
        problems += [f"{where}, {p}" for p in _pair_problems(spec["pairs"], card)]
    allowed_relation = {"comparison": "comparaison", "timeline": "chronologie"}.get(composition)
    if card.get("relation") is not None and card["relation"] != allowed_relation:
        problems.append(f"{where}, `relation` « {card['relation']} » n'existe pas sur "
                        f"« {composition} »"
                        + (f" (seule « {allowed_relation} » y existe)" if allowed_relation else ""))
    if spec.get("timecode"):
        match = TIMECODE.match((card.get("precision") or "").strip())
        if not match:
            problems.append(f"{where}, `precision` doit être un timecode m:ss ou m:ss–m:ss "
                            f"({composition})")
        elif match.group(3) and (int(match.group(3)) * 60 + int(match.group(4))
                                 <= int(match.group(1)) * 60 + int(match.group(2))):
            problems.append(f"{where}, la fin du timecode précède son début")
    if card.get("disposition") in spec.get("refuse", ()):
        problems.append(f"{where}, la disposition {card['disposition']} n'est pas permise "
                        f"sur un {composition}")
    if composition == "cover" and len((card.get("titre") or "").split()) > COVER_WORDS_MAX:
        problems.append(f"{where}, la couverture porte plus de {COVER_WORDS_MAX} mots ; "
                        f"elle ne se lira plus en miniature")
    return problems


def readability_problems(plan, fmt_key, viewport=320):
    """What a reader on a phone would lose. Overflow is reported, never absorbed."""
    import ethni_tokens as tk
    problems = [f"faute de composition : {f}" for f in plan.fautes]
    if plan.comprime:
        problems.append("la colonne n'a tenu qu'en réduisant le corps du texte")
    scale = viewport / tk.fmt(fmt_key)["w"]
    for bloc in plan.blocs:
        if not bloc.texte or not bloc.corps or bloc.nom.startswith(_EXEMPT):
            continue
        role = (f"couple-{bloc.nom.rsplit('-', 1)[1]}" if bloc.nom.startswith("couple-")
                else bloc.nom.split("-")[0])
        floor = PHONE_FLOOR.get(role)
        if floor and bloc.corps * scale < floor:
            problems.append(f"« {bloc.nom} » fait {bloc.corps * scale:.1f} px à {viewport} px, "
                            f"sous le plancher de {floor}")
    return problems


THUMBNAIL_WIDTH = 160
# The cover title is Anton 96 px at its smallest (80 when the engine steps down to keep
# two lines); at 160 px wide that is 14 px, so 10 px is the line below which a
# composition has shrunk it. Nothing else on a cover is expected to read that small.
THUMBNAIL_TITLE_FLOOR = 10


def thumbnail_problems(plan, fmt_key):
    """A cover is judged small first: a feed thumbnail shows the title and little else."""
    import ethni_tokens as tk
    title = plan.bloc("titre")
    if title is None:
        return ["la couverture n'a pas de titre au plan"]
    size = title.corps * THUMBNAIL_WIDTH / tk.fmt(fmt_key)["w"]
    if size < THUMBNAIL_TITLE_FLOOR:
        return [f"le titre de couverture fait {size:.1f} px à {THUMBNAIL_WIDTH} px de large, "
                f"sous {THUMBNAIL_TITLE_FLOOR}"]
    return []


def _visible_subject(card_image, image_size, fmt_key):
    """The subject box in card pixels after the object-fit cover crop."""
    import ethni_tokens as tk
    cadre = tk.fmt(fmt_key)
    width, height = cadre["w"], cadre["h"]
    scale = max(width / image_size[0], height / image_size[1])
    scaled = (image_size[0] * scale, image_size[1] * scale)
    fx, fy = (float(v.strip().rstrip("%")) / 100
              for v in (card_image.get("cadrage") or "50% 50%").split())
    dx, dy = (scaled[0] - width) * fx, (scaled[1] - height) * fy
    x0, y0, x1, y1 = card_image["sujet"]
    return (x0 * scaled[0] - dx, y0 * scaled[1] - dy, x1 * scaled[0] - dx, y1 * scaled[1] - dy)


def zone_problems(card, plan, fmt_key, image):
    """Is the declared subject still visible, and still uncovered, at this destination?

    Three ways to lose a face or a route: the crop discards it, text lands on it, or
    a 9:16 destination puts it under the platform's interface. All three are
    geometry, so all three are checked on the plan the renderer will draw.
    """
    import ethni_tokens as tk
    picture = card.get("image") or {}
    if picture.get("sujet") is None:
        return []
    cadre = tk.fmt(fmt_key)
    left, top, right, bottom = _visible_subject(picture, image.size, fmt_key)
    problems = []
    if left < -0.5 or top < -0.5 or right > cadre["w"] + 0.5 or bottom > cadre["h"] + 0.5:
        problems.append(f"recadrage : le sujet sort du cadre {fmt_key} ; déplace `image.cadrage` "
                        f"ou choisis une autre image")
    if cadre["h"] == 1920 and bottom > 1620:
        problems.append("le sujet descend sous y = 1620, dans la zone d'interface de la plateforme")
    # The scrim ramp darkens the photograph above the text column. Its stops put 20 %
    # of the darkening 55 % of the way down, so a subject reaching past that point is
    # being dimmed by the card's own legibility layer even where no letter touches it.
    ramp = plan.bloc("voile-rampe")
    if ramp is not None and bottom > ramp.y + 0.55 * ramp.h:
        problems.append("le voile qui porte le texte assombrit le bas du sujet ; "
                        "choisis une image dont le sujet est plus haut")
    for bloc in plan.blocs:
        if not bloc.texte:
            continue
        if bloc.x < right and bloc.x + bloc.w > left and bloc.y < bottom and bloc.y + bloc.h > top:
            problems.append(f"le texte « {bloc.nom} » recouvre le sujet ; raccourcis-le ou "
                            f"choisis une image dont le sujet est plus haut")
    return problems
