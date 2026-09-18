import { describe, expect, it } from "vitest";

import { selectNameSubject } from "@/lib/search/nameSubject";
import type { SearchResult } from "@/types/afrik-frontend";

const people = (id: string, name: string, relevance = 1): SearchResult => ({
  type: "people",
  id,
  name,
  relevance,
});

/**
 * The subject is the entity whose name was searched — not the entity a ranking
 * judged best. `selectPivot`, which this replaces, promoted a head result whose
 * relevance merely doubled the runner-up's; DEC-057 retires that, because a
 * page that crowns a name contradicts a doctrine saying none of them is the
 * right one.
 */

describe("the subject of a name search", () => {
  // @req REQ-178
  it("is the entity whose name is exactly what was typed", () => {
    const subjects = selectNameSubject(
      [people("PPL_FANG", "Fang"), people("PPL_FANTI", "Fanti")],
      "fang"
    );

    expect(subjects.map((entity) => entity.id)).toEqual(["PPL_FANG"]);
  });

  // Accents and case are spelling, not identity.
  // @req REQ-178
  it("folds accents and case", () => {
    expect(
      selectNameSubject([people("PPL_BETE", "Bété")], "BETE").map((e) => e.id)
    ).toEqual(["PPL_BETE"]);
  });

  // The clause DEC-057 retires: a head that merely won a close race was
  // promoted when its relevance doubled the runner-up's.
  // @req REQ-178
  it("promotes nothing on relevance alone, however far ahead the head is", () => {
    expect(
      selectNameSubject(
        [people("PPL_A", "Quelque chose", 100), people("PPL_B", "Autre", 1)],
        "quelq"
      )
    ).toEqual([]);
  });

  // Bassa: three unrelated peoples answer to the name. The old selector
  // returned null here and the page fell back to a flat list; the grammar
  // wants every one of them, so the reader chooses.
  // @req REQ-178
  it("returns every entity that answers to the name, so none is chosen for the reader", () => {
    const subjects = selectNameSubject(
      [
        people("PPL_BASSA", "Bassa"),
        people("PPL_BASSA_CAM", "Bassa"),
        people("PPL_BASSA_NIGERIA", "Bassa"),
        people("PPL_BASSARI", "Bassari"),
      ],
      "bassa"
    );

    expect(subjects.map((entity) => entity.id)).toEqual([
      "PPL_BASSA",
      "PPL_BASSA_CAM",
      "PPL_BASSA_NIGERIA",
    ]);
  });

  // A people and the language it speaks share a name routinely — one referent
  // on two axes, not an ambiguity. Both are subjects of the same question.
  // @req REQ-178
  it("keeps a people and its language together rather than treating them as rivals", () => {
    const subjects = selectNameSubject(
      [
        people("PPL_BAMBARA", "Bambara"),
        { type: "language", id: "bam", name: "Bambara" },
      ],
      "bambara"
    );

    expect(subjects).toHaveLength(2);
  });

  // @req REQ-178
  it("has no subject when nothing carries the name", () => {
    expect(selectNameSubject([people("PPL_FANG", "Fang")], "kirdi")).toEqual(
      []
    );
    expect(selectNameSubject([], "fang")).toEqual([]);
    expect(selectNameSubject([people("PPL_FANG", "Fang")], "  ")).toEqual([]);
  });
});
