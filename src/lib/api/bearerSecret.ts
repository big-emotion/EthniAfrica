import { timingSafeEqual } from "node:crypto";

/**
 * Whether an Authorization header carries exactly `Bearer <secret>`, compared
 * in constant time so the response time says nothing about how much of a
 * guess was right.
 *
 * For Node route handlers only. `node:crypto` does not exist in the edge
 * bundle, so this must never be imported from `src/middleware.ts` — which is
 * why `auth.ts` writes its own loop instead.
 *
 * `timingSafeEqual` throws on buffers of different lengths; the guard answers
 * first, which discloses the length of the expected header and nothing else.
 */
// @req REQ-091
export function matchesBearerSecret(
  authorization: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !authorization) return false;

  const presented = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  if (presented.length !== expected.length) return false;

  return timingSafeEqual(presented, expected);
}
