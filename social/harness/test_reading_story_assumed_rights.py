"""The twin profile `reading-story-droits-assumes` carries the one rights wording the
operator takes responsibility for, and nothing else about `reading-story` changes.

A deck that publishes photographs whose rights are not yet acquired must say so in
its own profile: the plain `reading-story` stays strict, so a missing licence anywhere
else still blocks the lot.
"""
import unittest

import ethni_carousel_profiles as profiles
import ethni_compose as gab

ASSUMED = "droits réservés, auteur non identifié (publication sous la responsabilité de l'opérateur)"


def image(licence):
    return {"fichier": "x.jpg", "w": 1080, "h": 1350, "cadrage": "50% 50%",
            "identite": "un portrait photographique", "credit": "Photographie publiée par un média",
            "depot": "média", "licence": licence, "sujet": [0.2, 0.05, 0.8, 0.3],
            "verifie": {"par": "test", "le": "2026-10-02"}}


def deck(profile, licences):
    cards = []
    for rank, licence in enumerate(licences, 1):
        cards.append({"rang": rank, "role": "serie", "composition": "portrait", "titre": f"Carte {rank}",
                      "chiffre": False, "precision": "Une ligne", "punchline": "", "corps": "",
                      "source": "Une source", "paires": None, "pivot": None, "titre_camps": None,
                      "coupe": None, "disposition": "auto", "image": image(licence)})
    cards[0].update(role="ouverture", composition="cover", precision="", source="")
    cards[-1].update(composition="credits", corps="Dites-nous d'où vient votre récit.")
    return {"profil": profile, "campagne": "t", "pilier": "Personnage historique",
            "accent": "ocre", "fond": "nuit", "cartes": cards}


class AssumedRightsProfileTest(unittest.TestCase):
    def test_the_twin_profile_declares_the_wording_and_the_five_networks(self):
        twin = deck("reading-story-droits-assumes", [ASSUMED] * 4)
        self.assertEqual(profiles.assumed_licence(twin), ASSUMED)
        self.assertEqual(profiles.networks(twin, "carrousel"),
                         ["TikTok", "Instagram", "Facebook", "YouTube", "LinkedIn"])
        self.assertEqual(profiles.errors(twin, twin["cartes"]), [])

    def test_a_mixed_lot_ships_under_the_assumed_wording(self):
        twin = deck("reading-story-droits-assumes", [ASSUMED, "CC BY-SA 4.0", "CC BY 2.0", ASSUMED])
        verdict = gab.portes(twin["cartes"], twin)
        self.assertEqual(verdict.licence_sortie, ASSUMED)
        self.assertFalse([m for m in verdict.manquantes if "licence" in m], verdict.manquantes)

    def test_any_other_unnamed_licence_still_blocks_inside_the_twin(self):
        twin = deck("reading-story-droits-assumes", [ASSUMED, "tous droits réservés", "CC BY 2.0", ASSUMED])
        self.assertFalse(gab.portes(twin["cartes"], twin).passe)

    def test_plain_reading_story_still_refuses_the_assumed_wording(self):
        plain = deck("reading-story", [ASSUMED] * 4)
        self.assertIsNone(profiles.assumed_licence(plain))
        verdict = gab.portes(plain["cartes"], plain)
        self.assertFalse(verdict.passe)
        self.assertTrue(any("licence" in m for m in verdict.manquantes), verdict.manquantes)

    def test_the_twin_keeps_the_card_range_and_compositions_of_reading_story(self):
        story, twin = profiles.load("reading-story"), profiles.load("reading-story-droits-assumes")
        self.assertEqual(twin["reading"], story["reading"])
        self.assertEqual(twin["formats"], story["formats"])
        self.assertEqual(twin["crops"], story["crops"])


if __name__ == "__main__":
    unittest.main()
