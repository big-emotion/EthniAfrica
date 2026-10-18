import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished, vi } from "vitest";

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

function familyNameLead(
  id: string,
  name: string,
  matchedForm?: string
): SearchLead {
  return {
    type: "patronyme",
    id,
    name,
    ...(matchedForm && { matchedForm }),
    similarity: 0.5,
  };
}

// What the search finds for a family name it also offers as a lead: the same
// fiche, reached by its spelling.
function familyNameFiche(id: string, name: string): SearchResult {
  return { type: "patronyme", id, name, exactMatch: false };
}

function ficheWithLine(
  type: "people" | "patronyme",
  id: string,
  name: string,
  shortLine: string
) {
  return {
    type,
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
const tchicayaLead = familyNameLead("PAT_TCHICAYA", "Tchicaya", "Tchicaya");
const tchicayaFiche = familyNameFiche("PAT_TCHICAYA", "Tchicaya");

// « konana » (Main's example, from the corpus model): Konan and Konaté begin
// like it, each through its filed name. The search also finds Onana by its
// spelling, which begins with another letter. No fiche writes « konana ».
const konanaLeads = [
  familyNameLead("PAT_KONAN", "Konan", "Konan"),
  familyNameLead("PAT_KONATE", "Konaté", "Konaté"),
];
const onanaLine =
  "Un nom d'homme ewondo du Cameroun, écrit dès 1919 ; on ne sait pas ce qu'il veut dire.";
const onanaFiche = ficheWithLine("patronyme", "PAT_ONANA", "Onana", onanaLine);
const konanaResults: SearchResult[] = [
  familyNameFiche("PAT_KONAN", "Konan"),
  familyNameFiche("PAT_KONATE", "Konaté"),
  onanaFiche,
];

function renderMisspelling({
  query = "tchikaya",
  results = [tchicayaFiche],
  leads = [tchicayaLead],
  nameSuggestions,
  companions = noCompanions,
}: {
  query?: string;
  results?: SearchResult[];
  leads?: SearchLead[];
  nameSuggestions?: string[];
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
      nameSuggestions={nameSuggestions}
      companions={companions}
      resultCount={results.length}
    />
  );
}

function renderKonana(
  overrides: {
    results?: SearchResult[];
    companions?: SearchCompanionsData;
  } = {}
) {
  return renderMisspelling({
    query: "konana",
    results: konanaResults,
    leads: konanaLeads,
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

function choiceNames(): string[] {
  return within(screen.getByTestId("appellations-list"))
    .getAllByRole("link")
    .map((link) => link.textContent ?? "");
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
      asShown(copy.answer.typoWrittenAlike.summary("tchikaya", ["Tchicaya"]))
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.answer.typoWrittenAlike.heading(1),
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
  // body ink turns light at night, on a tint that stays light. Its border is
  // the accent ink: var(--accent) on the parchment is 2.94:1 by day, and the
  // fill alone (1.29:1) left the chip's shape weaker than the accent-ink
  // heading and link around it.
  // @req REQ-180
  it("draws each choice as an accented name chip, legible by day and by night", () => {
    renderMisspelling();

    const choice = within(screen.getByTestId("appellations-list")).getByRole(
      "link",
      { name: "Tchicaya" }
    );
    expect(choice).not.toHaveClass("border-[color:var(--accent)]");
    expect(choice).toHaveClass(
      "min-h-11",
      "rounded-afh-full",
      "border-[color:var(--accent-ink)]",
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

  // The board's `.ea-choices-action` wraps. With text alone at 200 % on a
  // 320 px phone the label needs about 303 px of a 272 px column: a label
  // held on one line would push the page sideways (WCAG 1.4.4, 1.4.10).
  // @req REQ-180
  it("lets the quiet link wrap onto a second line when the text is enlarged", () => {
    renderMisspelling();

    const action = screen.getByRole("button", { name: "Proposer une source" });
    expect(action).toHaveClass("whitespace-normal", "text-left");
    expect(action).not.toHaveClass("whitespace-nowrap");
  });

  // Moving by button, a screen reader would hear « Proposer une source »
  // under a heading about Tchicaya, and could take it for a source about the
  // lead. The note it answers says it is about the spelling typed.
  // @req REQ-180
  it("describes the quiet link by the invitation it answers", () => {
    renderMisspelling();

    const choices = screen.getByTestId("feed-block-appellations");
    const invitation = within(choices).getByText(
      asShown(copy.answer.typoInvitation("tchikaya"))
    );
    const action = screen.getByRole("button", { name: "Proposer une source" });
    expect(invitation.id).not.toBe("");
    expect(action).toHaveAttribute("aria-describedby", invitation.id);
    expect(action).toHaveAccessibleDescription(
      /tchikaya.*dites-nous où cette écriture est employée/
    );
  });

  // The reader is saying where their spelling is used, not that we were
  // wrong: the form asks no « Nous nous sommes trompés ? », which brief 12
  // part A removed, and names the target in words, not by its internal type.
  // @req REQ-180
  it("opens the contribution form on the spelling typed, without the question brief 12 removed", async () => {
    // The form's proof of work asks the API for a challenge on mount; refused
    // here, it fails quietly instead of reaching for a server on :3000.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });
    renderMisspelling();

    await userEvent.click(
      screen.getByRole("button", { name: "Proposer une source" })
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Recherche · tchikaya")).toBeVisible();
    expect(within(dialog).queryByText(/Nous nous sommes trompés/)).toBeNull();
    expect(within(dialog).queryByText(/search-query/)).toBeNull();
  });

  // Tchicaya scored through its filed name: there is no other form to
  // explain, so no line follows the chip.
  // @req REQ-125
  it("adds no line under a choice named by its filed name", () => {
    renderMisspelling();

    expect(
      within(screen.getByTestId("feed-block-appellations")).queryByText(
        /La fiche .+ donne|est une écriture du nom|est un des noms de la fiche/
      )
    ).toBeNull();
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
    const { container } = renderKonana();

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
    renderKonana();

    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(
        copy.answer.typoWrittenAlike.summary("konana", ["Konan", "Konaté"])
      )
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.answer.typoWrittenAlike.heading(2),
      })
    ).toBeVisible();
    expect(choiceNames()).toEqual(["Konan", "Konaté"]);
  });

  // The fiches block says what it holds and that none bears the spelling
  // typed; each card carries its fiche's own line, never « Fiche
  // EthniAfrica ». The leads stay choices only.
  // @req REQ-201
  it("lists only the fiches that are not a choice, under the caution, each with its own line", () => {
    renderKonana();

    const fiches = screen.getByTestId("feed-block-fiches");
    expect(
      within(fiches).getByRole("heading", {
        level: 2,
        name: copy.answer.fichesFound.title(1),
      })
    ).toBeVisible();
    expect(fiches).toHaveTextContent(
      asShown(copy.answer.fichesFound.note(1, "konana"))
    );
    expect(within(fiches).getByText("Onana")).toBeVisible();
    expect(within(fiches).getByText(onanaLine)).toBeVisible();
    expect(within(fiches).queryByText("Konan")).toBeNull();
    expect(within(fiches).queryByText("Konaté")).toBeNull();
    expect(within(fiches).queryByText("Découvrir")).toBeNull();
    expect(within(fiches).queryByText(copy.labels.fichesSubtitle)).toBeNull();
    expect(within(fiches).queryByText(copy.blocks.ficheMeta)).toBeNull();
  });

  // The « Fiches » count is what the filter shows, not the API's total with
  // the leads in it.
  // @req REQ-180
  it("counts in the « Fiches » filter only the fiches it lists", () => {
    renderKonana();

    expect(filterNames()).toEqual([
      copy.filters.all,
      `${copy.filters.fiches} 1`,
    ]);
  });

  // The companions come from the first lead when nothing answers. Until the
  // reader chooses it, a « Jeux » lens titled « konana » over a game about
  // Konan would treat the two names as one.
  // @req REQ-180
  it("offers no filter built from a lead the reader has not chosen", () => {
    const loaded = FEED_CASES.find(({ id }) => id === "mande")!.production
      .companions;
    expect(loaded.quiz.item).not.toBeNull();
    expect(loaded.shorts.items.length).toBeGreaterThan(0);

    renderKonana({ companions: loaded });

    expect(filterNames().map((name) => name.replace(/ \d+$/, ""))).toEqual([
      copy.filters.all,
      copy.filters.fiches,
    ]);
  });

  // Brief 12's grouped lens would set Onana under « Autour de ce nom » with
  // « Un contexte lié, pas le même nom. », and title the page « Fiches sur
  // konana »: a link nothing in the data makes, since only its trigram score
  // ties Onana to the word. One press away from « Tout », the lens keeps the
  // caution « Tout » gives the same fiches.
  // @req REQ-180
  it("keeps the caution of « Tout » when the reader presses « Fiches », and calls no fiche linked", async () => {
    const { container } = renderKonana();

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: copy.filters.label })
      ).getByRole("button", { name: new RegExp(`^${copy.filters.fiches}`) })
    );

    const fiches = screen.getByTestId("feed-block-fiches");
    expect(container).not.toHaveTextContent(copy.lens.aroundNote);
    expect(container).not.toHaveTextContent(/Autour de ce nom/);
    expect(container).not.toHaveTextContent(/Fiches sur/);
    expect(container.textContent).not.toMatch(/(?<!\p{L})liée?s?(?!\p{L})/u);
    expect(
      within(fiches).getByRole("heading", {
        level: 2,
        name: copy.answer.fichesFound.title(1),
      })
    ).toBeVisible();
    expect(fiches).toHaveTextContent(
      asShown(copy.answer.fichesFound.note(1, "konana"))
    );
    expect(within(fiches).getByText("Onana")).toBeVisible();
    expect(within(fiches).getByText(onanaLine)).toBeVisible();
    expect(within(fiches).queryByText("Konan")).toBeNull();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: copy.lens.fichesFoundTitle("konana"),
      })
    ).toBeVisible();
  });

  // Brief 12's lens sets its groups a margin under the lens title
  // (`.ea-fiche-groups`, 8 px); the group of this state keeps that rhythm.
  // @req REQ-180
  it("sets the group of the « Fiches » lens under its title as brief 12's lens does", async () => {
    renderKonana();

    await userEvent.click(
      within(
        screen.getByRole("navigation", { name: copy.filters.label })
      ).getByRole("button", { name: new RegExp(`^${copy.filters.fiches}`) })
    );

    const group = within(screen.getByTestId("feed-block-fiches"))
      .getByRole("heading", {
        level: 2,
        name: copy.answer.fichesFound.title(1),
      })
      .closest("section");
    expect(group?.parentElement).toHaveClass("mt-afh-md");
  });

  // One column below 768 px, as the « Fiches » lens: each card carries a
  // line too long for half of a 382 px phone column (no 430 px step).
  // @req REQ-180
  it("keeps the fiches in one column below 768 px", () => {
    renderKonana({
      results: [
        ...konanaResults,
        ficheWithLine("people", "PPL_KONO", "Kono", "Un nom de peuple."),
      ],
    });

    const grid = within(screen.getByTestId("feed-block-fiches")).getByRole(
      "list"
    );
    expect(grid).toHaveClass("grid-cols-1", "min-[768px]:grid-cols-2");
    expect(grid.className).not.toMatch(/min-\[430px\]/);
  });
});

// The API names the form that scored (migration 110). The page names it too:
// the chip is the spelling written almost like the query, and it leads to the
// fiche that records it, which a line under the chips names.
// @req REQ-125
describe("a lead reached through another of its forms", () => {
  // « jarra » reaches Diarra through its recorded spelling Jara: « Diarra
  // s'écrit presque de la même façon » would be false, Diarra beginning with
  // another letter. The line says which fiche records Jara and ranks neither
  // form under the other (doctrine §1: none is crowned).
  // @req REQ-125
  it("names the family name's spelling that scored, and the fiche that records it", () => {
    renderMisspelling({
      query: "jarra",
      results: [],
      leads: [familyNameLead("PAT_DIARRA", "Diarra", "Jara")],
    });

    expect(choiceNames()).toEqual(["Jara"]);
    expect(
      within(screen.getByTestId("appellations-list"))
        .getByRole("link", { name: "Jara" })
        .getAttribute("href")
    ).toMatch(/jara/i);
    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(copy.answer.typoWrittenAlike.summary("jarra", ["Jara"]))
    );
    expect(screen.getByTestId("feed-block-verdict")).not.toHaveTextContent(
      /Diarra s’écrit/
    );
    const choices = screen.getByTestId("feed-block-appellations");
    const note = within(choices).getByText(
      "La fiche Diarra donne l’écriture Jara."
    );
    expect(note).toHaveClass("text-afh-caption", "text-afh-text-soft");
    expect(choices).not.toHaveTextContent(/une écriture du nom/);
    const invitation = screen.getByText(
      asShown(copy.answer.typoInvitation("jarra"))
    );
    expect(
      note.compareDocumentPosition(invitation) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // « pakhalas » reaches the Koulango fiche through Pakhallas, the name the
  // Dioula gave the Koulango, at the 0.2 floor of the other kinds: nothing
  // says it is written the same way. No fiche writes « pakhalas »
  // (familyNameLeads.test.ts).
  // @req REQ-125
  it("makes no spelling claim for a people reached through one of its names", () => {
    renderMisspelling({
      query: "pakhalas",
      results: [],
      leads: [
        {
          type: "people",
          id: "PPL_KOULANGO",
          name: "Koulango",
          matchedForm: "Pakhallas",
          similarity: 0.73,
        },
      ],
    });

    expect(choiceNames()).toEqual(["Pakhallas"]);
    const verdict = screen.getByTestId("feed-block-verdict");
    expect(verdict).toHaveTextContent(
      asShown(copy.answer.typoResembling.summary("pakhalas", 1))
    );
    expect(verdict).not.toHaveTextContent(/s’écri/);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: copy.answer.typoResembling.heading(1),
      })
    ).toBeVisible();
    expect(
      screen.getByText("La fiche Koulango donne le nom Pakhallas.")
    ).toBeVisible();
    expect(screen.getByTestId("feed-block-appellations")).not.toHaveTextContent(
      /un des noms de la fiche/
    );
  });

  // Two fiches record Ikumama, Iteso and Kumam, and « icumama » reaches both
  // through it: the form is one search, so one chip, and each fiche gets its
  // line.
  // @req REQ-125
  it("draws one chip per form, and a line for each fiche that records it", () => {
    renderMisspelling({
      query: "icumama",
      results: [],
      leads: [
        {
          type: "people",
          id: "PPL_ITESO",
          name: "Iteso",
          matchedForm: "Ikumama",
          similarity: 0.45,
        },
        {
          type: "people",
          id: "PPL_KUMAM",
          name: "Kumam",
          matchedForm: "Ikumama",
          similarity: 0.45,
        },
      ],
    });

    expect(choiceNames()).toEqual(["Ikumama"]);
    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(copy.answer.typoResembling.summary("icumama", 1))
    );
    expect(
      screen.getByText("La fiche Iteso donne le nom Ikumama.")
    ).toBeVisible();
    expect(
      screen.getByText("La fiche Kumam donne le nom Ikumama.")
    ).toBeVisible();
  });

  // « ajumataw » reaches the fiche filed « Diola (Joola / Jola) » through
  // Ajamataw, the name the Diola give themselves. The line names the fiche
  // without its bracket, the filed label doctrine §1.1 keeps off the page.
  // @req REQ-125
  it("names the fiche in the line without the bracket of its filed name", () => {
    renderMisspelling({
      query: "ajumataw",
      results: [],
      leads: [
        {
          type: "people",
          id: "PPL_DIOLA",
          name: "Diola (Joola / Jola)",
          matchedForm: "Ajamataw",
          similarity: 0.5,
        },
      ],
    });

    expect(choiceNames()).toEqual(["Ajamataw"]);
    expect(
      screen.getByText("La fiche Diola donne le nom Ajamataw.")
    ).toBeVisible();
    expect(screen.getByTestId("feed-block-appellations")).not.toHaveTextContent(
      /Joola/
    );
  });

  // Migration 110 scores a people's forms without their trailing bracket, so
  // a lead reached through its filed name names « Diola », not « Diola
  // (Joola / Jola) ». Compared with the bracketed label, the page wrote a line
  // about the fiche naming itself: « La fiche Diola (Joola / Jola) donne
  // aussi le nom Diola. »
  // @req REQ-125
  it("adds no line for a lead that scored through its filed name, bracket aside", () => {
    renderMisspelling({
      query: "diolla",
      results: [],
      leads: [
        {
          type: "people",
          id: "PPL_DIOLA",
          name: "Diola (Joola / Jola)",
          matchedForm: "Diola",
          similarity: 0.5,
        },
      ],
    });

    expect(choiceNames()).toEqual(["Diola"]);
    const choices = screen.getByTestId("feed-block-appellations");
    expect(within(choices).queryByText(/La fiche .+ donne/)).toBeNull();
    expect(choices).not.toHaveTextContent(/Joola/);
  });

  // A reviewed term is offered by its edit distance to any of its terms, and
  // a family name beside it is no reason to say every choice is written the
  // same way.
  // @req REQ-125
  it("makes no spelling claim once a choice is not a family-name lead", () => {
    renderMisspelling({
      query: "konana",
      results: [],
      leads: konanaLeads,
      nameSuggestions: ["Konongo"],
    });

    expect(choiceNames()).toEqual(["Konongo", "Konan", "Konaté"]);
    expect(screen.getByTestId("feed-block-verdict")).toHaveTextContent(
      asShown(copy.answer.typoResembling.summary("konana", 3))
    );
  });

  // A database without migration 110 sends no form: the filed name stands,
  // without the bracket a filed label may carry.
  // @req REQ-125
  it("keeps the filed name when the API sends no form", () => {
    renderMisspelling({
      leads: [familyNameLead("PAT_TCHICAYA", "Tchicaya")],
    });

    expect(choiceNames()).toEqual(["Tchicaya"]);
  });

  // @req REQ-125
  it("names a lead with no form by its filed name without the bracket", () => {
    renderMisspelling({
      query: "diolla",
      results: [],
      leads: [
        {
          type: "people",
          id: "PPL_DIOLA",
          name: "Diola (Joola / Jola)",
          similarity: 0.5,
        },
      ],
    });

    expect(choiceNames()).toEqual(["Diola"]);
    expect(
      within(screen.getByTestId("feed-block-appellations")).queryByText(
        /La fiche .+ donne/
      )
    ).toBeNull();
  });
});
