// @req REQ-007
// @req REQ-008
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Tier labels and the broken-link date follow the route's locale; the
// assertions are French, so the suite stands on a French route.
const navigation = await vi.hoisted(async () => {
  const { mockRouteLanguage } = await import("@/test/mockRouteLanguage");
  return mockRouteLanguage("fr");
});
vi.mock("next/navigation", () => navigation);
import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from "@testing-library/react";
import SourceChainSheet, {
  type Source,
  type SourceChainSheetProps,
} from "../SourceChainSheet";

vi.mock("@/hooks/use-consent", () => ({
  useOptionalConsent: () => null,
  useConsent: () => ({
    consentState: {
      hasConsented: true,
      preferences: { essential: true, analytics: false, functional: true },
      consentDate: null,
    },
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    updatePreferences: vi.fn(),
    showBanner: false,
    setShowBanner: vi.fn(),
  }),
}));

const baseSource: Source = {
  id: "src-1",
  title: "Atlas linguistique de l'Afrique",
  author: "M. Diop",
  year: 2021,
  page: "p. 42",
  url: "https://example.org/atlas",
  tier: "official",
  brokenAt: null,
};

const renderSheet = (override: Partial<SourceChainSheetProps> = {}) => {
  const onOpenChange = vi.fn();
  const props: SourceChainSheetProps = {
    open: true,
    onOpenChange,
    assertion: {
      statement: "Le peuple Seereer est attesté depuis le XIIIe siècle.",
      position: undefined,
      confidenceScore: 0.82,
      sourceCount: 3,
      lastHumanAuditAt: "2026-04-01",
    },
    sources: [baseSource],
    anchorId: "chip-paragraph-3",
    ...override,
  };
  const utils = render(<SourceChainSheet {...props} />);
  return { ...utils, onOpenChange, props };
};

beforeEach(() => {
  // Default to desktop viewport for matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

describe("SourceChainSheet", () => {
  it("renders a dialog with role and aria-modal", () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("uses aria-labelledby pointing to the assertion statement", () => {
    renderSheet();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "chip-paragraph-3-statement"
    );
    const statement = document.getElementById("chip-paragraph-3-statement");
    expect(statement).not.toBeNull();
    expect(statement?.textContent).toContain("Seereer");
  });

  it("renders sections in strict order", () => {
    renderSheet({
      openFlagCount: 2,
      revisionUrl: "https://example.org/revision",
    });
    const sections = screen.getAllByTestId(/^section-/);
    const order = sections.map((el) => el.getAttribute("data-testid"));
    expect(order).toEqual([
      "section-assertion",
      "section-flags",
      "section-sources",
      "section-revision",
      "section-flag-target",
      "section-cite",
    ]);
  });

  // @req REQ-198
  it("shows the legend it is given right after the sources (ETNI-2015)", () => {
    renderSheet({
      legend: (
        <section data-testid="section-source-diamond-legend">clé</section>
      ),
    });
    const order = screen
      .getAllByTestId(/^section-/)
      .map((el) => el.getAttribute("data-testid"));
    expect(order.slice(1, 3)).toEqual([
      "section-sources",
      "section-source-diamond-legend",
    ]);
  });

  // The score, its explanation and the « not yet reviewed » disclaimer were
  // one standing-derived signal: the sheet lists the sources and stops there.
  // @req REQ-194
  it.each([
    ["with a stored score", 0.82, "2026-04-01"],
    ["without a stored score or review", undefined, null],
  ])("shows no confidence %s", (_label, confidenceScore, lastHumanAuditAt) => {
    setViewportWidth(430);
    renderSheet({
      assertion: {
        statement: "Le peuple Seereer est attesté depuis le XIIIe siècle.",
        confidenceScore,
        sourceCount: 3,
        lastHumanAuditAt,
      },
    });

    const dialog = screen.getByRole("dialog");
    expect(screen.queryByTestId("section-confidence")).toBeNull();
    expect(dialog.textContent).not.toMatch(
      /confiance|82|Calculé|pas encore relu/i
    );
  });

  it("does not render the flag banner when no open flags", () => {
    renderSheet({ openFlagCount: 0 });
    expect(screen.queryByTestId("section-flags")).toBeNull();
  });

  it("does not render the revision link when revisionUrl is missing", () => {
    renderSheet();
    expect(screen.queryByTestId("section-revision")).toBeNull();
  });

  // @req REQ-012
  it("offers no assertion report control when the assertion carries no id", () => {
    renderSheet();
    const flagTarget = screen.getByTestId("section-flag-target");

    // Not a Turnstile question: with no assertion id there is no target to
    // report. The shell that used to stand here was the dead-key fallback,
    // and it made this genuine guard indistinguishable from that one.
    expect(within(flagTarget).queryByRole("button")).toBeNull();
    expect(flagTarget.textContent).not.toMatch(/bientôt disponible/i);
  });

  // @req REQ-012
  it("wires the live FlagTarget when the assertion carries an id", () => {
    renderSheet({
      assertion: {
        statement: "Le peuple Seereer est attesté depuis le XIIIe siècle.",
        confidenceScore: 0.82,
        sourceCount: 3,
        lastHumanAuditAt: "2026-04-01",
        id: "assertion-42",
        fieldPath: "histoire",
      },
    });
    const flagTarget = screen.getByTestId("section-flag-target");
    const btn = within(flagTarget).getByRole("button", {
      name: "Signaler un problème",
    });
    expect(btn).toBeEnabled();
  });

  // @req REQ-012 (AC6)
  it("offers a live report control per source", () => {
    renderSheet();
    const flagTarget = screen.getByTestId("source-flag-target-src-1");
    expect(
      within(flagTarget).getByRole("button", { name: "Signaler cette source" })
    ).toBeEnabled();
  });

  it("renders broken-link sources with line-through URL and a calm badge", () => {
    renderSheet({
      sources: [
        {
          ...baseSource,
          brokenAt: "2026-04-10",
        },
      ],
    });
    const link = screen.getByTestId("source-url-src-1");
    expect(link.className).toMatch(/line-through/);
    expect(screen.getByTestId("source-broken-badge-src-1")).toHaveTextContent(
      /lien inaccessible, signalé le 10 avril 2026/i
    );
  });

  it("renders broken-link URL as a span (not an anchor) to prevent navigation", () => {
    renderSheet({
      sources: [
        {
          ...baseSource,
          brokenAt: "2026-04-10",
        },
      ],
    });
    const el = screen.getByTestId("source-url-src-1");
    expect(el.tagName.toLowerCase()).toBe("span");
    expect(el).toHaveAttribute("aria-disabled", "true");
    expect(el).not.toHaveAttribute("href");
  });

  it("renders javascript: URLs as a plain span (safeUrl guard)", () => {
    renderSheet({
      sources: [
        {
          ...baseSource,
          url: "javascript:alert('xss')",
        },
      ],
    });
    const el = screen.getByTestId("source-url-src-1");
    expect(el.tagName.toLowerCase()).toBe("span");
    expect(el).not.toHaveAttribute("href");
  });

  it("calls onOpenChange(false) when Escape is pressed", () => {
    const { onOpenChange } = renderSheet();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders multi-position positions as separate source lists", () => {
    renderSheet({
      positions: [
        {
          position: "Origine nilotique",
          sources: [{ ...baseSource, id: "src-a", title: "Source A" }],
        },
        {
          position: "Origine bantoue",
          sources: [
            {
              ...baseSource,
              id: "src-b",
              title: "Source B",
              tier: "referenced",
            },
          ],
        },
      ],
      sources: [],
    });
    const sourcesSection = screen.getByTestId("section-sources");
    const positionGroups =
      within(sourcesSection).getAllByTestId(/^position-group-/);
    expect(positionGroups).toHaveLength(2);
    expect(positionGroups[0]).toHaveTextContent("Origine nilotique");
    expect(positionGroups[0]).toHaveTextContent("Source A");
    expect(positionGroups[1]).toHaveTextContent("Origine bantoue");
    expect(positionGroups[1]).toHaveTextContent("Source B");
  });

  // @req REQ-092
  it("lists single-list sources in one plain list, under no tier heading", () => {
    renderSheet({
      sources: [
        { ...baseSource, id: "o1", tier: "official", title: "Official src" },
        {
          ...baseSource,
          id: "r1",
          tier: "referenced",
          title: "Referenced src",
        },
        { ...baseSource, id: "u1", tier: "unverified", title: "Aggregator" },
        { ...baseSource, id: "n1", tier: "needs_review", title: "AI src" },
      ],
    });
    const sourcesSection = screen.getByTestId("section-sources");
    expect(
      within(sourcesSection)
        .getAllByTestId(/^source-item-/)
        .map((item) => item.getAttribute("data-testid"))
    ).toEqual([
      "source-item-o1",
      "source-item-r1",
      "source-item-u1",
      "source-item-n1",
    ]);
    expect(within(sourcesSection).queryByTestId(/^tier-group-/)).toBeNull();
    expect(within(sourcesSection).queryByTestId(/^source-tier-/)).toBeNull();
  });

  it("returns null when open is false", () => {
    const { container } = renderSheet({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("opens only the first sheet instance when the URL hash matches the anchor", async () => {
    window.history.replaceState(null, "", "/?#chip-shared");
    const onOpenChangeA = vi.fn();
    const onOpenChangeB = vi.fn();
    const propsBase: Omit<SourceChainSheetProps, "onOpenChange"> = {
      open: false,
      assertion: {
        statement: "shared",
        confidenceScore: 0.5,
        sourceCount: 1,
        lastHumanAuditAt: null,
      },
      sources: [baseSource],
      anchorId: "chip-shared",
    };
    render(
      <>
        <SourceChainSheet {...propsBase} onOpenChange={onOpenChangeA} />
        <SourceChainSheet {...propsBase} onOpenChange={onOpenChangeB} />
      </>
    );
    expect(onOpenChangeA).toHaveBeenCalledWith(true);
    expect(onOpenChangeB).not.toHaveBeenCalled();
    window.history.replaceState(null, "", "/");
  });
});

/* The sheet picks its variant from `(min-width: Npx)` queries, so answering
   them against a chosen width is what "opening at 430 px" means here. */
function setViewportWidth(width: number) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const minWidth = /min-width:\s*(\d+)px/.exec(query);
      return {
        matches: minWidth ? width >= Number(minWidth[1]) : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
}

const TIER_WORDS =
  /Officielle|Référencée|Non vérifiée|En attente d.examen|palier|Niveau de source|pas encore confirmées/i;

/**
 * Doctrine §1.1 (operator ruling, 2026-10-08): the reader never sees a
 * source's tier. The sheet used to rank its sources under tier headings,
 * badge each one, and introduce the weak ones with a sentence; all three
 * told the reader the tier. No source is hidden either: every one is listed.
 */
describe("SourceChainSheet — no tier shown, no source hidden", () => {
  const sources: Source[] = [
    { ...baseSource, id: "official-1", title: "Recensement", tier: "official" },
    { ...baseSource, id: "unverified-a", title: "Blog", tier: "unverified" },
    {
      ...baseSource,
      id: "pending-1",
      title: "Inclassée",
      tier: "needs_review",
    },
  ];

  // @req REQ-092
  it.each([320, 430, 720, 1200])(
    "at %i px prints no tier word and lists every source",
    (width) => {
      setViewportWidth(width);
      renderSheet({ sources });

      const section = screen.getByTestId("section-sources");
      expect(section.textContent).not.toMatch(TIER_WORDS);
      expect(within(section).getAllByTestId(/^source-item-/)).toHaveLength(3);
    }
  );

  // @req REQ-161
  it("names each source's kind, and nothing for a source without one", () => {
    setViewportWidth(430);
    renderSheet({
      sources: [
        { ...baseSource, id: "k1", sourceKind: "archive" },
        { ...baseSource, id: "k2" },
      ],
    });

    expect(screen.getByTestId("source-item-k1").textContent).toContain(
      "Archive"
    );
    expect(
      screen.getByTestId("source-item-k2").querySelector("[data-source-kind]")
    ).toBeNull();
  });

  // @req REQ-092
  it("prints no tier word inside a contested assertion's positions", () => {
    setViewportWidth(430);
    renderSheet({
      sources: [],
      positions: [
        { position: "Origine nilotique", sources: sources.slice(0, 2) },
        { position: "Origine bantoue", sources: sources.slice(2) },
      ],
    });

    const section = screen.getByTestId("section-sources");
    expect(section.textContent).not.toMatch(TIER_WORDS);
    expect(within(section).getAllByTestId(/^source-item-/)).toHaveLength(3);
  });

  // @req REQ-174
  it("keeps reviewed oral narratives under their own heading", () => {
    setViewportWidth(430);
    renderSheet({
      sources: [
        ...sources,
        {
          ...baseSource,
          id: "narrative-1",
          title: "Récit du fondateur",
          tier: "unverified",
          reviewedNarrative: true,
        },
      ],
    });

    const narratives = screen.getByTestId("reviewed-narratives-group");
    expect(narratives).toHaveTextContent("Récits oraux relus");
    expect(
      within(narratives).getByTestId("source-item-narrative-1")
    ).toBeInTheDocument();
  });
});

describe("LazySourceChainSheet", () => {
  it("imports cleanly from the dedicated lazy file", async () => {
    const mod = await import("../SourceChainSheet.lazy");
    expect(mod.LazySourceChainSheet).toBeDefined();
    expect(typeof mod.LazySourceChainSheet).toBe("function");
  });
});
