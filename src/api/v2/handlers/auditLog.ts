/**
 * GET /v2/flags/{id}/audit — the recorded trail of one report.
 *
 * The handler is the only authorisation there is: `audit_log` is read on the
 * service-role client, and the table's own RLS policy still points at the
 * retired `user_roles` model, so nothing below this function decides anything
 * about the caller. It distinguishes "no token" (401) from "a token that is
 * not a moderator" (403) because the console reacts differently to them: the
 * first is a lapsed session to renew.
 *
 * It is a separate route from `/v2/flags/{id}` on purpose. That one serves the
 * public register and answers to anybody; this one answers to the allowlist,
 * and merging them would put the two audiences behind one decision.
 */

import {
  getFlagAuditTrail,
  type FlagAuditTrail,
} from "@/api/v2/services/auditLog";
import { getModeratorByAccessToken } from "@/api/v2/services/flags";
import {
  createApiError,
  createApiResponse,
  type ApiEnvelope,
} from "@/api/v2/utils/response";

interface FlagAuditTrailDependencies {
  getModeratorByAccessToken: (
    accessToken: string
  ) => Promise<{ id: string } | null>;
  getFlagAuditTrail: (identifier: string) => Promise<FlagAuditTrail | null>;
}

const defaultDependencies: FlagAuditTrailDependencies = {
  getModeratorByAccessToken,
  getFlagAuditTrail,
};

// @req REQ-041
export async function handleFlagAuditTrailRead(
  identifier: string,
  context: { accessToken: string | null },
  injectedDependencies: Partial<FlagAuditTrailDependencies> = {}
): Promise<{
  status: number;
  body: ApiEnvelope<FlagAuditTrail> | ApiEnvelope<null>;
}> {
  const dependencies = { ...defaultDependencies, ...injectedDependencies };
  const accessToken = context.accessToken?.trim();

  if (!accessToken) {
    return {
      status: 401,
      body: createApiError({
        code: "UNAUTHENTICATED",
        message: "A moderator session token is required",
      }),
    };
  }

  const moderator = await dependencies.getModeratorByAccessToken(accessToken);
  if (!moderator) {
    return {
      status: 403,
      body: createApiError({
        code: "UNAUTHORIZED",
        message: "Moderator allowlist membership required",
      }),
    };
  }

  const trail = await dependencies.getFlagAuditTrail(identifier);
  if (!trail) {
    return {
      status: 404,
      body: createApiError({ code: "NOT_FOUND", message: "Flag not found" }),
    };
  }

  return { status: 200, body: createApiResponse(trail) };
}
