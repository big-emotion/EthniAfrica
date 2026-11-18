import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  publishPendingFlagsForEmail: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ auth: { verifyOtp: mocks.verifyOtp } })
  ),
}));

vi.mock("@/api/v2/services/comments", () => ({
  publishPendingFlagsForEmail: mocks.publishPendingFlagsForEmail,
}));

vi.mock("@/lib/api/logger", () => ({
  logger: { error: mocks.loggerError },
}));

// `redirect()` ends a server action by throwing; the stand-in throws the
// destination so a test can read where the reader was sent.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import { confirmReaderLink } from "../actions";

const READER = {
  id: "user-1",
  email: "awa@example.org",
  email_confirmed_at: "2026-11-18T10:00:00.000Z",
};

function press(fields: Record<string, string>) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.set(name, value);
  return confirmReaderLink(form);
}

describe("confirmReaderLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyOtp.mockResolvedValue({
      data: { user: READER, session: {} },
      error: null,
    });
    mocks.publishPendingFlagsForEmail.mockResolvedValue({ published: 1 });
  });

  // @req REQ-213
  it("redeems the link, publishes the reader's pending comments and opens the account", async () => {
    await expect(
      press({ token_hash: "pkce_abc", type: "signup" })
    ).rejects.toThrow(/^REDIRECT \/fr\/compte$/);

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "pkce_abc",
      type: "signup",
    });
    expect(mocks.publishPendingFlagsForEmail).toHaveBeenCalledWith(
      "awa@example.org",
      "user-1"
    );
  });

  // @req REQ-213
  it("accepts the magiclink action of an address already confirmed", async () => {
    await expect(
      press({ token_hash: "pkce_abc", type: "magiclink" })
    ).rejects.toThrow(/^REDIRECT \/fr\/compte$/);

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "pkce_abc",
      type: "magiclink",
    });
  });

  // @req REQ-213
  it("publishes nothing and asks for a new link when the token is spent", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" },
    });

    await expect(
      press({ token_hash: "pkce_old", type: "signup" })
    ).rejects.toThrow("REDIRECT /fr/compte/connexion?etat=lien-expire");
    expect(mocks.publishPendingFlagsForEmail).not.toHaveBeenCalled();
  });

  // @req REQ-213
  it("publishes nothing for an address Auth has not confirmed", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { ...READER, email_confirmed_at: null }, session: {} },
      error: null,
    });

    await expect(
      press({ token_hash: "pkce_abc", type: "signup" })
    ).rejects.toThrow("REDIRECT /fr/compte/connexion?etat=lien-expire");
    expect(mocks.publishPendingFlagsForEmail).not.toHaveBeenCalled();
  });

  // A recovery or invite token is not what the reader mail carries; one
  // pasted into this form is refused before Auth is asked.
  // @req REQ-213
  it.each(["recovery", "invite", "", "email_change"])(
    "refuses the action type %j without calling Auth",
    async (type) => {
      await expect(press({ token_hash: "pkce_abc", type })).rejects.toThrow(
        "REDIRECT /fr/compte/connexion?etat=lien-expire"
      );
      expect(mocks.verifyOtp).not.toHaveBeenCalled();
    }
  );

  // @req REQ-213
  it("refuses a press with no token", async () => {
    await expect(press({ type: "signup" })).rejects.toThrow(
      "REDIRECT /fr/compte/connexion?etat=lien-expire"
    );
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  // The reader is signed in by now; their comments still read as waiting on
  // the account page, which offers to send the link again.
  // @req REQ-213
  it("still opens the account when publishing fails", async () => {
    mocks.publishPendingFlagsForEmail.mockRejectedValue(new Error("db down"));

    await expect(
      press({ token_hash: "pkce_abc", type: "signup" })
    ).rejects.toThrow(/^REDIRECT \/fr\/compte$/);
    expect(mocks.loggerError).toHaveBeenCalled();
  });
});
