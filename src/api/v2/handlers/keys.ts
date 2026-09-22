import { z } from "zod";
import { createApiKeySchema } from "@/api/v2/schemas/apiKeys";
import { getKeyPrefix, hashApiKey } from "@/lib/api/auth";
import {
  createUserApiKey,
  getAuthenticatedUser,
  hasActivePublicKeyForIp,
  insertPublicKey,
  listUserApiKeys,
  revokeUserApiKey,
  type ApiKeySummary,
  type CreatedApiKey,
} from "@/api/v2/services/keyService";
import {
  createApiError,
  createApiResponse,
  type ApiEnvelope,
  type ApiError,
} from "@/api/v2/utils/response";

export interface KeyHandlerContext {
  accessToken: string | null;
}

export interface KeyHandlerResult<T> {
  status: number;
  body: T;
}

export interface KeyHandlerDependencies {
  getAuthenticatedUser: typeof getAuthenticatedUser;
  listUserApiKeys: typeof listUserApiKeys;
  createUserApiKey: typeof createUserApiKey;
  revokeUserApiKey: typeof revokeUserApiKey;
}

const defaultDependencies: KeyHandlerDependencies = {
  getAuthenticatedUser,
  listUserApiKeys,
  createUserApiKey,
  revokeUserApiKey,
};

function resolveDependencies(
  overrides: Partial<KeyHandlerDependencies>
): KeyHandlerDependencies {
  return { ...defaultDependencies, ...overrides };
}

function validationError(issues: z.ZodIssue[]): ApiEnvelope<null> {
  const errors: ApiError[] = issues.map((issue) => ({
    code: "VALIDATION_ERROR",
    message: issue.message,
    field: issue.path.join(".") || undefined,
  }));
  return createApiError(errors);
}

function unauthorized(): ApiEnvelope<null> {
  return createApiError({
    code: "UNAUTHORIZED",
    message: "Authentication required",
  });
}

async function requireUser(
  context: KeyHandlerContext,
  dependencies: KeyHandlerDependencies
): Promise<{ id: string } | null> {
  const accessToken = context.accessToken?.trim();
  if (!accessToken) return null;
  return dependencies.getAuthenticatedUser(accessToken);
}

// @req REQ-056
export async function handleKeyList(
  context: KeyHandlerContext,
  injectedDependencies: Partial<KeyHandlerDependencies> = {}
): Promise<KeyHandlerResult<ApiEnvelope<ApiKeySummary[]> | ApiEnvelope<null>>> {
  const dependencies = resolveDependencies(injectedDependencies);
  const user = await requireUser(context, dependencies);
  if (!user) {
    return { status: 401, body: unauthorized() };
  }

  const keys = await dependencies.listUserApiKeys(user.id);
  return { status: 200, body: createApiResponse(keys) };
}

// @req REQ-056
export async function handleKeyCreate(
  context: KeyHandlerContext,
  rawInput: unknown,
  injectedDependencies: Partial<KeyHandlerDependencies> = {}
): Promise<KeyHandlerResult<ApiEnvelope<CreatedApiKey> | ApiEnvelope<null>>> {
  const dependencies = resolveDependencies(injectedDependencies);
  const user = await requireUser(context, dependencies);
  if (!user) {
    return { status: 401, body: unauthorized() };
  }

  const parsed = createApiKeySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: 400, body: validationError(parsed.error.issues) };
  }

  const created = await dependencies.createUserApiKey(
    user.id,
    parsed.data.label
  );
  return { status: 201, body: createApiResponse(created) };
}

// @req REQ-056
export async function handleKeyRevoke(
  context: KeyHandlerContext,
  keyId: string,
  injectedDependencies: Partial<KeyHandlerDependencies> = {}
): Promise<KeyHandlerResult<ApiEnvelope<null>>> {
  const dependencies = resolveDependencies(injectedDependencies);
  const user = await requireUser(context, dependencies);
  if (!user) {
    return { status: 401, body: unauthorized() };
  }

  const result = await dependencies.revokeUserApiKey(user.id, keyId);
  if (result === "not_found") {
    return {
      status: 404,
      body: createApiError({ code: "NOT_FOUND", message: "API key not found" }),
    };
  }

  return { status: 200, body: createApiResponse(null) };
}

export interface PublicKeyIssueContext {
  /** From `clientIp`; null when no trusted header names the caller. */
  clientIp: string | null;
}

export interface PublicKeyIssueDependencies {
  hasActivePublicKeyForIp: typeof hasActivePublicKeyForIp;
  insertPublicKey: typeof insertPublicKey;
  hashApiKey: typeof hashApiKey;
}

export interface IssuedPublicKey {
  key: string;
  tier: "public";
  note: string;
}

/**
 * Anonymous issuance of the shared read-only key: one live key per address.
 *
 * The address is looked up BEFORE anything is hashed — the hash is 600,000
 * PBKDF2 iterations, and an address that already holds a key is the
 * commonest repeat request. The lookup and the insert are not atomic, so two
 * simultaneous first requests from one address can both succeed; the
 * per-address issuance limiter in front of the route bounds that to a handful
 * of extra public-tier keys. A unique partial index on `ip_address` would
 * close it, at the price of a migration and its two-step rollout.
 */
// @req REQ-034
export async function handlePublicKeyIssue(
  context: PublicKeyIssueContext,
  injectedDependencies: Partial<PublicKeyIssueDependencies> = {}
): Promise<KeyHandlerResult<ApiEnvelope<IssuedPublicKey> | ApiEnvelope<null>>> {
  const dependencies = {
    hasActivePublicKeyForIp,
    insertPublicKey,
    hashApiKey,
    ...injectedDependencies,
  };

  if (!context.clientIp) {
    return {
      status: 400,
      body: createApiError({
        code: "VALIDATION_ERROR",
        message:
          "The client address could not be determined; a public key is bound to one.",
      }),
    };
  }

  if (await dependencies.hasActivePublicKeyForIp(context.clientIp)) {
    return {
      status: 409,
      body: createApiError({
        code: "RATE_LIMITED",
        message:
          "An active public API key has already been issued for this IP address.",
      }),
    };
  }

  const rawKey = `pub_${crypto.randomUUID().replace(/-/g, "")}_${crypto.randomUUID().replace(/-/g, "")}`;
  await dependencies.insertPublicKey({
    keyHash: await dependencies.hashApiKey(rawKey),
    keyPrefix: getKeyPrefix(rawKey),
    ipAddress: context.clientIp,
  });

  return {
    status: 201,
    body: createApiResponse({
      key: rawKey,
      tier: "public" as const,
      note: "Store this key safely. It will not be shown again.",
    }),
  };
}
