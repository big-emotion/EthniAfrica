import type { EmailContentEn } from "@/lib/email/flagNotification.en";

/**
 * The moderation sign-in mail in English — the sidecar of `signInLink.ts`
 * (REQ-145), chosen when the sign-in was asked for from the English console.
 * Agent-authored under DEC-048, hence `machine`.
 */
// @req REQ-042
export function buildSignInLinkEmailEn(link: string): EmailContentEn {
  return {
    subject: "Your EthniAfrica moderation sign-in link",
    text: [
      "Here is the link to open the EthniAfrica moderation console:",
      link,
      "It works once and is only valid for a short time. Open it in the browser where you asked to sign in.",
      "If you did not ask for it, ignore this message: without this link, nobody can sign in with your address.",
      "EthniAfrica — Atlas of the Peoples of Africa",
    ].join("\n\n"),
    provenance: "machine",
  };
}
