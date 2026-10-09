/**
 * API v2 - Single word endpoint
 * GET /api/v2/words/[id]
 *
 * @swagger
 * /api/v2/words/{id}:
 *   get:
 *     summary: Get a word by identifier
 *     description: >
 *       One word fiche (REQ-196): every name it answers to, its shared
 *       nameHistory block (ARCH-028), its definition, the subjects the fiche
 *       ties to it, with the fiche's gaps and sources.
 *     tags: [API v2 - Words]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^WRD_[A-Z0-9_]+$'
 *         example: "WRD_RACE"
 *     responses:
 *       200:
 *         description: Word detail envelope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WordDetailEnvelope'
 *       400:
 *         description: Invalid word identifier format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       404:
 *         description: Word not found
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

import { getWordHandler } from "@/api/v2/handlers/words";
import {
  CORPUS_CACHE_CONTROL,
  corpusDetailRoute,
} from "@/api/v2/utils/corpusRoute";
import { corsOptionsResponse } from "@/lib/api/cors";

const WORD_ID = /^WRD_[A-Z0-9_]+$/;

// @req REQ-196
export const GET = corpusDetailRoute({
  path: "/api/v2/words/[id]",
  param: "id",
  isValidId: (id) => WORD_ID.test(id),
  invalidIdMessage: "Invalid word ID format",
  cacheControl: CORPUS_CACHE_CONTROL,
  rejectedLog: "Word request rejected",
  resolve: (id) => getWordHandler(id),
});

// @req REQ-196
export function OPTIONS() {
  return corsOptionsResponse();
}
