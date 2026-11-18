import { logger } from "@/lib/api/logger";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whether an address may open the moderation console.
 *
 * This is the whole authorization model for the admin. There is no role column
 * to read and no profile to provision first, which is the point: authorization
 * attaches to something that exists before anyone signs in, and an address is
 * the only such thing. It matters more now that readers hold accounts too
 * (REQ-213): any reader can have a valid session, so a session proves who
 * someone is and never what they may do — every moderator gate asks this list.
 *
 * It replaces `contributor_profiles.moderator_role`, which could only be set
 * on a row created by a successful sign-in — and the sign-in wrote that row on
 * the wrong column, so the role was unreachable and nobody ever held one.
 *
 * Read on the service-role client on purpose: the table carries RLS with no
 * policy at all. Who may moderate is not public information.
 */
// @req REQ-042
export async function isEmailAllowlisted(
  email: string | null | undefined
): Promise<boolean> {
  // admin_allowlist.email is CITEXT, so the comparison is already
  // case-insensitive in Postgres; lowering here keeps it so if the column or
  // the lookup ever changes.
  const address = email?.trim().toLowerCase();
  if (!address) return false;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_allowlist")
    .select("email")
    .eq("email", address)
    .maybeSingle();

  if (error) {
    // An allowlist that cannot be read is not an empty allowlist. Refusing
    // everyone locks the moderators out for as long as the outage lasts;
    // admitting everyone hands the console to whoever asks.
    logger.error("Failed to read the admin allowlist", error);
    return false;
  }

  return Boolean(data);
}

/** The two fields of a GoTrue user that decide whether it is a moderator. */
export interface SessionAddress {
  email?: string | null;
  email_confirmed_at?: string | null;
}

/**
 * Whether a signed-in user is a moderator: a confirmed address on the
 * allowlist.
 *
 * GoTrue sign-up is open (the moderator magic link needs it to create the
 * user), so anyone can hold a session carrying any address they typed. The
 * address only becomes theirs once the confirmation link has been followed.
 */
// @req REQ-042
export async function isConfirmedAllowlistedUser(
  user: SessionAddress | null | undefined
): Promise<boolean> {
  if (!user?.email_confirmed_at) return false;
  return isEmailAllowlisted(user.email);
}
