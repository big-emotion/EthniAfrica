import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FicheNameReadings } from "@/components/fiche/FicheNameReadings";
import { NameTimeline } from "@/components/search/timeline/NameTimeline";
import { getLocalizedRoute } from "@/lib/routing";
import { LINGALA_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => getLocalizedRoute("fr", "search"),
  useRouter: () => ({ push: vi.fn() }),
}));

// `fiche:source_click` was declared in trackEvent.ts and sent by nothing, so
// how often readers open a passage's sources was unknown. The surface splits
// the search page's timeline from a fiche's competing readings; the kind is
// the lead source's, the one that colours the diamond.
describe("TileSourceMarker — a source consulted is recorded", () => {
  beforeEach(() => {
    window.plausible = vi.fn();
  });

  afterEach(() => {
    delete window.plausible;
  });

  // @req REQ-046
  it("records the timeline surface and the lead source's kind when a passage's sources open", async () => {
    render(
      <NameTimeline
        history={LINGALA_HISTORY}
        searched="lingala"
        subjectType="language"
        language="fr"
      />
    );
    const tiles = within(
      screen.getByRole("list", { name: /Histoire du nom Lingala/ })
    ).getAllByRole("listitem");

    expect(window.plausible).not.toHaveBeenCalled();
    fireEvent.click(
      within(tiles[1]).getByRole("button", {
        name: "Source : Archive, voir les sources",
      })
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(window.plausible).toHaveBeenCalledTimes(1);
    expect(window.plausible).toHaveBeenCalledWith("fiche:source_click", {
      props: { surface: "timeline", kind: "archive" },
    });
  });

  // @req REQ-046
  it("records the fiche surface when a competing reading's sources open", async () => {
    render(<FicheNameReadings history={LINGALA_HISTORY} language="fr" />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /voir les sources/ })[0]
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(window.plausible).toHaveBeenCalledTimes(1);
    expect(window.plausible).toHaveBeenCalledWith("fiche:source_click", {
      props: { surface: "fiche", kind: "academic" },
    });
  });

  // Brief 11 §3 on the fiches too: the labelled button wraps with the last
  // word of the reading (board language-lingala-768, readings side by side).
  // @req REQ-194
  it("labels a fiche reading's sources button and keeps it with the last word", () => {
    render(<FicheNameReadings history={LINGALA_HISTORY} language="fr" />);
    const button = screen.getAllByRole("button", {
      name: /voir les sources/,
    })[0];

    expect(button.textContent).toMatch(/^Sources?$/);
    expect(button.getAttribute("aria-label")).toMatch(/^Sources? : /);
    expect(button.parentElement).toHaveClass("afh-source-tail");
    expect(button.parentElement!.textContent).toMatch(/^\S+ Sources?$/);
  });
});
