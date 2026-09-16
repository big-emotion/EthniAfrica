/**
 * API v2 — Provenance census
 * GET /api/v2/confidence/[entityType]/[entityId]/census
 *
 * A sub-resource of the confidence record rather than an endpoint of its own,
 * because it reads the same fabric and answers the neighbouring question: not
 * "how strong is this fiche" but "what is it made of". It takes its own entity
 * vocabulary all the same — countries and languages carry assertions without
 * carrying a confidence row, and their ISO identifiers do not match the
 * `PPL_`/`FLG_` prefixes the parent route enforces.
 *
 * @swagger
 * /api/v2/confidence/{entityType}/{entityId}/census:
 *   get:
 *     summary: Count a fiche's assertions by the standing of their sources
 *     description: Returns the per-standing census the provenance banner states. Never an aggregate score.
 *     tags:
 *       - "API v2 - Source Transparency"
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [people, country, language, language-family]
 *         example: country
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         example: CIV
 *     responses:
 *       200:
 *         description: Provenance census envelope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProvenanceCensusResponse'
 *       400:
 *         description: Invalid params
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 */

import { NextRequest } from "next/server";
import { getProvenanceCensusHandler } from "@/api/v2/handlers/confidence";
import { provenanceCensusParamsSchema } from "@/api/v2/schemas/confidence";
import { createApiError } from "@/api/v2/utils/response";
import { jsonWithCors, corsOptionsResponse } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

// @req REQ-084
export async function GET(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ entityType: string; entityId: string }>;
  }
) {
  const startTime = Date.now();
  const { entityType, entityId } = await params;

  try {
    const parsed = provenanceCensusParamsSchema.safeParse({
      entityType,
      entityId,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      logger.warn("Invalid params for GET /api/v2/confidence census", {
        entityType,
        entityId,
        issues: parsed.error.issues,
      });
      return jsonWithCors(
        createApiError({
          code: "VALIDATION_ERROR",
          message: issue?.message ?? "Invalid provenance census params",
          field: issue?.path?.join(".") ?? undefined,
        }),
        { status: 400 }
      );
    }

    const envelope = await getProvenanceCensusHandler(
      parsed.data.entityType,
      parsed.data.entityId
    );

    logger.info("GET /api/v2/confidence census completed", {
      ...parsed.data,
      duration: Date.now() - startTime,
      status: 200,
    });
    // A fiche the fabric records nothing about is served as an empty census,
    // not as a 404: "this fiche rests on nothing recorded" is an answer the
    // reader is owed, and a missing row is not a missing fiche.
    return jsonWithCors(envelope);
  } catch (error) {
    logger.error(
      `Error in GET /api/v2/confidence/${entityType}/${entityId}/census`,
      error,
      { entityType, entityId, duration: Date.now() - startTime }
    );
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
}

// @req REQ-084
export function OPTIONS() {
  return corsOptionsResponse();
}
