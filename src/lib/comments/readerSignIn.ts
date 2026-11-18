import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/api/logger";
import { resolveSiteUrl } from "@/lib/siteUrl";

/**
 * Where the e-mailed link lands. That page shows one button; its server
 * action verifies the link and publishes the reader's pending comments
 * (ETNI-2201). Confirmation is a POST behind that button so a mail scanner
 * prefetching the link publishes nothing.
 */
const CONFIRMATION_PATH = "/fr/compte/confirmer";

/**
 * E-mail a reader the link that confirms their address and opens their
 * account (REQ-212).
 *
 * `shouldCreateUser` is true: the account is what a confirmed address buys,
 * so the first comment is also the sign-up. The client is a bare anon client
 * with no session storage: this runs inside the comment request, and the
 * person who will follow the link is not signed in by asking for it.
 *
 * Answers false rather than throwing. The comment is committed by the time
 * this runs; a lost link is a reader who can ask again, a failed request is a
 * reader who files the same comment twice.
 */
// @req REQ-212
export async function sendReaderSignInLink(email: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${resolveSiteUrl()}${CONFIRMATION_PATH}`,
      },
    });
    if (error) {
      logger.error("Failed to send a reader sign-in link", error);
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Failed to send a reader sign-in link", error);
    return false;
  }
}
