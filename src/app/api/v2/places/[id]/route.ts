/**
 * API v2 - Single place endpoint
 * GET /api/v2/places/[id]
 *
 * @swagger
 * /api/v2/places/{id}:
 *   get:
 *     summary: Get a place by identifier
 *     description: >
 *       One place fiche (REQ-196): every name it answers to, its shared
 *       nameHistory block (ARCH-028), its country and the peoples the fiche
 *       associates with it, with the fiche's gaps and sources.
 *     tags: [API v2 - Places]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^LOC_[A-Z0-9_]+$'
 *         example: "LOC_YAMOUSSOUKRO"
 *     responses:
 *       200:
 *         description: Place detail envelope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaceDetailEnvelope'
 *       400:
 *         description: Invalid place identifier format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       404:
 *         description: Place not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 */

import { getPlaceHandler } from "@/api/v2/handlers/places";
import {
  CORPUS_CACHE_CONTROL,
  corpusDetailRoute,
} from "@/api/v2/utils/corpusRoute";
import { corsOptionsResponse } from "@/lib/api/cors";

const PLACE_ID = /^LOC_[A-Z0-9_]+$/;

// @req REQ-196
export const GET = corpusDetailRoute({
  path: "/api/v2/places/[id]",
  param: "id",
  isValidId: (id) => PLACE_ID.test(id),
  invalidIdMessage: "Invalid place ID format",
  cacheControl: CORPUS_CACHE_CONTROL,
  rejectedLog: "Place request rejected",
  resolve: (id) => getPlaceHandler(id),
});

// @req REQ-196
export function OPTIONS() {
  return corsOptionsResponse();
}
