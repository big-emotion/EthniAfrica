"use server";

import { redirect } from "next/navigation";

import { eraseReaderAccount } from "@/api/v2/services/account";
import { getReaderSession, sendReaderLink } from "@/lib/account/readerAuth";
import { getStaticPageRoute } from "@/lib/routing";
import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

const ACCOUNT = getStaticPageRoute("fr", "account");
const SIGN_IN = `${ACCOUNT}/connexion`;

// @req REQ-213
export async function signOutReader(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect(`${SIGN_IN}?etat=deconnecte`);
}

/**
 * Delete the signed-in reader's account. The account is read from the
 * session, never from the form, so a reader can only ever delete their own.
 */
// @req REQ-213
export async function deleteReaderAccount(): Promise<void> {
  const reader = await getReaderSession();
  if (!reader) redirect(SIGN_IN);

  await eraseReaderAccount(reader.id);

  // The user is gone on the server; `local` only clears this browser's
  // cookies instead of asking Auth to revoke a session it no longer has.
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${SIGN_IN}?etat=supprime`);
}

// @req REQ-213
export async function resendReaderLink(): Promise<void> {
  const reader = await getReaderSession();
  if (!reader) redirect(SIGN_IN);

  await sendReaderLink(reader.email, "publish");
  redirect(`${ACCOUNT}?lien=envoye`);
}
