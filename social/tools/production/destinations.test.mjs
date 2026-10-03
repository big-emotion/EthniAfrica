import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { checkDestination, MATRIX } from "./destinations.mjs";

const TODAY = "2026-09-29";

// @req REQ-186
test("a network that refuses a format is a hard failure, whatever the size", () => {
  const check = checkDestination(
    { network: "x", format: "carrousel", cardCount: 3 },
    { asOf: TODAY }
  );
  assert.equal(check.ok, false);
  assert.match(check.problems[0], /x does not accept carrousel/);
});

// @req REQ-186
test("the matrix used here is the one the TypeScript ledger gate reads", () => {
  const source = readFileSync(
    new URL("../../../scripts/lib/socialFormatMatrix.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /socialFormatMatrix\.json/);
  assert.deepEqual(Object.keys(MATRIX.formats).sort(), [
    "facebook",
    "instagram",
    "linkedin",
    "tiktok",
    "x",
    "youtube",
  ]);
});

// @req REQ-186
test("a limit is enforced only when a dated official source backs it", () => {
  const over = checkDestination(
    { network: "youtube", format: "video", durationSeconds: 181 },
    { asOf: TODAY }
  );
  assert.equal(over.ok, false);
  assert.match(over.problems.join(" "), /180/);
  const within = checkDestination(
    { network: "youtube", format: "video", durationSeconds: 60 },
    { asOf: TODAY }
  );
  assert.deepEqual(within, { ok: true, problems: [], unverified: [] });
});

// @req REQ-186
test("a dimension with no verified limit is reported, never silently passed", () => {
  const check = checkDestination(
    { network: "instagram", format: "video", durationSeconds: 5000 },
    { asOf: TODAY }
  );
  assert.equal(check.ok, true);
  assert.deepEqual(check.unverified, ["instagram video maxDurationSeconds"]);
});

// @req REQ-186
test("a verified limit older than the freshness window is unverified again", () => {
  const check = checkDestination(
    { network: "youtube", format: "video", durationSeconds: 60 },
    { asOf: "2027-06-01" }
  );
  assert.equal(check.ok, true);
  assert.match(check.unverified[0], /youtube video maxDurationSeconds \(stale/);
});

// @req REQ-186
test("every recorded limit names its official page and the day it was read", () => {
  for (const formats of Object.values(MATRIX.constraints ?? {}))
    for (const limits of Object.values(formats))
      for (const limit of Object.values(limits)) {
        assert.match(limit.sourceUrl, /^https:\/\//);
        assert.match(limit.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(limit.quote.length > 10);
      }
});
