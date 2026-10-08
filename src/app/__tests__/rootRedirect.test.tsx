import { describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));
vi.mock("next/navigation", () => ({ redirect }));

import Home from "@/app/page";

/**
 * The middleware answers `/` before this page ever renders. The page is the
 * fallback for a render the middleware did not front — a direct invocation,
 * a matcher change — and sends the reader to the French home.
 */
describe("root page", () => {
  // @req REQ-140
  it("redirects to the French home", () => {
    expect(() => Home()).toThrow("NEXT_REDIRECT:/fr");
    expect(redirect).toHaveBeenCalledWith("/fr");
  });
});
