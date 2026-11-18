import type { FlagSubmissionPayload } from "@/components/flags/FlagForm";

/**
 * Sending a report, from wherever it was written.
 *
 * Several surfaces write one: the dialog a fiche's reading rail opens, the
 * "Signaler une erreur" page and the comment sheet of the result page. They
 * differ in everything a reader can see and in nothing that happens after the
 * send button, so the send lives here rather than being copied.
 *
 * It deliberately does not toast, track, or close anything: those belong to
 * the surface, which is the only thing that knows whether it has a dialog to
 * close or a confirmation panel to swap in.
 *
 * No bearer travels with it. The proxy reads a bearer on `/api/v2` as an API
 * key, so a session token sent that way was refused as an invalid key; the
 * API reads a signed-in reader from the site's own cookies, which a
 * same-origin request carries without being asked (REQ-212).
 */
// @req REQ-012
// @req REQ-212
export async function submitFlag(
  payload: FlagSubmissionPayload
): Promise<{ public_slug: string }> {
  const response = await fetch("/api/v2/flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.errors?.[0]?.message ?? "flag submission failed");
  }

  return { public_slug: json.data.public_slug as string };
}
