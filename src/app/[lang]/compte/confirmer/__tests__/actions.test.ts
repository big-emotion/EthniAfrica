import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  publishPendingFlagForEmail: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ auth: { verifyOtp: mocks.verifyOtp } })
  ),
}));

vi.mock("@/api/v2/services/comments", () => ({
  publishPendingFlagForEmail: mocks.publishPendingFlagForEmail,
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

const ACCOUNT = /^REDIRECT \/fr\/compte$/;
const EXPIRED = "REDIRECT /fr/compte/connexion?etat=lien-expire";

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
    mocks.publishPendingFlagForEmail.mockResolvedValue({ published: true });
  });

  // @req REQ-213
  it("redeems the link, publishes the one comment it names and opens the account", async () => {
    await expect(
      press({
        token_hash: "pkce_abc",
        type: "signup",
        commentaire: "K7M2Q9X4AB",
      })
    ).rejects.toThrow(ACCOUNT);

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "pkce_abc",
      type: "signup",
    });
    expect(mocks.publishPendingFlagForEmail).toHaveBeenCalledWith(
      "K7M2Q9X4AB",
      "awa@example.org",
      "user-1"
    );
  });

  // A sign-in link names no comment; it opens the account and publishes
  // nothing, whatever waits on the address.
  // @req REQ-213
  it("publishes nothing when the link names no comment", async () => {
    await expect(
      press({ token_hash: "pkce_abc", type: "magiclink" })
    ).rejects.toThrow(ACCOUNT);

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "pkce_abc",
      type: "magiclink",
    });
    expect(mocks.publishPendingFlagForEmail).not.toHaveBeenCalled();
  });

  // @req REQ-213
  it("publishes nothing and asks for a new link when the token is spent", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" },
    });

    await expect(
      press({
        token_hash: "pkce_old",
        type: "signup",
        commentaire: "K7M2Q9X4AB",
      })
    ).rejects.toThrow(EXPIRED);
    expect(mocks.publishPendingFlagForEmail).not.toHaveBeenCalled();
  });

  // @req REQ-213
  it("publishes nothing for an address Auth has not confirmed", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { ...READER, email_confirmed_at: null }, session: {} },
      error: null,
    });

    await expect(
      press({
        token_hash: "pkce_abc",
        type: "signup",
        commentaire: "K7M2Q9X4AB",
      })
    ).rejects.toThrow(EXPIRED);
    expect(mocks.publishPendingFlagForEmail).not.toHaveBeenCalled();
  });

  // A recovery or invite token is not what the reader mail carries; one
  // pasted into this form is refused before Auth is asked.
  // @req REQ-213
  it.each(["recovery", "invite", "", "email_change"])(
    "refuses the action type %j without calling Auth",
    async (type) => {
      await expect(press({ token_hash: "pkce_abc", type })).rejects.toThrow(
        EXPIRED
      );
      expect(mocks.verifyOtp).not.toHaveBeenCalled();
    }
  );

  // @req REQ-213
  it("refuses a press with no token", async () => {
    await expect(press({ type: "signup" })).rejects.toThrow(EXPIRED);
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  // The reader is signed in by now; the comment still reads as waiting on
  // the account page, which offers to publish it.
  // @req REQ-213
  it("still opens the account when publishing fails", async () => {
    mocks.publishPendingFlagForEmail.mockRejectedValue(new Error("db down"));

    await expect(
      press({
        token_hash: "pkce_abc",
        type: "signup",
        commentaire: "K7M2Q9X4AB",
      })
    ).rejects.toThrow(ACCOUNT);
    expect(mocks.loggerError).toHaveBeenCalled();
  });
});
