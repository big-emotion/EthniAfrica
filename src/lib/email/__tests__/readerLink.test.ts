import { describe, expect, it } from "vitest";

import { buildReaderLinkEmail } from "../readerLink";

const LINK =
  "https://ethniafrica.com/fr/compte/confirmer?token_hash=abc&type=signup";

describe("buildReaderLinkEmail", () => {
  // @req REQ-213
  it("asks a commenter to open the link and press the publish button", () => {
    const mail = buildReaderLinkEmail(LINK, "publish");

    expect(mail.subject).toBe("Publiez votre commentaire sur EthniAfrica");
    expect(mail.text).toContain(LINK);
    expect(mail.text).toContain("« Publier mon commentaire »");
    expect(mail.text).not.toMatch(/modération/i);
  });

  // @req REQ-213
  it("names the account button when the reader only asked to sign in", () => {
    const mail = buildReaderLinkEmail(LINK, "sign-in");

    expect(mail.subject).toBe(
      "Votre lien pour ouvrir votre compte EthniAfrica"
    );
    expect(mail.text).toContain("« Ouvrir mon compte »");
    expect(mail.text).toContain(LINK);
  });
});
