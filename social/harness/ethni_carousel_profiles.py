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


def _text(value):
    return isinstance(value, str) and bool(value.strip())


def errors(deck, cards=None):
    try:
        selected = profile(deck)
    except ValueError as error:
        return [str(error)]
    if selected is None:
        return []

    prefix = selected["label"]
    problems = []
    cards = deck.get("cartes") if cards is None else cards
    stages = selected["stages"]
    if not isinstance(cards, list) or len(cards) != len(stages):
        return [f"{prefix} : {len(stages)} cartes sont requises, dans l'ordre du profil"]
    if "serie" in deck and deck["serie"] != prefix:
        problems.append(f"{prefix} : `serie` doit reprendre le nom de la rubrique")
    if not _text(deck.get("campagne")):
        problems.append(f"{prefix} : `campagne` doit identifier le sujet")
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
        image = card.get("image")
        if not isinstance(image, dict) or not _text(image.get("fichier")):
            problems.append(f"{prefix} : carte {rank}, `image.fichier` doit être renseigné")

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


def brief(name):
    selected = load(name)
    cards = []
    for rank, stage in enumerate(selected["stages"], 1):
        cards.append({
            "rang": rank, "etape": stage["id"], "role": stage["role"],
            "titre": "", "corps": "", "source": "", "disposition": "auto",
            "image": {"fichier": "", "w": None, "h": None,
                      "cadrage": "50% 50%", "identite": "", "credit": "",
                      "depot": "", "licence": ""},
        })
    return {
        "profile": copy.deepcopy(selected), "guide": selected["guide"],
        "instructions": (REPO / selected["guide"]).read_text(encoding="utf-8"),
        "deck": {
            "profil": name, "campagne": "", "serie": selected["label"],
            "pilier": "EthniAfrica", "accent": "ocre", "fond": "nuit",
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
    music = deck["musique"]
    lines = [f"## {selected['label']}", "",
             f"Consignes : `{selected['guide']}`.",
             "Carrousel à faire défiler ; aucun reel généré par ce profil.", "",
             f"Musique : {music['artiste']} — {music['titre']} ({music['version']}).",
             f"Extrait : {music['extrait']}", "",
             "Le son est à ajouter sur chaque plateforme ; les PNG ne contiennent pas d'audio.", ""]
    for network in selected["formats"]["carrousel"]:
        review = music["plateformes"][network.lower()]
        lines.append(f"- {network} : {review['reference']} — {review['usage']}")
    return lines + [""]
