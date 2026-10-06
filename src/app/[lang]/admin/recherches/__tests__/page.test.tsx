import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getModeratorSession: vi.fn(),
  readSearchQueryReport: vi.fn(),
}));

vi.mock("@/lib/supabase/moderator", () => ({
  getModeratorSession: mocks.getModeratorSession,
}));

vi.mock("@/api/v2/services/searchQueryReport", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/api/v2/services/searchQueryReport")
  >()),
  readSearchQueryReport: mocks.readSearchQueryReport,
}));

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

import SearchReportPage from "../page";

async function renderPage(params: Record<string, string> = {}, lang = "fr") {
  const ui = await SearchReportPage({
    params: Promise.resolve({ lang }),
    searchParams: Promise.resolve(params),
  });
  return render(ui);
}

describe("SearchReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getModeratorSession.mockResolvedValue({ user: { id: "mod-1" } });
    mocks.readSearchQueryReport.mockResolvedValue({
      rowsRead: 12,
      totalSearches: 4,
      distinctQueries: 2,
      zeroResultShare: 0.5,
      zeroResults: [
        { query: "peul", count: 2, lastSeen: "2026-10-05T10:00:00.000Z" },
      ],
      mostFrequent: [
        {
          query: "peul",
          count: 2,
          zeroResultShare: 1,
          lastSeen: "2026-10-05T10:00:00.000Z",
        },
        {
          query: "wolof",
          count: 2,
          zeroResultShare: 0,
          lastSeen: "2026-10-04T10:00:00.000Z",
        },
      ],
      truncated: false,
    });
  });

  // `getModeratorSession` redirects by throwing; nothing after it may run.
  // @req REQ-042
  it("sends a visitor who is not a moderator away before reading the search log", async () => {
    mocks.getModeratorSession.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.readSearchQueryReport).not.toHaveBeenCalled();
  });

  // @req REQ-002
  it("shows the searches without result before the most frequent ones, under the period totals", async () => {
    await renderPage();

    expect(mocks.readSearchQueryReport).toHaveBeenCalledWith({
      periodDays: 30,
    });
    const zero = screen.getByRole("region", {
      name: "Recherches sans résultat",
    });
    const frequent = screen.getByRole("region", {
      name: "Recherches les plus fréquentes",
    });
    expect(
      zero.compareDocumentPosition(frequent) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(within(zero).getByText("peul")).toBeInTheDocument();
    expect(within(frequent).getByText("wolof")).toBeInTheDocument();
    expect(within(frequent).getByText(/^100\s%$/)).toBeInTheDocument();
    expect(screen.getByText(/^50\s%$/)).toBeInTheDocument();
  });

  // @req REQ-002
  it("reads the chosen period and language, and ignores values it does not offer", async () => {
    await renderPage({ periode: "7", langue: "en" });
    expect(mocks.readSearchQueryReport).toHaveBeenLastCalledWith({
      periodDays: 7,
      lang: "en",
    });

    await renderPage({ periode: "365", langue: "es" });
    expect(mocks.readSearchQueryReport).toHaveBeenLastCalledWith({
      periodDays: 30,
    });
  });

  // @req REQ-002
  it("says so when the row cap cut the period short", async () => {
    mocks.readSearchQueryReport.mockResolvedValue({
      rowsRead: 20000,
      totalSearches: 0,
      distinctQueries: 0,
      zeroResultShare: 0,
      zeroResults: [],
      mostFrequent: [],
      truncated: true,
    });

    await renderPage();

    expect(screen.getByText(/Seules les 20/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Aucune recherche sur cette période.")
    ).toHaveLength(2);
  });
});
