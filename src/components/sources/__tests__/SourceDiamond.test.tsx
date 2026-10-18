import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SourceDiamond,
  SourceDiamondLegend,
} from "@/components/sources/SourceDiamond";

describe("SourceDiamond — the mark after a sourced sentence", () => {
  // @req REQ-198
  it("is a button named by the precise source type, never the tier", () => {
    render(
      <SourceDiamond
        kinds={["archive"]}
        language="fr"
        onOpen={() => undefined}
      />
    );
    const button = screen.getByRole("button", {
      name: "Source : Archive, voir les sources",
    });
    expect(button.getAttribute("data-family")).toBe("archive");
  });

  // Brief 11 §3 and charter §8 (2026-10-17): a lone diamond had no visible
  // text, so a reader could not tell it was the way to the sources.
  // @req REQ-194
  it("shows « Source » after the diamond for one source, and its name starts with that label", () => {
    render(
      <SourceDiamond
        kinds={["academic"]}
        language="fr"
        onOpen={() => undefined}
      />
    );
    const button = screen.getByRole("button", {
      name: "Source : Publication académique, voir les sources",
    });
    expect(button.textContent).toBe("Source");
    expect(button.getAttribute("aria-label")?.startsWith("Source")).toBe(true);
  });

  // A number beside each passage would read as a score of its strength.
  // @req REQ-194
  it("shows « Sources » with no count for several sources, and its name starts with that label", () => {
    render(
      <SourceDiamond
        kinds={["academic", "press", "archive", "oral_tradition"]}
        language="fr"
        onOpen={() => undefined}
      />
    );
    const button = screen.getByRole("button", {
      name: "Sources : Publication académique et 3 autres, voir les sources",
    });
    expect(button.textContent).toBe("Sources");
    expect(button.textContent).not.toMatch(/\d/);
    expect(button.getAttribute("aria-label")?.startsWith("Sources")).toBe(true);
  });

  // @req REQ-198
  it("takes the first source's colour and counts the others in its name", () => {
    render(
      <SourceDiamond
        kinds={["oral_tradition", "academic", "press"]}
        language="fr"
        onOpen={() => undefined}
      />
    );
    const button = screen.getByRole("button", {
      name: "Sources : Tradition orale et 2 autres, voir les sources",
    });
    expect(button.getAttribute("data-family")).toBe("oral");
  });

  // @req REQ-198
  it("says « 1 autre » in the singular", () => {
    render(
      <SourceDiamond
        kinds={["government", "press"]}
        language="fr"
        onOpen={() => undefined}
      />
    );
    expect(
      screen.getByRole("button", {
        name: "Sources : Source gouvernementale et 1 autre, voir les sources",
      })
    ).toBeTruthy();
  });

  // @req REQ-198
  it("opens the sources when tapped", () => {
    const onOpen = vi.fn();
    render(<SourceDiamond kinds={["press"]} language="fr" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  // @req REQ-198
  it("renders nothing for a passage without sources", () => {
    const { container } = render(
      <SourceDiamond kinds={[]} language="fr" onOpen={() => undefined} />
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("SourceDiamondLegend — what each colour means", () => {
  // @req REQ-198
  // @req REQ-194
  it("lists the seven colour families under a plain heading, with no tier word", () => {
    render(<SourceDiamondLegend language="fr" />);
    const legend = screen.getByRole("region", {
      name: "La couleur du losange indique le type de source",
    });
    const rows = within(legend)
      .getAllByRole("listitem")
      .map((row) => [row.textContent, row.getAttribute("data-family")]);
    expect(rows).toEqual([
      ["Tradition orale ou communauté", "oral"],
      ["Livre ou étude", "book"],
      ["Encyclopédie", "encyclopedia"],
      ["Article de presse", "press"],
      ["Rapport public", "report"],
      ["Archive", "archive"],
      ["Autre source", "other"],
    ]);
    expect(legend.textContent).not.toMatch(/tier|fiabilit|confiance/i);
  });
});
