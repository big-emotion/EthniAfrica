import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SourceRow } from "@/components/sources/SourceRow";
import type { Source } from "@/api/v2/schemas/sources";

const source: Source = {
  id: "11111111-1111-1111-1111-111111111111",
  sourceKey: null,
  sourceKind: null,
  tier: "official",
  identifiers: null,
  title: "Ethnologue: Languages of the World, 27th edition",
  url: "https://www.ethnologue.com",
  pinnedUrl: null,
  year: 2024,
  author: "SIL International",
  publisher: null,
  resolvable: null,
  lastVerifiedAt: null,
  notes: "Catalogue entry — official tier by domain.",
  page: null,
  addedAt: null,
  policy: {
    key: "ethnologue",
    tier: "official",
    sourceKind: "linguistic_reference",
  },
};

describe("SourceRow", () => {
  /**
   * The whole row is one anchor to the source's own page. A row whose title
   * linked outward instead would send the reader off the site at the exact
   * moment they asked what the corpus rests on.
   */
  // @req REQ-092
  it("links the row to the source's page inside the site", () => {
    render(<SourceRow source={source} />);

    const link = screen.getByRole("link", { name: /Ethnologue/ });
    expect(link).toHaveAttribute("href", `/fr/sources/${source.id}`);
  });

  // @req REQ-092
  it("shows the note the record carries about the source", () => {
    render(<SourceRow source={source} />);

    expect(
      screen.getByText("Catalogue entry — official tier by domain.")
    ).toBeInTheDocument();
  });

  /** Doctrine §1.1: the reader is told who speaks, never how much to trust them. */
  // @req REQ-092
  it("never states the source's tier", () => {
    for (const tier of [
      "official",
      "referenced",
      "unverified",
      null,
    ] as const) {
      const { container, unmount } = render(
        <SourceRow source={{ ...source, tier }} />
      );
      expect(container.textContent).not.toMatch(
        /Officielle|Référencée|Non vérifiée|En attente d'examen/
      );
      unmount();
    }
  });

  // @req REQ-161
  it("states the source's type beside the title when the record carries it", () => {
    render(<SourceRow source={{ ...source, sourceKind: "oral_tradition" }} />);
    expect(screen.getByText("Tradition orale")).toBeInTheDocument();
  });

  /**
   * A source with no URL is an offline work — a book, an archive box. The row
   * must not manufacture a link to it.
   */
  // @req REQ-092
  it("offers no outward link for an offline work", () => {
    render(<SourceRow source={{ ...source, url: null }} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `/fr/sources/${source.id}`);
  });

  // @req REQ-092
  it("names the author and the year when the citation carries them", () => {
    render(<SourceRow source={source} />);

    expect(screen.getByText(/SIL International/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });
});
