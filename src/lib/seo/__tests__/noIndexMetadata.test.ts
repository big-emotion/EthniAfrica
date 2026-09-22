import { describe, expect, it } from "vitest";

import { noIndexMetadata } from "@/lib/seo/noIndexMetadata";

describe("noIndexMetadata", () => {
  // Moderation and one-shot token pages must stay out of every index, and
  // out of link discovery too: `follow: false` is the difference from the
  // locale-fallback directive in localeIndexing.ts, which keeps following.
  // @req REQ-042
  it("titles the page and forbids both indexing and following", () => {
    expect(noIndexMetadata("File de modération")).toEqual({
      title: "File de modération",
      robots: { index: false, follow: false },
    });
  });
});
