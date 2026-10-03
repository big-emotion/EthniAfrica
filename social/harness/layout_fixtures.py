"""Synthetic decks and images for the composition library's tests and boards.

Nothing here is editorial: the people, places and recordings are placeholders and
the pictures are drawn, not photographed. They exist so a layout can be judged on
geometry (does the subject survive the crop, does the text fit) without borrowing
an approved episode's copy or a real person's face.
"""
import copy

from PIL import Image, ImageDraw

W, H = 2160, 2700  # the size §6 asks of a card meant for full frame

LICENCE = "CC0"


def _sky(top, bottom):
    image = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(image)
    for y in range(H):
        t = y / (H - 1)
        draw.line([(0, y), (W, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    return image


def portrait_image():
    """A head and shoulders in the upper half; the head is the subject."""
    image = _sky((96, 78, 60), (30, 24, 20))
    draw = ImageDraw.Draw(image)
    draw.ellipse((770, 330, 1390, 1010), fill=(176, 132, 96))
    draw.ellipse((330, 1050, 1830, 2100), fill=(58, 70, 96))
    return image


PORTRAIT_SUBJECT = [0.34, 0.11, 0.66, 0.39]


def document_image():
    """A sheet of ruled paper; the ruled area is the subject."""
    image = _sky((52, 44, 36), (24, 20, 16))
    draw = ImageDraw.Draw(image)
    draw.rectangle((330, 210, 1830, 1210), fill=(226, 214, 186))
    for y in range(300, 1150, 64):
        draw.line([(430, y), (1730, y)], fill=(120, 104, 80), width=6)
    return image


DOCUMENT_SUBJECT = [0.14, 0.07, 0.86, 0.46]


def route_image():
    """Two coasts, a sea between and a route with a dashed, uncertain stretch."""
    image = _sky((30, 58, 74), (18, 34, 44))
    draw = ImageDraw.Draw(image)
    draw.polygon([(0, 0), (700, 0), (560, 700), (0, 900)], fill=(84, 96, 70))
    draw.polygon([(W, 200), (1500, 260), (1560, 900), (W, 1100)], fill=(96, 84, 66))
    a, b, c = (420, 470), (1080, 760), (1740, 560)
    draw.line([a, b], fill=(232, 185, 106), width=14)
    for i in range(0, 12, 2):
        s = (b[0] + (c[0] - b[0]) * i / 12, b[1] + (c[1] - b[1]) * i / 12)
        e = (b[0] + (c[0] - b[0]) * (i + 1) / 12, b[1] + (c[1] - b[1]) * (i + 1) / 12)
        draw.line([s, e], fill=(232, 185, 106), width=14)
    for point in (a, c):
        draw.ellipse((point[0] - 34, point[1] - 34, point[0] + 34, point[1] + 34),
                     fill=(240, 232, 216))
    return image


ROUTE_SUBJECT = [0.12, 0.10, 0.88, 0.34]


def ground_image():
    """A plain dark ground, for cards whose picture is atmosphere and declares no subject."""
    return _sky((58, 50, 42), (22, 18, 14))


def _image(name, subject=None, **extra):
    image = {"fichier": name, "w": W, "h": H, "cadrage": "50% 50%",
             "identite": f"placeholder picture {name}", "credit": "Drawn for tests",
             "depot": "Test fixture", "licence": LICENCE,
             "verifie": {"par": "test", "le": "2026-09-29"}}
    if subject is not None:
        image["sujet"] = list(subject)
    image.update(extra)
    return image


def _card(rank, composition, title, image, role=None, **extra):
    card = {"rang": rank, "role": role or ("ouverture" if rank == 1 else "serie"),
            "composition": composition, "titre": title, "chiffre": False, "precision": "",
            "punchline": "", "corps": "", "source": "", "paires": None, "pivot": None,
            "titre_camps": None, "coupe": None, "disposition": "auto", "image": image}
    card.update(extra)
    return card


SOURCE = "Placeholder archive, test fixture"


def story_deck():
    """Historical portrait: figure, context, dated act, document, what remains."""
    return {
        "campagne": "fixture-story", "profil": "reading-story",
        "pilier": "EthniAfrica", "accent": "ocre", "fond": "nuit",
        "cartes": [
            _card(1, "cover", "Une figure, une question", _image("p.png", PORTRAIT_SUBJECT)),
            _card(2, "portrait", "La situation", _image("p.png", PORTRAIT_SUBJECT),
                  precision="Un lieu, une période", corps="Le contexte, en deux phrases.",
                  source=SOURCE),
            _card(3, "timeline", "Les faits, dans l'ordre", _image("g.png"),
                  paires=[{"terme": "1950", "glose": "Un premier fait"},
                          {"terme": "1958", "glose": "Un second fait"},
                          {"terme": "1960", "glose": "Un troisième fait"}],
                  relation="chronologie", corps="Trois dates, chacune sourcée.", source=SOURCE),
            _card(4, "document", "Ce que dit la pièce", _image("d.png", DOCUMENT_SUBJECT),
                  corps="Ce que le document établit, et ce qu'il ne dit pas.", source=SOURCE),
            _card(5, "credits", "Ce qui reste", _image("g.png"),
                  corps="Ce que le dossier laisse, et ses limites.", source=SOURCE),
        ],
    }


def route_deck():
    """Circulation, built from the same primitives: a map, dated stages, arrival."""
    deck = story_deck()
    deck["campagne"] = "fixture-route"
    deck["cartes"] = [
        _card(1, "cover", "Ce qui a voyagé", _image("r.png", ROUTE_SUBJECT)),
        _card(2, "map", "Le parcours attesté", _image("r.png", ROUTE_SUBJECT),
              precision="De la côte A à la côte B",
              corps="Le trait plein est attesté ; le pointillé est une hypothèse.",
              source=SOURCE),
        _card(3, "timeline", "Les étapes", _image("g.png"),
              paires=[{"terme": "1720", "glose": "Départ"},
                      {"terme": "1740", "glose": "Escale"}],
              relation="chronologie", corps="Chaque étape a sa source.", source=SOURCE),
        _card(4, "credits", "Ce que l'on ne sait pas", _image("g.png"),
              corps="Le tronçon central n'est pas documenté.", source=SOURCE),
    ]
    return deck


def comparison_deck():
    """Two cases asked the same question; equal weight, no derivation."""
    return {
        "campagne": "fixture-comparison", "profil": "reading-comparison",
        "pilier": "EthniAfrica", "accent": "ocre", "fond": "nuit",
        "cartes": [
            _card(1, "cover", "Deux cas, une même question", _image("p.png", PORTRAIT_SUBJECT)),
            _card(2, "portrait", "Le terme commun", _image("p.png", PORTRAIT_SUBJECT),
                  precision="Ce que chaque source entend par là", corps="Le terme, défini.",
                  source=SOURCE),
            _card(3, "comparison", "Premier critère", _image("g.png"),
                  paires=[{"terme": "Cas A", "glose": "Ce que disent les sources de A"},
                          {"terme": "Cas B", "glose": "Ce que disent les sources de B"}],
                  relation="comparaison", corps="Le critère, posé aux deux cas.",
                  source=SOURCE),
            _card(4, "credits", "Ce qui n'est pas comparé", _image("g.png"),
                  corps="Ce que les sources ne permettent pas.", source=SOURCE),
        ],
    }


def listening_deck():
    """Guided listening in a variable length, with the music notes it owes."""
    return {
        "campagne": "fixture-listening", "profil": "reading-listening",
        "pilier": "EthniAfrica", "accent": "ocre", "fond": "nuit",
        "musique": {
            "titre": "Recording fixture", "artiste": "Test artist", "version": "Studio",
            "extrait": "Opening phrase",
            "plateformes": {n: {"reference": f"test-sound-{n}",
                                "usage": "Synthetic fixture cleared for this test",
                                "verifie": True} for n in ("tiktok", "instagram")},
        },
        "cartes": [
            _card(1, "cover", "Une phrase à écouter", _image("p.png", PORTRAIT_SUBJECT)),
            _card(2, "listening", "Le premier détail", _image("p.png", PORTRAIT_SUBJECT),
                  precision="0:12–0:19", corps="Ce que l'oreille remarque ici.", source=SOURCE),
            _card(3, "credits", "L'enregistrement", _image("g.png"),
                  corps="Artiste, titre, année, ayant droit.", source=SOURCE),
        ],
    }


def name_carousel_deck():
    """Stand-in for an approved name carousel: no profile, standard gabarit, a
    derivation pair. The regression control for everything a profile might touch."""
    pair = [{"terme": "kilombo", "glose": "un campement, en Angola"},
            {"terme": "Quilombolas", "glose": "au Brésil"}]
    body = "Une explication, en deux phrases courtes."
    cards = [
        _card(1, None, "Ce nom vient-il d'ailleurs ?", _image("p.png")),
        _card(2, None, "La réponse", _image("p.png"), corps=body, source=SOURCE),
        _card(3, None, "Un nom, plusieurs appellations", _image("d.png"), corps=body,
              source=SOURCE),
        _card(4, None, "L'inventaire", _image("p.png"), paires=pair, corps=body, source=SOURCE),
        _card(5, None, "Une fiche", _image("d.png"), paires=pair, corps=body, source=SOURCE),
        _card(6, None, "Le classement", _image("p.png"), corps=body, source=SOURCE),
        _card(7, None, "La morale", _image("d.png"), corps=body, source=SOURCE),
        _card(8, None, "Notre objectif.", _image("p.png"), role="bascule",
              corps="Une phrase de clôture."),
    ]
    for card in cards:
        del card["composition"]
    return {"campagne": "fixture-name", "pilier": "EthniAfrica", "accent": "ocre",
            "fond": "nuit", "cartes": cards}


def images_for(deck):
    """The picture behind each card, keyed like the renderer keys them."""
    makers = {"p.png": portrait_image, "d.png": document_image, "r.png": route_image, "g.png": ground_image}
    cache = {}
    out = {}
    for card in deck["cartes"]:
        name = card["image"]["fichier"]
        cache.setdefault(name, makers[name]())
        out[card["rang"]] = cache[name]
    return out


def clone(deck):
    return copy.deepcopy(deck)
