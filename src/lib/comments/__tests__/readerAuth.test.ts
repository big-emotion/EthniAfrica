import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithOtp: vi.fn(),
  getUser: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithOtp: mocks.signInWithOtp } }),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: mocks.loggerError, warn: vi.fn() },
}));

import { getReaderSession } from "@/lib/comments/readerSession";
import { sendReaderSignInLink } from "@/lib/comments/readerSignIn";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://atlas.example.org");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example.org");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
});

describe("sendReaderSignInLink", () => {
  /**
   * The link creates the account on first use and lands on the reader's
   * confirmation page, whose button publishes the comments (ETNI-2201).
   */
  // @req REQ-212
  it("asks Supabase for a link that creates the account and lands on the confirmation page", async () => {
    mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    await expect(
      sendReaderSignInLink("lectrice@example.org", "flag-7kq3 m2")
    ).resolves.toBe(true);

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "lectrice@example.org",
      options: {
        shouldCreateUser: true,
        // The link publishes only the comment it was issued for: someone
        // typing another person's address must not get a comment published
        // under that person's account when they confirm their own.
        emailRedirectTo:
          "https://atlas.example.org/fr/compte/confirmer?commentaire=flag-7kq3%20m2",
      },
    });
  });

  // @req REQ-212
  it("answers false, without throwing, when Supabase refuses", async () => {
    mocks.signInWithOtp.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });

    await expect(
      sendReaderSignInLink("lectrice@example.org", "flag-7kq3m2")
    ).resolves.toBe(false);
    expect(mocks.loggerError).toHaveBeenCalled();
  });
});

describe("getReaderSession", () => {
  // @req REQ-212
  it("names the signed-in reader from the session cookies", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "reader-1", email: "lectrice@example.org" } },
      error: null,
    });

    await expect(getReaderSession()).resolves.toEqual({ id: "reader-1" });
  });

  // @req REQ-212
  it("answers null when no session resolves", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: mocks.getUser },
    });
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Auth session missing!" },
    });

    await expect(getReaderSession()).resolves.toBeNull();
  });

  // Outside a request (a script, a test) there are no cookies to read.
  // @req REQ-212
  it("answers null when the cookies cannot be read at all", async () => {
    mocks.createServerSupabaseClient.mockRejectedValue(
      new Error("cookies was called outside a request scope")
    );

    await expect(getReaderSession()).resolves.toBeNull();
  });
});
