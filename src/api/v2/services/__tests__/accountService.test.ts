import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  rpc: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: mocks.loggerError },
}));

import { eraseReaderAccount, listAccountContributions } from "../account";

const READER = { id: "user-1", email: "awa@example.org" };

function flag(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    public_slug: `SLUG${id}`,
    block_key: "people:PPL_PEUL:naming",
    entity_type: "people",
    flag_kind: "correction-proposal",
    reason_text: `Comment ${id}`,
    status: "open",
    moderator_notes: null,
    resolved_at: null,
    remediation_state: null,
    remediation_published_at: null,
    contributor_id: null,
    created_at: `2026-11-1${id.charCodeAt(0) % 10}T10:00:00.000Z`,
    published_at: "2026-11-18T10:00:00.000Z",
    hidden_at: null,
    ...extra,
  };
}

function contact(flagId: string, email: string) {
  return {
    flag_id: flagId,
    email,
    token_hash: `hash-${flagId}`,
    expires_at: "2026-11-30T00:00:00.000Z",
    verified_at: null,
  };
}

function reply(id: string, flagId: string, extra: Record<string, unknown>) {
  return {
    id,
    flag_id: flagId,
    body: `Reply ${id}`,
    display_name_snapshot: null,
    is_moderation: false,
    created_at: "2026-11-18T11:00:00.000Z",
    hidden_at: null,
    ...extra,
  };
}

let db: FakeSupabase;

function useDatabase(tables: Record<string, Record<string, unknown>[]>) {
  db = createFakeSupabase({
    flags: [],
    flag_replies: [],
    flag_reporter_contacts: [],
    ...tables,
  });
  mocks.createAdminClient.mockReturnValue({ ...db.client, rpc: mocks.rpc });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listAccountContributions", () => {
  // A comment written signed-out is the reader's through the address it
  // carries; once confirmed it is theirs through `contributor_id` too. Both
  // must show, once each.
  // @req REQ-213
  it("lists the comments signed by the reader and those waiting on their address", async () => {
    useDatabase({
      flags: [
        flag("a", { contributor_id: READER.id }),
        flag("b", { published_at: null }),
        flag("c", { contributor_id: READER.id }),
        flag("d", { contributor_id: "someone-else" }),
        flag("e", { published_at: null }),
      ],
      flag_reporter_contacts: [
        contact("b", READER.email),
        contact("c", READER.email),
        contact("e", "someone@example.org"),
      ],
    });

    const contributions = await listAccountContributions(READER);

    expect(contributions.map((item) => item.id).sort()).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  // @req REQ-213
  it("puts the most recent comment first", async () => {
    useDatabase({
      flags: [
        flag("a", {
          contributor_id: READER.id,
          created_at: "2026-11-01T00:00:00.000Z",
        }),
        flag("b", {
          contributor_id: READER.id,
          created_at: "2026-11-10T00:00:00.000Z",
        }),
      ],
    });

    const contributions = await listAccountContributions(READER);

    expect(contributions.map((item) => item.id)).toEqual(["b", "a"]);
  });

  // @req REQ-213
  it("states whether each comment waits, is public or is hidden", async () => {
    useDatabase({
      flags: [
        flag("a", { contributor_id: READER.id }),
        flag("b", { published_at: null }),
        flag("c", {
          contributor_id: READER.id,
          hidden_at: "2026-11-18T12:00:00.000Z",
        }),
      ],
      flag_reporter_contacts: [contact("b", READER.email)],
    });

    const byId = Object.fromEntries(
      (await listAccountContributions(READER)).map((item) => [
        item.id,
        item.publication,
      ])
    );

    expect(byId).toEqual({ a: "published", b: "pending", c: "hidden" });
  });

  // @req REQ-213
  it("counts visible replies and those from the moderation", async () => {
    useDatabase({
      flags: [flag("a", { contributor_id: READER.id })],
      flag_replies: [
        reply("r1", "a", { is_moderation: true }),
        reply("r2", "a", {}),
        reply("r3", "a", { hidden_at: "2026-11-18T12:00:00.000Z" }),
      ],
    });

    const [contribution] = await listAccountContributions(READER);

    expect(contribution.replies).toEqual({ total: 2, fromModeration: 1 });
  });

  // @req REQ-213
  it("gives the date the fiche was corrected only once the correction is published", async () => {
    useDatabase({
      flags: [
        flag("a", {
          contributor_id: READER.id,
          status: "accepted",
          remediation_state: "published",
          remediation_published_at: "2026-11-12T09:00:00.000Z",
        }),
        flag("b", {
          contributor_id: READER.id,
          status: "accepted",
          remediation_state: "in_progress",
          remediation_published_at: null,
        }),
      ],
    });

    const byId = Object.fromEntries(
      (await listAccountContributions(READER)).map((item) => [
        item.id,
        item.corrected_at,
      ])
    );

    expect(byId).toEqual({ a: "2026-11-12T09:00:00.000Z", b: null });
  });

  // @req REQ-213
  it("returns nothing for a reader with no comment", async () => {
    useDatabase({ flags: [flag("a", { contributor_id: "someone-else" })] });

    await expect(listAccountContributions(READER)).resolves.toEqual([]);
  });
});

describe("eraseReaderAccount", () => {
  // @req REQ-213
  it("erases the account through the database function that unlinks its comments", async () => {
    useDatabase({});
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await eraseReaderAccount(READER.id);

    expect(mocks.rpc).toHaveBeenCalledWith("erase_contributor_account", {
      target_user_id: READER.id,
    });
  });

  // @req REQ-213
  it("fails loudly when the database refuses, so the page never claims a deletion that did not happen", async () => {
    useDatabase({});
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "denied" } });

    await expect(eraseReaderAccount(READER.id)).rejects.toThrow(/denied/);
  });
});
