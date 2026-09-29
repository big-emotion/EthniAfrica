/**
 * The site's own ledger is public data in this repository, so this reads the
 * real one: every record must be reachable by its campaign, and none may vanish
 * because two share a key.
 */
import { strict as assert } from "node:assert";
import { readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { repoRoot } from "../paths.mjs";
import { readNameLedger } from "./name-ledger.mjs";

// @req REQ-187
test("every ledger record is reachable by a distinct campaign", () => {
  const root = path.join(repoRoot(), "docs", "productions");
  const files = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((shelf) =>
      readdirSync(path.join(root, shelf.name)).filter((f) =>
        f.endsWith(".json")
      )
    );
  const ledger = readNameLedger();
  assert.equal(ledger.size, files.length);
  for (const [campaign, record] of ledger)
    assert.equal(record.campaign, campaign);
});
