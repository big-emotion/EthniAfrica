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

const tchicayaLead: SearchLead = {
  type: "patronyme",
  id: "PAT_TCHICAYA",
  name: "Tchicaya",
  similarity: 0.5,
};

// Testing Library compares an element's text with its spaces folded, the
// no-break ones included; the copy keeps them, so it is folded the same way.
function asShown(text: string): string {
  return text.replace(/\s+/g, " ");
}

// The fiche the search found, linked to « tchikaya » by its spelling. Its
// line is the one its name history gives the form « Tchicaya ».
const tchicayaFiche: SearchResult = {
  type: "patronyme",
  id: "PAT_TCHICAYA",
  name: "Tchicaya",
  exactMatch: false,
  naming: {
    forms: [],
    eras: [],
    presentation: {
      forms: [
        {
          form: "Tchicaya",
          selfGiven: null,
          shortLine: "Un nom de famille écrit dès 1947 au Journal officiel.",
          attestations: [],
          evidence: [],
        },
      ],
      eras: [],
      disagreements: [],
      evidence: [],
    },
  },
};

function renderMisspelling({
  results = [tchicayaFiche],
  leads = [tchicayaLead],
  companions = noCompanions,
}: {
  results?: SearchResult[];
  leads?: SearchLead[];
  companions?: SearchCompanionsData;
} = {}) {
  return render(
    <SearchFeed
      query="tchikaya"
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

function blockIds(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-feed-block]"),
    (element) => element.dataset.feedBlock ?? ""
  );
}

// Board search-state-typo-fiches (brief 16, proposed): « tchikaya » finds
// the fiche Tchicaya, which does not bear the name, and the search offers
// Tchicaya as the spelling the reader probably meant (DEC-075).
// @req REQ-125
describe("a misspelling that also finds fiches", () => {
  // Every approved board draws the filters first, 12 px under the field. Set
  // after the choices, the pressed « Tout » read as the selected option of a
  // set holding the name.
  // @req REQ-178
  it("draws the filters first, then the verdict, the choices and the fiches", () => {
    const { container } = renderMisspelling();

    expect(blockIds(container)).toEqual([
      "lenses",
      "verdict",
      "appellations",
      "fiches",
      "further",
    ]);
  });

  // The companions come from the first lead when nothing answers. Until the
  // reader chooses it, a « Jeux » lens titled « tchikaya » over a game about
  // Tchicaya would treat the two names as one.
  // @req REQ-180
  it("offers no filter built from a lead the reader has not chosen", () => {
    const loaded = FEED_CASES.find(({ id }) => id === "mande")!.production
      .companions;
    expect(loaded.quiz.item).not.toBeNull();
    expect(loaded.shorts.items.length).toBeGreaterThan(0);

    renderMisspelling({ companions: loaded });

    const filters = screen.getByRole("navigation", {
      name: copy.filters.label,
    });
    expect(
      within(filters)
        .getAllByRole("button")
        .map((button) => button.textContent?.replace(/\d+$/, "").trim())
    ).toEqual([copy.filters.all, copy.filters.fiches]);
  });

  // @req REQ-125
  it("names the one nearest name in its verdict and in the singular heading of the choice", () => {
    renderMisspelling();

    const verdict = screen.getByTestId("feed-block-verdict");
    expect(verdict).toHaveTextContent(
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

  // @req REQ-125
  it("speaks of several nearest names in the plural", () => {
    renderMisspelling({
      leads: [
        tchicayaLead,
        { ...tchicayaLead, id: "PAT_TCHIKAYI", name: "Tchikayi" },
      ],
    });

    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(copy.answer.typoSummary("tchikaya", ["Tchicaya", "Tchikayi"]))
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.answer.typoChoices(2),
      })
    ).toBeVisible();
  });

  // The choice is the page's one action: the name chip of Main in the body
  // font, with the accent, so it stands apart from the neutral filter pills.
  // @req REQ-180
  it("draws each choice as an accented name chip that runs a new search", () => {
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
      "font-bold"
    );
    expect(choice.className).not.toMatch(/font-afh-display/);
    expect(screen.getByTestId("appellations-list")).toHaveClass("gap-afh-sm");
  });

  // A reader whose family writes « tchikaya » can say so, with the button of
  // the unknown-name page: a sourced spelling restores the name (DEC-075). It
  // comes after the choice, which stays the first thing to do.
  // @req REQ-180
  it("lets a reader who writes the name this way propose a source, after the choice", () => {
    renderMisspelling();

    const choices = screen.getByTestId("feed-block-appellations");
    expect(choices).toHaveTextContent(
      asShown(copy.answer.typoInvitation("tchikaya"))
    );
    const actions = screen.getAllByRole("button", {
      name: "Proposer une source",
    });
    expect(actions).toHaveLength(1);
    const choice = within(choices).getByRole("link", { name: "Tchicaya" });
    expect(
      choice.compareDocumentPosition(actions[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // The fiches block says what it holds and that none bears the name; each
  // card carries its fiche's own line, never « Fiche EthniAfrica ».
  // @req REQ-180
  it("lists the fiches found under the related-only caution, each with its own line", () => {
    renderMisspelling();

    const fiches = screen.getByTestId("feed-block-fiches");
    expect(
      within(fiches).getByRole("heading", {
        level: 2,
        name: copy.answer.fichesFound.title(1),
      })
    ).toBeVisible();
    expect(fiches).toHaveTextContent(asShown(copy.answer.fichesFound.note(1)));
    expect(within(fiches).queryByText("Découvrir")).toBeNull();
    expect(within(fiches).queryByText(copy.labels.fichesSubtitle)).toBeNull();
    expect(within(fiches).queryByText(copy.blocks.ficheMeta)).toBeNull();
    expect(
      within(fiches).getByText(
        "Un nom de famille écrit dès 1947 au Journal officiel."
      )
    ).toBeVisible();
  });

  // One column below 768 px, as the « Fiches » lens: each card carries a
  // line too long for half of a 382 px phone column (no 430 px step).
  // @req REQ-180
  it("keeps the fiches in one column below 768 px", () => {
    renderMisspelling({
      results: [
        tchicayaFiche,
        { ...tchicayaFiche, id: "PAT_TCHIKAYI", name: "Tchikayi" },
      ],
    });

    const grid = within(screen.getByTestId("feed-block-fiches")).getByRole(
      "list"
    );
    expect(grid).toHaveClass("grid-cols-1", "min-[768px]:grid-cols-2");
    expect(grid.className).not.toMatch(/min-\[430px\]/);
  });

  // With nothing the data links left to list, there is no block to title.
  // @req REQ-180
  it("draws no fiches block when the search found none", () => {
    const { container } = renderMisspelling({ results: [] });

    expect(screen.queryByTestId("feed-block-fiches")).toBeNull();
    expect(blockIds(container)).toEqual(["verdict", "appellations", "further"]);
  });
});
