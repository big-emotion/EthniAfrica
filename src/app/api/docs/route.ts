import { jsonWithCors, corsOptionsResponse } from "@/lib/api/cors";

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Documentation OpenAPI/Swagger (déprécié)
 *     description: Cette route est dépréciée. Utilisez /api/docs/v2
 *     tags: [Documentation]
 *     responses:
 *       301:
 *         description: Renvoi vers la documentation v2
 */
// @req REQ-099
export async function GET() {
  return jsonWithCors(
    {
      message:
        "This route is deprecated. Use /api/docs/v2 for the v2 (AFRIK) API.",
      links: {
        v2: "/api/docs/v2",
      },
    },
    { status: 301 }
  );
}

// @req REQ-099
export function OPTIONS() {
  return corsOptionsResponse();
}
