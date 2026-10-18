import { describe, expect, it } from "vitest";

import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";

const copy = searchFeedCopy.fr.answer;

// French typography puts a space before « ? », « : », « ; » and « ! » and
// inside the guillemets. An ordinary space there lets the sign wrap alone onto
// the next line when the text is enlarged (seen at 200 % on the 430 board).
const BREAKABLE_SPACE = / [?:;!»]|« /;

// The words a misspelling page says, as it says them for one choice and for
// several (brief 16). « konana » is Main's example: two family names begin
// like it, and the search also finds Onana by its spelling. « felata » is a
// people lead, which is not said to be written the same way.
function misspellingSentences(): string[] {
  return [
    copy.typo,
    copy.typoWrittenAlike.summary("tchikaya", ["Tchicaya"]),
    copy.typoWrittenAlike.summary("konana", ["Konan", "Konaté"]),
    copy.typoWrittenAlike.heading(1),
    copy.typoWrittenAlike.heading(2),
    copy.typoResembling.summary("felata", 1),
    copy.typoResembling.summary("felata", 2),
    copy.typoResembling.heading(1),
    copy.typoResembling.heading(2),
    copy.typoFormOf.familyName("Jara", "Diarra"),
    copy.typoFormOf.other("Fellata", "Peul"),
    copy.typoInvitation("tchikaya"),
    copy.fichesFound.title(1),
    copy.fichesFound.title(2),
    copy.fichesFound.note(1, "konana"),
    copy.fichesFound.note(2, "konana"),
  ];
}

// @req REQ-125
describe("the words of a misspelling page", () => {
  // One lead is the usual case (DEC-075: first letter kept, 0.4 at least):
  // asking the reader to « choose one of them » over a single name read as
  // if the screen had lost the others.
  // @req REQ-125
  it("names the one choice in the singular", () => {
    expect(copy.typoWrittenAlike.summary("tchikaya", ["Tchicaya"])).toBe(
      "Aucune de nos fiches ne porte le nom « tchikaya ». Tchicaya s’écrit presque de la même façon : vous pouvez chercher ce nom."
    );
    expect(copy.typoWrittenAlike.heading(1)).toBe(
      "Un nom qui s’écrit presque de la même façon"
    );
  });

  // @req REQ-125
  it("speaks of several choices in the plural", () => {
    expect(copy.typoWrittenAlike.summary("konana", ["Konan", "Konaté"])).toBe(
      "Aucune de nos fiches ne porte le nom « konana ». Plusieurs noms s’écrivent presque de la même façon : choisissez celui que vous cherchez."
    );
    expect(copy.typoWrittenAlike.heading(2)).toBe(
      "Des noms qui s’écrivent presque de la même façon"
    );
  });

  // A people, a country or a family is a lead at 0.2, with no first-letter
  // rule: names that may share only a syllable. Nothing says they are
  // written the same way, only that they resemble the name searched.
  // @req REQ-125
  it("makes no spelling claim for the other choices, in the right number", () => {
    expect(copy.typoResembling.summary("felata", 1)).toBe(
      "Aucune de nos fiches ne porte le nom « felata ». Nous connaissons un nom qui ressemble à celui-ci : vous pouvez le chercher."
    );
    expect(copy.typoResembling.summary("felata", 2)).toBe(
      "Aucune de nos fiches ne porte le nom « felata ». Nous connaissons des noms qui ressemblent à celui-ci : choisissez celui que vous cherchez."
    );
    expect(copy.typoResembling.heading(1)).toBe(
      "Un nom qui ressemble au nom cherché"
    );
    expect(copy.typoResembling.heading(2)).toBe(
      "Des noms qui ressemblent au nom cherché"
    );
    for (const text of [
      copy.typoResembling.summary("felata", 1),
      copy.typoResembling.summary("felata", 2),
      copy.typoResembling.heading(1),
      copy.typoResembling.heading(2),
    ]) {
      expect(text, text).not.toMatch(/s’écri/);
    }
  });

  // The chip names the form that scored. When it is not the fiche's filed
  // name, a line says only what the data says, which fiche records it. It
  // never ranks one form under another (doctrine §1: none is crowned): « Jara
  // est une écriture du nom Diarra » set the Bambara writing under the filed
  // name, and a fiche does not « bear » names.
  // @req REQ-125
  it("says which fiche records a form that is not its filed name, without ranking the forms", () => {
    expect(copy.typoFormOf.familyName("Jara", "Diarra")).toBe(
      "La fiche Diarra donne aussi l’écriture Jara."
    );
    expect(copy.typoFormOf.other("Fellata", "Peul")).toBe(
      "La fiche Peul donne aussi le nom Fellata."
    );
  });

  // « Aucun nom ne correspond » said no name matched at all, while people
  // bear the spelling Tchikaya: the page can only speak of its own fiches.
  // @req REQ-125
  it("says only what the search can know: none of our fiches bears the name", () => {
    for (const text of misspellingSentences()) {
      expect(text, text).not.toMatch(/Aucun nom ne correspond/);
    }
    expect(copy.typoWrittenAlike.summary("tchikaya", ["Tchicaya"])).toMatch(
      /^Aucune de nos fiches ne porte le nom /
    );
    expect(copy.typoResembling.summary("felata", 1)).toMatch(
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
      expect(text, text).toContain("« tchikaya »");
    }
  });

  // A reader whose family writes the searched spelling can say so, as on
  // the unknown-name page (brief 12): a sourced spelling restores the name.
  // @req REQ-125
  it("asks a reader who writes the name this way where the spelling is used", () => {
    expect(copy.typoInvitation("tchikaya")).toBe(
      "Si vous écrivez « tchikaya », dites-nous où cette écriture est employée."
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
    expect(copy.fichesFound.note(1, "konana")).toBe(
      "Nous avons trouvé une fiche liée sans établir qu’elle répond à « konana »."
    );
    expect(copy.fichesFound.note(3, "konana")).toBe(
      "Nous avons trouvé des fiches liées sans établir qu’elles répondent à « konana »."
    );
  });
});
