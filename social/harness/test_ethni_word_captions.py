"""Word-by-word captions: onset timing, grouping and its refusals.

Every timing here is synthetic (words spaced at a fixed step). These tests pin the contract between the aligner's
word times and what the renderer may show; they say nothing about how a real narration sounds.
"""
import math
import unittest

import ethni_soustitre as st


def aligned(text, step=.5, length=.4, start=0.0):
    """One aligned word per TOKEN_PATTERN match, the way the aligner writes them."""
    return [{"word": w, "start": start+i*step, "end": start+i*step+length}
            for i, w in enumerate(st.TOKEN_PATTERN.findall(text))]


def width(text):
    return 10*len(text)


def timed(text, **kw):
    return st.minuter([text], aligned(text, **kw))[0]


class WordTimesTests(unittest.TestCase):
    def test_a_timed_caption_keeps_the_time_of_each_of_its_words(self):
        caption = timed("Libreville au Gabon")
        self.assertEqual([(w["texte"], w["debut"], w["fin"]) for w in caption["mots"]],
                         [("Libreville", 0, .4), ("au", .5, .9), ("Gabon", 1.0, 1.4)])
        self.assertEqual((caption["debut"], caption["fin"]), (0, 1.4))

    def test_a_word_appears_exactly_when_it_is_spoken(self):
        groups = st.grouper([timed("Onze villes du Congo portaient le nom d'un Belge")], width, 200)
        spoken = {w["texte"]: w["debut"] for g in groups for w in g["mots"]}
        self.assertEqual(spoken["Onze"], 0)
        self.assertEqual(spoken["Congo"], 1.5)
        self.assertEqual(spoken["Belge"], 4.0)

    def test_every_word_lands_in_exactly_one_group_in_spoken_order(self):
        text = "Onze villes du Congo portaient le nom d'un Belge, et personne ne le dit."
        groups = st.grouper([timed(text)], width, 200)
        self.assertEqual(" ".join(w["texte"] for g in groups for w in g["mots"]), text)
        onsets = [w["debut"] for g in groups for w in g["mots"]]
        self.assertEqual(onsets, sorted(onsets))

    def test_a_group_fits_two_lines_of_the_measured_width(self):
        text = "Onze villes du Congo portaient le nom d'un Belge, et personne ne le dit."
        for group in st.grouper([timed(text)], width, 200):
            self.assertLessEqual(len(group["lignes"]), 2)
            for line in group["lignes"]:
                self.assertLessEqual(width(" ".join(group["mots"][i]["texte"] for i in line)), 200)

    def test_a_group_never_ends_on_a_word_that_points_forward(self):
        groups = st.grouper([timed("Onze villes du Congo portaient le nom d'un Belge et le silence")], width, 200)
        for group in groups[:-1]:
            last = group["mots"][-1]["texte"]
            self.assertTrue(last[-1] in st.FIN_DE_PHRASE or st._nu(last) not in st.JAMAIS_EN_FIN, last)

    def test_an_elided_article_does_not_end_a_group_either(self):
        groups = st.grouper([timed("Onze villes du Congo portaient le nom d'un Belge")], width, 250)
        self.assertGreater(len(groups), 1)
        for group in groups[:-1]:
            self.assertNotIn(group["mots"][-1]["texte"], ("d'un", "l'", "qu'un"))

    def test_a_group_ends_where_the_speaker_breathes_when_it_can(self):
        groups = st.grouper([timed("Un roi, Léopold II, pour Léopoldville.")], width, 150)
        self.assertGreater(len(groups), 1)
        self.assertEqual(groups[0]["mots"][-1]["texte"], "II,")

    def test_a_group_wider_than_the_measure_is_never_shrunk_it_is_refused(self):
        with self.assertRaisesRegex(ValueError, "Anticonstitutionnellement"):
            st.grouper([timed("Anticonstitutionnellement")], width, 100)


class PunctuationTests(unittest.TestCase):
    def test_a_spaced_question_mark_appears_with_the_word_it_closes(self):
        caption = st.minuter(["Quoi ?"], aligned("Quoi"))[0]
        (group,) = st.grouper([caption], width, 200)
        self.assertEqual([(w["texte"], w["debut"]) for w in group["mots"]], [("Quoi ?", 0)])

    def test_guillemets_travel_with_the_word_they_frame(self):
        caption = st.minuter(["Dire « Mali » ici"], aligned("Dire Mali ici"))[0]
        (group,) = st.grouper([caption], width, 400)
        self.assertEqual([w["texte"] for w in group["mots"]], ["Dire", "« Mali »", "ici"])
        self.assertEqual([w["debut"] for w in group["mots"]], [0, .5, 1.0])

    def test_a_dash_between_two_spoken_words_keeps_both_onsets(self):
        caption = st.minuter(["Congo—Kinshasa aujourd'hui"], aligned("Congo—Kinshasa aujourd'hui"))[0]
        (group,) = st.grouper([caption], width, 400)
        self.assertEqual([(w["texte"], w["debut"], w["fin"]) for w in group["mots"]],
                         [("Congo—Kinshasa", 0, .9), ("aujourd'hui", 1.0, 1.4)])


class VisibilityTests(unittest.TestCase):
    def test_a_group_holds_after_its_last_word_and_no_longer(self):
        (group,) = st.grouper([timed("Un nom")], width, 200)
        self.assertEqual(group["debut"], 0)
        self.assertAlmostEqual(group["jusqua"], group["fin"]+st.MAINTIEN_S)

    def test_a_breath_between_groups_does_not_blank_the_screen(self):
        captions = st.minuter(["Un nom.", "Un autre."], aligned("Un nom. Un autre."))
        groups = st.grouper(captions, width, 200)
        self.assertEqual(groups[0]["jusqua"], groups[1]["debut"])

    def test_a_silence_clears_the_screen_instead_of_holding_the_last_words(self):
        words = aligned("Un nom.") + aligned("Un autre.", start=5)
        groups = st.grouper(st.minuter(["Un nom.", "Un autre."], words), width, 200)
        self.assertAlmostEqual(groups[0]["jusqua"], groups[0]["fin"]+st.MAINTIEN_S)
        self.assertLess(groups[0]["jusqua"], groups[1]["debut"])

    def test_no_caption_no_group(self):
        self.assertEqual(st.grouper([], width, 200), [])


class InvalidTimingTests(unittest.TestCase):
    """Approximate synchronisation is never invented: a caption whose words cannot be timed is refused."""

    def refused(self, caption, message):
        with self.assertRaisesRegex(ValueError, message):
            st.grouper([caption], width, 400)

    def test_fewer_aligned_words_than_spoken_words_is_refused(self):
        caption = st.minuter(["Un nom de peuple"], aligned("Un nom de"))[0]
        self.refused(caption, "Un nom de peuple")

    def test_a_caption_without_word_times_is_refused(self):
        self.refused({"texte": "Un nom", "debut": 0, "fin": 1}, "Un nom")

    def test_a_word_without_a_start_is_refused(self):
        words = aligned("Un nom")
        del words[1]["start"]
        self.refused(st.minuter(["Un nom"], words)[0], "nom")

    def test_a_word_that_ends_before_it_starts_is_refused(self):
        words = aligned("Un nom")
        words[1]["end"] = words[1]["start"]-.1
        self.refused(st.minuter(["Un nom"], words)[0], "nom")

    def test_words_out_of_order_are_refused(self):
        words = aligned("Un nom")
        words[1]["start"], words[1]["end"] = -1, -.6
        self.refused(st.minuter(["Un nom"], words)[0], "order")

    def test_a_time_that_is_not_a_finite_number_is_refused(self):
        for bad in (math.nan, math.inf, "1.0", None):
            words = aligned("Un nom")
            words[1]["start"] = bad
            self.refused(st.minuter(["Un nom"], words)[0], "nom")


if __name__ == "__main__":
    unittest.main()
