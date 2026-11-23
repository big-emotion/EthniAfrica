/**
 * @swagger
 * /api/v2/comments/{id}/report:
 *   post:
 *     summary: Report a comment that should not be there
 *     description: >-
 *       Anonymous, guarded by a proof of work and a rate limit. The caller is
 *       counted by a keyed hash of their address, never the address itself.
 *       Three reports from distinct addresses hide the comment until a
 *       moderator reviews it. The answer does not say whether this report
 *       hid it.
 *     tags: [API v2 - Comments]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 9c81ca0d-ae45-4f08-8f53-2ac0a9673abd
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentReportInput'
 *     responses:
 *       201:
 *         description: Report recorded (a repeat from the same address counts once).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentReportResponse'
 *       400:
 *         description: Invalid body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       403:
 *         description: Anti-bot verification failed.
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
 *         description: Report rate limit exceeded.
 *         headers:
 *           Retry-After:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       503:
 *         description: Anti-bot verification is temporarily unavailable.
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

import { handleAbuseReport } from "@/api/v2/handlers/comments";
import { createApiError } from "@/api/v2/utils/response";
import { clientIp } from "@/lib/api/clientIp";
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
    const result = await handleAbuseReport({ flagId: id }, body, {
      clientIp: clientIp(request) ?? undefined,
    });
    return jsonWithCors(result.body, {
      status: result.status,
      headers: { ...result.headers, ...NO_STORE_HEADERS },
    });
  } catch (error) {
    logger.error("Error in POST /api/v2/comments/[id]/report", error);
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
