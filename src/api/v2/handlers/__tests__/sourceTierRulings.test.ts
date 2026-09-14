import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleSourceTierRulingDraftCreate } from "@/api/v2/handlers/sourceTierRulings";

/**
 * The handler owns the authorization — the table has RLS and no policy, so the
 * service-role insert below it asks nobody again — and the shape of a decision.
 */

const moderator = { id: "3f1d2a8e-0000-4000-8000-00000000abcd" };

const draftRow = {
  id: "9c81ca0d-ae45-4f08-8f53-2ac0a9673abd",
  fiche_path: "pays/BEN.json",
  source_title: "ONU – World Population Prospects 2025",
  source_url: null,
  decision: "tier",
  tier: "official",
  repaired_url: null,
  rationale: "United Nations population estimates, dated edition.",
  decided_by: moderator.id,
  decided_at: "2026-09-14T10:00:00.000Z",
};

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    fiche_path: "pays/BEN.json",
    source_title: "ONU – World Population Prospects 2025",
    source_url: null,
    decision: "tier",
    tier: "official",
    rationale: "United Nations population estimates, dated edition.",
    ...overrides,
  };
}

function makeDependencies() {
  return {
    getModeratorByAccessToken: vi.fn().mockResolvedValue(moderator),
    insertSourceTierRulingDraft: vi.fn().mockResolvedValue(draftRow),
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
  };
}

describe("handleSourceTierRulingDraftCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-042
  it("answers 401 to a request carrying no bearer token", async () => {
    const dependencies = makeDependencies();

    const result = await handleSourceTierRulingDraftCreate(
      validBody(),
      { accessToken: null },
      dependencies
    );

    expect(result.status).toBe(401);
    expect(dependencies.getModeratorByAccessToken).not.toHaveBeenCalled();
    expect(dependencies.insertSourceTierRulingDraft).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("answers 403 to a signed-in address that is not on the allowlist", async () => {
    const dependencies = makeDependencies();
    dependencies.getModeratorByAccessToken.mockResolvedValue(null);

    const result = await handleSourceTierRulingDraftCreate(
      validBody(),
      { accessToken: "reader-token" },
      dependencies
    );

    expect(result.status).toBe(403);
    expect(dependencies.insertSourceTierRulingDraft).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("answers 400 to a decision with no rationale", async () => {
    const dependencies = makeDependencies();

    const result = await handleSourceTierRulingDraftCreate(
      validBody({ rationale: "   " }),
      { accessToken: "moderator-token" },
      dependencies
    );

    expect(result.status).toBe(400);
    expect(JSON.stringify(result.body)).toContain("rationale");
    expect(dependencies.insertSourceTierRulingDraft).not.toHaveBeenCalled();
  });

  // needs_review is the absence of a ruling; a ruling cannot state it.
  // @req REQ-092
  it("answers 400 to a decision stating needs_review as its tier", async () => {
    const dependencies = makeDependencies();

    const result = await handleSourceTierRulingDraftCreate(
      validBody({ tier: "needs_review" }),
      { accessToken: "moderator-token" },
      dependencies
    );

    expect(result.status).toBe(400);
    expect(dependencies.insertSourceTierRulingDraft).not.toHaveBeenCalled();
  });

  // @req REQ-092
  it("answers 400 to a repair with no corrected address, and to a removal stating a tier", async () => {
    const dependencies = makeDependencies();

    const repair = await handleSourceTierRulingDraftCreate(
      validBody({ decision: "repair", tier: "referenced" }),
      { accessToken: "moderator-token" },
      dependencies
    );
    const removal = await handleSourceTierRulingDraftCreate(
      validBody({ decision: "remove", tier: "official" }),
      { accessToken: "moderator-token" },
      dependencies
    );

    expect(repair.status).toBe(400);
    expect(removal.status).toBe(400);
    expect(dependencies.insertSourceTierRulingDraft).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("records the draft under the moderator's id, writes an audit row and answers 201", async () => {
    const dependencies = makeDependencies();

    const result = await handleSourceTierRulingDraftCreate(
      validBody(),
      { accessToken: "moderator-token", clientIp: "203.0.113.9" },
      dependencies
    );

    expect(result.status).toBe(201);
    expect(dependencies.insertSourceTierRulingDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        fiche_path: "pays/BEN.json",
        source_title: "ONU – World Population Prospects 2025",
        source_url: null,
        decision: "tier",
        tier: "official",
      }),
      moderator.id
    );
    expect(dependencies.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: moderator.id,
        action: "source_tier_ruling.draft",
        targetType: "source_tier_ruling_draft",
        targetId: draftRow.id,
        after: draftRow,
        ip: "203.0.113.9",
      })
    );
    expect(result.body).toMatchObject({ data: draftRow, errors: [] });
  });
});
