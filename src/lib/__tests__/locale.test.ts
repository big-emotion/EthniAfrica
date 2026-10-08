import { describe, expect, it } from "vitest";

import * as locale from "@/lib/locale";
import { FALLBACK_LOCALE, LOCALES, isLocale } from "@/lib/locale";

describe("the one published locale", () => {
  // @req REQ-140
  it("publishes French and nothing else", () => {
    expect(LOCALES).toEqual(["fr"]);
    expect(FALLBACK_LOCALE).toBe("fr");
  });

  // @req REQ-140
  it("recognises French as a locale and refuses English", () => {
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("en")).toBe(false);
    expect(isLocale("es")).toBe(false);
    expect(isLocale("quiz")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  // A publication switch or a remembered choice would imply a second
  // language the site could still serve; there is none.
  // @req REQ-140
  it("exposes no publication mode, cookie or locale header", () => {
    expect(Object.keys(locale).sort()).toEqual([
      "FALLBACK_LOCALE",
      "LOCALES",
      "isLocale",
    ]);
  });
});
