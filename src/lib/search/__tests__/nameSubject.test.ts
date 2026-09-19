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

  // The product's whole premise: a reader arrives typing the name they know,
  // which is usually not the one the corpus filed the entry under. `Peul` is
  // an exonym of an entry whose `nameMain` is `Fula (Fulbe / Peul)`, and
  // matching that field alone left the most-searched name in French answering
  // with a bare result card. The form is compared whole — nothing is parsed
  // out of it — so a qualifier written inside a form never becomes a match.
  // @req REQ-178
  it("answers to a name the entry is known by, not only the one it is filed under", () => {
    const fula: SearchResult = {
      type: "people",
      id: "PPL_FULA",
      name: "Fula (Fulbe / Peul)",
      naming: {
        selfGiven: "Fulbe (pluriel), Pullo (singulier)",
        forms: [{ form: "Peul" }, { form: "Fulani" }],
        eras: [],
        presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
      },
    };

    expect(selectNameSubject([fula], "peul").map((e) => e.id)).toEqual([
      "PPL_FULA",
    ]);
    expect(selectNameSubject([fula], "Fulani").map((e) => e.id)).toEqual([
      "PPL_FULA",
    ]);
  });

  // @req REQ-178
  it("does not match a qualifier written inside a form", () => {
    const mande: SearchResult = {
      type: "people",
      id: "PPL_MANDE",
      name: "Mandé",
      naming: {
        forms: [{ form: "Mandingue (français colonial)" }],
        eras: [],
        presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
      },
    };

    expect(selectNameSubject([mande], "français colonial")).toEqual([]);
    expect(selectNameSubject([mande], "mandingue")).toEqual([]);
  });

  // Bassa is three peoples, filed « Bassa », « Bassa du Cameroun » and « Bassa
  // Nge ». Matching the filed name exactly found one and listed the other two as
  // ordinary results, so the page answered a question about three peoples as
  // if it concerned one. A name that begins with the searched word, as a word,
  // is a people answering to that name too — Bassari, which only begins with
  // the same letters, is not.
  // @req REQ-178
  it("asks which one when other entries of the same kind carry the name as their first word", () => {
    const subjects = selectNameSubject(
      [
        people("PPL_BASSA", "Bassa"),
        people("PPL_BASSA_CAM", "Bassa du Cameroun"),
        people("PPL_BASSA_NIGERIA", "Bassa Nge"),
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

  // A parenthesis marks a fiche split by country, not a second people: « Fang
  // (Gabon) » is the Fang. The page groups those at display, and counting them
  // as subjects would ask the reader to choose between a people and itself.
  // @req REQ-178
  it("does not treat a people's country split as another people", () => {
    const subjects = selectNameSubject(
      [people("PPL_FANG", "Fang"), people("PPL_FANG_GABON", "Fang (Gabon)")],
      "fang"
    );

    expect(subjects.map((entity) => entity.id)).toEqual(["PPL_FANG"]);
  });

  // `peopleGroupId` is the corpus declaring « these fiches are one people,
  // split » — the signal the result list already groups on. An entry that
  // shares it with the exact match is that people, whatever its filed name
  // looks like, and asking the reader to choose between them would contradict
  // the grouped card directly below.
  // @req REQ-178
  it("does not ask the reader to choose between fiches the corpus declares one people", () => {
    const kongo = (id: string, name: string): SearchResult => ({
      ...people(id, name),
      peopleGroupId: "PGRP_KONGO",
    });
    const subjects = selectNameSubject(
      [kongo("PPL_KONGO", "Kongo"), kongo("PPL_KONGO_SUD", "Kongo du Sud")],
      "kongo"
    );

    expect(subjects.map((entity) => entity.id)).toEqual(["PPL_KONGO"]);
  });

  // « mandé » answers exactly to the family; « Mande du Sud » is a people. A
  // widening across kinds would turn every family into a disambiguation with
  // the peoples named after it, which is a relation, not an ambiguity.
  // @req REQ-178
  it("widens only within the kind the exact match belongs to", () => {
    const subjects = selectNameSubject(
      [
        { type: "languageFamily", id: "FLG_MANDE", name: "Mandé" },
        people("PPL_MANDE_DU_SUD", "Mande du Sud"),
      ],
      "mandé"
    );

    expect(subjects.map((entity) => entity.id)).toEqual(["FLG_MANDE"]);
  });

  // With no exact match there is nothing to widen from: a query that names no
  // entry does not acquire subjects because longer names start with it.
  // @req REQ-178
  it("does not widen when nothing carries the name exactly", () => {
    expect(
      selectNameSubject([people("PPL_BASSA_CAM", "Bassa du Cameroun")], "bassa")
    ).toEqual([]);
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
