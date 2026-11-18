import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReaderSession: vi.fn(),
  sendReaderLink: vi.fn(),
  eraseReaderAccount: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/account/readerAuth", () => ({
  getReaderSession: mocks.getReaderSession,
  sendReaderLink: mocks.sendReaderLink,
}));

vi.mock("@/api/v2/services/account", () => ({
  eraseReaderAccount: mocks.eraseReaderAccount,
}));

vi.mock("@/lib/supabase/auth-server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ auth: { signOut: mocks.signOut } })
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import {
  deleteReaderAccount,
  resendReaderLink,
  signOutReader,
} from "../actions";

const READER = { id: "user-1", email: "awa@example.org" };

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReaderSession.mockResolvedValue(READER);
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.eraseReaderAccount.mockResolvedValue(undefined);
  });

  // @req REQ-213
  it("signs the reader out", async () => {
    await expect(signOutReader()).rejects.toThrow(
      "REDIRECT /fr/compte/connexion?etat=deconnecte"
    );
    expect(mocks.signOut).toHaveBeenCalled();
  });

  // @req REQ-213
  it("deletes the reader's own account, then ends the session", async () => {
    await expect(deleteReaderAccount()).rejects.toThrow(
      "REDIRECT /fr/compte/connexion?etat=supprime"
    );
    expect(mocks.eraseReaderAccount).toHaveBeenCalledWith("user-1");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  // @req REQ-213
  it("deletes nothing without a reader session", async () => {
    mocks.getReaderSession.mockResolvedValue(null);

    await expect(deleteReaderAccount()).rejects.toThrow(
      "REDIRECT /fr/compte/connexion"
    );
    expect(mocks.eraseReaderAccount).not.toHaveBeenCalled();
  });

  // A pending comment written signed-out, in another browser, waits on the
  // same address; the account sends that address a fresh publication link.
  // @req REQ-213
  it("sends a fresh publication link to the reader's own address", async () => {
    await expect(resendReaderLink()).rejects.toThrow(
      "REDIRECT /fr/compte?lien=envoye"
    );
    expect(mocks.sendReaderLink).toHaveBeenCalledWith(
      "awa@example.org",
      "publish"
    );
  });
});
