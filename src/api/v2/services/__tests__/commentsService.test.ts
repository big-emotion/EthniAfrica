import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";

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

import {
  addReply,
  hideComment,
  listPublishedCommentsByBlockKeys,
  disownPendingFlag,
  findPendingComment,
  publishPendingFlagForEmail,
  recordAbuseReport,
  unhideComment,
} from "../comments";

const NAMING = "people:PPL_PEUL:naming";
const ORIGIN = "people:PPL_PEUL:origin";

function flag(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    public_slug: `SLUG${id}`,
    block_key: NAMING,
    flag_kind: "correction-proposal",
    reason_text: `Comment ${id}`,
    counter_source_url: null,
    counter_source_citation: null,
    proposed_rewrite: null,
    knowledge_basis: null,
    status: "open",
    remediation_state: null,
    remediation_published_at: null,
    contributor_id: null,
    contributor_display_name_snapshot: null,
    contribution_payload: { contributor_email: "private@example.org" },
    created_at: `2026-11-18T10:0${id.length % 10}:00.000Z`,
    published_at: "2026-11-18T10:00:00.000Z",
    hidden_at: null,
    hidden_reason: null,
    ...extra,
  };
}

let db: FakeSupabase;

function useDatabase(tables: Record<string, Record<string, unknown>[]>) {
  db = createFakeSupabase(
    { flags: [], flag_replies: [], flag_abuse_reports: [], ...tables },
    {
      unique: {
        flag_abuse_reports: [
          ["flag_id", "ip_hash"],
          ["reply_id", "ip_hash"],
        ],
      },
    }
  );
  mocks.createAdminClient.mockReturnValue(db.client);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listPublishedCommentsByBlockKeys", () => {
  // @req REQ-212
  it("returns published, visible comments only", async () => {
    useDatabase({
      flags: [
        flag("a"),
        flag("pending", { published_at: null }),
        flag("hidden", { hidden_at: "2026-11-18T11:00:00.000Z" }),
      ],
    });

    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);

    expect(block.block_key).toBe(NAMING);
    expect(block.count).toBe(1);
    expect(block.threads.map((thread) => thread.id)).toEqual(["a"]);
  });

  // @req REQ-212
  it("answers every requested block, empty ones included, in order", async () => {
    useDatabase({ flags: [flag("a")] });

    const blocks = await listPublishedCommentsByBlockKeys([ORIGIN, NAMING]);

    expect(blocks.map((block) => [block.block_key, block.count])).toEqual([
      [ORIGIN, 0],
      [NAMING, 1],
    ]);
  });

  // @req REQ-212
  it("ignores a key that is not a canonical block key", async () => {
    useDatabase({ flags: [flag("a")] });

    const blocks = await listPublishedCommentsByBlockKeys([
      "languageFamily:FLG_BANTU:origin",
      NAMING,
    ]);

    expect(blocks.map((block) => block.block_key)).toEqual([NAMING]);
  });

  // @req REQ-212
  it("nests visible replies under their thread, oldest first", async () => {
    useDatabase({
      flags: [flag("a")],
      flag_replies: [
        {
          id: "r2",
          flag_id: "a",
          body: "Second",
          is_moderation: true,
          display_name_snapshot: null,
          created_at: "2026-11-18T12:00:00.000Z",
          hidden_at: null,
        },
        {
          id: "r1",
          flag_id: "a",
          body: "First",
          is_moderation: false,
          display_name_snapshot: "Awa",
          created_at: "2026-11-18T11:00:00.000Z",
          hidden_at: null,
        },
        {
          id: "r3",
          flag_id: "a",
          body: "Hidden",
          is_moderation: false,
          display_name_snapshot: null,
          created_at: "2026-11-18T13:00:00.000Z",
          hidden_at: "2026-11-18T14:00:00.000Z",
        },
      ],
    });

    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);

    expect(block.threads[0].replies).toEqual([
      {
        id: "r1",
        body: "First",
        display_name: "Awa",
        is_moderation: false,
        created_at: "2026-11-18T11:00:00.000Z",
      },
      {
        id: "r2",
        body: "Second",
        display_name: null,
        is_moderation: true,
        created_at: "2026-11-18T12:00:00.000Z",
      },
    ]);
  });

  // @req REQ-212
  it("shows the pseudonym but never the contributor's private details", async () => {
    useDatabase({
      flags: [flag("a", { contributor_display_name_snapshot: "Awa" })],
    });

    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    const thread = block.threads[0];

    expect(thread.display_name).toBe("Awa");
    expect(JSON.stringify(block)).not.toContain("private@example.org");
    expect(thread).not.toHaveProperty("contributor_id");
  });

  // The correction is a fact about the block, not about the comment: a
  // correction that came from a report filed without an address still
  // corrected the information the reader sees.
  // @req REQ-212
  it("dates the block's latest published correction from accepted flags", async () => {
    useDatabase({
      flags: [
        flag("a", {
          status: "accepted",
          remediation_published_at: "2026-11-10T00:00:00.000Z",
        }),
        flag("b", {
          published_at: null,
          status: "accepted",
          remediation_published_at: "2026-11-15T00:00:00.000Z",
        }),
        flag("c", {
          status: "rejected",
          remediation_published_at: "2026-11-17T00:00:00.000Z",
        }),
      ],
    });

    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);

    expect(block.corrected_at).toBe("2026-11-15T00:00:00.000Z");
    expect(block.threads.map((thread) => thread.id).sort()).toEqual(["a", "c"]);
  });

  // @req REQ-212
  it("leaves corrected_at null when nothing was corrected", async () => {
    useDatabase({ flags: [flag("a")] });

    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);

    expect(block.corrected_at).toBeNull();
  });
});

describe("publishing one pending comment for a confirmed address", () => {
  function pendingWithContact(id: string, email: string) {
    return {
      flag: flag(id, { published_at: null }),
      contact: {
        flag_id: id,
        email,
        token_hash: `hash-${id}`,
        expires_at: "2026-11-19T00:00:00.000Z",
        verified_at: null,
      },
    };
  }

  describe("publishPendingFlagForEmail", () => {
    // A stranger can type someone else's address under a comment. Confirming
    // one's own comment must never publish theirs too.
    // @req REQ-212
    // @req REQ-213
    it("publishes only the comment named, never the other pending comments of the address", async () => {
      const mine = pendingWithContact("a", "awa@example.org");
      const planted = pendingWithContact("b", "awa@example.org");
      useDatabase({
        flags: [mine.flag, planted.flag],
        flag_reporter_contacts: [mine.contact, planted.contact],
      });

      await expect(
        publishPendingFlagForEmail("SLUGa", "awa@example.org", "user-1")
      ).resolves.toEqual({ published: true });

      const [a, b] = db.tables.flags;
      expect(a.published_at).toEqual(expect.any(String));
      expect(a.contributor_id).toBe("user-1");
      expect(b.published_at).toBeNull();
      expect(b.contributor_id).toBeNull();
      expect(db.tables.flag_reporter_contacts[0].verified_at).toEqual(
        expect.any(String)
      );
      expect(db.tables.flag_reporter_contacts[1].verified_at).toBeNull();
    });

    // @req REQ-213
    it("publishes nothing when the comment was left with another address", async () => {
      const other = pendingWithContact("a", "someone@example.org");
      useDatabase({
        flags: [other.flag],
        flag_reporter_contacts: [other.contact],
      });

      await expect(
        publishPendingFlagForEmail("SLUGa", "awa@example.org", "user-1")
      ).resolves.toEqual({ published: false });
      expect(db.tables.flags[0].published_at).toBeNull();
    });

    // The column is citext: an address typed with capitals is the same one.
    // @req REQ-213
    it("matches the address whatever its case", async () => {
      const mine = pendingWithContact("a", "Awa@Example.org");
      useDatabase({
        flags: [mine.flag],
        flag_reporter_contacts: [mine.contact],
      });

      await expect(
        publishPendingFlagForEmail("SLUGa", "awa@example.org", "user-1")
      ).resolves.toEqual({ published: true });
    });

    // @req REQ-212
    it("is idempotent: a second confirmation publishes nothing new", async () => {
      const mine = pendingWithContact("a", "awa@example.org");
      useDatabase({
        flags: [mine.flag],
        flag_reporter_contacts: [mine.contact],
      });

      await publishPendingFlagForEmail("SLUGa", "awa@example.org", "user-1");
      const firstPublication = db.tables.flags[0].published_at;
      const second = await publishPendingFlagForEmail(
        "SLUGa",
        "awa@example.org",
        "user-1"
      );

      expect(second).toEqual({ published: false });
      expect(db.tables.flags[0].published_at).toBe(firstPublication);
    });

    // @req REQ-213
    it("publishes nothing for an unknown comment", async () => {
      useDatabase({ flags: [flag("a")], flag_reporter_contacts: [] });

      await expect(
        publishPendingFlagForEmail("NOPE", "awa@example.org", "user-1")
      ).resolves.toEqual({ published: false });
    });
  });

  describe("findPendingComment", () => {
    // @req REQ-213
    it("returns the text of a comment still waiting for its address", async () => {
      const mine = pendingWithContact("a", "awa@example.org");
      useDatabase({
        flags: [mine.flag],
        flag_reporter_contacts: [mine.contact],
      });

      await expect(findPendingComment("SLUGa")).resolves.toEqual({
        public_slug: "SLUGa",
        block_key: NAMING,
        body: "Comment a",
      });
    });

    // @req REQ-213
    it("returns nothing for a comment already public", async () => {
      useDatabase({ flags: [flag("a")] });

      await expect(findPendingComment("SLUGa")).resolves.toBeNull();
    });
  });

  describe("disownPendingFlag", () => {
    // « Ce n'est pas moi »: the comment loses the address it carried, so it
    // can never be published or attributed through it.
    // @req REQ-213
    it("unlinks the address from a pending comment and leaves it private", async () => {
      const planted = pendingWithContact("a", "awa@example.org");
      useDatabase({
        flags: [planted.flag],
        flag_reporter_contacts: [planted.contact],
      });

      await expect(
        disownPendingFlag("SLUGa", "awa@example.org")
      ).resolves.toEqual({ disowned: true });

      expect(db.tables.flag_reporter_contacts).toEqual([]);
      expect(db.tables.flags[0].published_at).toBeNull();
      await expect(
        publishPendingFlagForEmail("SLUGa", "awa@example.org", "user-1")
      ).resolves.toEqual({ published: false });
    });

    // @req REQ-213
    it("leaves another address's link alone", async () => {
      const other = pendingWithContact("a", "someone@example.org");
      useDatabase({
        flags: [other.flag],
        flag_reporter_contacts: [other.contact],
      });

      await expect(
        disownPendingFlag("SLUGa", "awa@example.org")
      ).resolves.toEqual({ disowned: false });
      expect(db.tables.flag_reporter_contacts).toHaveLength(1);
    });

    // @req REQ-213
    it("never unlinks a comment already published", async () => {
      useDatabase({
        flags: [flag("a")],
        flag_reporter_contacts: [
          pendingWithContact("a", "awa@example.org").contact,
        ],
      });

      await expect(
        disownPendingFlag("SLUGa", "awa@example.org")
      ).resolves.toEqual({ disowned: false });
      expect(db.tables.flag_reporter_contacts).toHaveLength(1);
    });
  });
});

describe("addReply", () => {
  // @req REQ-212
  it("adds a reply under a published comment", async () => {
    useDatabase({ flags: [flag("a")] });

    const result = await addReply({
      flagId: "a",
      authorId: "user-1",
      displayName: "Awa",
      body: "  Chez nous on dit Pullo.  ",
    });

    expect(result).toEqual({
      ok: true,
      reply: expect.objectContaining({
        body: "Chez nous on dit Pullo.",
        display_name: "Awa",
        is_moderation: false,
      }),
    });
    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.threads[0].replies.map((reply) => reply.body)).toEqual([
      "Chez nous on dit Pullo.",
    ]);
  });

  // @req REQ-212
  it("refuses a reader reply to a comment the public cannot see", async () => {
    useDatabase({
      flags: [
        flag("pending", { published_at: null }),
        flag("hidden", { hidden_at: "2026-11-18T11:00:00.000Z" }),
      ],
    });

    for (const flagId of ["pending", "hidden", "missing"]) {
      await expect(
        addReply({ flagId, authorId: "user-1", body: "Bonjour" })
      ).resolves.toEqual({ ok: false, reason: "not_found" });
    }
    expect(db.tables.flag_replies).toHaveLength(0);
  });

  // @req REQ-212
  it("lets the moderation answer a comment that is not public yet", async () => {
    useDatabase({ flags: [flag("pending", { published_at: null })] });

    const result = await addReply({
      flagId: "pending",
      authorId: "moderator-1",
      body: "Merci, nous vérifions.",
      isModeration: true,
    });

    expect(result).toEqual({
      ok: true,
      reply: expect.objectContaining({ is_moderation: true }),
    });
  });

  // @req REQ-212
  it("refuses an empty reply", async () => {
    useDatabase({ flags: [flag("a")] });

    await expect(
      addReply({ flagId: "a", authorId: "user-1", body: "   " })
    ).resolves.toEqual({ ok: false, reason: "empty_body" });
  });
});

describe("recordAbuseReport", () => {
  // @req REQ-212
  it("hides a comment at three distinct addresses and keeps its text", async () => {
    useDatabase({ flags: [flag("a")] });

    await recordAbuseReport({ flagId: "a" }, "ip-1");
    await recordAbuseReport({ flagId: "a" }, "ip-2");
    expect(db.tables.flags[0].hidden_at).toBeNull();

    const third = await recordAbuseReport({ flagId: "a" }, "ip-3");

    expect(third).toEqual({ ok: true, reports: 3, hidden: true });
    expect(db.tables.flags[0].hidden_at).toEqual(expect.any(String));
    expect(db.tables.flags[0].hidden_reason).toBe("reader_reports");
    expect(db.tables.flags[0].reason_text).toBe("Comment a");
    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.count).toBe(0);
  });

  // @req REQ-212
  it("counts one address once, however many times it reports", async () => {
    useDatabase({ flags: [flag("a")] });

    for (let attempt = 0; attempt < 5; attempt++) {
      await recordAbuseReport({ flagId: "a" }, "ip-1");
    }
    const result = await recordAbuseReport({ flagId: "a" }, "ip-2");

    expect(result).toEqual({ ok: true, reports: 2, hidden: false });
    expect(db.tables.flags[0].hidden_at).toBeNull();
  });

  // @req REQ-212
  it("hides a reply at three distinct addresses", async () => {
    useDatabase({
      flags: [flag("a")],
      flag_replies: [
        {
          id: "r1",
          flag_id: "a",
          body: "Insulte",
          is_moderation: false,
          display_name_snapshot: null,
          created_at: "2026-11-18T11:00:00.000Z",
          hidden_at: null,
        },
      ],
    });

    for (const ip of ["ip-1", "ip-2", "ip-3"]) {
      await recordAbuseReport({ replyId: "r1" }, ip);
    }

    const [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.threads[0].replies).toEqual([]);
    expect(db.tables.flag_replies[0].body).toBe("Insulte");
  });

  // @req REQ-212
  it("refuses a report on something the public cannot see", async () => {
    useDatabase({
      flags: [
        flag("pending", { published_at: null }),
        flag("hidden", { hidden_at: "2026-11-18T11:00:00.000Z" }),
      ],
    });

    await expect(
      recordAbuseReport({ flagId: "pending" }, "ip-1")
    ).resolves.toEqual({ ok: false, reason: "not_found" });
    await expect(
      recordAbuseReport({ flagId: "hidden" }, "ip-1")
    ).resolves.toEqual({ ok: false, reason: "not_found" });
    await expect(
      recordAbuseReport({ replyId: "missing" }, "ip-1")
    ).resolves.toEqual({ ok: false, reason: "not_found" });
    expect(db.tables.flag_abuse_reports).toHaveLength(0);
  });
});

describe("hideComment / unhideComment", () => {
  // @req REQ-212
  it("a moderator hides a comment with a reason, then restores it", async () => {
    useDatabase({ flags: [flag("a")] });

    await expect(hideComment({ flagId: "a" }, "off_topic")).resolves.toBe(true);
    let [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.count).toBe(0);
    expect(db.tables.flags[0].hidden_reason).toBe("off_topic");

    await expect(unhideComment({ flagId: "a" })).resolves.toBe(true);
    [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.count).toBe(1);
    expect(db.tables.flags[0].hidden_reason).toBeNull();
  });

  // A moderator who restores a comment has reviewed the reports against
  // it; the next single report must not hide it again at once.
  // @req REQ-212
  it("restoring a comment clears the reports that hid it", async () => {
    useDatabase({ flags: [flag("a")] });
    for (const ip of ["ip-1", "ip-2", "ip-3"]) {
      await recordAbuseReport({ flagId: "a" }, ip);
    }

    await unhideComment({ flagId: "a" });
    const next = await recordAbuseReport({ flagId: "a" }, "ip-4");

    expect(next).toEqual({ ok: true, reports: 1, hidden: false });
  });

  // @req REQ-212
  it("hides and restores a reply", async () => {
    useDatabase({
      flags: [flag("a")],
      flag_replies: [
        {
          id: "r1",
          flag_id: "a",
          body: "Hors sujet",
          is_moderation: false,
          display_name_snapshot: null,
          created_at: "2026-11-18T11:00:00.000Z",
          hidden_at: null,
        },
      ],
    });

    await hideComment({ replyId: "r1" }, "off_topic");
    let [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.threads[0].replies).toEqual([]);

    await unhideComment({ replyId: "r1" });
    [block] = await listPublishedCommentsByBlockKeys([NAMING]);
    expect(block.threads[0].replies).toHaveLength(1);
  });

  // @req REQ-212
  it("reports false for a target that does not exist", async () => {
    useDatabase({ flags: [] });

    await expect(hideComment({ flagId: "missing" }, "spam")).resolves.toBe(
      false
    );
    await expect(unhideComment({ replyId: "missing" })).resolves.toBe(false);
  });
});
