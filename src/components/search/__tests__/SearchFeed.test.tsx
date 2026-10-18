import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { getFamilyRoute } from "@/lib/routing";
import { ANSWER_FIXTURES } from "@/lib/search/__fixtures__/answerFixtures";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import { readNaming } from "@/lib/search/naming";
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
  // The fixture's companions carry three recent shorts that are not about the
  // name: they are no reason to draw a shelf under the confession (brief 12,
  // part A).
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

  // Brief 12, part A (approved 2026-10-17): a reader who came with a name we
  // do not hold is asked for it once, under the confession, and nothing empty
  // is drawn after it.
  // @req REQ-180
  it("asks for an unknown name once, in the verdict, with no empty shelf or owed card", () => {
    const { container } = render(
      <SearchFeed
        query="voundou"
        language="fr"
        state="unknown"
        results={[]}
        subjects={[]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(screen.queryByText("Pas encore de short")).toBeNull();
    expect(screen.queryByText("Tout voir")).toBeNull();
    expect(screen.queryByText("Plusieurs noms peuvent coexister.")).toBeNull();
    expect(screen.queryByText("Nous nous sommes trompés ?")).toBeNull();
    expect(container.querySelector('[data-feed-part="invitation"]')).toBeNull();
    const actions = screen.getAllByRole("button", {
      name: "Proposer une source",
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].closest('[data-feed-block="verdict"]')).not.toBeNull();
  });

  // « pigmée » does not confess: its verdict answers, so it carries no button,
  // and its closing card stays the page's one invitation. The empty shelf goes
  // with the state, as for any unknown name.
  // @req REQ-180
  it("keeps the closing card as the one invitation of a reviewed answer with no fiche", () => {
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

    expect(screen.queryByText("Pas encore de short")).toBeNull();
    const actions = screen.getAllByRole("button", {
      name: "Proposer une source",
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].closest('[data-feed-block="verdict"]')).toBeNull();
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
  it("lists the searched form first, the name a people gives itself next, then the filed name", () => {
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
    expect(forms[0]).toContain("Peul");
    expect(forms[1]).toContain(selfName);
    expect(
      forms.findIndex((form) => form.includes("Fula (Fulbe / Peul)"))
    ).toBeGreaterThan(1);
  });

  // Doctrine §1.1: where the reader searched, the searched form comes first.
  // The filed label « Fula (Fulbe / Peul) » titled the « Tout » answer and
  // every lens, whatever form the reader had typed.
  // @req REQ-180
  it("titles the answer and the lenses with the form the reader searched", async () => {
    const fula = (query: string) => {
      const result = namedResult({
        type: "people",
        id: "PPL_FULA",
        name: "Fula (Fulbe / Peul)",
        answer: {
          ...ANSWER_FIXTURES.peul.answers[0],
          title: "Fula (Fulbe / Peul)",
        },
      });
      return render(
        <SearchFeed
          query={query}
          language="fr"
          state="exact"
          results={[result]}
          subjects={[result]}
          leads={[]}
          companions={emptyCompanions}
        />
      );
    };

    const fulani = fula("fulani");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /^Fulani$/
    );
    await userEvent.click(screen.getByRole("button", { name: /Fiches/ }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Fiches sur Fulani"
    );
    fulani.unmount();

    fula("peul");
    await userEvent.click(screen.getByRole("button", { name: /Fiches/ }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Fiches sur Peul"
    );
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

  // The comparison fold makes « Kono » and « Kɔnɔ » compare equal so that a
  // reader typing either reaches the fiche (REQ-135). It must never merge them
  // on screen: each spelling the corpus writes keeps its chip, and only the
  // one the reader typed is marked as their search. Reads the real fiches, so
  // the test fails if a fiche stops writing both spellings.
  // @req REQ-135
  it.each([
    {
      fiche: "FLG_MANDE/PPL_KONO.json",
      query: "Kono",
      expected: [
        { form: "Kono", searched: true, selfGiven: true },
        { form: "Konnoh", searched: false, selfGiven: false },
        { form: "Kɔnɔ", searched: false, selfGiven: false },
      ],
    },
    {
      fiche: "FLG_KWA/PPL_LARTEH.json",
      query: "Lete",
      expected: [
        { form: "Lete", searched: true, selfGiven: false },
        { form: "Gua", searched: false, selfGiven: true },
        { form: "Larteh", searched: false, selfGiven: false },
        { form: "Kyerepong", searched: false, selfGiven: false },
        { form: "Okere", searched: false, selfGiven: false },
        { form: "Late", searched: false, selfGiven: false },
        { form: "Lɛtɛ", searched: false, selfGiven: false },
      ],
    },
  ])(
    "keeps every spelling $fiche writes when « $query » is searched",
    ({ fiche, query, expected }) => {
      const source = JSON.parse(
        readFileSync(
          join(process.cwd(), "dataset/source/afrik/peuples", fiche),
          "utf8"
        )
      );
      const subject = namedResult({
        type: "people",
        id: source.id,
        name: source.nameMain,
        nameEn: undefined,
        autonym: source.content.appellations.selfAppellation,
        naming: readNaming("people", source.content),
      });
      const { container } = render(
        <SearchFeed
          query={query}
          language="fr"
          state="exact"
          results={[subject]}
          subjects={[subject]}
          leads={[]}
          companions={emptyCompanions}
        />
      );

      const chips = Array.from(
        container.querySelectorAll<HTMLElement>(
          '[data-testid="appellations-list"] [data-appellation]'
        ),
        (chip) => ({
          form: chip.querySelector("span")?.textContent,
          searched: chip.dataset.searched === "true",
          selfGiven: chip.dataset.selfGiven === "true",
        })
      );
      expect(chips).toEqual(expected);
    }
  );

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

/** A fiche whose filed name carries the corpus line of that same form. */
function ficheWithLine(
  type: SearchResult["type"],
  id: string,
  name: string,
  shortLine?: string,
  overrides: Partial<SearchResult> = {}
): SearchResult {
  return namedResult({
    type,
    id,
    name,
    nameEn: undefined,
    exactMatch: false,
    naming: {
      forms: [],
      eras: [],
      presentation: {
        forms: shortLine
          ? [
              {
                form: name,
                selfGiven: null,
                shortLine,
                attestations: [],
                evidence: [],
              },
            ]
          : [],
        eras: [],
        disagreements: [],
        evidence: [],
      },
    },
    ...overrides,
  });
}

const BELLO_LINE =
  "Un nom personnel musulman des Haoussa, qu'une étude dit venu du peul.";
const KROUMEN_LINE =
  "Un nom d'abord donné aux marins de la côte, que des peuples de Côte d'Ivoire ont fait leur.";

async function openFichesLens() {
  await userEvent.click(screen.getByRole("button", { name: /^Fiches/ }));
}

// Brief 12 part B (approved 2026-10-17): the lens sets the fiches that answer
// to the searched name apart from the ones found around it, and each card says
// in its own line what the fiche is about.
// @req REQ-180
describe("SearchFeed « Fiches » lens", () => {
  // @req REQ-180
  it("lists the fiches on the searched name first, then the ones around it, each with its own line", async () => {
    const fulbe = { peopleGroupId: "PGRP_FULANI" };
    const peul = ficheWithLine("people", "PPL_FULA", "Peul", undefined, {
      ...fulbe,
      peopleGroupLabel: "Fulbe (Peul / Fulani)",
      exactMatch: true,
    });
    const massina = ficheWithLine(
      "people",
      "PPL_FULANI_MASSINA",
      "Fulbe du Massina (Peuls du Massina / Macina)",
      undefined,
      { ...fulbe, peopleGroupLabel: "Fulbe (Peul / Fulani)" }
    );
    const bello = ficheWithLine("patronyme", "PAT_BELLO", "Bello", BELLO_LINE);
    const abdi = ficheWithLine("patronyme", "PAT_ABDI", "Abdi");
    // Subjects reach the feed as their own objects: they are matched to the
    // rows by type and id, never by identity.
    render(
      <SearchFeed
        query="peul"
        language="fr"
        state="exact"
        results={[peul, massina, bello, abdi]}
        subjects={[{ ...peul }, { ...massina }]}
        leads={[]}
        companions={emptyCompanions}
      />
    );
    await openFichesLens();

    const onName = screen.getByRole("heading", { name: "Sur ce nom · 1" });
    const around = screen.getByRole("heading", {
      name: "Autour de ce nom · 2",
    });
    expect(
      onName.compareDocumentPosition(around) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    const note = screen.getByText("Un contexte lié, pas le même nom.");
    expect(
      around.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    const onNameGroup = screen.getByRole("region", { name: "Sur ce nom · 1" });
    const group = within(onNameGroup).getByTestId("feed-people-group");
    expect(group).toHaveTextContent("Fulbe (Peul / Fulani)");
    expect(group).toHaveTextContent("2 fiches");
    expect(within(group).getByRole("link", { name: "Peul" })).toBeVisible();
    expect(
      within(group).getByRole("link", {
        name: "Fulbe du Massina (Peuls du Massina / Macina)",
      })
    ).toBeVisible();

    const aroundGroup = screen.getByRole("region", {
      name: "Autour de ce nom · 2",
    });
    expect(
      within(aroundGroup).getByRole("link", { name: /Bello/ })
    ).toHaveTextContent(BELLO_LINE);
    expect(
      within(aroundGroup).getByRole("link", { name: /Abdi/ })
    ).toHaveTextContent(/^NomAbdi$/);

    expect(screen.queryByText("Fiche EthniAfrica")).toBeNull();
    expect(
      screen.queryByText(
        "Pour aller au fond : chaque fiche, avec toutes ses sources."
      )
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Découvrir" })).toBeNull();
  });

  // @req REQ-180
  it("shows « Sur ce nom » alone when no other fiche is found", async () => {
    const kroumen = ficheWithLine(
      "people",
      "PPL_KROUMEN",
      "Kroumen",
      KROUMEN_LINE,
      { exactMatch: true }
    );
    render(
      <SearchFeed
        query="kroumen"
        language="fr"
        state="exact"
        results={[kroumen]}
        subjects={[kroumen]}
        leads={[]}
        companions={emptyCompanions}
      />
    );
    await openFichesLens();

    expect(
      screen.getByRole("heading", { name: "Sur ce nom · 1" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kroumen/ })).toHaveTextContent(
      KROUMEN_LINE
    );
    expect(screen.queryByText(/Autour de ce nom/)).toBeNull();
    expect(screen.queryByText("Un contexte lié, pas le même nom.")).toBeNull();
  });

  // A widened search has no subject: « Sur ce nom · 0 » would be a heading
  // over nothing.
  // @req REQ-180
  it("shows « Autour de ce nom » alone on a widened search, never « Sur ce nom · 0 »", async () => {
    render(
      <SearchFeed
        query="wassoulou"
        language="fr"
        state="widened"
        results={[
          ficheWithLine(
            "patronyme",
            "PAT_DIAKITE",
            "Diakité",
            "Un des quatre noms de clan des Peuls du Wassoulou ; son origine est incertaine."
          ),
          ficheWithLine(
            "patronyme",
            "PAT_COULIBALY",
            "Coulibaly",
            "Un nom de clan mandingue, écrit Kulibali en bambara ; son origine est discutée."
          ),
        ]}
        subjects={[]}
        leads={[]}
        companions={emptyCompanions}
      />
    );
    await openFichesLens();

    expect(
      screen.getByRole("heading", { name: "Autour de ce nom · 2" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Un contexte lié, pas le même nom.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sur ce nom/)).toBeNull();
  });

  // No name was searched on a relation browse, so there is nothing to set
  // apart: one grid, each card with its own line.
  // @req REQ-180
  it("lists a relation browse in one ungrouped grid, each card with its own line", async () => {
    const krou = { languageFamilyName: "Krou" };
    const peoples = [
      ficheWithLine(
        "people",
        "PPL_BETE",
        "Bété",
        "Un nom écrit pour la première fois vers 1901 ; son origine reste discutée.",
        krou
      ),
      ficheWithLine(
        "people",
        "PPL_DIDA",
        "Dida",
        "Un nom écrit en 1904 sous la forme Dyida ou Dida ; son origine reste inconnue.",
        krou
      ),
      ficheWithLine(
        "people",
        "PPL_GODIE",
        "Godié",
        "Le nom d'un peuple krou du sud-ouest ivoirien, écrit Godyé dès 1904 ; son origine est discutée.",
        krou
      ),
    ];
    render(
      <SearchFeed
        query=""
        language="fr"
        state="widened"
        results={peoples}
        subjects={[]}
        leads={[]}
        companions={emptyCompanions}
        relation={{ kind: "family", id: "FLG_KROU" }}
      />
    );
    await openFichesLens();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Fiches sur Krou"
    );
    expect(screen.queryByText(/Sur ce nom/)).toBeNull();
    expect(screen.queryByText(/Autour de ce nom/)).toBeNull();
    expect(screen.queryByText("Un contexte lié, pas le même nom.")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Découvrir" })).toBeNull();
    expect(screen.getByRole("link", { name: /Bété/ })).toHaveTextContent(
      "Un nom écrit pour la première fois vers 1901 ; son origine reste discutée."
    );
    expect(screen.getByRole("link", { name: /Dida/ })).toHaveTextContent(
      "Un nom écrit en 1904 sous la forme Dyida ou Dida ; son origine reste inconnue."
    );
    expect(screen.getByRole("link", { name: /Godié/ })).toHaveTextContent(
      "Le nom d'un peuple krou du sud-ouest ivoirien, écrit Godyé dès 1904 ; son origine est discutée."
    );
  });

  // The « Tout » shelf of a page with no answer is outside brief 12: it keeps
  // its heading, its subtitle and its generic line.
  // @req REQ-180
  it("leaves the « Tout » shelf of a related-only page as it was", () => {
    render(
      <SearchFeed
        query="wassoulou"
        language="fr"
        state="widened"
        results={[ficheWithLine("patronyme", "PAT_DIAKITE", "Diakité", "x")]}
        subjects={[]}
        leads={[]}
        companions={emptyCompanions}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Découvrir" })
    ).toBeInTheDocument();
    expect(screen.getByText("Fiche EthniAfrica")).toBeInTheDocument();
  });
});
