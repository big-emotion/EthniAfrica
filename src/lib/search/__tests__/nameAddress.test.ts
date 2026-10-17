import { describe, expect, it } from "vitest";

import {
  buildNameAddressDirectory,
  foldNameForm,
  historyAddressSpelling,
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

describe("the spelling a history gives an answered form", () => {
  // @req REQ-200
  it("is the history's own spelling of that form", () => {
    const history = {
      names: [told("Traoré", ["referenced"]), told("Tarawele", ["official"])],
    };

    expect(historyAddressSpelling(history, "Traore")).toBe("Traoré");
  });

  // @req REQ-200
  it("needs one account of that form citing a source above unverified", () => {
    const history = {
      names: [
        told("Lingala", ["unverified"], ["unverified", "unverified"]),
        told("Bangala", ["official"]),
      ],
    };

    expect(historyAddressSpelling(history, "Lingala")).toBeUndefined();
    expect(
      historyAddressSpelling(
        {
          names: [told("Lingala", ["unverified"], ["unverified", "official"])],
        },
        "lingala"
      )
    ).toBe("Lingala");
  });

  // @req REQ-200
  it("gives nothing for a form the history does not tell", () => {
    expect(
      historyAddressSpelling({ names: [told("Peul", ["official"])] }, "Fulbe")
    ).toBeUndefined();
    expect(historyAddressSpelling(null, "Peul")).toBeUndefined();
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
