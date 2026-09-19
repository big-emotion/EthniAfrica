import filecmp
import html.parser
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


GENERATOR_DIR = Path(__file__).resolve().parent
CANONICAL_OUTPUT = GENERATOR_DIR.parent
HEIGHTS_PATH = GENERATOR_DIR / "heights.json"
sys.path.insert(0, str(GENERATOR_DIR))
from cases import CASES

FEED_BLOCKS = [
    "lenses",
    "verdict",
    "appellations",
    "shorts",
    "origins",
    "peoples",
    "shared-name",
    "tiles",
    "atlas-holds",
    "plates",
    "quiz",
    "images",
    "problem",
    "near-name",
    "fiches",
    "owed",
    "further",
]
OWED_PARTS = ["silences", "conviction", "invitation"]
ZONES = {"first", "primary", "secondary", "closing"}
RESULT_STATES = {"exact", "widened", "typo", "unknown"}
VARIANTS = {
    "mobile-day",
    "mobile-night",
    "desktop-day",
    "desktop-night",
}


class FeedMarkupParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.blocks = []
        self.parts = []
        self.lens_controls = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        parent = self.stack[-1][0] if self.stack else None
        node = object()
        block_id = attributes.get("data-feed-block")
        if block_id:
            self.blocks.append(
                {
                    "id": block_id,
                    "zone": attributes.get("data-feed-zone"),
                    "parent": parent,
                    "node": node,
                }
            )
        part_id = attributes.get("data-feed-part")
        if part_id:
            self.parts.append(part_id)
        if self._inside_lenses() and tag in {"a", "button"}:
            self.lens_controls.append((tag, attributes.get("aria-pressed")))
        self.stack.append((node, tag, block_id))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][1] == tag:
                del self.stack[index:]
                return

    def _inside_lenses(self):
        return any(block_id == "lenses" for _, _, block_id in self.stack)


def build_into(output):
    subprocess.run(
        [
            sys.executable,
            str(GENERATOR_DIR / "build.py"),
            "final",
            str(HEIGHTS_PATH),
            "--output",
            str(output),
        ],
        check=True,
        cwd=GENERATOR_DIR,
        capture_output=True,
        text=True,
    )


def parse_board(path):
    parser = FeedMarkupParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


class SearchFeedGeneratorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tempdir = tempfile.TemporaryDirectory()
        cls.output = Path(cls.tempdir.name)
        build_into(cls.output)
        cls.manifest = json.loads(
            (cls.output / "manifest.json").read_text(encoding="utf-8")
        )
        cls.entries = cls.manifest["entries"]

    @classmethod
    def tearDownClass(cls):
        cls.tempdir.cleanup()

    def test_generates_exactly_ten_cases_and_four_variants(self):
        cases = {entry["case"] for entry in self.entries}
        self.assertEqual(len(cases), 10)
        self.assertEqual(len(self.entries), 40)
        for case in cases:
            self.assertEqual(
                {entry["variant"] for entry in self.entries if entry["case"] == case},
                VARIANTS,
            )
        self.assertEqual(len({entry["file"] for entry in self.entries}), 40)

    def test_manifest_schema_is_versioned_and_complete(self):
        self.assertEqual(set(self.manifest), {"schemaVersion", "entries"})
        self.assertEqual(self.manifest["schemaVersion"], 1)
        expected_keys = {
            "case",
            "variant",
            "file",
            "query",
            "resultState",
            "width",
            "theme",
            "height",
            "blocks",
            "owedParts",
            "firstPoster",
        }
        for entry in self.entries:
            self.assertEqual(set(entry), expected_keys)
            self.assertIn(entry["resultState"], RESULT_STATES)
            self.assertIn(entry["theme"], {"day", "night"})
            self.assertIn(entry["width"], {430, 1280})
            self.assertGreater(entry["height"], 0)
            self.assertEqual(
                set(entry["firstPoster"]), {"x", "y", "width", "height"}
            )
            self.assertLessEqual(
                entry["firstPoster"]["y"] + entry["firstPoster"]["height"],
                800,
            )

    def test_first_poster_skips_leading_empty_slots(self):
        expected_x = {
            "bassa": {"mobile-day": 166, "desktop-day": 260},
            "ekpeye": {"mobile-day": 166, "desktop-day": 376},
            "inconnu": {"mobile-day": 166, "desktop-day": 376},
        }
        for case_id, variants in expected_x.items():
            for variant, x in variants.items():
                entry = next(
                    item
                    for item in self.entries
                    if item["case"] == case_id and item["variant"] == variant
                )
                self.assertEqual(entry["firstPoster"]["x"], x, entry["file"])

    def test_blocks_zones_and_owed_parts_match_generated_markup(self):
        canonical_order = {block_id: index for index, block_id in enumerate(FEED_BLOCKS)}
        for entry in self.entries:
            parser = parse_board(self.output / entry["file"])
            actual_blocks = [
                {"id": block["id"], "zone": block["zone"]}
                for block in parser.blocks
            ]
            self.assertEqual(actual_blocks, entry["blocks"], entry["file"])
            self.assertTrue(
                all(block["id"] in canonical_order for block in entry["blocks"])
            )
            self.assertTrue(all(block["zone"] in ZONES for block in entry["blocks"]))
            for zone in ZONES:
                zone_ids = [
                    block["id"]
                    for block in entry["blocks"]
                    if block["zone"] == zone
                ]
                self.assertEqual(
                    zone_ids,
                    sorted(zone_ids, key=canonical_order.get),
                    f"{entry['file']}:{zone}",
                )
            self.assertEqual(parser.parts, entry["owedParts"], entry["file"])

    def test_case_conditions_are_explicit(self):
        entries_by_case = {}
        for entry in self.entries:
            entries_by_case.setdefault(entry["case"], []).append(entry)

        self.assertEqual(
            {entry["resultState"] for entry in entries_by_case["ekpeye"]},
            {"widened"},
        )
        self.assertEqual(
            {entry["resultState"] for entry in entries_by_case["introuvable"]},
            {"typo"},
        )
        self.assertEqual(
            {entry["resultState"] for entry in entries_by_case["inconnu"]},
            {"unknown"},
        )
        for entry in entries_by_case["bassa"]:
            ids = [block["id"] for block in entry["blocks"]]
            self.assertIn("shared-name", ids)
            self.assertNotIn("problem", ids)
        for entry in entries_by_case["introuvable"]:
            self.assertEqual(entry["owedParts"], [])
            self.assertNotIn("owed", [block["id"] for block in entry["blocks"]])
        for entry in entries_by_case["inconnu"]:
            self.assertEqual(entry["owedParts"], ["conviction", "invitation"])

    def test_case_authoring_uses_canonical_block_ids(self):
        intermediate_ids = set(FEED_BLOCKS) - {
            "lenses",
            "verdict",
            "appellations",
            "shorts",
            "owed",
            "further",
        }
        for case in CASES:
            self.assertTrue(set(case["order"]) <= intermediate_ids, case["id"])
        bassa = next(case for case in CASES if case["id"] == "bassa")
        self.assertIn("shared-name", bassa["order"])
        self.assertNotIn("problem", bassa["order"])

    def test_every_authored_production_uses_the_canonical_name_question(self):
        for case in CASES:
            empty = case.get("shorts", {}).get("empty")
            if empty:
                self.assertRegex(
                    empty[0],
                    r"^D’où vient le nom «\u00a0.+\u00a0» \?$",
                    case["id"],
                )

            board = next(
                entry
                for entry in self.entries
                if entry["case"] == case["id"]
                and entry["variant"] == "desktop-day"
            )
            markup = html.unescape(
                (self.output / board["file"]).read_text(encoding="utf-8")
            )
            for name, _, _ in case.get("shorts", {}).get("items", []):
                question = f"D’où vient le nom «\u00a0{name}\u00a0» ?"
                self.assertEqual(markup.count(question), 2, (case["id"], name))

        poster_source = (GENERATOR_DIR / "posters.py").read_text(encoding="utf-8")
        self.assertIn("D’OÙ VIENT LE NOM", poster_source)
        self.assertNotIn('d.text((20, H - 196), "D\'OÙ VIENT"', poster_source)

    def test_lenses_are_buttons_and_opening_blocks_are_siblings(self):
        for entry in self.entries:
            parser = parse_board(self.output / entry["file"])
            self.assertTrue(parser.lens_controls, entry["file"])
            self.assertTrue(
                all(tag == "button" for tag, _ in parser.lens_controls),
                entry["file"],
            )
            self.assertTrue(
                all(pressed in {"true", "false"} for _, pressed in parser.lens_controls),
                entry["file"],
            )
            by_id = {block["id"]: block for block in parser.blocks}
            if "appellations" in by_id:
                self.assertIs(
                    by_id["verdict"]["parent"],
                    by_id["appellations"]["parent"],
                    entry["file"],
                )

    def test_day_and_night_have_identical_structure(self):
        for case in {entry["case"] for entry in self.entries}:
            for device in ("mobile", "desktop"):
                day = next(
                    entry
                    for entry in self.entries
                    if entry["case"] == case
                    and entry["variant"] == f"{device}-day"
                )
                night = next(
                    entry
                    for entry in self.entries
                    if entry["case"] == case
                    and entry["variant"] == f"{device}-night"
                )
                for key in (
                    "query",
                    "resultState",
                    "width",
                    "height",
                    "blocks",
                    "owedParts",
                    "firstPoster",
                ):
                    self.assertEqual(day[key], night[key], f"{case}:{device}:{key}")

    def test_generated_assets_use_repository_paths(self):
        for entry in self.entries:
            source = (self.output / entry["file"]).read_text(encoding="utf-8")
            self.assertNotIn("/_blob/", source)
            self.assertNotIn("https://fonts.googleapis.com", source)
            self.assertNotIn('src="http', source)
            self.assertNotIn('href="http', source)
            self.assertNotIn("support.js", source)
            self.assertIn('href="fonts/search-feed.css"', source)

            asset_paths = re.findall(r'(?:src|href)="([^"]+)"', source)
            for asset_path in asset_paths:
                if asset_path.startswith("#"):
                    continue
                resolved = (CANONICAL_OUTPUT / asset_path).resolve()
                self.assertTrue(resolved.is_file(), f"{entry['file']}: {asset_path}")

        font_css_path = CANONICAL_OUTPUT / "fonts/search-feed.css"
        font_css = font_css_path.read_text(encoding="utf-8")
        self.assertIn("Fraunces-normal-latin.woff2", font_css)
        self.assertIn("Fraunces-italic-latin.woff2", font_css)
        self.assertNotIn("Fraunces.ttf", font_css)
        for asset_path in re.findall(r"url\(['\"]?([^)'\"]+)", font_css):
            self.assertTrue(
                (font_css_path.parent / asset_path).resolve().is_file(), asset_path
            )

    def test_second_build_has_no_diff(self):
        with tempfile.TemporaryDirectory() as second_tempdir:
            second = Path(second_tempdir)
            build_into(second)
            comparison = filecmp.dircmp(self.output, second)
            self.assertEqual(comparison.left_only, [])
            self.assertEqual(comparison.right_only, [])
            self.assertEqual(comparison.diff_files, [])
            self.assertEqual(comparison.funny_files, [])

    def test_checked_in_generated_files_match_a_clean_build_byte_for_byte(self):
        generated_files = sorted(
            path.relative_to(self.output)
            for path in self.output.rglob("*")
            if path.is_file()
        )
        self.assertEqual(len(generated_files), 42)
        for relative_path in generated_files:
            canonical = CANONICAL_OUTPUT / relative_path
            generated = self.output / relative_path
            self.assertTrue(canonical.is_file(), relative_path)
            self.assertEqual(
                canonical.read_bytes(), generated.read_bytes(), relative_path
            )


if __name__ == "__main__":
    unittest.main()
