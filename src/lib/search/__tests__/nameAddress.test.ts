import { describe, expect, it } from "vitest";

import {
  addressedHistoryNames,
  buildNameAddressDirectory,
  foldNameForm,
  addressSpellingOf,
} from "@/lib/search/nameAddress";

/** A name of a history, with one account per tier list. */
function told(nameText: string, ...accounts: string[][]) {
  return {
    nameText,
    accounts: accounts.map((tiers) => ({
      sources: tiers.map((tier) => ({ tier })),
    })),
  };
}

describe("the accent fold of an address", () => {
  // @req REQ-200
  it("folds accents and case, never a letter", () => {
    expect(foldNameForm("Traoré")).toBe("traore");
    expect(foldNameForm("TRAORE")).toBe("traore");
    // ɓ, ɛ and ŋ are letters of the names: folding them would make Fulɓe
    // and Fulbe one address.
    expect(foldNameForm("Fulɓe")).toBe("fulɓe");
    expect(foldNameForm("FULƁE")).toBe("fulɓe");
    expect(foldNameForm("Ɛʋɛ")).toBe("ɛʋɛ");
    expect(foldNameForm("Ŋgambay")).toBe("ŋgambay");
  });
});

describe("the names of a history that have an address", () => {
  // Every name a history tells is an exact answer (ETNI-2093), so each one
  // that meets the crawler threshold is addressed, spelt as the history
  // spells it: « Fulɓe » on the fiche filed « Peul ».
  // @req REQ-200
  it("are every name one of whose accounts cites a source above unverified, in history order", () => {
    const history = {
      names: [
        told("Fulɓe", ["referenced"]),
        told("Peul", ["official"]),
        told("Fellata", ["unverified"], ["unverified"]),
        told("Pullo", ["unverified"], ["unverified", "official"]),
      ],
    };

    expect(addressedHistoryNames(history)).toEqual(["Fulɓe", "Peul", "Pullo"]);
  });

  // @req REQ-200
  it("are the history's own spellings, never the filed name's", () => {
    const history = {
      names: [told("Traoré", ["referenced"]), told("Tarawele", ["official"])],
    };

    expect(addressedHistoryNames(history)).toEqual(["Traoré", "Tarawele"]);
  });

  // @req REQ-200
  it("are none without a history, or when no account cites above unverified", () => {
    expect(addressedHistoryNames(null)).toEqual([]);
    expect(addressedHistoryNames({ names: [] })).toEqual([]);
    expect(
      addressedHistoryNames({ names: [told("Bangala", ["unverified"])] })
    ).toEqual([]);
  });
});

describe("the directory of addresses", () => {
  // @req REQ-200
  it("holds one spelling per folded form", () => {
    const directory = buildNameAddressDirectory([
      "Lingala",
      "lingala",
      "Traore",
      "Traoré",
      "Fulɓe",
      "Fulbe",
    ]);

    expect([...directory.values()].sort()).toEqual(
      ["Fulbe", "Fulɓe", "Lingala", "Traoré"].sort()
    );
  });

  // Page, sitemap and links must agree on one spelling whichever order the
  // corpus hands them in: the more accented writing wins.
  // @req REQ-200
  it("chooses the same spelling whatever the order", () => {
    expect(
      addressSpellingOf(
        buildNameAddressDirectory(["Traore", "Traoré"]),
        "TRAORE"
      )
    ).toBe("Traoré");
    expect(
      addressSpellingOf(
        buildNameAddressDirectory(["Traoré", "Traore"]),
        "traore"
      )
    ).toBe("Traoré");
    expect(
      addressSpellingOf(
        buildNameAddressDirectory(["lingala", "Lingala"]),
        "LINGALA"
      )
    ).toBe(
      addressSpellingOf(
        buildNameAddressDirectory(["Lingala", "lingala"]),
        "LINGALA"
      )
    );
  });

  // @req REQ-200
  it("answers nothing for a form it does not hold", () => {
    const directory = buildNameAddressDirectory(["Fulɓe"]);

    expect(addressSpellingOf(directory, "fulbe")).toBeUndefined();
    expect(addressSpellingOf(directory, "")).toBeUndefined();
  });
});
