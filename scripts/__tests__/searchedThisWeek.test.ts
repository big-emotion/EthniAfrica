// @req REQ-200
import { describe, expect, it } from "vitest";
import { nameSearchHref } from "@/lib/search/nameAddress";
import {
  filterSearchedThisWeek,
  placeSubjectsFromFiche,
} from "../lib/searchedThisWeek";

describe("filterSearchedThisWeek", () => {
  // @req REQ-200
  it("keeps exact forms with at least three visitors and returns at most six", () => {
    const subjects = Array.from({ length: 8 }, (_, index) => ({
      form: `Name ${index}`,
      subject: { type: "people", id: `PPL_${index}` },
      summary: `Name ${index} summary. Second sentence.`,
      href: nameSearchHref("fr", `Name ${index}`),
    }));
    const rows = [
      ...subjects.map((subject, index) => ({
        name: subject.form.toLocaleLowerCase("fr"),
        visitors: 9 - index,
      })),
      { name: "Below threshold", visitors: 2 },
      { name: "Unknown alias", visitors: 10 },
    ];

    expect(filterSearchedThisWeek(rows, subjects)).toEqual(
      subjects.slice(0, 6).map(({ form, subject, href }) => ({
        form,
        subject,
        summary: form + " summary.",
        href,
      }))
    );
  });

  // @req REQ-200
  it("allows an empty result", () => {
    expect(filterSearchedThisWeek([], [])).toEqual([]);
  });

  // @req REQ-200
  it("includes a place's exact name and extracts its top-level summary", () => {
    const subjects = placeSubjectsFromFiche({
      id: "LOC_YAMOUSSOUKRO",
      nameMain: "Yamoussoukro",
      summary: "Capitale politique de la Côte d'Ivoire. Les récits divergent.",
    });

    expect(
      filterSearchedThisWeek([{ name: "yamoussoukro", visitors: 3 }], subjects)
    ).toEqual([
      {
        form: "Yamoussoukro",
        subject: { type: "place", id: "LOC_YAMOUSSOUKRO" },
        summary: "Capitale politique de la Côte d'Ivoire.",
        href: nameSearchHref("fr", "Yamoussoukro"),
      },
    ]);
  });
});
