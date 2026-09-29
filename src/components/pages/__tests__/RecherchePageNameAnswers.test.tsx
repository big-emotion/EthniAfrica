/**
 * The reviewed answer, end to end: the real v2 handler builds the envelope,
 * the real loader maps it, the real page renders it. Only the database service
 * and the network edge are replaced, and no `feedPresentation` is supplied —
 * the case the visual fixtures could not prove.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/searchService", () => ({ ftsSearch: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/fr/atlas/recherche"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
}));
vi.mock("@/hooks/use-language", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-language")>()),
  useLanguage: () => ({ language: "fr", setLanguage: vi.fn() }),
}));
vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { ftsSearchHandler } from "@/api/v2/handlers/search";
import { ftsSearch } from "@/api/v2/services/searchService";
import { getPeopleRoute } from "@/lib/routing";
import type { FtsSearchResponse } from "@/types/afrik";

import { RecherchePageContent } from "../RecherchePageContent";

class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock;

const emptyCompanions = {
  data: {
    subjects: [],
    shorts: { count: 0, items: [] },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    images: { count: 0, items: [] },
    quiz: { count: 0, item: null },
  },
};

function serviceResponse(
  peoples: Array<Record<string, unknown>>
): FtsSearchResponse {
  return {
    peoples,
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    quizzes: [],
    languages: [],
    results: [],
    peoplesTotal: peoples.length,
    countriesTotal: 0,
    familiesTotal: 0,
    personsTotal: 0,
    patronymesTotal: 0,
    quizzesTotal: 0,
    languagesTotal: 0,
    total: peoples.length,
    leads: [],
    nearNames: [],
  } as unknown as FtsSearchResponse;
}

function json(payload: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(payload),
  } as Response);
}

function openingBlock(): HTMLElement {
  const block = document.querySelector<HTMLElement>(
    '[data-feed-block="verdict"]'
  );
  if (!block) throw new Error("the opening block is not on the page");
  return block;
}

async function search(query: string) {
  render(<RecherchePageContent />);
  await act(async () => {
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: query },
    });
    fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname.endsWith("/search/companions")) {
      return json(emptyCompanions);
    }
    const envelope = await ftsSearchHandler({
      q: url.searchParams.get("q") ?? "",
      limit: 20,
      offset: 0,
      lang: "fr",
    });
    return json(envelope);
  }) as unknown as typeof fetch;
});

describe("the reviewed answer on the real search route", () => {
  // @req REQ-178
  it("shows the sourced answer and the fiche link for a reviewed name", async () => {
    vi.mocked(ftsSearch).mockResolvedValue(
      serviceResponse([
        {
          id: "PPL_LINGALA",
          nameMain: "Lingala",
          relevance: 1,
          exactMatch: true,
          content: {},
        },
      ])
    );

    await search("lingala");

    await waitFor(() => {
      expect(
        screen.getByText(/L'origine du nom Lingala n'est pas établie/)
      ).toBeVisible();
    });
    expect(
      within(openingBlock()).getByRole("link", { name: /fiche/i })
    ).toHaveAttribute("href", getPeopleRoute("fr", "PPL_LINGALA"));
    expect(screen.queryByText(/ne connaissons pas/i)).toBeNull();
  });

  // @req REQ-178
  it("keeps the ordinary opening, with its fiche link, for a name nobody reviewed", async () => {
    vi.mocked(ftsSearch).mockResolvedValue(
      serviceResponse([
        {
          id: "PPL_YAKA",
          nameMain: "Yaka",
          relevance: 1,
          exactMatch: true,
          content: {},
        },
      ])
    );

    await search("yaka");

    await waitFor(() => {
      expect(
        within(openingBlock()).getByRole("link", { name: /fiche/i })
      ).toHaveAttribute("href", getPeopleRoute("fr", "PPL_YAKA"));
    });
    expect(screen.queryByText(/n'est pas établie/)).toBeNull();
  });
});
