import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function InteractiveGlobeStub() {
      return <div data-testid="interactive-atlas-globe" />;
    },
}));

import { FicheAtlasGlobeIsland } from "@/components/atlas/FicheAtlasGlobeIsland";

describe("FicheAtlasGlobeIsland", () => {
  // @req REQ-112
  test("keeps the atlas static until the reader asks for interaction", () => {
    render(
      <FicheAtlasGlobeIsland overlay={null} missingMessage="Unavailable" />
    );

    const island = screen.getByTestId("fiche-atlas-globe-island");
    expect(island).toHaveAttribute("data-globe-mounted", "false");
    expect(island.getAttribute("style")).toContain(
      "height: var(--afh-globe-stage-height)"
    );
    expect(screen.getByTestId("fiche-atlas-globe-placeholder")).toBeVisible();
    expect(screen.queryByTestId("interactive-atlas-globe")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Activer la carte interactive" })
    );

    expect(island).toHaveAttribute("data-globe-mounted", "true");
    expect(screen.queryByTestId("fiche-atlas-globe-placeholder")).toBeNull();
    expect(screen.getByTestId("interactive-atlas-globe")).toBeVisible();
  });

  // @req REQ-112
  test("offers the same explicit activation in English", () => {
    render(
      <FicheAtlasGlobeIsland
        language="en"
        overlay={null}
        missingMessage="Unavailable"
      />
    );

    expect(
      screen.getByRole("button", { name: "Activate the interactive map" })
    ).toBeVisible();
  });
});
