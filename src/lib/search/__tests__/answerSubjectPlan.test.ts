import { describe, expect, it } from "vitest";

import { planAnswerSubjects } from "@/lib/search/answerSubjectPlan";
import type { SearchResult } from "@/types/afrik-frontend";

const subject = (
  type: SearchResult["type"],
  id: string,
  extra: Partial<SearchResult> = {}
): SearchResult => ({ type, id, name: id, ...extra }) as SearchResult;

// @req REQ-178
describe("planAnswerSubjects", () => {
  // @req REQ-178
  it("speaks about two countries sharing a name in one block", () => {
    const plan = planAnswerSubjects([
      subject("country", "COG"),
      subject("country", "COD"),
    ]);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ kind: "countries" });
    expect(plan[0].kind === "countries" && plan[0].subjects).toHaveLength(2);
  });

  // @req REQ-178
  it("keeps a lone country as an ordinary subject", () => {
    const plan = planAnswerSubjects([subject("country", "COG")]);
    expect(plan).toEqual([
      { kind: "subject", subject: subject("country", "COG") },
    ]);
  });

  // @req REQ-178
  it("keeps the other kinds after the countries, in the order met", () => {
    const plan = planAnswerSubjects([
      subject("country", "COG"),
      subject("patronyme", "PAT_CONGO"),
      subject("country", "COD"),
    ]);
    expect(plan.map((block) => block.kind)).toEqual(["countries", "subject"]);
  });

  // @req REQ-178
  it("offers the peoples of a family as a choice, not as a second answer", () => {
    const family = subject("languageFamily", "FLG_BANTU");
    const bantu = subject("people", "PPL_BANTU", {
      languageFamilyId: "FLG_BANTU",
    } as Partial<SearchResult>);
    const plan = planAnswerSubjects([family, bantu]);
    expect(plan).toEqual([
      { kind: "subject", subject: family, peoplesOfFamily: [bantu] },
    ]);
  });

  // @req REQ-178
  it("folds the people filed under exactly the family's name", () => {
    const family = subject("languageFamily", "FLG_BANTU", { name: "Bantou" });
    const bantu = subject("people", "PPL_BANTU", {
      name: "Bantou",
      languageFamilyId: "FLG_NIGERCONGO",
    } as Partial<SearchResult>);
    expect(planAnswerSubjects([family, bantu])).toEqual([
      { kind: "subject", subject: family, peoplesOfFamily: [bantu] },
    ]);
  });

  // @req REQ-178
  it("does not fold a people of another family", () => {
    const family = subject("languageFamily", "FLG_BANTU");
    const other = subject("people", "PPL_X", {
      languageFamilyId: "FLG_OTHER",
    } as Partial<SearchResult>);
    expect(planAnswerSubjects([family, other])).toHaveLength(2);
  });

  // @req REQ-178
  it("leaves peoples alone when no family answers", () => {
    const plan = planAnswerSubjects([
      subject("people", "PPL_A"),
      subject("people", "PPL_B"),
    ]);
    expect(plan.map((block) => block.kind)).toEqual(["subject", "subject"]);
  });
});
