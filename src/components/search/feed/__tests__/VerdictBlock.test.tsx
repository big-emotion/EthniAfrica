import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VerdictBlock } from "@/components/search/feed/VerdictBlock";

describe("VerdictBlock", () => {
  // @req REQ-180
  it("makes the searched name the page heading and the answer one sentence", () => {
    const { container } = render(
      <VerdictBlock
        language="fr"
        name="Fang"
        verdict="Trois noms européens, un seul mot au départ."
        summary="Ils se disent Fang, prononcé fàŋ."
        kind="Peuple"
      />
    );

    const block = container.querySelector('[data-feed-block="verdict"]');
    expect(block).toHaveAttribute("data-feed-zone", "first");
    expect(block).toHaveClass("pt-afh-2xl", "min-[1200px]:pt-0");

    const eyebrow = screen.getByTestId("verdict-eyebrow");
    expect(eyebrow).toHaveTextContent("D'où vient ce nom · Peuple");
    expect(eyebrow.querySelector("span")).toHaveTextContent("· Peuple");

    const heading = screen.getByRole("heading", { level: 1, name: "Fang" });
    expect(heading).toBeVisible();
    expect(heading).toHaveClass(
      "mt-afh-xs",
      "min-[1200px]:mt-afh-md",
      "text-afh-hero"
    );
    expect(
      screen.getByText("Trois noms européens, un seul mot au départ.")
    ).toHaveClass("font-bold");
    expect(screen.getByText("Ils se disent Fang, prononcé fàŋ.")).toBeVisible();

    const panel = container.querySelector('[data-verdict-panel=""]');
    expect(panel).toHaveClass(
      "afh-accent-terre",
      "rounded-r-afh-lg",
      "bg-[var(--accent-tint)]",
      "mt-afh-md",
      "min-[1200px]:mt-afh-lg",
      "px-afh-2xl",
      "py-afh-lg",
      "min-[1200px]:px-afh-5xl",
      "min-[1200px]:py-afh-2xl",
      "border-l-[length:calc(var(--afh-space-xs)-var(--afh-space-px))]",
      "min-[1200px]:border-l-[length:var(--afh-space-xs)]"
    );
    expect(screen.getByText("Ils se disent Fang, prononcé fàŋ.")).toHaveClass(
      "text-afh-caption",
      "min-[1200px]:text-afh-small"
    );
    expect(container.innerHTML).not.toMatch(/(?:md:|lg:|xl:)/);
  });

  // @req REQ-180
  it("keeps an unknown statement plain instead of inventing an accented answer", () => {
    const { container } = render(
      <VerdictBlock
        name="Inconnu"
        verdict="Nous ne connaissons pas ce nom."
        summary="Ce n’est pas une réponse : c’est un aveu."
        tone="plain"
      />
    );

    const panel = container.querySelector('[data-verdict-panel=""]');
    expect(panel).not.toHaveClass(
      "afh-accent-terre",
      "bg-[var(--accent-tint)]"
    );
    expect(panel).toHaveClass("mt-afh-lg", "text-afh-text");
    expect(screen.getByText("Nous ne connaissons pas ce nom.")).toHaveClass(
      "font-afh-display",
      "text-afh-h3",
      "font-bold",
      "leading-[var(--afh-leading-h3)]"
    );
    expect(
      screen.getByText("Ce n’est pas une réponse : c’est un aveu.")
    ).toHaveClass(
      "mt-afh-md",
      "text-afh-small",
      "leading-[var(--afh-leading-small)]"
    );
  });
});
