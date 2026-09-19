"""draft: boards at natural height + measure.html. final <heights.json>: fixed
heights, night variants, canvas index."""
import json, os, sys, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
HEIGHTS = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else None
os.chdir(HERE)
sys.path.insert(0, HERE)
import gen
from gen import document, night, OUT
gen.POSTERS.update({k: "/_blob/" + v for k, v in json.load(open("posters.json")).items()})
from cases import CASES

os.makedirs(OUT, exist_ok=True)
mode = sys.argv[1]

def fname(c, desk, nuit):
    return f'{c["file"]}{"Desktop" if desk else ""}{"Nuit" if nuit else ""}.dc.html'

if mode == "draft":
    frames = []
    for c in CASES:
        for desk in (False, True):
            f = fname(c, desk, False)
            open(os.path.join(OUT, f), "w", encoding="utf-8").write(document(c, desk, None))
            frames.append((f, 1280 if desk else 430))
    html = "<!doctype html><meta charset='utf-8'><body style='margin:0'>" + "".join(
        f"<iframe data-f='{f}' src='canvas/project/{f}' style='width:{w}px;height:4000px;border:0;display:block'></iframe>" for f, w in frames)
    open(os.path.join(os.path.dirname(OUT), "..", "measure.html"), "w", encoding="utf-8").write(html)
    print(len(frames), "draft boards")
    sys.exit()

heights = json.load(open(HEIGHTS))
boards, order = {}, []
GAP_X, GAP_ROW = 80, 420
mob_h = max(v["h"] for k, v in heights.items() if "Desktop" not in k)
desk_h = max(v["h"] for k, v in heights.items() if "Desktop" in k)
rows = [(False, False, 0), (False, True, mob_h + GAP_ROW), (True, False, 2 * (mob_h + GAP_ROW)), (True, True, 2 * (mob_h + GAP_ROW) + desk_h + GAP_ROW)]
FOLD = [{"kind": "rows", "count": 1, "size": 800, "gutter": 0, "align": "start", "offset": 0, "color": "rgba(201,130,31,0.14)"}]
for desk, nuit, y in rows:
    for i, c in enumerate(CASES):
        day = fname(c, desk, False)
        h = heights[day]["h"]
        src = document(c, desk, h)
        f = fname(c, desk, nuit)
        open(os.path.join(OUT, f), "w", encoding="utf-8").write(night(src) if nuit else src)
        w = 1280 if desk else 430
        x = i * (w + GAP_X)
        t = c["title"] if not desk and not nuit else f'{c["name_plain"]} — {"desktop 1280" if desk else "mobile"}{", nuit" if nuit else ""}'
        boards[f] = {"x": x, "y": y, "w": w, "h": h, "title": t, "guides": FOLD}
        order.append(f)
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
mw = len(CASES) * (430 + GAP_X) - GAP_X
dw = len(CASES) * (1280 + GAP_X) - GAP_X
notes = {
    "t-mob": {"x": 0, "y": -300, "text": "Le fil — mobile 430, jour", "kind": "title1", "maxW": mw},
    "t-mobn": {"x": 0, "y": rows[1][2] - 300, "text": "Le fil — mobile 430, nuit", "kind": "title1", "maxW": mw},
    "t-desk": {"x": 0, "y": rows[2][2] - 300, "text": "Le fil — desktop 1280, jour", "kind": "title1", "maxW": dw},
    "t-deskn": {"x": 0, "y": rows[3][2] - 300, "text": "Le fil — desktop 1280, nuit", "kind": "title1", "maxW": dw},
    "legend": {"x": -560, "y": 0, "w": 460, "text": json.load(open("legend.json"))["text"]},
}
index = {"v": 3, "createdOnFiles": {"v": 1, "at": now}, "title": "Fil des noms", "launch": {"view": "canvas"}, "pages": [],
         "boards": boards, "order": order, "notes": notes, "designSystems": []}
json.dump(index, open(os.path.join(OUT, "canvas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(boards), "boards; mobile max", mob_h, "desktop max", desk_h)
