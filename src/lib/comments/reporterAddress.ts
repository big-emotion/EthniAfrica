import { createHmac } from "node:crypto";

/**
 * The identity a reader report counts under: the caller's address, keyed.
 *
 * Three reports from distinct addresses hide a comment (migration 117), so
 * the address must be comparable — but it is personal data and must not be
 * stored. An unkeyed digest would not do: IPv4 has four billion values, and
 * hashing them all is an afternoon. An HMAC under a server secret cannot be
 * reversed without the secret.
 *
 * The secret is `ANTIBOT_HMAC_SECRET`, under its own label so the two uses
 * never produce the same MAC. A dedicated variable would protect nothing
 * more: a leak of that secret already lets anyone mint anti-bot challenges,
 * and every report route verifies a proof before it ever hashes an address,
 * so the deployment that can hash is exactly the one that holds the secret.
 */
const LABEL = "flag-abuse-report";

// @req REQ-212
export function hashReporterAddress(address: string | undefined): string {
  const secret = process.env.ANTIBOT_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      "ANTIBOT_HMAC_SECRET is not set: reader reports cannot be counted without a server secret"
    );
  }
  return createHmac("sha256", secret)
    .update(`${LABEL}:${address ?? "unknown"}`)
    .digest("hex");
}
