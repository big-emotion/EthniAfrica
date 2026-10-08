import { describe, expect, it } from "vitest";

import {
  searchAnswerSentenceProblems,
  type AnswerWhere,
  type SearchAnswer,
} from "../answer";
import {
  ANSWER_FIXTURES,
  ANSWER_FIXTURE_CASES,
} from "../__fixtures__/answerFixtures";

const everyAnswer = (): Array<{ name: string; answer: SearchAnswer }> =>
  ANSWER_FIXTURE_CASES.flatMap((name) => {
    const { answers, wordAnswers = [] } = ANSWER_FIXTURES[name];
    return [...answers, ...wordAnswers].map((answer) => ({ name, answer }));
  });

describe("answer contract fixtures", () => {
  // @req REQ-178
  it("covers the nine reference cases of the plan", () => {
    expect([...ANSWER_FIXTURE_CASES].sort()).toEqual(
      [
        "bantou",
        "bassa",
        "camara",
        "civ",
        "congo",
        "lingala",
        "nzebi",
        "peul",
        "pharaon",
      ].sort()
    );
  });

  // @req REQ-178
  it("draws a block only when it has data: no empty list stands in for a missing block", () => {
    for (const { name, answer } of everyAnswer()) {
      if (answer.origin) {
        expect(answer.origin.accounts.length, name).toBeGreaterThan(0);
      }
      if (answer.where)
        expect(answer.where.rows.length, name).toBeGreaterThan(0);
      if (answer.publications) {
        expect(answer.publications.length, name).toBeGreaterThan(0);
      }
      if (answer.path) expect(answer.path.length, name).toBeGreaterThan(0);
    }
  });

  // @req REQ-178
  it("keeps the sentences a fiche may write inside the limits its validator enforces", () => {
    for (const { name, answer } of everyAnswer()) {
      if (answer.what.lead !== undefined) {
        expect(
          searchAnswerSentenceProblems("lead", answer.what.lead),
          name
        ).toEqual([]);
      }
      if (answer.next && "question" in answer.next) {
        expect(
          searchAnswerSentenceProblems("followUp", answer.next.question),
          name
        ).toEqual([]);
      }
    }
  });

  // @req REQ-178
  it("marks an origin as debated exactly when several accounts or a contested one are shown", () => {
    for (const { name, answer } of everyAnswer()) {
      if (!answer.origin) continue;
      const contested = answer.origin.accounts.some(
        (account) => account.claimStatus === "contested"
      );
      expect(answer.origin.debated, name).toBe(
        answer.origin.accounts.length > 1 || contested
      );
    }
  });

  // @req REQ-178
  it("carries the provenance of each account, and counts distinct sources once", () => {
    for (const { name, answer } of everyAnswer()) {
      const sourceIds = new Set<string>();
      for (const account of answer.origin?.accounts ?? []) {
        expect(
          account.evidence.length,
          `${name}: ${account.text}`
        ).toBeGreaterThan(0);
        for (const evidence of account.evidence) {
          for (const source of evidence.sources) sourceIds.add(source.id);
        }
      }
      expect(answer.sources.count, name).toBe(sourceIds.size);
    }
  });

  // @req REQ-178
  it("shows both readings of the Lingala name before any cut, and speakers as a declared estimate", () => {
    const [lingala] = ANSWER_FIXTURES.lingala.answers;
    expect(lingala.origin?.debated).toBe(true);
    expect(lingala.origin?.accounts).toHaveLength(2);
    expect(lingala.where).toMatchObject({ unit: "speakers", estimate: true });
  });

  // @req REQ-178
  it("gives patronymes presence without figures, and says nothing it cannot", () => {
    const [camara] = ANSWER_FIXTURES.camara.answers;
    expect(camara.where?.unit).toBe("presence");
    expect(camara.where?.estimate).toBe(false);
    for (const row of camara.where?.rows ?? []) {
      expect(row.value).toBeNull();
    }
    expect(camara.origin?.debated).toBe(true);
  });

  // @req REQ-178
  it("splits a country's people by share and declares what is not yet split", () => {
    const congo = ANSWER_FIXTURES.congo.answers;
    expect(congo.map((answer) => answer.title)).toEqual(["Congo", "RD Congo"]);
    const democratic = congo[1].where;
    expect(democratic).toMatchObject({ unit: "percent", unsplitPercent: 34 });
    expect(democratic?.documentedPeopleCount).toBe(64);
  });

  // @req REQ-184
  it("carries a published word at the envelope level, with no fiche behind it", () => {
    const { answers, wordAnswers } = ANSWER_FIXTURES.pharaon;
    expect(answers).toEqual([]);
    expect(wordAnswers).toHaveLength(1);
    expect(wordAnswers?.[0]).toMatchObject({ kind: "word" });
    expect(wordAnswers?.[0].queries).toEqual(
      expect.arrayContaining(["pharaon", "pharaoh"])
    );
    expect(wordAnswers?.[0].path?.[0]).toMatchObject({ language: "égyptien" });
  });

  // @req REQ-178
  it("falls back to the template when a fiche wrote no lead", () => {
    expect(ANSWER_FIXTURES.nzebi.answers[0].what.lead).toBeUndefined();
    expect(ANSWER_FIXTURES.peul.answers[0].what.lead).toBeDefined();
  });

  // @req REQ-178
  it("refuses at compile time a unit the contract does not know", () => {
    const where: AnswerWhere = {
      // @ts-expect-error a sum of peoples' populations is not a unit
      unit: "sum",
      estimate: false,
      rows: [],
    };
    expect(where.rows).toEqual([]);
  });
});
