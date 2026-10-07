/**
 * A published word, end to end: the real v2 handler builds the envelope from
 * the registry, the real loader decodes it, the real page renders it. Only the
 * database service, the network edge and the registry's data are replaced. The
 * search finds no fiche at all — the case the plan names — and the page must
 * answer the word instead of confessing ignorance of it.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/v2/services/searchService", () => ({ ftsSearch: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
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
// A fixture record: the registry's real pharaoh record is filed separately.
vi.mock("@/lib/productions/ledger", () => ({
  loadProductionLedger: () => [
    {
      campaign: "pharaon-d-ou-vient-le-nom",
      typologie: "mot",
      episode: 18,
      question: { fr: "D'où vient le nom pharaon ?" },
      myth: null,
      subjects: [],
      sitePath: "/fr/about",
      word: {
        label: { fr: "pharaon", en: "pharaoh" },
        queries: ["pharaon", "pharaons", "pharaoh"],
      },
      answer: {
        lead: {
          fr: "Au départ, « pharaon » ne désignait pas le roi, mais sa maison.",
        },
        origin: [
          {
            text: { fr: "De l'égyptien per-aa, « la grande maison »." },
            attribution: "linguistic",
          },
        ],
        path: [
          { form: "per-aa", language: "égyptien" },
          { form: "pharaon", language: "français" },
        ],
        followUp: { fr: "Comment la maison est-elle devenue le roi ?" },
      },
      publications: [
        {
          network: "tiktok",
          format: "carrousel",
          url: "https://www.tiktok.com/@ethniafrica/photo/1",
        },
      ],
      sources: [
        {
          title: "TLFi, « pharaon »",
          url: "https://www.cnrtl.fr/etymologie/pharaon",
          tier: "referenced",
        },
      ],
    },
  ],
}));

import { ftsSearchHandler } from "@/api/v2/handlers/search";
import { ftsSearch } from "@/api/v2/services/searchService";
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

function noResultAtAll(): FtsSearchResponse {
  return {
    peoples: [],
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    quizzes: [],
    languages: [],
    results: [],
    peoplesTotal: 0,
    countriesTotal: 0,
    familiesTotal: 0,
    personsTotal: 0,
    patronymesTotal: 0,
    quizzesTotal: 0,
    languagesTotal: 0,
    total: 0,
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
  vi.mocked(ftsSearch).mockResolvedValue(noResultAtAll());
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    if (url.pathname.endsWith("/search/companions")) {
      return json(emptyCompanions);
    }
    return json(
      await ftsSearchHandler({
        q: url.searchParams.get("q") ?? "",
        limit: 20,
        offset: 0,
        lang: "fr",
      })
    );
  }) as unknown as typeof fetch;
});

describe("the word page on the real search route", () => {
  // @req REQ-184
  // @req REQ-180
  // @req REQ-178
  it("answers « pharaoh » from the registry when no fiche has a single result", async () => {
    await search("pharaoh");

    const page = document.querySelector<HTMLElement>("[data-word-answer]");
    expect(page).not.toBeNull();
    expect(
      within(page!).getByRole("heading", { level: 1, name: /pharaon/i })
    ).toBeTruthy();
    expect(within(page!).getByText(/la grande maison/)).toBeTruthy();
    expect(within(page!).getByText(/ne désignait pas le roi/)).toBeTruthy();
    expect(
      within(page!).getByText("Comment la maison est-elle devenue le roi ?")
    ).toBeTruthy();
    expect(screen.queryByText(/Nous ne connaissons pas ce nom/)).toBeNull();
  });

  // @req REQ-184
  it("gives the reader the word's forms, its route and its publication", async () => {
    await search("pharaon");

    const page = document.querySelector<HTMLElement>("[data-word-answer]")!;
    expect(within(page).getByText("per-aa")).toBeTruthy();
    expect(
      within(page)
        .getByRole("link", { name: /tiktok/i })
        .getAttribute("href")
    ).toBe("https://www.tiktok.com/@ethniafrica/photo/1");
    expect(within(page).getByText(/1 source/)).toBeTruthy();
  });

  // @req REQ-178
  it("still confesses a word nobody published", async () => {
    await search("zombi");

    expect(document.querySelector("[data-word-answer]")).toBeNull();
    expect(screen.getByText(/Nous ne connaissons pas ce nom/)).toBeTruthy();
  });
});
