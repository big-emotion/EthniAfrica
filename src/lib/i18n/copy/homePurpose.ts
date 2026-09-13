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
 * words. « Mille » is an assumed approximation (docs/editorial/
 * purpose-doctrine.md): it stands here as a position, never as a dated
 * attestation.
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
      "Africa’s borders are a hundred and forty years old. The names are a thousand.",
      "This people was not divided. The map was drawn over it.",
    ],
    linkLabel: "Read the full statement",
  },
  fr: {
    toggle: "Notre propos",
    sentences: [
      "Les frontières de l’Afrique ont cent quarante ans. Les noms en ont mille.",
      "Ce peuple n’a pas été divisé. C’est la carte qui a été dessinée par-dessus.",
    ],
    linkLabel: "Lire la déclaration",
  },
};
