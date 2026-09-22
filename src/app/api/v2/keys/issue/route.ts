/**
 * @swagger
 * /api/v2/keys/issue:
 *   post:
 *     summary: Issue a public read-only API key
 *     description: |
 *       Issues a shared, IP-bound, read-only public API key.
 *       One key per IP address — returns 409 if a key already exists for this IP.
 *       The address is the one the reverse proxy observed, never a value the
 *       caller supplies in X-Forwarded-For.
 *       Attempts are limited per address (5 an hour), separately from the
 *       anonymous per-minute quota.
 *       Public keys are rate-limited and can only perform read operations.
 *       Partner and admin keys must be requested via the admin UI.
 *       No authentication required for this endpoint. POST only: a GET that
 *       creates a key can be triggered by a crawler, a link preview or a
 *       cross-site request, so the former GET alias was removed.
 *     tags:
 *       - API v2 - Keys
 *     security: []
 *     responses:
 *       201:
 *         description: Public key issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyIssueEnvelope'
 *       400:
 *         description: The client address could not be determined
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       409:
 *         description: A public key already exists for this IP address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       429:
 *         description: Too many issuance attempts from this address
 *       500:
 *         description: Failed to issue key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       503:
 *         description: The attempt counter is unavailable; retry shortly
 */
import { NextRequest } from "next/server";
import { handlePublicKeyIssue } from "@/api/v2/handlers/keys";
import { createApiError } from "@/api/v2/utils/response";
import { clientIp } from "@/lib/api/clientIp";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";
import { applyKeyIssuanceRateLimit } from "@/lib/api/rate-limit";

// The response carries a raw key; no cache may keep a copy of it.
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

// @req REQ-034
export async function POST(request: NextRequest) {
  try {
    const rejection = await applyKeyIssuanceRateLimit(request);
    if (rejection) return rejection;

    const result = await handlePublicKeyIssue({
      clientIp: clientIp(request),
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    logger.error("Error in POST /api/v2/keys/issue", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Failed to issue API key",
      }),
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// @req REQ-084
export function OPTIONS() {
  return corsOptionsResponse();
}
