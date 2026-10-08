import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NOMMER_BIBLIOGRAPHY } from "@/lib/dossiers/nommer/bibliography";

import SourcesPageContent from "../SourcesPageContent";

function headingLevels(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(
    (heading) => Number(heading.tagName[1])
  );
}

describe("SourcesPageContent (REQ-091)", () => {
  // @req REQ-091
  it("opens with the bibliography title and intro", () => {
    render(<SourcesPageContent language="fr" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Sources" })
    ).toBeInTheDocument();
    expect(screen.getByText(/Bibliographie complète/i)).toBeInTheDocument();
  });

  // @req REQ-091
  it("keeps the source bibliography available through accessible links", () => {
    render(<SourcesPageContent />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Sources internationales (principales)",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /United Nations, Department of Economic and Social Affairs/i,
      })
    ).toHaveAttribute("href", "https://population.un.org/wpp/");
  });

  // @req REQ-091
  it("names every regional and thematic bibliography section", () => {
    render(<SourcesPageContent />);

    for (const title of [
      "Sources par région (instituts officiels africains)",
      "Sources académiques & linguistiques",
      "Sources complémentaires (démographie & géopolitique)",
      "Sources des dossiers",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title })
      ).toBeInTheDocument();
    }
  });

  // @req REQ-091
  it("keeps one valid H1 → H2 document outline", () => {
    const { container } = render(<SourcesPageContent />);
    const levels = headingLevels(container);

    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expect(levels.every((level) => level <= 2)).toBe(true);
  });
});

/**
 * The fifth section is the only one that lists *works* rather than providers,
 * so it is the only one that says what kind of work each is. It names the
 * type and never the tier: the reader is told who speaks, not how much to
 * trust them (doctrine §1.1).
 */
describe("SourcesPageContent — the editorial bibliographies", () => {
  // @req REQ-161
  it("shows a type beside every work it cites", () => {
    const { container } = render(<SourcesPageContent />);
    const citations = container.querySelectorAll(".afh-source-citation");

    expect(citations.length).toBe(Object.keys(NOMMER_BIBLIOGRAPHY).length);

    for (const citation of citations) {
      const label = citation.querySelector(".afh-source-kind-label");
      expect(label).not.toBeNull();
      expect(label.textContent.trim()).not.toBe("");
      expect(label?.textContent).not.toBe("()");
    }
  });

  // @req REQ-092
  it("names no tier anywhere in the bibliography", () => {
    const { container } = render(<SourcesPageContent />);

    expect(container.textContent).not.toMatch(
      /Officielle|Référencée|Non vérifiée|En attente d'examen/
    );
  });

  // @req REQ-091
  it("says what Wikipedia is used for without hiding it", () => {
    render(<SourcesPageContent />);

    const note = screen.getByText(/Nous lisons Wikipédia d'abord/);
    expect(note).toBeInTheDocument();
    expect(note.textContent).not.toMatch(/n'est pas une source/);
    expect(note.textContent).not.toMatch(/remontée/);
  });

  // A count of references is a count; several works can repeat one account. And
  // the page lists institutions and works, so it says where an account passed
  // on orally is cited instead of pretending it is absent or listed here
  // (audit findings T02, C24).
  // @req REQ-091
  it("says a count is not proof and where an orally transmitted account is cited", () => {
    render(<SourcesPageContent />);

    const note = screen.getByText(/Nous lisons Wikipédia d'abord/);
    expect(note.textContent).toMatch(
      /nombre de références n'est pas une preuve/
    );
    expect(note.textContent).toMatch(/récit transmis oralement/);
    expect(note.textContent).toMatch(/fiche concernée/);
  });

  // Deriving rather than restating is what keeps the page from drifting from
  // the dossier it documents.
  // @req REQ-091
  it("cites the works the dossier actually rests on", () => {
    render(<SourcesPageContent />);

    expect(
      screen.getByText(NOMMER_BIBLIOGRAPHY["bleek-1862"].title)
    ).toBeInTheDocument();
    expect(
      screen.getByText(NOMMER_BIBLIOGRAPHY["cocobod-cocoa-story"].title)
    ).toBeInTheDocument();
  });
});
