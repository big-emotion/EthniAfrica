import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const workflow = fs.readFileSync(
  path.join(process.cwd(), ".github/workflows/deploy-production.yml"),
  "utf8"
);

describe("production locale smoke gate", () => {
  // A /fr-only health probe would stay green while the root or a retired
  // English address answered something else. The release gate inspects all
  // three, without following redirects.
  // @req REQ-140
  it.each([
    '{ path: "/", status: 307, location: "/fr" }',
    '{ path: "/fr", status: 200 }',
    '{ path: "/en", status: 308, location: "/fr" }',
  ])("probes %s", (check) => {
    expect(workflow).toContain(check);
    expect(workflow).toContain('redirect: "manual"');
  });

  // There is no publication mode left to validate.
  // @req REQ-140
  it("no longer reads SITE_LOCALE_MODE", () => {
    expect(workflow).not.toContain("SITE_LOCALE_MODE");
  });

  // The smoke script uses top-level await and must be parsed as an ES module.
  // @req REQ-140
  it("runs the in-container smoke script as an ES module", () => {
    expect(workflow).toContain(
      "docker compose exec -T ethniafrica node --input-type=module"
    );
  });
});
