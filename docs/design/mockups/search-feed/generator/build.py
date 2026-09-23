"""Build the forty search-feed boards and their executable manifest."""

import argparse
import json
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
DEFAULT_OUTPUT = HERE.parent
CANVAS_CREATED_AT = "2026-09-19T07:34:38Z"

sys.path.insert(0, str(HERE))
import gen
from cases import CASES
from gen import document, manifest_blocks, night, owed_parts


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("draft", "final"))
    parser.add_argument("heights", nargs="?", type=Path)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if args.mode == "final" and args.heights is None:
        parser.error("final mode requires a heights.json path")
    return args


def filename(case, desktop, night_theme):
    return (
        f'{case["file"]}'
        f'{"Desktop" if desktop else ""}'
        f'{"Nuit" if night_theme else ""}.dc.html'
    )


def write_json(path, value):
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def configure_assets():
    poster_slugs = json.loads((HERE / "posters.json").read_text(encoding="utf-8"))
    gen.POSTERS.update({slug: f"posters/{slug}.jpg" for slug in poster_slugs})


def build_draft(output):
    frames = []
    for case in CASES:
        for desktop in (False, True):
            board_file = filename(case, desktop, False)
            (output / board_file).write_text(
                document(case, desktop, None), encoding="utf-8"
            )
            frames.append((board_file, 1280 if desktop else 430))
    measure = "<!doctype html><meta charset='utf-8'><body style='margin:0'>" + "".join(
        f"<iframe data-f='{board_file}' src='{board_file}' "
        f"style='width:{width}px;height:4000px;border:0;display:block'></iframe>"
        for board_file, width in frames
    )
    (output / "measure.html").write_text(measure, encoding="utf-8")
    print(len(frames), "draft boards")


def first_poster(case, desktop, height_record):
    width = 256 if desktop else 180
    x = 200 if desktop and case.get("thin") else 64 if desktop else 24
    if case.get("shorts", {}).get("empty"):
        x += width + (16 if desktop else 12)
    return {
        "x": x,
        "y": height_record["shortsRow"],
        "width": width,
        "height": round(width * 16 / 9),
    }


def manifest_entry(case, desktop, night_theme, height, height_record):
    device = "desktop" if desktop else "mobile"
    theme = "night" if night_theme else "day"
    return {
        "case": case["id"],
        "variant": f"{device}-{theme}",
        "file": filename(case, desktop, night_theme),
        "query": case["q"],
        "resultState": case["result_state"],
        "width": 1280 if desktop else 430,
        "theme": theme,
        "height": height,
        "blocks": [
            {"id": block_id, "zone": zone}
            for block_id, zone in manifest_blocks(case, desktop)
        ],
        "owedParts": owed_parts(case),
        "firstPoster": first_poster(case, desktop, height_record),
    }


def build_final(output, heights_path):
    heights = json.loads(heights_path.resolve().read_text(encoding="utf-8"))
    boards = {}
    order = []
    entries = []
    gap_x = 80
    gap_row = 420
    mobile_height = max(
        value["h"] for key, value in heights.items() if "Desktop" not in key
    )
    desktop_height = max(
        value["h"] for key, value in heights.items() if "Desktop" in key
    )
    rows = [
        (False, False, 0),
        (False, True, mobile_height + gap_row),
        (True, False, 2 * (mobile_height + gap_row)),
        (True, True, 2 * (mobile_height + gap_row) + desktop_height + gap_row),
    ]
    fold = [
        {
            "kind": "rows",
            "count": 1,
            "size": 800,
            "gutter": 0,
            "align": "start",
            "offset": 0,
            "color": "rgba(201,130,31,0.14)",
        }
    ]

    for desktop, night_theme, y in rows:
        for index, case in enumerate(CASES):
            day_file = filename(case, desktop, False)
            height_record = heights[day_file]
            height = height_record["h"]
            day_source = document(case, desktop, height)
            board_file = filename(case, desktop, night_theme)
            source = night(day_source) if night_theme else day_source
            (output / board_file).write_text(source, encoding="utf-8")
            width = 1280 if desktop else 430
            x = index * (width + gap_x)
            title = (
                case["title"]
                if not desktop and not night_theme
                else f'{case["name_plain"]} — {"desktop 1280" if desktop else "mobile"}{", nuit" if night_theme else ""}'
            )
            boards[board_file] = {
                "x": x,
                "y": y,
                "w": width,
                "h": height,
                "title": title,
                "guides": fold,
            }
            order.append(board_file)
            entries.append(
                manifest_entry(case, desktop, night_theme, height, height_record)
            )

    mobile_width = len(CASES) * (430 + gap_x) - gap_x
    desktop_width = len(CASES) * (1280 + gap_x) - gap_x
    notes = {
        "t-mob": {
            "x": 0,
            "y": -300,
            "text": "Le fil — mobile 430, jour",
            "kind": "title1",
            "maxW": mobile_width,
        },
        "t-mobn": {
            "x": 0,
            "y": rows[1][2] - 300,
            "text": "Le fil — mobile 430, nuit",
            "kind": "title1",
            "maxW": mobile_width,
        },
        "t-desk": {
            "x": 0,
            "y": rows[2][2] - 300,
            "text": "Le fil — desktop 1280, jour",
            "kind": "title1",
            "maxW": desktop_width,
        },
        "t-deskn": {
            "x": 0,
            "y": rows[3][2] - 300,
            "text": "Le fil — desktop 1280, nuit",
            "kind": "title1",
            "maxW": desktop_width,
        },
        "legend": {
            "x": -560,
            "y": 0,
            "w": 460,
            "text": json.loads((HERE / "legend.json").read_text(encoding="utf-8"))[
                "text"
            ],
        },
    }
    canvas = {
        "v": 3,
        "createdOnFiles": {"v": 1, "at": CANVAS_CREATED_AT},
        "title": "Fil des noms",
        "launch": {"view": "canvas"},
        "pages": [],
        "boards": boards,
        "order": order,
        "notes": notes,
        "designSystems": [],
        "attachments": {},
    }
    write_json(output / "canvas.json", canvas)
    write_json(output / "manifest.json", {"schemaVersion": 1, "entries": entries})
    print(
        len(boards),
        "boards; mobile max",
        mobile_height,
        "desktop max",
        desktop_height,
    )


def main():
    args = arguments()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    configure_assets()
    if args.mode == "draft":
        build_draft(output)
        return
    build_final(output, args.heights)


if __name__ == "__main__":
    main()
