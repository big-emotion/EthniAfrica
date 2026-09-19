"""Generate the « Fil des noms » boards: the approved result-page mockups
recomposed as a YouTube-style feed. Day boards are written from the case data;
night boards are derived by the same substitution table as
docs/design/mockups/search/derive-night.mjs, so the two stay one mockup."""
import html, json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "canvas", "project")

FONT = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;1,9..144,600&family=Nunito+Sans:wght@400;600;700&display=swap"
SERIF = "font-family: 'Fraunces', Georgia, serif;"

IMG = {
    "malinke": "/_blob/d46771f7a5f711fb62e7190763704fd9",
    "bambara": "/_blob/ce928a25b3a08248d953eb96e3acb8e0",
    "dioula": "/_blob/6cba4db21265b84e9c38594963b68ee6",
    "peul": "/_blob/d2ca8b498d8f36f94be2a4be489b36bf",
    "fulbe": "/_blob/5a77ed543ceb048b285f3259fe99c1db",
    "fang": "/_blob/3c1d396b8b16d2bc65ab4d0c22d063ce",
    "bassange": "/_blob/f3e4ac4721ddfdfa9716210e7fef7f63",
    "mansa": "/_blob/3b268f4fac6547d55364008d6fcc024a",
    "nigeria": "/_blob/bdbd5a6e59d7db22d83a95cd119296d8",
    "lingala": "/_blob/f4b9a88f7a15933ab03f48ee41f9e180",
}

TIER = {
    "official": ("Officielle", "#2b6b42"),
    "referenced": ("Référencée", "#5b8db8"),
    "unverified": ("Non vérifiée", "#746557"),
}

GRADS = [
    "linear-gradient(165deg, #5b3a1c 0%, #120e0a 75%)",
    "linear-gradient(160deg, #2d3b34 0%, #120e0a 78%)",
    "linear-gradient(170deg, #4a2418 0%, #120e0a 76%)",
    "linear-gradient(155deg, #3b3552 0%, #120e0a 78%)",
    "linear-gradient(160deg, #3a2a14 0%, #120e0a 74%)",
    "linear-gradient(165deg, #244046 0%, #120e0a 78%)",
]


def e(s):
    return s  # copy is authored as trusted HTML fragments (strong/em allowed)


def badge(tier):
    label, bg = TIER[tier]
    return f'<span style="font-size: 11px; font-weight: 700; color: #ffffff; background: {bg}; border-radius: 999px; padding: 3px 9px;">{label}</span>'


def h2(text, d, sub=None, link=None):
    size = 23 if d else 20
    out = f'<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px;"><h2 style="margin: 0; {SERIF} font-size: {size}px; font-weight: 600;">{text}</h2>'
    if link:
        out += f'<a href="#voir" style="font-size: 13px; font-weight: 700; white-space: nowrap;">{link}</a>'
    out += "</div>"
    if sub:
        out += f'<p style="margin: 4px 0 0 0; font-size: {13 if d else 12}px; color: #746557;">{sub}</p>'
    return out


# ---------------------------------------------------------------- chrome

def header(d):
    if d:
        return ('<div style="padding: 16px 48px; border-bottom: 1px solid #e8dfd3; display: flex; align-items: center; justify-content: space-between;">'
                '<div style="display: flex; align-items: baseline; gap: 12px;">'
                f'<div style="{SERIF} font-weight: 700; font-size: 19px;">EthniAfrica</div>'
                '<div style="font-size: 12px; color: #746557;">D&#39;où viennent les noms</div></div>'
                '<div style="display: flex; gap: 22px; font-size: 14px; color: #746557;">'
                '<a href="#a" style="text-decoration: none; color: inherit;">L&#39;atlas</a>'
                '<a href="#d" style="text-decoration: none; color: inherit;">Les dossiers</a>'
                '<a href="#j" style="text-decoration: none; color: inherit;">Jouer</a>'
                '<a href="#p" style="text-decoration: none; color: inherit;">À propos</a></div></div>')
    return ('<div style="padding: 14px 20px; border-bottom: 1px solid #e8dfd3; display: flex; align-items: center; gap: 10px;">'
            f'<div style="{SERIF} font-weight: 700; font-size: 17px;">EthniAfrica</div>'
            '<div style="font-size: 11px; color: #746557;">D&#39;où viennent les noms</div></div>')


SR = "position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;"
ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#746557" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>'


def search(c, d, fid):
    wrap = 'padding: 20px 48px 0 48px; display: flex; justify-content: center;' if d else 'padding: 14px 20px 0 20px;'
    inner = 'width: 640px;' if d else ''
    return (f'<div style="{wrap}"><div style="{inner} position: relative;">'
            f'<label for="{fid}" style="{SR}">Rechercher un nom</label>'
            '<div style="display: flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 10px; padding: 11px 13px;">'
            f'{ICON}<input id="{fid}" type="search" value="{c["q"]}" style="border: 0; outline: 0; font-size: 16px; font-family: inherit; color: #2c2018; background: transparent; width: 100%;"></div></div></div>')


def lenses(c, d):
    pad = "padding: 12px 48px 0 48px;" if d else "padding: 12px 20px 0 20px;"
    if d:
        pad = "padding: 14px 0 0 0; width: 640px; margin: 0 auto;"
    items = [("Tout", None, True)] + [(k, v, False) for k, v in c.get("lens", []) if v]
    out = f'<nav aria-label="Filtrer les résultats" style="{pad} display: flex; gap: 6px; flex-wrap: nowrap; overflow: hidden;">'
    for label, n, on in items:
        if on:
            out += f'<a href="#tout" aria-current="true" style="flex: none; font-size: 13px; font-weight: 700; background: #2c2018; color: #fbf7f2; border-radius: 999px; padding: 6px 13px; text-decoration: none;">{label}</a>'
        else:
            out += (f'<a href="#{label.lower()}" style="flex: none; font-size: 13px; font-weight: 600; border: 1px solid #e8dfd3; background: #ffffff; border-radius: 999px; padding: 6px 13px; text-decoration: none; color: #2c2018;">'
                    f'{label}' + (f' <span style="color: #746557; font-weight: 600;">{n}</span>' if n is not True else '') + '</a>')
    return out + "</nav>"


# ---------------------------------------------------------------- first screen

def answer(c, d):
    ey = c.get("eyebrow", "D&#39;où vient ce nom")
    if c.get("kind"):
        ey += f' <span style="color: #746557;">· {c["kind"]}</span>'
    h1 = 56 if d else 40
    out = (f'<div style="font-size: {12 if d else 11}px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; color: #835514;">{ey}</div>'
           f'<h1 style="margin: {10 if d else 6}px 0 0 0; {SERIF} font-weight: 700; font-size: {h1}px; line-height: 1.02;">{c["name"]}</h1>')
    v = c["verdict"]
    if c.get("verdict_plain"):
        out += (f'<div style="margin-top: {16 if d else 12}px;"><div style="{SERIF} font-weight: 600; font-size: {24 if d else 20}px; line-height: 1.25;">{v}</div>'
                + (f'<p style="margin: 8px 0 0 0; font-size: {16 if d else 14}px; line-height: 1.55;">{c["sub"]}</p>' if c.get("sub") else "") + "</div>")
    else:
        out += (f'<div style="margin-top: {18 if d else 12}px; background: #f0d2c8; border-left: {4 if d else 3}px solid #974331; border-radius: 0 {12 if d else 10}px {12 if d else 10}px 0; padding: {"16px 20px" if d else "12px 14px"};">'
                f'<div style="font-weight: 700; font-size: {17 if d else 15}px; color: #974331;">{v}</div>'
                + (f'<p style="margin: 6px 0 0 0; font-size: {15 if d else 13}px; line-height: 1.5; color: #2c2018;">{c["sub"]}</p>' if c.get("sub") else "")
                + "</div>")
    return out


def chip(form, d):
    name, tag, style = form
    border = {"you": "#c9821f", "bad": "#9b3030"}.get(style, "#e8dfd3")
    bg = "#f5ede0" if style == "own" else "#ffffff"
    tagcol = {"you": "color: #835514; font-weight: 700;", "bad": "color: #9b3030; font-weight: 700;", "own": "color: #835514; font-weight: 700;"}.get(style, "color: #746557;")
    t = f'<span style="font-size: 11px; {tagcol}">{tag}</span>' if tag else ""
    return (f'<span style="display: inline-flex; align-items: baseline; gap: 6px; background: {bg}; border: 1px solid {border}; border-radius: 999px; padding: {"7px 14px" if d else "6px 12px"};">'
            f'<span style="{SERIF} font-weight: 600; font-size: {17 if d else 15}px;">{name}</span>{t}</span>')


def appellations(c, d):
    title = c.get("forms_title", "Les appellations")
    sub = c.get("forms_sub", "Les plus communes d&#39;abord. Aucune n&#39;est « la bonne ».")
    out = h2(title, d, sub)
    shown, rest = c["forms"][:4], len(c["forms"]) - 4
    more = (f'<a href="#origines" style="align-self: center; font-size: 13px; font-weight: 700; padding: 0 4px;">+{rest} autre{"s" if rest > 1 else ""}</a>' if rest > 0 else "")
    out += f'<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 7px;">{"".join(chip(f, d) for f in shown)}{more}</div>'
    return out


def poster(s, i, d, w):
    title, dur, label = s
    h = round(w * 16 / 9)
    lab = (f'<span style="position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; color: #f1e7d8; background: rgba(0,0,0,0.55); border-radius: 4px; padding: 2px 6px;">{label}</span>' if label else "")
    return (f'<a href="#short-{i}" style="flex: none; width: {w}px; text-decoration: none; color: inherit;">'
            f'<div style="position: relative; width: {w}px; height: {h}px; border-radius: 12px; overflow: hidden; background: {GRADS[i % len(GRADS)]}; box-sizing: border-box; padding: 10px; display: flex; flex-direction: column; justify-content: flex-end;">'
            f'{lab}<span style="position: absolute; top: 8px; right: 8px; font-size: 10px; font-weight: 700; color: #f1e7d8; background: rgba(0,0,0,0.55); border-radius: 4px; padding: 2px 6px;">{dur}</span>'
            f'<svg width="{36 if d else 32}" height="{36 if d else 32}" viewBox="0 0 36 36" aria-hidden="true" style="position: absolute; top: 44%; left: 50%; margin-left: -{18 if d else 16}px;"><circle cx="18" cy="18" r="18" fill="rgba(241,231,216,0.92)"></circle><path d="M14 11 L26 18 L14 25 Z" fill="#120e0a"></path></svg>'
            f'<div style="{SERIF} font-weight: 700; font-size: {17 if d else 15}px; line-height: 1.08; text-transform: uppercase; color: #f1e7d8;">D&#39;où vient <span style="color: #e8b96a;">{title}</span>&nbsp;?</div></div>'
            f'<div style="margin-top: 7px; font-size: {13 if d else 12}px; font-weight: 700; line-height: 1.3;">D&#39;où vient le nom «&nbsp;{title}&nbsp;»&nbsp;?</div>'
            f'<div style="font-size: 11px; color: #746557;">{dur} · Découvertes</div></a>')


def empty_poster(p, d, w):
    title, lines, action = p
    h = round(w * 16 / 9)
    return (f'<div style="flex: none; width: {w}px;"><div style="width: {w}px; height: {h}px; border: 1px dashed #cfc3b4; border-radius: 12px; box-sizing: border-box; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">'
            f'<div style="{SERIF} font-weight: 700; font-size: {17 if d else 15}px; line-height: 1.12; text-transform: uppercase; color: #746557;">{title}</div>'
            f'<div style="font-size: 12px; line-height: 1.45; color: #746557;">{lines}</div>'
            f'<a href="#proposer" style="font-size: 12px; font-weight: 700;">{action}</a></div>'
            f'<div style="margin-top: 7px; font-size: {13 if d else 12}px; font-weight: 700; line-height: 1.3; color: #746557;">Pas encore de short</div></div>')


def shorts(c, d):
    sh = c["shorts"]
    w = 160 if d else 130
    out = h2(sh.get("title", "Les shorts"), d, sh.get("sub") if d else None, sh.get("link", "Tout voir →"))
    items = ""
    i = 0
    if sh.get("empty"):
        items += empty_poster(sh["empty"], d, w)
    for s in sh.get("items", [])[: (6 if d else 5) - (1 if sh.get("empty") else 0)]:
        items += poster(s, i, d, w)
        i += 1
    if sh.get("note"):
        out += f'<div style="margin-top: 8px; font-size: 12px; font-weight: 700; color: #835514;">{sh["note"]}</div>'
    out += f'<div data-row="shorts" style="margin-top: 12px; display: flex; gap: {16 if d else 10}px; overflow: hidden;">{items}</div>'
    return out


# ---------------------------------------------------------------- below the fold

def origin_card(o, d, w=None):
    name, tag, text, today, tier, style = o
    border = {"you": "#c9821f", "bad": "#9b3030"}.get(style, "#e8dfd3")
    width = f"flex: none; width: {w}px;" if w else ""
    tagcol = {"you": "#835514", "bad": "#9b3030", "own": "#835514"}.get(style, "#746557")
    out = (f'<div style="{width} box-sizing: border-box; background: #ffffff; border: 1px solid {border}; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px;">'
           f'<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px;"><div style="{SERIF} font-size: {21 if d else 20}px; font-weight: 600;">{name}</div>'
           f'<div style="font-size: 12px; font-weight: 700; color: {tagcol}; text-align: right;">{tag}</div></div>'
           f'<p style="margin: 0; font-size: 14px; line-height: 1.55;">{text}</p>')
    if today:
        lab, txt = today if isinstance(today, tuple) else ("Aujourd&#39;hui", today)
        out += f'<p style="margin: 0; font-size: 13px; line-height: 1.5; color: #746557;"><strong style="color: #2c2018;">{lab}</strong> — {txt}</p>'
    if tier:
        out += f'<div style="margin-top: 2px; display: flex; gap: 8px; align-items: center;">{badge(tier)}<a href="#source" style="font-size: 12px;">Voir la source</a></div>'
    return out + "</div>"


def origins(c, d):
    o = c["origins"]
    out = h2(o.get("title", "D&#39;où elles viennent"), d, o.get("sub"))
    if o.get("lede"):
        out += f'<p style="margin: 10px 0 0 0; font-size: {15 if d else 14}px; line-height: 1.6;">{o["lede"]}</p>'
    if d:
        out += f'<div style="margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">{"".join(origin_card(x, d) for x in o["cards"])}</div>'
    else:
        out += f'<div style="margin-top: 12px; display: flex; gap: 10px; overflow: hidden;">{"".join(origin_card(x, d, 290) for x in o["cards"])}</div>'
        if len(o["cards"]) > 1:
            out += f'<div style="margin-top: 8px; font-size: 12px; color: #746557;">Glissez · {len(o["cards"])} formes</div>'
    out += '<a href="#proposer" style="display: inline-block; margin-top: 12px; font-size: 13px; font-weight: 700;">Il en manque une&nbsp;? Proposer une source →</a>'
    return out


def tiles(t, d):
    out = h2(t["title"], d, t.get("sub"))
    cells = "".join(
        f'<div style="background: #f5ede0; border-radius: 9px; padding: 10px 12px;"><div style="font-weight: 700; font-size: 14px;">{a}</div><div style="font-size: 12px; color: #746557;">{b}</div></div>'
        for a, b in t["items"])
    out += f'<div style="margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{cells}</div>'
    if t.get("link"):
        out += f'<a href="#peuples" style="display: inline-block; margin-top: 12px; font-size: 13px; font-weight: 700;">{t["link"]}</a>'
    return out


def people_cards(p, d):
    out = h2(p["title"], d, p.get("sub"))
    cards = ""
    for x in p["items"]:
        cards += (f'<a href="#p" style="box-sizing: border-box; text-decoration: none; color: inherit; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px;">'
                  f'<div style="{SERIF} font-size: 20px; font-weight: 600;">{x[0]}</div>'
                  f'<div style="font-size: 12px; color: #746557;">{x[1]}</div>'
                  f'<p style="margin: 0; font-size: 14px; line-height: 1.5;">{x[2]}</p>'
                  + (f'<div style="font-size: 12px; font-weight: 700; color: #835514;">{x[3]}</div>' if len(x) > 3 else "") + '</a>')
    cols = f"repeat({len(p['items'])}, minmax(0, 1fr))" if d else "minmax(0, 1fr)"
    out += f'<div style="margin-top: 12px; display: grid; grid-template-columns: {cols}; gap: 10px;">{cards}</div>'
    return out


def plate(p, d, w):
    width = f"flex: none; width: {w}px;"
    if p["type"] == "anecdote":
        ih = round(w * 0.62)
        return (f'<a href="#anecdote" style="{width} box-sizing: border-box; text-decoration: none; color: inherit; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">'
                f'<img src="{IMG[p["img"]]}" alt="{p["alt"]}" style="width: {w}px; height: {ih}px; object-fit: cover; display: block;">'
                '<div style="padding: 12px 14px 14px 14px; display: flex; flex-direction: column; gap: 7px;">'
                f'<div style="font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: #835514;">Anecdote · {p["about"]}</div>'
                f'<div style="{SERIF} font-size: 17px; font-weight: 600; line-height: 1.25;">{p["headline"]}</div>'
                f'<div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">{badge(p["tier"])}</div>'
                f'<div style="font-size: 10.5px; line-height: 1.4; color: #746557;">Photo : {p["credit"]}</div></div></a>')
    return (f'<a href="#proverbe" style="{width} box-sizing: border-box; text-decoration: none; color: inherit; background: #f5ede0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 9px;">'
            f'<div style="font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: #835514;">Proverbe {p["lang"]}</div>'
            f'<div style="{SERIF} font-size: 19px; font-weight: 600; line-height: 1.3;">« {p["text"]} »</div>'
            f'<div lang="{p["iso"]}" style="font-size: 13px; font-style: italic; color: #746557; line-height: 1.45;">{p["original"]}</div>'
            + (f'<p style="margin: 0; font-size: 13px; line-height: 1.5;">{p["meaning"]}</p>' if p.get("meaning") else "")
            + f'<div style="font-size: 10.5px; line-height: 1.4; color: #746557;">{p["origin"]}</div></a>')


def plates(c, d):
    out = h2("Anecdotes et proverbes", d, c.get("plates_sub"), "Tout voir →")
    w = 250 if d else 250
    out += f'<div style="margin-top: 12px; display: flex; gap: {14 if d else 10}px; overflow: hidden; align-items: stretch;">{"".join(plate(p, d, w) for p in c["plates"])}</div>'
    return out


def quiz(c, d):
    q = c["quiz"]
    opts = "".join(
        f'<button type="button" style="font-family: inherit; font-size: 14px; font-weight: 700; color: #2c2018; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 9px; padding: 10px 12px; min-height: 44px; text-align: left; cursor: pointer;">{o}</button>'
        for o in q["options"])
    return (f'<div style="background: #ffffff; border: 1px solid #c9821f; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">'
            '<div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: #835514;">Joue avec ce nom</div>'
            f'<div style="{SERIF} font-size: {21 if d else 19}px; font-weight: 600; line-height: 1.3;">{q["q"]}</div>'
            f'<div style="display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px;">{opts}</div>'
            f'<div style="display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: #746557;"><span>{q["count"]}</span><a href="#jouer" style="font-weight: 700;">Toutes les questions →</a></div></div>')


def gen_image(c, d):
    g = c["image"]
    w = 300 if d else 250
    h = round(w * 5 / 4)
    return (h2("Les images", d, "Des interprétations, jamais des portraits.")
            + f'<div style="margin-top: 12px; width: {w}px; box-sizing: border-box; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 12px; overflow: hidden;">'
            '<div style="padding: 9px 12px; font-size: 12px; font-weight: 700; color: #835514; background: #f1d9ae;">Image générée — une interprétation</div>'
            f'<img src="{IMG[g["img"]]}" alt="{g["alt"]}" style="width: {w}px; height: {h}px; object-fit: cover; display: block;">'
            f'<div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;"><div style="{SERIF} font-size: 17px; font-weight: 600;">{g["caption"]}</div>'
            f'<div style="display: flex; gap: 8px; align-items: center;">{badge(g["tier"])}<span style="font-size: 11px; color: #746557;">{g["source"]}</span></div>'
            f'<div style="font-size: 10.5px; color: #746557;">{g["licence"]}</div></div></div>')


def prose(p, d):
    return (h2(p["title"], d) + f'<div style="margin-top: 10px; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 12px; padding: 16px;">'
            + "".join(f'<p style="margin: {0 if i == 0 else 10}px 0 0 0; font-size: 14px; line-height: 1.6;">{t}</p>' for i, t in enumerate(p["paras"]))
            + (f'<div style="margin-top: 12px; display: flex; gap: 8px; align-items: center;">{badge(p["tier"])}<a href="#source" style="font-size: 12px;">Voir la source</a></div>' if p.get("tier") else "")
            + '</div>')


def facts(f, d):
    cells = "".join(
        f'<div style="background: #f5ede0; border-radius: 9px; padding: 10px 12px;"><div style="font-size: 11px; color: #746557;">{a}</div><div style="font-weight: 700; font-size: 14px;">{b}</div></div>'
        for a, b in f["items"])
    return h2(f["title"], d, f.get("sub")) + f'<div style="margin-top: 12px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">{cells}</div>'


def fiches(c, d):
    cells = ""
    for kind, name, meta in c["fiches"]:
        cells += (f'<a href="#fiche" style="box-sizing: border-box; text-decoration: none; color: inherit; background: #ffffff; border: 1px solid #e8dfd3; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 3px;">'
                  f'<div style="font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: #746557;">{kind}</div>'
                  f'<div style="{SERIF} font-size: 18px; font-weight: 600;">{name}</div>'
                  f'<div style="font-size: 12px; color: #746557;">{meta}</div></a>')
    cols = 4 if d and len(c["fiches"]) >= 4 else (len(c["fiches"]) if d else 2)
    if not d and len(c["fiches"]) == 1:
        cols = 1
    return (h2("Les fiches", d, "Pour aller au fond&nbsp;: chaque fiche, avec toutes ses sources.")
            + f'<div style="margin-top: 12px; display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); gap: 10px;">{cells}</div>')


def band(c, d):
    b = c["band"]
    sil = "".join(
        f'<div style="border: 1px dashed #cfc3b4; border-radius: 11px; padding: 14px;"><div style="font-weight: 700; font-size: 14px; color: #746557;">{a}</div><div style="margin-top: 4px; font-size: 13px; line-height: 1.5; color: #746557;">{t}</div></div>'
        for a, t in b.get("silences", []))
    s = (h2("Ce que l&#39;atlas ne dit pas", d, "Un silence déclaré, pas un oubli.")
         + f'<div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">{sil}</div>') if b.get("silences") else ""
    conv = (f'<div style="background: #f5ede0; border-radius: 12px; padding: 15px 16px;"><div style="font-weight: 700; font-size: {16 if d else 14}px;">{b["conv"][0]}</div>'
            f'<p style="margin: 6px 0 0 0; font-size: {14 if d else 13}px; line-height: 1.55; color: #2c2018;">{b["conv"][1]}</p></div>')
    inv = (f'<div style="background: #ffffff; border: 1px solid #c9821f; border-radius: 12px; padding: 16px;"><div style="font-weight: 700; font-size: 15px;">{b.get("invite", "Nous nous sommes trompés&nbsp;?")}</div>'
           f'<p style="margin: 6px 0 12px 0; font-size: 14px; line-height: 1.55; color: #2c2018;">{b.get("invite_sub", "Si vous connaissez une source sur l&#39;un de ces noms, elle sera lue.")}</p>'
           f'<button type="button" style="font-family: inherit; font-size: 14px; font-weight: 700; color: #2c2018; background: #f1d9ae; border: 1px solid #c9821f; border-radius: 9px; padding: 11px 16px; min-height: 44px; cursor: pointer;">{b.get("button", "Proposer une source")}</button></div>')
    if d and not s:
        return f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start;">{conv}{inv}</div>'
    if not d and not s:
        return f'<div style="display: flex; flex-direction: column; gap: 18px;">{conv}{inv}</div>'
    if d:
        return (f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 28px; align-items: start;">'
                f'<div style="grid-column: span 6;">{s}</div><div style="grid-column: span 6; display: flex; flex-direction: column; gap: 14px; padding-top: 58px;">{conv}{inv}</div></div>')
    return s + f'<div style="margin-top: 22px; display: flex; flex-direction: column; gap: 18px;">{conv}{inv}</div>'


def further(c, d):
    if not c.get("further"):
        return ""
    links = "".join(f'<a href="#f" style="font-size: 13px; border: 1px solid #e8dfd3; background: #ffffff; border-radius: 999px; padding: 7px 13px; text-decoration: none;">{x}</a>' for x in c["further"])
    return ('<div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; color: #746557;">Aller plus loin</div>'
            f'<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 7px;">{links}</div>')


# ---------------------------------------------------------------- assembly

def section(body, d, top=None):
    pt = top if top is not None else (40 if d else 30)
    px = 48 if d else 20
    return f'<div style="padding: {pt}px {px}px 0 {px}px;">{body}</div>'


MAIN_COLUMN = {"origins", "people", "plates", "fiches"}


def feed_blocks(c, d):
    """The below-the-fold feed, in the order the charter amendment fixes."""
    order = c.get("order", ["origins", "people", "tiles", "plates", "quiz", "image", "facts", "prose", "prose2", "fiches"])
    make = {
        "origins": lambda: origins(c, d) if c.get("origins") else "",
        "people": lambda: people_cards(c["people"], d) if c.get("people") else "",
        "tiles": lambda: tiles(c["tiles"], d) if c.get("tiles") else "",
        "plates": lambda: plates(c, d) if c.get("plates") else "",
        "quiz": lambda: quiz(c, d) if c.get("quiz") else "",
        "image": lambda: gen_image(c, d) if c.get("image") else "",
        "facts": lambda: facts(c["facts"], d) if c.get("facts") else "",
        "prose": lambda: prose(c["prose"], d) if c.get("prose") else "",
        "prose2": lambda: prose(c["prose2"], d) if c.get("prose2") else "",
        "fiches": lambda: fiches(c, d) if c.get("fiches") else "",
    }
    return [(k, make[k]()) for k in order if make[k]()]


def mobile_body(c):
    d = False
    out = header(d) + search(c, d, f'q-{c["id"]}') + lenses(c, d)
    out += section(answer(c, d), d, 16)
    if c.get("forms"):
        out += section(appellations(c, d), d, 16)
    if c.get("shorts"):
        out += '<div data-fold="shorts"></div>' + section(shorts(c, d), d, 18)
    for _, blk in feed_blocks(c, d):
        out += section(blk, d, 32)
    if c.get("band"):
        out += section(band(c, d), d, 34)
    if c.get("further"):
        out += section(further(c, d), d, 24)
    return out


def desktop_body(c):
    d = True
    thin = c.get("thin")
    out = header(d) + search(c, d, f'dq-{c["id"]}') + lenses(c, d)
    if thin:
        inner = f'<div style="width: 880px; margin: 0 auto;">'
        if c.get("forms"):
            parts = [f'<div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 28px; align-items: start;"><div style="grid-column: span 7;">{answer(c, d)}</div><div style="grid-column: span 5; padding-top: 6px;">{appellations(c, d)}</div></div>']
        else:
            parts = [answer(c, d)]
        if c.get("shorts"):
            parts.append('<div data-fold="shorts"></div>' + shorts(c, d))
        parts += [b for _, b in feed_blocks(c, d)]
        if c.get("band"):
            parts.append(band_thin(c))
        if c.get("further"):
            parts.append(further(c, d))
        gaps = [0] + [34] * (len(parts) - 1)
        inner += "".join(f'<div style="padding-top: {g}px;">{p}</div>' for g, p in zip(gaps, parts))
        inner += "</div>"
        return out + f'<div style="padding: 30px 48px 0 48px;">{inner}</div>'
    # Row 1: the answer beside the appellations.
    row1 = (f'<div style="padding: 30px 48px 0 48px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 28px; align-items: start;">'
            f'<div style="grid-column: span 7;">{answer(c, d)}</div>'
            f'<div style="grid-column: span 5; padding-top: 6px;">{appellations(c, d) if c.get("forms") else ""}</div></div>')
    out += row1
    if c.get("shorts"):
        out += '<div data-fold="shorts"></div>' + section(shorts(c, d), d, 30)
    # Desktop is a main column and a rail, each stacking its blocks in feed
    # order. A rule, not a per-case pairing, so any name lays out the same way.
    main = [b for k, b in feed_blocks(c, d) if k in MAIN_COLUMN]
    rail = [b for k, b in feed_blocks(c, d) if k not in MAIN_COLUMN]
    stack = lambda bs: "".join(f'<div style="padding-top: {0 if i == 0 else 40}px;">{b}</div>' for i, b in enumerate(bs))
    if main and rail:
        out += (f'<div style="padding: 44px 48px 0 48px; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 28px; align-items: start;">'
                f'<div style="grid-column: span 8;">{stack(main)}</div><div style="grid-column: span 4;">{stack(rail)}</div></div>')
    elif main or rail:
        out += section(stack(main or rail), d, 44)
    if c.get("band"):
        out += section(band(c, d), d, 48)
    if c.get("further"):
        out += section(further(c, d), d, 28)
    return out


def band_thin(c):
    return band(c, False)


def document(c, d, height):
    w = 1280 if d else 430
    body = desktop_body(c) if d else mobile_body(c)
    title = f'{c["name_plain"]} — fil, {"desktop" if d else "mobile"}'
    hstyle = "height: auto;" if height is None else f"height: {height}px;"
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            f'<title>{title}</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n'
            f'  <link rel="stylesheet" href="{FONT.replace("&", "&amp;")}">\n'
            '  <style>\n    body { margin: 0; font-family: "Nunito Sans", system-ui, sans-serif; background: #fbf7f2; color: #2c2018; }\n'
            '    a { color: #835514; } a:hover { color: #5c3b0e; }\n  </style>\n</helmet>\n\n'
            f'<div data-board-root="1" style="width: {w}px; {hstyle} box-sizing: border-box; background: #fbf7f2; padding: 0 0 {48 if d else 32}px 0; display: flex; flex-direction: column; overflow: hidden;">\n'
            f'{body}\n</div>\n</x-dc>\n'
            f'<script type="text/x-dc" data-dc-script data-props=\'{{"$preview":{{"width":{w},"height":{height or 1000}}}}}\'>\n'
            'class Component extends DCLogic {\n  renderVals() {\n    return {};\n  }\n}\n</script>\n</body>\n</html>\n')


# Same table as docs/design/mockups/search/derive-night.mjs, plus the one pair
# this feed adds: the selected lens chip, which inverts ink and ground.
SWAPS = [
    ("background: #2c2018; color: #fbf7f2", "background: #f1e7d8; color: #120e0a"),
    ("background: #fbf7f2", "background: #120e0a"),
    ("background: #ffffff", "background: #1d1710"),
    ("background: #f5ede0", "background: #271e14"),
    ("#e8dfd3", "#3a2e1f"),
    ("color: #2c2018", "color: #f1e7d8"),
    ("color: #746557", "color: #c9b99f"),
    ('stroke="#746557"', 'stroke="#c9b99f"'),
    ("color: #835514", "color: #e8b96a"),
    ("#974331", "#cd725e"),
    ("#9b3030", "#d98a7a"),
    ("background: #f0d2c8", "background: #2f201a"),
    ("background: #f1d9ae", "background: #33281a"),
    ("background: #fce8e8", "background: #301c1c"),
    ("#cfc3b4", "#5a4a37"),
    ("a { color: #835514; } a:hover { color: #5c3b0e; }", "a { color: #e8b96a; } a:hover { color: #f1d9ae; }"),
]


def night(src):
    out = src
    for a, b in SWAPS:
        out = out.replace(a, b)
    for left in ("#fbf7f2", "#e8dfd3"):
        if left in out:
            sys.exit(f"night derivation left {left} behind")
    return out
