import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LensesBlock } from "@/components/search/feed/LensesBlock";

describe("LensesBlock", () => {
  // @req REQ-180
  it("keeps every filter reachable in a horizontal pressed-button rail", () => {
    const onChange = vi.fn();
    const { container } = render(
      <LensesBlock
        language="fr"
        active="images"
        onChange={onChange}
        lenses={[
          { id: "all", label: "Tout" },
          { id: "shorts", label: "Shorts", count: 4 },
          { id: "images", label: "Images", count: 1 },
          { id: "quiz", label: "Jeux" },
          { id: "fiches", label: "Fiches", count: 5 },
        ]}
      />
    );

    const navigation = screen.getByRole("navigation", {
      name: "Filtrer ce fil de résultats",
    });
    expect(navigation).toHaveAttribute("data-feed-block", "lenses");
    expect(navigation).toHaveAttribute("data-feed-zone", "first");
    expect(navigation).toHaveClass(
      "overflow-x-auto",
      "flex-nowrap",
      "[scrollbar-width:none]",
      "[&::-webkit-scrollbar]:hidden"
    );
    expect(navigation).not.toHaveClass("overflow-hidden", "flex-wrap");

    const active = screen.getByRole("button", { name: "Images 1" });
    expect(active).toHaveAttribute("aria-pressed", "true");
    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveClass("min-h-11", "shrink-0");
    }

    fireEvent.click(screen.getByRole("button", { name: "Shorts 4" }));
    expect(onChange).toHaveBeenCalledWith("shorts");
    expect(container.innerHTML).not.toMatch(/(?:md:|lg:|xl:)/);
  });
});
