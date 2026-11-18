import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/auth-server";
import { logger } from "@/lib/api/logger";
import { resolveSiteUrl } from "@/lib/siteUrl";

const DEFAULT_DESTINATION = "/fr/admin";
const MODERATOR_SIGN_IN_PATH = "/fr/admin/connexion";
const READER_SIGN_IN_PATH = "/fr/compte/connexion";

// A refused link goes back to the sign-in of the area it was heading for, so
// a reader is never shown the moderators' page.
function signInPathFor(destination: string): string {
  return /^\/fr\/compte(?=[/?#]|$)/.test(destination)
    ? READER_SIGN_IN_PATH
    : MODERATOR_SIGN_IN_PATH;
}

// Unroutable by construction (RFC 6761). Only its origin matters: anything
// that resolves elsewhere is leaving the site.
const DESTINATION_BASE = "https://callback.invalid";

/**
 * Where the callback is allowed to send someone.
 *
 * The parameter used to be followed as given, on the one route that has just
 * established a session — so `?redirect=https://evil.example` handed that
 * session's landing page to another origin. A prefix check on `//` came next
 * and still let `/\evil.example` through: browsers parse the backslash as a
 * slash, so the string a check reads and the URL a browser follows were two
 * different things.
 *
 * So the destination is resolved the way a browser resolves it, and what is
 * returned is the resolved path rather than the raw string. A resolved path
 * starting `//` is refused too, since joining it to the origin later would
 * make it protocol-relative again.
 */
function safeDestination(raw: string | null): string {
  if (!raw) return DEFAULT_DESTINATION;

  let resolved: URL;
  try {
    resolved = new URL(raw, DESTINATION_BASE);
  } catch {
    return DEFAULT_DESTINATION;
  }

  if (
    resolved.origin !== DESTINATION_BASE ||
    resolved.pathname.startsWith("//")
  ) {
    return DEFAULT_DESTINATION;
  }
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

/**
 * GET /api/auth/callback
 *
 * Completes a magic-link sign-in and sends the person where they were headed:
 * a moderator to the console, a reader to their account (REQ-213). The
 * reader's comment-confirmation link does not come through here — it is
 * redeemed by `/fr/compte/confirmer` on a button press. It no longer touches `contributor_profiles`: that upsert wrote the
 * user id into `id` while every reader queried `user_id`, so it created rows
 * nobody could find — and authorization now reads `admin_allowlist`, which
 * needs no row of its own.
 */
// @req REQ-042
// @req REQ-213
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Not `request.nextUrl.origin`: behind the production container that is the
  // server's bind address (`http://0.0.0.0:3000`), which no browser can open.
  const origin = resolveSiteUrl();
  const code = searchParams.get("code");
  const destination = safeDestination(searchParams.get("redirect"));

  function refuse(reason: string) {
    const errorUrl = new URL(signInPathFor(destination), origin);
    errorUrl.searchParams.set("error", reason);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) return refuse("Lien de connexion incomplet.");

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error("Failed to exchange an auth code for a session", error);
      return refuse("Ce lien de connexion n'est plus valide.");
    }

    return NextResponse.redirect(new URL(destination, origin));
  } catch (err) {
    logger.error("Auth callback error", err);
    return refuse("La connexion n'a pas abouti.");
  }
}
