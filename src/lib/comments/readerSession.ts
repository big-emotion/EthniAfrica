import { createServerSupabaseClient } from "@/lib/supabase/auth-server";

/**
 * The signed-in reader behind a comment request, read from the session
 * cookies that the confirmation page sets (ETNI-2201).
 *
 * Cookies, not an `Authorization: Bearer` header: on /api/v2 the middleware
 * reads any bearer as an API key, and the routes exempted from that
 * (`sessionAuthenticatedRoutes.ts`) are moderator routes, each held to the
 * allowlist. A reader route sends no bearer, so it is metered like any
 * keyless call and needs no exemption.
 *
 * The cookies cannot be sent by another site: Supabase sets them
 * `SameSite=Lax`, which a cross-site fetch or form POST does not carry, and
 * the API's CORS headers never allow credentials.
 *
 * Any failure reads as "nobody signed in": a comment is then stored
 * privately and a reply refused, which is the safe side of both.
 */
// @req REQ-212
export async function getReaderSession(): Promise<{ id: string } | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { id: user.id };
  } catch {
    return null;
  }
}
