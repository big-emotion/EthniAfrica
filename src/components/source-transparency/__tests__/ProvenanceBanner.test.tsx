import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProvenanceBanner } from "../ProvenanceBanner";
import type { ProvenanceCensus } from "@/api/v2/schemas/confidence";

function census(
  overrides: Partial<ProvenanceCensus["standings"]> = {},
  rest: Partial<ProvenanceCensus> = {}
): ProvenanceCensus {
  const standings = {
    official: 4,
    referenced: 11,
    unverified: 0,
    needs_review: 0,
    ...overrides,
  };
  return {
    entityType: "country",
    entityId: "CIV",
    assertionCount: Object.values(standings).reduce((a, b) => a + b, 0),
    standings,
    lastHumanAuditAt: "2026-03-12T00:00:00.000Z",
    ...rest,
  };
}

describe("the provenance banner", () => {
  // @req REQ-019
  it("states how many assertions the fiche records", () => {
    render(<ProvenanceBanner language="fr" census={census()} />);

    expect(screen.getByText(/15 informations présentées/)).toBeInTheDocument();
  });

  // The banner counts and dates; it never weighs. No score, no « confiance »,
  // no explanation of how sources are weighted.
  // @req REQ-194
  it("prints no confidence score or weighting", () => {
    render(
      <ProvenanceBanner
        language="fr"
        census={census({ unverified: 7, needs_review: 3 })}
      />
    );

    expect(screen.getByRole("region").textContent).not.toMatch(
      /confiance|score|%|pondér|poids/i
    );
  });

  /**
   * Doctrine §1.1 (operator ruling, 2026-10-08): the reader never sees a
   * source's tier — no per-standing count, no gold warning, no notice about
   * unverified assertions. The census stays in the data.
   */
  // @req REQ-092
  it("names no standing and counts none, even when weak standings are held", () => {
    render(
      <ProvenanceBanner
        language="fr"
        census={census({ unverified: 4, needs_review: 2 })}
      />
    );
    const region = screen.getByRole("region");

    expect(region.textContent).not.toMatch(
      /Officielle|Référencée|Non vérifiée|En attente d.examen|palier|Niveau de source|non vérifiées/i
    );
    expect(region.querySelector("dl")).toBeNull();
    expect(region.className).not.toContain("gold");
    expect(region).not.toHaveAttribute("data-provenance-standing");
  });

  // @req REQ-019
  it("dates the last human review, and says so when there has been none", () => {
    const { rerender } = render(
      <ProvenanceBanner language="fr" census={census()} />
    );
    expect(screen.getByText(/12 mars 2026/)).toBeInTheDocument();

    rerender(
      <ProvenanceBanner
        language="fr"
        census={census({}, { lastHumanAuditAt: null })}
      />
    );
    expect(screen.getByText(/Aucune relecture humaine/)).toBeInTheDocument();
  });

  // @req REQ-019
  it("offers the sources of the fiche it stands on", () => {
    render(
      <ProvenanceBanner
        language="fr"
        census={census()}
        sourcesHref="#sources"
      />
    );

    expect(
      screen.getByRole("link", { name: /Voir les sources/ })
    ).toHaveAttribute("href", "#sources");
  });

  // @req REQ-019
  it("renders nothing for a fiche the corpus records no assertion for", () => {
    const { container } = render(
      <ProvenanceBanner
        language="fr"
        census={census(
          { official: 0, referenced: 0 },
          { assertionCount: 0, lastHumanAuditAt: null }
        )}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
