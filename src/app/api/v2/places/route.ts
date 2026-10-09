/**
 * API v2 - Places list endpoint
 * GET /api/v2/places
 *
 * @swagger
 * /api/v2/places:
 *   get:
 *     summary: List places (LOC_*)
 *     description: >
 *       One page of the place fiches (towns, regions, historic sites), ordered
 *       by name (REQ-196). Each row is a summary; the place's names and
 *       nameHistory are served by `/api/v2/places/{id}`.
 *     tags: [API v2 - Places]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated place summaries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaceListEnvelope'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 */

import { NextRequest } from "next/server";

import { listPlacesHandler } from "@/api/v2/handlers/places";
import { CORPUS_CACHE_CONTROL } from "@/api/v2/utils/corpusRoute";
import { createApiError } from "@/api/v2/utils/response";
import { validatePage, validatePerPage } from "@/api/v2/utils/validation";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

// @req REQ-196
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = validatePage(searchParams.get("page"));
    const perPage = validatePerPage(searchParams.get("perPage"));

    logger.info("GET /api/v2/places", { page, perPage });
    const response = jsonWithCors(await listPlacesHandler(page, perPage), {
      headers: { "Cache-Control": CORPUS_CACHE_CONTROL },
    });
    logger.info("GET /api/v2/places completed", {
      page,
      perPage,
      duration: Date.now() - startTime,
      status: 200,
    });
    return response;
  } catch (error) {
    logger.error("Error in GET /api/v2/places", error, {
      duration: Date.now() - startTime,
    });
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500 }
    );
  }
}

// @req REQ-196
export function OPTIONS() {
  return corsOptionsResponse();
}
