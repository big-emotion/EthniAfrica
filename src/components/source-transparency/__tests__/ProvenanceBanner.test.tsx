import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProvenanceBanner } from "../ProvenanceBanner";
import {
  SOURCE_PENDING_REVIEW_LABEL,
  SOURCE_TIER_LABELS,
} from "@/lib/glossaire/vocabularies";
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

    expect(screen.getByText(/15 assertions recensées/)).toBeInTheDocument();
  });

  // @req REQ-019
  it("names every standing it counts with the published label, and no other", () => {
    render(
      <ProvenanceBanner
        language="fr"
        census={census({ unverified: 4, needs_review: 2 })}
      />
    );

    expect(screen.getByText(SOURCE_TIER_LABELS.fr.official)).toBeVisible();
    expect(screen.getByText(SOURCE_TIER_LABELS.fr.referenced)).toBeVisible();
    expect(screen.getByText(SOURCE_TIER_LABELS.fr.unverified)).toBeVisible();
    expect(screen.getByText(SOURCE_PENDING_REVIEW_LABEL.fr)).toBeVisible();
  });

  // @req REQ-019
  it("leaves out a standing nothing rests on rather than printing a zero", () => {
    render(
      <ProvenanceBanner language="fr" census={census({ unverified: 1 })} />
    );

    expect(
      screen.queryByText(SOURCE_PENDING_REVIEW_LABEL.fr)
    ).not.toBeInTheDocument();
  });

  // @req REQ-019
  it("states no count at all while every assertion is official or referenced", () => {
    // Discretion is the norm the loud state borrows its salience from: a
    // census printed on every fiche is a census nobody reads by the second
    // visit.
    render(<ProvenanceBanner language="fr" census={census()} />);

    expect(
      screen.queryByText(SOURCE_TIER_LABELS.fr.official)
    ).not.toBeInTheDocument();
  });

  // @req REQ-019
  it("says the atlas keeps its unverified assertions, as soon as it holds one", () => {
    render(
      <ProvenanceBanner language="fr" census={census({ unverified: 1 })} />
    );

    expect(
      screen.getByText(/Nous ne les retirons pas/, { exact: false })
    ).toBeInTheDocument();
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

  // @req REQ-019
  it("speaks English when the reader does", () => {
    render(<ProvenanceBanner language="en" census={census()} />);

    expect(screen.getByText(/15 recorded assertions/)).toBeInTheDocument();
  });
});
