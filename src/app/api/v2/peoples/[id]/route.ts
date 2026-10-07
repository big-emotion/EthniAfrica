/**
 * API v2 - Single People endpoint
 * GET /api/v2/peoples/[id]
 *
 * @swagger
 * /api/v2/peoples/{id}:
 *   get:
 *     summary: Détails d'un peuple
 *     description: >
 *       Retourne les détails complets d'un peuple par son identifiant PPL_*,
 *       et le bloc `patronymes` — les noms que porte ce peuple. À ne pas
 *       confondre avec `/peoples/{id}/names`, qui porte les ethnonymes : ce que
 *       le peuple est *appelé*, et non ce que ses membres *portent*.
 *     tags: [API v2 - Peoples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^PPL_[A-Z_]+$'
 *         description: Identifiant du peuple (format PPL_*)
 *         example: "PPL_SHONA"
 *     responses:
 *       200:
 *         description: Détails du peuple
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PeopleDetailEnvelope'
 *       400:
 *         description: Format d'identifiant invalide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       404:
 *         description: Peuple non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorEnvelope'
 */

import { getPeopleHandler } from "@/api/v2/handlers/peoples";
import { corpusDetailRoute, orNotFound } from "@/api/v2/utils/corpusRoute";
import { validatePeopleId } from "@/api/v2/utils/validation";
import { corsOptionsResponse } from "@/lib/api/cors";

// @req REQ-084
export const GET = corpusDetailRoute({
  path: "/api/v2/peoples/[id]",
  param: "id",
  isValidId: validatePeopleId,
  invalidIdMessage: "Invalid people ID format",
  rejectedLog: "People not found",
  resolve: async (id) =>
    orNotFound(await getPeopleHandler(id), "People not found"),
});

// @req REQ-084
export function OPTIONS() {
  return corsOptionsResponse();
}
