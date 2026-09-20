import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { getLocalizedRoute } from "@/lib/routing";
import type { SearchEvidence } from "@/lib/search/evidence";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

const evidence: SearchEvidence = {
  assertion: {
    id: "assertion-fang-name",
    statement: "Pahouin vient d’une transcription européenne de Mpangwe.",
    fieldPath: "content.appellations.originOfExonyms",
    confidenceScore: 0.85,
    sourceCount: 1,
    lastHumanAuditAt: "2026-09-01",
  },
  sources: [
    {
      id: "source-fang-name",
      title: "Dictionnaire fang-français",
      author: "Samuel Galley",
      year: 1964,
      tier: "referenced",
      url: "https://example.org/fang",
    },
  ],
  standing: "referenced",
};

describe("SearchFeedEvidenceAction", () => {
  // @req REQ-180
  it("adapts a real search assertion and its sources into the shared sheet", async () => {
    render(
      <SearchFeedEvidenceAction
        evidence={evidence}
        anchorId="feed-evidence-fang"
        language="fr"
      />
    );

    expect(screen.getByText("Référencée")).toHaveAttribute(
      "data-source-standing",
      "referenced"
    );
    const trigger = screen.getByRole("button", {
      name: /ouvrir la chaîne de sources/i,
    });
    expect(trigger).toHaveClass("min-h-[44px]");
    expect(trigger).toHaveTextContent("85 % · 1 sources");

    fireEvent.click(trigger);

    expect(
      await screen.findByText(
        "« Pahouin vient d’une transcription européenne de Mpangwe. »"
      )
    ).toBeVisible();
    expect(screen.getByText("Dictionnaire fang-français")).toBeVisible();
  });

  // @req REQ-180
  it("renders the shareable source anchor and keeps the hash on activation", async () => {
    window.history.replaceState(null, "", getLocalizedRoute("fr", "search"));

    render(
      <SearchFeedEvidenceAction
        evidence={evidence}
        anchorId="feed-evidence-fang"
        language="fr"
      />
    );

    expect(document.getElementById("feed-evidence-fang")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /ouvrir la chaîne de sources/i })
    );

    await screen.findByText("Dictionnaire fang-français");
    expect(window.location.hash).toBe("#feed-evidence-fang");
    expect(document.querySelector(window.location.hash)).toBeInTheDocument();
  });
});
