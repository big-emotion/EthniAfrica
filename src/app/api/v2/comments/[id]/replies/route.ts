/**
 * @swagger
 * /api/v2/comments/{id}/replies:
 *   post:
 *     summary: Reply to a published comment
 *     description: >-
 *       One level of replies. Reserved to a signed-in reader, whose session
 *       travels as the cookies the confirmation page set — not as a bearer,
 *       which this API reads as a key. The reply is published at once and
 *       counts against the same write budget as the reader's comments.
 *     tags: [API v2 - Comments]
 *     security:
 *       - ReaderSessionCookie: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 9c81ca0d-ae45-4f08-8f53-2ac0a9673abd
 *         description: Id of the comment (a flag) being answered.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentReplyCreateInput'
 *     responses:
 *       201:
 *         description: Reply published.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentReplyResponse'
 *       400:
 *         description: Invalid body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       401:
 *         description: No signed-in reader.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       404:
 *         description: No published, visible comment with this id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       429:
 *         description: Write budget exhausted.
 *         headers:
 *           Retry-After:
 *             schema:
 *               type: integer
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

import { handleReplyCreate } from "@/api/v2/handlers/comments";
import { createApiError } from "@/api/v2/utils/response";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

// @req REQ-212
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonWithCors(
      createApiError({
        code: "VALIDATION_ERROR",
        message: "Request body must be valid JSON",
      }),
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { id } = await params;
    const result = await handleReplyCreate(id, body);
    return jsonWithCors(result.body, {
      status: result.status,
      headers: { ...result.headers, ...NO_STORE_HEADERS },
    });
  } catch (error) {
    logger.error("Error in POST /api/v2/comments/[id]/replies", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

// @req REQ-212
export function OPTIONS() {
  return corsOptionsResponse();
}
