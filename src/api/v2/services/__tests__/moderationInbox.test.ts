import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: mocks.loggerError },
}));

import { listModerationInbox } from "../moderationInbox";

let sequence = 0;

function flag(overrides: Record<string, unknown> = {}) {
  sequence += 1;
  return {
    id: `aaaaaaaa-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    public_slug: `slug${sequence}`,
    entity_type: null,
    entity_id: null,
    assertion_field_path: null,
    assertion_id: null,
    flag_kind: "other",
    reason_text: "Le nom est mal écrit.",
    counter_source_url: null,
    counter_source_citation: null,
    proposed_rewrite: null,
    contributor_id: null,
    severity: null,
    auto_generated: false,
    status: "open",
    created_at: "2026-11-01T10:00:00.000Z",
    updated_at: null,
    resolved_at: null,
    moderator_notes: null,
    remediation_state: null,
    remediation_published_at: null,
    remediation_summary: null,
    revision_draft_id: null,
    contribution_payload: null,
    block_key: null,
    published_at: "2026-11-01T10:00:00.000Z",
    hidden_at: null,
    hidden_reason: null,
    knowledge_basis: null,
    contributor_display_name_snapshot: null,
    ...overrides,
  };
}

/**
 * Every table answers its whole fixture whatever the filters: the tests read
 * what the inbox makes of the rows, not how it asked for them.
 */
function tables(fixture: {
  flags: unknown[];
  flag_replies?: unknown[];
  flag_abuse_reports?: unknown[];
  flag_reporter_contacts?: unknown[];
}) {
  mocks.createAdminClient.mockReturnValue({
    from: (table: keyof typeof fixture) => {
      const result = { data: fixture[table] ?? [], error: null };
      const query: Record<string, unknown> = {
        then: (resolve: (value: unknown) => void) => resolve(result),
      };
      for (const method of ["select", "in", "eq", "is", "order", "limit"]) {
        query[method] = () => query;
      }
      return query;
    },
  });
}

describe("listModerationInbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sequence = 0;
  });

  // @req REQ-214
  it("groups contributions by fiche, then block, busiest and freshest first", async () => {
    tables({
      flags: [
        flag({
          block_key: "people:PPL_PEUL:naming",
          status: "accepted",
          created_at: "2026-11-10T10:00:00.000Z",
        }),
        flag({
          block_key: "people:PPL_PEUL:origin",
          created_at: "2026-11-02T10:00:00.000Z",
        }),
        flag({
          block_key: "people:PPL_PEUL:origin",
          created_at: "2026-11-03T10:00:00.000Z",
        }),
        flag({
          block_key: "country:SEN:what",
          created_at: "2026-11-09T10:00:00.000Z",
        }),
      ],
    });

    const inbox = await listModerationInbox();

    expect(inbox.fiches.map((fiche) => fiche.entity_id)).toEqual([
      "PPL_PEUL",
      "SEN",
    ]);
    const peul = inbox.fiches[0];
    expect(peul.open_count).toBe(2);
    expect(peul.blocks.map((block) => block.block_key)).toEqual([
      "people:PPL_PEUL:origin",
      "people:PPL_PEUL:naming",
    ]);
    expect(peul.blocks[0].section).toBe("origin");
  });

  // @req REQ-214
  it("breaks a tie on open items by the latest activity, replies included", async () => {
    const quiet = flag({
      block_key: "people:PPL_A:what",
      created_at: "2026-11-05T10:00:00.000Z",
    });
    const answered = flag({
      block_key: "people:PPL_B:what",
      created_at: "2026-11-01T10:00:00.000Z",
    });
    tables({
      flags: [quiet, answered],
      flag_replies: [
        {
          id: "bbbbbbbb-0000-4000-8000-000000000001",
          flag_id: answered.id,
          author_id: null,
          body: "Je confirme.",
          display_name_snapshot: "Awa",
          is_moderation: false,
          created_at: "2026-11-08T10:00:00.000Z",
          hidden_at: null,
        },
      ],
    });

    const inbox = await listModerationInbox();

    expect(inbox.fiches.map((fiche) => fiche.entity_id)).toEqual([
      "PPL_B",
      "PPL_A",
    ]);
    expect(inbox.fiches[0].last_activity_at).toBe("2026-11-08T10:00:00.000Z");
  });

  // @req REQ-214
  it("files a contribution without a block under its entity, and one without an entity in the general group, last", async () => {
    tables({
      flags: [
        flag({ entity_type: null, entity_id: null, status: "open" }),
        flag({ entity_type: "people", entity_id: "PPL_PEUL" }),
        flag({
          block_key: "people:PPL_PEUL:naming",
          status: "accepted",
        }),
        flag({
          block_key: "country:SEN:what",
          status: "accepted",
        }),
      ],
    });

    const inbox = await listModerationInbox();

    expect(inbox.fiches.map((fiche) => fiche.entity_id)).toEqual([
      "PPL_PEUL",
      "SEN",
      null,
    ]);
    expect(inbox.fiches[0].blocks.map((block) => block.block_key)).toEqual([
      null,
      "people:PPL_PEUL:naming",
    ]);
    expect(inbox.fiches[2].entity_type).toBeNull();
    expect(inbox.fiches[2].blocks[0].threads).toHaveLength(1);
  });

  // @req REQ-214
  it("tells private, waiting, published and hidden contributions apart", async () => {
    const noContact = flag({
      block_key: "people:PPL_A:what",
      published_at: null,
    });
    const waiting = flag({
      block_key: "people:PPL_A:what",
      published_at: null,
    });
    const confirmedButUnpublished = flag({
      block_key: "people:PPL_A:what",
      published_at: null,
    });
    const published = flag({ block_key: "people:PPL_A:what" });
    const hidden = flag({
      block_key: "people:PPL_A:what",
      hidden_at: "2026-11-04T10:00:00.000Z",
      hidden_reason: "reader_reports",
    });
    tables({
      flags: [noContact, waiting, confirmedButUnpublished, published, hidden],
      flag_reporter_contacts: [
        { flag_id: waiting.id, verified_at: null },
        {
          flag_id: confirmedButUnpublished.id,
          verified_at: "2026-11-02T10:00:00.000Z",
        },
      ],
    });

    const inbox = await listModerationInbox();
    const stateOf = Object.fromEntries(
      inbox.fiches[0].blocks[0].threads.map((thread) => [
        thread.id,
        thread.publication_state,
      ])
    );

    expect(stateOf).toEqual({
      [noContact.id]: "private",
      [waiting.id]: "awaiting_confirmation",
      [confirmedButUnpublished.id]: "private",
      [published.id]: "published",
      [hidden.id]: "hidden",
    });
    const hiddenThread = inbox.fiches[0].blocks[0].threads.find(
      (thread) => thread.id === hidden.id
    );
    expect(hiddenThread.hidden_reason).toBe("reader_reports");
  });

  // @req REQ-214
  it("counts reader reports per comment and per reply, and keeps hidden replies in view", async () => {
    const comment = flag({ block_key: "people:PPL_A:what" });
    const replyId = "bbbbbbbb-0000-4000-8000-000000000009";
    tables({
      flags: [comment],
      flag_replies: [
        {
          id: replyId,
          flag_id: comment.id,
          author_id: "mod-1",
          body: "Merci, nous vérifions.",
          display_name_snapshot: null,
          is_moderation: true,
          created_at: "2026-11-02T10:00:00.000Z",
          hidden_at: "2026-11-03T10:00:00.000Z",
        },
      ],
      flag_abuse_reports: [
        { flag_id: comment.id, reply_id: null },
        { flag_id: comment.id, reply_id: null },
        { flag_id: null, reply_id: replyId },
      ],
    });

    const inbox = await listModerationInbox();
    const thread = inbox.fiches[0].blocks[0].threads[0];

    expect(thread.abuse_reports).toBe(2);
    expect(thread.replies).toEqual([
      expect.objectContaining({
        id: replyId,
        is_moderation: true,
        hidden_at: "2026-11-03T10:00:00.000Z",
        abuse_reports: 1,
      }),
    ]);
  });

  // @req REQ-214
  it("carries what the status moves need, in the shape the flat queue reads", async () => {
    tables({
      flags: [
        flag({
          block_key: "people:PPL_A:what",
          status: "under_review",
          contribution_payload: { note: "x" },
        }),
      ],
    });

    const inbox = await listModerationInbox();
    const thread = inbox.fiches[0].blocks[0].threads[0];

    expect(thread).toEqual(
      expect.objectContaining({
        status: "under_review",
        reason_text: "Le nom est mal écrit.",
        contribution_payload: { note: "x" },
      })
    );
  });

  // Never degrade to an empty inbox: a moderator would read "nothing to do".
  // @req REQ-214
  it("fails loudly when the flags cannot be read", async () => {
    mocks.createAdminClient.mockReturnValue({
      from: () => {
        const query: Record<string, unknown> = {
          then: (resolve: (value: unknown) => void) =>
            resolve({ data: null, error: { message: "boom" } }),
        };
        for (const method of ["select", "in", "eq", "is", "order", "limit"]) {
          query[method] = () => query;
        }
        return query;
      },
    });

    await expect(listModerationInbox()).rejects.toThrow(/boom/);
  });
});
