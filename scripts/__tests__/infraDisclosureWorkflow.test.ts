import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// The runner prints every step's `env:` block, and the Actions logs of a public
// repository are public. A repository *variable* is therefore echoed in clear
// text — which published the whole deny-list on 2026-09-14, the values the gate
// exists to keep out. A secret is masked as `***`, so the list travels that way.
const workflow = readFileSync(
  resolve(import.meta.dirname, "../../.github/workflows/ci.yml"),
  "utf8"
);

describe("check:infra-disclosure wiring", () => {
  // @req REQ-032
  it("takes its terms from a secret, never from a repository variable", () => {
    expect(workflow).toContain(
      "INFRA_DISCLOSURE_TERMS: ${{ secrets.INFRA_DISCLOSURE_TERMS }}"
    );
    expect(workflow).not.toContain("vars.INFRA_DISCLOSURE_TERMS");
  });

  // @req REQ-032
  it("runs the gate in the build job", () => {
    expect(workflow).toContain("npm run check:infra-disclosure");
  });
});
