import { describe, expect, it } from "vitest";

import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import { ANSWER_BLOCKS } from "@/lib/search/resultGrammar";
import {
  buildSearchFeedPlan,
  classifySearchFeed,
  companionSubjectsForSearch,
  isSearchFeedSubject,
} from "@/lib/search/searchFeedPlan";

// @req REQ-180
describe("search-feed plan", () => {
  // The answer is the page: the filters, the six blocks of each subject, the
  // button to the fiche, then what the reader is owed. Nothing else stacks
  // under it, whatever the companions hold.
  // @req REQ-178
  it("composes « Tout » as the answer when a subject carries one", () => {
    const plan = buildSearchFeedPlan("exact", { answers: true, fiches: true });

    expect(plan.first).toEqual(["lenses"]);
    expect(plan.primary).toEqual([...ANSWER_BLOCKS, "fiche-link"]);
    expect(plan.closing).toEqual(["owed"]);
  });

  // A search that only widened still answers the name it found: the answer
  // does not change because the companions around it are related, not exact.
  // @req REQ-178
  it("answers a widened search the same way as an exact one", () => {
    expect(buildSearchFeedPlan("widened", { answers: true })).toEqual(
      buildSearchFeedPlan("exact", { answers: true })
    );
  });

  // A published word has no fiche to link to.
  // @req REQ-184
  it("drops the fiche button on the page of a published word", () => {
    const plan = buildSearchFeedPlan("unknown", {}, { wordPage: true });

    expect(plan.first).toEqual(["lenses"]);
    expect(plan.primary).toEqual([...ANSWER_BLOCKS]);
    expect(plan.closing).toEqual(["owed"]);
  });

  // @req REQ-178
  it("opens with the verdict and the choices when no answer can be given", () => {
    const plan = buildSearchFeedPlan("typo", {
      appellations: true,
      fiches: true,
    });

    expect(plan.first).toEqual(["verdict", "appellations", "lenses", "shorts"]);
    expect(plan.primary).toEqual(["fiches"]);
    expect(plan.closing).toEqual(["further"]);
  });

  // @req REQ-178
  it("keeps the unknown-name closing: what is owed, then a way out", () => {
    expect(buildSearchFeedPlan("unknown", {}).closing).toEqual([
      "owed",
      "further",
    ]);
  });

  // @req REQ-178
  it("does not add an owed closing for related-only results", () => {
    expect(
      buildSearchFeedPlan("widened", { fiches: true }, { relatedOnly: true })
    ).toEqual({
      first: ["verdict", "lenses", "shorts"],
      primary: ["fiches"],
      closing: [],
    });
  });

  // @req REQ-180
  it("classifies exact, widened, typo and unknown responses from data", () => {
    const exact = FEED_CASES.find(({ id }) => id === "mande")!;
    const widened = FEED_CASES.find(({ id }) => id === "ekpeye")!;
    const typo = FEED_CASES.find(({ id }) => id === "introuvable")!;
    const unknown = FEED_CASES.find(({ id }) => id === "inconnu")!;

    expect(classifySearchFeed(exact.production)).toBe("exact");
    expect(classifySearchFeed(widened.production)).toBe("widened");
    expect(classifySearchFeed(typo.production)).toBe("typo");
    expect(classifySearchFeed(unknown.production)).toBe("unknown");
  });

  // A reviewed term a near spelling may have meant is as good a suggestion as a
  // near-miss lead: without it « pigmée » confessed ignorance of a term we hold.
  // @req REQ-125
  it("treats a reviewed-term suggestion as a misspelling, not an unknown name", () => {
    const unknown = FEED_CASES.find(({ id }) => id === "inconnu")!;

    expect(
      classifySearchFeed({
        ...unknown.production,
        termSuggestions: ["Pygmée"],
      })
    ).toBe("typo");
    expect(classifySearchFeed(unknown.production)).toBe("unknown");
  });

  // A near name is offered to a reader whose spelling missed. A reader who typed
  // a word we made a piece on did not miss: the piece answers it.
  // @req REQ-180
  it("does not treat a word we have a piece on as a misspelling", () => {
    const typo = FEED_CASES.find(({ id }) => id === "introuvable")!;
    const [short] = FEED_CASES.find(({ id }) => id === "inconnu")!.production
      .companions.shorts.items;

    expect(
      classifySearchFeed({
        ...typo.production,
        companions: {
          ...typo.production.companions,
          shorts: {
            count: 1,
            items: [{ ...short, match: { relation: "word", word: "zombie" } }],
          },
        },
      })
    ).toBe("unknown");
  });

  // @req REQ-180
  it("does not promote a related result when no entity answers to the searched name", () => {
    const exact = FEED_CASES.find(({ id }) => id === "mande")!;

    expect(
      classifySearchFeed({
        ...exact.production,
        subjects: [],
      })
    ).toBe("widened");
  });

  // @req REQ-180
  it("uses resolved subjects, then typo leads, and permits an empty unknown request", () => {
    const exact = FEED_CASES.find(({ id }) => id === "bassa")!;
    const typo = FEED_CASES.find(({ id }) => id === "introuvable")!;
    const unknown = FEED_CASES.find(({ id }) => id === "inconnu")!;
    const exactSubjectKeys = new Set(
      exact.production.companions.subjects.map(
        ({ entityType, entityId }) => `${entityType}:${entityId}`
      )
    );
    const exactSubjects = exact.production.search.results.filter((result) =>
      exactSubjectKeys.has(`${result.type}:${result.id}`)
    );

    expect(
      companionSubjectsForSearch(exactSubjects, exact.production.search.leads)
    ).toEqual(exact.production.companions.subjects);
    expect(
      companionSubjectsForSearch(
        typo.production.search.results,
        typo.production.search.leads
      )
    ).toEqual(typo.production.companions.subjects);
    expect(
      companionSubjectsForSearch(
        unknown.production.search.results,
        unknown.production.search.leads
      )
    ).toEqual([]);
  });

  // @req REQ-180
  it("keeps unsupported person hits out of feed subject resolution", () => {
    expect(isSearchFeedSubject({ type: "person" })).toBe(false);
    expect(isSearchFeedSubject({ type: "people" })).toBe(true);
  });
});
