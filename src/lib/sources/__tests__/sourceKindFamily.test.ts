import { describe, expect, it } from "vitest";

import {
  SOURCE_KIND_FAMILIES,
  sourceKindFamily,
} from "@/lib/sources/sourceKindFamily";
import { SOURCE_KINDS, type SourceKind } from "@/types/sources";

describe("sourceKindFamily — the diamond's colour families", () => {
  // @req REQ-161
  it("keeps the reader-facing palette to seven families, in legend order", () => {
    expect(SOURCE_KIND_FAMILIES).toEqual([
      "oral",
      "book",
      "encyclopedia",
      "press",
      "report",
      "archive",
      "other",
    ]);
  });

  // @req REQ-161
  it("gives every corpus source kind exactly one family", () => {
    for (const kind of SOURCE_KINDS) {
      expect(SOURCE_KIND_FAMILIES, kind).toContain(sourceKindFamily(kind));
    }
  });

  // @req REQ-161
  it("groups the kinds a reader would not tell apart by colour", () => {
    expect(sourceKindFamily("oral_tradition")).toBe("oral");
    expect(sourceKindFamily("community")).toBe("oral");
    expect(sourceKindFamily("academic")).toBe("book");
    expect(sourceKindFamily("linguistic_reference")).toBe("book");
    // Wikipedia is filed as `encyclopedia`; a reader must not take it for a
    // book or a study, so it gets its own colour.
    expect(sourceKindFamily("encyclopedia")).toBe("encyclopedia");
    expect(sourceKindFamily("press")).toBe("press");
    expect(sourceKindFamily("government")).toBe("report");
    expect(sourceKindFamily("intergovernmental")).toBe("report");
    expect(sourceKindFamily("official_statistics")).toBe("report");
    expect(sourceKindFamily("archive")).toBe("archive");
    expect(sourceKindFamily("repository")).toBe("archive");
    expect(sourceKindFamily("discovery")).toBe("other");
    expect(sourceKindFamily("ai_generated")).toBe("other");
    expect(sourceKindFamily("ethniafrica_synthesis")).toBe("other");
    expect(sourceKindFamily("unknown")).toBe("other");
  });

  // @req REQ-161
  it("already places the other two kinds PR #1624 adds", () => {
    expect(sourceKindFamily("ngo" as SourceKind)).toBe("report");
    expect(sourceKindFamily("missionary_database" as SourceKind)).toBe("other");
  });

  // @req REQ-161
  it("falls back to « other » for a kind the corpus has not declared", () => {
    expect(sourceKindFamily(undefined)).toBe("other");
    expect(sourceKindFamily("not_a_kind" as SourceKind)).toBe("other");
  });
});
