import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import axe from "axe-core";
import { CompareStickyBar } from "../CompareStickyBar";
import { EntityComparePicker } from "../EntityComparePicker";
import { CompareEntityHeader } from "../CompareEntityHeader";
import { ComparisonView } from "../ComparisonView";
import type {
  CompareCandidate,
  CompareEntityType,
} from "@/hooks/use-compare-selection";
import type { ComparisonColumn, ComparisonPageData } from "@/types/compare";

// axe-core is already a project dependency (used by scripts/a11y-test.ts via
// @axe-core/playwright); running it directly against the jsdom/happy-dom
// render output gives the same rule engine as vitest-axe without adding a
// new package that would need a package-lock.json update (ETNI-485).
async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container);
  const summary = results.violations.map(
    (violation) =>
      `[${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes
        .map((node) => node.target.join(" "))
        .join(", ")})`
  );
  expect(summary).toEqual([]);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

const PEOPLES: CompareCandidate[] = [
  { id: "PPL_YORUBA", type: "peoples", exonym: "Yoruba", autonym: "Yorùbá" },
  { id: "PPL_ZULU", type: "peoples", exonym: "Zulu", autonym: "AmaZulu" },
  { id: "PPL_SHONA", type: "peoples", exonym: "Shona" },
  { id: "PPL_IGBO", type: "peoples", exonym: "Igbo" },
];

const COUNTRIES: CompareCandidate[] = [
  { id: "SEN", type: "countries", exonym: "Sénégal" },
];

const FAMILIES: CompareCandidate[] = [
  { id: "FLG_BANTU", type: "language-families", exonym: "Bantu" },
  { id: "FLG_MANDE", type: "language-families", exonym: "Mandé" },
];

describe("CompareStickyBar", () => {
  // @req REQ-097
  it("shows the N/max count and disables comparer below the minimum", () => {
    const onCompare = vi.fn();
    render(<CompareStickyBar count={1} onCompare={onCompare} />);
    expect(screen.getByText("1/3 sélectionnés")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /comparer/i })).toBeDisabled();
  });

  // @req REQ-097
  it("enables comparer at 2 selections and calls onCompare when clicked", () => {
    const onCompare = vi.fn();
    render(<CompareStickyBar count={2} onCompare={onCompare} />);
    const button = screen.getByRole("button", { name: /comparer/i });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onCompare).toHaveBeenCalledTimes(1);
  });

  // @req REQ-097
  it("exposes a labelled region so it can be located regardless of DOM position", () => {
    render(<CompareStickyBar count={0} onCompare={vi.fn()} />);
    expect(
      screen.getByRole("region", { name: /sélection de comparaison/i })
    ).toBeInTheDocument();
  });
});

describe("EntityComparePicker", () => {
  let fetchSuggestions: (
    type: CompareEntityType,
    query: string
  ) => Promise<CompareCandidate[]>;

  beforeEach(() => {
    fetchSuggestions = vi.fn(async (type: CompareEntityType) => {
      if (type === "peoples") return PEOPLES;
      if (type === "countries") return COUNTRIES;
      return FAMILIES;
    });
  });

  function renderPicker(onCompare = vi.fn()) {
    return render(
      <EntityComparePicker
        language="fr"
        onCompare={onCompare}
        fetchSuggestions={fetchSuggestions}
      />,
      { wrapper: createWrapper() }
    );
  }

  // @req REQ-097
  it("renders a labelled type radiogroup before the search combobox", () => {
    renderPicker();
    const radiogroup = screen.getByRole("radiogroup", {
      name: /type de page/i,
    });
    expect(
      within(radiogroup).getByRole("radio", { name: /peuples/i })
    ).toBeInTheDocument();
    expect(
      within(radiogroup).getByRole("radio", { name: /pays/i })
    ).toBeInTheDocument();
    expect(
      within(radiogroup).getByRole("radio", {
        name: /familles linguistiques/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  // @req REQ-097
  it("fetches suggestions from /v2/search once ≥2 characters are typed", async () => {
    renderPicker();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "y" } });
    expect(fetchSuggestions).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "yo" } });
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalled());
    expect(fetchSuggestions).toHaveBeenCalledWith("peoples", "yo");
    expect(
      await screen.findByRole("option", { name: /yoruba/i })
    ).toBeInTheDocument();
  });

  // @req REQ-097
  it("fetches family suggestions from /v2/search once ≥2 characters are typed, same as peoples and countries (DEC-027)", async () => {
    renderPicker();
    fireEvent.click(
      screen.getByRole("radio", { name: /familles linguistiques/i })
    );
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "b" } });
    expect(fetchSuggestions).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "ba" } });
    await waitFor(() => expect(fetchSuggestions).toHaveBeenCalled());
    expect(fetchSuggestions).toHaveBeenCalledWith("language-families", "ba");
    expect(
      await screen.findByRole("option", { name: /bantu/i })
    ).toBeInTheDocument();
  });

  // @req REQ-097
  it("shows no family suggestions before the 2-character minimum is reached — no more static roster browsed on open", () => {
    renderPicker();
    fireEvent.click(
      screen.getByRole("radio", { name: /familles linguistiques/i })
    );
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  // @req REQ-097
  it("adds an entity via keyboard (ArrowDown + Enter) and announces it politely", async () => {
    renderPicker();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "yo" } });
    const option = await screen.findByRole("option", { name: /yoruba/i });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    await waitFor(() =>
      expect(option).toHaveAttribute("aria-selected", "true")
    );
    fireEvent.keyDown(input, { key: "Enter" });

    expect(
      await screen.findByRole("button", { name: /retirer yorùbá/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Yorùbá ajouté à la comparaison, 1 sur 3"
    );
  });

  // @req REQ-097
  it("closes the listbox on Escape", async () => {
    renderPicker();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "yo" } });
    await screen.findByRole("option", { name: /yoruba/i });

    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.queryByRole("option", { name: /yoruba/i })
      ).not.toBeInTheDocument()
    );
  });

  // @req REQ-097
  it("locks the type radiogroup once a first entity is selected", async () => {
    renderPicker();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "yo" } });
    const option = await screen.findByRole("option", { name: /yoruba/i });
    fireEvent.click(option);

    expect(screen.getByRole("radio", { name: /pays/i })).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: /familles linguistiques/i })
    ).toBeDisabled();
    expect(screen.getByRole("radio", { name: /peuples/i })).toBeEnabled();
  });

  // @req REQ-097
  it("disables the combobox and explains the 3-maximum rule once full", async () => {
    renderPicker();
    const input = screen.getByRole("combobox");

    for (const candidate of PEOPLES.slice(0, 3)) {
      fireEvent.change(input, { target: { value: "yo" } });
      const option = await screen.findByRole("option", {
        name: new RegExp(candidate.exonym, "i"),
      });
      fireEvent.click(option);
    }

    expect(screen.getByText(/3 maximum/i)).toBeInTheDocument();
    expect(input).toBeDisabled();
  });
});

// The picker's default (un-injected) fetcher is what production actually
// wires up — the tests above only prove the picker calls whatever function
// it is given. This proves that function is /api/v2/search itself: the same
// endpoint RecherchePageContent and SearchModalV2 call through
// buildSearchParams/mapSearchEnvelope, so a family search from the compare
// page can no longer diverge from the other two entry points (DEC-027).
describe("EntityComparePicker default fetchSuggestions (DEC-027 canonical path)", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // @req REQ-097
  it("routes family suggestions through /api/v2/search, preserving the database-ranked order", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          families: [
            { id: "FLG_MANDE", nameFr: "Mandé" },
            { id: "FLG_MANDING", nameFr: "Manding" },
          ],
        },
      }),
    });

    render(<EntityComparePicker language="fr" />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(
      screen.getByRole("radio", { name: /familles linguistiques/i })
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "man" },
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const [requestUrl] = mockFetch.mock.calls[0];
    expect(String(requestUrl)).toMatch(/^\/api\/v2\/search\?/);
    expect(String(requestUrl)).toContain("q=man");

    const options = await screen.findAllByRole("option");
    // Not re-sorted client-side: the order the API returned is the order shown.
    expect(options.map((option) => option.textContent)).toEqual([
      "Mandé",
      "Manding",
    ]);
  });

  // @req REQ-097
  it("asks for the suggestion ceiling and keeps only the selected kind", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          families: [{ id: "FLG_MANDE", nameFr: "Mandé" }],
          // The route ranks every kind on the same text; a family picker must
          // not offer a people just because it matched too.
          peoples: [{ id: "PPL_MANDINKA", nameMain: "Mandinka", content: {} }],
        },
      }),
    });

    render(<EntityComparePicker language="fr" />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(
      screen.getByRole("radio", { name: /familles linguistiques/i })
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "man" },
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(String(mockFetch.mock.calls[0][0])).toContain("limit=6");

    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual(["Mandé"]);
  });
});

describe("CompareEntityHeader", () => {
  const column: ComparisonColumn = {
    id: "PPL_ILLUSTRATIVE",
    label: "Peuple Illustratif",
    type: "peuple",
  };

  // Each compared entity used to carry a confidence chip, a « page non
  // auditée » disclaimer when it had no score, and a link explaining how the
  // score is computed. All three told the reader how far to trust the page.
  // @req REQ-194
  it("shows no confidence chip, unaudited disclaimer or score explainer", () => {
    const { container } = render(
      <CompareEntityHeader language="fr" column={column} />
    );

    expect(container.textContent).not.toMatch(
      /confiance|score|non auditée|références · revu/i
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
  });

  // @req REQ-097
  it("shows the ClassificationBadge above the fold when a status is present", () => {
    render(
      <CompareEntityHeader
        language="fr"
        column={{ ...column, classificationStatus: "contested" }}
      />
    );
    expect(screen.getByTestId("classification-icon")).toBeInTheDocument();
  });

  // @req REQ-097
  it("renders no badge for the consensual/default classification status", () => {
    render(<CompareEntityHeader language="fr" column={column} />);
    expect(screen.queryByTestId("classification-icon")).not.toBeInTheDocument();
  });
});

// ETNI-485 — axe-core assertions on the two comparator surfaces named by the
// story's technical notes (ComparisonView + picker), run test-first before
// wiring /fr/comparer into the a11y CI live-route list (scripts/a11y-test.ts).
describe("Accessibility (axe)", () => {
  // Two columns rendered side by side — the case that once caught a
  // landmark-unique violation (two identically labelled regions).
  const unauditedComparison: ComparisonPageData = {
    type: "peuple",
    columns: [
      { id: "PPL_SHONA", label: "Shona", type: "peuple" },
      { id: "PPL_ZULU", label: "Zulu", type: "peuple" },
    ],
    rows: [
      {
        key: "appellations",
        values: { PPL_SHONA: null, PPL_ZULU: null },
      },
    ],
  };

  // @req REQ-097
  it("ComparisonView has no axe violations with multiple unaudited columns (landmark-unique regression)", async () => {
    const { container } = render(
      <ComparisonView language="fr" data={unauditedComparison} />
    );
    await expectNoAxeViolations(container);
  });

  // @req REQ-097
  it("EntityComparePicker has no axe violations", async () => {
    const { container } = render(
      <EntityComparePicker language="fr" fetchSuggestions={async () => []} />,
      { wrapper: createWrapper() }
    );
    await expectNoAxeViolations(container);
  });
});
