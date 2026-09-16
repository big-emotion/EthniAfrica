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

import { AUDIT_TRAIL_COLUMNS, getFlagAuditTrail } from "../auditLog";

const FLAG_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const FLAG_SLUG = "00EZK83QDV";

const flagRow = {
  id: FLAG_ID,
  public_slug: FLAG_SLUG,
  created_at: "2026-09-08T14:22:00.000Z",
};

const transitionRow = (status: string, createdAt: string) => ({
  action: "flag.transition",
  created_at: createdAt,
  metadata: { before: { status: "open" }, after: { status } },
});

/**
 * Two chained PostgREST queries, in the order the service issues them: the
 * flag first, its trail second. Each builder records what it was asked for so
 * a test can assert on the select string — the column list is the security
 * boundary here, not a filter applied afterwards.
 */
function stubSupabase(options: {
  flag?: typeof flagRow | null;
  flagError?: { message: string };
  entries?: unknown[];
  entriesError?: { message: string };
}) {
  const selects: string[] = [];
  const filters: unknown[][] = [];

  const flagQuery: Record<string, unknown> = {
    select: vi.fn((columns: string) => {
      selects.push(columns);
      return flagQuery;
    }),
    eq: vi.fn(() => flagQuery),
    maybeSingle: vi.fn(() =>
      Promise.resolve({
        data: options.flag === undefined ? flagRow : options.flag,
        error: options.flagError ?? null,
      })
    ),
  };

  const trailQuery: Record<string, unknown> = {
    select: vi.fn((columns: string) => {
      selects.push(columns);
      return trailQuery;
    }),
    eq: vi.fn((...args: unknown[]) => {
      filters.push(args);
      return trailQuery;
    }),
    in: vi.fn((...args: unknown[]) => {
      filters.push(args);
      return trailQuery;
    }),
    order: vi.fn(() =>
      Promise.resolve({
        data: options.entries ?? [],
        error: options.entriesError ?? null,
      })
    ),
  };

  mocks.createAdminClient.mockReturnValue({
    from: vi.fn((table: string) =>
      table === "flags" ? flagQuery : trailQuery
    ),
  });

  return { selects, filters };
}

describe("getFlagAuditTrail", () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * The rule the whole screen exists to keep. A moderator's identity is not
   * withheld by a mapping step that a later refactor can drop — the columns
   * carrying it are never selected, so there is nothing in the service to
   * leak.
   */
  // @req REQ-041
  it("never asks Postgres for the acting moderator's identity", async () => {
    const { selects } = stubSupabase({ entries: [] });

    await getFlagAuditTrail(FLAG_SLUG);

    expect(AUDIT_TRAIL_COLUMNS).not.toMatch(/actor_id/);
    expect(AUDIT_TRAIL_COLUMNS).not.toMatch(/ip_address/);
    for (const columns of selects) {
      expect(columns).not.toMatch(/actor_id|ip_address|contributor_id|email/);
    }
  });

  // @req REQ-041
  it("opens the trail on the report's arrival, credited to a reader", async () => {
    stubSupabase({ entries: [] });

    const trail = await getFlagAuditTrail(FLAG_SLUG);

    expect(trail.publicSlug).toBe(FLAG_SLUG);
    expect(trail.entries[0]).toEqual({
      event: "received",
      occurredAt: "2026-09-08T14:22:00.000Z",
      actorRole: "reader",
      authorisationLevel: null,
    });
  });

  /**
   * The role is read off the action, not off the actor: only the
   * allowlist-gated handler writes `flag.transition`, so an entry of that
   * action was written by a moderator by construction.
   */
  // @req REQ-041
  it("names the role and the authorisation level of each transition", async () => {
    stubSupabase({
      entries: [
        transitionRow("under_review", "2026-09-16T07:58:00.000Z"),
        transitionRow("accepted", "2026-09-16T08:02:00.000Z"),
      ],
    });

    const trail = await getFlagAuditTrail(FLAG_SLUG);

    expect(trail.entries.slice(1)).toEqual([
      {
        event: "under_review",
        occurredAt: "2026-09-16T07:58:00.000Z",
        actorRole: "moderator",
        authorisationLevel: "admin",
      },
      {
        event: "accepted",
        occurredAt: "2026-09-16T08:02:00.000Z",
        actorRole: "moderator",
        authorisationLevel: "admin",
      },
    ]);
  });

  /**
   * The transition handler stamps the entry with whichever identifier the
   * caller used — the console sends the UUID, a script may send the slug — so
   * a trail read by one of them must match both or it comes back empty.
   */
  // @req REQ-041
  it("matches entries written under either the flag's id or its slug", async () => {
    const { filters } = stubSupabase({ entries: [] });

    await getFlagAuditTrail(FLAG_SLUG);

    expect(filters).toContainEqual(["entity_id", [FLAG_ID, FLAG_SLUG]]);
  });

  // @req REQ-041
  it("returns null for an identifier no report carries", async () => {
    stubSupabase({ flag: null });

    expect(await getFlagAuditTrail("unknown")).toBeNull();
  });

  /**
   * An unreadable trail is not an empty one. Rendering "nothing was decided"
   * over a failed read is the defect this screen repairs, one layer down.
   */
  // @req REQ-041
  it("raises rather than report an unreadable trail as an empty one", async () => {
    stubSupabase({ entriesError: { message: "permission denied" } });

    await expect(getFlagAuditTrail(FLAG_SLUG)).rejects.toThrow(
      /permission denied/
    );
    expect(mocks.loggerError).toHaveBeenCalled();
  });

  /**
   * `audit_log` is shared by every subsystem and its rows are shaped by
   * whoever wrote them. An entry this screen cannot read is dropped, not
   * rendered as an undefined event.
   */
  // @req REQ-041
  it("drops an entry whose recorded action it cannot name", async () => {
    stubSupabase({
      entries: [
        {
          action: "confidence_recompute_all",
          created_at: "2026-09-16T08:00:00.000Z",
          metadata: {},
        },
        {
          action: "flag.transition",
          created_at: "2026-09-16T08:01:00.000Z",
          metadata: { after: {} },
        },
        transitionRow("accepted", "2026-09-16T08:02:00.000Z"),
      ],
    });

    const trail = await getFlagAuditTrail(FLAG_SLUG);

    expect(trail.entries.map((entry) => entry.event)).toEqual([
      "received",
      "accepted",
    ]);
  });
});
