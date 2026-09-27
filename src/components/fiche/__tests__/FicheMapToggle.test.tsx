import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FicheMapBand } from "@/components/fiche/FicheMapBand";
import { FicheMapToggle } from "@/components/fiche/FicheMapToggle";
import { FicheSequence } from "@/components/fiche/FicheSequence";

// The toggle lives in the hero plate and the band in the sequence: two
// subtrees with no shared client ancestor, which is what these tests render.
function renderSplit(language: "fr" | "en" = "fr") {
  return render(
    <>
      <FicheMapToggle language={language} />
      <FicheMapBand>
        <div data-testid="map-content" />
      </FicheMapBand>
    </>
  );
}

describe("FicheMapToggle and FicheMapBand", () => {
  // @req REQ-112
  it("renders closed: the map content is not in the DOM", () => {
    renderSplit();

    const button = screen.getByRole("button", { name: "Voir la carte" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("map-content")).toBeNull();
  });

  // @req REQ-112
  it("points aria-controls at the band and reveals then hides it", () => {
    const { container } = renderSplit();
    const button = screen.getByRole("button", { name: "Voir la carte" });

    const bandId = button.getAttribute("aria-controls");
    expect(bandId).toBeTruthy();
    expect(container.querySelector(`#${bandId}`)).not.toBeNull();

    fireEvent.click(button);
    expect(screen.getByTestId("map-content")).toBeInTheDocument();
    const open = screen.getByRole("button", { name: "Masquer la carte" });
    expect(open).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(open);
    expect(screen.queryByTestId("map-content")).toBeNull();
  });

  // @req REQ-112
  it("speaks English when asked to", () => {
    renderSplit("en");
    fireEvent.click(screen.getByRole("button", { name: "Show the map" }));
    expect(
      screen.getByRole("button", { name: "Hide the map" })
    ).toBeInTheDocument();
  });

  // @req REQ-112
  it("starts closed again on the next fiche", () => {
    const first = renderSplit();
    fireEvent.click(screen.getByRole("button", { name: "Voir la carte" }));
    first.unmount();

    renderSplit();
    expect(screen.queryByTestId("map-content")).toBeNull();
  });

  // @req REQ-112
  it("is wired by FicheSequence: a globe is held back, no globe means no band", () => {
    const withGlobe = render(
      <FicheSequence
        entityType="country"
        record={<p>Dossier</p>}
        globe={<div data-testid="globe" />}
      />
    );
    expect(screen.queryByTestId("globe")).toBeNull();
    withGlobe.unmount();

    const { container } = render(
      <FicheSequence entityType="language" record={<p>Dossier</p>} />
    );
    expect(container.querySelector("[data-fiche-map-band]")).toBeNull();
  });
});
