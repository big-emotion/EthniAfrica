import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DidYouKnowMotif } from "@/components/home/DidYouKnowMotif";

describe("DidYouKnowMotif — the anecdotes' background (REQ-115)", () => {
  // The motif is mood, not content: a reader who cannot see it has lost
  // nothing, and one who hears the page read aloud must not sit through it.
  // @req REQ-113
  it("lays the background motif outside the accessible tree", () => {
    const { container } = render(<DidYouKnowMotif motif="mande-kora" />);

    const motif = container.querySelector(".anecdote-motif");

    expect(motif).not.toBeNull();
    expect(motif).toHaveAttribute("aria-hidden", "true");
    expect(motif).toHaveAttribute("data-motif", "mande-kora");
  });

  // Each background names one real cultural tradition in code so a generic
  // continental shorthand cannot silently replace the curated set later.
  // @req REQ-115
  it.each(["mande-kora", "amazigh-fibula", "punu-mukudj"] as const)(
    "renders the %s background as decoration",
    (motifName) => {
      const { container } = render(<DidYouKnowMotif motif={motifName} />);

      expect(container.querySelector(".anecdote-motif")).toHaveAttribute(
        "data-motif",
        motifName
      );
      expect(
        container.querySelector(`[data-cultural-symbol="${motifName}"]`)
      ).not.toBeNull();
    }
  );

  // The motif used to borrow its dress from the home band's stylesheet, so
  // mounting it anywhere else painted an unsized, full-opacity SVG. It
  // carries its own now.
  // @req REQ-115
  it("carries its own dress wherever it is mounted", () => {
    const { container } = render(<DidYouKnowMotif motif="punu-mukudj" />);
    const styles = container.querySelector("style")?.textContent ?? "";

    expect(styles).toMatch(
      /\.anecdote-motif\s*\{[^}]*position:\s*absolute[^}]*opacity:\s*0?\.\d+/
    );
  });
});
