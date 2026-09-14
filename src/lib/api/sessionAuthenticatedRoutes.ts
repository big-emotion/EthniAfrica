/**
 * The /api/v2 routes whose handlers authenticate a Supabase session.
 *
 * The browser sends its session access token as `Authorization: Bearer`,
 * which is also where an API key travels. The middleware reads every other
 * bearer on /api/v2 as an api_keys row, so a session JWT sent to one of these
 * routes was refused with 401 invalid_api_key before the handler could say
 * who the caller is — a moderator could not move a report, and nobody could
 * write to the reference library.
 *
 * Being listed here grants nothing. It only moves authentication from the
 * middleware to the handler, so every route listed must refuse a request that
 * carries no session: `sessionAuthenticatedRoutes.test.ts` holds each entry to
 * a no-bearer case and fails on an entry without one. The middleware still
 * meters these routes in the per-IP bucket and still secures their responses.
 *
 * Kept as one list so the next such route is an entry, not another ad-hoc
 * pathname check in the middleware.
 */
interface SessionAuthenticatedApiRoute {
  path: RegExp;
  /** Absent means every method on the path carries a session. */
  methods?: readonly string[];
}

// @req REQ-056
export const SESSION_AUTHENTICATED_API_ROUTES: readonly SessionAuthenticatedApiRoute[] =
  [
    // API-key self-service (ETNI-81): keyService.getAuthenticatedUser. Its
    // /issue endpoint is anonymous and takes no bearer at all.
    { path: /^\/api\/v2\/keys(\/|$)/ },
    // Search and every write; the handler resolves the session user.
    { path: /^\/api\/v2\/reference-library(\/|$)/ },
    // The moderation transition. GET on the same path is the public detail,
    // so a bearer there is still an API key.
    { path: /^\/api\/v2\/flags\/[^/]+$/, methods: ["PATCH"] },
    // The moderation console (source-tier rulings): each handler checks the
    // session against the moderator allowlist (getModeratorByAccessToken).
    { path: /^\/api\/v2\/admin\// },
  ];

// @req REQ-056
export function isSessionAuthenticatedApiRoute(
  pathname: string,
  method: string
): boolean {
  return SESSION_AUTHENTICATED_API_ROUTES.some(
    (route) =>
      route.path.test(pathname) &&
      (!route.methods || route.methods.includes(method.toUpperCase()))
  );
}
