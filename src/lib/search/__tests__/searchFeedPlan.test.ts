import path from "node:path";
import { createElement } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecherchePageContent } from "@/components/pages/RecherchePageContent";
import { FEED_CASES } from "@/lib/search/__fixtures__/feedCases";
import {
  buildSearchFeedPlan,
  classifySearchFeed,
  companionSubjectsForSearch,
  isSearchFeedSubject,
} from "@/lib/search/searchFeedPlan";
import {
  loadSearchFeedManifest,
  type SearchFeedManifestEntry,
} from "../../../../e2e/support/search-feed-visual";

const navigation = vi.hoisted(() => ({
  query: "",
  replace: vi.fn(),
}));
const loader = vi.hoisted(() => ({
  search: vi.fn(),
  searchWithLeads: vi.fn(),
  loadSearchCompanions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navigation.query),
  useRouter: () => ({
    replace: navigation.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-language", () => ({
  useLanguage: () => ({ language: "fr", setLanguage: vi.fn() }),
}));

vi.mock("@/lib/afrikLoader", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/afrikLoader")>()),
  search: loader.search,
  searchWithLeads: loader.searchWithLeads,
  loadSearchCompanions: loader.loadSearchCompanions,
}));

vi.mock("@/components/layout/PageLayout", async () => {
  const react = await import("react");
  return {
    PageLayout: ({ children }: { children?: import("react").ReactNode }) =>
      react.createElement("div", { "data-testid": "page-layout" }, children),
  };
});

const manifest = loadSearchFeedManifest(
  path.join(process.cwd(), "docs/design/mockups/search-feed/manifest.json")
);

function setDesktop(matches: boolean) {
  vi.stubGlobal("innerWidth", matches ? 1280 : 430);
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((media: string) => ({
      matches,
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  navigation.query = "";
});

function manifestEntry(
  caseId: string,
  viewport: "mobile" | "desktop"
): SearchFeedManifestEntry {
  const entry = manifest.entries.find(
    (candidate) =>
      candidate.case === caseId && candidate.variant === `${viewport}-day`
  );
  if (!entry) throw new Error(`Missing manifest entry: ${caseId}/${viewport}`);
  return entry;
}

function renderedBlocks(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-feed-block]"),
    (element) => ({
      id: element.getAttribute("data-feed-block"),
      zone: element.getAttribute("data-feed-zone"),
    })
  );
}

function renderedOwedParts(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[data-feed-block="owed"] [data-feed-part]'
    ),
    (element) => element.getAttribute("data-feed-part")
  );
}

// @req REQ-180
describe("search-feed plan", () => {
  // @req REQ-180
  it.each(
    FEED_CASES.flatMap((fixture) =>
      (["mobile", "desktop"] as const).map((viewport) => ({
        fixture,
        viewport,
      }))
    )
  )(
    "renders the approved $viewport page order from production projections for $fixture.id",
    async ({ fixture, viewport }) => {
      setDesktop(viewport === "desktop");
      navigation.query = new URLSearchParams({ q: fixture.query }).toString();
      loader.search.mockResolvedValue([]);
      loader.searchWithLeads.mockResolvedValue(fixture.production.search);
      loader.loadSearchCompanions.mockResolvedValue(
        fixture.production.companions
      );
      const expected = manifestEntry(fixture.id, viewport);

      const { container } = render(createElement(RecherchePageContent));

      await waitFor(() => {
        expect(container.querySelector("[data-feed-root]")).not.toBeNull();
        expect(renderedBlocks(container)).toEqual(expected.blocks);
      });

      expect(renderedOwedParts(container)).toEqual(expected.owedParts);
      expect(loader.searchWithLeads).toHaveBeenCalledTimes(1);
      expect(loader.searchWithLeads).toHaveBeenCalledWith(
        fixture.query,
        expect.objectContaining({
          limit: 20,
          lang: "fr",
          signal: expect.any(AbortSignal),
        })
      );
      expect(loader.loadSearchCompanions).toHaveBeenCalledTimes(1);
      expect(loader.loadSearchCompanions).toHaveBeenCalledWith(
        fixture.production.companions.subjects,
        "fr",
        expect.any(AbortSignal)
      );
    }
  );

  // @req REQ-178
  it("does not add an owed closing for related-only results", () => {
    expect(
      buildSearchFeedPlan("widened", {}, { relatedOnly: true }).mobile
    ).toEqual(["lenses", "verdict", "shorts"]);
  });

  // @req REQ-180
  it("classifies exact, widened, typo and unknown responses from data", () => {
    const exact = FEED_CASES.find(({ id }) => id === "mande")!;
    const widened = FEED_CASES.find(({ id }) => id === "ekpeye")!;
    const typo = FEED_CASES.find(({ id }) => id === "introuvable")!;
    const unknown = FEED_CASES.find(({ id }) => id === "inconnu")!;

    expect(classifySearchFeed(exact.production)).toBe("exact");
    expect(classifySearchFeed(widened.production)).toBe("widened");
    expect(classifySearchFeed(typo.production)).toBe("typo");
    expect(classifySearchFeed(unknown.production)).toBe("unknown");
  });

  // @req REQ-180
  it("does not promote a related result when no entity answers to the searched name", () => {
    const exact = FEED_CASES.find(({ id }) => id === "mande")!;

    expect(
      classifySearchFeed({
        ...exact.production,
        subjects: [],
      })
    ).toBe("widened");
  });

  // @req REQ-180
  it("uses resolved subjects, then typo leads, and permits an empty unknown request", () => {
    const exact = FEED_CASES.find(({ id }) => id === "bassa")!;
    const typo = FEED_CASES.find(({ id }) => id === "introuvable")!;
    const unknown = FEED_CASES.find(({ id }) => id === "inconnu")!;
    const exactSubjectKeys = new Set(
      exact.production.companions.subjects.map(
        ({ entityType, entityId }) => `${entityType}:${entityId}`
      )
    );
    const exactSubjects = exact.production.search.results.filter((result) =>
      exactSubjectKeys.has(`${result.type}:${result.id}`)
    );

    expect(
      companionSubjectsForSearch(exactSubjects, exact.production.search.leads)
    ).toEqual(exact.production.companions.subjects);
    expect(
      companionSubjectsForSearch(
        typo.production.search.results,
        typo.production.search.leads
      )
    ).toEqual(typo.production.companions.subjects);
    expect(
      companionSubjectsForSearch(
        unknown.production.search.results,
        unknown.production.search.leads
      )
    ).toEqual([]);
  });

  // @req REQ-180
  it("keeps unsupported person hits out of feed subject resolution", () => {
    expect(isSearchFeedSubject({ type: "person" })).toBe(false);
    expect(isSearchFeedSubject({ type: "people" })).toBe(true);
  });
});
