"""Opt-in editorial profiles shared by preparation and carousel rendering.

Decks without ``profil`` retain the existing format and distribution rules.
A named profile must resolve: a typo must never distribute a musical post to
all networks. The human instructions are read from their canonical file.
"""
import copy
import json
import pathlib
import re
from functools import lru_cache

HARNESS = pathlib.Path(__file__).resolve().parent
REPO = HARNESS.parents[1]


def load(name):
    if not isinstance(name, str) or not re.fullmatch(r"[a-z][a-z0-9-]*", name):
        raise ValueError(f"profil de carrousel invalide : {name!r}")
    return _load(name)


@lru_cache(maxsize=16)
def _load(name):
    file = HARNESS / "carousel-profiles" / f"{name}.json"
    if not file.is_file():
        raise ValueError(f"profil de carrousel inconnu : {name!r}")
    return json.loads(file.read_text(encoding="utf-8"))


def profile(deck):
    return load(deck["profil"]) if "profil" in deck else None


def formats(deck, default):
    selected = profile(deck)
    return tuple(selected["formats"]) if selected else default


def networks(deck, format_key):
    selected = profile(deck)
    return list(selected["formats"].get(format_key, [])) if selected else None


def label(deck):
    selected = profile(deck)
    return selected["label"] if selected else None


def visual(deck):
    selected = profile(deck)
    return selected.get("visual") if selected else None


def assumed_licence(deck):
    """The one licence wording the operator has taken responsibility for, or None.

    It is declared by the profile and read by the licence gate for that profile's
    decks only, so a protected work never clears the gate on the strength of a
    sentence typed into an ordinary deck.
    """
    selected = profile(deck)
    return selected.get("assumedLicence") if selected else None


def uses_image(deck, card):
    selected = visual(deck)
    return not selected or card.get("etape") in selected["imageStages"]


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def _image_problems(prefix, rank, image):
    problems = []
    for field in ("credit", "licence", "depot", "identite"):
        if field in image and not isinstance(image[field], str):
            problems.append(f"{prefix} : carte {rank}, `image.{field}` doit être du texte")
    focal = image.get("cadrage", "50% 50%")
    if (not isinstance(focal, str) or not re.fullmatch(r"\d+(?:\.\d+)?% \d+(?:\.\d+)?%", focal)
            or any(float(value[:-1]) > 100 for value in focal.split())):
        problems.append(f"{prefix} : carte {rank}, `image.cadrage` attend deux pourcentages de 0 à 100")
    return problems


def _sequence_errors(selected, deck, cards):
    """A variable-length deck: an opening, one card per item, a closing."""
    prefix = selected["label"]
    if not isinstance(cards, list) or len(cards) < 3:
        return [f"{prefix} : il faut une ouverture, au moins un livre et une clôture"]
    problems = []
    if "serie" in deck and deck["serie"] != prefix:
        problems.append(f"{prefix} : `serie` doit reprendre le nom de la rubrique")
    if not _text(deck.get("campagne")):
        problems.append(f"{prefix} : `campagne` doit identifier le sujet")
    opening, item, closing = selected["sequence"]
    required_by_role = {opening: ("titre",), item: ("titre", "precision"), closing: ("titre", "corps")}
    for rank, card in enumerate(cards, 1):
        if not isinstance(card, dict):
            problems.append(f"{prefix} : carte {rank} invalide")
            continue
        role = opening if rank == 1 else closing if rank == len(cards) else item
        if card.get("rang") != rank or card.get("role") != role:
            problems.append(f"{prefix} : carte {rank} attend `role={role}` et `rang={rank}`")
        for field in required_by_role[role]:
            if not _text(card.get(field)):
                problems.append(f"{prefix} : carte {rank}, `{field}` doit être renseigné")
        for field in ("corps", "source", "precision", "punchline"):
            if card.get(field) is not None and not isinstance(card[field], str):
                problems.append(f"{prefix} : carte {rank}, `{field}` doit être du texte")
        if card.get("disposition", "auto") not in ("auto", "A", "B", "C"):
            problems.append(f"{prefix} : carte {rank}, `disposition` attend auto, A, B ou C")
        image = card.get("image")
        if not isinstance(image, dict) or not _text(image.get("fichier")):
            problems.append(f"{prefix} : carte {rank}, `image.fichier` doit être renseigné")
        else:
            problems += _image_problems(prefix, rank, image)
    return problems


def errors(deck, cards=None):
    try:
        selected = profile(deck)
    except ValueError as error:
        return [str(error)]
    if selected is None:
        return []
    cards = deck.get("cartes") if cards is None else cards
    if "sequence" in selected:
        return _sequence_errors(selected, deck, cards)

    prefix = selected["label"]
    problems = []
    stages = selected["stages"]
    if not isinstance(cards, list) or len(cards) != len(stages):
        return [f"{prefix} : {len(stages)} cartes sont requises, dans l'ordre du profil"]
    if "serie" in deck and deck["serie"] != prefix:
        problems.append(f"{prefix} : `serie` doit reprendre le nom de la rubrique")
    if not _text(deck.get("campagne")):
        problems.append(f"{prefix} : `campagne` doit identifier le sujet")
    if "sujet" in deck and not isinstance(deck["sujet"], str):
        problems.append(f"{prefix} : `sujet` doit être du texte")
    for field, expected in (("fond", "nuit"), ("accent", "ocre")):
        if deck.get(field, expected) != expected:
            problems.append(f"{prefix} : la présentation approuvée impose `{field}={expected}`")
    for rank, (card, stage) in enumerate(zip(cards, stages), 1):
        if not isinstance(card, dict):
            problems.append(f"{prefix} : carte {rank} invalide")
            continue
        if (card.get("rang") != rank or card.get("etape") != stage["id"]
                or card.get("role") != stage["role"]):
            problems.append(f"{prefix} : carte {rank} attend `etape={stage['id']}` "
                            f"et `role={stage['role']}`")
        required = ("titre",) if rank == 1 else ("titre", "corps", "source")
        for field in required:
            if not _text(card.get(field)):
                problems.append(f"{prefix} : carte {rank}, `{field}` doit être renseigné")
        for field in ("corps", "source", "precision", "punchline"):
            if card.get(field) is not None and not isinstance(card[field], str):
                problems.append(f"{prefix} : carte {rank}, `{field}` doit être du texte")
        if card.get("disposition", "auto") not in ("auto", "memoires-sonores-v1"):
            problems.append(f"{prefix} : carte {rank}, conserver la disposition musicale")
        unused = ["images", "paires", "table", "chiffre"]
        if stage["id"] not in ("contexte", "ecoute"):
            unused.append("precision")
        if stage["id"] == "ecoute":
            unused.append("punchline")
        for field in unused:
            if card.get(field):
                problems.append(f"{prefix} : carte {rank}, `{field}` n'a pas de zone dans cette présentation")
        cut = card.get("coupe")
        if cut is not None and (not isinstance(cut, list) or not all(_text(line) for line in cut)):
            problems.append(f"{prefix} : carte {rank}, `coupe` doit être une liste de lignes")
        image = card.get("image")
        if uses_image(deck, card) and (not isinstance(image, dict) or not _text(image.get("fichier"))):
            problems.append(f"{prefix} : carte {rank}, `image.fichier` doit être renseigné")
        if uses_image(deck, card) and isinstance(image, dict):
            problems += _image_problems(prefix, rank, image)

    music = deck.get("musique")
    if not isinstance(music, dict):
        problems.append(f"{prefix} : `musique` doit identifier l'enregistrement et son usage")
        return problems
    for field in ("titre", "artiste", "version", "extrait"):
        if not _text(music.get(field)):
            problems.append(f"{prefix} : `musique.{field}` doit être renseigné")
    platforms = music.get("plateformes")
    platforms = platforms if isinstance(platforms, dict) else {}
    for network in selected["formats"]["carrousel"]:
        name = network.lower()
        review = platforms.get(name)
        if (not isinstance(review, dict) or review.get("verifie") is not True
                or not all(_text(review.get(field)) for field in ("reference", "usage"))):
            problems.append(f"{prefix} : documenter la référence du son, vérifier son usage "
                            f"sur {network} et poser `verifie: true`")
    return problems


def _sequence_brief(name, selected):
    image = {"fichier": "", "w": None, "h": None, "cadrage": "50% 50%", "couverture": "",
             "identite": "", "credit": "", "depot": "", "licence": selected["assumedLicence"]}
    cards = [{"rang": rank, "role": role, "titre": "", "precision": "", "corps": "",
              "punchline": "", "source": "", "disposition": "auto",
              "image": dict(image)}
             for rank, role in enumerate(selected["sequence"], 1)]
    return {
        "profile": copy.deepcopy(selected), "guide": selected["guide"],
        "instructions": (REPO / selected["guide"]).read_text(encoding="utf-8"),
        "deck": {"profil": name, "campagne": "", "serie": selected["label"],
                 "pilier": selected["label"], "accent": "ocre", "fond": "nuit", "cartes": cards},
    }


def brief(name):
    selected = load(name)
    if "sequence" in selected:
        return _sequence_brief(name, selected)
    cards = []
    for rank, stage in enumerate(selected["stages"], 1):
        card = {
            "rang": rank, "etape": stage["id"], "role": stage["role"],
            "titre": "", "corps": "", "source": "", "disposition": "auto",
            "precision": "", "punchline": "",
        }
        if stage["id"] in selected["visual"]["imageStages"]:
            card["image"] = {"fichier": "", "w": None, "h": None,
                      "cadrage": "50% 50%", "identite": "", "credit": "",
                      "depot": "", "licence": ""}
        cards.append(card)
    return {
        "profile": copy.deepcopy(selected), "guide": selected["guide"],
        "instructions": (REPO / selected["guide"]).read_text(encoding="utf-8"),
        "deck": {
            "profil": name, "campagne": "", "serie": selected["label"],
            "pilier": "EthniAfrica", "accent": "ocre", "fond": "nuit", "sujet": "",
            "musique": {"titre": "", "artiste": "", "version": "", "extrait": "",
                        "plateformes": {network.lower(): {"reference": "", "usage": "", "verifie": False}
                                        for network in selected["formats"]["carrousel"]}},
            "cartes": cards,
        },
    }


def report(deck):
    selected = profile(deck)
    if selected is None:
        return []
    if "sequence" in selected:
        items = sum(1 for c in deck["cartes"] if c["role"] == selected["sequence"][1])
        return [f"## {selected['label']}", "",
                f"Consignes : `{selected['guide']}`.",
                "Gabarit standard des carrousels : la couverture est la photographie de sa carte.",
                f"Carrousel à faire défiler ; {items} livre(s), aucun reel généré par ce profil.", ""]
    music = deck["musique"]
    lines = [f"## {selected['label']}", "",
             f"Consignes : `{selected['guide']}`.",
             f"Présentation approuvée : `{selected['visual']['id']}`.",
             "Carrousel à faire défiler ; aucun reel généré par ce profil.", "",
             f"Musique : {music['artiste']} — {music['titre']} ({music['version']}).",
             f"Extrait : {music['extrait']}", "",
             "Le son est à ajouter sur chaque plateforme ; les PNG ne contiennent pas d'audio.", ""]
    for network in selected["formats"]["carrousel"]:
        review = music["plateformes"][network.lower()]
        lines.append(f"- {network} : {review['reference']} — {review['usage']}")
    return lines + [""]
