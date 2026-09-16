/**
 * @swagger
 * /api/v2/flags/{public_slug_or_id}/audit:
 *   get:
 *     summary: Read the recorded audit trail of one report
 *     description: >-
 *       Returns every recorded transition of one report, oldest first, for the
 *       moderation console's case file. Each entry names the **role** that
 *       acted and the level it was authorised at — never the person, their id
 *       or their address: a register has to establish that a decision was
 *       taken and at what level of authorisation, and nothing more. Requires a
 *       bearer session token whose address is on the moderation allowlist; a
 *       signed-in reader is refused. See docs/design/moderation-charter.md §4.
 *     tags: [API v2 - Flags]
 *     security:
 *       - SupabaseJwtAuth: []
 *     parameters:
 *       - in: path
 *         name: public_slug_or_id
 *         required: true
 *         schema:
 *           type: string
 *         example: 00EZK83QDV
 *         description: Flag UUID or public slug.
 *     responses:
 *       200:
 *         description: The recorded trail.
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: no-store
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FlagAuditTrailResponse'
 *       401:
 *         description: No bearer session token.
 *       403:
 *         description: The token's address is not on the moderation allowlist.
 *       404:
 *         description: No report carries this identifier.
 *       500:
 *         description: Internal error.
 */

import { NextRequest } from "next/server";

import { handleFlagAuditTrailRead } from "@/api/v2/handlers/auditLog";
import { createApiError } from "@/api/v2/utils/response";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

// A register is read to decide, never from a cache of unknown age.
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function getAccessToken(request: NextRequest): string | null {
  return (
    request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ??
    null
  );
}

// @req REQ-041
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await handleFlagAuditTrailRead(id, {
      accessToken: getAccessToken(request),
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    logger.error("Error in GET /api/v2/flags/[id]/audit", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// @req REQ-041
export function OPTIONS() {
  return corsOptionsResponse();
}
