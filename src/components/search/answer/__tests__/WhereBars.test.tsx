import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildRelationSearchHref } from "@/lib/search/relationSearch";
import { WhereBars, WhereGroups } from "@/components/search/answer/WhereBars";
import {
  ANSWER_LABELS,
  answerOf,
} from "@/components/search/answer/__tests__/fixtures";

function renderWhere(
  name: Parameters<typeof answerOf>[0],
  extra: Partial<React.ComponentProps<typeof WhereBars>> = {},
  index = 0
) {
  const answer = answerOf(name, index);
  return render(
    <WhereBars
      where={answer.where!}
      kind={answer.kind}
      facts={answer.what.facts}
      labels={ANSWER_LABELS}
      {...extra}
    />
  );
}

const familyPeoplesHref = buildRelationSearchHref("fr", {
  kind: "family",
  id: "FLG_BANTU",
});

// @req REQ-178
describe("WhereBars", () => {
  it("shows a language's speakers in millions, never as a raw count, with the estimate note", () => {
    const { container } = renderWhere("lingala");
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "RD Congo34 M",
      "Congo4,5 M",
      "Centrafrique0,8 M",
      "Angola0,3 M",
    ]);
    expect(container.textContent).not.toMatch(/\d{1,3}[\s .]\d{3}/);
    expect(
      screen.getByText(
        "Estimations du nombre de locuteurs, à lire comme des ordres de grandeur."
      )
    ).toBeInTheDocument();
    expect(container.querySelector("p")?.textContent).toBe(
      "Environ 40 millions de personnes le parlent, dans 4 pays."
    );
  });

  // @req REQ-178
  it("scales each bar to the largest row", () => {
    const { container } = renderWhere("lingala");
    const widths = [
      ...container.querySelectorAll<HTMLElement>("li span[style]"),
    ].map((bar) => bar.style.width);
    expect(widths[0]).toBe("100%");
    expect(parseFloat(widths[1])).toBeCloseTo(13.2, 0);
  });

  // @req REQ-178
  it("counts the countries it does not draw instead of listing them", () => {
    renderWhere("peul");
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("+ 7 autres pays")).toBeInTheDocument();
    expect(screen.getByText("14 M")).toBeInTheDocument();
  });

  // @req REQ-178
  it("shows a country's shares in percent and declares what is not yet split", () => {
    renderWhere("congo", { heading: "RD Congo" }, 1);
    expect(
      screen.getByRole("heading", { name: "Qui y vit" })
    ).toBeInTheDocument();
    expect(screen.getByText("64 peuples présentés")).toBeInTheDocument();
    expect(screen.getByText("2,5 %")).toBeInTheDocument();
    expect(
      screen.getByText(
        "34 % de la population n'est pas encore répartie par peuple."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("shows a patronyme's countries as pills with no figure, and says the figures are missing", () => {
    const { container } = renderWhere("camara");
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByText("Guinée")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\d+\s?(M|%)/);
    expect(
      screen.getByText(/Nous ne savons pas encore combien de personnes/)
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("falls back to the id when a label is missing instead of hiding the row", () => {
    renderWhere("lingala", { labels: {} });
    expect(screen.getByText("COD")).toBeInTheDocument();
  });

  // The sentence about the share not yet split names the peoples the fiche
  // lists but gives no figure for; it takes them from the page and prints
  // nothing it was not given.
  // @req REQ-178
  it("names the peoples without a share next to the unsplit sentence", () => {
    renderWhere("congo", { unsplitPeopleNames: ["Teke", "Mbochi"] });
    expect(
      screen.getByText(
        "60 % de la population n'est pas encore répartie par peuple (Teke, Mbochi…)."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-178
  it("keeps the plain unsplit sentence when no people is left to name", () => {
    renderWhere("congo");
    expect(
      screen.getByText(
        "60 % de la population n'est pas encore répartie par peuple."
      )
    ).toBeInTheDocument();
  });

  // A long name used to squeeze the label column and wrap on three lines.
  // @req REQ-178
  it("puts a long country name on its own line above its bar", () => {
    const { container } = renderWhere("lingala", {
      labels: {
        COD: "République démocratique du Congo",
        COG: "Congo",
        CAF: "République centrafricaine",
        AGO: "Angola",
      },
    });

    const stacked = [...container.querySelectorAll("[data-label-stacked]")];
    expect(stacked.map((label) => label.textContent)).toEqual([
      "République démocratique du Congo",
      "République centrafricaine",
    ]);
    for (const label of stacked) expect(label).toHaveClass("col-span-3");
  });

  // @req REQ-178
  it("keeps a short name in the label column", () => {
    const { container } = renderWhere("lingala");

    expect(container.querySelectorAll("[data-label-stacked]")).toHaveLength(0);
  });

  // The entity's accent colours the bars; the sentences and counts around
  // them stay in the page's ocre.
  // @req REQ-178
  it("scopes the entity accent to the bars", () => {
    const { container } = renderWhere("lingala");

    expect(container.querySelector("section")).not.toHaveClass(
      "afh-accent-perv"
    );
    expect(container.querySelector("ul")).toHaveClass("afh-accent-perv");
  });

  // @req REQ-178
  it("renders nothing without rows", () => {
    const { container } = render(
      <WhereBars
        where={{ unit: "speakers", estimate: true, rows: [] }}
        kind="language"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
  // @req REQ-178
  it("offers the peoples of the family behind the figures, counted from the data", () => {
    renderWhere("bantou", {
      peopleLink: { count: 169, href: familyPeoplesHref },
    });
    const link = screen.getByRole("link", { name: "Voir les 169 peuples" });
    expect(link).toHaveAttribute("href", familyPeoplesHref);
    // A text link on its own line is a touch target: 44 px at least.
    expect(link.className).toContain("min-h-11");
  });

  // @req REQ-178
  it("draws no peoples link when none was given", () => {
    renderWhere("bantou");
    expect(screen.queryByRole("link")).toBeNull();
  });
});

// @req REQ-178
describe("WhereGroups", () => {
  const republic = answerOf("congo", 0);
  const democratic = answerOf("congo", 1);
  const group = (answer: typeof republic, heading: string) => ({
    heading,
    where: answer.where!,
    facts: answer.what.facts,
    labels: ANSWER_LABELS,
  });

  // @req REQ-178
  it("tells two countries under one heading, each with its own bars", () => {
    const { container } = render(
      <WhereGroups
        kind="country"
        groups={[group(republic, "Congo"), group(democratic, "RD Congo")]}
      />
    );
    expect(container.querySelectorAll("h2")).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-feed-block="answer-where"]')
    ).toHaveLength(1);
    const headings = Array.from(container.querySelectorAll("h3")).map(
      (heading) => heading.textContent
    );
    expect(headings).toEqual(["Congo", "RD Congo"]);
  });
});
