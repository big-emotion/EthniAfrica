import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mocks.getUser, signInWithOtp: mocks.signInWithOtp },
    })
  ),
}));

import { getReaderSession, sendReaderLink } from "../readerAuth";

describe("getReaderSession", () => {
  beforeEach(() => vi.clearAllMocks());

  // @req REQ-213
  it("returns the reader behind a session with a confirmed address", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "awa@example.org",
          email_confirmed_at: "2026-11-18T10:00:00.000Z",
        },
      },
      error: null,
    });

    await expect(getReaderSession()).resolves.toEqual({
      id: "user-1",
      email: "awa@example.org",
    });
  });

  // An account is only as good as the address that opened it: a session
  // whose address was never confirmed shows nobody's contributions.
  // @req REQ-213
  it("refuses a session whose address was never confirmed", async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "awa@example.org",
          email_confirmed_at: null,
        },
      },
      error: null,
    });

    await expect(getReaderSession()).resolves.toBeNull();
  });

  // @req REQ-213
  it("returns null without a session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getReaderSession()).resolves.toBeNull();
  });
});

describe("sendReaderLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ethniafrica.com");
    mocks.signInWithOtp.mockResolvedValue({ error: null });
  });

  afterEach(() => vi.unstubAllEnvs());

  // A sign-in never creates an account: only a confirmed comment does.
  // @req REQ-213
  it("asks for a sign-in link to an existing account only", async () => {
    await sendReaderLink("awa@example.org", "sign-in");

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "awa@example.org",
      options: {
        shouldCreateUser: false,
        emailRedirectTo:
          "https://ethniafrica.com/fr/compte/confirmer?raison=connexion",
      },
    });
  });

  // @req REQ-213
  it("asks for a publication link when a comment waits on the address", async () => {
    await sendReaderLink("awa@example.org", "publish");

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "awa@example.org",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://ethniafrica.com/fr/compte/confirmer",
      },
    });
  });

  // Whether Auth sent the mail or refused (no account, rate limit) must not
  // reach the page: that difference is how an address would be enumerated.
  // @req REQ-213
  it("swallows a refusal from Auth", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      error: { message: "Signups not allowed for otp" },
    });

    await expect(
      sendReaderLink("nobody@example.org", "sign-in")
    ).resolves.toBeUndefined();
  });
});
