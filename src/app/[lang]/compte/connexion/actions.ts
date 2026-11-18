"use server";

import { redirect } from "next/navigation";

import { sendReaderSignInLink } from "@/lib/account/readerAuth";
import { getStaticPageRoute } from "@/lib/routing";

/** Deliberately loose: Auth is the real check. */
const LOOKS_LIKE_AN_ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIGN_IN = `${getStaticPageRoute("fr", "account")}/connexion`;

/**
 * The reader sign-in form (REQ-213).
 *
 * It only ever reaches an existing account (`shouldCreateUser: false` in
 * `sendReaderSignInLink`): an account is opened by a confirmed comment. And it
 * answers the same whether or not an account exists, so it cannot be used to
 * learn who has commented.
 */
// @req REQ-213
export async function requestReaderSignInLink(
  formData: FormData
): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  if (!LOOKS_LIKE_AN_ADDRESS.test(email)) {
    redirect(`${SIGN_IN}?etat=adresse-invalide`);
  }

  await sendReaderSignInLink(email);
  redirect(`${SIGN_IN}?etat=envoye`);
}
