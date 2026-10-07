import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { getFamilyRoute } from "@/lib/routing";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import type { SearchResult } from "@/types/afrik-frontend";

function fixture(id: string) {
  const value = FEED_CASES.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`Missing fixture ${id}`);
  return value;
}

function blockIds(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-feed-block]"),
    (element) => element.dataset.feedBlock ?? ""
  );
}

const emptyCompanions: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  images: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

function namedResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    type: "country",
    id: "TCD",
    name: "Tchad",
    nameEn: "Chad",
    exactMatch: true,
    naming: {
      forms: [],
      eras: [],
      presentation: {
        forms: [],
        eras: [],
        disagreements: [],
        evidence: [],
      },
    },
    ...overrides,
  };
}

// @req REQ-180
describe("SearchFeed", () => {
  // @req REQ-180
  it("renders the deterministic unknown-name movement without substitute shelves", () => {
    const value = fixture("inconnu");
    const { container } = render(
      <SearchFeed
        query={value.query}
        language="fr"
        state="unknown"
        results={value.production.search.results}
        subjects={value.production.search.results}
        leads={value.production.search.leads}
        companions={value.production.companions}
      />
    );

    expect(blockIds(container)).toEqual([
      "verdict",
      "lenses",
      "shorts",
      "owed",
      "further",
    ]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "kossiwa"
    );
    expect(
      screen.getByText("Nous ne connaissons pas ce nom.")
    ).toBeInTheDocument();
  });

  // « pigmée » reaches no fiche, yet the reviewed answer for « Pygmée » covers
  // it. The confession is a claim about the corpus; it cannot stand above an
  // answer the corpus holds.
  // @req REQ-178
  it("answers from a reviewed answer instead of confessing when no fiche matched", () => {
    render(
      <SearchFeed
        query="pigmée"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={emptyCompanions}
        nameAnswers={[
          {
            term: "Pygmée",
            subjects: [{ type: "people", id: "PPL_TWA" }],
            paragraphs: [
              "« Pygmée » n'est pas un nom que ces peuples se donnent.",
            ],
            sources: [],
          },
        ]}
      />
    );

    expect(screen.queryByText("Nous ne connaissons pas ce nom.")).toBeNull();
    expect(
      screen.getByText(/n'est pas un nom que ces peuples se donnent/)
    ).toBeInTheDocument();
  });

  // No entity answers to « zombie », but we made a piece on the word. The page
  // cannot admit it does not know the name while showing that piece: it says
  // what it has, keeps the closing it always owes, and leaves out the empty
  // slot that exists for names nobody has told yet.
  // @req REQ-180
  it("answers a word we have a piece on with what we hold, not with the confession", () => {
    const inconnu = fixture("inconnu");
    const [recent] = inconnu.production.companions.shorts.items;
    const companions: SearchCompanionsData = {
      ...inconnu.production.companions,
      shorts: {
        count: 1,
        items: [
          {
            ...recent,
            name: "zombie",
            match: { relation: "word", word: "zombie" },
          },
        ],
      },
    };
    const { container } = render(
      <SearchFeed
        query="zombie"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={companions}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "zombie"
    );
    expect(screen.queryByText("Nous ne connaissons pas ce nom.")).toBeNull();
    expect(
      screen.getByText(
        "Nous n’avons pas de fiche pour ce nom, mais nous avons une vidéo sur son origine."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("D’où vient le nom « zombie » ?")
    ).toBeInTheDocument();
    expect(screen.queryByText("Pas encore de short")).toBeNull();
    expect(
      container.querySelector('[data-companion-relation="word"]')
    ).toBeNull();
    expect(
      container.querySelector("[data-feed-part='conviction']")
    ).not.toBeNull();
    expect(
      container.querySelector("[data-feed-part='invitation']")
    ).not.toBeNull();
  });

  // The live search returns related fiches for most words (« mami wata » finds
  // ten), so a word piece usually meets the widened state, not the unknown one.
  // The widened state blanks every shelf so no unrelated content sits under a
  // related-only answer; a piece found by the reader's word is not unrelated.
  // @req REQ-180
  it("keeps a word piece on a related-only page and says what we hold", () => {
    const inconnu = fixture("inconnu");
    const [recent] = inconnu.production.companions.shorts.items;
    const companions: SearchCompanionsData = {
      ...inconnu.production.companions,
      shorts: {
        count: 1,
        items: [
          {
            ...recent,
            name: "Mami Wata",
            match: { relation: "word", word: "mami wata" },
          },
        ],
      },
    };
    render(
      <SearchFeed
        query="mami wata"
        language="fr"
        state="widened"
        results={[namedResult()]}
        subjects={[]}
        leads={[]}
        companions={companions}
      />
    );

    expect(
      screen.getByText("D’où vient le nom « Mami Wata » ?")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nous n’avons pas de fiche pour ce nom, mais nous avons une vidéo sur son origine."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Pas encore de short")).toBeNull();
    expect(screen.queryByText(/fiches liées sans établir/)).toBeNull();
  });

  // @req REQ-180
  it("still blanks the shelves of a related-only page when no piece answers the word", () => {
    const recent = fixture("inconnu").production.companions;
    render(
      <SearchFeed
        query="sahel"
        language="fr"
        state="widened"
        results={[namedResult()]}
        subjects={[]}
        leads={[]}
        companions={recent}
      />
    );

    expect(screen.queryByText(recent.shorts.items[0].name)).toBeNull();
  });

  // @req REQ-180
  it("keeps the confession for a name no piece answers", () => {
    const inconnu = fixture("inconnu");
    render(
      <SearchFeed
        query="kossiwa"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={inconnu.production.companions}
      />
    );

    expect(
      screen.getByText("Nous ne connaissons pas ce nom.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/nous avons une vidéo sur son origine/)
    ).toBeNull();
  });

  // A filter replaces the page by what the reader asked to see; the name stays
  // the heading, and « Tout » is one click away.
  // @req REQ-178
  it("shows only the shorts under their filter, under a heading about the name", async () => {
    const value = fixture("mande");
    const { container } = render(
      <SearchFeed
        query={value.query}
        language="fr"
        state="exact"
        results={value.production.search.results}
        subjects={value.production.search.results}
        leads={value.production.search.leads}
        companions={value.production.companions}
      />
    );

    expect(blockIds(container)).toContain("fiches");
    await userEvent.click(screen.getByRole("button", { name: /Shorts 6/ }));

    expect(blockIds(container)).toEqual(["lenses", "shorts"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Vidéos sur Mandé"
    );
  });

  // @req REQ-180
  it("renders reviewed presentation copy and keeps lens totals separate from visible cards", () => {
    const value = fixture("mande");
    const visibleResult = value.production.search.results[0]!;
    const { container } = render(
      <SearchFeed
        query={value.query}
        language="fr"
        state="exact"
        results={[visibleResult]}
        subjects={[visibleResult]}
        leads={[]}
        companions={value.production.companions}
        resultCount={34}
        presentation={{
          answer: {
            name: "Mandé",
            verdict: "Un nom venu du dehors.",
            summary: "Reviewed fixture summary.",
          },
          fiches: {
            items: [
              {
                kind: "Famille",
                name: "Mandé",
                meta: "31 peuples",
                href: getFamilyRoute("fr", "mande"),
              },
            ],
          },
        }}
      />
    );

    expect(screen.getByText("Un nom venu du dehors.")).toBeInTheDocument();
    expect(screen.getByText("Reviewed fixture summary.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fiches 34/ })).toBeVisible();
    expect(
      container.querySelectorAll('[data-feed-block="fiches"] li')
    ).toHaveLength(1);
  });

  // @req REQ-180
  it("marks the localized filed name as the searched English form", () => {
    const result = namedResult();
    const { container } = render(
      <SearchFeed
        query="Chad"
        language="en"
        state="exact"
        results={[result]}
        subjects={[result]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(
      container.querySelector('[data-appellation][data-searched="true"]')
    ).toHaveTextContent("Chad");
  });

  // @req REQ-180
  it("does not draw an empty origins block from a marker without origin facts", () => {
    const result = namedResult({
      naming: {
        forms: [],
        eras: [],
        presentation: {
          forms: [],
          eras: [],
          disagreements: [],
          origin: "recorded",
          evidence: [],
        },
      },
    });
    const { container } = render(
      <SearchFeed
        query="Tchad"
        language="fr"
        state="exact"
        results={[result]}
        subjects={[result]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(blockIds(container)).not.toContain("origins");
  });

  // @req REQ-178
  it("keeps related-only results non-confessional and does not invent a silence", () => {
    const result = namedResult();
    const recentCompanions = fixture("inconnu").production.companions;
    const { container } = render(
      <SearchFeed
        query="sahel"
        language="fr"
        state="widened"
        results={[result]}
        subjects={[]}
        leads={[]}
        companions={recentCompanions}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "sahel"
    );
    expect(
      screen.getByText(
        "Nous avons trouvé des fiches liées sans établir qu’elles répondent à ce nom."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Nous ne connaissons pas ce nom.")).toBeNull();
    expect(container.querySelector('[data-feed-block="owed"]')).toBeNull();
    expect(container.querySelector('[data-feed-part="silences"]')).toBeNull();
    expect(
      screen.queryByText(recentCompanions.shorts.items[0].name)
    ).toBeNull();
  });

  // @req REQ-178
  it("names the family being browsed, rather than confessing an unmatched name search", () => {
    const result = namedResult({
      type: "people",
      id: "PPL_KROU",
      name: "Peuple Krou",
      languageFamilyName: "Krou",
      languageFamilyNameEn: "Kru",
    });
    const recentCompanions = fixture("inconnu").production.companions;
    render(
      <SearchFeed
        query=""
        language="fr"
        state="widened"
        results={[result]}
        subjects={[]}
        leads={[]}
        companions={recentCompanions}
        relation={{ kind: "family", id: "FLG_KROU" }}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Krou");
    expect(
      screen.getByText("Les peuples de la famille Krou.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Nous avons trouvé des fiches liées sans établir qu’elles répondent à ce nom."
      )
    ).toBeNull();
  });

  // @req REQ-178
  it("names the country being browsed, with the right preposition", () => {
    const result = namedResult({
      type: "people",
      id: "PPL_WOLOF",
      name: "Wolof",
    });
    const recentCompanions = fixture("inconnu").production.companions;
    render(
      <SearchFeed
        query=""
        language="fr"
        state="widened"
        results={[result]}
        subjects={[]}
        leads={[]}
        companions={recentCompanions}
        relation={{ kind: "country", id: "SEN" }}
      />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sénégal"
    );
    expect(
      screen.getByText("Les peuples présents au Sénégal.")
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("lists the name a people gives itself first, then the filed name and the others", () => {
    const selfName = "Fulbe (pluriel), Pullo (singulier)";
    const result = namedResult({
      type: "people",
      id: "PPL_FULA",
      name: "Fula (Fulbe / Peul)",
      nameEn: "Fula (Fulbe / Peul)",
      autonym: selfName,
      naming: {
        forms: [],
        eras: [],
        presentation: {
          forms: [
            {
              form: selfName,
              selfGiven: true,
              attestations: [],
              evidence: [],
            },
            {
              form: "Peul",
              selfGiven: false,
              attestations: [],
              evidence: [],
            },
          ],
          eras: [],
          disagreements: [],
          evidence: [],
        },
      },
    });
    const { container } = render(
      <SearchFeed
        query="peul"
        language="fr"
        state="exact"
        results={[result]}
        subjects={[result]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    const block = container.querySelector('[data-feed-block="appellations"]');
    const forms = Array.from(
      block?.querySelectorAll<HTMLElement>("[data-appellation]") ?? [],
      (chip) => chip.textContent ?? ""
    );
    expect(forms[0]).toContain(selfName);
    expect(
      forms.findIndex((form) => form.includes("Fula (Fulbe / Peul)"))
    ).toBeGreaterThan(0);
  });

  // @req REQ-180
  it("omits the dated-attestation silence when the corpus dates a form", () => {
    const result = namedResult({
      naming: {
        forms: [],
        eras: [],
        presentation: {
          forms: [
            {
              form: "Tchad",
              selfGiven: null,
              attestationPeriod: "1900",
              attestations: [],
              evidence: [],
            },
          ],
          eras: [],
          disagreements: [],
          evidence: [],
        },
      },
    });
    const { container } = render(
      <SearchFeed
        query="Tchad"
        language="fr"
        state="exact"
        results={[result]}
        subjects={[result]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(container.querySelector('[data-feed-block="owed"]')).not.toBeNull();
    expect(container.querySelector('[data-feed-part="silences"]')).toBeNull();
  });

  // @req REQ-180
  it("declares no dating silence for a subject merely lacking structured dates", () => {
    const dated = namedResult({
      type: "people",
      id: "PPL_DATED",
      name: "Bassa",
      nameEn: undefined,
      naming: {
        forms: [],
        eras: [],
        presentation: {
          forms: [
            {
              form: "Bassa",
              selfGiven: null,
              attestationPeriod: "1900",
              attestations: [],
              evidence: [],
            },
          ],
          eras: [],
          disagreements: [],
          evidence: [],
        },
      },
    });
    const undated = namedResult({
      type: "people",
      id: "PPL_UNDATED",
      name: "Bassa Nge",
      nameEn: undefined,
    });
    const { container } = render(
      <SearchFeed
        query="Bassa"
        language="fr"
        state="exact"
        results={[dated, undated]}
        subjects={[dated, undated]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    // An empty date field describes what was projected, not what is known.
    expect(container.querySelector('[data-feed-part="silences"]')).toBeNull();
  });

  // @req REQ-180
  it("keeps the same spelling once for each distinct subject", () => {
    const subjects = ["PPL_BASSA_A", "PPL_BASSA_B"].map((id) =>
      namedResult({
        type: "people",
        id,
        name: "Bassa",
        nameEn: undefined,
      })
    );
    const { container } = render(
      <SearchFeed
        query="Bassa"
        language="fr"
        state="exact"
        results={subjects}
        subjects={subjects}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(
      container.querySelectorAll(
        '[data-testid="appellations-list"] [data-appellation][data-subject-id]'
      )
    ).toHaveLength(2);
  });

  // @req REQ-002
  it("groups split people fiches and preserves privacy-safe click analytics", async () => {
    const onResultNavigate = vi.fn();
    const members: SearchResult[] = ["PPL_PEUL", "PPL_PEUL_MASSINA"].map(
      (id, index) => ({
        type: "people",
        id,
        name: index === 0 ? "Peul" : "Peul du Massina",
        peopleGroupId: "peul",
        peopleGroupLabel: "Peul",
      })
    );
    render(
      <SearchFeed
        query="Peul"
        language="fr"
        state="exact"
        results={members}
        subjects={[members[0]]}
        leads={[]}
        companions={emptyCompanions}
        onResultNavigate={onResultNavigate}
      />
    );

    expect(screen.getByTestId("feed-people-group")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("link", { name: "Peul du Massina" })
    );
    expect(onResultNavigate).toHaveBeenCalledWith("peopleGroup", 1);
  });
});
