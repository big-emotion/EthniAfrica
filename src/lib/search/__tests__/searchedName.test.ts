import { describe, expect, it } from "vitest";

import {
  answersToSearch,
  orderForSearch,
  searchedAmong,
  searchedFormIn,
  selfNameLead,
} from "@/lib/search/searchedName";

type Name = { form: string; selfGiven: boolean | null };

const fulbe: Name[] = [
  { form: "Fulɓe · Pullo", selfGiven: true },
  { form: "Fulani", selfGiven: false },
  { form: "Peul", selfGiven: false },
  { form: "Fellata", selfGiven: false },
];

// @req REQ-178
describe("answersToSearch", () => {
  it("matches any part of a joined form, regardless of case and accents", () => {
    expect(answersToSearch("Fulɓe · Pullo", "PULLO")).toBe(true);
    expect(answersToSearch("Peul", "peul")).toBe(true);
    expect(answersToSearch("Peul", "Peulh")).toBe(false);
  });

  // @req REQ-178
  it("reads a self-appellation written as prose with parentheses", () => {
    expect(answersToSearch("Fulbe (pluriel), Pullo (singulier)", "fulbe")).toBe(
      true
    );
  });

  // @req REQ-135
  it("reaches a form typed without its letters, by the shared fold", () => {
    expect(answersToSearch("Fulɓe · Pullo", "Fulbe")).toBe(true);
    expect(answersToSearch("Wɛɛmɛɛbo", "weemeebo")).toBe(true);
    expect(
      answersToSearch("Al-ʿarabiyya al-fuṣḥā", "Al-arabiyya al-fusha")
    ).toBe(true);
  });

  // @req REQ-178
  it("matches nothing when nothing was searched", () => {
    expect(answersToSearch("Peul", undefined)).toBe(false);
    expect(answersToSearch("Peul", "  ")).toBe(false);
  });
});

// @req REQ-178
describe("orderForSearch", () => {
  const byForm = (searched: string) => (name: Name) =>
    answersToSearch(name.form, searched);

  // @req REQ-178
  it("puts the searched form first, the self-given one right after, the rest in order", () => {
    expect(
      orderForSearch(fulbe, byForm("peul")).map(({ form }) => form)
    ).toEqual(["Peul", "Fulɓe · Pullo", "Fulani", "Fellata"]);
  });

  // @req REQ-135
  it("leads with a form the reader typed without its letters, and promotes none for carrying one", () => {
    const names: Name[] = [
      { form: "Pullo", selfGiven: true },
      { form: "Peul", selfGiven: false },
      { form: "Fulɓe", selfGiven: false },
    ];

    expect(
      orderForSearch(names, byForm("Fulbe")).map(({ form }) => form)
    ).toEqual(["Fulɓe", "Pullo", "Peul"]);
    expect(
      orderForSearch(names, byForm("Peul")).map(({ form }) => form)
    ).toEqual(["Peul", "Pullo", "Fulɓe"]);
  });

  // @req REQ-178
  it("changes nothing when the searched form is the self-given one", () => {
    expect(orderForSearch(fulbe, byForm("pullo"))).toEqual(fulbe);
  });

  // @req REQ-178
  it("keeps the self-given form first when no form answers to the search", () => {
    const filedFirst = [fulbe[1], fulbe[0], fulbe[2]];
    expect(
      orderForSearch(filedFirst, byForm("mbororo")).map(({ form }) => form)
    ).toEqual(["Fulɓe · Pullo", "Fulani", "Peul"]);
  });
});

// @req REQ-178
describe("selfNameLead", () => {
  it("leads from the searched exonym to the self-given name", () => {
    expect(selfNameLead(fulbe, " Peul ")).toEqual({
      searched: "Peul",
      self: "Fulɓe · Pullo",
    });
  });

  // @req REQ-178
  it("offers no lead when the reader searched the self-given name", () => {
    expect(selfNameLead(fulbe, "Fulɓe")).toBeUndefined();
  });

  // @req REQ-178
  it("offers no lead when the fiche records no self-given name", () => {
    expect(
      selfNameLead([{ form: "Lingala", selfGiven: null }], "ngala")
    ).toBeUndefined();
  });

  // @req REQ-178
  it("offers no lead without a query", () => {
    expect(selfNameLead(fulbe, "")).toBeUndefined();
  });

  // PPL_KONO gives itself « Kono » and is called « Kɔnɔ » by others. The fold
  // equates the two, but a reader who typed « Kɔnɔ » searched the other name,
  // so the page still leads to the self-name (doctrine §1.1).
  // @req REQ-178
  it("leads to the self-name the fold equates with a spelling the subject writes apart", () => {
    const kono: Name[] = [
      { form: "Kono", selfGiven: true },
      { form: "Konnoh", selfGiven: null },
      { form: "Kɔnɔ", selfGiven: null },
    ];

    expect(selfNameLead(kono, "Kɔnɔ")).toEqual({
      searched: "Kɔnɔ",
      self: "Kono",
    });
  });

  // @req REQ-178
  it("offers no lead when the fold reaches the self-name from a spelling the subject does not write", () => {
    const fula: Name[] = [
      { form: "Fulɓe", selfGiven: true },
      { form: "Peul", selfGiven: false },
    ];

    expect(selfNameLead(fula, "Fulbe")).toBeUndefined();
  });
});

// The fold lets « Kono » reach « Kɔnɔ » (REQ-135); it must not make « Kɔnɔ »
// the reader's search on a fiche that also writes « Kono ».
// @req REQ-135
describe("searchedAmong", () => {
  // @req REQ-135
  it("marks the spelling typed, not a spelling the fold equates with it", () => {
    const kono = ["Kono", "Konnoh", "Kɔnɔ"];
    expect(kono.filter(searchedAmong(kono, "Kono"))).toEqual(["Kono"]);
    expect(kono.filter(searchedAmong(kono, "kɔnɔ"))).toEqual(["Kɔnɔ"]);

    const jaali = ["al-Jaʿali", "Jaali", "Al-Jaali"];
    expect(jaali.filter(searchedAmong(jaali, "Al-Jaali"))).toEqual([
      "Al-Jaali",
    ]);
  });

  // @req REQ-135
  it("reaches a form by the fold when the subject writes none spelt as typed", () => {
    const fula = ["Pullo", "Peul", "Fulɓe"];
    expect(fula.filter(searchedAmong(fula, "Fulbe"))).toEqual(["Fulɓe"]);
    expect(fula.filter(searchedAmong(fula, "FULƁE"))).toEqual(["Fulɓe"]);
  });

  // @req REQ-135
  it("still ignores accents and case in the spelling typed", () => {
    const larteh = ["Lɛtɛ", "Lete", "Late"];
    expect(larteh.filter(searchedAmong(larteh, "LÉTE"))).toEqual(["Lete"]);
  });

  // @req REQ-135
  it("marks nothing when nothing was searched", () => {
    const kono = ["Kono", "Kɔnɔ"];
    expect(kono.filter(searchedAmong(kono))).toEqual([]);
  });
});

// @req REQ-135
describe("searchedFormIn", () => {
  // @req REQ-135
  it("titles the page with the spelling typed before one only the fold reaches", () => {
    expect(searchedFormIn([{ form: "Kɔnɔ" }, { form: "Kono" }], "kono")).toBe(
      "Kono"
    );
    expect(searchedFormIn([{ form: "Kɔnɔ" }], "kono")).toBe("Kɔnɔ");
  });
});
