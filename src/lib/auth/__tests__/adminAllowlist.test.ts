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

import {
  isConfirmedAllowlistedUser,
  isEmailAllowlisted,
} from "../adminAllowlist";

function allowlistReturning(result: {
  data: unknown;
  error: { message: string } | null;
}) {
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(() => Promise.resolve(result));
  const from = vi.fn(() => query);
  mocks.createAdminClient.mockReturnValue({ from });
  return { from, query };
}

describe("isEmailAllowlisted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-042
  it("admits an address the allowlist holds", async () => {
    allowlistReturning({
      data: { email: "moderation@example.org" },
      error: null,
    });

    await expect(isEmailAllowlisted("moderation@example.org")).resolves.toBe(
      true
    );
  });

  // @req REQ-042
  it("refuses an address the allowlist does not hold", async () => {
    allowlistReturning({ data: null, error: null });

    await expect(isEmailAllowlisted("inconnue@example.org")).resolves.toBe(
      false
    );
  });

  // @req REQ-042
  it("looks the address up trimmed of surrounding space", async () => {
    const { query } = allowlistReturning({
      data: { email: "moderation@example.org" },
      error: null,
    });

    await isEmailAllowlisted("  moderation@example.org  ");

    expect(query.eq).toHaveBeenCalledWith("email", "moderation@example.org");
  });

  // @req REQ-042
  it("refuses without querying when there is no address", async () => {
    const { from } = allowlistReturning({ data: null, error: null });

    await expect(isEmailAllowlisted(null)).resolves.toBe(false);
    await expect(isEmailAllowlisted("   ")).resolves.toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  // @req REQ-042
  it("fails closed when the allowlist cannot be read", async () => {
    allowlistReturning({
      data: null,
      error: { message: "connection refused" },
    });

    await expect(isEmailAllowlisted("moderation@example.org")).resolves.toBe(
      false
    );
    expect(mocks.loggerError).toHaveBeenCalled();
  });
});

describe("isEmailAllowlisted address normalisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-042
  it("looks the address up in lower case", async () => {
    const { query } = allowlistReturning({
      data: { email: "moderation@example.org" },
      error: null,
    });

    await isEmailAllowlisted("Moderation@Example.ORG");

    expect(query.eq).toHaveBeenCalledWith("email", "moderation@example.org");
  });
});

describe("isConfirmedAllowlistedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // @req REQ-042
  it("admits a confirmed user whose address the allowlist holds", async () => {
    allowlistReturning({
      data: { email: "moderation@example.org" },
      error: null,
    });

    await expect(
      isConfirmedAllowlistedUser({
        email: "moderation@example.org",
        email_confirmed_at: "2026-11-01T00:00:00.000Z",
      })
    ).resolves.toBe(true);
  });

  // GoTrue sign-up is open: an address typed into a sign-up form is a claim
  // until the confirmation link has been followed.
  // @req REQ-042
  it("refuses an unconfirmed user without consulting the allowlist", async () => {
    const { from } = allowlistReturning({
      data: { email: "moderation@example.org" },
      error: null,
    });

    await expect(
      isConfirmedAllowlistedUser({
        email: "moderation@example.org",
        email_confirmed_at: null,
      })
    ).resolves.toBe(false);
    await expect(isConfirmedAllowlistedUser(null)).resolves.toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});
