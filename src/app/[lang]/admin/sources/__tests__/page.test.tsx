import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getModeratorSession: vi.fn(),
  listSourceTierRulingDrafts: vi.fn(),
  readSourceReviewQueue: vi.fn(),
}));

vi.mock("@/lib/supabase/moderator", () => ({
  getModeratorSession: mocks.getModeratorSession,
}));

vi.mock("@/api/v2/services/sourceTierRulings", () => ({
  listSourceTierRulingDrafts: mocks.listSourceTierRulingDrafts,
}));

vi.mock("@/lib/sources/sourceReviewQueue", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sources/sourceReviewQueue")>()),
  readSourceReviewQueue: mocks.readSourceReviewQueue,
}));

vi.mock("@/lib/supabase/auth-client", () => ({
  createBrowserSupabaseClient: () => ({ auth: { getSession: vi.fn() } }),
}));

vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/admin/sources",
  useSearchParams: () => new URLSearchParams(),
}));

import SourceReviewPage from "../page";

const WPP = "ONU – World Population Prospects 2025";

function queueItem(title: string, url: string | null) {
  return {
    key: JSON.stringify([title, url]),
    title,
    url,
    fiches: [{ path: "pays/BEN.json", ficheId: "BEN", kind: "pays" }],
  };
}

async function renderPage(params: Record<string, string> = {}) {
  const ui = await SourceReviewPage({
    params: Promise.resolve({ lang: "fr" }),
    searchParams: Promise.resolve(params),
  });
  return render(ui);
}

describe("SourceReviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getModeratorSession.mockResolvedValue({ user: { id: "mod-1" } });
    mocks.readSourceReviewQueue.mockReturnValue([
      queueItem(WPP, null),
      queueItem("Glottolog", "https://glottolog.org"),
    ]);
    mocks.listSourceTierRulingDrafts.mockResolvedValue([
      {
        id: "draft-1",
        source_title: WPP,
        source_url: null,
        decision: "tier",
        tier: "official",
      },
    ]);
  });

  // `getModeratorSession` redirects by throwing; nothing after it may run.
  // @req REQ-042
  it("sends a visitor who is not a moderator away before reading drafts or the corpus", async () => {
    mocks.getModeratorSession.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.listSourceTierRulingDrafts).not.toHaveBeenCalled();
    expect(mocks.readSourceReviewQueue).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("marks a citation with a draft as decided, and filters on the review state", async () => {
    const { unmount } = await renderPage();

    const cards = screen.getAllByTestId("source-review-card");
    expect(cards).toHaveLength(2);
    expect(
      cards.filter((card) => card.dataset.state === "decided")
    ).toHaveLength(1);
    unmount();

    await renderPage({ etat: "a-examiner" });
    expect(screen.getAllByTestId("source-review-card")).toHaveLength(1);
    expect(screen.getByText("Glottolog")).toBeInTheDocument();
  });
});
