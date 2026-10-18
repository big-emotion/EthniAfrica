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
  /** The count on a name row that folds its competing readings (brief 5). */
  explanations: (count: number) => string;
  imposedBy: string;
  /** The fiche's link to the result page of its leading name (brief 10 §1). */
  storyLink: (name: string) => string;
  storyLinkHint: string;
  /** Family-name fiche copy, as it appears on the approved brief 6 boards. */
  familyNameStoryLink: (name: string) => string;
  familyNameStoryHint: string;
}

// @req REQ-151
export const ficheNameStoryCopy: Record<Language, FicheNameStoryCopy> = {
  fr: {
    eyebrow: "L’histoire des noms",
    askSeveral: "D’où viennent ces noms ?",
    askOne: "D’où vient ce nom ?",
    readMore: "Lire la suite",
    moreForms: (count) => `+${count} ${count === 1 ? "autre" : "autres"}`,
    explanations: (count) => `${count}\u00a0explications`,
    imposedBy: "Donné par",
    storyLink: (name) => `Suivre l'histoire du nom ${name}`,
    storyLinkHint:
      "La page du nom présente ce que disent les sources : qui l'a donné, à qui, quand et pourquoi, en remontant le temps.",
    familyNameStoryLink: (name) => `Lire l’histoire du nom ${name}`,
    familyNameStoryHint:
      "La page du nom présente ce que disent les sources : qui l’a donné, à qui, quand et pourquoi, du plus récent au plus ancien.",
  },
};
