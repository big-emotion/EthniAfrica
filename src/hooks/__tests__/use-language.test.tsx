import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" as string | null }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

import { useLanguage, useRouteLanguage } from "../use-language";
import { getLocalizedRoute } from "@/lib/routing";

/**
 * The site publishes French alone, so the locale hooks answer French on any
 * route, outside the locale tree and outside the App Router alike.
 */
describe("useLanguage", () => {
  // @req REQ-140
  it.each([getLocalizedRoute("fr", "peoples"), "/", "/api/v2/peoples", null])(
    "answers French on %s",
    (pathname) => {
      navigation.pathname = pathname;

      expect(renderHook(() => useLanguage()).result.current).toEqual({
        language: "fr",
      });
      expect(renderHook(() => useRouteLanguage()).result.current).toBe("fr");
    }
  );

  // There is no other language to switch to, so there is no switch.
  // @req REQ-140
  it("offers no way to change language", () => {
    expect(renderHook(() => useLanguage()).result.current).not.toHaveProperty(
      "setLanguage"
    );
  });
});
