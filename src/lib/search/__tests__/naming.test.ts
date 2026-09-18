import { describe, expect, it } from "vitest";

import { readNaming } from "@/lib/search/naming";

/**
 * Five classes store their naming under five different keys, and the result
 * page has one promise to keep. These assert that each reader returns the same
 * shape — and, twice over, that the reader does not improve on the corpus:
 * a qualifier is never parsed out of a form, and an absent field stays absent.
 */

describe("the naming projection", () => {
  // @req REQ-044
  it("reads a people from content.appellations", () => {
    const naming = readNaming("people", {
      appellations: {
        selfAppellation: "Fang (prononcé fàŋ)",
        exonyms: ["Pahouin", "Pangwe", "Pamue"],
        originOfExonyms: "Les trois noms européens viennent d'un même mot.",
        whyProblematic: "Pahouin est parfois tenu pour péjoratif.",
        contemporaryUsage: "Fang est la forme en usage.",
      },
    });

    expect(naming.selfGiven).toBe("Fang (prononcé fàŋ)");
    expect(naming.forms.map((form) => form.form)).toEqual([
      "Pahouin",
      "Pangwe",
      "Pamue",
    ]);
    expect(naming.origin).toContain("même mot");
    expect(naming.problem).toContain("péjoratif");
    expect(naming.usageToday).toContain("en usage");
    expect(naming.eras).toEqual([]);
  });

  // 75.4 % of the corpus's 3 127 exonyms are bare forms, and the quarter that
  // are not carry their qualifier inside the string in 677 distinct free-text
  // values. Splitting on the parenthesis would publish those values as if they
  // were a controlled vocabulary.
  // @req REQ-044
  it("never parses a qualifier out of the form", () => {
    const naming = readNaming("people", {
      appellations: { exonyms: ["Mandingue (français colonial)"] },
    });

    expect(naming.forms[0].form).toBe("Mandingue (français colonial)");
    expect(naming.forms[0].qualifier).toBeUndefined();
  });

  // @req REQ-044
  it("reads a country's six eras, which is the only class that dates its names", () => {
    const naming = readNaming(
      "country",
      {
        historicalNames: {
          antiquity: "Nom antique",
          colonization: "Nom colonial",
          contemporary: "Nom actuel",
        },
      },
      { etymology: "Du portugais.", nameOriginActor: "Les navigateurs." }
    );

    expect(naming.origin).toContain("portugais");
    expect(naming.eras.map((era) => era.era)).toEqual([
      "antiquity",
      "colonization",
      "contemporary",
    ]);
    expect(naming.eras[0].text).toBe("Nom antique");
  });

  // @req REQ-044
  it("reads a family from content.decolonialHeader", () => {
    const naming = readNaming("languageFamily", {
      decolonialHeader: {
        selfAppellation: "Ce qu'elle se donne",
        historicalAppellations: ["Hamito-sémitique"],
        originOfHistoricalTerm: "Forgé au XIXe siècle.",
        whyProblematic: "Le terme porte une hiérarchie.",
        contemporaryUsage: "Afro-asiatique aujourd'hui.",
      },
    });

    expect(naming.selfGiven).toBe("Ce qu'elle se donne");
    expect(naming.forms.map((form) => form.form)).toEqual(["Hamito-sémitique"]);
    expect(naming.origin).toContain("XIXe");
  });

  // The one class whose model already carries what the page wants: a form with
  // its own attestations and its own sources.
  // @req REQ-044
  it("reads a patronyme's spellings with where each is attested", () => {
    const naming = readNaming(
      "patronyme",
      {},
      {
        spellings: [
          { spelling: "Ababda", attestations: [{ countryId: "EGY" }] },
          {
            spelling: "Ababdeh",
            attestations: [{ countryId: "EGY" }, { countryId: "SDN" }],
          },
        ],
        origin: {
          writtenChronicles: [{ claim: "Barnard reproduit la forme." }],
        },
      }
    );

    expect(naming.forms.map((form) => form.form)).toEqual([
      "Ababda",
      "Ababdeh",
    ]);
    expect(naming.forms[1].attestedIn).toEqual(["EGY", "SDN"]);
    expect(naming.origin).toContain("Barnard");
  });

  // @req REQ-044
  it("reads a language's alternate names, and finds no origin because none exists", () => {
    const naming = readNaming(
      "language",
      {},
      {
        alternateNames: ["Dho Alur", "Aloro"],
      }
    );

    expect(naming.forms.map((form) => form.form)).toEqual([
      "Dho Alur",
      "Aloro",
    ]);
    expect(naming.origin).toBeUndefined();
  });

  // A class with nothing to say returns the empty shape rather than undefined,
  // so the page's conditions are field checks and never null guards.
  // @req REQ-044
  it("returns the empty shape for a class that carries no naming", () => {
    const naming = readNaming("place", {}, {});

    expect(naming.forms).toEqual([]);
    expect(naming.eras).toEqual([]);
    expect(naming.selfGiven).toBeUndefined();
  });
});
