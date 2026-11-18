/**
 * The moderator's actions on a block comment thread (REQ-214):
 *   POST /v2/admin/comments/{id}/replies    — reply as « Modération EthniAfrica »
 *   PUT  /v2/admin/comments/{id}/visibility — hide or restore a comment
 *   PUT  /v2/admin/replies/{id}/visibility  — hide or restore a reply
 *
 * These handlers are the only authorization there is: `flag_replies` and
 * `flag_abuse_reports` have RLS and no policy, and the writes travel on the
 * service-role client. As in `sourceTierRulings.ts`, no token is a 401 (a
 * lapsed session to renew) and a token off the allowlist a 403 — readers hold
 * sessions too, so a session alone never authorizes anything here.
 *
 * Status moves are not here: they stay on `PATCH /v2/flags/{id}`, which also
 * sends the resolution e-mail, so the inbox and the flat list share one path.
 */

import { z } from "zod";

import {
  addReply,
  hideComment,
  unhideComment,
  type AddReplyResult,
  type CommentReply,
  type CommentTarget,
} from "@/api/v2/services/comments";
import { getModeratorByAccessToken } from "@/api/v2/services/flags";
import {
  createApiError,
  createApiResponse,
  type ApiEnvelope,
} from "@/api/v2/utils/response";
import { auditLog, type AuditLogInput } from "@/lib/audit/log";

interface CommentModerationDependencies {
  getModeratorByAccessToken: (
    accessToken: string
  ) => Promise<{ id: string } | null>;
  addReply: (input: {
    flagId: string;
    authorId: string | null;
    body: string;
    isModeration?: boolean;
  }) => Promise<AddReplyResult>;
  hideComment: (target: CommentTarget, reason: string) => Promise<boolean>;
  unhideComment: (target: CommentTarget) => Promise<boolean>;
  writeAuditLog: (input: AuditLogInput) => Promise<void>;
}

const defaultDependencies: CommentModerationDependencies = {
  getModeratorByAccessToken,
  addReply,
  hideComment,
  unhideComment,
  writeAuditLog: (input) => auditLog.write(input),
};

interface ModerationContext {
  accessToken: string | null;
  clientIp?: string;
}

type HandlerResult<T> = {
  status: number;
  body: ApiEnvelope<T> | ApiEnvelope<null>;
};

const moderatorReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

const visibilitySchema = z.object({
  hidden: z.boolean(),
  reason: z.string().trim().min(1).max(500).optional(),
});

/** `hidden_reason` for a reply has no column; the audit entry still says who. */
const REPLY_HIDE_REASON = "moderator";

const notFound = (): HandlerResult<never> => ({
  status: 404,
  body: createApiError({ code: "NOT_FOUND", message: "Comment not found" }),
});

function validationError(issues: z.core.$ZodIssue[]): ApiEnvelope<null> {
  return createApiError(
    issues.map((issue) => ({
      code: "VALIDATION_ERROR" as const,
      message: issue.message,
      field: issue.path.join(".") || undefined,
    }))
  );
}

async function authorize(
  context: ModerationContext,
  dependencies: CommentModerationDependencies
): Promise<{ moderatorId: string } | { refusal: HandlerResult<never> }> {
  const accessToken = context.accessToken?.trim();
  if (!accessToken) {
    return {
      refusal: {
        status: 401,
        body: createApiError({
          code: "UNAUTHENTICATED",
          message: "A moderator session token is required",
        }),
      },
    };
  }
  const moderator = await dependencies.getModeratorByAccessToken(accessToken);
  if (!moderator) {
    return {
      refusal: {
        status: 403,
        body: createApiError({
          code: "UNAUTHORIZED",
          message: "Moderator allowlist membership required",
        }),
      },
    };
  }
  return { moderatorId: moderator.id };
}

// An id that is not a uuid names no row; asking Postgres would only turn it
// into a cast error and a 500.
const isUuid = (id: string) => z.uuid().safeParse(id).success;

// @req REQ-214
export async function handleModeratorReply(
  flagId: string,
  rawInput: unknown,
  context: ModerationContext,
  injectedDependencies: Partial<CommentModerationDependencies> = {}
): Promise<HandlerResult<CommentReply>> {
  const dependencies = { ...defaultDependencies, ...injectedDependencies };
  const access = await authorize(context, dependencies);
  // `in`, not a boolean discriminant: strictNullChecks is off and would not
  // narrow the union.
  if ("refusal" in access) return access.refusal;

  const parsed = moderatorReplySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: 400, body: validationError(parsed.error.issues) };
  }
  if (!isUuid(flagId)) return notFound();

  // The signature « Modération EthniAfrica » comes from `is_moderation` at
  // display time; the author column keeps which moderator wrote it.
  const result = await dependencies.addReply({
    flagId,
    authorId: access.moderatorId,
    body: parsed.data.body,
    isModeration: true,
  });
  if ("reason" in result) {
    return result.reason === "not_found"
      ? notFound()
      : {
          status: 400,
          body: createApiError({
            code: "VALIDATION_ERROR",
            message: "The reply is empty",
            field: "body",
          }),
        };
  }

  await dependencies.writeAuditLog({
    actorId: access.moderatorId,
    action: "comment.moderation_reply",
    targetType: "flag",
    targetId: flagId,
    after: result.reply,
    ip: context.clientIp ?? null,
  });

  return { status: 201, body: createApiResponse(result.reply) };
}

// @req REQ-214
export async function handleCommentVisibility(
  target: CommentTarget,
  rawInput: unknown,
  context: ModerationContext,
  injectedDependencies: Partial<CommentModerationDependencies> = {}
): Promise<HandlerResult<{ hidden: boolean }>> {
  const dependencies = { ...defaultDependencies, ...injectedDependencies };
  const access = await authorize(context, dependencies);
  if ("refusal" in access) return access.refusal;

  const parsed = visibilitySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: 400, body: validationError(parsed.error.issues) };
  }

  const isComment = "flagId" in target;
  const targetId = isComment ? target.flagId : target.replyId;
  const { hidden, reason } = parsed.data;

  // A hidden comment leaves the page; the reason is what the moderator will
  // read later when deciding whether to restore it.
  if (isComment && hidden && !reason) {
    return {
      status: 400,
      body: createApiError({
        code: "VALIDATION_ERROR",
        message: "A reason is required to hide a comment",
        field: "reason",
      }),
    };
  }
  if (!isUuid(targetId)) return notFound();

  const changed = hidden
    ? await dependencies.hideComment(
        target,
        isComment ? reason : REPLY_HIDE_REASON
      )
    : await dependencies.unhideComment(target);
  if (!changed) return notFound();

  await dependencies.writeAuditLog({
    actorId: access.moderatorId,
    action: hidden ? "comment.hide" : "comment.unhide",
    targetType: isComment ? "flag" : "flag_reply",
    targetId,
    after: hidden && isComment ? { hidden, reason } : { hidden },
    ip: context.clientIp ?? null,
  });

  return { status: 200, body: createApiResponse({ hidden }) };
}
