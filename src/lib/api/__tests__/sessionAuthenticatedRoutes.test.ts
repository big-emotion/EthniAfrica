import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
  SESSION_AUTHENTICATED_API_ROUTES,
  isSessionAuthenticatedApiRoute,
} from "@/lib/api/sessionAuthenticatedRoutes";
import { GET as listKeys } from "@/app/api/v2/keys/route";
import { DELETE as revokeKey } from "@/app/api/v2/keys/[id]/route";
import {
  GET as searchReferences,
  POST as createReference,
} from "@/app/api/v2/reference-library/route";
import { POST as createAssertionReference } from "@/app/api/v2/reference-library/assertions/route";
import { POST as createWorkingAsset } from "@/app/api/v2/reference-library/assets/route";
import { PATCH as transitionFlag } from "@/app/api/v2/flags/[id]/route";

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
];

function anonymousRequest({ method, pathname }: GuardCase): NextRequest {
  const url = `http://localhost${pathname}`;
  if (pathname.endsWith("/assets")) {
    return new NextRequest(url, { method, body: new FormData() });
  }
  return new NextRequest(url, {
    method,
    ...(method === "GET" || method === "DELETE"
      ? {}
      : {
          body: JSON.stringify({ status: "under_review" }),
          headers: { "content-type": "application/json" },
        }),
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
});
