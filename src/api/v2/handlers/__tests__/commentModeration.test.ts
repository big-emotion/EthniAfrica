import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleCommentVisibility,
  handleModeratorReply,
} from "@/api/v2/handlers/commentModeration";

/**
 * The handlers are the only authorization: replies and visibility travel on
 * the service-role client, so nothing below them asks who the caller is.
 */

const moderator = { id: "3f1d2a8e-0000-4000-8000-00000000abcd" };
const flagId = "aaaaaaaa-0000-4000-8000-000000000001";
const replyId = "bbbbbbbb-0000-4000-8000-000000000001";

const moderationReply = {
  id: replyId,
  body: "Merci, nous vérifions la source.",
  display_name: null,
  is_moderation: true,
  created_at: "2026-11-18T10:00:00.000Z",
};

function makeDependencies() {
  return {
    getModeratorByAccessToken: vi.fn().mockResolvedValue(moderator),
    addReply: vi.fn().mockResolvedValue({ ok: true, reply: moderationReply }),
    hideComment: vi.fn().mockResolvedValue(true),
    unhideComment: vi.fn().mockResolvedValue(true),
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
  };
}

const session = { accessToken: "moderator-token", clientIp: "203.0.113.7" };

describe("handleModeratorReply", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-214
  it("answers 401 without a session and 403 for a session off the allowlist", async () => {
    const dependencies = makeDependencies();

    const anonymous = await handleModeratorReply(
      flagId,
      { body: "Bonjour" },
      { accessToken: null },
      dependencies
    );
    dependencies.getModeratorByAccessToken.mockResolvedValue(null);
    const reader = await handleModeratorReply(
      flagId,
      { body: "Bonjour" },
      { accessToken: "reader-token" },
      dependencies
    );

    expect(anonymous.status).toBe(401);
    expect(reader.status).toBe(403);
    expect(dependencies.addReply).not.toHaveBeenCalled();
    expect(dependencies.writeAuditLog).not.toHaveBeenCalled();
  });

  // @req REQ-214
  it("posts a reply signed by the moderation, authored by the moderator, and records it", async () => {
    const dependencies = makeDependencies();

    const result = await handleModeratorReply(
      flagId,
      { body: "  Merci, nous vérifions la source.  " },
      session,
      dependencies
    );

    expect(result.status).toBe(201);
    expect(result.body.data).toEqual(moderationReply);
    expect(dependencies.addReply).toHaveBeenCalledWith({
      flagId,
      authorId: moderator.id,
      body: "Merci, nous vérifions la source.",
      isModeration: true,
    });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: moderator.id,
        action: "comment.moderation_reply",
        targetType: "flag",
        targetId: flagId,
        after: moderationReply,
        ip: "203.0.113.7",
      })
    );
  });

  // @req REQ-214
  it("refuses an empty reply with 400", async () => {
    const dependencies = makeDependencies();

    const result = await handleModeratorReply(
      flagId,
      { body: "   " },
      session,
      dependencies
    );

    expect(result.status).toBe(400);
    expect(dependencies.addReply).not.toHaveBeenCalled();
  });

  // @req REQ-214
  it("answers 404 for a comment that does not exist, or an id that is not one", async () => {
    const dependencies = makeDependencies();
    dependencies.addReply.mockResolvedValue({ ok: false, reason: "not_found" });

    const missing = await handleModeratorReply(
      flagId,
      { body: "Bonjour" },
      session,
      dependencies
    );
    const malformed = await handleModeratorReply(
      "not-a-uuid",
      { body: "Bonjour" },
      session,
      dependencies
    );

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
    expect(dependencies.writeAuditLog).not.toHaveBeenCalled();
  });
});

describe("handleCommentVisibility", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-214
  it("answers 401 without a session and 403 for a session off the allowlist", async () => {
    const dependencies = makeDependencies();

    const anonymous = await handleCommentVisibility(
      { flagId },
      { hidden: false },
      { accessToken: null },
      dependencies
    );
    dependencies.getModeratorByAccessToken.mockResolvedValue(null);
    const reader = await handleCommentVisibility(
      { flagId },
      { hidden: false },
      { accessToken: "reader-token" },
      dependencies
    );

    expect(anonymous.status).toBe(401);
    expect(reader.status).toBe(403);
    expect(dependencies.unhideComment).not.toHaveBeenCalled();
  });

  // @req REQ-214
  it("hides a comment with the moderator's reason and records it", async () => {
    const dependencies = makeDependencies();

    const result = await handleCommentVisibility(
      { flagId },
      { hidden: true, reason: "Propos injurieux" },
      session,
      dependencies
    );

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual({ hidden: true });
    expect(dependencies.hideComment).toHaveBeenCalledWith(
      { flagId },
      "Propos injurieux"
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: moderator.id,
        action: "comment.hide",
        targetType: "flag",
        targetId: flagId,
        after: { hidden: true, reason: "Propos injurieux" },
      })
    );
  });

  // The record says why a comment left the page; a hide without one is the
  // silent removal the charter rules out.
  // @req REQ-214
  it("refuses to hide a comment without a reason", async () => {
    const dependencies = makeDependencies();

    const result = await handleCommentVisibility(
      { flagId },
      { hidden: true },
      session,
      dependencies
    );

    expect(result.status).toBe(400);
    expect(dependencies.hideComment).not.toHaveBeenCalled();
  });

  // @req REQ-214
  it("unhides an auto-hidden comment and records it", async () => {
    const dependencies = makeDependencies();

    const result = await handleCommentVisibility(
      { flagId },
      { hidden: false },
      session,
      dependencies
    );

    expect(result.status).toBe(200);
    expect(dependencies.unhideComment).toHaveBeenCalledWith({ flagId });
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "comment.unhide",
        targetType: "flag",
        targetId: flagId,
      })
    );
  });

  // A reply has no reason column; it is hidden or it is not.
  // @req REQ-214
  it("hides a reply without asking for a reason", async () => {
    const dependencies = makeDependencies();

    const result = await handleCommentVisibility(
      { replyId },
      { hidden: true },
      session,
      dependencies
    );

    expect(result.status).toBe(200);
    expect(dependencies.hideComment).toHaveBeenCalledWith(
      { replyId },
      "moderator"
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "comment.hide",
        targetType: "flag_reply",
        targetId: replyId,
      })
    );
  });

  // @req REQ-214
  it("answers 404 when nothing matched, without recording anything", async () => {
    const dependencies = makeDependencies();
    dependencies.unhideComment.mockResolvedValue(false);

    const result = await handleCommentVisibility(
      { replyId },
      { hidden: false },
      session,
      dependencies
    );

    expect(result.status).toBe(404);
    expect(dependencies.writeAuditLog).not.toHaveBeenCalled();
  });
});
