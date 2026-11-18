import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getReaderSession: vi.fn(),
  eraseReaderAccount: vi.fn(),
  publishPendingFlagForEmail: vi.fn(),
  disownPendingFlag: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/account/readerAuth", () => ({
  getReaderSession: mocks.getReaderSession,
}));

vi.mock("@/api/v2/services/account", () => ({
  eraseReaderAccount: mocks.eraseReaderAccount,
}));

vi.mock("@/api/v2/services/comments", () => ({
  publishPendingFlagForEmail: mocks.publishPendingFlagForEmail,
  disownPendingFlag: mocks.disownPendingFlag,
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
  disownPendingComment,
  publishPendingComment,
  signOutReader,
} from "../actions";

const READER = { id: "user-1", email: "awa@example.org" };

function withComment(slug: string) {
  const form = new FormData();
  form.set("commentaire", slug);
  return form;
}

describe("account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getReaderSession.mockResolvedValue(READER);
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.eraseReaderAccount.mockResolvedValue(undefined);
    mocks.publishPendingFlagForEmail.mockResolvedValue({ published: true });
    mocks.disownPendingFlag.mockResolvedValue({ disowned: true });
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

  // The session's address is the proof: a signed-in reader publishes a
  // waiting comment that carries it, and only that one.
  // @req REQ-213
  it("publishes one waiting comment with the session's own address", async () => {
    await expect(
      publishPendingComment(withComment("K7M2Q9X4AB"))
    ).rejects.toThrow("REDIRECT /fr/compte?etat=publie");
    expect(mocks.publishPendingFlagForEmail).toHaveBeenCalledWith(
      "K7M2Q9X4AB",
      "awa@example.org",
      "user-1"
    );
  });

  // @req REQ-213
  it("unlinks a waiting comment the reader did not write", async () => {
    await expect(
      disownPendingComment(withComment("K7M2Q9X4AB"))
    ).rejects.toThrow("REDIRECT /fr/compte?etat=pas-moi");
    expect(mocks.disownPendingFlag).toHaveBeenCalledWith(
      "K7M2Q9X4AB",
      "awa@example.org"
    );
  });

  // @req REQ-213
  it.each([
    ["publishes", publishPendingComment],
    ["unlinks", disownPendingComment],
  ])("%s nothing without a reader session", async (_label, action) => {
    mocks.getReaderSession.mockResolvedValue(null);

    await expect(action(withComment("K7M2Q9X4AB"))).rejects.toThrow(
      "REDIRECT /fr/compte/connexion"
    );
    expect(mocks.publishPendingFlagForEmail).not.toHaveBeenCalled();
    expect(mocks.disownPendingFlag).not.toHaveBeenCalled();
  });
});
