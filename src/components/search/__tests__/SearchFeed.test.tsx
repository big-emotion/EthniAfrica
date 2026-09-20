import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
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
      "lenses",
      "verdict",
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

  // @req REQ-180
  it("filters shelves in place without mutating the naming answer", async () => {
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

    expect(blockIds(container)).toEqual([
      "lenses",
      "verdict",
      "appellations",
      "shorts",
    ]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Mandé"
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
                href: "/fr/familles/mande",
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
  it("carries the approved first-screen geometry without duplicating blocks", () => {
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

    expect(container.querySelector('[data-feed-block="lenses"]')).toHaveClass(
      "min-[1200px]:max-w-[640px]"
    );
    const answer = container.querySelector('[data-feed-opening="answer"]');
    expect(answer).toHaveClass(
      "min-[1200px]:grid",
      "min-[1200px]:grid-cols-12",
      "min-[1200px]:gap-afh-6xl",
      "min-[1200px]:pt-afh-5xl"
    );
    expect(answer?.querySelector('[data-feed-block="verdict"]')).toHaveClass(
      "min-[1200px]:col-span-7"
    );
    expect(
      answer?.querySelector('[data-feed-block="appellations"]')
    ).toHaveClass("min-[1200px]:col-span-5");
    expect(container.querySelector('[data-feed-opening="shorts"]')).toHaveClass(
      "mt-afh-lg",
      "min-[1200px]:mt-afh-5xl"
    );
    expect(
      container.querySelectorAll('[data-feed-block="verdict"]')
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
        "L’atlas a trouvé des fiches liées sans établir qu’elles répondent à ce nom."
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
        "L’atlas a trouvé des fiches liées sans établir qu’elles répondent à ce nom."
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

  // @req REQ-180
  it("describes a recorded naming problem without reusing shared-name copy", () => {
    const result = namedResult({
      naming: {
        forms: [],
        eras: [],
        presentation: {
          forms: [],
          eras: [],
          disagreements: [],
          problematic: "recorded",
          evidence: [],
        },
      },
    });
    render(
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

    expect(
      screen.getByText(
        "Le corpus signale un problème ou un désaccord autour d’au moins une forme de ce nom."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Une orthographe partagée ne suffit pas à établir une parenté entre des peuples."
      )
    ).toBeNull();
  });

  // @req REQ-180
  it("renders near-name copy only from the qualified similarity projection", () => {
    const subject = namedResult({
      type: "people",
      id: "PPL_BASSA",
      name: "Bassa",
    });
    const ordinaryResult = namedResult({
      type: "people",
      id: "PPL_TEXT_MATCH",
      name: "Unrelated text match",
      exactMatch: false,
    });
    const { container } = render(
      <SearchFeed
        query="Bassa"
        language="fr"
        state="exact"
        results={[subject, ordinaryResult]}
        subjects={[subject]}
        leads={[]}
        nearNames={[
          {
            type: "people",
            id: "PPL_BASSARI",
            name: "Bassari",
            similarity: 0.72,
          },
        ]}
        companions={emptyCompanions}
      />
    );

    const nearName = container.querySelector('[data-feed-block="near-name"]');
    expect(nearName).toHaveTextContent(
      "Bassari a une graphie proche et correspond à une autre fiche de l’atlas."
    );
    expect(nearName).not.toHaveTextContent("aucun lien");
    expect(nearName).not.toHaveTextContent("Unrelated text match");
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
  it("declares dating silences per undated subject", () => {
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

    const silences = container.querySelector('[data-feed-part="silences"]');
    expect(silences).toHaveTextContent("Bassa Nge");
    expect(silences).not.toHaveTextContent("Bassa —");
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
        '[data-testid="appellations-mobile"] [data-appellation][data-subject-id]'
      )
    ).toHaveLength(2);
  });

  // "Yoruba" files both a people and a language in the AFRIK corpus —
  // selectNameSubject puts no type restriction on an exact match, so a
  // cross-type clash reaches SearchFeed the same way a same-type one
  // (Bassa) does. Answering only the first would silently promote one
  // form over the other, which DEC-057 exists to prevent.
  // @req REQ-178
  it("disambiguates a cross-type name clash without promoting either type", () => {
    const subjects = [
      namedResult({
        type: "people",
        id: "PPL_YORUBA",
        name: "Yoruba",
        nameEn: undefined,
      }),
      namedResult({
        type: "language",
        id: "yor",
        name: "Yoruba",
        nameEn: undefined,
      }),
    ];
    render(
      <SearchFeed
        query="Yoruba"
        language="fr"
        state="exact"
        results={subjects}
        subjects={subjects}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Yoruba" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("2 entrées de l’atlas portent ce nom.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Les entrées qui partagent ce nom",
      })
    ).toBeInTheDocument();
    const peoplesBlock = screen.getByTestId("feed-block-peoples");
    expect(
      within(peoplesBlock).getByText("Peuple documenté")
    ).toBeInTheDocument();
    expect(within(peoplesBlock).getByText("Langue")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Un même nom porté par des entrées de nature différente ne les relie pas entre elles."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Une orthographe partagée ne suffit pas à établir une parenté entre des peuples."
      )
    ).not.toBeInTheDocument();
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
