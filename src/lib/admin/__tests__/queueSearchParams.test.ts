import { describe, expect, it } from "vitest";

import {
  QUEUE_PAGE_SIZES,
  firstParam,
  pageSizeParam,
  pickOption,
} from "@/lib/admin/queueSearchParams";

describe("firstParam", () => {
  // @req REQ-042
  it("reads a single value, the first of a repeated one, and trims it", () => {
    expect(firstParam({ type: " people " }, "type")).toBe("people");
    expect(firstParam({ type: ["a", "b"] }, "type")).toBe("a");
  });

  // An empty filter is "no filter", never the empty string.
  // @req REQ-042
  it("returns null for an absent, empty or blank parameter", () => {
    expect(firstParam({}, "type")).toBeNull();
    expect(firstParam({ type: "" }, "type")).toBeNull();
    expect(firstParam({ type: "   " }, "type")).toBeNull();
    expect(firstParam({ type: [] }, "type")).toBeNull();
  });
});

describe("pickOption", () => {
  const options = [{ value: "open" }, { value: "accepted" }];

  // @req REQ-042
  it("keeps a value the page offers and drops anything else", () => {
    expect(pickOption("open", options)).toBe("open");
    expect(pickOption("bogus", options)).toBeUndefined();
    expect(pickOption(null, options)).toBeUndefined();
  });
});

describe("pageSizeParam", () => {
  // A reader-edited `taille` must not widen the page beyond what the queue
  // was designed to render.
  // @req REQ-042
  it("accepts only the offered page sizes and defaults to the first", () => {
    for (const size of QUEUE_PAGE_SIZES) {
      expect(pageSizeParam({ taille: String(size) })).toBe(size);
    }
    expect(pageSizeParam({ taille: "7" })).toBe(QUEUE_PAGE_SIZES[0]);
    expect(pageSizeParam({ taille: "abc" })).toBe(QUEUE_PAGE_SIZES[0]);
    expect(pageSizeParam({})).toBe(QUEUE_PAGE_SIZES[0]);
  });
});
