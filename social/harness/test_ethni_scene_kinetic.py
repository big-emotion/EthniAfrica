"""The kinetic-text scene: lines that arrive one after another, each on its narrated word.

The contract is what a reader of the film sees: nothing before the cue, a fade with a short rise at the
cue, a settled line afterwards, the lines stacked top to bottom in the order they are spoken, one accent
word at most, and nothing drawn where the caption and the phone's interface live.
"""
import copy
import unittest

import numpy
from PIL import ImageColor

import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer

LAYOUTS = (None, "fullbleed")
LINES = [{"text": "le pays : la carte", "at": 1.0},
         {"text": "l'État : les règles", "at": 3.0},
         {"text": "la nation : le nous", "at": 5.0}]
ARRIVAL = .5  # seconds from a line's cue to its settled state


def bands(mask, gap=25):
    """Vertical runs of ink between the header and the caption, as (top, bottom) rows."""
    rows = numpy.flatnonzero(mask[500:1340, 91:900].any(axis=1)) + 500
    runs = []
    for row in rows:
        if runs and row - runs[-1][1] <= gap:
            runs[-1][1] = row
        else:
            runs.append([row, row])
    return [tuple(run) for run in runs]


class KineticTests(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def kinetic(self, layout=None, lines=None):
        plan = copy.deepcopy(self.plan)
        plan["scenes"] = [{"id": "k", "type": "kinetic", "start": 0, "end": 10, "title": "Trois mots",
                           "purpose": "Say the three words one after another",
                           "evidence": copy.deepcopy(self.plan["scenes"][0]["evidence"]),
                           "kinetic": {"lines": copy.deepcopy(LINES if lines is None else lines)}}]
        if layout:
            plan["layout"] = layout
        return plan

    def renderer(self, plan, **options):
        return SceneRenderer(plan, self.root, [], proof=False, **options)

    def ink(self, renderer, instant):
        ground = numpy.array(ImageColor.getrgb(renderer.palette["ground"]))
        frame = numpy.asarray(renderer.render(instant).convert("RGB"), dtype=int)
        return numpy.abs(frame - ground).sum(axis=2) > 24

    # ------------------------------------------------------------------ the plan

    def test_a_kinetic_scene_is_valid_in_both_layouts(self):
        for layout in LAYOUTS:
            with self.subTest(layout=layout):
                validate_plan(self.kinetic(layout), self.root, 10)

    def test_it_needs_one_to_four_lines_each_with_text_and_a_cue(self):
        four = LINES + [{"text": "l'État-nation : les deux", "at": 7.0}]
        validate_plan(self.kinetic(lines=four), self.root, 10)
        for name, lines in (("none", []), ("five", four + [{"text": "one more", "at": 8.0}]),
                            ("no text", [{"at": 1.0}]), ("empty text", [{"text": " ", "at": 1.0}]),
                            ("no cue", [{"text": "a line"}]), ("negative cue", [{"text": "a line", "at": -1}]),
                            ("unknown field", [{"text": "a line", "at": 1, "colour": "gold"}])):
            with self.subTest(name), self.assertRaises(ValueError):
                validate_plan(self.kinetic(lines=lines), self.root, 10)

    def test_a_line_must_stay_on_screen_long_enough_to_be_read(self):
        validate_plan(self.kinetic(lines=[{"text": "a line", "at": 9.0}]), self.root, 10)
        with self.assertRaisesRegex(ValueError, "reading time"):
            validate_plan(self.kinetic(lines=[{"text": "a line", "at": 9.5}]), self.root, 10)

    def test_lines_follow_the_narration_in_reading_order(self):
        lines = [{"text": "second", "at": 4.0}, {"text": "first", "at": 2.0}]
        with self.assertRaisesRegex(ValueError, "order"):
            validate_plan(self.kinetic(lines=lines), self.root, 10)

    def test_a_card_carries_at_most_one_accent_word_and_it_is_one_word_of_its_line(self):
        validate_plan(self.kinetic(lines=[{"text": "la nation : le nous", "at": 1, "accent": "nous"}]), self.root, 10)
        for name, lines in (("two accents", [{"text": "le pays", "at": 1, "accent": "pays"},
                                               {"text": "la nation", "at": 3, "accent": "nation"}]),
                            ("absent", [{"text": "le pays", "at": 1, "accent": "carte"}]),
                            ("two words", [{"text": "le pays de France", "at": 1, "accent": "pays de"}])):
            with self.subTest(name), self.assertRaisesRegex(ValueError, "accent"):
                validate_plan(self.kinetic(lines=lines), self.root, 10)

    def test_content_of_another_scene_type_is_refused(self):
        plan = self.kinetic()
        plan["scenes"][0]["text"] = "Words"
        with self.assertRaises(ValueError):
            validate_plan(plan, self.root, 10)
        plan = self.kinetic()
        del plan["scenes"][0]["kinetic"]
        with self.assertRaises(ValueError):
            validate_plan(plan, self.root, 10)

    # ------------------------------------------------------------------ the frames

    def test_a_line_appears_at_its_cue_and_not_before(self):
        for layout in LAYOUTS:
            with self.subTest(layout=layout):
                renderer = self.renderer(self.kinetic(layout))
                self.assertEqual(bands(self.ink(renderer, .9)), [])
                self.assertEqual(len(bands(self.ink(renderer, 1.0 + ARRIVAL))), 1)

    def test_a_line_fades_in_and_rises_then_settles(self):
        for layout in LAYOUTS:
            with self.subTest(layout=layout):
                renderer = self.renderer(self.kinetic(layout))
                early, settled = self.ink(renderer, 1.05), self.ink(renderer, 1.0 + ARRIVAL)
                (top_early, _), = bands(early)
                (top_settled, _), = bands(settled)
                self.assertGreater(top_early, top_settled + 4, "the line starts lower and rises")
                frame_early = numpy.asarray(renderer.render(1.05).convert("L"), dtype=int)[500:1340, 91:900]
                frame_settled = numpy.asarray(renderer.render(1.0 + ARRIVAL).convert("L"), dtype=int)[500:1340, 91:900]
                self.assertLess(frame_early.max(), frame_settled.max(), "and it is not yet fully opaque")
                self.assertTrue((renderer.render(1.0 + ARRIVAL).tobytes() == renderer.render(2.5).tobytes()),
                                "a settled line no longer moves")

    def test_lines_stack_top_to_bottom_in_the_order_they_are_spoken(self):
        renderer = self.renderer(self.kinetic())
        runs = bands(self.ink(renderer, 8))
        self.assertEqual(len(runs), 3)
        self.assertTrue(all(a[1] < b[0] for a, b in zip(runs, runs[1:])))
        self.assertEqual(len(bands(self.ink(renderer, 4))), 2, "the third line is not there yet")

    def test_reduced_motion_shows_a_line_at_its_cue_without_movement(self):
        renderer = self.renderer(self.kinetic(), reduced_motion=True)
        self.assertEqual(renderer.render(1.0).tobytes(), renderer.render(2.5).tobytes())
        self.assertEqual(bands(self.ink(renderer, .99)), [])

    def test_only_the_accent_word_takes_the_accent_colour(self):
        gold = numpy.array(ImageColor.getrgb(self.renderer(self.kinetic()).palette["gold"]))

        def gold_pixels(lines):
            renderer = self.renderer(self.kinetic(lines=lines))
            frame = numpy.asarray(renderer.render(3).convert("RGB"), dtype=int)[500:1340, 91:900]
            return int((frame == gold).all(axis=2).sum())

        plain = gold_pixels([{"text": "la nation : le nous", "at": 1}])
        accented = gold_pixels([{"text": "la nation : le nous", "at": 1, "accent": "nous"}])
        self.assertEqual(plain, 0)
        self.assertGreater(accented, 200)

    def test_the_accent_word_stands_on_the_same_baseline_as_the_rest_of_its_line(self):
        """A card once showed « selon » raised above « l'État-nation, » and « Rougemont » : the pieces of a
        line were placed by the top of their own ink, so a piece ending in a comma or holding a capital
        accent did not stand where its neighbours did. The word keeps the rows it has when unaccented."""
        text = "l'État-nation, selon Rougemont"
        gold = numpy.array(ImageColor.getrgb(self.renderer(self.kinetic()).palette["gold"]))

        def frame(line):
            renderer = self.renderer(self.kinetic(lines=[line]))
            return numpy.asarray(renderer.render(3).convert("RGB"), dtype=int)[500:800, 91:900]

        accented = frame({"text": text, "at": 1, "accent": "selon"})
        in_gold = (accented == gold).all(axis=2)
        columns = numpy.flatnonzero(in_gold.any(axis=0))
        first, last = columns.min() + 2, columns.max() - 2
        plain = frame({"text": text, "at": 1})
        ground = numpy.array(ImageColor.getrgb(self.renderer(self.kinetic()).palette["ground"]))
        plain_rows = numpy.flatnonzero((numpy.abs(plain[:, first:last + 1] - ground).sum(axis=2) > 24).any(axis=1))
        gold_rows = numpy.flatnonzero(in_gold.any(axis=1))
        self.assertLessEqual(abs(int(gold_rows.max()) - int(plain_rows.max())), 2, "same baseline")
        self.assertLessEqual(abs(int(gold_rows.min()) - int(plain_rows.min())), 2, "same top")

    def test_a_detail_sits_under_its_line_and_arrives_with_it(self):
        renderer = self.renderer(self.kinetic(lines=[{"text": "l'État", "at": 1, "detail": "une autorité qui organise un pays"}]))
        (top, bottom), = bands(self.ink(renderer, 1 + ARRIVAL))
        self.assertGreater(bottom - top, 90, "the line and its detail form one block")

    def test_a_line_that_does_not_fit_fails_instead_of_shrinking(self):
        for name, line in (("line", {"text": "un mot " * 30, "at": 1}),
                           ("detail", {"text": "le pays", "at": 1, "detail": "trop long " * 40})):
            with self.subTest(name), self.assertRaisesRegex(ValueError, "overflow"):
                self.renderer(self.kinetic(lines=[line])).preflight()

    def test_nothing_is_drawn_between_the_lines_and_the_caption(self):
        four = LINES + [{"text": "l'État-nation : les deux", "at": 7.0, "detail": "les règles et le nous réunis"}]
        for layout in LAYOUTS:
            with self.subTest(layout=layout):
                renderer = self.renderer(self.kinetic(layout, lines=four))
                mask = self.ink(renderer, 9.5)
                self.assertFalse(mask[1330:1375, 91:900].any())

    def test_preflight_inspects_every_cue_and_its_arrival(self):
        instants = self.renderer(self.kinetic()).preflight()
        for cue in (1.0, 3.0, 5.0):
            for delta in (0, ARRIVAL / 2, ARRIVAL):
                self.assertTrue(any(abs(i - (cue + delta)) < 1e-6 for i in instants), (cue, delta))

    def test_full_frame_layout_puts_the_title_above_the_lines_not_low_left(self):
        renderer = self.renderer(self.kinetic("fullbleed"))
        before_any_line = self.ink(renderer, .5)
        self.assertTrue(before_any_line[180:470, 91:900].any(), "the title is the header of the card")
        self.assertFalse(before_any_line[900:1300, 91:900].any(), "the low-left title slot stays empty")

    def test_the_shading_never_dims_the_header_or_the_lowest_line(self):
        four = LINES + [{"text": "l'État-nation : les deux", "at": 7.0}]
        renderer = self.renderer(self.kinetic("fullbleed", lines=four))
        frame = numpy.asarray(renderer.render(9.5).convert("L"), dtype=int)
        white = max(ImageColor.getrgb(renderer.palette["white"]))
        self.assertGreaterEqual(frame[200:330, 91:900].max(), white - 40, "the header keeps its ink")
        for top, bottom in bands(self.ink(renderer, 9.5)):
            self.assertGreaterEqual(frame[top:bottom + 1, 91:900].max(), white - 40, f"the line at {top} keeps its ink")

    def test_a_dissolve_fades_the_outgoing_card_out_over_the_ground(self):
        plan = self.kinetic("fullbleed", lines=[{"text": "le pays : la carte", "at": 1.0}])
        plan["scenes"][0]["end"] = 5
        second = copy.deepcopy(plan["scenes"][0])
        second.update(id="k2", start=5, end=10, title="Autre carte", transition={"type": "dissolve", "duration": .4})
        second["kinetic"]["lines"] = [{"text": "la nation : le nous", "at": 3.0}]
        plan["scenes"].append(second)
        validate_plan(plan, self.root, 10)
        renderer = self.renderer(plan)

        def brightest(instant):
            return numpy.asarray(renderer.render(instant).convert("L"), dtype=int)[500:1340, 91:900].max()

        full = brightest(4.9)
        self.assertGreater(brightest(5.02), .8 * full)
        self.assertTrue(.25 * full < brightest(5.2) < .8 * full, "halfway through, the old line is half faded")
        self.assertLess(brightest(5.38), .25 * full)


if __name__ == "__main__":
    unittest.main()
