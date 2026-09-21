/**
 * @swagger
 * /api/v2/admin/source-tier-rulings:
 *   post:
 *     summary: Record a moderator's decision on a citation awaiting review
 *     description: >-
 *       Records a draft ruling on one corpus citation still marked
 *       `needs_review`, named by its exact title and url. A draft publishes
 *       nothing: the fiche keeps its standing until the draft is pulled into
 *       the git ruling ledger (docs/editorial/source-review/source-tier-rulings.json)
 *       and applied to the fiches. `tier` states official, referenced or
 *       unverified — never needs_review — and is required for `tier` and
 *       `repair`, absent for `remove`; `repaired_url` belongs to a repair
 *       only. Requires a bearer session token whose address is on the
 *       moderation allowlist; every recorded draft writes an audit_log entry.
 *     tags:
 *       - "API v2 - Source Transparency"
 *     security:
 *       - SupabaseJwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fiche_path, source_title, source_url, decision, rationale]
 *             properties:
 *               fiche_path:
 *                 type: string
 *                 example: pays/BEN.json
 *               source_title:
 *                 type: string
 *                 example: ONU – World Population Prospects 2025
 *               source_url:
 *                 type: [string, "null"]
 *               decision:
 *                 type: string
 *                 enum: [tier, repair, remove]
 *               tier:
 *                 type: [string, "null"]
 *                 enum: [official, referenced, unverified, null]
 *               repaired_url:
 *                 type: [string, "null"]
 *                 format: uri
 *               rationale:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: The recorded draft.
 *       400:
 *         description: The decision is malformed — no rationale, a missing or forbidden tier, a repair with no corrected address.
 *       401:
 *         description: No bearer session token.
 *       403:
 *         description: The token's address is not on the moderation allowlist.
 *       500:
 *         description: Internal error.
 */

import { NextRequest } from "next/server";

import { handleSourceTierRulingDraftCreate } from "@/api/v2/handlers/sourceTierRulings";
import { createApiError } from "@/api/v2/utils/response";
import { clientIp } from "@/lib/api/clientIp";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function getAccessToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  return authorization?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

// @req REQ-042
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const result = await handleSourceTierRulingDraftCreate(body, {
      accessToken: getAccessToken(request),
      clientIp: clientIp(request) ?? undefined,
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    logger.error("Error in POST /api/v2/admin/source-tier-rulings", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// @req REQ-042
export function OPTIONS() {
  return corsOptionsResponse();
}
