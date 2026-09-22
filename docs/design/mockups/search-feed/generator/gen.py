"""Generate the « Fil des noms » boards — version 2, token-faithful.

Every value below is what the design system renders at 430 and 1280 px: the
nine type roles computed at those widths, the spacing ramp, the two radii, the
page shell measured on the live page, and the night values `.dark` actually
binds. The boards are therefore reproducible to the pixel by code that only
uses tokens. Night boards are the day boards with the `.dark` substitution
(`NIGHT`), never drawn by hand.

Where a value comes from:
  type      src/styles/tokens/type.css (clamps evaluated at 430 and 1280)
  colour    src/styles/tokens/color.css (`.dark`, accent scopes :434-533)
  space     src/styles/tokens/space.css, brand charter §7 ramp
  radius    src/styles/tokens/radius.css, actions charter §6
  shell     measured on /fr/atlas/recherche: header 61, main py-8, two nested
            .afh-shell (12+12 px at 430; 1152 px content at 1280,
            the result page lifting the shell cap with PageLayout wide)
"""
import re, sys
SERIF = "font-family: 'Fraunces', Georgia, serif;"
CLAMP = "display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; "

# ---------------------------------------------------------------- tokens (day)
BG, SURFACE, WARM, LINE = "#fbf7f2", "#ffffff", "#f5ede0", "#e8dfd3"
TEXT, SOFT = "#2c2018", "#746557"
OCRE, OCRE_INK, OCRE_TINT, OCRE_FG = "#c9821f", "#835514", "#f1d9ae", "#1a1208"
TERRE_INK, TERRE_TINT, TERRE_FG = "#974331", "#f0d2c8", "#000000"
COLONIAL = "#9b3030"
MEDIA_BG, MEDIA_INK = "rgba(18, 14, 10, 0.72)", "#f1e7d8"

# `.dark` rebinding (color.css:387-422, :514-533). Tints and on-tint inks are
# deliberately not rebound: an accent fill stays a light patch at night.
NIGHT = {
    BG: "#120e0a", SURFACE: "#271e14", WARM: "#1d1710", LINE: "#3a2e1f",
    TEXT: "#f1e7d8", SOFT: "#c9b99f", OCRE_INK: "#c9821f", TERRE_INK: "#cd725e",
    COLONIAL: "#d98a7a",
}

# ---------------------------------------------------------------- type roles
def role(name, d):
    """(size px, line-height) of a type role at 430 (mobile) or 1280 (desktop)."""
    return {
        "hero": (52, 1.05) if d else (34.88, 1.05),
        "h3": (23, 1.3) if d else (19.2, 1.3),
        "body": (19, 1.65) if d else (17.1, 1.65),
        "small": (16, 1.5),
        "caption": (13, 1.45),
        "eyebrow": (12, 1.4),
    }[name]


def t(name, d, weight=400, serif=False, extra=""):
    size, lh = role(name, d)
    fam = SERIF if serif else ""
    return f"{fam} font-size: {size}px; line-height: {lh}; font-weight: {weight}; {extra}"


def eyebrow(d, color=OCRE_INK, tracking="0.16em"):
    return t("eyebrow", d, 600, extra=f"text-transform: uppercase; letter-spacing: {tracking}; color: {color};")


R = "border-radius: 14px;"        # --afh-radius-lg: every surface and control
PILL = "border-radius: 9999px;"   # --afh-radius-full: chips
GAP_SECTION = lambda d: 48 if d else 24   # --afh-section-gap at 1280 / 430

IMG = {
    "malinke": "../../../../public/images/anecdotes/malinke-manden.jpg",
    "bambara": "../../../../public/images/anecdotes/bambara-refus.jpg",
    "dioula": "../../../../public/images/anecdotes/dioula-metier.jpg",
    "peul": "../../../../public/images/anecdotes/peul-dix-noms.jpg",
    "fulbe": "../../../../public/images/anecdotes/fulbe-quatre-noms.jpg",
    "fang": "../../../../public/images/anecdotes/fang-reputation.jpg",
    "bassange": "../../../../public/images/anecdotes/bassa-nge-distinction.jpg",
    "mansa": "../../../../public/images/discoveries/generated/mansa-musa/4x5.jpg",
    "nigeria": "../../../../public/images/anecdotes/nigeria-flora-shaw.jpg",
    "lingala": "../../../../public/images/anecdotes/lingala.jpg",
}
POSTERS = {}  # slug -> url, filled by build.py from posters.json

TIER_LABEL = {"official": "Officielle", "referenced": "Référencée", "unverified": "Non vérifiée"}


def slug(name):
    import unicodedata
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return "".join(c if c.isalnum() else "-" for c in s).strip("-")


def badge(tier):
    # SourceStandingBadge: rounded-none px-2 py-0.5 text-afh-eyebrow font-medium bg-afh-bg-warm text-afh-text-soft
    return (f'<span data-source-standing="{tier}" style="display: inline-block; border-radius: 0; padding: 2px 8px; '
            f'{t("eyebrow", False, 500)} background: {WARM}; color: {SOFT};">{TIER_LABEL[tier]}</span>')


def link(text, d, size="caption", weight=700):
    return f'<a href="#lien" style="{t(size, d, weight)} color: {OCRE_INK};">{text}</a>'


def h2(text, d, sub=None, action=None, anchor=None):
    ident = f' id="{anchor}"' if anchor else ""
    out = (f'<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">'
           f'<h2{ident} style="margin: 0; {t("h3", d, 700, True)} color: {TEXT};">{text}</h2>')
    if action:
        out += f'<a href="#voir" style="{t("small", d, 600)} color: {OCRE_INK}; white-space: nowrap;">{action}</a>'
    out += "</div>"
    if sub:
        out += f'<p style="margin: 4px 0 0 0; {t("caption", d)} color: {SOFT};">{sub}</p>'
    return out


# ---------------------------------------------------------------- chrome (outside the parity clip)

def header(d):
    pad = "0 32px" if d else "0 12px"
    nav = ('<div style="display: flex; gap: 24px; font-size: 14px; color: #746557;"><span>Parcourir</span>'
           '<span>Les dossiers</span><span>Jouer</span><span>À propos</span></div>') if d else ""
    return (f'<div style="height: 61px; box-sizing: border-box; padding: {pad}; border-bottom: 1px solid {LINE}; '
            f'display: flex; align-items: center; justify-content: space-between;">'
            f'<div style="display: flex; align-items: baseline; gap: 10px;"><div style="{SERIF} font-weight: 700; font-size: 18px; color: {TEXT};">EthniAfrica</div>'
            f'<div style="font-size: 12px; color: {SOFT};">D&#39;où viennent les noms</div></div>{nav}</div>')


SR = "position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;"
ICON = f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{SOFT}" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>'


def search(c, d, fid):
    width = "width: 640px; margin: 0 auto;" if d else ""
    return (f'<div style="{width} position: relative;"><label for="{fid}" style="{SR}">Rechercher un nom</label>'
            f'<div style="height: 48px; box-sizing: border-box; display: flex; align-items: center; gap: 8px; background: {SURFACE}; '
            f'border: 1px solid {LINE}; {R} padding: 0 16px;">{ICON}'
            f'<input id="{fid}" type="search" value="{c["q"]}" style="border: 0; outline: 0; {t("small", d)} font-family: inherit; color: {TEXT}; background: transparent; width: 100%;">'
            f'<span aria-hidden="true" style="color: {SOFT}; font-size: 16px;">×</span></div></div>')


def lenses(c, d):
    width = "width: 640px; margin: 12px auto 0 auto;" if d else "margin-top: 12px;"
    items = [("Tout", None, True)] + [(k, v, False) for k, v in c.get("lens", []) if v]
    out = (f'<nav class="feed-lenses" data-feed-block="lenses" data-feed-zone="first" aria-label="Filtrer les résultats" '
           f'style="{width} display: flex; gap: 8px; flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none;">')
    base = (f"appearance: none; flex: none; box-sizing: border-box; min-height: 44px; display: inline-flex; "
            f"align-items: center; padding: 0 16px; {PILL} text-decoration: none; border: 0; font-family: inherit; "
            f"cursor: pointer; {t('caption', d, 700)}")
    for label, n, on in items:
        if on:
            out += f'<button type="button" aria-pressed="true" style="{base} background: {TEXT}; color: {BG};">{label}</button>'
        else:
            count = f'&nbsp;<span style="color: {SOFT}; font-weight: 600;">{n}</span>' if n is not True else ""
            out += f'<button type="button" aria-pressed="false" style="{base} background: {SURFACE}; border: 1px solid {LINE}; color: {TEXT};">{label}{count}</button>'
    return out + "</nav>"


# ---------------------------------------------------------------- first screen

def answer(c, d):
    ey = c.get("eyebrow", "D&#39;où vient ce nom")
    if c.get("kind"):
        ey += f' <span style="color: {SOFT};">· {c["kind"]}</span>'
    out = (f'<div style="{eyebrow(d)}">{ey}</div>'
           f'<h1 style="margin: {8 if d else 4}px 0 0 0; {t("hero", d, 900, True)} color: {TEXT};">{c["name"]}</h1>')
    if c.get("verdict_plain"):
        out += (f'<div style="margin-top: 12px;"><div style="{t("h3", d, 700, True)} color: {TEXT};">{c["verdict"]}</div>'
                + (f'<p style="margin: 8px 0 0 0; {CLAMP}{t("small", d)} color: {TEXT};">{c["sub"]}</p>' if c.get("sub") else "") + "</div>")
        return out
    # afh-accent-terre wrapper: tint fill, terre-ink rule, on-tint ink for the words.
    sub = c.get("sub")
    out += (f'<div style="margin-top: {12 if d else 8}px; background: {TERRE_TINT}; border-left: {4 if d else 3}px solid {TERRE_INK}; '
            f'border-radius: 0 14px 14px 0; padding: {"16px 24px" if d else "12px 16px"};">'
            f'<div style="{t("small", d, 700)} color: {TERRE_FG};">{c["verdict"]}</div>'
            + (f'<p style="margin: 4px 0 0 0; {CLAMP}{t("small" if d else "caption", d)} color: {TERRE_FG};">{sub}</p>' if sub else "")
            + "</div>")
    return out


def chip(form, d):
    """A label, not a control: no 44 px minimum."""
    name, tag, style = form
    border = {"you": OCRE, "bad": COLONIAL}.get(style, LINE)
    bg = WARM if style == "own" else SURFACE
    tagcol = {"you": OCRE_INK, "bad": COLONIAL, "own": OCRE_INK}.get(style, SOFT)
    tagw = 700 if style in ("you", "bad", "own") else 400
    show_tag = tag and (d or style in ("you", "bad", "own"))
    tg = f'<span style="{t("eyebrow", d, tagw)} color: {tagcol};">{tag}</span>' if show_tag else ""
    return (f'<span style="display: inline-flex; align-items: baseline; gap: 8px; background: {bg}; border: 1px solid {border}; '
            f'{PILL} padding: 4px 12px;"><span style="{t("small", d, 700, True)} color: {TEXT};">{name}</span>{tg}</span>')


def appellations(c, d):
    title = c.get("forms_title", "Les appellations")
    sub = c.get("forms_sub", "Le nom que chaque peuple se donne d&#39;abord, puis les autres. Aucune n&#39;est « la bonne ».") if d else None
    out = h2(title, d, sub)
    cap = 4 if d else 3
    forms = list(c["forms"])
    searched = [f for f in forms if f[2] == "you"]
    shown = forms[:cap]
    if searched and searched[0] not in shown:
        shown = shown[: cap - 1] + [searched[0]]
    rest = len(forms) - len(shown)
    more = (f'<a href="#origines" style="align-self: center; {t("caption", d, 700)} color: {OCRE_INK}; padding: 0 4px;">'
            f'+{rest} autre{"s" if rest > 1 else ""}</a>') if rest > 0 else ""
    out += f'<div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">{"".join(chip(f, d) for f in shown)}{more}</div>'
    return out


def poster(s, i, d, w):
    title, dur, label = s
    h = round(w * 16 / 9)
    chip_style = f"position: absolute; top: 8px; {t('eyebrow', d, 700)} color: {MEDIA_INK}; background: {MEDIA_BG}; {PILL} padding: 2px 8px;"
    size = 36 if d else 32
    return (f'<a href="#short-{i}" style="flex: none; width: {w}px; text-decoration: none; color: {TEXT};">'
            f'<div style="position: relative; width: {w}px; height: {h}px; {R} overflow: hidden;">'
            f'<img src="{POSTERS[slug(title)]}" alt="Couverture : D’où vient le nom «&nbsp;{title}&nbsp;» ?" style="width: {w}px; height: {h}px; object-fit: cover; display: block;">'
            f'<span style="{chip_style} right: 8px;">{dur}</span>'
            f'<svg width="{size}" height="{size}" viewBox="0 0 36 36" aria-hidden="true" style="position: absolute; top: 44%; left: 50%; margin-left: -{size // 2}px;">'
            f'<circle cx="18" cy="18" r="18" fill="{MEDIA_INK}"></circle><path d="M14 11 L26 18 L14 25 Z" fill="#120e0a"></path></svg></div>'
            f'<div style="margin-top: 8px; {t("caption", d, 700)} color: {TEXT};">D’où vient le nom «&nbsp;{title}&nbsp;» ?</div>'
            f'<div style="{t("eyebrow", d)} color: {SOFT};">{dur} · {label or "Découvertes"}</div></a>')


def empty_poster(p, d, w):
    title, lines, action = p
    h = round(w * 16 / 9)
    return (f'<div style="flex: none; width: {w}px;"><div style="width: {w}px; height: {h}px; box-sizing: border-box; border: 1px dashed {LINE}; {R} '
            f'padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">'
            f'<div style="{t("small", d, 700, True)} text-transform: uppercase; color: {SOFT};">{title}</div>'
            f'<div style="{t("caption", d)} color: {SOFT};">{lines}</div>'
            f'<a href="#proposer" style="{t("caption", d, 700)} color: {OCRE_INK};">{action}</a></div>'
            f'<div style="margin-top: 8px; {t("caption", d, 700)} color: {SOFT};">Pas encore de short</div></div>')


def shorts(c, d):
    sh = c["shorts"]
    w = 160 if d else 130
    out = h2(sh.get("title", "Les shorts"), d, sh.get("sub") if d else None, "Tout voir →")
    items, i = "", 0
    if sh.get("empty"):
        items += empty_poster(sh["empty"], d, w)
    for s in sh.get("items", [])[: (6 if d else 5) - (1 if sh.get("empty") else 0)]:
        items += poster(s, i, d, w)
        i += 1
    if sh.get("note"):
        out += f'<div style="margin-top: 8px; {t("caption", d, 700)} color: {OCRE_INK};">{sh["note"]}</div>'
    out += f'<div data-row="shorts" role="list" style="margin-top: {12 if d else 8}px; display: flex; gap: {16 if d else 12}px; overflow: hidden;">{items}</div>'
    return out


# ---------------------------------------------------------------- the feed

def card_title(text, d, size="body"):
    return f'<div style="{t(size, d, 700, True)} line-height: 1.3; color: {TEXT};">{text}</div>'


def origin_card(o, d, w=None):
    name, tag, text, today, tier, style = o
    border = {"you": OCRE, "bad": COLONIAL}.get(style, LINE)
    tagcol = {"you": OCRE_INK, "bad": COLONIAL, "own": OCRE_INK}.get(style, SOFT)
    width = f"flex: none; width: {w}px;" if w else ""
    out = (f'<div style="{width} box-sizing: border-box; background: {SURFACE}; border: 1px solid {border}; {R} padding: 16px; display: flex; flex-direction: column; gap: 8px;">'
           f'<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;">{card_title(name, d)}'
           f'<div style="{t("eyebrow", d, 700)} color: {tagcol}; text-align: right;">{tag}</div></div>'
           f'<p style="margin: 0; {t("small", d)} color: {TEXT};">{text}</p>')
    if today:
        lab, txt = today if isinstance(today, tuple) else ("Aujourd&#39;hui", today)
        out += f'<p style="margin: 0; {t("caption", d)} color: {SOFT};"><strong style="color: {TEXT};">{lab}</strong> — {txt}</p>'
    if tier:
        out += f'<div style="display: flex; gap: 8px; align-items: center;">{badge(tier)}{link("Voir la source", d)}</div>'
    return out + "</div>"


def origins(c, d):
    o = c["origins"]
    out = h2(o.get("title", "D&#39;où elles viennent"), d, o.get("sub"), anchor="origines")
    if o.get("lede"):
        out += f'<p style="margin: 12px 0 0 0; {t("small", d)} color: {TEXT};">{o["lede"]}</p>'
    if d:
        out += f'<div style="margin-top: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">{"".join(origin_card(x, d) for x in o["cards"])}</div>'
    else:
        out += f'<div role="list" style="margin-top: 12px; display: flex; gap: 12px; overflow: hidden;">{"".join(origin_card(x, d, 290) for x in o["cards"])}</div>'
        if len(o["cards"]) > 1:
            out += f'<div style="margin-top: 8px; {t("eyebrow", d)} color: {SOFT};">Glissez · {len(o["cards"])} formes</div>'
    out += f'<div style="margin-top: 12px;">{link("Il en manque une&nbsp;? Proposer une source →", d, "small")}</div>'
    return out


def tiles(tl, d):
    out = h2(tl["title"], d, tl.get("sub"))
    cells = "".join(
        f'<a href="#fiche" style="text-decoration: none; background: {WARM}; {R} padding: 12px;">'
        f'<div style="{t("small", d, 700)} color: {TEXT};">{a}</div><div style="{t("caption", d)} color: {SOFT};">{b}</div></a>'
        for a, b in tl["items"])
    out += f'<div style="margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{cells}</div>'
    if tl.get("link"):
        out += f'<div style="margin-top: 12px;">{link(tl["link"], d, "small")}</div>'
    return out


def people_cards(p, d):
    out = h2(p["title"], d, p.get("sub"))
    cards = "".join(
        f'<a href="#p" style="box-sizing: border-box; text-decoration: none; background: {SURFACE}; border: 1px solid {LINE}; {R} padding: 16px; display: flex; flex-direction: column; gap: 8px;">'
        f'{card_title(x[0], d)}<div style="{t("caption", d)} color: {SOFT};">{x[1]}</div>'
        f'<p style="margin: 0; {t("small", d)} color: {TEXT};">{x[2]}</p></a>'
        for x in p["items"])
    cols = f"repeat({len(p['items'])}, minmax(0, 1fr))" if d else "minmax(0, 1fr)"
    return out + f'<div style="margin-top: 12px; display: grid; grid-template-columns: {cols}; gap: 12px;">{cards}</div>'


def plate(p, d, w):
    if p["type"] == "anecdote":
        ih = round(w * 0.62)
        return (f'<a href="#anecdote" style="flex: none; width: {w}px; box-sizing: border-box; text-decoration: none; background: {SURFACE}; border: 1px solid {LINE}; {R} overflow: hidden; display: flex; flex-direction: column;">'
                f'<img src="{IMG[p["img"]]}" alt="{p["alt"]}" style="width: {w}px; height: {ih}px; object-fit: cover; display: block;">'
                f'<div style="padding: 12px 16px 16px 16px; display: flex; flex-direction: column; gap: 8px;">'
                f'<div style="{eyebrow(d, tracking="0.14em")}">Anecdote · {p["about"]}</div>'
                f'{card_title(p["headline"], d)}<div>{badge(p["tier"])}</div>'
                f'<div style="{t("caption", d)} color: {SOFT};">Photo : {p["credit"]}</div></div></a>')
    return (f'<a href="#proverbe" style="flex: none; width: {w}px; box-sizing: border-box; text-decoration: none; background: {WARM}; {R} padding: 16px; display: flex; flex-direction: column; gap: 8px;">'
            f'<div style="{eyebrow(d, tracking="0.14em")}">Proverbe {p["lang"]}</div>'
            f'{card_title("« " + p["text"] + " »", d)}'
            f'<div lang="{p["iso"]}" style="{t("small", d)} font-style: italic; color: {SOFT};">{p["original"]}</div>'
            + (f'<p style="margin: 0; {t("small", d)} color: {TEXT};">{p["meaning"]}</p>' if p.get("meaning") else "")
            + f'<div style="{t("caption", d)} color: {SOFT};">{p["origin"]}</div></a>')


def plates(c, d):
    out = h2("Anecdotes et proverbes", d, c.get("plates_sub"), "Tout voir →")
    w = 232 if d else 250   # three plates fill the 730 px main column exactly
    return out + f'<div role="list" style="margin-top: 12px; display: flex; gap: {16 if d else 12}px; overflow: hidden; align-items: stretch;">{"".join(plate(p, d, w) for p in c["plates"])}</div>'


def quiz(c, d):
    q = c["quiz"]
    opts = "".join(
        f'<button type="button" style="font-family: inherit; {t("small", d, 700)} color: {TEXT}; background: {SURFACE}; border: 1px solid {LINE}; {R} padding: 8px 16px; min-height: 44px; text-align: left; cursor: pointer;">{o}</button>'
        for o in q["options"])
    return (f'<div style="background: {SURFACE}; border: 1px solid {OCRE}; {R} padding: 16px; display: flex; flex-direction: column; gap: 12px;">'
            f'<div style="{eyebrow(d, tracking="0.14em")}">Joue avec ce nom</div>'
            f'<div style="{t("h3", d, 700, True)} color: {TEXT};">{q["q"]}</div>'
            f'<div style="display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px;">{opts}</div>'
            f'<div style="display: flex; justify-content: space-between; gap: 12px; {t("caption", d)} color: {SOFT};"><span>{q["count"]}</span>{link("Toutes les questions →", d)}</div></div>')


def gen_image(c, d):
    g = c["image"]
    w = 300
    h = round(w * 5 / 4)
    return (h2("Les images", d, "Des interprétations, jamais des portraits.")
            + f'<div style="margin-top: 12px; width: {w}px; box-sizing: border-box; background: {SURFACE}; border: 1px solid {LINE}; {R} overflow: hidden;">'
            f'<div style="padding: 8px 12px; {t("caption", d, 700)} color: {OCRE_FG}; background: {OCRE_TINT};">Image générée — une interprétation</div>'
            f'<img src="{IMG[g["img"]]}" alt="{g["alt"]}" style="width: {w}px; height: {h}px; object-fit: cover; display: block;">'
            f'<div style="padding: 12px 16px 16px 16px; display: flex; flex-direction: column; gap: 8px;">{card_title(g["caption"], d)}'
            f'<div style="display: flex; gap: 8px; align-items: center;">{badge(g["tier"])}<span style="{t("caption", d)} color: {SOFT};">{g["source"]}</span></div>'
            f'<div style="{t("caption", d)} color: {SOFT};">{g["licence"]}</div></div></div>')


def prose(p, d):
    paras = "".join(f'<p style="margin: {0 if i == 0 else 12}px 0 0 0; {t("small", d)} color: {TEXT};">{x}</p>' for i, x in enumerate(p["paras"]))
    foot = f'<div style="margin-top: 12px; display: flex; gap: 8px; align-items: center;">{badge(p["tier"])}{link("Voir la source", d)}</div>' if p.get("tier") else ""
    return h2(p["title"], d) + f'<div style="margin-top: 12px; background: {SURFACE}; border: 1px solid {LINE}; {R} padding: 16px;">{paras}{foot}</div>'


def facts(f, d):
    cells = "".join(
        f'<div style="background: {WARM}; {R} padding: 12px;"><div style="{t("caption", d)} color: {SOFT};">{a}</div><div style="{t("small", d, 700)} color: {TEXT};">{b}</div></div>'
        for a, b in f["items"])
    return h2(f["title"], d, f.get("sub")) + f'<div style="margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{cells}</div>'


def fiches(c, d):
    cells = "".join(
        f'<a href="#fiche" style="box-sizing: border-box; text-decoration: none; background: {SURFACE}; border: 1px solid {LINE}; {R} padding: 12px 16px; display: flex; flex-direction: column; gap: 4px;">'
        f'<div style="{eyebrow(d, SOFT, "0.14em")}">{kind}</div>{card_title(name, d)}<div style="{t("caption", d)} color: {SOFT};">{meta}</div></a>'
        for kind, name, meta in c["fiches"])
    n = len(c["fiches"])
    cols = min(4, n) if d else (1 if n == 1 else 2)
    return (h2("Les fiches", d, "Pour aller au fond&nbsp;: chaque fiche, avec toutes ses sources.")
            + f'<div style="margin-top: 12px; display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); gap: 12px;">{cells}</div>')


def band(c, d, stacked=False):
    b = c["band"]
    sil = "".join(
        f'<div style="border: 1px dashed {LINE}; {R} padding: 16px;"><div style="{t("small", d, 700)} color: {SOFT};">{a}</div>'
        f'<div style="margin-top: 4px; {t("caption", d)} color: {SOFT};">{x}</div></div>' for a, x in b.get("silences", []))
    s = (f'<div data-feed-part="silences">{h2("Ce que nous ne savons pas encore", d, "Un silence déclaré, pas un oubli.")}'
         + f'<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 12px;">{sil}</div></div>') if b.get("silences") else ""
    conv = (f'<div data-feed-part="conviction" style="background: {WARM}; {R} padding: 16px;"><div style="{t("small", d, 700)} color: {TEXT};">{b["conv"][0]}</div>'
            f'<p style="margin: 4px 0 0 0; {t("small" if d else "caption", d)} color: {TEXT};">{b["conv"][1]}</p></div>')
    inv = (f'<div data-feed-part="invitation" style="background: {SURFACE}; border: 1px solid {OCRE}; {R} padding: 16px;"><div style="{t("small", d, 700)} color: {TEXT};">{b.get("invite", "Nous nous sommes trompés&nbsp;?")}</div>'
           f'<p style="margin: 4px 0 12px 0; {t("small", d)} color: {TEXT};">{b.get("invite_sub", "Si vous connaissez une source sur l&#39;un de ces noms, elle sera lue.")}</p>'
           f'<button type="button" style="font-family: inherit; {t("small", d, 600)} color: {OCRE_FG}; background: {OCRE_TINT}; border: 1px solid {OCRE}; {R} padding: 0 16px; min-height: 44px; cursor: pointer;">{b.get("button", "Proposer une source")}</button></div>')
    if not s:
        cols = "repeat(2, minmax(0, 1fr))" if d and not stacked else "minmax(0, 1fr)"
        return f'<div style="display: grid; grid-template-columns: {cols}; gap: 16px; align-items: start;">{conv}{inv}</div>'
    if d and not stacked:
        return (f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 32px; align-items: start;">'
                f'<div style="grid-column: span 6;">{s}</div><div style="grid-column: span 6; display: flex; flex-direction: column; gap: 16px;">{conv}{inv}</div></div>')
    return s + f'<div style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px;">{conv}{inv}</div>'


def further(c, d):
    links = "".join(
        f'<a href="#f" style="box-sizing: border-box; min-height: 44px; display: inline-flex; align-items: center; {t("caption", d, 600)} color: {TEXT}; border: 1px solid {LINE}; background: {SURFACE}; {PILL} padding: 0 16px; text-decoration: none;">{x}</a>'
        for x in c["further"])
    return (f'<div style="{eyebrow(d, SOFT, "0.14em")}">Aller plus loin</div>'
            f'<div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">{links}</div>')


# ---------------------------------------------------------------- assembly

MAIN_COLUMN = {"origins", "peoples", "plates", "fiches"}


def present_feed_keys(c):
    source = {
        "origins": "origins",
        "peoples": "people",
        "tiles": "tiles",
        "plates": "plates",
        "quiz": "quiz",
        "images": "image",
        "atlas-holds": "facts",
        "problem": "prose",
        "shared-name": "prose",
        "near-name": "prose2",
        "fiches": "fiches",
    }
    return [key for key in c.get("order", []) if c.get(source[key])]


def feed_blocks(c, d):
    make = {
        "origins": lambda: origins(c, d) if c.get("origins") else "",
        "peoples": lambda: people_cards(c["people"], d) if c.get("people") else "",
        "tiles": lambda: tiles(c["tiles"], d) if c.get("tiles") else "",
        "plates": lambda: plates(c, d) if c.get("plates") else "",
        "quiz": lambda: quiz(c, d) if c.get("quiz") else "",
        "images": lambda: gen_image(c, d) if c.get("image") else "",
        "atlas-holds": lambda: facts(c["facts"], d) if c.get("facts") else "",
        "problem": lambda: prose(c["prose"], d) if c.get("prose") else "",
        "shared-name": lambda: prose(c["prose"], d) if c.get("prose") else "",
        "near-name": lambda: prose(c["prose2"], d) if c.get("prose2") else "",
        "fiches": lambda: fiches(c, d) if c.get("fiches") else "",
    }
    return [(key, make[key]()) for key in present_feed_keys(c)]


def block(bid, html, gap, zone):
    return f'<div data-feed-block="{bid}" data-feed-zone="{zone}" style="padding-top: {gap}px;">{html}</div>'


def manifest_blocks(c, d):
    opening = [("lenses", "first"), ("verdict", "first")]
    if c.get("forms"):
        opening.append(("appellations", "first"))
    if c.get("shorts"):
        opening.append(("shorts", "first"))

    keys = present_feed_keys(c)
    if not d or c.get("thin"):
        middle = [(key, "primary") for key in keys]
    else:
        main = [key for key in keys if key in MAIN_COLUMN]
        rail = [key for key in keys if key not in MAIN_COLUMN]
        middle = ([(key, "primary") for key in main]
                  + [(key, "secondary") for key in rail])

    closing = []
    if c.get("band"):
        closing.append(("owed", "closing"))
    if c.get("further"):
        closing.append(("further", "closing"))
    return opening + middle + closing


def owed_parts(c):
    if not c.get("band"):
        return []
    parts = []
    if c["band"].get("silences"):
        parts.append("silences")
    parts.extend(["conviction", "invitation"])
    return parts


def first_screen(c, d):
    fid = f'{"dq" if d else "q"}-{c["id"]}'
    out = search(c, d, fid) + lenses(c, d)
    gap = 24 if d else 16
    if d and c.get("forms"):
        out += (f'<div style="padding-top: {gap}px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 32px; align-items: start;">'
                f'<div data-feed-block="verdict" data-feed-zone="first" style="grid-column: span 7;">{answer(c, d)}</div>'
                f'<div data-feed-block="appellations" data-feed-zone="first" style="grid-column: span 5; padding-top: 8px;">{appellations(c, d)}</div></div>')
    else:
        out += block("verdict", answer(c, d), gap, "first")
        if c.get("forms"):
            out += block("appellations", appellations(c, d), 12, "first")
    if c.get("shorts"):
        out += block("shorts", shorts(c, d), 24 if d else 12, "first")
    return out


def feed(c, d, thin):
    blocks = feed_blocks(c, d)
    gap = GAP_SECTION(d)
    if not d or thin:
        return "".join(block(key, html, gap, "primary") for key, html in blocks)
    main = [(k, h) for k, h in blocks if k in MAIN_COLUMN]
    rail = [(k, h) for k, h in blocks if k not in MAIN_COLUMN]
    def stack(items, zone):
        return "".join(
            block(key, html, 0 if index == 0 else gap, zone)
            for index, (key, html) in enumerate(items)
        )
    if main and rail:
        return (f'<div style="padding-top: {gap}px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 32px; align-items: start;">'
                f'<div style="grid-column: span 8;">{stack(main, "primary")}</div><div style="grid-column: span 4;">{stack(rail, "secondary")}</div></div>')
    zone = "primary" if main else "secondary"
    return f'<div style="padding-top: {gap}px;">{stack(main or rail, zone)}</div>'


def owed(c, d, thin):
    out = ""
    if c.get("band"):
        out += block("owed", band(c, d, stacked=thin), GAP_SECTION(d), "closing")
    if c.get("further"):
        out += block("further", further(c, d), GAP_SECTION(d), "closing")
    return out


def body(c, d):
    thin = bool(c.get("thin"))
    inner = first_screen(c, d) + feed(c, d, thin) + owed(c, d, thin)
    if d:
        inner_box = f'<div style="width: 880px; margin: 0 auto;">{inner}</div>' if thin else inner
        # PageLayout wide lifts the shell cap: main.afh-shell (padding 32) > div.afh-shell (padding 32): content 1152 px at x = 64.
        return (header(d) + f'<div style="box-sizing: border-box; padding: 32px 32px;">'
                f'<div data-feed-root="1" style="box-sizing: border-box; padding: 0 32px;">{inner_box}</div></div>')
    # main.afh-shell (padding 12) > div.afh-shell (padding 12): 24 px gutter at 430.
    return (header(d) + f'<div style="box-sizing: border-box; padding: 32px 12px;">'
            f'<div data-feed-root="1" style="box-sizing: border-box; padding: 0 12px;">{inner}</div></div>')


def document(c, d, height):
    w = 1280 if d else 430
    title = f'{c["name_plain"]} — fil, {"desktop" if d else "mobile"}'
    hstyle = "height: auto;" if height is None else f"height: {height}px;"
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            f'<title>{title}</title>\n<link rel="stylesheet" href="fonts/search-feed.css">\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            f'  <style>\n'
            f'    body {{ margin: 0; font-family: "Nunito Sans", system-ui, sans-serif; background: {BG}; color: {TEXT}; }}\n'
            f'    a {{ color: {OCRE_INK}; text-underline-offset: 2px; }}\n'
            f'    .feed-lenses::-webkit-scrollbar {{ display: none; }}\n  </style>\n</helmet>\n\n'
            f'<div data-board-root="1" style="width: {w}px; {hstyle} box-sizing: border-box; background: {BG}; overflow: hidden;">\n'
            f'{body(c, d)}\n</div>\n</x-dc>\n'
            f'<script type="text/x-dc" data-dc-script data-props=\'{{"$preview":{{"width":{w},"height":{height or 1000}}}}}\'>\n'
            'class Component extends DCLogic {\n  renderVals() {\n    return {};\n  }\n}\n</script>\n</body>\n</html>\n')


def night(src):
    pattern = re.compile("|".join(re.escape(k) for k in NIGHT), re.IGNORECASE)
    out = pattern.sub(lambda m: NIGHT[m.group(0).lower()], src)
    for left in (BG, LINE, SURFACE):
        if left in out:
            sys.exit(f"night derivation left {left} behind")
    return out
