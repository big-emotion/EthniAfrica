/**
 * @swagger
 * /api/v2/search/companions:
 *   get:
 *     summary: Resolve sourced companion content for search subjects
 *     description: >
 *       Returns shorts, anecdotes, attested proverbs, generated images and one
 *       playable quiz question for up to twenty typed subjects and their
 *       direct corpus neighbours. Ordering is stable: requested subjects first,
 *       then linked family, people and country targets; duplicate items are
 *       removed after their strongest match is chosen. With no subjects, only
 *       the recent-short fallback may be populated. Well-formed unknown ids are
 *       treated as an empty subject rather than guessed or rejected. Every item
 *       carries its own relation code; localised relation labels are not part of
 *       the API. Successful responses are cached for one hour.
 *     tags: [API v2 - Search]
 *     security:
 *       - BearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: subjects
 *         required: false
 *         schema:
 *           type: string
 *         description: >
 *           Comma-separated type:id values. Types are people, country,
 *           languageFamily, language and patronyme. At most 20 unique typed
 *           subjects are accepted; duplicates are removed in first-seen order.
 *         example: "people:PPL_BASSA,country:CMR"
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, fr]
 *           default: fr
 *         description: Content locale. Unknown values are rejected.
 *         example: fr
 *     responses:
 *       200:
 *         description: Bounded companion selections with item-level provenance
 *         headers:
 *           Cache-Control:
 *             description: Shared one-hour corpus cache
 *             schema:
 *               type: string
 *               example: s-maxage=3600
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchCompanionsResponse'
 *             examples:
 *               exact:
 *                 summary: One exact short
 *                 value:
 *                   data:
 *                     subjects: [{ entityType: country, entityId: NGA }]
 *                     shorts:
 *                       count: 1
 *                       items:
 *                         - id: short-nigeria
 *                           href: /fr/decouvertes/nigeria
 *                           name: Nigeria
 *                           description: Une production sourcée.
 *                           publishedAt: '2026-09-01'
 *                           durationSeconds: 47
 *                           watchUrl: https://www.youtube.com/watch?v=example
 *                           poster: { src: /posters/nigeria.jpg, alt: "Couverture : D’où vient le nom « Nigeria » ?", width: 270, height: 480 }
 *                           source: { title: Source, url: https://example.org/source, tier: referenced }
 *                           match: { relation: exact, entityType: country, entityId: NGA }
 *                     anecdotes: { count: 0, items: [] }
 *                     proverbs: { count: 0, items: [] }
 *                     images: { count: 0, items: [] }
 *                     quiz: { count: 0, item: null }
 *                   meta: { license: CC-BY-SA-4.0, attribution: EthniAfrica — ethniafrica.com }
 *                   errors: []
 *               widened:
 *                 summary: One ring-1 anecdote
 *                 value:
 *                   data:
 *                     subjects: [{ entityType: people, entityId: PPL_EKPEYE }]
 *                     shorts: { count: 0, items: [] }
 *                     anecdotes:
 *                       count: 1
 *                       items:
 *                         - id: nigeria-name
 *                           contentLanguage: fr
 *                           headline: Le nom du Nigeria vient du fleuve Niger.
 *                           body: [Le nom a été proposé à la fin du XIXe siècle.]
 *                           tier: referenced
 *                           sources: [{ title: Source, url: https://example.org/source, tier: referenced }]
 *                           illustration: { src: /images/nigeria.jpg, alt: Carte du Nigeria., credit: Domaine public }
 *                           match: { relation: linked-country, entityType: country, entityId: NGA }
 *                     proverbs: { count: 0, items: [] }
 *                     images: { count: 0, items: [] }
 *                     quiz: { count: 0, item: null }
 *                   meta: { license: CC-BY-SA-4.0, attribution: EthniAfrica — ethniafrica.com }
 *                   errors: []
 *               sparse:
 *                 summary: Known subject with no eligible companion
 *                 value:
 *                   data:
 *                     subjects: [{ entityType: patronyme, entityId: PAT_RARE }]
 *                     shorts: { count: 0, items: [] }
 *                     anecdotes: { count: 0, items: [] }
 *                     proverbs: { count: 0, items: [] }
 *                     images: { count: 0, items: [] }
 *                     quiz: { count: 0, item: null }
 *                   meta: { license: CC-BY-SA-4.0, attribution: EthniAfrica — ethniafrica.com }
 *                   errors: []
 *               empty:
 *                 summary: No resolved subject and no recent production
 *                 value:
 *                   data:
 *                     subjects: []
 *                     shorts: { count: 0, items: [] }
 *                     anecdotes: { count: 0, items: [] }
 *                     proverbs: { count: 0, items: [] }
 *                     images: { count: 0, items: [] }
 *                     quiz: { count: 0, item: null }
 *                   meta: { license: CC-BY-SA-4.0, attribution: EthniAfrica — ethniafrica.com }
 *                   errors: []
 *       400:
 *         description: Invalid subject syntax, subject count or locale
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       429:
 *         description: Rate limit exceeded
 *         headers:
 *           Retry-After:
 *             schema: { type: integer }
 *           X-RateLimit-Limit:
 *             schema: { type: integer }
 *           X-RateLimit-Remaining:
 *             schema: { type: integer }
 *           X-RateLimit-Reset:
 *             schema: { type: integer }
 *       500:
 *         description: Companion relation or quiz service failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 */

import { NextRequest } from "next/server";

import { getSearchCompanionsHandler } from "@/api/v2/handlers/searchCompanions";
import { searchCompanionsQuerySchema } from "@/api/v2/schemas/searchCompanions";
import { CORPUS_CACHE_CONTROL } from "@/api/v2/utils/corpusRoute";
import { createApiError } from "@/api/v2/utils/response";
import { corsOptionsResponse, jsonWithCors } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

// @req REQ-180
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const parsed = searchCompanionsQuerySchema.safeParse({
    subjects: request.nextUrl.searchParams.get("subjects") ?? undefined,
    lang: request.nextUrl.searchParams.get("lang") ?? undefined,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    logger.warn("Invalid query for GET /api/v2/search/companions", {
      issues: parsed.error.issues,
    });
    return jsonWithCors(
      createApiError({
        code: "VALIDATION_ERROR",
        message: issue?.message ?? "Invalid query parameters",
        field: issue?.path.join(".") || "subjects",
      }),
      { status: 400 }
    );
  }

  try {
    const envelope = await getSearchCompanionsHandler(parsed.data);
    logger.info("GET /api/v2/search/companions completed", {
      subjects: parsed.data.subjects.length,
      duration: Date.now() - startTime,
      status: 200,
    });
    return jsonWithCors(envelope, {
      headers: { "Cache-Control": CORPUS_CACHE_CONTROL },
    });
  } catch (error) {
    logger.error("Error in GET /api/v2/search/companions", error, {
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

// @req REQ-180
export function OPTIONS() {
  return corsOptionsResponse();
}
