import { z } from "zod";

import {
  addReply,
  listPublishedCommentsByBlockKeys,
  recordAbuseReport,
  type AbuseReportResult,
  type AddReplyResult,
  type BlockComments,
  type CommentReply,
  type CommentTarget,
} from "@/api/v2/services/comments";
import {
  createApiError,
  createApiResponse,
  type ApiEnvelope,
  type ApiErrorCode,
} from "@/api/v2/utils/response";
import { verifyAntibotProof } from "@/lib/api/antibot";
import type { Proof } from "@/lib/antibot/proofOfWork";
import { getReaderSession } from "@/lib/comments/readerSession";
import { hashReporterAddress } from "@/lib/comments/reporterAddress";
import { serverCopy } from "@/lib/i18n/copy/server";
import {
  checkFlagRateLimit,
  type FlagRateLimitResult,
} from "@/lib/ratelimit/flagRateLimit";

/**
 * Block comments through the API (REQ-212, ARCH-032): read a page's threads,
 * reply as a signed-in reader, report what should not be there.
 *
 * Writing the comment itself is `POST /api/v2/flags`: a comment is a flag.
 */

/** A page draws a handful of blocks; this bounds one anonymous read. */
const MAX_BLOCK_KEYS = 30;

/**
 * Comments change while a page is open, unlike corpus records (an hour):
 * a minute keeps a busy page off the database without hiding a new comment
 * for long. The reader who just wrote one sees it from the write's answer.
 */
const COMMENTS_CACHE_CONTROL =
  "public, s-maxage=60, stale-while-revalidate=300";

const copy = serverCopy.fr.flags;

const replyCreateSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  display_name: z.string().trim().min(1).max(40).optional(),
});

const abuseReportSchema = z.object({
  antibot: z.object({
    salt: z.string().trim().min(1),
    nonce: z.string().trim().min(1),
    difficultyBits: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
    signature: z.string().trim().min(1),
  }),
  /** Hidden field: a person never fills it, and a bot that does is refused like a failed proof. */
  website: z.string().optional(),
});

// Every comment and reply id is a uuid; anything else would reach Postgres
// as a type error rather than as "not found".
const idSchema = z.uuid();

export interface CommentHandlerDependencies {
  listPublishedCommentsByBlockKeys: (
    keys: string[]
  ) => Promise<BlockComments[]>;
  addReply: (input: {
    flagId: string;
    authorId: string | null;
    displayName?: string | null;
    body: string;
  }) => Promise<AddReplyResult>;
  recordAbuseReport: (
    target: CommentTarget,
    ipHash: string
  ) => Promise<AbuseReportResult>;
  getReaderSession: () => Promise<{ id: string } | null>;
  verifyAntibotProof: (
    proof: Proof
  ) => Promise<"verified" | "rejected" | "unavailable">;
  checkFlagRateLimit: (key: string) => Promise<FlagRateLimitResult>;
  hashReporterAddress: (address: string | undefined) => string;
}

export interface CommentHandlerResult<T> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

const defaultDependencies: CommentHandlerDependencies = {
  listPublishedCommentsByBlockKeys,
  addReply,
  recordAbuseReport,
  getReaderSession,
  verifyAntibotProof,
  checkFlagRateLimit,
  hashReporterAddress,
};

function failure(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra: { field?: string; headers?: Record<string, string> } = {}
): CommentHandlerResult<ApiEnvelope<null>> {
  return {
    status,
    body: createApiError({ code, message, field: extra.field }),
    headers: extra.headers ?? {},
  };
}

function validationFailure(
  issues: z.ZodIssue[]
): CommentHandlerResult<ApiEnvelope<null>> {
  return {
    status: 400,
    body: createApiError(
      issues.map((issue) => ({
        code: "VALIDATION_ERROR" as const,
        message: issue.message,
        field: issue.path.join(".") || undefined,
      }))
    ),
    headers: {},
  };
}

function rateLimited(
  limit: Extract<FlagRateLimitResult, { allowed: false }>
): CommentHandlerResult<ApiEnvelope<null>> {
  const headers: Record<string, string> = {
    "Retry-After": String(limit.retryAfter),
  };
  if (limit.limit !== undefined) {
    headers["X-RateLimit-Limit"] = String(limit.limit);
  }
  if (limit.remaining !== undefined) {
    headers["X-RateLimit-Remaining"] = String(limit.remaining);
  }
  if (limit.reset !== undefined) {
    headers["X-RateLimit-Reset"] = String(limit.reset);
  }
  return failure(429, "RATE_LIMITED", copy.rateLimited(limit.retryAfter), {
    headers,
  });
}

// @req REQ-212
export async function handleCommentList(
  rawQuery: { block_keys?: string },
  injected: Partial<CommentHandlerDependencies> = {}
): Promise<
  CommentHandlerResult<ApiEnvelope<BlockComments[]> | ApiEnvelope<null>>
> {
  const dependencies = { ...defaultDependencies, ...injected };
  const keys = [
    ...new Set(
      (rawQuery.block_keys ?? "")
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean)
    ),
  ];

  if (keys.length === 0 || keys.length > MAX_BLOCK_KEYS) {
    return failure(
      400,
      "VALIDATION_ERROR",
      `block_keys must list between 1 and ${MAX_BLOCK_KEYS} block keys`,
      { field: "block_keys" }
    );
  }

  const blocks = await dependencies.listPublishedCommentsByBlockKeys(keys);
  return {
    status: 200,
    body: createApiResponse(blocks),
    headers: { "Cache-Control": COMMENTS_CACHE_CONTROL },
  };
}

/**
 * A reply is published at once, so only a reader whose address is confirmed
 * may write one — that is what holding a session proves. The session is the
 * cookie the confirmation page set, never a bearer (see `readerSession.ts`).
 */
// @req REQ-212
export async function handleReplyCreate(
  flagId: string,
  rawInput: unknown,
  injected: Partial<CommentHandlerDependencies> = {}
): Promise<
  CommentHandlerResult<ApiEnvelope<CommentReply> | ApiEnvelope<null>>
> {
  const dependencies = { ...defaultDependencies, ...injected };

  if (!idSchema.safeParse(flagId).success) {
    return failure(404, "NOT_FOUND", "Comment not found");
  }

  const parsed = replyCreateSchema.safeParse(rawInput);
  if (!parsed.success) return validationFailure(parsed.error.issues);

  const reader = await dependencies.getReaderSession();
  if (!reader) {
    return failure(
      401,
      "UNAUTHENTICATED",
      "Sign in with a confirmed address to reply"
    );
  }

  // One write budget per reader, shared with their comments: the same
  // limiter and the same key as `POST /api/v2/flags`.
  const limit = await dependencies.checkFlagRateLimit(reader.id);
  if (limit.allowed === false) return rateLimited(limit);

  const result = await dependencies.addReply({
    flagId,
    authorId: reader.id,
    displayName: parsed.data.display_name,
    body: parsed.data.body,
  });

  if (result.ok === false) {
    return result.reason === "not_found"
      ? failure(404, "NOT_FOUND", "Comment not found")
      : failure(400, "VALIDATION_ERROR", "Reply body is empty", {
          field: "body",
        });
  }

  return { status: 201, body: createApiResponse(result.reply), headers: {} };
}

/**
 * Anyone may report, so the controls are the comment form's: honeypot, proof
 * of work, rate limit. The caller is counted by a keyed hash of their
 * address, never the address itself.
 *
 * A reply is identified by its own id; the comment id in its URL only places
 * it for the reader and is not checked against it.
 */
// @req REQ-212
export async function handleAbuseReport(
  target: { flagId: string; replyId?: string },
  rawInput: unknown,
  context: { clientIp?: string },
  injected: Partial<CommentHandlerDependencies> = {}
): Promise<
  CommentHandlerResult<ApiEnvelope<{ received: true }> | ApiEnvelope<null>>
> {
  const dependencies = { ...defaultDependencies, ...injected };
  const targetId = target.replyId ?? target.flagId;

  if (
    !idSchema.safeParse(target.flagId).success ||
    !idSchema.safeParse(targetId).success
  ) {
    return failure(404, "NOT_FOUND", "Comment not found");
  }

  const parsed = abuseReportSchema.safeParse(rawInput);
  if (!parsed.success) return validationFailure(parsed.error.issues);

  if (parsed.data.website) {
    return failure(403, "UNAUTHORIZED", copy.antibotFailed);
  }

  const verdict = await dependencies.verifyAntibotProof(
    parsed.data.antibot as Proof
  );
  if (verdict === "rejected") {
    return failure(403, "UNAUTHORIZED", copy.antibotFailed);
  }
  if (verdict === "unavailable") {
    return failure(503, "UNAVAILABLE", copy.antibotUnavailable);
  }

  const ipHash = dependencies.hashReporterAddress(context.clientIp);
  const limit = await dependencies.checkFlagRateLimit(`report:${ipHash}`);
  if (limit.allowed === false) return rateLimited(limit);

  const recorded = await dependencies.recordAbuseReport(
    target.replyId ? { replyId: target.replyId } : { flagId: target.flagId },
    ipHash
  );
  if (recorded.ok === false) {
    return failure(404, "NOT_FOUND", "Comment not found");
  }

  // Whether this report hid the target stays with the moderation: telling
  // the reporter would tell an abuser how many reports remain.
  return {
    status: 201,
    body: createApiResponse({ received: true as const }),
    headers: {},
  };
}
