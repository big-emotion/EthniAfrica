import { createHmac, timingSafeEqual } from "node:crypto";

import { logger } from "@/lib/api/logger";
import { graphConfigured, sendViaGraph } from "@/lib/email/graph";
import { buildSignInLinkEmail } from "@/lib/email/signInLink";
import type { Language } from "@/types/shared";

/**
 * POST /api/auth/send-email — Supabase Auth's send-email hook.
 *
 * Production Auth is self-hosted, and its SMTP settings were the stack's
 * placeholders: every sign-in link failed on a mail host that did not exist,
 * while the sign-in page kept giving its neutral answer. The atlas already
 * sends mail through Microsoft Graph (`@/lib/email/graph`), and Graph can send
 * as the shared `contact@` mailbox, which SMTP cannot log in to. So Auth hands
 * each mail to this route instead of speaking SMTP, and one transport serves
 * every mail the site sends.
 *
 * Only a request signed with `SEND_EMAIL_HOOK_SECRET` is served: the route
 * mails a sign-in link to whatever address the body names, which unsigned
 * would make it an open relay under the atlas's own sender.
 */

// Standard Webhooks' default tolerance: room for clock drift between the two
// hosts, too little to replay a captured request later.
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

// The mail kinds that carry a link. The console only ever asks for the first
// two; the others share the shape and cost nothing to keep working. A code-only
// or notification mail is refused rather than sent with a link it has no use for.
const LINK_ACTIONS = new Set(["magiclink", "signup", "invite", "recovery"]);

interface SendEmailHookPayload {
  user?: { email?: string };
  email_data?: {
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: string;
  };
}

// The error shape GoTrue reads back from a hook.
function hookFailure(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status });
}

function signingKey(secret: string | undefined): Buffer | null {
  const encoded = secret?.trim().replace(/^v1,whsec_/, "");
  return encoded ? Buffer.from(encoded, "base64") : null;
}

function isSignedByAuth(request: Request, body: string): boolean {
  const key = signingKey(process.env.SEND_EMAIL_HOOK_SECRET);
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatures = request.headers.get("webhook-signature");
  if (!key || !id || !timestamp || !signatures) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest();

  // During a secret rotation the header carries one space-separated
  // `v1,<signature>` per active key; any one of them matching is enough.
  return signatures.split(" ").some((entry) => {
    const [version, signature] = entry.split(",");
    if (version !== "v1" || !signature) return false;
    const presented = Buffer.from(signature, "base64");
    return (
      presented.length === expected.length &&
      timingSafeEqual(presented, expected)
    );
  });
}

// The hook carries no locale, but the callback it returns to names the
// console the sign-in was asked from.
function consoleLanguage(redirectTo: string): Language {
  try {
    const destination = new URL(redirectTo).searchParams.get("redirect") ?? "";
    return destination.startsWith("/en/") ? "en" : "fr";
  } catch {
    return "fr";
  }
}

// The link Auth would have written: its own verify endpoint, which redeems the
// token and sends the browser on to `redirect_to` with the PKCE code.
function verificationLink(
  tokenHash: string,
  action: string,
  redirectTo: string
): string {
  const link = new URL("/auth/v1/verify", process.env.NEXT_PUBLIC_SUPABASE_URL);
  link.search = new URLSearchParams({
    token: tokenHash,
    type: action,
    redirect_to: redirectTo,
  }).toString();
  return link.toString();
}

// @req REQ-042
export async function POST(request: Request) {
  const body = await request.text();

  if (!isSignedByAuth(request, body)) {
    logger.warn("Send-email hook refused: missing or invalid signature");
    return hookFailure(401, "Invalid or missing hook signature");
  }

  let payload: SendEmailHookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return hookFailure(400, "Invalid JSON body");
  }

  const to = payload.user?.email;
  const { token_hash, redirect_to, email_action_type } =
    payload.email_data ?? {};

  if (
    !to ||
    !token_hash ||
    !redirect_to ||
    !LINK_ACTIONS.has(email_action_type)
  ) {
    logger.warn("Send-email hook refused a mail the console never asks for", {
      action: email_action_type,
    });
    return hookFailure(400, `Unsupported email action: ${email_action_type}`);
  }

  if (!graphConfigured()) {
    logger.error("Sign-in mail not sent: Microsoft Graph is not configured");
    return hookFailure(503, "Mail transport is not configured");
  }

  const content = buildSignInLinkEmail(
    consoleLanguage(redirect_to),
    verificationLink(token_hash, email_action_type, redirect_to)
  );
  const sent = await sendViaGraph({
    to,
    subject: content.subject,
    text: content.text,
  });

  if (!sent) {
    return hookFailure(502, "Microsoft Graph did not accept the sign-in mail");
  }

  logger.info("Sign-in mail sent through Microsoft Graph", {
    action: email_action_type,
  });
  return Response.json({});
}
