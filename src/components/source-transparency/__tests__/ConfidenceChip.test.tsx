// @req REQ-006
// @req REQ-011
import { describe, it, expect, vi, beforeEach } from "vitest";

// The chip formats its audit date in the route's locale; these assertions
// are French, so the suite stands on a French route.
const navigation = await vi.hoisted(async () => {
  const { mockRouteLanguage } = await import("@/test/mockRouteLanguage");
  return mockRouteLanguage("fr");
});
vi.mock("next/navigation", () => navigation);
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfidenceChip } from "../ConfidenceChip";

describe("ConfidenceChip", () => {
  beforeEach(() => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }
    document.getElementById("afh-chip-keyframes")?.remove();
  });

  // A percentage read as a probability of truth, and « verified » read as a
  // guarantee, were what the old wording promised (audit findings T04, T02).
  // The chip says how many references there are and when a person last reviewed
  // them, and nothing about how likely the claim is to be true.
  // @req REQ-019
  it("states no probability of truth and no verification", () => {
    const { container } = render(
      <ConfidenceChip
        language="fr"
        sourceCount={4}
        lastHumanAuditAt="2025-09-21"
      />
    );

    expect(container.textContent).not.toMatch(/%/);
    expect(container.textContent).not.toMatch(/vérifi|verified/i);
    expect(screen.getByRole("button").getAttribute("aria-label")).not.toMatch(
      /confiance|confidence|vérifi|verified|%/i
    );
  });

  // @req REQ-019
  it("counts one reference in the singular", () => {
    render(
      <ConfidenceChip
        language="fr"
        sourceCount={1}
        lastHumanAuditAt="2025-09-21"
      />
    );

    expect(screen.getByText(/1 référence ·/)).toBeInTheDocument();
    expect(screen.queryByText(/1 références/)).not.toBeInTheDocument();
  });

  // The stored score no longer decides what the reader sees: the chip states
  // a count and a review date, and a fiche without a score reads the same.
  // @req REQ-194
  it("states the count and review date without being handed a score", () => {
    const { container } = render(
      <ConfidenceChip
        language="fr"
        sourceCount={4}
        lastHumanAuditAt="2025-09-21"
      />
    );

    expect(
      screen.getByText(/4 références · revu 2025-09-21/)
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/confiance|%/i);
  });

  describe("rendering with complete data", () => {
    // @req REQ-019
    it("renders the typographic pill with the reference count and the review date", () => {
      render(<ConfidenceChip sourceCount={4} lastHumanAuditAt="2025-09-21" />);

      expect(
        screen.getByText(/4\s*références\s*·\s*revu\s*2025-09-21/i)
      ).toBeInTheDocument();
    });

    it("renders no emoji or icon — only typographic content", () => {
      const { container } = render(
        <ConfidenceChip sourceCount={4} lastHumanAuditAt="2025-09-21" />
      );

      expect(container.querySelector("svg")).toBeNull();
      expect(container.querySelector("img")).toBeNull();
    });
  });

  describe("aria-label", () => {
    it("matches the exact French template using a long French date", () => {
      render(<ConfidenceChip sourceCount={4} lastHumanAuditAt="2025-09-21" />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "aria-label",
        "consulter les sources de cette information (4 références, dernière relecture le 21 septembre 2025)"
      );
    });

    it("renders the long French date in a TZ-stable way (no off-by-one)", () => {
      render(<ConfidenceChip sourceCount={4} lastHumanAuditAt="2025-09-21" />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-label")).toMatch(/21 septembre 2025/);
    });
  });

  describe("keyboard interaction", () => {
    it("invokes onOpen exactly once when activated (native click fired by Enter/Space)", () => {
      const onOpen = vi.fn();
      render(
        <ConfidenceChip
          sourceCount={4}
          lastHumanAuditAt="2025-09-21"
          onOpen={onOpen}
        />
      );

      const button = screen.getByRole("button");
      button.focus();
      // Simulate the browser's native activation: keydown then click (no double-fire).
      fireEvent.keyDown(button, { key: "Enter" });
      fireEvent.click(button);

      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("invokes onOpen when the chip is clicked", () => {
      const onOpen = vi.fn();
      render(
        <ConfidenceChip
          sourceCount={4}
          lastHumanAuditAt="2025-09-21"
          onOpen={onOpen}
        />
      );

      fireEvent.click(screen.getByRole("button"));
      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("variant='contested'", () => {
    it("renders without any red color or alarm styling", () => {
      const { container } = render(
        <ConfidenceChip
          sourceCount={2}
          lastHumanAuditAt="2025-09-21"
          variant="contested"
        />
      );

      const html = container.innerHTML.toLowerCase();
      expect(html).not.toMatch(/\bred\b/);
      expect(html).not.toMatch(/destructive/);
      expect(html).not.toMatch(/alarm/);
    });

    it("still renders the canonical pill text in contested variant", () => {
      render(
        <ConfidenceChip
          sourceCount={2}
          lastHumanAuditAt="2025-09-21"
          variant="contested"
        />
      );

      expect(
        screen.getByText(/2\s*références\s*·\s*revu\s*2025-09-21/i)
      ).toBeInTheDocument();
    });
  });

  describe("fallback when data is missing", () => {
    it("renders a 'voir les sources' link when sourceCount is null", () => {
      render(
        <ConfidenceChip sourceCount={null} lastHumanAuditAt="2025-09-21" />
      );

      expect(screen.getByText(/voir les sources/i)).toBeInTheDocument();
    });

    it("renders a 'voir les sources' link when lastHumanAuditAt is null", () => {
      render(<ConfidenceChip sourceCount={4} lastHumanAuditAt={null} />);

      expect(screen.getByText(/voir les sources/i)).toBeInTheDocument();
    });
  });

  describe("tap target (WCAG 2.5.5 / 2.5.8)", () => {
    it("button carries 44x44 min sizing utilities directly", () => {
      render(<ConfidenceChip sourceCount={4} lastHumanAuditAt="2025-09-21" />);

      const button = screen.getByRole("button");
      const classes = button.className;
      expect(classes).toContain("min-h-[44px]");
      expect(classes).toContain("min-w-[44px]");
    });
  });

  describe("per-chip session pulse", () => {
    it("records the chip id in sessionStorage on first render", () => {
      render(
        <ConfidenceChip
          id="chip-a"
          sourceCount={4}
          lastHumanAuditAt="2025-09-21"
        />
      );

      const raw = sessionStorage.getItem("afh-chip-pulsed-ids");
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toContain("chip-a");
    });

    it("tracks distinct ids independently — each new chip id is added to the set", () => {
      const { rerender } = render(
        <ConfidenceChip
          id="chip-a"
          sourceCount={4}
          lastHumanAuditAt="2025-09-21"
        />
      );
      rerender(
        <ConfidenceChip
          id="chip-b"
          sourceCount={4}
          lastHumanAuditAt="2025-09-21"
        />
      );

      const raw = sessionStorage.getItem("afh-chip-pulsed-ids");
      expect(raw).not.toBeNull();
      const ids = JSON.parse(raw!);
      expect(ids).toContain("chip-a");
      expect(ids).toContain("chip-b");
    });
  });

  describe("keyframes injection", () => {
    it("injects the keyframes <style> only once even with multiple chips", () => {
      render(
        <>
          <ConfidenceChip
            id="chip-1"
            sourceCount={4}
            lastHumanAuditAt="2025-09-21"
          />
          <ConfidenceChip
            id="chip-2"
            sourceCount={4}
            lastHumanAuditAt="2025-09-21"
          />
          <ConfidenceChip
            id="chip-3"
            sourceCount={4}
            lastHumanAuditAt="2025-09-21"
          />
        </>
      );

      const styles = document.querySelectorAll("style#afh-chip-keyframes");
      expect(styles.length).toBe(1);
    });
  });
});
