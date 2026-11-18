import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sendReaderSignInLink: vi.fn() }));

vi.mock("@/lib/account/readerAuth", () => ({
  sendReaderSignInLink: mocks.sendReaderSignInLink,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import { requestReaderSignInLink } from "../actions";

function submit(email: string) {
  const form = new FormData();
  form.set("email", email);
  return requestReaderSignInLink(form);
}

describe("requestReaderSignInLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendReaderSignInLink.mockResolvedValue(undefined);
  });

  // @req REQ-213
  it("asks for a sign-in link and gives the neutral answer", async () => {
    await expect(submit(" awa@example.org ")).rejects.toThrow(
      "REDIRECT /fr/compte/connexion?etat=envoye"
    );
    expect(mocks.sendReaderSignInLink).toHaveBeenCalledWith("awa@example.org");
  });

  // An address with no account gets exactly the same answer: the form must
  // not tell a stranger which addresses have commented.
  // @req REQ-213
  it("gives the same answer when no account exists for the address", async () => {
    mocks.sendReaderSignInLink.mockResolvedValue(undefined);

    await expect(submit("nobody@example.org")).rejects.toThrow(
      "REDIRECT /fr/compte/connexion?etat=envoye"
    );
  });

  // @req REQ-213
  it("asks again for an address that cannot be one, without calling Auth", async () => {
    await expect(submit("awa")).rejects.toThrow(
      "REDIRECT /fr/compte/connexion?etat=adresse-invalide"
    );
    expect(mocks.sendReaderSignInLink).not.toHaveBeenCalled();
  });
});
