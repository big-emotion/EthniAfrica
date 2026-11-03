import { describe, expect, it } from "vitest";

import { pageNumberedListEnvelope } from "@/api/v2/handlers/listEnvelope";
import { DEFAULT_PAGE_SIZE } from "@/api/v2/schemas/pagination";
import { API_ATTRIBUTION, API_LICENSE } from "@/api/v2/utils/response";

/**
 * The countries, peoples and language-family lists share this envelope, so a
 * slip in its arithmetic would misreport every paginated list at once.
 */
describe("pageNumberedListEnvelope", () => {
  // @req REQ-084
  it("wraps the rows with licence, attribution and pagination", () => {
    const envelope = pageNumberedListEnvelope(["a", "b"], {
      total: 45,
      page: 2,
      perPage: 10,
    });

    expect(envelope.data).toEqual(["a", "b"]);
    expect(envelope.errors).toEqual([]);
    expect(envelope.meta.license).toBe(API_LICENSE);
    expect(envelope.meta.attribution).toBe(API_ATTRIBUTION);
    expect(envelope.meta.pagination).toEqual({
      total: 45,
      page: 2,
      perPage: 10,
      totalPages: 5,
    });
  });

  // @req REQ-084
  it("defaults to the first page at the default page size", () => {
    const envelope = pageNumberedListEnvelope([], { total: 41 });

    expect(envelope.meta.pagination).toEqual({
      total: 41,
      page: 1,
      perPage: DEFAULT_PAGE_SIZE,
      totalPages: Math.ceil(41 / DEFAULT_PAGE_SIZE),
    });
  });

  // @req REQ-084
  it("reports zero pages for an empty list", () => {
    expect(
      pageNumberedListEnvelope([], { total: 0, perPage: 10 }).meta.pagination
        ?.totalPages
    ).toBe(0);
  });

  // @req REQ-084
  it("adds a list's own pagination fields beside the shared ones", () => {
    const envelope = pageNumberedListEnvelope([], {
      total: 3,
      perPage: 2,
      extra: { unclassifiedPeoples: 7 },
    });

    expect(envelope.meta.pagination).toMatchObject({
      totalPages: 2,
      unclassifiedPeoples: 7,
    });
  });
});
