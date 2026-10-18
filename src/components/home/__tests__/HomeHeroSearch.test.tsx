// @req REQ-002
// @req REQ-124
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeHeroSearch } from "../HomeHeroSearch";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("HomeHeroSearch", () => {
  // @req REQ-002
  it("renders the same shared field contract as the header", () => {
    render(<HomeHeroSearch language="fr" />);
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      /Quel nom cherchez-vous/
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "placeholder",
      "Un peuple, une langue, un pays…"
    );
    expect(screen.getByRole("search")).toBeInTheDocument();
  });
});
