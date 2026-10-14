import { aboutCopy } from "@/lib/i18n/copy/about";
import type { Language } from "@/types/shared";

/**
 * The blocks under the timeline on the search result page (brief 1, approved
 * 2026-10-14, boards in docs/design/mockups/site/): who tells the name, what
 * the project does not know yet, and where to go next. The conviction and the
 * invitation are the about page's own sentences, so the site says them once.
 */
export interface NameClosingCopy {
  sourcesEyebrow: string;
  sourcesTitle: (name: string) => string;
  sourcesLead: (count: number, name: string) => string;
  sourcesStrip: string;
  sourceCount: (count: number) => string;
  accountCount: (count: number) => string;
  undated: string;
  closingTitle: string;
  silence: {
    noOral: (name: string) => string;
    noBirth: (name: string) => string;
    beforeBirth: (name: string) => string;
    beforeYear: (name: string, year: string) => string;
    unwritten: (label: string, name: string) => string;
    unknown: (query: string) => string;
  };
  conviction: string;
  /**
   * The site's thesis, one discreet line under the conviction. Empty until
   * the operator fixes the wording: an empty line is not drawn.
   */
  thesis: string;
  invitationTitle: string;
  invitationBody: string;
  report: string;
  propose: string;
  nextTitle: string;
  nextRelation: {
    family: string;
    people: string;
    seed: { people: string; country: string };
  };
  seedReason: { people: string; country: string };
}

const about = aboutCopy.fr;

// @req REQ-198
export const nameClosingCopy: Record<Language, NameClosingCopy> = {
  fr: {
    sourcesEyebrow: "Les sources parlent",
    sourcesTitle: (name) => `Qui raconte le nom ${name} ?`,
    sourcesLead: (count, name) =>
      count === 1
        ? `Voici le récit du nom ${name}, rangé selon le type de source qui le rapporte.`
        : `Voici les ${count} récits du nom ${name}, rangés selon le type de source qui les rapporte. Une même source peut en appuyer plusieurs.`,
    sourcesStrip: "Types de sources",
    sourceCount: (count) => `${count} ${count === 1 ? "source" : "sources"}`,
    accountCount: (count) => `${count} ${count === 1 ? "récit" : "récits"}`,
    undated: "Date inconnue",
    closingTitle: "Ce que nous ne savons pas encore",
    silence: {
      noOral: (name) =>
        `Aucun récit transmis oralement n’est enregistré pour le nom ${name}.`,
      noBirth: (name) =>
        `L’origine du nom ${name} n’est pas datée dans le projet pour l’instant.`,
      beforeYear: (name, year) =>
        `Aucune trace du nom ${name} plus ancienne que ${year} n’est connue du projet.`,
      beforeBirth: (name) =>
        `Avant sa plus ancienne trace connue du projet, l’histoire du nom ${name} reste à écrire.`,
      unwritten: (label, name) =>
        `L’histoire du nom ${name} (${label.toLowerCase()}) n’est pas encore écrite.`,
      unknown: (query) =>
        `Aucune source sur le nom ${query} n’est enregistrée dans l’atlas.`,
    },
    conviction: about.conviction.paragraphs[0],
    thesis: "",
    // The about page's correction paragraph, split where the card breaks it.
    invitationTitle: about.correction.paragraphs[0].split(" ? ")[0] + " ?",
    invitationBody: `${about.correction.paragraphs[0].split(" ? ")[1]} ${about.correction.paragraphs[1]}`,
    report: "Signaler une erreur",
    propose: "Proposer une source",
    nextTitle: "Poursuivre avec un autre nom",
    nextRelation: {
      family: "Famille de langues",
      people: "Peuple",
      seed: { people: "Peuple", country: "Pays" },
    },
    seedReason: {
      people:
        "Un peuple dont nous retraçons le nom, ses origines et ses autres noms.",
      country:
        "Un pays dont nous retraçons le nom, ses origines et ses autres noms.",
    },
  },
};
