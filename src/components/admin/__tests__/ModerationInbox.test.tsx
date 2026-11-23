import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ModerationInbox } from "@/components/admin/ModerationInbox";
import type {
  InboxThread,
  ModerationInbox as Inbox,
} from "@/api/v2/services/moderationInbox";

vi.mock("@/lib/supabase/auth-client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mod-token" } },
      }),
    },
  }),
}));

function thread(overrides: Partial<InboxThread> = {}): InboxThread {
  return {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    public_slug: "ABC123DEFG",
    target_type: "people",
    target_id: "PPL_PEUL",
    target_field_path: null,
    assertion_id: null,
    flag_kind: "other",
    reason_text: "Les Peuls se nomment Fulɓe.",
    counter_source_url: null,
    counter_source_citation: null,
    proposed_rewrite: null,
    contributor_id: null,
    severity: null,
    auto_generated: false,
    status: "open",
    created_at: "2026-11-10T10:00:00.000Z",
    updated_at: null,
    resolved_at: null,
    moderator_notes: null,
    remediation_state: null,
    remediation_published_at: null,
    remediation_summary: null,
    contribution_payload: null,
    block_key: "people:PPL_PEUL:naming",
    publication_state: "published",
    published_at: "2026-11-10T10:00:00.000Z",
    hidden_reason: null,
    knowledge_basis: null,
    display_name: "Awa",
    abuse_reports: 0,
    replies: [],
    last_activity_at: "2026-11-10T10:00:00.000Z",
    ...overrides,
  };
}

function inboxWith(threads: InboxThread[]): Inbox {
  return {
    truncated: false,
    fiches: [
      {
        entity_type: "people",
        entity_id: "PPL_PEUL",
        open_count: 1,
        last_activity_at: "2026-11-10T10:00:00.000Z",
        blocks: [
          {
            block_key: "people:PPL_PEUL:naming",
            section: "naming",
            open_count: 1,
            last_activity_at: "2026-11-10T10:00:00.000Z",
            threads,
          },
        ],
      },
      {
        entity_type: null,
        entity_id: null,
        open_count: 0,
        last_activity_at: "2026-11-01T10:00:00.000Z",
        blocks: [
          {
            block_key: null,
            section: null,
            open_count: 0,
            last_activity_at: "2026-11-01T10:00:00.000Z",
            threads: [
              thread({
                id: "aaaaaaaa-0000-4000-8000-000000000002",
                block_key: null,
                target_type: null,
                target_id: null,
                status: "accepted",
                reason_text: "Ajoutez les Bassari.",
              }),
            ],
          },
        ],
      },
    ],
  };
}

function stubFetch(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data, errors: [] }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("ModerationInbox", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-214
  it("shows fiches, then their blocks, in the order given, with the general group named", () => {
    render(<ModerationInbox language="fr" inbox={inboxWith([thread()])} />);

    const fiches = screen.getAllByRole("heading", { level: 2 });
    expect(fiches.map((heading) => heading.textContent)).toEqual([
      "Peuple · PPL_PEUL",
      "Contributions sans fiche",
    ]);
    expect(
      screen.getByRole("heading", { level: 3, name: "Noms" })
    ).toBeTruthy();
    expect(screen.getByText("Ajoutez les Bassari.")).toBeTruthy();
  });

  // @req REQ-214
  it("says whether a thread is private, waiting, published or hidden, and why it was hidden", () => {
    render(
      <ModerationInbox
        language="fr"
        inbox={inboxWith([
          thread({
            publication_state: "hidden",
            hidden_reason: "reader_reports",
            abuse_reports: 3,
          }),
          thread({
            id: "aaaaaaaa-0000-4000-8000-000000000003",
            publication_state: "awaiting_confirmation",
          }),
        ])}
      />
    );

    expect(screen.getByText("Masqué")).toBeTruthy();
    expect(
      screen.getByText("Raison du masquage : trois signalements de lecteurs")
    ).toBeTruthy();
    expect(screen.getByText("3 signalements de lecteurs")).toBeTruthy();
    expect(
      screen.getByText("En attente de la confirmation de l'adresse")
    ).toBeTruthy();
  });

  // @req REQ-214
  it("signs a moderation reply « Modération EthniAfrica » and marks a hidden reply", () => {
    render(
      <ModerationInbox
        language="fr"
        inbox={inboxWith([
          thread({
            replies: [
              {
                id: "bbbbbbbb-0000-4000-8000-000000000001",
                body: "Merci, nous vérifions.",
                display_name: null,
                is_moderation: true,
                created_at: "2026-11-11T10:00:00.000Z",
                hidden_at: null,
                abuse_reports: 0,
              },
              {
                id: "bbbbbbbb-0000-4000-8000-000000000002",
                body: "Insulte",
                display_name: null,
                is_moderation: false,
                created_at: "2026-11-12T10:00:00.000Z",
                hidden_at: "2026-11-12T11:00:00.000Z",
                abuse_reports: 3,
              },
            ],
          }),
        ])}
      />
    );

    const replies = screen.getByRole("list", { name: "Réponses" });
    const [moderation, hidden] = within(replies).getAllByRole("listitem");
    expect(within(moderation).getByText("Modération EthniAfrica")).toBeTruthy();
    expect(within(hidden).getByText("Un lecteur")).toBeTruthy();
    expect(within(hidden).getByText("Réponse masquée")).toBeTruthy();
    expect(
      within(hidden).getByRole("button", { name: "Rétablir la réponse" })
    ).toBeTruthy();
  });

  // @req REQ-214
  it("posts a moderation reply and shows it under the comment", async () => {
    const fetchMock = stubFetch({
      id: "bbbbbbbb-0000-4000-8000-000000000009",
      body: "Source ajoutée.",
      display_name: null,
      is_moderation: true,
      created_at: "2026-11-18T10:00:00.000Z",
    });
    render(<ModerationInbox language="fr" inbox={inboxWith([thread()])} />);

    fireEvent.change(
      screen.getAllByLabelText("Répondre au nom de la modération")[0],
      { target: { value: "Source ajoutée." } }
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Publier la réponse" })[0]
    );

    await waitFor(() =>
      expect(screen.getByText("Source ajoutée.")).toBeTruthy()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/admin/comments/aaaaaaaa-0000-4000-8000-000000000001/replies",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ body: "Source ajoutée." }),
        headers: expect.objectContaining({ Authorization: "Bearer mod-token" }),
      })
    );
  });

  // @req REQ-214
  it("will not hide a comment without a reason, then hides it with one", async () => {
    const fetchMock = stubFetch({ hidden: true });
    render(<ModerationInbox language="fr" inbox={inboxWith([thread()])} />);

    const hide = screen.getAllByRole("button", {
      name: "Masquer le commentaire",
    })[0];
    fireEvent.click(hide);
    expect(
      screen.getByText("Indiquez pourquoi vous masquez ce commentaire.")
    ).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getAllByLabelText("Raison du masquage")[0], {
      target: { value: "Propos injurieux" },
    });
    fireEvent.click(hide);

    await waitFor(() => expect(screen.getByText("Masqué")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/admin/comments/aaaaaaaa-0000-4000-8000-000000000001/visibility",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ hidden: true, reason: "Propos injurieux" }),
      })
    );
  });

  // @req REQ-214
  it("restores an auto-hidden comment", async () => {
    const fetchMock = stubFetch({ hidden: false });
    render(
      <ModerationInbox
        language="fr"
        inbox={inboxWith([
          thread({
            publication_state: "hidden",
            hidden_reason: "reader_reports",
          }),
        ])}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Rétablir le commentaire" })
    );

    await waitFor(() => expect(screen.getByText("Publié")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v2/admin/comments/aaaaaaaa-0000-4000-8000-000000000001/visibility",
      expect.objectContaining({ body: JSON.stringify({ hidden: false }) })
    );
  });
});
