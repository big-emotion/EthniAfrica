import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FicheNameStory } from "@/components/fiche/FicheNameStory";
import { readNaming } from "@/lib/search/naming";

const FULA_ORIGIN =
  "Le nom que les Fula se donnent, Fulbe au pluriel et Pullo au singulier, n'a pas de sens établi. Peul est la forme française : elle vient du wolof.";

function fula(exonyms: string[] = ["Peul", "Fulani", "Fellata"]) {
  return readNaming("people", {
    appellations: {
      selfAppellation: "Fulbe (pluriel), Pullo (singulier)",
      exonyms,
      originOfExonyms: FULA_ORIGIN,
    },
  });
}

describe("FicheNameStory", () => {
  // @req REQ-151
  it("lists the name a people gives itself first, marked, then the others", () => {
    render(<FicheNameStory naming={fula()} language="fr" />);

    const rows = screen.getAllByTestId("name-story-form");
    expect(rows.map((row) => row.dataset.form)).toEqual([
      "Fulbe (pluriel), Pullo (singulier)",
      "Peul",
      "Fulani",
      "Fellata",
    ]);
    expect(rows[0]).toHaveAttribute("data-self-given", "true");
    expect(within(rows[0]).getByText("le nom qu’ils se donnent")).toBeTruthy();
    expect(rows[1]).not.toHaveAttribute("data-self-given");
  });

  // @req REQ-178
  it("gives every form the same element, so none is promoted over another", () => {
    render(<FicheNameStory naming={fula()} language="fr" />);

    const tagNames = screen
      .getAllByTestId("name-story-form")
      .map((row) => row.tagName);
    expect(new Set(tagNames)).toEqual(new Set(["LI"]));
  });

  // @req REQ-151
  it("leads with the first sentence of the origin, and keeps the rest behind a native disclosure", () => {
    const { container } = render(
      <FicheNameStory naming={fula()} language="fr" />
    );

    expect(
      screen.getByText(/n'a pas de sens établi\.$/, { selector: "p" })
    ).toBeVisible();
    const disclosure = container.querySelector("details[data-name-story-more]");
    expect(disclosure).not.toBeNull();
    expect(disclosure).toHaveTextContent("Lire la suite");
    expect(disclosure).toHaveTextContent("Peul est la forme française");
  });

  // @req REQ-178
  it("does not assert an origin the fiche says is not established", () => {
    render(<FicheNameStory naming={fula()} language="fr" />);

    const lead = screen.getByTestId("name-story-lead");
    expect(lead).toHaveTextContent("n'a pas de sens établi");
    expect(lead.textContent).not.toMatch(/vient du|signifie/);
  });

  // @req REQ-151
  it("puts forms beyond the fifth behind a native disclosure", () => {
    const many = fula(["A1", "A2", "A3", "A4", "A5", "A6", "A7"]);
    const { container } = render(
      <FicheNameStory naming={many} language="fr" />
    );

    const visible = container
      .querySelector("ul.fiche-name-story__forms")!
      .querySelectorAll(":scope > [data-testid=name-story-form]");
    expect(visible).toHaveLength(5);
    const more = container.querySelector("details[data-name-story-extra]");
    expect(more).toHaveTextContent("+3 autres");
    expect(
      more?.querySelectorAll("[data-testid=name-story-form]")
    ).toHaveLength(3);
  });

  // @req REQ-178
  it("shows a stored qualifier as it is, and a form with no origin alone", () => {
    const naming = readNaming(
      "country",
      { historicalNames: { formerNames: ["Congo français (1880-1960)"] } },
      {}
    );
    render(<FicheNameStory naming={naming} language="fr" />);

    const row = screen.getByTestId("name-story-form");
    expect(row).toHaveTextContent("Congo français (1880-1960)");
    expect(row.querySelector(".fiche-name-story__tag")).toBeNull();
    expect(row.querySelector(".fiche-name-story__sense")).toBeNull();
  });

  // @req REQ-178
  it("takes a per-form origin only from a name record", () => {
    const naming = readNaming(
      "people",
      { appellations: { selfAppellation: "Fulbe", exonyms: ["Peul"] } },
      {},
      [
        {
          id: "1",
          entityType: "people",
          entityId: "PPL_FULA",
          form: "Peul",
          kind: "exonym",
          meaning: "Vient du wolof, où le peuple se dit pal.",
          impositionPeriod: "XIXe siècle",
          imposedBy: "les Français",
          problematic: false,
          usedToday: true,
          evidence: [],
        },
      ]
    );
    render(<FicheNameStory naming={naming} language="fr" />);

    const peul = screen
      .getAllByTestId("name-story-form")
      .find((row) => row.dataset.form === "Peul")!;
    expect(peul).toHaveTextContent("Vient du wolof, où le peuple se dit pal.");
    expect(peul).toHaveTextContent("Donné par les Français");
    expect(peul).toHaveTextContent("XIXe siècle");
  });

  // @req REQ-178
  it("draws nothing when the projection holds no form and no origin", () => {
    const { container } = render(
      <FicheNameStory naming={readNaming("people", {})} language="fr" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  // @req REQ-151
  it("asks about one name, not several, when only one form is known", () => {
    const naming = readNaming("languageFamily", {
      decolonialHeader: {
        historicalAppellations: ["Langues bantoues"],
        originOfHistoricalTerm:
          "Le terme a été introduit par Wilhelm Bleek en 1862.",
      },
    });
    render(<FicheNameStory naming={naming} language="fr" />);

    expect(
      screen.getByRole("heading", { name: "D’où vient ce nom ?" })
    ).toBeVisible();
  });

  // @req REQ-151
  it("draws a caution note only when one is given, lead first, rest behind a disclosure", () => {
    const caution =
      "Sous l'apartheid, ce terme servait de catégorie raciale légale. Des intellectuels africains ont critiqué ce vocabulaire.";
    const { rerender } = render(
      <FicheNameStory naming={fula()} language="fr" />
    );
    expect(screen.queryByTestId("name-story-caution")).toBeNull();

    rerender(
      <FicheNameStory naming={fula()} language="fr" caution={caution} />
    );
    const note = screen.getByTestId("name-story-caution");
    expect(note).toHaveTextContent("catégorie raciale légale.");
    expect(note.querySelector("details")).toHaveTextContent(
      "Des intellectuels africains"
    );
  });

  // @req REQ-151
  it("cuts a very long caution lead at a word and keeps the whole text one tap away", () => {
    const long = `${"mot ".repeat(90)}fin sans terminaison`;
    render(<FicheNameStory naming={fula()} language="fr" caution={long} />);

    const note = screen.getByTestId("name-story-caution");
    expect(note.querySelector("p")!.textContent!.length).toBeLessThan(260);
    expect(note.querySelector("details")).toHaveTextContent(
      "fin sans terminaison"
    );
  });

  // @req REQ-178
  it("wraps itself in a titled chapter when it stands alone", () => {
    const { container } = render(
      <FicheNameStory naming={fula()} language="fr" chapter />
    );

    const chapter = container.querySelector("[data-fiche-section]");
    expect(chapter).toHaveAttribute(
      "data-fiche-section",
      "L’histoire des noms"
    );
    expect(screen.getAllByText("L’histoire des noms")).toHaveLength(1);
  });
});
