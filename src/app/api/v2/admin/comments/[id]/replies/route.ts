/**
 * @swagger
 * /api/v2/admin/comments/{id}/replies:
 *   post:
 *     summary: Reply to a block comment as the moderation
 *     description: >-
 *       Adds a reply under a comment (a flag), signed « Modération
 *       EthniAfrica » wherever it is shown. The moderator may answer a
 *       comment that is not public yet; the reply shows once the comment is.
 *       Requires a bearer session token whose address is on the moderation
 *       allowlist; every reply writes an audit_log entry.
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
 *         example: aaaaaaaa-0000-4000-8000-000000000001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: The recorded reply.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data]
 *               properties:
 *                 data:
 *                   type: object
 *                   required: [id, body, is_moderation, created_at]
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     body:
 *                       type: string
 *                     display_name:
 *                       type: [string, "null"]
 *                     is_moderation:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: The reply is empty or too long.
 *       401:
 *         description: No bearer session token.
 *       403:
 *         description: The token's address is not on the moderation allowlist.
 *       404:
 *         description: No such comment.
 *       500:
 *         description: Internal error.
 */

import { NextRequest } from "next/server";

import { handleModeratorReply } from "@/api/v2/handlers/commentModeration";
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const result = await handleModeratorReply(id, body, {
      accessToken: getAccessToken(request),
      clientIp: clientIp(request) ?? undefined,
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    logger.error("Error in POST /api/v2/admin/comments/{id}/replies", error);
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
