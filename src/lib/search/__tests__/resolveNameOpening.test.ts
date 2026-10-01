import { describe, expect, it } from "vitest";

import type { NameAnswer } from "@/lib/search/nameAnswer";
import { resolveNameOpening } from "@/lib/search/resolveNameOpening";
import type { SearchResult } from "@/types/afrik-frontend";

const result = (
  type: SearchResult["type"],
  id: string,
  name: string
): SearchResult => ({ type, id, name });

const aka = result("people", "PPL_AKA", "Aka");
const twa = result("people", "PPL_TWA", "Twa");
const collective = result("people", "PPL_PYGMEES_AUTOCHTONES", "Pygmées");

const pygmee: NameAnswer = {
  term: "Pygmée",
  subjects: [aka, twa, collective].map(({ type, id }) => ({ type, id })),
  paragraphs: ["Le mot."],
  sources: [],
};

// @req REQ-178
describe("resolveNameOpening", () => {
  // @req REQ-178
  it("titles a shared term with the reviewed term, not the first subject", () => {
    for (const subjects of [
      [aka, twa, collective],
      [collective, aka, twa],
    ]) {
      const opening = resolveNameOpening({
        query: "pygmee",
        subjects,
        nameAnswers: [pygmee],
      });
      expect(opening.title).toBe("Pygmée");
    }
  });

  // @req REQ-178
  it("titles a shared term with the query as typed when nothing was reviewed", () => {
    const opening = resolveNameOpening({
      query: "  Bassa ",
      subjects: [
        result("people", "PPL_BASSA_CMR", "Bassa"),
        result("people", "PPL_BASSA_LBR", "Bassa (Libéria)"),
      ],
      nameAnswers: [],
    });
    expect(opening.title).toBe("Bassa");
    expect(opening.entries).toEqual([]);
  });

  // @req REQ-178
  it("leaves a single subject's title to the page", () => {
    const opening = resolveNameOpening({
      query: "lingala",
      subjects: [result("people", "PPL_LINGALA", "Lingala")],
      nameAnswers: [],
    });
    expect(opening.title).toBeUndefined();
  });

  // @req REQ-178
  it("keeps one entry per answer, covering only the subjects that matched", () => {
    const opening = resolveNameOpening({
      query: "pygmée",
      subjects: [twa, aka],
      nameAnswers: [pygmee],
    });
    expect(opening.entries).toHaveLength(1);
    expect(opening.entries[0].subjects.map(({ id }) => id)).toEqual([
      "PPL_TWA",
      "PPL_AKA",
    ]);
  });

  // @req REQ-178
  it("reports the subjects no reviewed answer covers, so each keeps a fiche link", () => {
    const yaka = result("people", "PPL_YAKA", "Yaka");
    const opening = resolveNameOpening({
      query: "pygmée",
      subjects: [aka, twa, yaka],
      nameAnswers: [pygmee],
    });
    expect(opening.unanswered.map(({ id }) => id)).toEqual(["PPL_YAKA"]);
    expect(
      resolveNameOpening({ query: "x", subjects: [yaka], nameAnswers: [] })
        .unanswered
    ).toEqual([yaka]);
  });

  // @req REQ-178
  it("never attaches an answer to a subject it does not name", () => {
    const opening = resolveNameOpening({
      query: "pygmée",
      subjects: [result("people", "PPL_YAKA", "Yaka")],
      nameAnswers: [pygmee],
    });
    expect(opening.entries).toEqual([]);
  });

  // A reviewed answer resolves from the term alone. « pigmée » finds no
  // fiche, but the answer for « Pygmée » covers it, so the page owes it.
  // @req REQ-178
  it("keeps a reviewed answer when no subject was found", () => {
    const opening = resolveNameOpening({
      query: "pigmée",
      subjects: [],
      nameAnswers: [pygmee],
    });

    expect(opening.entries).toEqual([{ answer: pygmee, subjects: [] }]);
    expect(opening.unanswered).toEqual([]);
  });

  // @req REQ-178
  it("still drops an answer that covers none of the subjects found", () => {
    const opening = resolveNameOpening({
      query: "bassa",
      subjects: [result("people", "PPL_BASSA_CMR", "Bassa")],
      nameAnswers: [pygmee],
    });

    expect(opening.entries).toEqual([]);
  });
});
