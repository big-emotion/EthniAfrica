import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SourceReviewQueue } from "@/components/admin/SourceReviewQueue";
import { adminCopy } from "@/lib/i18n/copy/admin";

vi.mock("@/lib/supabase/auth-client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mod-token" } },
      }),
    },
  }),
}));

const copy = adminCopy.fr.sourceReview;

const card = {
  key: '["Site mort","http://dead.example"]',
  title: "Site mort",
  url: "http://dead.example",
  fiches: [{ path: "pays/SEN.json", ficheId: "SEN", kind: "pays" as const }],
  decided: false,
};

function stubFetch(ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () =>
      ok
        ? { data: { id: "draft-1" }, errors: [] }
        : {
            data: null,
            errors: [{ code: "VALIDATION_ERROR", message: "refusé" }],
          },
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("SourceReviewQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The rationale is what the next reviewer reads in the ledger; a decision
  // without one cannot be audited.
  // @req REQ-042
  it("refuses to record a decision without a rationale", async () => {
    const fetchMock = stubFetch();
    render(<SourceReviewQueue language="fr" items={[card]} />);

    fireEvent.click(screen.getByLabelText("Officielle"));
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy.rationaleRequired
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("asks for the corrected address on a repair and records the draft with the moderator's token", async () => {
    const fetchMock = stubFetch();
    render(<SourceReviewQueue language="fr" items={[card]} />);

    expect(screen.queryByLabelText(copy.repairedUrl)).toBeNull();
    fireEvent.click(screen.getByLabelText(copy.repair));
    fireEvent.change(screen.getByLabelText(copy.repairedUrl), {
      target: { value: "https://web.archive.org/web/2025/http://dead.example" },
    });
    fireEvent.click(
      within(
        screen.getByRole("group", { name: copy.repairTier })
      ).getByLabelText("Référencée")
    );
    fireEvent.change(screen.getByLabelText(copy.rationale), {
      target: { value: "Archive datée de la page du ministère." },
    });
    fireEvent.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v2/admin/source-tier-rulings");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer mod-token");
    expect(JSON.parse(init.body)).toEqual({
      fiche_path: "pays/SEN.json",
      source_title: "Site mort",
      source_url: "http://dead.example",
      decision: "repair",
      tier: "referenced",
      repaired_url: "https://web.archive.org/web/2025/http://dead.example",
      rationale: "Archive datée de la page du ministère.",
    });
    expect(
      await screen.findByText(copy.decided, { selector: "[data-decided]" })
    ).toBeInTheDocument();
  });
});
