/**
 * @swagger
 * /api/v2/comments:
 *   get:
 *     summary: Read the published comments of a page's blocks
 *     description: >-
 *       One call per page: for each requested block, the number of visible
 *       comments, the published and visible threads with their visible
 *       replies, and the date the information on that block was last
 *       corrected. Unknown keys are dropped. Never returns an e-mail address,
 *       an account id or a field path. Cached for a minute by shared caches.
 *     tags: [API v2 - Comments]
 *     security:
 *       - BearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: block_keys
 *         required: true
 *         schema:
 *           type: string
 *         example: people:PPL_YORUBA:naming,people:PPL_YORUBA:origin
 *         description: Comma-separated block keys, 1 to 30.
 *     responses:
 *       200:
 *         description: Comments per block, in the order requested.
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: public, s-maxage=60, stale-while-revalidate=300
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentListResponse'
 *       400:
 *         description: No block key, or more than 30.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 */

import { NextRequest } from "next/server";

import { handleCommentList } from "@/api/v2/handlers/comments";
import { createApiError } from "@/api/v2/utils/response";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

// @req REQ-212
export async function GET(request: NextRequest) {
  try {
    const result = await handleCommentList({
      block_keys: request.nextUrl.searchParams.get("block_keys") ?? undefined,
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: result.headers,
    });
  } catch (error) {
    logger.error("Error in GET /api/v2/comments", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// @req REQ-212
export function OPTIONS() {
  return corsOptionsResponse();
}
