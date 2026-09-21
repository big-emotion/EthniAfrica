/**
 * Every route calls into `@/api/v2/handlers/*`, which the contract suite mocks
 * generically (routeRegistry.extractHandlerImports). A route that reaches past
 * its handler — the way `/api/v2/keys/issue` used to talk to
 * `createAdminClient()` directly — needs a hand-written mock keyed
 * `"<METHOD> <spec path>"` here. None does today, and one that does is the
 * signal that it skipped a layer.
 */
// @req REQ-033
export const ROUTE_OVERRIDES: Record<string, () => void> = {};
