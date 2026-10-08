import { describe, expect, it } from "vitest";

import {
  getSearchLabel,
  getSearchPlaceholder,
  getSearchResultGroups,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_RESULT_GROUPS,
} from "../searchVocabulary";

describe("localized search vocabulary", () => {
  // @req REQ-140
  it("keeps the existing French constants as the French vocabulary", () => {
    expect(getSearchLabel("fr")).toBe(SEARCH_LABEL);
    expect(getSearchPlaceholder("fr")).toBe(SEARCH_PLACEHOLDER);
    expect(getSearchResultGroups("fr")).toBe(SEARCH_RESULT_GROUPS);
  });
});
