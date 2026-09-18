import { emailSignature } from "@/lib/email/signature";
import { buildSignInLinkEmailEn } from "@/lib/email/signInLink.en";
import type { Language } from "@/types/shared";

export interface SignInLinkEmail {
  subject: string;
  text: string;
}

/**
 * The moderation console's sign-in mail.
 *
 * Supabase Auth used to write this one itself, from its own template, and on
 * the self-hosted stack it never left the machine. It is written here now
 * because the send-email hook hands Auth's mail to Microsoft Graph, and a hook
 * replaces the template along with the transport.
 *
 * It says to open the link in the browser that asked: the sign-in is PKCE, so
 * the code the link brings back is only redeemable next to the verifier cookie
 * that browser holds. Opened anywhere else it fails, and nothing on the page
 * that follows explains why.
 */
// @req REQ-042
export function buildSignInLinkEmail(
  language: Language,
  link: string
): SignInLinkEmail {
  if (language === "en") return buildSignInLinkEmailEn(link);

  return {
    subject: "Votre lien de connexion à la modération EthniAfrica",
    text: [
      "Voici le lien pour ouvrir la console de modération d'EthniAfrica :",
      link,
      "Il ne sert qu'une fois et n'est valable que peu de temps. Ouvrez-le dans le navigateur où vous avez demandé la connexion.",
      "Si vous n'avez rien demandé, ignorez ce message : sans ce lien, personne ne peut se connecter avec votre adresse.",
      emailSignature("fr"),
    ].join("\n\n"),
  };
}
