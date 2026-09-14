import { describe, expect, it } from "vitest";

import { listMigrationsQuerySchema } from "@/api/v2/schemas/migrations";
import { listNameFormsQuerySchema } from "@/api/v2/schemas/names";
import {
  DEFAULT_PAGE_SIZE,
  EGO_NETWORK_PAGE_SIZE,
  MAX_PAGE_SIZE,
  NAME_FORMS_PAGE_SIZE,
  PUBLIC_FLAGS_PAGE_SIZE,
  SEARCH_MAX_PAGE_SIZE,
  pageSizeSchema,
} from "@/api/v2/schemas/pagination";
import { egoNetworkQuerySchema } from "@/api/v2/schemas/relations";
import { validatePerPage } from "@/api/v2/utils/validation";

/**
 * The public API promises one page-size contract — twenty by default, a
 * hundred at most — and used to state it in nineteen places. These hold the
 * places that parse a request to the one pair of numbers.
 */
describe("API page size", () => {
  // @req REQ-110
  it("defaults to the shared page size when the request names none", () => {
    expect(pageSizeSchema.parse(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(validatePerPage(null)).toBe(DEFAULT_PAGE_SIZE);
    expect(listMigrationsQuerySchema.parse({}).limit).toBe(DEFAULT_PAGE_SIZE);
  });

  // @req REQ-110
  it("refuses a page larger than the shared maximum", () => {
    expect(pageSizeSchema.safeParse(MAX_PAGE_SIZE).success).toBe(true);
    expect(pageSizeSchema.safeParse(MAX_PAGE_SIZE + 1).success).toBe(false);
    expect(validatePerPage(String(MAX_PAGE_SIZE + 1))).toBe(MAX_PAGE_SIZE);
  });

  // @req REQ-110
  it("names each surface that pages at its own size, under the shared maximum", () => {
    expect(listNameFormsQuerySchema.parse({}).perPage).toBe(
      NAME_FORMS_PAGE_SIZE
    );
    expect(
      listNameFormsQuerySchema.safeParse({ perPage: MAX_PAGE_SIZE + 1 }).success
    ).toBe(false);
    expect(egoNetworkQuerySchema.parse({}).limit).toBe(EGO_NETWORK_PAGE_SIZE);
    expect(
      egoNetworkQuerySchema.safeParse({ limit: MAX_PAGE_SIZE + 1 }).success
    ).toBe(false);

    for (const size of [
      NAME_FORMS_PAGE_SIZE,
      EGO_NETWORK_PAGE_SIZE,
      PUBLIC_FLAGS_PAGE_SIZE,
      SEARCH_MAX_PAGE_SIZE,
    ]) {
      expect(size).toBeLessThanOrEqual(MAX_PAGE_SIZE);
    }
  });
});
