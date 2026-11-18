import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleAbuseReport,
  handleCommentList,
  handleReplyCreate,
} from "@/api/v2/handlers/comments";

const FLAG_ID = "11111111-1111-4111-8111-111111111111";
const REPLY_ID = "22222222-2222-4222-8222-222222222222";
const NAMING = "people:PPL_PEUL:naming";

const reply = {
  id: REPLY_ID,
  body: "Merci, je confirme.",
  display_name: "Aïssata",
  is_moderation: false,
  created_at: "2026-11-18T11:00:00.000Z",
};

const antibot = {
  salt: "test-salt",
  nonce: "42",
  difficultyBits: 8,
  expiresAt: 4102444800000,
  signature: "test-signature",
};

function makeDependencies() {
  return {
    listPublishedCommentsByBlockKeys: vi.fn().mockResolvedValue([
      {
        block_key: NAMING,
        count: 0,
        threads: [],
        corrected_at: null,
      },
    ]),
    addReply: vi.fn().mockResolvedValue({ ok: true, reply }),
    recordAbuseReport: vi
      .fn()
      .mockResolvedValue({ ok: true, reports: 1, hidden: false }),
    getReaderSession: vi.fn().mockResolvedValue({ id: "reader-1" }),
    verifyAntibotProof: vi.fn().mockResolvedValue("verified" as const),
    checkFlagRateLimit: vi.fn().mockResolvedValue({ allowed: true } as const),
    hashReporterAddress: vi.fn().mockReturnValue("hashed-address"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleCommentList", () => {
  // @req REQ-212
  it("reads every requested block in one call, each key once", async () => {
    const dependencies = makeDependencies();

    const result = await handleCommentList(
      { block_keys: ` ${NAMING},people:PPL_PEUL:origin,${NAMING} ` },
      dependencies
    );

    expect(result.status).toBe(200);
    expect(dependencies.listPublishedCommentsByBlockKeys).toHaveBeenCalledWith([
      NAMING,
      "people:PPL_PEUL:origin",
    ]);
    expect(result.body.data).toEqual([
      { block_key: NAMING, count: 0, threads: [], corrected_at: null },
    ]);
  });

  // @req REQ-212
  it("refuses a request that names no block", async () => {
    const dependencies = makeDependencies();

    const result = await handleCommentList({ block_keys: " , " }, dependencies);

    expect(result.status).toBe(400);
    expect(result.body.errors[0]).toMatchObject({
      code: "VALIDATION_ERROR",
      field: "block_keys",
    });
    expect(
      dependencies.listPublishedCommentsByBlockKeys
    ).not.toHaveBeenCalled();
  });

  /**
   * A page has a handful of commentable blocks. Thirty bounds what one
   * anonymous request can make the database read.
   */
  // @req REQ-212
  it("refuses more than thirty blocks", async () => {
    const dependencies = makeDependencies();
    const keys = Array.from(
      { length: 31 },
      (_, index) => `people:PPL_${index}:naming`
    );

    const result = await handleCommentList(
      { block_keys: keys.join(",") },
      dependencies
    );

    expect(result.status).toBe(400);
    expect(
      dependencies.listPublishedCommentsByBlockKeys
    ).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("lets a public cache keep the answer briefly", async () => {
    const result = await handleCommentList(
      { block_keys: NAMING },
      makeDependencies()
    );

    expect(result.headers["Cache-Control"]).toMatch(/s-maxage=\d+/);
  });
});

describe("handleReplyCreate", () => {
  // @req REQ-212
  it("publishes a signed-in reader's reply at once", async () => {
    const dependencies = makeDependencies();

    const result = await handleReplyCreate(
      FLAG_ID,
      { body: "  Merci, je confirme.  ", display_name: " Aïssata " },
      dependencies
    );

    expect(result.status).toBe(201);
    expect(dependencies.addReply).toHaveBeenCalledWith({
      flagId: FLAG_ID,
      authorId: "reader-1",
      displayName: "Aïssata",
      body: "Merci, je confirme.",
    });
    expect(result.body.data).toEqual(reply);
  });

  // @req REQ-212
  it("refuses a reply without a reader session", async () => {
    const dependencies = makeDependencies();
    dependencies.getReaderSession.mockResolvedValue(null);

    const result = await handleReplyCreate(
      FLAG_ID,
      { body: "Merci." },
      dependencies
    );

    expect(result.status).toBe(401);
    expect(result.body.errors[0].code).toBe("UNAUTHENTICATED");
    expect(dependencies.addReply).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("holds a reader to the write budget, keyed on the account", async () => {
    const dependencies = makeDependencies();
    dependencies.checkFlagRateLimit.mockResolvedValue({
      allowed: false,
      retryAfter: 60,
      limit: 10,
      remaining: 0,
      reset: 1,
    });

    const result = await handleReplyCreate(
      FLAG_ID,
      { body: "Merci." },
      dependencies
    );

    expect(result.status).toBe(429);
    expect(result.headers["Retry-After"]).toBe("60");
    expect(dependencies.checkFlagRateLimit).toHaveBeenCalledWith("reader-1");
    expect(dependencies.addReply).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("refuses a pseudonym longer than forty characters", async () => {
    const dependencies = makeDependencies();

    const result = await handleReplyCreate(
      FLAG_ID,
      { body: "Merci.", display_name: "x".repeat(41) },
      dependencies
    );

    expect(result.status).toBe(400);
    expect(dependencies.addReply).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("answers not found for a comment the public cannot see", async () => {
    const dependencies = makeDependencies();
    dependencies.addReply.mockResolvedValue({
      ok: false,
      reason: "not_found",
    });

    const result = await handleReplyCreate(
      FLAG_ID,
      { body: "Merci." },
      dependencies
    );

    expect(result.status).toBe(404);
  });

  // Not a uuid: the database would answer with a type error, not a 404.
  // @req REQ-212
  it("answers not found for an id that cannot be a comment", async () => {
    const dependencies = makeDependencies();

    const result = await handleReplyCreate(
      "not-a-uuid",
      { body: "Merci." },
      dependencies
    );

    expect(result.status).toBe(404);
    expect(dependencies.addReply).not.toHaveBeenCalled();
  });
});

describe("handleAbuseReport", () => {
  // @req REQ-212
  it("records an anonymous report against the hashed address", async () => {
    const dependencies = makeDependencies();

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      { antibot, elapsedMs: 4_000 },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(201);
    expect(dependencies.getReaderSession).not.toHaveBeenCalled();
    expect(dependencies.hashReporterAddress).toHaveBeenCalledWith(
      "203.0.113.7"
    );
    expect(dependencies.recordAbuseReport).toHaveBeenCalledWith(
      { flagId: FLAG_ID },
      "hashed-address"
    );
    expect(dependencies.checkFlagRateLimit).toHaveBeenCalledWith(
      "report:hashed-address"
    );
    // Whether the report tipped the comment into hiding is the moderation's
    // to know, not the reporter's.
    expect(result.body.data).toEqual({ received: true });
  });

  // @req REQ-212
  it("reports a reply by its own id", async () => {
    const dependencies = makeDependencies();

    const result = await handleAbuseReport(
      { flagId: FLAG_ID, replyId: REPLY_ID },
      { antibot, elapsedMs: 4_000 },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(201);
    expect(dependencies.recordAbuseReport).toHaveBeenCalledWith(
      { replyId: REPLY_ID },
      "hashed-address"
    );
  });

  // @req REQ-212
  it("refuses a report without a valid proof of work", async () => {
    const dependencies = makeDependencies();
    dependencies.verifyAntibotProof.mockResolvedValue("rejected");

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      { antibot, elapsedMs: 4_000 },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(403);
    expect(dependencies.recordAbuseReport).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("refuses a report with no proof at all", async () => {
    const dependencies = makeDependencies();

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      {},
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(400);
    expect(dependencies.verifyAntibotProof).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("says so when the proof of work cannot be checked", async () => {
    const dependencies = makeDependencies();
    dependencies.verifyAntibotProof.mockResolvedValue("unavailable");

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      { antibot, elapsedMs: 4_000 },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(503);
  });

  // @req REQ-212
  it("holds a reporter to the rate limit", async () => {
    const dependencies = makeDependencies();
    dependencies.checkFlagRateLimit.mockResolvedValue({
      allowed: false,
      retryAfter: 120,
    });

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      { antibot, elapsedMs: 4_000 },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(429);
    expect(dependencies.recordAbuseReport).not.toHaveBeenCalled();
  });

  // @req REQ-212
  it("answers not found for a comment the public cannot see", async () => {
    const dependencies = makeDependencies();
    dependencies.recordAbuseReport.mockResolvedValue({
      ok: false,
      reason: "not_found",
    });

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      { antibot, elapsedMs: 4_000 },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(404);
  });

  // @req REQ-212
  it("refuses a filled honeypot before spending the proof", async () => {
    const dependencies = makeDependencies();

    const result = await handleAbuseReport(
      { flagId: FLAG_ID },
      { antibot, elapsedMs: 4_000, website: "spam" },
      { clientIp: "203.0.113.7" },
      dependencies
    );

    expect(result.status).toBe(403);
    expect(dependencies.verifyAntibotProof).not.toHaveBeenCalled();
  });
});
