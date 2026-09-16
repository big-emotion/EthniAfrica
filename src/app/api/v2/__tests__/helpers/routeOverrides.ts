import { vi } from "vitest";

/**
 * Every route but one calls into `@/api/v2/handlers/*`, which the contract
 * suite mocks generically (routeRegistry.extractHandlerImports). The one
 * exception is `/api/v2/keys/issue` (POST, and its deprecated GET alias),
 * which talks to `createAdminClient()` directly — this is its one
 * hand-written mock.
 */
function mockAdminClientWithNoExistingKey() {
  const noExistingKey = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }),
      insert: async () => ({ error: null }),
    }),
  };
  vi.doMock("@/lib/supabase/admin", () => ({
    createAdminClient: () => noExistingKey,
  }));
}

// @req REQ-033
export const ROUTE_OVERRIDES: Record<string, () => void> = {
  "GET /api/v2/keys/issue": mockAdminClientWithNoExistingKey,
  "POST /api/v2/keys/issue": mockAdminClientWithNoExistingKey,
};
