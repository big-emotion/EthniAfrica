import { describe, expect, it } from "vitest";

import { isTranslationLocale } from "../translationLocale";

describe("isTranslationLocale", () => {
  // The route reads a request value and must refuse, not default, anything
  // the site does not publish — English included now that it is retired, and
  // a case variant a browser might send.
  // @req REQ-140
  it("accepts French and nothing else", () => {
    expect(isTranslationLocale("fr")).toBe(true);
    for (const rejected of ["en", "de", "es", "pt", "FR", "fr-FR", "", "fr "]) {
      expect(isTranslationLocale(rejected), rejected).toBe(false);
    }
  });
});
