import { COUNT_FR } from "@/lib/i18n/copy/nameClosing";
import type { Language } from "@/types/shared";

/**
 * The name-history timeline (REQ-198). Every sentence about a name opens on
 * that name (reader-facing register, « Name-history timeline tiles »); the
 * names themselves are set in italics by the component, never here.
 */
export interface NameTimelineCopy {
  /** Eyebrow of the summary tile, with the subject's kind. */
  eyebrow: (kind: string) => string;
  namesLabel: (subject: string) => string;
  searchedMark: string;
  formerMark: string;
  seeSelfName: string;
  /**
   * The lead's second line (brief 11 §1a): how many explanations of the
   * self-name the page shows. It names none and ranks none.
   */
  selfReadings: (name: string, count: number) => string;
  /** After the lead's own sentence, the hand-off says the name has a story. */
  handOffStory: (count: number) => string;
  handOffAction: (name: string) => string;
  hint: string;
  elsewhereButton: string;
  regime: { polity: string; colonial: string; modern: string };
  regimeLegend: string;
  tilesLabel: (name: string) => string;
  birthMark: (name: string) => string;
  beforeMark: (name: string) => string;
  hypothesesHeading: (name: string) => string;
  hypothesis: (index: number) => string;
  actors: string;
  noBirth: (name: string) => string;
  end: (name: string) => string;
  foldMore: (count: number) => string;
  elsewhereTitle: string;
  /** The first « meanwhile » sentence, about the name, by kind of tile. */
  elsewhereLead: {
    plain: (name: string) => string;
    birth: (name: string) => string;
    before: (name: string) => string;
  };
}

// @req REQ-198
export const nameTimelineCopy: Record<Language, NameTimelineCopy> = {
  fr: {
    eyebrow: (kind) => `D'où vient le nom · ${kind}`,
    namesLabel: (subject) => `Les noms de ${subject}`,
    searchedMark: "cherché",
    formerMark: "ancien",
    seeSelfName: "Voir",
    selfReadings: (name, count) =>
      `D'où vient le nom ${name} ? Les sources proposent ${COUNT_FR[count] ?? count} explications, sans que l'une l'emporte.`,
    handOffStory: (count) =>
      count > 0
        ? `Ce nom a aussi son histoire : les sources proposent ${COUNT_FR[count] ?? count} explications de son origine, sans que l'une l'emporte.`
        : "Ce nom a aussi son histoire.",
    handOffAction: (name) => `Lire l'histoire du nom ${name}`,
    // Plain labels, no figure of style (operator, 2026-10-17): the doctrine's
    // « birth » and « meanwhile, elsewhere » name ideas, not reader labels.
    hint: "Du plus récent au plus ancien",
    elsewhereButton: "Ailleurs à la même époque",
    regime: {
      polity: "Précolonial",
      colonial: "Colonial",
      modern: "Contemporain",
    },
    regimeLegend: "Époques",
    tilesLabel: (name) =>
      `Histoire du nom ${name}, du plus récent au plus ancien`,
    birthMark: (name) => `Origine la plus ancienne connue du nom ${name}`,
    beforeMark: (name) => `Avant le nom ${name}`,
    hypothesesHeading: (name) =>
      `D'où vient le nom ${name} ? Les sources proposent plusieurs explications, sans que l'une l'emporte.`,
    hypothesis: (index) => `Hypothèse ${index}`,
    actors: "Personnes citées dans ce récit",
    noBirth: (name) =>
      `L'origine du nom ${name} n'est pas datée dans le projet pour l'instant.`,
    end: (name) =>
      `Fin de ce que nos recherches retracent pour le nom ${name}.`,
    foldMore: (count) =>
      count === 1
        ? "+ Voir l’autre récit"
        : `+ Voir les ${count} autres récits`,
    elsewhereTitle: "Ailleurs à la même époque",
    elsewhereLead: {
      plain: (name) => `Le nom ${name} est alors en usage.`,
      birth: (name) =>
        `Le nom ${name} laisse alors sa plus ancienne trace connue du projet.`,
      before: (name) => `Le nom ${name} n'est pas encore attesté.`,
    },
  },
};
