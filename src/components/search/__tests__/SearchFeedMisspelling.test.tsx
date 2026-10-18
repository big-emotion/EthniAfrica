import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SearchCompanionsData } from "@/api/v2/schemas/searchCompanions";
import { SearchFeed } from "@/components/search/SearchFeed";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import type { SearchLead, SearchResult } from "@/types/afrik-frontend";

const copy = searchFeedCopy.fr;

const noCompanions: SearchCompanionsData = {
  subjects: [],
  shorts: { count: 0, items: [] },
  anecdotes: { count: 0, items: [] },
  proverbs: { count: 0, items: [] },
  quiz: { count: 0, item: null },
};

// Testing Library compares an element's text with its spaces folded, the
// no-break ones included; the copy keeps them, so it is folded the same way.
function asShown(text: string): string {
  return text.replace(/\s+/g, " ");
}

function familyNameLead(id: string, name: string): SearchLead {
  return { type: "patronyme", id, name, similarity: 0.5 };
}

// What the search finds for a family name it also offers as a lead: the same
// fiche, reached by its spelling.
function familyNameFiche(id: string, name: string): SearchResult {
  return { type: "patronyme", id, name, exactMatch: false };
}

function peopleFiche(id: string, name: string, shortLine: string) {
  return {
    type: "people",
    id,
    name,
    exactMatch: false,
    naming: {
      forms: [],
      eras: [],
      presentation: {
        forms: [
          {
            form: name,
            selfGiven: true,
            shortLine,
            attestations: [],
            evidence: [],
          },
        ],
        eras: [],
        disagreements: [],
        evidence: [],
      },
    },
  } satisfies SearchResult;
}

// « tchikaya » (boards search-state-typo, brief 16, proposed): the search
// finds the family name Tchicaya by its spelling and offers it as the lead
// (DEC-075). Chukwu, reached by its sound alone, is withheld by the API.
const tchicayaLead = familyNameLead("PAT_TCHICAYA", "Tchicaya");
const tchicayaFiche = familyNameFiche("PAT_TCHICAYA", "Tchicaya");

// « sanoh » (Main's example, from the corpus model): Sanogo and Sanou begin
// like it, and the Kuranko fiche names Sanoh among its clans.
const sanohLeads = [
  familyNameLead("PAT_SANOGO", "Sanogo"),
  familyNameLead("PAT_SANOU", "Sanou"),
];
const kurankoLine =
  "Le nom d'un peuple mandé de Sierra Leone et de Guinée, écrit dès 1825.";
const kurankoFiche = peopleFiche("PPL_KURANKO", "Kuranko", kurankoLine);
const sanohResults: SearchResult[] = [
  familyNameFiche("PAT_SANOGO", "Sanogo"),
  familyNameFiche("PAT_SANOU", "Sanou"),
  kurankoFiche,
];

function renderMisspelling({
  query = "tchikaya",
  results = [tchicayaFiche],
  leads = [tchicayaLead],
  companions = noCompanions,
}: {
  query?: string;
  results?: SearchResult[];
  leads?: SearchLead[];
  companions?: SearchCompanionsData;
} = {}) {
  return render(
    <SearchFeed
      query={query}
      language="fr"
      state="typo"
      results={results}
      subjects={[]}
      leads={leads}
      companions={companions}
      resultCount={results.length}
    />
  );
}

function renderSanoh(
  overrides: {
    results?: SearchResult[];
    companions?: SearchCompanionsData;
  } = {}
) {
  return renderMisspelling({
    query: "sanoh",
    results: sanohResults,
    leads: sanohLeads,
    ...overrides,
  });
}

function blockIds(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-feed-block]"),
    (element) => element.dataset.feedBlock ?? ""
  );
}

function filterNames(): string[] {
  const filters = screen.getByRole("navigation", {
    name: copy.filters.label,
  });
  // A filter shows its label and its count as two words.
  return within(filters)
    .getAllByRole("button")
    .map((button) =>
      Array.from(button.children, (part) => part.textContent ?? "").join(" ")
    );
}

// @req REQ-125
describe("a misspelling whose only fiche found is its lead", () => {
  // The chip already runs the search that leads to the fiche Tchicaya. Listed
  // again as « a fiche found », the lead would be a second way to the same
  // name, and would read as linked to « tchikaya » by more than its spelling.
  // @req REQ-201
  it("does not repeat the lead as a fiche card, so it draws no fiches block and no filter bar", () => {
    const { container } = renderMisspelling();

    expect(screen.queryByTestId("feed-block-fiches")).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: copy.filters.label })
    ).toBeNull();
    expect(screen.getAllByRole("link", { name: "Tchicaya" })).toHaveLength(1);
    expect(blockIds(container)).toEqual(["verdict", "appellations", "further"]);
  });

  // @req REQ-125
  it("names the one choice in its verdict and in the singular heading of the choice", () => {
    renderMisspelling();

    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(copy.answer.typoSummary("tchikaya", ["Tchicaya"]))
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.answer.typoChoices(1),
      })
    ).toHaveClass(
      "text-afh-small",
      "font-bold",
      "text-[color:var(--accent-ink)]"
    );
  });

  // The choice is the page's one action: the name chip of Main in the body
  // font, with the accent, so it stands apart from the neutral filter pills.
  // Its ink is the one the accent fill carries in both themes: the page's
  // body ink turns light at night, on a tint that stays light.
  // @req REQ-180
  it("draws each choice as an accented name chip, legible by day and by night", () => {
    renderMisspelling();

    const choice = within(screen.getByTestId("appellations-list")).getByRole(
      "link",
      { name: "Tchicaya" }
    );
    expect(choice).toHaveClass(
      "min-h-11",
      "rounded-afh-full",
      "border-[color:var(--accent)]",
      "bg-[color:var(--accent-tint)]",
      "text-afh-small",
      "font-bold",
      "text-[color:var(--accent-foreground)]"
    );
    expect(choice).not.toHaveClass("text-afh-text");
    expect(choice.className).not.toMatch(/font-afh-display/);
    expect(screen.getByTestId("appellations-list")).toHaveClass("gap-afh-sm");
  });

  // A reader whose family writes « tchikaya » can say so: a sourced spelling
  // restores the name (DEC-075). The choice stays the page's one action, so
  // the invitation is a note and a quiet link, never a second accented button.
  // @req REQ-180
  it("lets a reader who writes the name this way propose a source, quietly, after the choice", () => {
    renderMisspelling();

    const choices = screen.getByTestId("feed-block-appellations");
    const invitation = within(choices).getByText(
      asShown(copy.answer.typoInvitation("tchikaya"))
    );
    expect(invitation).toHaveClass("text-afh-caption", "text-afh-text-soft");
    const actions = screen.getAllByRole("button", {
      name: "Proposer une source",
    });
    expect(actions).toHaveLength(1);
    const [action] = actions;
    expect(action).toHaveClass(
      "min-h-11",
      "font-bold",
      "underline",
      "text-[color:var(--accent-ink)]"
    );
    expect(action.className).not.toMatch(
      /accent-tint|border-\[color:var\(--accent\)\]/
    );
    const choice = within(choices).getByRole("link", { name: "Tchicaya" });
    expect(
      choice.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // With nothing the data links left to list, there is no block to title.
  // @req REQ-180
  it("draws no fiches block when the search found none", () => {
    const { container } = renderMisspelling({ results: [] });

    expect(screen.queryByTestId("feed-block-fiches")).toBeNull();
    expect(blockIds(container)).toEqual(["verdict", "appellations", "further"]);
  });
});

// @req REQ-125
describe("a misspelling that also finds other fiches", () => {
  // Every approved board draws the filters first, 12 px under the field. Set
  // after the choices, the pressed « Tout » read as the selected option of a
  // set holding the name.
  // @req REQ-178
  it("draws the filters first, then the verdict, the choices and the fiches", () => {
    const { container } = renderSanoh();

    expect(blockIds(container)).toEqual([
      "lenses",
      "verdict",
      "appellations",
      "fiches",
      "further",
    ]);
  });

  // @req REQ-125
  it("speaks of several choices in the plural", () => {
    renderSanoh();

    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(copy.answer.typoSummary("sanoh", ["Sanogo", "Sanou"]))
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.answer.typoChoices(2),
      })
    ).toBeVisible();
  });

  // The fiches block says what it holds and that none bears the spelling
  // typed; each card carries its fiche's own line, never « Fiche
  // EthniAfrica ». The leads stay choices only.
  // @req REQ-201
  it("lists only the fiches that are not a choice, under the caution, each with its own line", () => {
    renderSanoh();

    const fiches = screen.getByTestId("feed-block-fiches");
    expect(
      within(fiches).getByRole("heading", {
        level: 2,
        name: copy.answer.fichesFound.title(1),
      })
    ).toBeVisible();
    expect(fiches).toHaveTextContent(
      asShown(copy.answer.fichesFound.note(1, "sanoh"))
    );
    expect(within(fiches).getByText("Kuranko")).toBeVisible();
    expect(within(fiches).getByText(kurankoLine)).toBeVisible();
    expect(within(fiches).queryByText("Sanogo")).toBeNull();
    expect(within(fiches).queryByText("Sanou")).toBeNull();
    expect(within(fiches).queryByText("Découvrir")).toBeNull();
    expect(within(fiches).queryByText(copy.labels.fichesSubtitle)).toBeNull();
    expect(within(fiches).queryByText(copy.blocks.ficheMeta)).toBeNull();
  });

  // The « Fiches » count is what the filter shows, not the API's total with
  // the leads in it.
  // @req REQ-180
  it("counts in the « Fiches » filter only the fiches it lists", () => {
    renderSanoh();

    expect(filterNames()).toEqual([
      copy.filters.all,
      `${copy.filters.fiches} 1`,
    ]);
  });

  // The companions come from the first lead when nothing answers. Until the
  // reader chooses it, a « Jeux » lens titled « sanoh » over a game about
  // Sanogo would treat the two names as one.
  // @req REQ-180
  it("offers no filter built from a lead the reader has not chosen", () => {
    const loaded = FEED_CASES.find(({ id }) => id === "mande")!.production
      .companions;
    expect(loaded.quiz.item).not.toBeNull();
    expect(loaded.shorts.items.length).toBeGreaterThan(0);

    renderSanoh({ companions: loaded });

    expect(filterNames().map((name) => name.replace(/ \d+$/, ""))).toEqual([
      copy.filters.all,
      copy.filters.fiches,
    ]);
  });

  // One column below 768 px, as the « Fiches » lens: each card carries a
  // line too long for half of a 382 px phone column (no 430 px step).
  // @req REQ-180
  it("keeps the fiches in one column below 768 px", () => {
    renderSanoh({
      results: [
        ...sanohResults,
        peopleFiche("PPL_KONO", "Kono", "Un nom de peuple."),
      ],
    });

    const grid = within(screen.getByTestId("feed-block-fiches")).getByRole(
      "list"
    );
    expect(grid).toHaveClass("grid-cols-1", "min-[768px]:grid-cols-2");
    expect(grid.className).not.toMatch(/min-\[430px\]/);
  });
});
