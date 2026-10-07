import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { ANSWER_FIXTURES } from "@/lib/search/__fixtures__/answerFixtures";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import type { SearchAnswer } from "@/lib/search/answer";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { SearchResult } from "@/types/afrik-frontend";

const noCompanions: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  images: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

const richCompanions = FEED_CASES.find(({ id }) => id === "peul")!.production
  .companions;

const RESULT_TYPE: Record<string, SearchResult["type"]> = {
  people: "people",
  country: "country",
  language: "language",
  languageFamily: "languageFamily",
  patronyme: "patronyme",
};

function subjectOf(
  answer: SearchAnswer,
  extra: Partial<SearchResult> = {}
): SearchResult {
  return {
    type: RESULT_TYPE[answer.kind],
    id: `ID_${answer.title.replace(/\W+/g, "_")}`,
    name: answer.title,
    exactMatch: true,
    answer,
    ...extra,
  };
}

function renderAnswer(
  query: string,
  subjects: SearchResult[],
  props: Partial<React.ComponentProps<typeof SearchFeed>> = {}
) {
  return render(
    <SearchFeed
      query={query}
      language="fr"
      state="exact"
      results={subjects}
      subjects={subjects}
      leads={[]}
      companions={noCompanions}
      {...props}
    />
  );
}

function blockIds(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-feed-block]"),
    (element) => element.dataset.feedBlock ?? ""
  );
}

const peul = ANSWER_FIXTURES.peul.answers[0];
const lingala = ANSWER_FIXTURES.lingala.answers[0];

// @req REQ-178
describe("the answer page", () => {
  // The answer is the page: the filters, the six blocks in the validated order,
  // the button to the fiche, then what the reader is owed. Nothing stacks
  // under it, whatever the companions hold.
  // @req REQ-178
  it("draws « Tout » as the six blocks, the fiche button and the invitation", () => {
    const { container } = renderAnswer("peul", [subjectOf(peul)]);

    expect(blockIds(container)).toEqual([
      "lenses",
      "answer-what",
      "answer-origin",
      "answer-names",
      "answer-where",
      "answer-next",
      "answer-sources",
      "fiche-link",
      "owed",
    ]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      peul.title
    );
  });

  // The shelves left « Tout »: they are reached through their filters, and the
  // verdict, the chips and the exits of the pages with no answer do not apply.
  // @req REQ-178
  it("keeps the shelves out of « Tout », whatever the companions hold", () => {
    const { container } = renderAnswer("peul", [subjectOf(peul)], {
      companions: richCompanions,
    });

    const ids = blockIds(container);
    for (const left of [
      "shorts",
      "plates",
      "quiz",
      "images",
      "fiches",
      "verdict",
      "appellations",
      "further",
    ]) {
      expect(ids, left).not.toContain(left);
    }
  });

  // @req REQ-178
  it("links each subject to its fiche, after the answer", () => {
    renderAnswer("peul", [subjectOf(peul, { id: "PPL_FULA" })]);

    const link = screen.getByRole("link", {
      name: searchFeedCopy.fr.blocks.ficheLink(peul.title),
    });
    expect(link).toHaveAttribute("href", expect.stringContaining("PPL_FULA"));
  });

  // @req REQ-178
  it("marks the searched form among the names without promoting it", () => {
    renderAnswer("peul", [subjectOf(peul)]);

    expect(screen.getByText("votre recherche")).toBeVisible();
  });
});

// @req REQ-178
describe("the filters", () => {
  const tabs = () =>
    within(
      screen.getByRole("navigation", { name: searchFeedCopy.fr.filters.label })
    ).getAllByRole("button");

  // @req REQ-178
  it("offers « Tout » and the fiches when no other shelf has anything", () => {
    renderAnswer("peul", [subjectOf(peul)]);

    // The fiches are the one shelf a search always has behind it.
    expect(tabs().map((tab) => tab.textContent)).toEqual(["Tout", "Fiches1"]);
    expect(tabs()[0]).toHaveAttribute("aria-pressed", "true");
  });

  // A filter with nothing behind it is not offered, and one that is offered
  // says how many things it holds.
  // @req REQ-178
  it("lists the shelves that have content with their counts, never a zero", () => {
    renderAnswer("peul", [subjectOf(peul)], { companions: richCompanions });

    const labels = tabs().map((tab) => tab.textContent ?? "");
    expect(labels[0]).toBe("Tout");
    expect(labels.length).toBeGreaterThan(1);
    for (const label of labels.slice(1)) {
      expect(label).toMatch(/[1-9]\d*$/);
    }
    expect(labels).toContain(`Shorts${richCompanions.shorts.items.length}`);
  });

  // @req REQ-178
  it("replaces the answer by the shorts under their filter, split on the name and around it, and comes back", () => {
    const { container } = renderAnswer("peul", [subjectOf(peul)], {
      companions: richCompanions,
    });

    fireEvent.click(screen.getByRole("button", { name: /^Shorts/ }));

    expect(blockIds(container)).not.toContain("answer-what");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      searchFeedCopy.fr.lens.title.shorts(peul.title)
    );
    expect(screen.getByRole("button", { name: /^Shorts/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(
      screen.getByRole("button", { name: searchFeedCopy.fr.lens.back })
    );

    expect(blockIds(container)).toContain("answer-what");
  });
});

// @req REQ-178
describe("several subjects answering one name", () => {
  const congo = ANSWER_FIXTURES.congo;

  // @req REQ-178
  it("keeps one h1, the name searched, and gives each subject its own six blocks and its own fiche", () => {
    const subjects = congo.answers.map((answer, index) =>
      subjectOf(answer, { id: index === 0 ? "COG" : "COD" })
    );
    const { container } = renderAnswer("Congo", subjects);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Congo"
    );
    expect(
      blockIds(container).filter((id) => id === "answer-what")
    ).toHaveLength(2);
    expect(
      blockIds(container).filter((id) => id === "fiche-link")
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: /Voir la fiche complète/ })
    ).toHaveLength(2);
  });
});

// A people and a language filed under the same spelling both answer, side by
// side and with the same weight: the page does not choose between them.
// @req REQ-178
describe("a name shared by a people and a language", () => {
  // @req REQ-178
  it("answers for both, with the same blocks, under the one name", () => {
    const people = subjectOf(peul, { id: "PPL_YORUBA", name: "Yoruba" });
    const language = subjectOf(lingala, { id: "yor", name: "Yoruba" });
    const { container } = renderAnswer("Yoruba", [people, language]);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Yoruba"
    );
    expect(
      blockIds(container).filter((id) => id === "answer-what")
    ).toHaveLength(2);
    expect(screen.getByText("Un peuple")).toBeVisible();
    expect(screen.getByText("Une langue")).toBeVisible();
  });
});

// @req REQ-178
describe("a reviewed answer", () => {
  const reviewed: NameAnswer = {
    term: "Peul",
    subjects: [{ type: "people", id: "PPL_FULA" }],
    paragraphs: ["Texte relu : « Peul » vient du wolof, selon nos lectures."],
    sources: [
      {
        assertion: {
          statement: "relu",
          sourceCount: 1,
          lastHumanAuditAt: null,
        },
        sources: [{ id: "src-1", title: "Une source", tier: "referenced" }],
        standing: "referenced",
      },
    ],
  };

  // The editor's text prevails over the automatic display, and the sources
  // line counts what the reader is shown: the reviewed answer's own sources.
  // @req REQ-178
  it("takes the place of the automatic origin and carries its own sources", () => {
    renderAnswer("peul", [subjectOf(peul, { id: "PPL_FULA" })], {
      nameAnswers: [reviewed],
    });

    expect(screen.getByText(/Texte relu/)).toBeVisible();
    const automatic = peul.origin?.accounts[0]?.text ?? "";
    expect(screen.queryByText(automatic, { exact: false })).toBeNull();
    expect(screen.getByText(/s'appuient sur/)).toHaveTextContent("1 source");
  });
});

// A country's shares are keyed by people, and the page names them from the
// fiche's own list: no identifier reaches the reader, and the peoples named
// beside the unsplit part are only those the fiche lists without a share.
// @req REQ-178
describe("a country's shares", () => {
  const congoRepublic = ANSWER_FIXTURES.congo.answers[0];

  // @req REQ-178
  it("names the peoples from the fiche and prints no identifier", () => {
    const { container } = renderAnswer("Congo", [
      subjectOf(congoRepublic, {
        id: "COG",
        associatedPeoples: [
          { id: "PPL_KONGO_BRAZZA", name: "Kongo (Brazzaville)" },
          { id: "PPL_TEKE", name: "Teke" },
        ],
      }),
    ]);

    expect(container.textContent).toContain("Kongo (Brazzaville)");
    expect(container.textContent).toContain("(Teke…)");
    expect(container.textContent).not.toMatch(/PPL_/);
    expect(container.textContent).not.toContain("Mbochi");
  });
});

// @req REQ-184
describe("the page of a published word", () => {
  const pharaon = ANSWER_FIXTURES.pharaon.wordAnswers![0];

  // The page keeps the filters of every other page, and still says no more
  // than the record does.
  // @req REQ-184
  it("is answered by its record, under the filters, with no confession", () => {
    const { container } = render(
      <SearchFeed
        query="pharaon"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={noCompanions}
        wordAnswers={[pharaon]}
      />
    );

    expect(
      screen.getByRole("navigation", { name: searchFeedCopy.fr.filters.label })
    ).toBeVisible();
    expect(screen.queryByText(nameAnswerCopy.fr.unknownName)).toBeNull();
    expect(blockIds(container).slice(0, 3)).toEqual([
      "lenses",
      "answer-what",
      "answer-origin",
    ]);
  });
});

// @req REQ-178
describe("no block says it is empty", () => {
  // @req REQ-178
  it("draws no where block for a language whose fiche declares no speakers", () => {
    const withoutSpeakers: SearchAnswer = { ...lingala, where: undefined };
    const { container } = renderAnswer("lingala", [subjectOf(withoutSpeakers)]);

    expect(blockIds(container)).not.toContain("answer-where");
    expect(container.textContent).not.toMatch(/aucun|pas de donn/i);
  });
});
