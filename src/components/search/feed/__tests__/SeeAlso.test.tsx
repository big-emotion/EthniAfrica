import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SeeAlso } from "@/components/search/feed/SeeAlso";
import type { FeedLens } from "@/lib/search/searchLenses";

const lenses: FeedLens[] = [
  { id: "timeline", label: "Histoire du nom" },
  { id: "all", label: "Tout" },
  { id: "stories", label: "Récits", count: 4 },
  { id: "quiz", label: "Jeux", count: 1 },
  { id: "fiches", label: "Fiches", count: 21 },
];

describe("SeeAlso", () => {
  // @req REQ-198
  it("keeps the uncounted all-results route reachable when no counted lens exists", () => {
    render(
      <SeeAlso
        language="fr"
        lenses={lenses.slice(0, 2)}
        active="timeline"
        onChange={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Voir aussi : Tout" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  // @req REQ-198
  it("shows the counted lenses in one line and reveals the full filter bar when opened", () => {
    const onChange = vi.fn();
    render(
      <SeeAlso
        language="fr"
        lenses={lenses}
        active="timeline"
        onChange={onChange}
      />
    );

    const summary = screen.getByRole("button", {
      name: "Voir aussi : Récits 4 · Jeux 1 · Fiches 21",
    });
    expect(summary).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

    fireEvent.click(summary);

    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Histoire du nom" })
    ).toHaveAttribute("aria-pressed", "true");
  });
});
