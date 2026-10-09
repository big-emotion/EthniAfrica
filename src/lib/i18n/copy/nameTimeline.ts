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
  elsewhereTitle: string;
  /** The first « meanwhile » sentence, about the name, by kind of tile. */
  elsewhereLead: {
    plain: (name: string) => string;
    birth: (name: string) => string;
    before: (name: string) => string;
  };
  sources: {
    open: (kind: string) => string;
    more: (count: number) => string;
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
    hint: "On remonte le temps",
    elsewhereButton: "Pendant ce temps, ailleurs",
    regime: {
      polity: "Précolonial",
      colonial: "Colonial",
      modern: "Contemporain",
    },
    regimeLegend: "Époques",
    tilesLabel: (name) =>
      `Histoire du nom ${name}, du plus récent au plus ancien`,
    birthMark: (name) =>
      `Naissance du nom ${name} · origine la plus ancienne connue du projet`,
    beforeMark: (name) => `Avant le nom ${name}`,
    hypothesesHeading: (name) =>
      `D'où vient le nom ${name} ? Les sources proposent plusieurs explications, sans que l'une l'emporte.`,
    hypothesis: (index) => `Hypothèse ${index}`,
    actors: "Personnes citées dans ce récit",
    noBirth: (name) =>
      `L'origine du nom ${name} n'est pas datée dans le projet pour l'instant.`,
    end: (name) =>
      `Fin de ce que nos recherches retracent pour le nom ${name}.`,
    elsewhereTitle: "Pendant ce temps, ailleurs",
    elsewhereLead: {
      plain: (name) => `Le nom ${name} est alors en usage.`,
      birth: (name) =>
        `Le nom ${name} laisse alors sa plus ancienne trace connue du projet.`,
      before: (name) => `Le nom ${name} n'est pas encore attesté.`,
    },
    sources: {
      open: (kind) => `Voir les sources de ce passage (${kind})`,
      more: (count) => `+${count}`,
    },
  },
};
