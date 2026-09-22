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
  /**
   * The sentence under the question, and the search field's description
   * (`aria-describedby`). One string, so SWC cannot drop a space.
   */
  description: string;
  /**
   * The home field's own visible label. The shared `SEARCH_LABEL` lists five
   * kinds, which the description above now says in the reader's words; the
   * label is left to ask the one question the reader is answering.
   */
  searchLabel: string;
  seedsIntro: string;
  /**
   * The same three words as the placeholder, still. They used to reel through
   * corpus draws; a word that moves while the reader aims at it is a target
   * that moves (operator ruling, 2026-09-22).
   */
  seeds: [string, string, string];
  /**
   * An outage is not an answer. The panel used to fall back to an empty state
   * here, which read as the corpus not knowing a name it may well hold.
   */
  searchUnavailable: string;
  searchRetry: string;
}

/**
 * The home's heading, and the one question the project answers.
 *
 * It asked about the continent until 2026-09-18 — an opening that invited any
 * question, of a site that answers one kind. The reorientation onto where names
 * come from (docs/editorial/essais/dou-viennent-les-noms-2026-09-17.md) makes it
 * the same sentence the account's card, its reel and the single social format
 * ask, so the surfaces pose one question rather than four.
 *
 * It sits directly above the search field, which is why it is a question and
 * not a claim: the field is its answer. The no-break space before « ? » is the
 * French rule.
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
    description:
      "A family name, a people, a language or a place: discover the stories and the sources around it.",
    searchLabel: "Which name are you looking for?",
    seedsIntro: "Try",
    seeds: ["Keïta", "Lingala", "Fula"],
    searchUnavailable: "Search is temporarily unavailable.",
    searchRetry: "Try again",
  },
  fr: {
    searchPlaceholder: "Ex. : Keïta, Lingala, Peul",
    description:
      "Un nom de famille, de peuple, de langue ou de lieu : découvrez les histoires et les sources qui l’entourent.",
    question: "D’où vient ce nom ?",
    searchLabel: "Quel nom cherchez-vous ?",
    seedsIntro: "Essayez avec",
    seeds: ["Keïta", "Lingala", "Peul"],
    searchUnavailable: "La recherche est momentanément indisponible.",
    searchRetry: "Réessayer",
  },
};
