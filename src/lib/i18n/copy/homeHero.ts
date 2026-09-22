import type { Language } from "@/types/shared";

export interface HomeHeroCopy {
  question: string;
  /**
   * Three stable seeds (editorial-and-experience-plan.md §4.2, H4), checked
   * against the corpus rather than assumed: `PAT_KEITA.json`, `langues/lin.json`
   * and the widely-used exonym for `PPL_FULA.json` all resolve. Kept off the
   * shared `searchVocabulary.ts` constant on purpose — that one also feeds the
   * header search modal and the /atlas/recherche page, neither of which this
   * change touches.
   */
  searchPlaceholder: string;
  /** The sentence under the question. One string, so SWC cannot drop a space. */
  answer: string;
}

/**
 * The home's heading, and the one question the atlas answers.
 *
 * It asked about the continent until 2026-09-18 — an opening that invited any
 * question, of a site that answers one kind. The reorientation onto where names
 * come from (docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md) makes it
 * the same sentence the account's card, its reel and the single social format
 * ask, so the surfaces pose one question rather than four.
 *
 * It sits directly above the search field, which is why it is a question and
 * not a claim: the field is its answer, and the tile band below states the
 * classes it counts. The no-break space before « ? » is the French rule.
 *
 * It lives here rather than inside the component because a French sentence a
 * reader sees belongs in a dictionary — the rule `check:copy-literals` holds,
 * and the rule that gives this key its English counterpart for free.
 */
// @req REQ-044
// @req REQ-145
export const homeHeroCopy: Record<Language, HomeHeroCopy> = {
  en: {
    question: "Where does this name come from?",
    searchPlaceholder: "E.g. Keïta, Lingala, Fula",
    answer:
      "Explore the map, read the dossiers, play: the history of the names of Africa’s peoples, with the sources to hand.",
  },
  fr: {
    searchPlaceholder: "Ex. : Keïta, Lingala, Peul",
    answer:
      "Explorez la carte, lisez les dossiers, jouez : l'histoire des noms des peuples d'Afrique, sources à l'appui.",
    question: "D’où vient ce nom ?",
  },
};
