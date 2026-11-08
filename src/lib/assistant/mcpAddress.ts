import { resolveSiteUrl } from "@/lib/siteUrl";

// @req REQ-045
/** Where the read-only MCP server answers, under the public API's prefix. */
export const MCP_ROUTE = "/api/v2/mcp";

/**
 * The address a reader pastes into Claude or ChatGPT.
 *
 * Built from the configured site origin rather than written out, so a
 * recette deployment hands out its own address instead of production's.
 */
// @req REQ-045
export function getMcpAddress(): string {
  return `${resolveSiteUrl().replace(/\/+$/, "")}${MCP_ROUTE}`;
}
