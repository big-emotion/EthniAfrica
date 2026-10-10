import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Tier labels follow the route's locale; the assertions are French, so the
// suite stands on a French route.
const navigation = await vi.hoisted(async () => {
  const { mockRouteLanguage } = await import("@/test/mockRouteLanguage");
  return mockRouteLanguage("fr");
});
vi.mock("next/navigation", () => navigation);

import SourceChainSheet from "@/components/source-transparency/SourceChainSheet";

/**
 * The panel a note callout opens, once the sources it lists have a page of
 * their own.
 *
 * This is where the two numbering schemes meet. The callout is numbered by
 * reading order; a source is numbered by its place in the fiche's
 * bibliography. Nowhere else on the page does a reader see both, so if the
 * panel does not carry the second number the footer's numbering indexes
 * nothing anyone can follow.
 */

const assertion = {
  statement: "Les rites d'initiation structurent les classes d'âge.",
  confidenceScore: 0,
  sourceCount: 2,
  lastHumanAuditAt: null,
};

function renderSheet(
  sources: Parameters<typeof SourceChainSheet>[0]["sources"]
) {
  return render(
    <SourceChainSheet
      open
      onOpenChange={vi.fn()}
      assertion={assertion}
      sources={sources}
      anchorId="chip-content-culture-majorrites"
    />
  );
}

describe("SourceChainSheet — the directory bridge", () => {
  // @req REQ-019
  it("shows each source's place in the fiche's bibliography", () => {
    renderSheet([
      {
        id: "s-1",
        title: "Ethnologue",
        tier: "official",
        bibliographyNumber: 4,
      },
    ]);

    expect(screen.getByTestId("source-number-s-1")).toHaveTextContent("4");
  });

  // @req REQ-019
  it("links a source to its own page rather than only to the work", () => {
    renderSheet([
      {
        id: "11111111-1111-1111-1111-111111111111",
        title: "Ethnologue",
        tier: "official",
        url: "https://ethnologue.com",
      },
    ]);

    expect(
      screen.getByRole("link", { name: /référence complète/i })
    ).toHaveAttribute(
      "href",
      "/fr/sources/11111111-1111-1111-1111-111111111111"
    );
  });

  // @req REQ-092
  it("lists an untiered source without naming any standing", () => {
    renderSheet([
      { id: "s-2", title: "Une source non classée", tier: "needs_review" },
    ]);

    expect(screen.getByTestId("source-item-s-2")).toBeInTheDocument();
    expect(screen.queryByText(/En attente d.examen|Non vérifiée/)).toBeNull();
  });

  // @req REQ-019
  it("still lists a source the fiche's bibliography has not numbered", () => {
    renderSheet([{ id: "s-3", title: "Une source citée", tier: "referenced" }]);

    expect(screen.getByTestId("source-item-s-3")).toBeInTheDocument();
    expect(screen.queryByTestId("source-number-s-3")).toBeNull();
  });
});
