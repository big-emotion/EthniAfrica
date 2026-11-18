import { emailSignature } from "@/lib/email/signature";
import { accountCopy } from "@/lib/i18n/copy/account";

import type { SignInLinkEmail } from "./signInLink";

/** Why the reader is being sent a link: a comment to publish, or a sign-in. */
export type ReaderLinkIntent = "publish" | "sign-in";

/**
 * The mail a reader receives after commenting, or after asking to sign back
 * in (REQ-213).
 *
 * Separate from the moderation console's mail because it says something else
 * and links somewhere else: to the atlas's own confirmation page, which waits
 * for a button press, never to Auth's verify endpoint, which would sign in
 * — and, here, publish — on the first GET a mail scanner makes.
 *
 * Unlike the console's PKCE link, this one may be opened in any browser: the
 * page redeems the token hash server-side, with no verifier cookie involved.
 */
// @req REQ-213
export function buildReaderLinkEmail(
  link: string,
  intent: ReaderLinkIntent
): SignInLinkEmail {
  const copy = accountCopy.fr.email;
  const signIn = intent === "sign-in";
  return {
    subject: signIn ? copy.signInSubject : copy.subject,
    text: [
      signIn ? copy.signInIntro : copy.intro,
      link,
      copy.validity,
      copy.ignore,
      emailSignature(),
    ].join("\n\n"),
  };
}
