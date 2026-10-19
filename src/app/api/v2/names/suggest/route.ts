/** Prefix suggestions for names that resolve to an answer page. */
// @req REQ-200
import { z } from "zod";
import { nameSuggestionsHandler } from "@/api/v2/handlers/nameSuggestions";
import { CORPUS_CACHE_CONTROL } from "@/api/v2/utils/corpusRoute";
import { createApiError } from "@/api/v2/utils/response";
import { jsonWithCors, corsOptionsResponse } from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

const querySchema = z.object({
  q: z.string().trim().min(2).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
// @req REQ-200
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    q: params.get("q") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonWithCors(
      createApiError({
        code: "VALIDATION_ERROR",
        message: issue?.message ?? "Invalid query parameters",
        field: issue?.path?.join(".") ?? undefined,
      }),
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    return jsonWithCors(
      await nameSuggestionsHandler(parsed.data.q, parsed.data.limit),
      { headers: { "Cache-Control": CORPUS_CACHE_CONTROL } }
    );
  } catch (error) {
    logger.error("GET /api/v2/names/suggest failed", error);
    return jsonWithCors(
      createApiError({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      }),
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

// @req REQ-200
export function OPTIONS() {
  return corsOptionsResponse();
}
