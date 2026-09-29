"""Scene captions as the renderer draws them: word onsets, type, emphasis and where they sit.

Timings are synthetic (one word every half second from t = 1 s); the frames are rendered by the real engine.
Ink is measured against the same frame rendered with no caption at all, so a test never depends on a font's
exact shapes, only on which pixels the caption changed.
"""
import copy
import random
import unittest

import numpy
from PIL import Image

import ethni_scene_captions as captions
import ethni_soustitre as st
import test_ethni_scenes as fixtures
from ethni_scene_plan import validate_plan
from ethni_scene_render import SceneRenderer
from test_ethni_globe_scene import GlobeSceneCase

NARRATION = "Onze villes du Congo portaient le nom d'un Belge."
STEP, FIRST = .5, 1.0
FRAME = (0, 0, 1080, 1920)


def timed(text=NARRATION, start=FIRST, step=STEP):
    words = [{"word": w, "start": start+i*step, "end": start+i*step+.4}
             for i, w in enumerate(st.TOKEN_PATTERN.findall(text))]
    return st.minuter([text], words)


def ink(frame, base, box=FRAME):
    """The pixels of `box` that the caption changed, as a boolean mask."""
    a, b = (numpy.asarray(f.crop(box)).astype(int) for f in (frame, base))
    return numpy.abs(a-b).max(axis=2) > 24


def overlaps(a, b):
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


class CaptionFixture(unittest.TestCase):
    setUp = fixtures.ScenePlanTests.setUp

    def renderer(self, plan=None, spoken=None, **kw):
        return SceneRenderer(plan or self.plan, self.root, timed() if spoken is None else spoken, proof=False, **kw)

    def bare(self, plan=None, **kw):
        return SceneRenderer(plan or self.plan, self.root, [], proof=False, **kw)

    def fullbleed(self):
        plan = copy.deepcopy(self.plan)
        plan["layout"] = "fullbleed"
        plan["scenes"][1]["image"]["motion"]["to"] = [1.03, .6, .5]
        del plan["scenes"][1]["transition"]
        return plan


class TypeTests(CaptionFixture):
    def test_the_caption_is_large_enough_for_a_phone_held_at_arm_length(self):
        # 1080 px map to 390 CSS px on a common phone: 72 px of the frame is 26 CSS px, the floor of comfortable reading.
        self.assertGreaterEqual(captions.size(), 72)

    def test_a_word_appears_at_its_onset_and_not_before(self):
        renderer, bare = self.renderer(), self.bare()
        groups = captions.layout(renderer)
        words = [w for g in groups for w in g["mots"]]
        for word in words[:4]:
            before = ink(renderer.render(word["debut"]-.03), bare.render(word["debut"]-.03), word["box"])
            after = ink(renderer.render(word["debut"]+captions.FADE_S+.03),
                        bare.render(word["debut"]+captions.FADE_S+.03), word["box"])
            self.assertEqual(before.sum(), 0, word["texte"])
            self.assertGreater(after.sum(), 100, word["texte"])

    def test_words_already_on_screen_do_not_move_when_the_next_one_arrives(self):
        renderer, bare = self.renderer(), self.bare()
        (group, *_) = captions.layout(renderer)
        first, last = group["mots"][0], group["mots"][-1]
        early = ink(renderer.render(first["debut"]+captions.FADE_S+.03),
                    bare.render(first["debut"]+captions.FADE_S+.03), first["box"])
        late = ink(renderer.render(last["debut"]+captions.FADE_S+.03),
                   bare.render(last["debut"]+captions.FADE_S+.03), first["box"])
        self.assertGreater(early.sum(), 100)
        self.assertLessEqual((early & ~late).sum(), .01*early.sum())

    def test_words_of_one_line_sit_on_one_baseline_whatever_their_letters(self):
        # « nom » has no ascender and « le » has one: drawn from the top of their own ink they would not line up.
        renderer, bare = self.renderer(spoken=timed("nom le nom")), self.bare()
        (group, *_) = captions.layout(renderer)
        frame, base = renderer.render(group["fin"]), bare.render(group["fin"])
        bottoms = []
        for word in group["mots"]:
            box = tuple(round(v) for v in (word["box"][0], word["box"][1], word["box"][2]+6, word["box"][3]))
            rows = numpy.nonzero(ink(frame, base, box).any(axis=1))[0]
            bottoms.append(rows.max())
        self.assertLessEqual(max(bottoms)-min(bottoms), 1, bottoms)

    def test_an_accented_french_group_stays_inside_the_safe_column(self):
        spoken = timed("Léopoldville était déjà « Léo » pour les gens d'Élisabethville.")
        renderer, bare = self.renderer(spoken=spoken), self.bare()
        for group in captions.layout(renderer):
            mask = ink(renderer.render(group["fin"]), bare.render(group["fin"]))
            rows, columns = numpy.nonzero(mask.any(axis=1))[0], numpy.nonzero(mask.any(axis=0))[0]
            self.assertGreaterEqual(columns.min(), renderer.left-4)
            self.assertLessEqual(columns.max(), renderer.right+8)  # the drop shadow leans right
            self.assertLessEqual(rows.max(), 1520+8)

    def test_a_word_wider_than_the_column_is_refused_not_shrunk(self):
        renderer = self.renderer(spoken=timed("Anticonstitutionnellement parlant"))
        with self.assertRaisesRegex(ValueError, "Anticonstitutionnellement"):
            captions.layout(renderer)

    def test_a_long_place_name_that_fits_is_drawn_whole(self):
        renderer = self.renderer(spoken=timed("Constantinople Ouagadougou"))
        (group, *_) = captions.layout(renderer)
        self.assertTrue(all(w["box"][2] <= renderer.right for w in group["mots"]))

    def test_reduced_motion_shows_the_whole_group_on_its_first_word(self):
        renderer, bare = self.renderer(reduced_motion=True), self.bare(reduced_motion=True)
        (group, *_) = captions.layout(renderer)
        first = ink(renderer.render(group["debut"]+.01), bare.render(group["debut"]+.01)).sum()
        last = ink(renderer.render(group["fin"]), bare.render(group["fin"])).sum()
        self.assertGreater(first, 0)
        self.assertEqual(first, last)

    def test_the_opening_thumbnail_carries_its_title_alone(self):
        plan = copy.deepcopy(self.plan)
        plan["cover"] = True
        renderer, bare = self.renderer(plan, spoken=timed(start=.1)), self.bare(plan)
        self.assertEqual(ink(renderer.render(1.0), bare.render(1.0)).sum(), 0)

    def test_a_silence_shows_no_caption(self):
        renderer, bare = self.renderer(spoken=timed("Un nom.") + timed("Un autre.", start=4)), self.bare()
        self.assertEqual(ink(renderer.render(3.0), bare.render(3.0)).sum(), 0)

    def test_frames_do_not_depend_on_the_order_they_are_rendered_in(self):
        instants = [1.2, 2.7, 3.1, 4.6, 6.0, 8.5]
        first = [self.renderer().render(t).tobytes() for t in instants]
        shuffled = list(instants)
        random.Random(3).shuffle(shuffled)
        renderer = self.renderer()
        by_instant = {t: renderer.render(t).tobytes() for t in shuffled}
        self.assertEqual(first, [by_instant[t] for t in instants])


def gold_pixels(frame, box, renderer):
    """Pixels of a box whose colour is closer to the accent than to the plain caption ink."""
    palette = renderer.palette
    gold, cream = (numpy.array(Image.new("RGB", (1, 1), palette[n]).getpixel((0, 0))) for n in ("gold", "white"))
    pixels = numpy.asarray(frame.crop(box)).astype(int).reshape(-1, 3)
    near = lambda c: numpy.abs(pixels-c).sum(axis=1) < 30
    return int(near(gold).sum()), int(near(cream).sum())


class EmphasisTests(CaptionFixture):
    def emphasised(self, words):
        plan = copy.deepcopy(self.plan)
        plan["scenes"][0]["emphasis"] = words
        return plan

    def test_an_authored_word_takes_the_accent_and_the_others_do_not(self):
        plan = self.emphasised(["Congo"])
        validate_plan(plan, self.root, 10)
        renderer = self.renderer(plan)
        (group, *_) = captions.layout(renderer)
        frame = renderer.render(group["fin"])
        accented = [w for w in group["mots"] if w.get("accent")]
        self.assertEqual([w["texte"] for w in accented], ["Congo"])
        gold, _ = gold_pixels(frame, accented[0]["box"], renderer)
        self.assertGreater(gold, 50)
        for word in group["mots"]:
            if not word.get("accent"):
                self.assertEqual(gold_pixels(frame, word["box"], renderer)[0], 0, word["texte"])

    def test_without_authored_emphasis_nothing_is_accented(self):
        (group, *_) = captions.layout(self.renderer())
        self.assertFalse(any(w.get("accent") for w in group["mots"]))

    def test_a_group_takes_one_accent_even_when_two_of_its_words_are_authored(self):
        renderer = self.renderer(self.emphasised(["villes", "Congo"]))
        (group, *_) = captions.layout(renderer)
        self.assertEqual([w["texte"] for w in group["mots"] if w.get("accent")], ["villes"])

    def test_the_accent_matches_a_whole_word_regardless_of_case_and_accent(self):
        renderer = self.renderer(self.emphasised(["BELGE"]), spoken=timed("Onze Belges, un Belge."))
        (group, *_) = captions.layout(renderer)
        self.assertEqual([w["texte"] for w in group["mots"] if w.get("accent")], ["Belge."])

    def test_an_emphasis_word_that_is_never_spoken_is_refused_at_layout(self):
        with self.assertRaisesRegex(ValueError, "Zaïre"):
            captions.layout(self.renderer(self.emphasised(["Zaïre"])))

    def test_emphasis_must_be_a_list_of_single_words(self):
        for bad in ("Congo", [], ["deux mots"], [""], [3], ["a", "b", "c", "d"]):
            with self.assertRaises(ValueError, msg=repr(bad)):
                validate_plan(self.emphasised(bad), self.root, 10)


class PlacementTests(CaptionFixture):
    def bottom(self, renderer):
        return {round(g["box"][3]) for g in captions.layout(renderer)}

    def test_an_ordinary_photo_scene_keeps_the_caption_in_the_low_band(self):
        renderer = self.renderer(spoken=timed(start=5.2))
        self.assertEqual(self.bottom(renderer), {1520})

    def test_a_two_line_group_clears_the_overlay_band_and_the_credits(self):
        plan = self.fullbleed()
        for group in captions.layout(self.renderer(plan, spoken=timed("Onze villes du Congo portaient le nom d'un Belge et le silence.", start=5.2))):
            self.assertGreaterEqual(group["box"][1], 1330-captions.PAD)
            self.assertLessEqual(group["box"][3], 1520)

    def test_all_groups_of_a_scene_share_one_baseline(self):
        text = "Onze villes du Congo portaient le nom d'un Belge, et personne ne le disait plus."
        renderer = self.renderer(self.fullbleed(), spoken=timed(text, start=5.2, step=.3))
        self.assertGreater(len(captions.layout(renderer)), 1)
        self.assertEqual(len(self.bottom(renderer)), 1)

    def test_an_authored_protected_region_moves_the_caption_out_of_it(self):
        plan = self.fullbleed()
        plan["scenes"][1]["protect"] = [[91, 1290, 900, 1530]]
        validate_plan(plan, self.root, 10)
        renderer = self.renderer(plan, spoken=timed(start=5.2))
        for group in captions.layout(renderer):
            self.assertFalse(overlaps(group["box"], (91, 1290, 900, 1530)))

    def test_a_scene_with_no_room_for_a_caption_is_refused_and_names_the_scene(self):
        plan = self.fullbleed()
        plan["scenes"][1]["protect"] = [[0, 0, 1080, 1920]]
        with self.assertRaisesRegex(ValueError, r"scene b.*caption"):
            captions.layout(self.renderer(plan, spoken=timed(start=5.2)))

    def test_protected_regions_must_be_rectangles_inside_the_frame(self):
        for bad in ([[1, 2, 3]], [[0, 0, 2000, 10]], [[10, 10, 5, 5]], "all", [["a", 0, 1, 1]], [[0, 0, 1, 1]]*5):
            plan = self.fullbleed()
            plan["scenes"][1]["protect"] = bad
            with self.assertRaises(ValueError, msg=repr(bad)):
                validate_plan(plan, self.root, 10)

    def test_a_map_in_the_panel_layout_is_not_covered(self):
        renderer, bare = self.renderer(spoken=timed(start=1.0)), self.bare()
        panel = (45, 480, 1035, 1170)
        for group in captions.layout(renderer):
            self.assertFalse(overlaps(group["box"], panel))
        self.assertEqual(ink(renderer.render(2.5), bare.render(2.5), panel).sum(), 0)

    def test_a_scene_overlay_keeps_its_items_uncovered(self):
        plan = self.fullbleed()
        scene = plan["scenes"][1]
        del scene["image"]
        scene.update(type="comparison", title="Nom", backdrop={"image": {"asset": "photo", "fit": "cover"}},
                     comparison=[{"label": "a", "body": "un", "at": .2}, {"label": "b", "body": "deux", "at": 1}])
        validate_plan(plan, self.root, 10)
        for group in captions.layout(self.renderer(plan, spoken=timed(start=5.2))):
            self.assertGreaterEqual(group["box"][1], 1330-captions.PAD)


class HighlightedCountryTests(GlobeSceneCase):
    """A globe whose highlighted country sits in the low third of the frame, where a caption would go."""

    def plan_with_country(self, layout="fullbleed", centre=(0, 20)):
        self.globe()
        scene = self.plan["scenes"][0]
        scene["map"]["camera"] = [{"at": 0, "center": list(centre), "span": 40}]
        scene["map"]["features"] = [self.feature()]
        if layout == "fullbleed":
            self.plan["layout"] = layout
            self.plan["scenes"][1]["image"]["motion"]["to"] = [1.03, .6, .5]
            del self.plan["scenes"][1]["transition"]
        validate_plan(self.plan, self.root, 10)
        return self.plan

    def renderers(self, spoken):
        return (SceneRenderer(self.plan, self.root, spoken, proof=False),
                SceneRenderer(self.plan, self.root, [], proof=False))

    def test_the_subject_box_of_a_highlighted_country_is_where_it_is_drawn(self):
        self.plan_with_country()
        without = copy.deepcopy(self.plan)
        without["scenes"][0]["map"]["features"] = []
        renderer = SceneRenderer(self.plan, self.root, [], proof=False)
        # Above the foot: the legend line a feature adds down there is text, not the subject.
        drawn = ink(renderer.render(2.0), SceneRenderer(without, self.root, [], proof=False).render(2.0), (0, 0, 1080, 1530))
        rows, columns = numpy.nonzero(drawn.any(axis=1))[0], numpy.nonzero(drawn.any(axis=0))[0]
        boxes = renderer.subject_boxes(self.plan["scenes"][0], 2.0)
        self.assertTrue(boxes)
        self.assertTrue(any(b[0]-40 <= columns.min() and columns.max() <= b[2]+40
                            and b[1]-40 <= rows.min() and rows.max() <= b[3]+40 for b in boxes), (boxes, rows.min(), rows.max()))

    def test_the_caption_rises_above_a_country_in_the_low_third_and_covers_none_of_it(self):
        self.plan_with_country()
        spoken = timed(start=1.0)
        renderer, bare = self.renderers(spoken)
        subject = renderer.subject_boxes(self.plan["scenes"][0], 2.0)
        self.assertTrue(any(overlaps(s, (renderer.left, 1332, renderer.right, 1520)) for s in subject),
                        "the fixture must put the country under the default caption band")
        (group, *_) = captions.layout(renderer)
        self.assertLess(group["box"][3], 1520)
        for s in subject:
            self.assertFalse(overlaps(group["box"], s))
        for instant in (group["debut"]+.7, group["fin"]):
            self.assertEqual(ink(renderer.render(instant), bare.render(instant), tuple(map(int, subject[0]))).sum(), 0)

    def test_the_caption_stays_low_when_the_country_is_above_it(self):
        self.plan_with_country(centre=(0, -10))
        renderer, _ = self.renderers(timed(start=1.0))
        self.assertEqual({round(g["box"][3]) for g in captions.layout(renderer)}, {1520})

    def test_the_caption_does_not_jump_while_the_camera_moves_inside_one_scene(self):
        self.plan_with_country()
        self.plan["scenes"][0]["map"]["camera"] = [{"at": 0, "center": [0, 20], "span": 40},
                                                   {"at": 4, "center": [0, 26], "span": 40}]
        validate_plan(self.plan, self.root, 10)
        renderer, _ = self.renderers(timed("Onze villes du Congo portaient le nom d'un Belge, et personne ne le disait.", step=.3))
        self.assertEqual(len({round(g["box"][3]) for g in captions.layout(renderer)}), 1)

    def test_the_caption_avoids_a_country_in_the_panel_layout_by_staying_below_the_map(self):
        self.plan_with_country(layout="panel")
        renderer, _ = self.renderers(timed(start=1.0))
        for group in captions.layout(renderer):
            self.assertGreaterEqual(group["box"][1], 1170)


if __name__ == "__main__":
    unittest.main()
