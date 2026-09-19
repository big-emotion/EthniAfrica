import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import * as nextNavigation from "next/navigation";
import { RecherchePageContent } from "../RecherchePageContent";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { getLocalizedRoute, getPeopleRoute } from "@/lib/routing";
import { SEARCH_RESULT_GROUPS } from "@/lib/search/searchVocabulary";

// ── next/navigation ──────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
}));

// ── hooks ────────────────────────────────────────────────────────────────────
const locale = vi.hoisted(() => ({ language: "fr" as "fr" | "en" }));

vi.mock("@/hooks/use-language", () => ({
  useLanguage: () => ({ language: locale.language, setLanguage: vi.fn() }),
}));

// ── layout (avoid rendering nav, consent banners, etc.) ─────────────────────
// The mock keeps `page-layout` wrapping only `children` — the
// ".afh-shell wraps content" test below asserts on its firstElementChild —
// and renders the hero head as a *sibling*, mirroring how the real
// `PageHero` sits outside `<main>`. `screen` queries the whole document, so
// tests can still find the h1 regardless of which container it lives in.
vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    title,
    subtitle,
    heroHead,
  }: {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    heroHead?: React.ReactNode;
  }) => (
    <>
      <div data-testid="page-hero-mock">
        {heroHead ?? (title ? <h1>{title}</h1> : null)}
        {subtitle ? <p data-testid="page-subtitle">{subtitle}</p> : null}
      </div>
      <div data-testid="page-layout">{children}</div>
    </>
  ),
}));

// ── next/link ────────────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

// ── browser APIs ──────────────────────────────────────────────────────────────
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock;

const mockFetch = vi.fn();
const mockCompanionFetch = vi.fn();
global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
  const target = String(input).startsWith("/api/v2/search/companions?")
    ? mockCompanionFetch
    : mockFetch;
  return init ? target(input, init) : target(input);
}) as unknown as typeof fetch;

// ── fixtures ─────────────────────────────────────────────────────────────────
// These mirror the envelope /api/v2/search actually emits: typed arrays of
// domain rows. An earlier `{ results: [...] }` fixture was invented here, and
// it kept the suite green while the page rendered nothing in production.
const emptyApiResponse = {
  data: { peoples: [], countries: [], families: [], total: 0 },
};
const emptyCompanionsApiResponse = {
  data: {
    subjects: [],
    shorts: { count: 0, items: [] },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    images: { count: 0, items: [] },
    quiz: { count: 0, item: null },
  },
};
const suggestApiResponse = {
  data: {
    peoples: [
      { id: "PPL_SHONA", nameMain: "Shona", content: {} },
      { id: "PPL_YORUBA", nameMain: "Yoruba", content: {} },
    ],
    countries: [],
    families: [],
    total: 2,
  },
};
const searchApiResponse = {
  data: {
    peoples: [
      {
        id: "PPL_ZULU",
        nameMain: "Zulu",
        languageFamilyId: "FLG_NIGER_CONGO",
        currentCountries: ["ZAF"],
        content: { demography: { totalPopulation: 12000000 } },
      },
    ],
    countries: [],
    families: [],
    total: 1,
  },
};
const englishChadApiResponse = {
  data: {
    peoples: [],
    countries: [
      {
        id: "TCD",
        nameFr: "Tchad",
        nameEn: "Chad",
        relevance: 1,
        exactMatch: true,
        content: {},
      },
    ],
    families: [],
    total: 1,
  },
};
const desktopPivotApiResponse = {
  data: {
    peoples: [
      {
        id: "PPL_ZULU",
        nameMain: "Zulu",
        currentCountries: ["ZAF"],
        content: {
          demography: { totalPopulation: 12_000_000 },
          sources: [
            {
              title: "Ethnologue — Zulu",
              url: "https://www.ethnologue.com/language/zul/",
            },
          ],
        },
        relevance: 0.9,
        exactMatch: true,
        confidence: 0.84,
      },
      {
        id: "PPL_NDEBELE",
        nameMain: "Ndébélé",
        content: {},
        relevance: 0.5,
      },
      {
        id: "PPL_XHOSA",
        nameMain: "Xhosa",
        content: {},
        relevance: 0.4,
      },
    ],
    countries: [],
    families: [],
    total: 3,
  },
};

// ── helpers ───────────────────────────────────────────────────────────────────
function okJson(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response);
}

async function renderPivotWithRelatedResults() {
  mockFetch.mockResolvedValue(okJson(desktopPivotApiResponse));
  render(<RecherchePageContent />);

  await act(async () => {
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Zulu" },
    });
    fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  await waitFor(() => {
    expect(screen.getByTestId("feed-block-fiches")).toBeInTheDocument();
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

/**
 * The words a heading uses to claim a kind, folded so a plural claim answers
 * for a singular one — the panel heads a set ("Langues") where the SERP
 * addresses a reader ("une langue").
 */
const claimStems = (heading: string) =>
  heading
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/s$/, ""));

describe("the scope the SERP declares", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof nextNavigation.useSearchParams>
    );
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    mockCompanionFetch.mockResolvedValue(okJson(emptyCompanionsApiResponse));
  });

  // The landing state of /fr/recherche is where a reader decides whether the
  // engine can answer a language or a surname at all. Its scope wording is
  // static prose: unlike a lens chip, which SearchLensBar drops when a kind
  // returns nothing, a sentence cannot retract itself. So it owes the reader
  // every kind the search can return — derived from the panel's own registry
  // rather than restated here, which is how it came to promise three of five.
  // @req REQ-002
  it("names every kind the search can return, in both of its scope statements", () => {
    render(<RecherchePageContent />);

    const scopeStatements = [
      screen.getByTestId("page-subtitle").textContent ?? "",
      screen.getByRole("combobox").getAttribute("aria-label") ?? "",
    ];

    for (const statement of scopeStatements) {
      const folded = statement.toLowerCase();
      for (const { heading } of SEARCH_RESULT_GROUPS) {
        for (const stem of claimStems(heading)) {
          expect(folded).toContain(stem);
        }
      }
    }
  });

  // `persons` has no rows, so naming it would promise an answer the corpus
  // cannot give — the same reason SEARCH_RESULT_GROUPS leaves it out and the
  // lens bar filters it away at zero. The neutral accent it takes in the
  // palette (REQ-126) follows from that, it does not cause it.
  // @req REQ-002
  it("names no kind the corpus cannot answer with", () => {
    render(<RecherchePageContent />);

    const combobox = screen.getByRole("combobox");
    const wording = [
      screen.getByTestId("page-subtitle").textContent ?? "",
      combobox.getAttribute("aria-label") ?? "",
      combobox.getAttribute("placeholder") ?? "",
    ];

    for (const statement of wording) {
      expect(statement.toLowerCase()).not.toContain("personne");
    }
  });
});

describe("RecherchePageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locale.language = "fr";
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof nextNavigation.useSearchParams>
    );
    // Only the navigation methods this component calls are stubbed. The cast
    // keeps the mock from having to track every field Next adds to
    // AppRouterInstance — 16.3 added `bfcacheId`, which no test asserts on.
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(emptyApiResponse),
    });
    mockCompanionFetch.mockResolvedValue(okJson(emptyCompanionsApiResponse));
  });

  // ── 1. basic structure ─────────────────────────────────────────────────────

  it("renders a text input for search", () => {
    render(<RecherchePageContent />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders a visible submit button labelled Rechercher", () => {
    render(<RecherchePageContent />);
    expect(
      screen.getByRole("button", { name: /rechercher/i })
    ).toBeInTheDocument();
  });

  // @req REQ-140
  it("renders the idle search surface in English", () => {
    locale.language = "en";
    render(<RecherchePageContent />);

    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
    expect(
      screen.getByRole("search", { name: "Search form" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAccessibleName(
      "Search for a people, language, country, language family or surname"
    );
  });

  // @req REQ-140
  it("renders an exact English country name in the feed verdict", async () => {
    locale.language = "en";
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("q=Chad") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );
    mockFetch.mockResolvedValue(okJson(englishChadApiResponse));

    await act(async () => {
      render(<RecherchePageContent />);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(await screen.findByTestId("feed-block-verdict")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Chad" })
    ).toBeInTheDocument();
  });

  it("always renders the filter chip row (even with no active filters)", () => {
    render(<RecherchePageContent />);
    expect(screen.getByTestId("filter-chip-row")).toBeInTheDocument();
  });

  // ── design system wiring (ETNI-1386) ───────────────────────────────────────

  // @req REQ-002
  it("wraps its content in .afh-shell instead of the ad-hoc max-w-4xl container", () => {
    const { container } = render(<RecherchePageContent />);
    const wrapper = screen.getByTestId("page-layout").firstElementChild;
    expect(wrapper?.className).toContain("afh-shell");
    expect(wrapper?.className).not.toMatch(/max-w-4xl|mx-auto\b/);
    // px-4 is an ad-hoc gutter; .afh-shell owns the gutter via --afh-page-padding.
    expect(container.querySelector(".afh-shell")).not.toBeNull();
  });

  // @req REQ-002
  it("drives structural spacing from --afh-* tokens, not raw step utilities", () => {
    const { container } = render(<RecherchePageContent />);
    const raw = container.innerHTML;
    expect(raw).not.toMatch(/\bspace-y-6\b/);
    expect(raw).not.toMatch(/\bspace-y-3\b/);
  });

  // @req REQ-002
  it("uses the project's md breakpoint on the search form row, not sm", () => {
    render(<RecherchePageContent />);
    const form = screen.getByRole("search", {
      name: /formulaire de recherche/i,
    });
    expect(form.className).toContain("md:flex-row");
    expect(form.className).not.toMatch(/\bsm:flex-row\b/);
  });

  // A relation is the one filter left; it renders its own dismissible chip
  // (see "shows the active relation as a dismissible chip" below) and clears
  // via the same chip button, so there is nothing else for a "Tout effacer"
  // interplay test to cover once classification/confidence/region are gone.
  // @req REQ-002
  it("does NOT show 'Tout effacer' when no relation is active", () => {
    render(<RecherchePageContent />);
    expect(screen.queryByText(/tout effacer/i)).not.toBeInTheDocument();
  });

  // ── 4. URL sync ────────────────────────────────────────────────────────────

  it("populates the input from the q URL param", () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("q=Yoruba") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );
    render(<RecherchePageContent />);
    expect(screen.getByRole("combobox")).toHaveValue("Yoruba");
  });

  // ── 5. auto-suggest ────────────────────────────────────────────────────────

  /**
   * The field declared `role="searchbox"` over a listbox it never claimed —
   * no `aria-expanded`, no `aria-controls`, no `aria-activedescendant`. A
   * searchbox cannot own suggestions, so under a screen reader the canonical
   * search surface offered none, while the accueil and the compare picker
   * offered the same suggestions correctly.
   */
  // @req REQ-002
  it("declares the combobox contract over the suggestions it owns", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(suggestApiResponse),
    });
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");

    expect(input).toHaveAttribute("aria-expanded", "false");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Yo" } });
      await new Promise((r) => setTimeout(r, 350));
    });

    const listbox = await screen.findByRole("listbox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", listbox.id);
    expect(input).toHaveAttribute("aria-autocomplete", "list");
  });

  // @req REQ-002
  it("walks the suggestions with the arrow keys and points at the highlighted one", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(suggestApiResponse),
    });
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Yo" } });
      await new Promise((r) => setTimeout(r, 350));
    });
    await screen.findByRole("listbox");

    expect(input).not.toHaveAttribute("aria-activedescendant");

    await act(async () => {
      fireEvent.keyDown(input, { key: "ArrowDown" });
    });

    const [firstOption] = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", firstOption.id);
    expect(firstOption).toHaveAttribute("aria-selected", "true");
  });

  /**
   * Below `md` the form stacks, input above button. A panel hung from the
   * input's own wrapper dropped straight over « Rechercher »: a tap meant to
   * submit the typed words landed on a suggestion instead, and the nightly
   * direct-navigation spec timed out because the button could not be clicked
   * at 720 px. Hung from the form, the panel opens under both controls.
   */
  // @req REQ-002
  it("hangs the suggestions below the whole form, never over its submit button", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(suggestApiResponse),
    });
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Yo" },
      });
      await new Promise((r) => setTimeout(r, 350));
    });

    const listbox = await screen.findByRole("listbox");
    const form = screen.getByRole("search", {
      name: /formulaire de recherche/i,
    });
    const submit = within(form).getByRole("button", { name: "Rechercher" });

    expect(listbox.parentElement).toBe(form);
    expect(form.className).toMatch(/(^|\s)relative(\s|$)/);
    expect(listbox.className).toMatch(/(^|\s)top-full(\s|$)/);
    expect(
      submit.compareDocumentPosition(listbox) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-002
  it("closes the suggestions on Escape without emptying the field", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(suggestApiResponse),
    });
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Yo" } });
      await new Promise((r) => setTimeout(r, 350));
    });
    await screen.findByRole("listbox");

    await act(async () => {
      fireEvent.keyDown(input, { key: "Escape" });
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("Yo");
  });

  it("calls /api/v2/search?...&limit=6 when input reaches 2 chars", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(suggestApiResponse),
    });
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Yo" } });
      // advance debounce
      await new Promise((r) => setTimeout(r, 350));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v2\/search\?.*limit=6/)
    );
  });

  // @req REQ-140
  it("sends the page locale with English suggestions", async () => {
    locale.language = "en";
    mockFetch.mockResolvedValue(okJson(suggestApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Yo" },
      });
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v2\/search\?.*lang=en/)
    );
  });

  // @req REQ-140
  it("sends the page locale with an English committed search", async () => {
    locale.language = "en";
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Chad" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^search$/i }));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v2\/search\?.*limit=20.*lang=en/),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("does NOT call the suggest API when input is shorter than 2 chars", async () => {
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Y" } });
      await new Promise((r) => setTimeout(r, 350));
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("displays suggestion entries in a listbox after typing 2+ chars", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(suggestApiResponse),
    });
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");

    await act(async () => {
      fireEvent.change(input, { target: { value: "Yo" } });
      await new Promise((r) => setTimeout(r, 350));
    });

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });
    expect(screen.getByText("Shona")).toBeInTheDocument();
    expect(screen.getByText("Yoruba")).toBeInTheDocument();
  });

  // ── 6. empty state (post-search, no results) ───────────────────────────────

  // @req REQ-178
  it("admits the atlas does not hold the name, rather than reporting a count", async () => {
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "xyzzy" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
    expect(screen.getByText(nameAnswerCopy.fr.unknownName)).toBeInTheDocument();
  });

  // The confession is owed for a name nothing came close to — not for a typo,
  // which the near-miss leads answer on their own. Asserting the two apart is
  // the point: stacked, the page would confess a gap the corpus does not have.
  // @req REQ-178
  it("keeps the confession off a search the engine found near-misses for", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [],
          countries: [],
          families: [],
          languages: [],
          patronymes: [],
          persons: [],
          total: 0,
          leads: [
            {
              kind: "people",
              id: "PPL_MANDINKA",
              name: "Mandinka",
              similarity: 0.6,
            },
          ],
        },
        meta: {},
      })
    );
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "mandink" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Vouliez-vous dire Mandinka ?")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("feed-block-owed")).not.toBeInTheDocument();
  });

  // @req REQ-002
  it("empty state links to the families directory", async () => {
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "xyzzy" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      const link = screen.getByRole("link", {
        name: nameAnswerCopy.fr.browseFamilies,
      });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute("href")).toBe(
        getLocalizedRoute("fr", "families")
      );
    });
  });

  // @req REQ-178
  it("targets the contribution flow at the typed unknown name", async () => {
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "xyzzy" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      const actions = screen.getAllByRole("button", {
        name: nameAnswerCopy.fr.invitationAction,
      });
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) {
        expect(action).toHaveAttribute("data-flag-kind", "contribution");
      }
    });
  });

  // An unanswered request is not a silence in the corpus. The confession names
  // the atlas as the thing that is missing something, so putting it on an
  // outage publishes a claim about the corpus that the corpus never made —
  // and the loader already separates the two facts through `answered`.
  // @req REQ-178
  it("does not confess a gap when the search never reached the corpus", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "bambara" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(
        screen.getByText(nameAnswerCopy.fr.searchUnavailable)
      ).toBeInTheDocument();
    });
    expect(screen.queryByTestId("feed-block-verdict")).not.toBeInTheDocument();
  });

  // Measured on « peul », which the corpus answers with `Fula (Fulbe / Peul)`:
  // 40 million people, found and listed, under a page saying the atlas does not
  // know the name. The subject selector matches a name exactly and returns
  // nothing here, which is right — but nothing is not the same fact as the
  // corpus holding nothing, and only the second one is a confession.
  // @req REQ-178
  it("does not confess a gap while it is listing results for the query", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "zoulou" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-fiches")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(nameAnswerCopy.fr.unknownName)
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "zoulou"
    );
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(
      "Zulu"
    );
  });

  // @req REQ-125
  it("empty state renders the near-miss leads the API returns", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [],
          countries: [],
          families: [],
          total: 0,
          leads: [
            {
              kind: "people",
              id: "PPL_BAMBARA",
              name: "Bambara",
              similarity: 0.4,
            },
          ],
        },
      })
    );
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "bamba" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Bambara/ })).toHaveAttribute(
        "href",
        getPeopleRoute("fr", "PPL_BAMBARA")
      );
    });
  });

  // @req REQ-125
  it("empty state omits the leads cartouche when the API returns none", async () => {
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "xyzzy" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("feed-block-fiches")).not.toBeInTheDocument();
  });

  // ── 7. results list ────────────────────────────────────────────────────────

  // @req REQ-002
  it("renders a result after a successful search", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    render(<RecherchePageContent />);

    const input = screen.getByRole("combobox");
    const submit = screen.getByRole("button", { name: /rechercher/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: "Zulu" } });
      fireEvent.click(submit);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
  });

  // @req REQ-002
  it("makes every result tile a link to its fiche", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "peuples zoulous" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Zulu/ })).toHaveAttribute(
        "href",
        getPeopleRoute("fr", "PPL_ZULU")
      );
    });
  });

  // @req REQ-002
  it("orders results by relevance across entity kinds, not peoples first", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [
            { id: "PPL_LOW", nameMain: "Peuple", relevance: 0.2, content: {} },
          ],
          countries: [{ id: "CIV", nameFr: "Côte d'Ivoire", relevance: 0.3 }],
          families: [],
          total: 2,
        },
      })
    );

    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "ivoire" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    // The envelope groups peoples first; the feed must reorder its fiche links
    // across kinds rather than fall through to that transport order.
    await waitFor(() => {
      const links = within(
        screen.getByTestId("feed-block-fiches")
      ).getAllByRole("link");
      expect(links[0]).toHaveTextContent("Côte d'Ivoire");
      expect(links[1]).toHaveTextContent("Peuple");
    });
  });

  // @req REQ-002
  it("groups split fiches of the same people into one card (ETNI-1391)", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [
            {
              id: "PPL_FULANI",
              nameMain: "Peul",
              relevance: 0.5,
              content: {
                appellations: {
                  peopleGroupId: "PGRP_FULANI",
                  peopleGroupLabel: "Peul / Fulani",
                },
              },
            },
            {
              id: "PPL_FULANI_MASSINA",
              nameMain: "Peul du Massina",
              relevance: 0.4,
              content: {
                appellations: {
                  peopleGroupId: "PGRP_FULANI",
                  peopleGroupLabel: "Peul / Fulani",
                },
              },
            },
          ],
          countries: [],
          families: [],
          total: 2,
        },
      })
    );
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "fulani" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-people-group")).toBeInTheDocument();
    });
    const group = screen.getByTestId("feed-people-group");
    expect(within(group).getByRole("link", { name: "Peul" })).toHaveAttribute(
      "href",
      getPeopleRoute("fr", "PPL_FULANI")
    );
    expect(
      within(group).getByRole("link", { name: "Peul du Massina" })
    ).toHaveAttribute("href", getPeopleRoute("fr", "PPL_FULANI_MASSINA"));
  });

  // @req REQ-002
  it("runs a family-scoped search when the URL carries one and no query", async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("family=FLG_KROU") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );
    mockFetch.mockResolvedValue(okJson(searchApiResponse));

    await act(async () => {
      render(<RecherchePageContent />);
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("familyId=FLG_KROU"),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  // The page no longer builds the query itself — it calls the shared client
  // (ETNI-1415 AC2). The classification/confidence filters this once also
  // carried are retired (ETNI-1808); only the page limit and the query text
  // reach the request now, together with the page locale.
  // @req REQ-002
  it("carries the page limit onto the request", async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("q=Zulu") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );
    mockFetch.mockResolvedValue(okJson(searchApiResponse));

    await act(async () => {
      render(<RecherchePageContent />);
      await new Promise((r) => setTimeout(r, 100));
    });

    const requested = new URL(
      String(mockFetch.mock.calls[0][0]),
      "http://localhost"
    );
    expect(Object.fromEntries(requested.searchParams)).toEqual({
      q: "Zulu",
      limit: "20",
      lang: "fr",
    });
  });

  // @req REQ-002
  it("shows the active relation as a dismissible chip", async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("country=CIV") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );
    mockFetch.mockResolvedValue(okJson(searchApiResponse));

    await act(async () => {
      render(<RecherchePageContent />);
      await new Promise((r) => setTimeout(r, 100));
    });

    const chipRow = screen.getByTestId("filter-chip-row");
    expect(
      within(chipRow).getByText(
        /peuples du pays côte d’ivoire|peuples du pays côte d'ivoire/i
      )
    ).toBeInTheDocument();
  });

  // @req REQ-002
  // DEC-057 retired the dominant answer, and with it the ten tests that stood
  // here: they specified its side rail, its sticky pinning, its bottom-sheet
  // fallback and the two-column grid of the remainder — a layout whose
  // structure asserted one entity above the rest. What follows asserts the
  // promise that replaced it: every name shown, none crowned.
  // @req REQ-178
  it("answers the searched name without promoting any form of it", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Zulu" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("search-pivot")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("dominant-answer-panel-wrapper")
    ).not.toBeInTheDocument();
  });

  // The rail is gone rather than moved: pushing it below would have kept the
  // hierarchy it asserts and only changed where the assertion sits.
  // @req REQ-178
  it("mounts exactly one viewport-specific feed tree", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Zulu" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    const layout = await screen.findByTestId("feed-layout");
    expect(screen.getAllByTestId("feed-layout")).toHaveLength(1);
    expect(layout).toHaveAttribute("data-feed-layout", "mobile");
  });

  it("input uses autocomplete=off to prevent browser search history", () => {
    render(<RecherchePageContent />);
    const input = screen.getByRole("combobox");
    expect(input.getAttribute("autocomplete")).toBe("off");
  });

  // ── 9. SERP consolidation (ETNI-1808) ──────────────────────────────────────

  // @req REQ-124
  it("shows the result grid and no empty-state once a ?q= arrival resolves, with the suggest dropdown closed", async () => {
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("q=Zulu") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [
            { id: "PPL_ZULU", nameMain: "Zulu", relevance: 0.4, content: {} },
            {
              id: "PPL_XHOSA",
              nameMain: "Xhosa",
              relevance: 0.35,
              content: {},
            },
          ],
          countries: [],
          families: [],
          total: 2,
        },
      })
    );

    await act(async () => {
      render(<RecherchePageContent />);
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-fiches")).toBeInTheDocument();
    });
    expect(
      screen.queryByText(nameAnswerCopy.fr.unknownName)
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  // @req REQ-124
  it("omits unavailable optional companion lenses from the feed", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [
            { id: "PPL_ZULU", nameMain: "Zulu", relevance: 0.4, content: {} },
          ],
          countries: [],
          families: [],
          total: 1,
          peoplesTotal: 1,
          countriesTotal: 0,
          familiesTotal: 0,
          languagesTotal: 0,
          personsTotal: 0,
          patronymesTotal: 0,
        },
      })
    );
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "peuples zoulous" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-lenses")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Tout" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Shorts 0" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Fiches 1" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Images\b/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Jeux\b/ })
    ).not.toBeInTheDocument();
  });

  // @req REQ-124
  it("titles the answered feed with the searched name", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [
            {
              id: "PPL_ZULU",
              nameMain: "Zulu",
              content: { appellations: { selfAppellation: "amaZulu" } },
            },
          ],
          countries: [],
          families: [],
          total: 1,
        },
      })
    );
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Zulu" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Zulu");
    expect(heading).not.toHaveTextContent(/résultat/i);
  });

  // @req REQ-124
  it("uses the first equally ranked subject as the feed title", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [
            { id: "A", nameMain: "Bété", relevance: 0.8, content: {} },
            { id: "B", nameMain: "BETE", relevance: 0.1, content: {} },
          ],
          countries: [],
          families: [],
          total: 2,
        },
      })
    );
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "Bété" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Bété" })
    ).toBeInTheDocument();
  });

  // The head counts an answer, and there is none to count. It was printing
  // « 0 résultat pour « X » » directly above « Nous ne connaissons pas ce
  // nom » — two answers to one question, and a count is the colder of the
  // two. The boards give this case no count head at all.
  // @req REQ-178
  it("uses the searched spelling rather than a zero-result title", async () => {
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "xyzzy" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "xyzzy"
    );
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(
      /résultat/i
    );
  });

  // @req REQ-124
  it("titles the page 'Recherche' before any query is committed", () => {
    render(<RecherchePageContent />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Recherche"
    );
  });

  // @req REQ-124
  it("renders the unknown verdict exactly once, with no fiche shelf", async () => {
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    render(<RecherchePageContent />);

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "xyzzy" },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(screen.getAllByText(nameAnswerCopy.fr.unknownName)).toHaveLength(
        1
      );
    });
    expect(screen.queryByTestId("feed-block-fiches")).not.toBeInTheDocument();
  });
});

describe("RecherchePageContent feed orchestration", () => {
  const routerReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    locale.language = "fr";
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof nextNavigation.useSearchParams>
    );
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: routerReplace,
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    mockCompanionFetch.mockResolvedValue(okJson(emptyCompanionsApiResponse));
  });

  async function submitQuery(query: string) {
    render(<RecherchePageContent />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: query },
    });
    fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
  }

  // @req REQ-180
  it("loads companions once after a resolved search with its typed subject", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));

    await submitQuery("Zulu");
    await screen.findByTestId("feed-layout");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockCompanionFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.invocationCallOrder[0]).toBeLessThan(
      mockCompanionFetch.mock.invocationCallOrder[0]
    );
    const requested = new URL(
      String(mockCompanionFetch.mock.calls[0][0]),
      "http://localhost"
    );
    expect(Object.fromEntries(requested.searchParams)).toEqual({
      subjects: "people:PPL_ZULU",
      lang: "fr",
    });
    expect(document.querySelector("[data-feed-root]")).not.toBeNull();
  });

  // @req REQ-180
  it("loads the unknown-name feed with no companion subjects", async () => {
    await submitQuery("xyzzy");
    await screen.findByTestId("feed-layout");

    const requested = new URL(
      String(mockCompanionFetch.mock.calls[0][0]),
      "http://localhost"
    );
    expect(Object.fromEntries(requested.searchParams)).toEqual({ lang: "fr" });
    expect(screen.getByTestId("feed-block-verdict")).toBeInTheDocument();
    expect(screen.getByTestId("feed-block-owed")).toBeInTheDocument();
    expect(screen.getByTestId("feed-block-further")).toBeInTheDocument();
  });

  // @req REQ-180
  it("keeps unsupported person hits in related-only results", async () => {
    mockFetch.mockResolvedValue(
      okJson({
        data: {
          peoples: [],
          countries: [],
          families: [],
          persons: [
            {
              id: "PER_DELAFOSSE",
              fullName: "Maurice Delafosse",
              roleCategory: "ethnographer",
              exactMatch: true,
            },
          ],
          total: 1,
        },
      })
    );

    await submitQuery("Maurice Delafosse");
    await screen.findByTestId("feed-layout");

    const requested = new URL(
      String(mockCompanionFetch.mock.calls[0][0]),
      "http://localhost"
    );
    expect(Object.fromEntries(requested.searchParams)).toEqual({ lang: "fr" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Maurice Delafosse"
    );
    expect(
      screen.getByText(searchFeedCopy.fr.answer.relatedOnly)
    ).toBeVisible();
    expect(screen.queryByTestId("feed-block-owed")).toBeNull();
  });

  // @req REQ-180
  it("shows a retry state without substitute shelves when companions fail", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    mockCompanionFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: { message: "Unavailable" } }),
    } as Response);

    await submitQuery("Zulu");
    expect(await screen.findByTestId("search-feed-failed")).toHaveClass(
      "mt-afh-5xl"
    );

    expect(document.querySelectorAll("[data-feed-block]")).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Réessayer" })
    ).toBeInTheDocument();
  });

  // @req REQ-180
  it("retries both requests and renders the feed after a transient companion failure", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    mockCompanionFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: { message: "Unavailable" } }),
      } as Response)
      .mockResolvedValueOnce(okJson(emptyCompanionsApiResponse));

    await submitQuery("Zulu");
    fireEvent.click(await screen.findByRole("button", { name: "Réessayer" }));
    await screen.findByTestId("feed-layout");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockCompanionFetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("search-feed-failed")).not.toBeInTheDocument();
  });

  // @req REQ-180
  it("clears the query and aborts its in-flight search", async () => {
    let resolveSearch!: (response: Response) => void;
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveSearch = resolve;
      })
    );

    await submitQuery("Zulu");
    expect(await screen.findByTestId("search-feed-loading")).toHaveClass(
      "mt-afh-5xl"
    );
    const signal = (mockFetch.mock.calls[0][1] as RequestInit).signal;

    fireEvent.click(screen.getByRole("button", { name: "Effacer" }));

    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(document.querySelector("[data-feed-root]")).toBeNull();
    expect(routerReplace).toHaveBeenLastCalledWith(
      getLocalizedRoute("fr", "search"),
      {
        scroll: false,
      }
    );

    resolveSearch({
      ok: true,
      json: () => Promise.resolve(searchApiResponse),
    } as Response);
  });

  // @req REQ-180
  it("keeps a stale response from replacing the newer query", async () => {
    let resolveZulu!: (response: Response) => void;
    const xhosaApiResponse = {
      data: {
        peoples: [
          { id: "PPL_XHOSA", nameMain: "Xhosa", exactMatch: true, content: {} },
        ],
        countries: [],
        families: [],
        total: 1,
      },
    };
    mockFetch
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveZulu = resolve;
        })
      )
      .mockResolvedValueOnce(okJson(xhosaApiResponse));

    await submitQuery("Zulu");
    await screen.findByTestId("search-feed-loading");
    const zuluSignal = (mockFetch.mock.calls[0][1] as RequestInit).signal;

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Xhosa" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Xhosa" })
    ).toBeInTheDocument();
    expect(zuluSignal?.aborted).toBe(true);

    await act(async () => {
      resolveZulu({
        ok: true,
        json: () => Promise.resolve(searchApiResponse),
      } as Response);
      await Promise.resolve();
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Xhosa" })
    ).toBeInTheDocument();
    expect(mockCompanionFetch).toHaveBeenCalledTimes(1);
  });

  // @req REQ-180
  it.each(["country=CIV", "q=Zulu&country=CIV"])(
    "keeps relation search %s on the legacy path without companions",
    async (params) => {
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams(params) as ReturnType<
          typeof nextNavigation.useSearchParams
        >
      );
      mockFetch.mockResolvedValue(okJson(searchApiResponse));

      render(<RecherchePageContent />);
      await screen.findByTestId("search-results-list");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockCompanionFetch).not.toHaveBeenCalled();
      expect(document.querySelector("[data-feed-root]")).toBeNull();
    }
  );
});

/**
 * What the SERP reports about a search.
 *
 * Two blind spots motivated these. A search reaching this page by URL emitted
 * nothing at all — only the modal's submit handler reported — and no event
 * ever carried how many results came back, so a query the corpus cannot
 * answer was indistinguishable from one it answers well.
 *
 * Nothing here carries the query text. These events are counts, ranks and
 * entity kinds; the words a visitor types stay out of the payload, which is
 * what keeps the measurement inside the wording the privacy page carries.
 */
describe("what the SERP reports about a search", () => {
  const plausible = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams() as ReturnType<typeof nextNavigation.useSearchParams>
    );
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      replace: vi.fn(),
      push: vi.fn(),
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
    mockFetch.mockResolvedValue(okJson(emptyApiResponse));
    mockCompanionFetch.mockResolvedValue(okJson(emptyCompanionsApiResponse));
    window.plausible = plausible;
  });

  const submissions = () =>
    plausible.mock.calls.filter(([name]) => name === "search:submit");

  const resultClicks = () =>
    plausible.mock.calls.filter(([name]) => name === "search:result_click");

  async function submit(query: string) {
    render(<RecherchePageContent />);
    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: query },
      });
      fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  }

  // @req REQ-046
  it("counts the results a search returned", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));

    await submit("Zulu");

    await waitFor(() => expect(submissions()).toHaveLength(1));
    expect(submissions()[0][1].props).toMatchObject({
      surface: "serp",
      results: 1,
    });
  });

  // A query the corpus cannot answer is the whole point of the count: it is
  // the list of what readers came for and the atlas does not hold.
  // @req REQ-046
  it("reports zero when a search found nothing", async () => {
    await submit("qqqqqq");

    await waitFor(() => expect(submissions()).toHaveLength(1));
    expect(submissions()[0][1].props).toMatchObject({ results: 0 });
  });

  // A fetch that threw is not a search that found nothing. Folding the two
  // would file network failures under the corpus's own gaps.
  // @req REQ-046
  it("stays silent when the search itself failed", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    await submit("Zulu");

    await waitFor(() =>
      expect(
        screen.getByText(nameAnswerCopy.fr.searchUnavailable)
      ).toBeInTheDocument()
    );
    expect(submissions()).toHaveLength(0);
  });

  // Arriving on ?q= from a link or a bookmark is a search like any other; it
  // reported nothing because only the modal's submit handler was wired.
  // @req REQ-046
  it("reports a search that arrived by URL", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams("q=Zulu") as ReturnType<
        typeof nextNavigation.useSearchParams
      >
    );

    await act(async () => {
      render(<RecherchePageContent />);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(() => expect(submissions()).toHaveLength(1));
    expect(submissions()[0][1].props).toMatchObject({
      surface: "serp",
      results: 1,
    });
  });

  // A search that ran and a search that led somewhere were the same event.
  // @req REQ-046
  it("reports which rank of result tile the reader opened", async () => {
    await renderPivotWithRelatedResults();

    fireEvent.click(
      within(screen.getByTestId("feed-block-fiches")).getAllByRole("link")[0]
    );

    expect(resultClicks()).toHaveLength(1);
    expect(resultClicks()[0][1].props).toMatchObject({
      surface: "serp",
      rank: 1,
    });
  });

  // The pivot is the answer the page leads with, so it holds the first rank —
  // counting it among the cards below would put the dominant answer and the
  // runner-up at the same position.
  // @req REQ-046
  it("ranks the first fiche tile first, since nothing is promoted above it", async () => {
    await renderPivotWithRelatedResults();

    // Nothing sits above the list any more, so the first tile carries rank 1
    // rather than the rank 2 it held beneath the crowned answer.
    fireEvent.click(
      within(screen.getByTestId("feed-block-fiches")).getAllByRole("link")[0]
    );

    expect(resultClicks()).toHaveLength(1);
    expect(resultClicks()[0][1].props).toMatchObject({ rank: 1 });
  });

  // @req REQ-046
  it("never carries the words the visitor typed", async () => {
    mockFetch.mockResolvedValue(okJson(searchApiResponse));

    await submit("Zulu");

    await waitFor(() => expect(submissions()).toHaveLength(1));
    expect(JSON.stringify(plausible.mock.calls)).not.toContain("Zulu");
  });
});
