import type { ReaderLinkIntent } from "@/lib/email/readerLink";
import { resolveSiteUrl } from "@/lib/siteUrl";
import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

/**
 * The reader account's session (REQ-213).
 *
 * A reader session is an ordinary Supabase session and grants nothing
 * outside `/fr/compte`: every moderator gate checks `admin_allowlist`
 * (`src/lib/auth/adminAllowlist.ts`), never the mere presence of a session.
 */

export interface ReaderSession {
  id: string;
  email: string;
}

/** Where the reader's mail sends them; the send-email hook keys on this path. */
const READER_CONFIRMATION_PATH = "/fr/compte/confirmer";

/**
 * The signed-in reader, or null. A session whose address was never confirmed
 * counts as none: the account lists what that address published, and an
 * unconfirmed address has not shown it belongs to whoever holds the session.
 */
// @req REQ-213
export async function getReaderSession(): Promise<ReaderSession | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email || !user.email_confirmed_at) return null;
  return { id: user.id, email: user.email };
}

/**
 * Mail a reader the link to `/fr/compte/confirmer`.
 *
 * Never creates an account: a reader account is opened by a confirmed
 * comment (POST /api/v2/flags), not by a sign-in form. Auth's answer is not
 * returned — whether an account exists for the address must not be
 * observable from the page that asked.
 */
// @req REQ-213
export async function sendReaderLink(
  email: string,
  intent: ReaderLinkIntent
): Promise<void> {
  const destination = new URL(READER_CONFIRMATION_PATH, resolveSiteUrl());
  if (intent === "sign-in") destination.searchParams.set("raison", "connexion");

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: destination.toString(),
    },
  });
}
