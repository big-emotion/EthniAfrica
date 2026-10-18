import { describe, expect, it } from "vitest";

import {
  answersToSearch,
  orderForSearch,
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
});
