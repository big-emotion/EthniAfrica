import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleFlagAuditTrailRead } from "@/api/v2/handlers/auditLog";

/**
 * The handler owns the authorisation. `audit_log` is read on the service-role
 * client, so nothing below this function asks again who the caller is, and
 * nothing above it does either — the route only parses the request.
 */

const moderator = { id: "3f1d2a8e-0000-4000-8000-00000000abcd" };

const trail = {
  publicSlug: "00EZK83QDV",
  entries: [
    {
      event: "received" as const,
      occurredAt: "2026-09-08T14:22:00.000Z",
      actorRole: "reader" as const,
      authorisationLevel: null,
    },
    {
      event: "accepted" as const,
      occurredAt: "2026-09-16T08:02:00.000Z",
      actorRole: "moderator" as const,
      authorisationLevel: "admin" as const,
    },
  ],
};

function makeDependencies() {
  return {
    getModeratorByAccessToken: vi.fn().mockResolvedValue(moderator),
    getFlagAuditTrail: vi.fn().mockResolvedValue(trail),
  };
}

describe("handleFlagAuditTrailRead", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-041
  it("answers 401 to a request carrying no bearer token", async () => {
    const dependencies = makeDependencies();

    const result = await handleFlagAuditTrailRead(
      "00EZK83QDV",
      { accessToken: null },
      dependencies
    );

    expect(result.status).toBe(401);
    expect(dependencies.getFlagAuditTrail).not.toHaveBeenCalled();
  });

  /**
   * Refuse by default: a signed-in reader is not a moderator, and the register
   * this endpoint serves is the console's, not the public page's.
   */
  // @req REQ-041
  it("answers 403 to a signed-in address that is not on the allowlist", async () => {
    const dependencies = makeDependencies();
    dependencies.getModeratorByAccessToken.mockResolvedValue(null);

    const result = await handleFlagAuditTrailRead(
      "00EZK83QDV",
      { accessToken: "reader-token" },
      dependencies
    );

    expect(result.status).toBe(403);
    expect(dependencies.getFlagAuditTrail).not.toHaveBeenCalled();
  });

  // @req REQ-041
  it("answers 404 for an identifier no report carries", async () => {
    const dependencies = makeDependencies();
    dependencies.getFlagAuditTrail.mockResolvedValue(null);

    const result = await handleFlagAuditTrailRead(
      "nothing",
      { accessToken: "moderator-token" },
      dependencies
    );

    expect(result.status).toBe(404);
  });

  // @req REQ-041
  it("serves the trail in the envelope, oldest entry first", async () => {
    const dependencies = makeDependencies();

    const result = await handleFlagAuditTrailRead(
      "00EZK83QDV",
      { accessToken: "moderator-token" },
      dependencies
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ data: trail, errors: [] });
    expect(dependencies.getFlagAuditTrail).toHaveBeenCalledWith("00EZK83QDV");
  });

  /**
   * The load-bearing assertion of the whole endpoint. A register that names
   * the person who decided turns an accountability record into a target, and
   * the level of authorisation is all a reader of the register needs.
   */
  // @req REQ-041
  it("names no moderator anywhere in what it serves", async () => {
    const dependencies = makeDependencies();

    const result = await handleFlagAuditTrailRead(
      "00EZK83QDV",
      { accessToken: "moderator-token" },
      dependencies
    );

    const served = JSON.stringify(result.body);
    expect(served).not.toContain(moderator.id);
    expect(served).not.toMatch(/actor_id|actorId|email|@|ip_address/i);
    // What it does say instead: the role, and the level it acted at.
    expect(served).toContain("moderator");
    expect(served).toContain("admin");
  });
});
