import { describe, expect, it } from "vitest";

import { legalPages } from "@/lib/legal-pages";

// The data policy must list only cookies the site actually writes: the
// language cookie went with the language switcher when the site became
// French-only, and a policy naming it would describe a site that no longer
// exists.
describe("data policy cookies", () => {
  // @req REQ-088
  it("no longer mentions a language cookie", () => {
    const policy = JSON.stringify(legalPages);

    expect(policy).not.toContain("ethni-locale");
    expect(policy).not.toContain("sélecteur de langue");
  });
});
