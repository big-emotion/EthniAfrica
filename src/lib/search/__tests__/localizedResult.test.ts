import { describe, expect, it } from "vitest";

import {
  getLocalizedSearchResultFamilyName,
  getLocalizedSearchResultName,
} from "../localizedResult";
import type { SearchResult } from "@/types/afrik-frontend";

const result: SearchResult = {
  type: "language",
  id: "ara",
  name: "Arabe standard",
  nameEn: "Standard Arabic",
  languageFamilyName: "Afro-asiatique",
  languageFamilyNameEn: "Afroasiatic",
};

describe("localized search result names", () => {
  // The corpus also carries English names; a French page never shows them.
  // @req REQ-140
  it("uses the French names", () => {
    expect(getLocalizedSearchResultName(result, "fr")).toBe("Arabe standard");
    expect(getLocalizedSearchResultFamilyName(result, "fr")).toBe(
      "Afro-asiatique"
    );
  });
});
