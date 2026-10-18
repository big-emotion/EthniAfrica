import { describe, expect, it } from "vitest";

import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";

const copy = searchFeedCopy.fr.answer;

// French typography puts a space before « ? », « : », « ; » and « ! » and
// inside the guillemets. An ordinary space there lets the sign wrap alone onto
// the next line when the text is enlarged (seen at 200 % on the 430 board).
const BREAKABLE_SPACE = / [?:;!»]|« /;

// The words a misspelling page says, as it says them for one choice and for
// several (brief 16).
function misspellingSentences(): string[] {
  return [
    copy.typo,
    copy.typoSummary("tchikaya", ["Tchicaya"]),
    copy.typoSummary("pigmée", ["Aka", "Twa"]),
    copy.typoChoices(1),
    copy.typoChoices(2),
    copy.typoInvitation("tchikaya"),
    copy.fichesFound.title(1),
    copy.fichesFound.title(2),
    copy.fichesFound.note(1),
    copy.fichesFound.note(2),
  ];
}

// @req REQ-125
describe("the words of a misspelling page", () => {
  // One lead is the usual case (DEC-075: first letter kept, 0.4 at least):
  // asking the reader to « choose one of them » over a single name read as
  // if the screen had lost the others.
  // @req REQ-125
  it("names the one nearest name in the singular", () => {
    expect(copy.typoSummary("tchikaya", ["Tchicaya"])).toBe(
      "Aucune fiche ne porte exactement le nom « tchikaya ». Le nom le plus proche est Tchicaya : choisissez-le pour lire son histoire."
    );
    expect(copy.typoChoices(1)).toBe("Le nom le plus proche");
  });

  // @req REQ-125
  it("speaks of several nearest names in the plural", () => {
    expect(copy.typoSummary("pigmée", ["Aka", "Twa"])).toBe(
      "Aucune fiche ne porte exactement le nom « pigmée ». Voici les noms les plus proches : choisissez-en un pour lire son histoire."
    );
    expect(copy.typoChoices(2)).toBe("Les noms les plus proches");
  });

  // « Aucun nom ne correspond » said no name matched at all, while people
  // bear the spelling Tchikaya: the page can only speak of its own fiches.
  // @req REQ-125
  it("says only what the search can know: no fiche bears the name", () => {
    for (const text of misspellingSentences()) {
      expect(text, text).not.toMatch(/Aucun nom ne correspond/);
    }
    expect(copy.typoSummary("tchikaya", ["Tchicaya"])).toMatch(
      /^Aucune fiche ne porte exactement le nom /
    );
  });

  // A reader whose family writes the searched spelling can say so, as on
  // the unknown-name page (brief 12): a sourced spelling restores the name.
  // @req REQ-125
  it("asks a reader who writes the name this way where the spelling comes from", () => {
    expect(copy.typoInvitation("tchikaya")).toBe(
      "Vous écrivez ce nom « tchikaya » ? Dites-nous d’où vient cette écriture."
    );
  });

  // @req REQ-180
  it("keeps the signs of every sentence on the line of their word", () => {
    for (const text of misspellingSentences()) {
      expect(text, text).not.toMatch(BREAKABLE_SPACE);
    }
  });
});

// @req REQ-180
describe("the fiches a misspelling's search found", () => {
  // The block is titled by what it is, and keeps the caution the related-only
  // page opens on, in the number of the cards it lists.
  // @req REQ-180
  it("titles the block by what it holds and opens it on the related-only caution", () => {
    expect(copy.fichesFound.title(1)).toBe("La fiche trouvée");
    expect(copy.fichesFound.title(3)).toBe("Les fiches trouvées");
    expect(copy.fichesFound.note(3)).toBe(copy.relatedOnly);
    expect(copy.fichesFound.note(1)).toBe(
      "Nous avons trouvé une fiche liée sans établir qu’elle répond à ce nom."
    );
  });
});
