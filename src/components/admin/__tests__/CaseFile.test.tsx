import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CaseFile } from "@/components/admin/CaseFile";

vi.mock("@/lib/supabase/auth-client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mod-token" } },
      }),
    },
  }),
}));

const report = {
  id: "aaaaaaaa-0000-4000-8000-000000000001",
  public_slug: "00EZK83QDV",
  target_type: "country",
  target_id: "MAR",
  target_field_path: "atlas.boundaries",
  counter_source_url: "https://example.org/limits",
  counter_source_citation: "Natural Earth admin-0, note 4.",
};

const trail = {
  publicSlug: "00EZK83QDV",
  entries: [
    {
      event: "received",
      occurredAt: "2026-09-08T14:22:00.000Z",
      actorRole: "reader",
      authorisationLevel: null,
    },
    {
      event: "accepted",
      occurredAt: "2026-09-16T08:02:00.000Z",
      actorRole: "moderator",
      authorisationLevel: "admin",
    },
  ],
};

function stubFetch(response: { ok?: boolean; body?: unknown } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    json: async () => response.body ?? { data: trail, errors: [] },
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("CaseFile", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-041
  it("reads the trail through the audited endpoint, with the moderator's token", async () => {
    const fetchMock = stubFetch();
    render(<CaseFile language="fr" report={report} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/v2/flags/${report.id}/audit`);
    expect(init.headers.Authorization).toBe("Bearer mod-token");
    expect(await screen.findByText("Accepté")).toBeInTheDocument();
  });

  // @req REQ-042
  it("names the contested target and links to the fiche it contests", async () => {
    stubFetch();
    render(<CaseFile language="fr" report={report} />);

    expect(screen.getByText("MAR")).toBeInTheDocument();
    expect(screen.getByText("atlas.boundaries")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /ouvrir la fiche/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("MAR"));
    // The counter-source the reader supplied, verbatim and reachable.
    expect(
      screen.getByText("Natural Earth admin-0, note 4.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "https://example.org/limits" })
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("list")).toBeInTheDocument());
  });

  /**
   * A contribution proposes an entity the atlas does not hold, so it carries
   * no target and there is no fiche to open. Offering a dead link is worse
   * than saying so.
   */
  // @req REQ-042
  it("says so, and links nowhere, when the report names no entity", async () => {
    stubFetch();
    render(
      <CaseFile
        language="fr"
        report={{ ...report, target_type: null, target_id: null }}
      />
    );

    expect(screen.getByText(/ne nomme aucune entité/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ouvrir la fiche/i })).toBeNull();
    await waitFor(() => expect(screen.getByRole("list")).toBeInTheDocument());
  });

  /**
   * The row the screen exists for. Until the corpus is published, the trail
   * ends on a step that has not happened — never on the decision, which would
   * read as a correction that shipped.
   */
  // @req REQ-041
  it("ends the trail on the publication that has not occurred", async () => {
    stubFetch();
    render(
      <CaseFile
        language="fr"
        report={{ ...report, remediationState: "in_progress" }}
      />
    );

    const pending = await screen.findByText(/Publication en production/);
    expect(pending).toBeInTheDocument();
    expect(screen.getByText(/n'a pas encore eu lieu/i)).toBeInTheDocument();
  });

  // @req REQ-041
  it("drops the pending row once the corpus has been published", async () => {
    stubFetch();
    render(
      <CaseFile
        language="fr"
        report={{ ...report, remediationState: "published" }}
      />
    );

    await screen.findByText("Accepté");
    expect(screen.queryByText(/n'a pas encore eu lieu/i)).toBeNull();
  });

  // @req REQ-041
  it("says the register failed rather than render an empty trail", async () => {
    stubFetch({ ok: false, body: { data: null, errors: [{ code: "X" }] } });
    render(<CaseFile language="fr" report={report} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /rien ici ne dit qu'aucune décision n'a été prise/i
    );
  });

  // @req REQ-042
  it("carries the read-only remediation panel and no control that writes it", async () => {
    stubFetch();
    render(<CaseFile language="fr" report={report} />);

    expect(screen.getByText("Lecture seule")).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    await waitFor(() => expect(screen.getByRole("list")).toBeInTheDocument());
  });
});
