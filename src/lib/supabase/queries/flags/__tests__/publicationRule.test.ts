/**
 * The publication rule on the pages that read flags with the anon key
 * (migration 117). RLS already holds it for that key; these reads apply it
 * too, so a page stays correct on a database where 117 has not landed yet
 * and does not depend on one layer alone.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFakeSupabase, type FakeSupabase } from "@/test/fakeSupabase";

const mocks = vi.hoisted(() => ({ createServerClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { getActiveSourceFlags } from "../../afrik/flags";
import { getFlagsSummaryMap } from "../../afrik/module-zero-batch";
import { getFlagBySlug } from "../getFlagBySlug";
import { queryPublicFlagsPage } from "../publicFlagsPageQuery";

function flag(id: string, extra: Record<string, unknown>) {
  return {
    id,
    public_slug: id.toUpperCase(),
    entity_type: "people",
    entity_id: "PPL_PEUL",
    assertion_id: null,
    assertion_field_path: null,
    flag_kind: "other",
    reason_text: "Text",
    contributor_id: null,
    severity: null,
    auto_generated: true,
    status: "open",
    created_at: "2026-11-18T10:00:00.000Z",
    remediation_state: null,
    remediation_published_at: null,
    published_at: "2026-11-18T10:00:00.000Z",
    hidden_at: null,
    ...extra,
  };
}

let db: FakeSupabase;

beforeEach(() => {
  db = createFakeSupabase({
    flags: [
      flag("published", {}),
      flag("pending", { published_at: null }),
      flag("hidden", { hidden_at: "2026-11-18T11:00:00.000Z" }),
    ],
  });
  mocks.createServerClient.mockReturnValue(db.client);
});

describe("anon-key flag reads", () => {
  // @req REQ-212
  it("the public register lists published, visible flags only", async () => {
    const page = await queryPublicFlagsPage(db.client as never);

    expect(page.items.map((item) => item.id)).toEqual(["published"]);
  });

  // @req REQ-212
  it("a report page is not found while pending or hidden", async () => {
    await expect(getFlagBySlug("PUBLISHED")).resolves.not.toBeNull();
    await expect(getFlagBySlug("PENDING")).resolves.toBeNull();
    await expect(getFlagBySlug("HIDDEN")).resolves.toBeNull();
  });

  // @req REQ-212
  it("the source badge counts published, visible flags only", async () => {
    await expect(
      getActiveSourceFlags("people", "PPL_PEUL")
    ).resolves.toHaveLength(1);
  });

  // @req REQ-212
  it("the per-people summary counts published, visible flags only", async () => {
    const summary = await getFlagsSummaryMap(["PPL_PEUL"]);

    expect(summary.get("PPL_PEUL")).toEqual({ openCount: 1, totalCount: 1 });
  });
});
