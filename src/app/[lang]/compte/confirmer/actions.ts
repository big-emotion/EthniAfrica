"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { publishPendingFlagsForEmail } from "@/api/v2/services/comments";
import { logger } from "@/lib/api/logger";
import { getStaticPageRoute } from "@/lib/routing";
import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

// GoTrue mails `signup` to an address it has never confirmed (a first
// comment) and `magiclink` to one it has (a later comment, a sign-in).
// `email` is what supabase-js recommends for both and redeems either.
const READER_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "magiclink",
  "email",
]);

function isReaderOtpType(type: string): type is EmailOtpType {
  return READER_OTP_TYPES.has(type as EmailOtpType);
}

const ACCOUNT = getStaticPageRoute("fr", "account");
const EXPIRED_LINK = `${ACCOUNT}/connexion?etat=lien-expire`;

/**
 * The button on `/fr/compte/confirmer` (REQ-213, DEC-085).
 *
 * The token is redeemed here, on a POST the reader makes by pressing the
 * button — never on the page's GET, which mail scanners make on their own.
 * `verifyOtp` on the cookie client sets the session; the address it returns
 * is the one Auth just proved the reader holds, and it alone decides which
 * pending comments are published.
 */
// @req REQ-213
export async function confirmReaderLink(formData: FormData): Promise<void> {
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!tokenHash || !isReaderOtpType(type)) redirect(EXPIRED_LINK);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  const user = data?.user;

  if (error || !user?.email || !user.email_confirmed_at) {
    redirect(EXPIRED_LINK);
  }

  try {
    await publishPendingFlagsForEmail(user.email, user.id);
  } catch (publishError) {
    // The reader is signed in either way; their comments still read as
    // waiting on the account page, which offers to send the link again.
    logger.error(
      "Failed to publish a reader's confirmed comments",
      publishError
    );
  }

  redirect(ACCOUNT);
}
