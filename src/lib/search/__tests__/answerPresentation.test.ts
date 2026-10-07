import { describe, expect, it } from "vitest";

import type { AnswerWhere } from "@/lib/search/answer";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import {
  presentAnswerWhere,
  reviewedAnswerSources,
} from "@/lib/search/answerPresentation";

const people = (id: string, name: string) => ({ id, name });

describe("presentAnswerWhere", () => {
  // @req REQ-178
  it("names the countries of a language from the reader's locale", () => {
    const where: AnswerWhere = {
      unit: "speakers",
      estimate: true,
      rows: [
        { countryId: "COD", value: 34_000_000 },
        { countryId: "COG", value: 4_500_000 },
      ],
    };

    const fr = presentAnswerWhere(where, [], "fr");
    expect(fr?.labels).toEqual({
      COD: "République démocratique du Congo",
      COG: "Congo-Brazzaville",
    });
    expect(fr?.where).toBe(where);

    expect(presentAnswerWhere(where, [], "en")?.labels).toEqual({
      COD: "Democratic Republic of the Congo",
      COG: "Congo - Brazzaville",
    });
  });

  // An identifier on screen is a defect, and so is a row quietly renamed to
  // something else: a row the page cannot name is left out, the others keep
  // the fiche's own figures.
  // @req REQ-178
  it("leaves out a row it cannot name instead of printing its identifier", () => {
    const where: AnswerWhere = {
      unit: "percent",
      estimate: true,
      rows: [
        { peopleId: "PPL_KONGO_BRAZZA", value: 40 },
        { peopleId: "PPL_UNNAMED", value: 5 },
      ],
      unsplitPercent: 55,
    };

    const shown = presentAnswerWhere(
      where,
      [people("PPL_KONGO_BRAZZA", "Kongo (Brazzaville)")],
      "fr"
    );

    expect(shown?.where.rows).toEqual([
      { peopleId: "PPL_KONGO_BRAZZA", value: 40 },
    ]);
    expect(shown?.labels).toEqual({ PPL_KONGO_BRAZZA: "Kongo (Brazzaville)" });
  });

  // « Teke, Mbochi, Nzebi… » was typed into the mockup; the page may name only
  // the peoples the fiche itself lists, and only those that have no share.
  // @req REQ-178
  it("names the listed peoples that carry no share, three at most", () => {
    const where: AnswerWhere = {
      unit: "percent",
      estimate: true,
      rows: [{ peopleId: "PPL_KONGO_BRAZZA", value: 40 }],
      unsplitPercent: 60,
    };

    const shown = presentAnswerWhere(
      where,
      [
        people("PPL_KONGO_BRAZZA", "Kongo (Brazzaville)"),
        people("PPL_TEKE", "Teke"),
        people("PPL_MBOCHI", "Mbochi"),
        people("PPL_VILI", "Vili"),
        people("PPL_SANGHA", "Sangha"),
      ],
      "fr"
    );

    expect(shown?.unsplitPeopleNames).toEqual(["Teke", "Mbochi", "Vili"]);
  });

  // @req REQ-178
  it("names no one when the fiche lists no people beyond the shares", () => {
    const where: AnswerWhere = {
      unit: "percent",
      estimate: true,
      rows: [{ peopleId: "PPL_KONGO_BRAZZA", value: 40 }],
      unsplitPercent: 60,
    };

    expect(
      presentAnswerWhere(
        where,
        [people("PPL_KONGO_BRAZZA", "Kongo (Brazzaville)")],
        "fr"
      )?.unsplitPeopleNames
    ).toBeUndefined();
  });

  // @req REQ-178
  it("draws no block when no row can be named", () => {
    expect(
      presentAnswerWhere(
        {
          unit: "percent",
          estimate: true,
          rows: [{ peopleId: "PPL_X", value: 10 }],
        },
        [],
        "fr"
      )
    ).toBeUndefined();
    expect(presentAnswerWhere(undefined, [], "fr")).toBeUndefined();
  });
});

describe("reviewedAnswerSources", () => {
  const evidence = (...ids: string[]) => ({
    assertion: {
      statement: "s",
      sourceCount: ids.length,
      lastHumanAuditAt: null,
    },
    sources: ids.map((id) => ({ id, title: id, tier: "referenced" as const })),
    standing: "referenced" as const,
  });
  const answer = (sources: NameAnswer["sources"]): NameAnswer => ({
    term: "Pygmée",
    subjects: [],
    paragraphs: ["Premier paragraphe.", "Second."],
    sources,
  });

  // One line says how many sources a reviewed answer rests on, so a source
  // cited under two sentences counts once.
  // @req REQ-178
  it("counts each source once however many sentences cite it", () => {
    const shown = reviewedAnswerSources(
      answer([evidence("a", "b"), evidence("b", "c")])
    );

    expect(shown.count).toBe(3);
    expect(shown.accounts).toHaveLength(1);
    expect(shown.accounts[0].evidence).toHaveLength(2);
  });

  // @req REQ-178
  it("has nothing to count when the answer cites no source", () => {
    expect(reviewedAnswerSources(answer([])).count).toBe(0);
  });
});
