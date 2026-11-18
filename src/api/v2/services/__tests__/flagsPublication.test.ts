/**
 * The publication rule on the flags service (migration 117): the public API
 * reads with the service-role client, which RLS does not filter, so the
 * service itself must keep pending and hidden flags out — and the moderation
 * console must keep seeing them.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase } from "@/test/fakeSupabase";

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

import { getFlagAuditTrail } from "../auditLog";
import {
  getFlagByIdOrSlug,
  listFlags,
  listFlagsForModeration,
  transitionFlag,
} from "../flags";

const PUBLISHED = "aaaaaaaa-0000-4000-8000-000000000001";
const PENDING = "aaaaaaaa-0000-4000-8000-000000000002";
const HIDDEN = "aaaaaaaa-0000-4000-8000-000000000003";

function flag(id: string, slug: string, extra: Record<string, unknown>) {
  return {
    id,
    public_slug: slug,
    entity_type: "people",
    entity_id: "PPL_PEUL",
    assertion_field_path: null,
    flag_kind: "inaccurate",
    reason_text: "Text",
    counter_source_url: null,
    counter_source_citation: null,
    proposed_rewrite: null,
    status: "open",
    created_at: "2026-11-18T10:00:00.000Z",
    updated_at: null,
    resolved_at: null,
    published_at: "2026-11-18T10:00:00.000Z",
    hidden_at: null,
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  const db = createFakeSupabase({
    flags: [
      flag(PUBLISHED, "PUBLISHED0", {}),
      flag(PENDING, "PENDING000", { published_at: null }),
      flag(HIDDEN, "HIDDEN0000", { hidden_at: "2026-11-18T11:00:00.000Z" }),
    ],
  });
  mocks.createAdminClient.mockReturnValue(db.client);
});

describe("public flag reads", () => {
  // @req REQ-212
  it("listFlags returns published, visible flags only", async () => {
    const { items } = await listFlags({ limit: 20 });

    expect(items.map((item) => item.id)).toEqual([PUBLISHED]);
  });

  // @req REQ-212
  it("getFlagByIdOrSlug finds neither a pending nor a hidden flag", async () => {
    await expect(getFlagByIdOrSlug(PUBLISHED)).resolves.not.toBeNull();
    await expect(getFlagByIdOrSlug(PENDING)).resolves.toBeNull();
    await expect(getFlagByIdOrSlug("PENDING000")).resolves.toBeNull();
    await expect(getFlagByIdOrSlug(HIDDEN)).resolves.toBeNull();
  });
});

describe("public audit trail", () => {
  // @req REQ-212
  it("has no trail for a pending or hidden flag", async () => {
    await expect(getFlagAuditTrail(PUBLISHED)).resolves.not.toBeNull();
    await expect(getFlagAuditTrail(PENDING)).resolves.toBeNull();
    await expect(getFlagAuditTrail("HIDDEN0000")).resolves.toBeNull();
  });
});

describe("moderation reads", () => {
  // @req REQ-212
  it("the console still lists pending and hidden flags", async () => {
    const { items, total } = await listFlagsForModeration({
      sort: "recent",
      page: 1,
      pageSize: 20,
    });

    expect(total).toBe(3);
    expect(items.map((item) => item.id).sort()).toEqual(
      [PUBLISHED, PENDING, HIDDEN].sort()
    );
  });

  // @req REQ-212
  it("a moderator can decide on a comment that is not public yet", async () => {
    const result = await transitionFlag(PENDING, {
      status: "under_review",
      moderatorId: "moderator-1",
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, previousStatus: "open" })
    );
  });
});
