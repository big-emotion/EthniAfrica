// @req REQ-002
// @req REQ-124
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchModalV2 } from "../search/SearchModalV2";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("SearchModalV2", () => {
  // @req REQ-091
  it("shows the shared field and a close action when opened", () => {
    render(<SearchModalV2 open onClose={vi.fn()} language="fr" />);
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      /Quel nom cherchez-vous/
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "placeholder",
      "Un peuple, une langue, un pays…"
    );
    expect(screen.getAllByRole("button", { name: "Fermer" })).toHaveLength(2);
  });

  // @req REQ-091
  it("does not render while closed", () => {
    render(<SearchModalV2 open={false} onClose={vi.fn()} language="fr" />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
