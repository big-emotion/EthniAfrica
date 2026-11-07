/**
 * @swagger
 * /api/v2/mcp:
 *   post:
 *     summary: Public agent (Model Context Protocol, read-only)
 *     description: >
 *       A stateless Model Context Protocol server over the corpus. Each POST
 *       carries one JSON-RPC 2.0 message and gets one JSON answer; there is
 *       no session and no event stream. Two read-only tools: `rechercher_nom`
 *       (search a name) and `lire_fiche` (read one fiche); and, when
 *       enabled, `proposer_nom`, which files a proposal for human review. Answers are in
 *       French and follow one frame: in brief, where the name comes from,
 *       what the sources say, language, meaning and reason, other names,
 *       common beliefs, what is not known, and where to read further. A
 *       source is named by its type, never by its tier. Metered like every
 *       /api/v2 route.
 */
import type { NextRequest } from "next/server";

import {
  handlePublicAgentMessage,
  JSON_RPC_ERRORS,
} from "@/api/v2/handlers/publicAgent";
import {
  applyCorsHeaders,
  corsOptionsResponse,
  jsonWithCors,
} from "@/lib/api/cors";
import { logger } from "@/lib/api/logger";

// Every answer reads the corpus at request time.
// @req REQ-002
export const dynamic = "force-dynamic";

// @req REQ-002
export async function POST(request: NextRequest) {
  let message: unknown;
  try {
    message = await request.json();
  } catch {
    return jsonWithCors(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: JSON_RPC_ERRORS.parse, message: "Parse error" },
      },
      { status: 400 }
    );
  }

  try {
    const answer = await handlePublicAgentMessage(message, {
      // Set by the proxy from a validated key; it strips any client-sent copy.
      apiKeyId: request.headers.get("x-api-key-id"),
    });
    if (answer === null) {
      return applyCorsHeaders(new Response(null, { status: 202 }));
    }
    return jsonWithCors(answer, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    logger.error("Error in POST /api/v2/mcp", error);
    return jsonWithCors(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message: "Internal error" },
      },
      { status: 500 }
    );
  }
}

// @req REQ-002
export function OPTIONS() {
  return corsOptionsResponse();
}
