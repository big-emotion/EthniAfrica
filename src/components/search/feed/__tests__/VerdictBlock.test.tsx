import { render, screen, within } from "@testing-library/react";
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
    expect(panel).toHaveClass("mt-afh-md", "text-afh-text");
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

  // The plain tone serves the unknown name and the misspelling alike. It is
  // drawn on search-unknown-430, -768 and -1440 with one rhythm at every
  // width: 16 px above the eyebrow, 4 px above the name, 8 px above the line.
  // At 1200 px the page used to drop the top padding, which set the eyebrow
  // against the search field.
  // @req REQ-180
  it("keeps the rhythm of the search-unknown boards at every width in the plain tone", () => {
    const { container } = render(
      <VerdictBlock
        name="tchikaya"
        verdict="Cherchiez-vous… ?"
        summary="Aucune fiche ne porte exactement le nom « tchikaya »."
        tone="plain"
      />
    );

    const block = container.querySelector('[data-feed-block="verdict"]');
    expect(block).toHaveClass("pt-afh-2xl");
    expect(block?.className).not.toMatch(/min-\[1200px\]:pt-/);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveClass("mt-afh-xs");
    expect(heading.className).not.toMatch(/min-\[1200px\]:mt-/);
    const panel = container.querySelector('[data-verdict-panel=""]');
    expect(panel).toHaveClass("mt-afh-md");
    expect(panel?.className).not.toMatch(/min-\[1200px\]:/);
  });

  // The page that admits it does not know the name asks for it once, right
  // under the confession (brief 12, part A); every other verdict has no button.
  // @req REQ-180
  it("draws an action after the summary, inside the block, only when given one", () => {
    const props = {
      name: "voundou",
      verdict: "Nous ne connaissons pas ce nom.",
      summary: "Ce n’est pas une réponse : c’est un aveu.",
      tone: "plain" as const,
    };
    const { container, rerender } = render(
      <VerdictBlock
        {...props}
        action={<button type="button">Proposer une source</button>}
      />
    );

    const block = container.querySelector<HTMLElement>(
      '[data-feed-block="verdict"]'
    )!;
    const action = within(block).getByRole("button", {
      name: "Proposer une source",
    });
    const summary = screen.getByText(props.summary);
    expect(
      summary.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    rerender(<VerdictBlock {...props} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
