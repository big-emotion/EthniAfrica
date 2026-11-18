import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// A self-registered reader: the token resolves to a real user, but the
// address is not on the moderator allowlist. Every table read answers empty,
// so a handler that forgets the allowlist answers 2xx instead of 403.
const READER = { id: "reader-1", email: "reader@example.org" };

vi.mock("@/lib/supabase/admin", () => {
  const emptyQuery: unknown = new Proxy(() => undefined, {
    get: (_target, property) =>
      property === "then"
        ? (resolve: (value: unknown) => void) =>
            resolve({ data: [], error: null, count: 0 })
        : () => emptyQuery,
    apply: () => emptyQuery,
  });
  return {
    createAdminClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: READER }, error: null }),
      },
      from: () => emptyQuery,
      rpc: () => emptyQuery,
      storage: { from: () => emptyQuery },
    }),
  };
});

vi.mock("@/lib/auth/adminAllowlist", () => ({
  isEmailAllowlisted: vi.fn().mockResolvedValue(false),
}));

import {
  SESSION_AUTHENTICATED_API_ROUTES,
  isSessionAuthenticatedApiRoute,
} from "@/lib/api/sessionAuthenticatedRoutes";
import { GET as listKeys, POST as createKey } from "@/app/api/v2/keys/route";
import { DELETE as revokeKey } from "@/app/api/v2/keys/[id]/route";
import {
  GET as searchReferences,
  POST as createReference,
} from "@/app/api/v2/reference-library/route";
import { POST as createAssertionReference } from "@/app/api/v2/reference-library/assertions/route";
import { POST as createWorkingAsset } from "@/app/api/v2/reference-library/assets/route";
import { PATCH as transitionFlag } from "@/app/api/v2/flags/[id]/route";
import { POST as recordSourceTierRuling } from "@/app/api/v2/admin/source-tier-rulings/route";

/**
 * The middleware skips API-key validation on these routes, so the only thing
 * standing between an anonymous caller and them is the handler. Each case
 * sends no bearer at all and must be refused. An entry added to the list
 * without a case here fails the coverage test below: the exemption is never
 * allowed to be the authorization.
 */
interface GuardCase {
  method: string;
  pathname: string;
  send: (request: NextRequest) => Promise<Response>;
}

const params = <T>(value: T) => ({ params: Promise.resolve(value) });

const guardCases: GuardCase[] = [
  { method: "GET", pathname: "/api/v2/keys", send: (r) => listKeys(r) },
  { method: "POST", pathname: "/api/v2/keys", send: (r) => createKey(r) },
  {
    method: "DELETE",
    pathname: "/api/v2/keys/key-1",
    send: (r) => revokeKey(r, params({ id: "key-1" })),
  },
  {
    method: "GET",
    pathname: "/api/v2/reference-library",
    send: (r) => searchReferences(r),
  },
  {
    method: "POST",
    pathname: "/api/v2/reference-library",
    send: (r) => createReference(r),
  },
  {
    method: "POST",
    pathname: "/api/v2/reference-library/assertions",
    send: (r) => createAssertionReference(r),
  },
  {
    method: "POST",
    pathname: "/api/v2/reference-library/assets",
    send: (r) => createWorkingAsset(r),
  },
  {
    method: "PATCH",
    pathname: "/api/v2/flags/flag-7kq3m2",
    send: (r) => transitionFlag(r, params({ id: "flag-7kq3m2" })),
  },
  {
    method: "POST",
    pathname: "/api/v2/admin/source-tier-rulings",
    send: (r) => recordSourceTierRuling(r),
  },
];

function anonymousRequest(
  { method, pathname }: GuardCase,
  headers: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost${pathname}`;
  if (pathname.endsWith("/assets")) {
    return new NextRequest(url, { method, body: new FormData(), headers });
  }
  return new NextRequest(url, {
    method,
    headers,
    ...(method === "GET" || method === "DELETE"
      ? {}
      : {
          body: JSON.stringify({ status: "under_review", label: "CI" }),
          headers: { ...headers, "content-type": "application/json" },
        }),
  });
}

function readerRequest(guardCase: GuardCase): NextRequest {
  return anonymousRequest(guardCase, {
    authorization: "Bearer reader-session-jwt",
  });
}

describe("session-authenticated API routes", () => {
  // @req REQ-056
  it("has a no-bearer guard case for every exempted route", () => {
    for (const route of SESSION_AUTHENTICATED_API_ROUTES) {
      const guarded = guardCases.some(
        ({ method, pathname }) =>
          route.path.test(pathname) &&
          (!route.methods || route.methods.includes(method))
      );
      expect(guarded, `no guard case for ${route.path}`).toBe(true);
    }
  });

  // @req REQ-056
  it.each(guardCases)(
    "exempts $method $pathname from API-key validation",
    ({ method, pathname }) => {
      expect(isSessionAuthenticatedApiRoute(pathname, method)).toBe(true);
    }
  );

  // The flags PATCH answers 403 rather than 401 on purpose: no token and a
  // token without a moderator role get the same answer, so a probe learns
  // nothing (handlers/flags.ts). Both are a refusal; neither is a pass.
  // @req REQ-042
  it.each(guardCases)(
    "refuses $method $pathname when no bearer is sent",
    async (guardCase) => {
      const response = await guardCase.send(anonymousRequest(guardCase));

      expect([401, 403]).toContain(response.status);
    }
  );

  // Public reader accounts make a valid session cheap: anyone can hold one.
  // A session is therefore never the authorization on these routes — the
  // moderator allowlist is.
  // @req REQ-056
  it.each(guardCases)(
    "refuses $method $pathname with 403 for a session off the allowlist",
    async (guardCase) => {
      const response = await guardCase.send(readerRequest(guardCase));

      expect(response.status).toBe(403);
    }
  );

  // @req REQ-034
  it.each([
    ["GET", "/api/v2/countries"],
    ["GET", "/api/v2/flags/flag-7kq3m2"],
    ["POST", "/api/v2/flags"],
    ["GET", "/api/v2/peoples/PPL_SHONA"],
    ["GET", "/api/v2/reference-library-mirror"],
  ])("keeps API-key validation on %s %s", (method, pathname) => {
    expect(isSessionAuthenticatedApiRoute(pathname, method)).toBe(false);
  });

  // A reader's session travels as the site's cookies, not as a bearer
  // (lib/comments/readerSession.ts), so the comment routes need no exemption
  // here — and must not get one, since every entry is held to the moderator
  // allowlist.
  // @req REQ-212
  it.each([
    ["GET", "/api/v2/comments"],
    ["POST", "/api/v2/comments/9c81ca0d-ae45-4f08-8f53-2ac0a9673abd/replies"],
    ["POST", "/api/v2/comments/9c81ca0d-ae45-4f08-8f53-2ac0a9673abd/report"],
  ])(
    "leaves the reader route %s %s to the keyless path",
    (method, pathname) => {
      expect(isSessionAuthenticatedApiRoute(pathname, method)).toBe(false);
    }
  );
});
