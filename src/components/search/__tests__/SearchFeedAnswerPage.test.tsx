import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { ANSWER_LABELS } from "@/lib/search/__fixtures__/answerLabels";
import { ANSWER_FIXTURES } from "@/lib/search/__fixtures__/answerFixtures";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import { readAnswer, type SearchAnswer } from "@/lib/search/answer";
import { wordNamingData } from "@/lib/supabase/queries/afrik/searchNaming";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { SearchResult } from "@/types/afrik-frontend";

const noCompanions: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
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
  word: "word",
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
  it("marks the searched form and puts it first among the names", () => {
    const { container } = renderAnswer("peul", [subjectOf(peul)]);

    expect(screen.getByText("votre recherche")).toBeVisible();
    const names = container.querySelector('[data-answer-block="names"]');
    expect(
      within(names as HTMLElement).getAllByRole("listitem")[0]
    ).toHaveTextContent("Peul");
  });
});

// Operator decision 2026-10-08 (doctrine §1.1): a reader who typed an exonym
// and lands on a page headed by the self-name thinks they are on the wrong
// page. Right under the heading, the page says what was searched and leads to
// the name the people gives itself.
// @req REQ-178
describe("the lead from the searched name to the self-name", () => {
  const lead = (container: HTMLElement) =>
    container.querySelector<HTMLElement>("[data-searched-lead]");

  // @req REQ-178
  it("says what was searched and links to the people's own name, under the heading", () => {
    const { container } = renderAnswer("Peul", [
      subjectOf(peul, { id: "PPL_FULA" }),
    ]);

    const element = lead(container);
    expect(element).not.toBeNull();
    expect(element).toHaveTextContent(
      searchFeedCopy.fr.searchedLead.searched("Peul")
    );
    const link = within(element).getByRole("link", {
      name: searchFeedCopy.fr.searchedLead.self.people("Fulɓe · Pullo"),
    });
    expect(link).toHaveAttribute("href", expect.stringContaining("PPL_FULA"));
    // In the subject heading's block, right after the heading.
    const what = container.querySelector('[data-answer-block="what"]');
    expect(what?.contains(element)).toBe(true);
    expect(what?.querySelector("h1")?.nextElementSibling).toBe(element);
  });

  // @req REQ-178
  it("shows nothing when the reader searched the self-name", () => {
    const { container } = renderAnswer("Pullo", [subjectOf(peul)]);

    expect(lead(container)).toBeNull();
  });

  // @req REQ-178
  it("shows nothing for a subject that records no self-given name", () => {
    const { container } = renderAnswer("ngala", [subjectOf(lingala)]);

    expect(lead(container)).toBeNull();
  });

  // @req REQ-178
  it("names a language's self-given form with the speakers' wording", () => {
    const named = {
      ...lingala,
      names: [
        { form: "Ngala", selfGiven: null },
        { form: "Lingála", selfGiven: true },
      ],
    };
    const { container } = renderAnswer("ngala", [subjectOf(named)]);

    expect(lead(container)).toHaveTextContent(
      searchFeedCopy.fr.searchedLead.self.language("Lingála")
    );
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
  it("tells two countries bearing the name as one answer, with a fiche for each", () => {
    const subjects = congo.answers.map((answer, index) =>
      subjectOf(answer, {
        id: index === 0 ? "COG" : "COD",
        associatedPeoples: Object.entries(ANSWER_LABELS).map(([id, name]) => ({
          id,
          name,
        })),
      })
    );
    const { container } = renderAnswer("Congo", subjects);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Congo"
    );
    expect(
      blockIds(container).filter((id) => id.startsWith("answer-"))
    ).toEqual([
      "answer-what",
      "answer-origin",
      "answer-names",
      "answer-where",
      "answer-next",
      "answer-sources",
    ]);
    expect(
      blockIds(container).filter((id) => id === "fiche-link")
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: /Voir la fiche complète/ })
    ).toHaveLength(2);
  });
});

// « congo » is two countries and a family name. Each subject gets one title,
// the eyebrow above it, and the second is parted from the first by a rule: the
// page must not read as two pages stacked, nor repeat the name three times.
// @req REQ-178
describe("a name shared by countries and a family name", () => {
  const congo = ANSWER_FIXTURES.congo.answers.map((answer, index) =>
    subjectOf(answer, { id: index === 0 ? "COG" : "COD", name: "Congo" })
  );
  const familyName = subjectOf(
    { ...ANSWER_FIXTURES.camara.answers[0], title: "Congo" },
    { id: "PAT_CONGO", name: "Congo" }
  );

  // @req REQ-178
  it("draws one title per subject block, all at the same size, one of them the h1", () => {
    const { container } = renderAnswer("Congo", [...congo, familyName]);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    for (const block of container.querySelectorAll(
      '[data-feed-block="answer-what"]'
    )) {
      expect(block.querySelectorAll("h1, h2")).toHaveLength(1);
      expect(block.querySelector("h1, h2")).not.toHaveClass("text-afh-hero");
    }
    expect(
      container.querySelectorAll('[data-feed-block="answer-what"]')
    ).toHaveLength(2);
    // The searched name is not also set above the blocks as a third title.
    expect(
      screen
        .getAllByRole("heading", { name: "Congo" })
        .filter((heading) => /^H[12]$/.test(heading.tagName))
    ).toHaveLength(2);
  });

  // @req REQ-178
  it("parts the second subject from the first with a rule", () => {
    const { container } = renderAnswer("Congo", [...congo, familyName]);

    const dividers = container.querySelectorAll("[data-subject-divider]");
    expect(dividers).toHaveLength(1);
    expect(
      dividers[0].querySelector('[data-feed-block="answer-what"]')
    ).not.toBeNull();
  });

  // @req REQ-178
  it("keeps a page-level title when the subjects are not all named alike", () => {
    renderAnswer("Bassa", [
      subjectOf(peul, { id: "PPL_A", name: "Bassa" }),
      subjectOf(lingala, { id: "lin", name: "Bassa" }),
    ]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "text-afh-hero"
    );
  });

  // @req REQ-178
  it("offers no solid fiche button when several fiches answer", () => {
    const { container } = renderAnswer("Congo", [...congo, familyName]);
    const solid = Array.from(
      container.querySelectorAll('[data-feed-block="fiche-link"] a')
    ).filter((link) => link.className.includes("bg-[color:var(--accent)]"));
    expect(solid).toHaveLength(0);
  });
});

// « bantou » is a family of languages and a people filed under it. The family
// answers; the peoples are a way in, counted from the data.
// @req REQ-178
describe("a family and the peoples filed under its name", () => {
  const bantou = ANSWER_FIXTURES.bantou.answers[0];
  const family = subjectOf(bantou, { id: "FLG_BANTU", name: "Bantou" });
  const people = subjectOf(peul, {
    id: "PPL_BANTU",
    name: "Bantou",
    languageFamilyId: "FLG_BANTU",
  } as Partial<SearchResult>);

  // @req REQ-178
  it("asks what the reader is after, then answers for the family only", () => {
    const { container } = renderAnswer("bantou", [family, people]);

    expect(
      screen.getByRole("heading", { level: 2, name: "Que cherchez-vous ?" })
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      blockIds(container).filter((id) => id === "answer-what")
    ).toHaveLength(1);
    expect(screen.queryByText("Un peuple")).toBeNull();
    expect(
      screen.getAllByRole("link", { name: /Voir la fiche complète/ })
    ).toHaveLength(1);
  });

  // @req REQ-178
  it("counts the peoples from the data and leads to them", () => {
    renderAnswer("bantou", [family, people]);

    const link = screen.getByRole("link", {
      name: `Voir les ${bantou.what.facts.peopleCount} peuples`,
    });
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("family=FLG_BANTU")
    );
  });

  // @req REQ-178
  it("asks nothing when only the family answers", () => {
    renderAnswer("bantou", [family]);

    expect(screen.queryByText("Que cherchez-vous ?")).toBeNull();
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
  const wordShort = {
    ...richCompanions.shorts.items[0],
    match: { relation: "word" as const, word: "pharaon" },
  };
  const withShort: SearchCompanionsData = {
    ...noCompanions,
    shorts: { count: 1, items: [wordShort] },
  };

  function renderWord(companions: SearchCompanionsData) {
    return render(
      <SearchFeed
        query="pharaon"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={companions}
        wordAnswers={[pharaon]}
      />
    );
  }

  // The page keeps the filters of every other page when there is a choice,
  // and still says no more than the record does.
  // @req REQ-184
  it("is answered by its record, under the filters, with no confession", () => {
    const { container } = renderWord(withShort);

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

  // A lone « Tout » is a filter with nothing to choose from.
  // @req REQ-178
  it("draws no filters when « Tout » is the only one", () => {
    const { container } = renderWord(noCompanions);

    expect(blockIds(container)).not.toContain("lenses");
    expect(blockIds(container)[0]).toBe("answer-what");
  });

  // The publication is a card, not two bare links: what it is, when, and a
  // button of at least 44 px per network.
  // @req REQ-184
  it("shows the publication as a card with a button per network", () => {
    const { container } = renderWord(noCompanions);

    const card = container.querySelector('[data-word-part="publications"]')!;
    expect(
      within(card as HTMLElement).getByRole("heading", {
        name: "Notre publication",
      })
    ).toBeVisible();
    expect(card).toHaveTextContent("Carrousel · 3 octobre 2026");
    const buttons = within(card as HTMLElement).getAllByRole("link");
    expect(buttons.map((link) => link.textContent)).toEqual([
      "Voir sur TikTok",
      "Voir sur Instagram",
    ]);
    for (const button of buttons) expect(button).toHaveClass("min-h-11");
  });

  // @req REQ-184
  it("closes on the invitation of a word, and claims nothing about names", () => {
    renderWord(noCompanions);

    expect(
      screen.getByText("Vous connaissez une autre source ?")
    ).toBeVisible();
    expect(screen.queryByText(/Plusieurs noms peuvent coexister/)).toBeNull();
  });
});

// The closing asks for what only a reader of this kind can bring, and says
// nothing a language, a country or a word cannot honour.
// @req REQ-178
describe("the closing of the answer page", () => {
  const cases = [
    [
      "people",
      ANSWER_FIXTURES.peul.answers[0],
      "Vous connaissez une autre explication ?",
      "Proposer une source",
    ],
    [
      "language",
      ANSWER_FIXTURES.lingala.answers[0],
      "Vous parlez cette langue ?",
      "Proposer une source",
    ],
    [
      "country",
      ANSWER_FIXTURES.congo.answers[0],
      "Vous connaissez une autre explication ?",
      "Proposer une source",
    ],
    [
      "languageFamily",
      ANSWER_FIXTURES.bantou.answers[0],
      "Vous l'avez appris autrement ?",
      "Proposer une source",
    ],
    [
      "patronyme",
      ANSWER_FIXTURES.camara.answers[0],
      "Vous portez ce nom ?",
      "Partager un récit",
    ],
  ] as const;

  // @req REQ-178
  it.each(cases)(
    "asks a reader of a %s the right question, with no conviction box",
    (_kind, answer, title, action) => {
      renderAnswer("x", [subjectOf(answer)]);

      expect(screen.getByText(title)).toBeVisible();
      expect(screen.getByRole("button", { name: action })).toBeVisible();
      expect(screen.queryByText(/Plusieurs noms peuvent coexister/)).toBeNull();
    }
  );

  // @req REQ-178
  it("states the origin once when two subjects tell the same one", () => {
    const subjects = ANSWER_FIXTURES.congo.answers.map((answer, index) =>
      subjectOf(answer, { id: index === 0 ? "COG" : "COD" })
    );
    const { container } = renderAnswer("Congo", subjects);

    expect(
      blockIds(container).filter((id) => id === "answer-origin")
    ).toHaveLength(1);
  });

  // The second subject of a shared name is a section of the page, not its title.
  // @req REQ-178
  it("ranks the second subject's name below the page title", () => {
    const people = subjectOf(peul, { id: "PPL_YORUBA", name: "Yoruba" });
    const language = subjectOf(lingala, { id: "yor", name: "Yoruba" });
    renderAnswer("Yoruba", [people, language]);

    const [title] = screen.getAllByRole("heading", { level: 1 });
    const sections = screen.getAllByRole("heading", { level: 2 });
    expect(title).toHaveClass("text-afh-hero");
    expect(sections[0]).not.toHaveClass("text-afh-hero");
  });

  // @req REQ-178
  it("makes the fiche button the one solid ocre primary, whatever the subject", () => {
    renderAnswer("lingala", [subjectOf(ANSWER_FIXTURES.lingala.answers[0])]);

    const button = screen.getByRole("link", { name: /Voir la fiche complète/ });
    expect(button).toHaveClass("afh-accent-ocre", "bg-[color:var(--accent)]");
    expect(button).toHaveClass("min-h-[52px]");
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

describe("the answer page for a word fiche", () => {
  // Built the way the search service builds it, from the corpus fiche itself.
  const race = JSON.parse(
    readFileSync(
      join(process.cwd(), "dataset/source/afrik/mots/WRD_RACE.json"),
      "utf8"
    )
  );
  const naming = wordNamingData(race.id, race.nameHistory);
  const answer = readAnswer("word", {}, race, {
    nameRecords: naming.records,
    evidence: naming.evidence,
  });

  // @req REQ-196
  it("answers « race » with the word, its definition and where its name comes from", () => {
    const { container } = renderAnswer("race", [
      subjectOf(answer, { type: "word", id: race.id }),
    ]);

    expect(blockIds(container)).toEqual(
      expect.arrayContaining(["answer-what", "answer-origin", "answer-names"])
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("race");
    expect(screen.getByText("Un mot")).toBeInTheDocument();
    expect(container).toHaveTextContent(race.definition);
    expect(container).toHaveTextContent(
      race.nameHistory.summary.split(" ; ")[0]
    );
  });
});
