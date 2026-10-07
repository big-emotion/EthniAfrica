import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhereBars } from "@/components/search/answer/WhereBars";
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
  it("writes millions with a decimal point in English", () => {
    renderWhere("lingala", { language: "en" });
    expect(screen.getByText("4.5 M")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Estimates of the number of speakers, to be read as orders of magnitude."
      )
    ).toBeInTheDocument();
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
});
