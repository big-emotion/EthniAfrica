import type { Language } from "@/types/shared";

/**
 * The words around the name story that opens a fiche.
 *
 * The marks on a form (« the name they give themselves », « contested form »)
 * are not repeated here: `nameAnswerCopy` already says them for the result
 * page, and one wording per idea is what keeps the two surfaces from drifting.
 */
export interface FicheNameStoryCopy {
  eyebrow: string;
  askSeveral: string;
  askOne: string;
  readMore: string;
  moreForms: (count: number) => string;
  imposedBy: string;
}

// @req REQ-151
export const ficheNameStoryCopy: Record<Language, FicheNameStoryCopy> = {
  fr: {
    eyebrow: "L’histoire des noms",
    askSeveral: "D’où viennent ces noms ?",
    askOne: "D’où vient ce nom ?",
    readMore: "Lire la suite",
    moreForms: (count) => `+${count} ${count === 1 ? "autre" : "autres"}`,
    imposedBy: "Donné par",
  },
};
