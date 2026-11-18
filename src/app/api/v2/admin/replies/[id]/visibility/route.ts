/**
 * @swagger
 * /api/v2/admin/replies/{id}/visibility:
 *   put:
 *     summary: Hide or restore a reply under a block comment
 *     description: >-
 *       Hides a reply from the public, text kept, or restores it. A reply has
 *       no reason column, so `reason` is ignored. Restoring also clears the
 *       reader reports against the reply. Requires a bearer session token
 *       whose address is on the moderation allowlist; every change writes an
 *       audit_log entry.
 *     tags:
 *       - "API v2 - Flags"
 *     security:
 *       - SupabaseJwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: bbbbbbbb-0000-4000-8000-000000000001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hidden]
 *             properties:
 *               hidden:
 *                 type: boolean
 *               reason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: The visibility now in force.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data]
 *               properties:
 *                 data:
 *                   type: object
 *                   required: [hidden]
 *                   properties:
 *                     hidden:
 *                       type: boolean
 *       400:
 *         description: The request is malformed.
 *       401:
 *         description: No bearer session token.
 *       403:
 *         description: The token's address is not on the moderation allowlist.
 *       404:
 *         description: No such reply.
 *       500:
 *         description: Internal error.
 */

import { NextRequest } from "next/server";

import { handleCommentVisibility } from "@/api/v2/handlers/commentModeration";
import { createApiError } from "@/api/v2/utils/response";
import { clientIp } from "@/lib/api/clientIp";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function getAccessToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  return authorization?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

// @req REQ-214
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const result = await handleCommentVisibility({ replyId: id }, body, {
      accessToken: getAccessToken(request),
      clientIp: clientIp(request) ?? undefined,
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    logger.error("Error in PUT /api/v2/admin/replies/{id}/visibility", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// @req REQ-214
export function OPTIONS() {
  return corsOptionsResponse();
}
