/**
 * POST /v2/admin/source-tier-rulings — a moderator records a decision on one
 * citation awaiting review.
 *
 * The handler is the only authorization there is: the table has RLS with no
 * policy and the insert travels on the service-role client, so nothing below
 * this function asks again who the caller is. It distinguishes "no token"
 * (401) from "a token that is not a moderator" (403) because the console
 * reacts differently to them: the first is a lapsed session to renew.
 */

import type { z } from "zod";

import { sourceTierRulingDraftSchema } from "@/api/v2/schemas/sourceTierRulings";
import { getModeratorByAccessToken } from "@/api/v2/services/flags";
import {
  insertSourceTierRulingDraft,
  type SourceTierRulingDraft,
} from "@/api/v2/services/sourceTierRulings";
import {
  createApiError,
  createApiResponse,
  type ApiEnvelope,
} from "@/api/v2/utils/response";
import { auditLog, type AuditLogInput } from "@/lib/audit/log";

interface SourceTierRulingDependencies {
  getModeratorByAccessToken: (
    accessToken: string
  ) => Promise<{ id: string } | null>;
  insertSourceTierRulingDraft: typeof insertSourceTierRulingDraft;
  writeAuditLog: (input: AuditLogInput) => Promise<void>;
}

const defaultDependencies: SourceTierRulingDependencies = {
  getModeratorByAccessToken,
  insertSourceTierRulingDraft,
  writeAuditLog: (input) => auditLog.write(input),
};

function validationError(issues: z.core.$ZodIssue[]): ApiEnvelope<null> {
  return createApiError(
    issues.map((issue) => ({
      code: "VALIDATION_ERROR" as const,
      message: issue.message,
      field: issue.path.join(".") || undefined,
    }))
  );
}

// @req REQ-042
export async function handleSourceTierRulingDraftCreate(
  rawInput: unknown,
  context: { accessToken: string | null; clientIp?: string },
  injectedDependencies: Partial<SourceTierRulingDependencies> = {}
): Promise<{
  status: number;
  body: ApiEnvelope<SourceTierRulingDraft> | ApiEnvelope<null>;
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

  const parsed = sourceTierRulingDraftSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: 400, body: validationError(parsed.error.issues) };
  }

  const draft = await dependencies.insertSourceTierRulingDraft(
    parsed.data,
    moderator.id
  );

  await dependencies.writeAuditLog({
    actorId: moderator.id,
    action: "source_tier_ruling.draft",
    targetType: "source_tier_ruling_draft",
    targetId: draft.id,
    after: draft,
    ip: context.clientIp ?? null,
  });

  return { status: 201, body: createApiResponse(draft) };
}
