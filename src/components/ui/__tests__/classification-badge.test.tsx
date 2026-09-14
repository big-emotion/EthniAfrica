/**
 * Tests for ClassificationBadge (ETNI-178 + ETNI-26 enhancement).
 *
 * The component surfaces the editorial `classification_status` enum on people
 * and language-family fiches. It MUST:
 *   - render the FR label for each enum value,
 *   - return null (no DOM output) when the status is nullish OR when the
 *     status is `consensual` (the default state — no badge needed),
 *   - wrap the badge in a Next.js Link to /fr/doctrine#<status>,
 *   - expose the tooltip text (via title attribute),
 *   - pair each label with an icon (monochrome-safe — color is never the sole signal),
 *   - never use red color tokens (warm hue only: earth / terracotta / gold).
 */
// @req REQ-023

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassificationBadge } from "@/components/ui/classification-badge";
import { classificationLabels, translations } from "@/lib/translations";
import { getLocalizedRoute } from "@/lib/routing";

// Mock next/link so the component can be rendered without a Next runtime.
// happy-dom + React Testing Library is enough; we just need a real <a>.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Statuses that produce a visible badge (consensual returns null — see ETNI-26).
const VISIBLE_STATUSES = [
  "contested",
  "colonial-legacy",
  "reconstructive",
] as const;

describe("ClassificationBadge", () => {
  // @req REQ-140
  it("renders the English label and doctrine route when requested", () => {
    render(<ClassificationBadge status="contested" language="en" />);

    expect(
      screen.getByText(translations.en.classification.contested.label)
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `${getLocalizedRoute("en", "doctrine")}#contested`
    );
  });

  it.each(VISIBLE_STATUSES.map((s) => [s, classificationLabels[s].label]))(
    "renders the FR label for status=%s",
    (status, expectedLabel) => {
      render(<ClassificationBadge status={status} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    }
  );

  it("returns null when status is null", () => {
    const { container } = render(<ClassificationBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when status is undefined", () => {
    const { container } = render(<ClassificationBadge status={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when status is consensual (default — no badge needed)", () => {
    const { container } = render(<ClassificationBadge status="consensual" />);
    expect(container).toBeEmptyDOMElement();
  });

  // @req REQ-023
  it.each(VISIBLE_STATUSES.map((s) => [s]))(
    "links to the doctrine entry for %s",
    (status) => {
      render(<ClassificationBadge status={status} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${getLocalizedRoute("fr", "doctrine")}#${status}`
      );
    }
  );

  it("exposes the tooltip text via title attribute", () => {
    render(<ClassificationBadge status="contested" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "title",
      classificationLabels.contested.tooltip
    );
  });

  it("exposes the colonial-legacy tooltip", () => {
    render(<ClassificationBadge status="colonial-legacy" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "title",
      classificationLabels["colonial-legacy"].tooltip
    );
  });

  it.each(VISIBLE_STATUSES.map((s) => [s]))(
    "pairs the label with an icon (monochrome-safe) for status=%s",
    (status) => {
      render(<ClassificationBadge status={status} />);
      // The icon carries a deterministic testid the consumer can rely on.
      expect(screen.getByTestId("classification-icon")).toBeInTheDocument();
    }
  );

  it.each(VISIBLE_STATUSES.map((s) => [s]))(
    "never applies a red color token for status=%s",
    (status) => {
      render(<ClassificationBadge status={status} />);
      const link = screen.getByRole("link");
      const inner = link.querySelector("[data-classification-status]");
      const inline = (inner as HTMLElement)?.getAttribute("style") ?? "";
      const cls = (inner as HTMLElement)?.getAttribute("class") ?? "";

      // Check the CSS custom property NAME each declaration references, not
      // its fallback literal: `var(--afh-terracotta, #A03F1A)` is a legitimate
      // WCAG-tuned fallback for when the design token isn't defined yet, not
      // the badge's real rendered color. A fallback hex will always read as
      // some concrete color when printed to a string — banning literals here
      // is what made this test break on a happy-dom upgrade that started
      // serializing the style attribute verbatim (matching real browsers)
      // instead of swallowing the fallback text.
      const referencedTokens = [...inline.matchAll(/var\((--[\w-]+)/g)].map(
        (m) => m[1].toLowerCase()
      );
      expect(referencedTokens.length).toBeGreaterThan(0);
      for (const token of referencedTokens) {
        expect(token).not.toMatch(/colonial|red|destructive|danger/);
      }

      // A color/background-color declared without going through a CSS
      // variable at all has no token indirection to inherit a future design
      // change — that bare-hardcode shape is what actually regressed before
      // ETNI-26 (colonial-legacy pointed straight at #9B3030).
      const bareDeclarations = [
        ...inline.matchAll(/(color|background-color)\s*:\s*([^;]+)/g),
      ].filter(([, , value]) => !value.trim().startsWith("var("));
      expect(bareDeclarations).toHaveLength(0);

      const haystack = `${inline} ${cls}`.toLowerCase();
      expect(haystack).not.toMatch(/\bred\b/);
      expect(haystack).not.toMatch(/destructive|danger/);
    }
  );

  it("accepts an optional doctrineSlug prop without breaking the link", () => {
    // The prop is informational — it does NOT change the link target (the
    // badge always points to the canonical doctrine anchor for its status).
    // The doctrineSlug is exposed via a data attribute so callers / tests can
    // verify pairing with an adjacent DoctrineLinkCard.
    render(
      <ClassificationBadge
        status="contested"
        doctrineSlug="classification-status"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      `${getLocalizedRoute("fr", "doctrine")}#contested`
    );
    expect(link).toHaveAttribute("data-doctrine-slug", "classification-status");
  });

  it("is backwards-compatible with the original single-prop call signature", () => {
    // Existing call sites use <ClassificationBadge status={x} /> only.
    render(<ClassificationBadge status="contested" />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});
