import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { getLocalizedRoute } from "@/lib/routing";
import type { NameAnswer } from "@/lib/search/nameAnswer";
import type { SearchResult } from "@/types/afrik-frontend";

const noCompanions: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

const emptyNaming: SearchResult["naming"] = {
  forms: [],
  eras: [],
  presentation: { forms: [], eras: [], disagreements: [], evidence: [] },
};

function subject(
  type: SearchResult["type"],
  id: string,
  name: string
): SearchResult {
  return { type, id, name, exactMatch: true, naming: emptyNaming };
}

function renderFeed(
  query: string,
  subjects: SearchResult[],
  nameAnswers: NameAnswer[] = []
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
      nameAnswers={nameAnswers}
    />
  );
}

// @req REQ-178
describe("the searched term is the page subject", () => {
  const aka = subject("people", "PPL_AKA", "Aka");
  const twa = subject("people", "PPL_TWA", "Twa");
  const collective = subject(
    "people",
    "PPL_PYGMEES_AUTOCHTONES",
    "Pygmées autochtones"
  );

  // The heading came from subjects[0], so a rerank turned « Pygmée » into « Aka ».
  // @req REQ-178
  it.each([
    [aka, twa, collective],
    [collective, twa, aka],
    [twa, aka, collective],
  ])("keeps « Pygmée » as the only h1 whatever ranks first", (...ranked) => {
    renderFeed("Pygmée", ranked);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Pygmée"
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});

// @req REQ-178
describe("two subjects answering one name", () => {
  const people = subject("people", "PPL_BAMBARA", "Bambara");
  const language = subject("language", "bam", "Bambara");
  const answers: NameAnswer[] = [
    {
      term: "Bambara",
      subjects: [{ type: "people", id: "PPL_BAMBARA" }],
      paragraphs: ["Le peuple."],
      sources: [],
    },
    {
      term: "Bambara",
      subjects: [{ type: "language", id: "bam" }],
      paragraphs: ["La langue."],
      sources: [],
    },
  ];

  // @req REQ-178
  it("gives the people and the language each an answer and a fiche link", () => {
    const { container } = renderFeed("Bambara", [people, language], answers);

    const entries = container.querySelectorAll("[data-answer-subject]");
    expect(entries).toHaveLength(2);
    const hrefs = Array.from(entries, (entry) =>
      within(entry as HTMLElement)
        .getByRole("link", { name: /fiche/i })
        .getAttribute("href")
    );
    expect(hrefs[0]).toContain("PPL_BAMBARA");
    expect(hrefs[1]).toContain("bam");
    expect(screen.getByText("Le peuple.")).toBeVisible();
    expect(screen.getByText("La langue.")).toBeVisible();
  });
});

// @req REQ-125
describe("a misspelling of a reviewed term", () => {
  // @req REQ-125
  it("offers the reviewed term as a choice instead of confessing ignorance", () => {
    render(
      <SearchFeed
        query="pigmée"
        language="fr"
        state="typo"
        results={[]}
        subjects={[]}
        leads={[]}
        nameSuggestions={["Pygmée"]}
        companions={noCompanions}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "pigmée"
    );
    expect(screen.getByText("Cherchiez-vous… ?")).toBeVisible();
    expect(screen.getByRole("link", { name: /Pygmée/ })).toHaveAttribute(
      "href",
      `${getLocalizedRoute("fr", "search")}?${new URLSearchParams({ q: "Pygmée" })}`
    );
    expect(screen.queryByText(/ne connaissons pas/i)).toBeNull();
  });
});

// @req REQ-178
describe("a known name with no reviewed answer", () => {
  // @req REQ-178
  it("still opens onto its fiche, without claiming the origin is unknown", () => {
    const { container } = renderFeed("Lingala", [
      subject("people", "PPL_LINGALA", "Lingala"),
    ]);

    const opening = container.querySelector('[data-feed-block="verdict"]');
    expect(
      within(opening as HTMLElement).getByRole("link", { name: /fiche/i })
    ).toHaveAttribute("href", expect.stringContaining("PPL_LINGALA"));
    expect(screen.queryByText(/ne connaissons pas/i)).toBeNull();
  });
});

// @req REQ-125
describe("a query no name answers to", () => {
  const leads = [
    { type: "people" as const, id: "PPL_AKA", name: "Aka", similarity: 0.6 },
    { type: "people" as const, id: "PPL_TWA", name: "Twa", similarity: 0.5 },
  ];

  function renderTypo() {
    return render(
      <SearchFeed
        query="pigmée"
        language="fr"
        state="typo"
        results={[]}
        subjects={[]}
        leads={leads}
        companions={noCompanions}
      />
    );
  }

  // The title came from leads[0], so « pigmée » read as a page about « Aka ».
  // @req REQ-125
  it("keeps what the reader typed as the title, never a suggestion", () => {
    renderTypo();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "pigmée"
    );
    expect(screen.getByText("Cherchiez-vous… ?")).toBeVisible();
  });

  // @req REQ-125
  it("offers each nearest name as an explicit new search, corrected by nobody", () => {
    renderTypo();

    const choices = screen.getByTestId("appellations-list");
    const hrefs = within(choices)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      `${getLocalizedRoute("fr", "search")}?q=Aka`,
      `${getLocalizedRoute("fr", "search")}?q=Twa`,
    ]);
    expect(screen.queryByText("votre recherche")).toBeNull();
  });
});

// @req REQ-180
describe("empty structured fields are not declared silences", () => {
  // Every subject without structured dates was told « Aucune attestation
  // datée », including names whose fiche dates them: an empty field describes
  // what we projected, not what is known.
  // @req REQ-180
  it("never derives a knowledge gap from a missing date field", () => {
    renderFeed("Lingala", [subject("people", "PPL_LINGALA", "Lingala")]);

    expect(screen.queryByText(/attestation datée/i)).toBeNull();
  });
});

// @req REQ-180
describe("a missing short is not a missing source", () => {
  // The empty slot said « Aucune source que nous avons lue… » for a name whose
  // fiche holds sources: absence of a video is not absence of knowledge.
  // @req REQ-180
  it("never claims that no source answers the name", () => {
    const related: SearchCompanionsData = {
      ...noCompanions,
      subjects: [{ entityType: "people", entityId: "PPL_LINGALA" }],
      shorts: {
        count: 1,
        items: [
          {
            id: "short-kikongo",
            href: "/fr/decouvertes/kikongo",
            name: "Kikongo",
            description: "D’où vient le nom Kikongo ?",
            publishedAt: "2026-09-01",
            durationSeconds: 58,
            watchUrl: "https://example.org/watch",
            poster: { src: "/p.jpg", alt: "Kikongo", width: 90, height: 160 },
            source: { title: "EthniAfrica", url: null, tier: "referenced" },
            match: {
              relation: "linked-family",
              entityType: "languageFamily",
              entityId: "FLG_BANTU",
            },
          },
        ],
      },
    };
    render(
      <SearchFeed
        query="Lingala"
        language="fr"
        state="exact"
        results={[subject("people", "PPL_LINGALA", "Lingala")]}
        subjects={[subject("people", "PPL_LINGALA", "Lingala")]}
        leads={[]}
        companions={related}
      />
    );

    expect(screen.queryByText(/aucune source/i)).toBeNull();
  });
});
