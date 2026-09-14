"use server";

import { logger } from "@/lib/api/logger";
import { isEmailAllowlisted } from "@/lib/auth/adminAllowlist";
import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

/**
 * Whether the current visitor may use the reference library on /contribute.
 *
 * A server action reading the cookie session rather than a probe of
 * `/api/v2/reference-library` with a bearer token: the middleware treats any
 * bearer on `/api/v2/*` outside `/api/v2/keys` as an API key, so a session
 * token sent there is refused as an invalid key before any route could say
 * who the caller is.
 *
 * The answer only decides what the page shows. The write endpoints check the
 * same allowlist themselves, so a visitor who forces the tool open gets a 403.
 */
// @req REQ-042
export async function hasReferenceLibraryAccess(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return false;
    return await isEmailAllowlisted(user.email);
  } catch (error) {
    logger.error("Failed to read the session for the reference library", error);
    return false;
  }
}
