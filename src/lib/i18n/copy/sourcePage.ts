// @req REQ-141
export const SOURCE_PAGE_COPY = {
  fr: {
    reliesOn: "Ce qui repose sur cette source",
    empty: "Aucune fiche ne cite cette source pour l'instant.",
    ficheOne: "fiche",
    ficheMany: "fiches",
    assertionOne: "affirmation",
    assertionMany: "affirmations",
    truncated:
      "Les fiches les plus liées à cette source, et non la liste entière.",
    back: "Retour à la bibliographie",
  },
  en: {
    reliesOn: "What relies on this source",
    empty: "No corpus fiche cites this source yet.",
    ficheOne: "fiche",
    ficheMany: "fiches",
    assertionOne: "statement",
    assertionMany: "statements",
    truncated:
      "The fiches most closely linked to this source, rather than the full list.",
    back: "Back to the bibliography",
  },
} as const;
