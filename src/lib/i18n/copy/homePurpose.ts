import type { Language } from "@/types/shared";

export interface HomePurposeCopy {
  toggle: string;
  sentences: [string, string];
  linkLabel: string;
}

/**
 * What the atlas is for, in the two sentences the social series opens and
 * closes on, behind the home's « Notre propos » disclosure.
 *
 * Both are the project's position rather than a finding the atlas proves, and
 * the link goes to the About page's purpose chapter, which says so in as many
 * words. « Plus de mille » is a position, never a dated attestation: the
 * atlas dates no name (docs/editorial/purpose-doctrine.md). « La plupart » and
 * « moins de » are not a softening. Berlin drew almost no line itself, one
 * border is older than it (Morocco–Algeria, 1845) and many are younger (Togo
 * after 1914, Eritrea 1993, South Sudan 2011), so the unqualified figure was
 * false in both directions.
 *
 * Closed by default because the band's job is still the search; offered at
 * all because a reader who asks what the atlas is for is owed the answer in
 * two sentences rather than a scroll.
 */
// @req REQ-115
// @req REQ-145
export const homePurposeCopy: Record<Language, HomePurposeCopy> = {
  en: {
    toggle: "What we stand for",
    sentences: [
      "Most of Africa’s borders are less than a hundred and forty years old. The names are more than a thousand years old.",
      "This people was not divided. The map was drawn over it.",
    ],
    linkLabel: "Read the full statement",
  },
  fr: {
    toggle: "Notre propos",
    sentences: [
      "La plupart des frontières de l’Afrique ont moins de cent quarante ans. Les noms en ont plus de mille.",
      "Ce peuple n’a pas été divisé. C’est la carte qui a été dessinée par-dessus.",
    ],
    linkLabel: "Lire la déclaration",
  },
};
