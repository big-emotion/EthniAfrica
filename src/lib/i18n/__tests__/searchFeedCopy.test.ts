import { describe, expect, it } from "vitest";

import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";

const copy = searchFeedCopy.fr.answer;

// French typography puts a space before « ? », « : », « ; » and « ! » and
// inside the guillemets. An ordinary space there lets the sign wrap alone onto
// the next line when the text is enlarged (seen at 200 % on the 430 board).
const BREAKABLE_SPACE = / [?:;!»]|« /;

// The words a misspelling page says, as it says them for one choice and for
// several (brief 16). « sanoh » is Main's example: two family names begin
// like it, and the search also finds the Kuranko fiche.
function misspellingSentences(): string[] {
  return [
    copy.typo,
    copy.typoSummary("tchikaya", ["Tchicaya"]),
    copy.typoSummary("sanoh", ["Sanogo", "Sanou"]),
    copy.typoChoices(1),
    copy.typoChoices(2),
    copy.typoInvitation("tchikaya"),
    copy.fichesFound.title(1),
    copy.fichesFound.title(2),
    copy.fichesFound.note(1, "sanoh"),
    copy.fichesFound.note(2, "sanoh"),
  ];
}

// @req REQ-125
describe("the words of a misspelling page", () => {
  // One lead is the usual case (DEC-075: first letter kept, 0.4 at least):
  // asking the reader to « choose one of them » over a single name read as
  // if the screen had lost the others.
  // @req REQ-125
  it("names the one choice in the singular", () => {
    expect(copy.typoSummary("tchikaya", ["Tchicaya"])).toBe(
      "Aucune de nos fiches ne porte le nom «\u00a0tchikaya\u00a0». Tchicaya s’écrit presque de la même façon\u00a0: vous pouvez chercher ce nom."
    );
    expect(copy.typoChoices(1)).toBe(
      "Un nom qui s’écrit presque de la même façon"
    );
  });

  // @req REQ-125
  it("speaks of several choices in the plural", () => {
    expect(copy.typoSummary("sanoh", ["Sanogo", "Sanou"])).toBe(
      "Aucune de nos fiches ne porte le nom «\u00a0sanoh\u00a0». Plusieurs noms s’écrivent presque de la même façon\u00a0: choisissez celui que vous cherchez."
    );
    expect(copy.typoChoices(2)).toBe(
      "Des noms qui s’écrivent presque de la même façon"
    );
  });

  // « Aucun nom ne correspond » said no name matched at all, while people
  // bear the spelling Tchikaya: the page can only speak of its own fiches.
  // @req REQ-125
  it("says only what the search can know: none of our fiches bears the name", () => {
    for (const text of misspellingSentences()) {
      expect(text, text).not.toMatch(/Aucun nom ne correspond/);
    }
    expect(copy.typoSummary("tchikaya", ["Tchicaya"])).toMatch(
      /^Aucune de nos fiches ne porte le nom /
    );
  });

  // On this site « proche » names a recorded variant: the Tchicaya fiche
  // calls Tschikaya « une forme proche de Tchicaya ». Said of a lead, it
  // presented « tchikaya » as a spelling of Tchicaya, which DEC-075 does not
  // record. A lead is only written almost the same way.
  // @req REQ-125
  it("never calls a lead a near form of the searched name", () => {
    for (const text of misspellingSentences()) {
      expect(text, text).not.toMatch(/proche/);
    }
  });

  // Under the chip, « ce nom » read as the lead: « do you spell Tchicaya
  // tchikaya? ». The invitation and the caution name the searched spelling.
  // @req REQ-125
  it("names the searched spelling wherever « ce nom » could be read as the lead", () => {
    for (const text of [
      copy.typoInvitation("tchikaya"),
      copy.fichesFound.note(1, "tchikaya"),
      copy.fichesFound.note(2, "tchikaya"),
    ]) {
      expect(text, text).not.toMatch(/ce nom/);
      expect(text, text).toContain("«\u00a0tchikaya\u00a0»");
    }
  });

  // A reader whose family writes the searched spelling can say so, as on
  // the unknown-name page (brief 12): a sourced spelling restores the name.
  // @req REQ-125
  it("asks a reader who writes the name this way where the spelling is used", () => {
    expect(copy.typoInvitation("tchikaya")).toBe(
      "Si vous écrivez «\u00a0tchikaya\u00a0», dites-nous où cette écriture est employée."
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
  // page opens on, in the number of the cards it lists. It names the spelling
  // the reader typed: under the choices, « ce nom » read as the lead.
  // @req REQ-180
  it("titles the block by what it holds and opens it on the related-only caution", () => {
    expect(copy.fichesFound.title(1)).toBe("La fiche trouvée");
    expect(copy.fichesFound.title(3)).toBe("Les fiches trouvées");
    expect(copy.fichesFound.note(1, "sanoh")).toBe(
      "Nous avons trouvé une fiche liée sans établir qu’elle répond à «\u00a0sanoh\u00a0»."
    );
    expect(copy.fichesFound.note(3, "sanoh")).toBe(
      "Nous avons trouvé des fiches liées sans établir qu’elles répondent à «\u00a0sanoh\u00a0»."
    );
  });
});
