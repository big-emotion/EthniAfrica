import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { planReviews } from "../narration/family-routing.mjs";
import { run } from "./edition-cli.mjs";

// Integration seam between S3 (which reviews a family owes) and S6 (which
// reviews delivery demands): each was tested alone, and nothing checked that
// the approvals S3 lists are exactly the ones S6 waits for.
const FIXTURES = fileURLToPath(
  new URL("../narration/families/fixtures/", import.meta.url)
);
const NETWORKS = ["tiktok", "instagram"];
const reviewer = { role: "reviewer", id: "independent-reviewer" };

const briefs = readdirSync(FIXTURES)
  .filter((name) => name.endsWith(".brief.json"))
  .map((name) => ({
    name,
    edition: JSON.parse(readFileSync(join(FIXTURES, name), "utf8")).edition,
  }));

function specFor(edition) {
  const spec = {
    "copy:main": { text: "copy v1" },
    "audio:mix": { text: "mix v1" },
  };
  for (const claim of edition.claims)
    spec[`claim:${claim.id}`] = { text: claim.id };
  for (const network of NETWORKS)
    spec[`destination:${network}`] = { text: network };
  return spec;
}

const approvalFor = (check, inputs) => ({
  check,
  reviewer,
  reference: `Test-only approval of ${check}`,
  inputs,
});

function statusOf(root, base) {
  return run([
    "status",
    root,
    ...base,
    "--networks",
    NETWORKS.join(","),
    "--as-of",
    "2026-09-29",
  ]);
}

// @req REQ-186
test("every family: delivery waits for exactly the reviews its family plan lists as required", () => {
  assert.equal(briefs.length, 7, "six families and the legacy control");
  for (const { name, edition } of briefs) {
    const root = mkdtempSync(join(tmpdir(), "family-delivery-"));
    try {
      writeFileSync(join(root, "edition.json"), JSON.stringify(edition));
      writeFileSync(join(root, "spec.json"), JSON.stringify(specFor(edition)));
      const inputs = run(["inputs", root, "--spec", "spec.json"]);
      writeFileSync(join(root, "inputs.json"), JSON.stringify(inputs));
      const base = [
        "--edition",
        "edition.json",
        "--approvals",
        "approvals.json",
        "--inputs",
        "inputs.json",
      ];

      const required = planReviews(edition)
        .reviews.filter((review) => review.applicability !== "not-applicable")
        .map((review) => review.id);
      const everyInput = (network) =>
        Object.fromEntries(
          Object.entries(inputs).filter(
            ([key]) =>
              !key.startsWith("destination:") ||
              key === `destination:${network}`
          )
        );
      const approvals = required.flatMap((check) =>
        check === "music"
          ? NETWORKS.map((network) => approvalFor(check, everyInput(network)))
          : [approvalFor(check, everyInput(NETWORKS[0]))]
      );

      writeFileSync(join(root, "approvals.json"), "[]");
      const bare = statusOf(root, base);
      for (const row of bare) {
        assert.deepEqual(
          row.open.map((line) => line.replace(/ missing$/, "")).sort(),
          [...required].sort(),
          `${name}: with no approval, ${row.network} waits for the plan's reviews`
        );
      }

      writeFileSync(join(root, "approvals.json"), JSON.stringify(approvals));
      for (const row of statusOf(root, base)) {
        assert.equal(
          row.review,
          "complete",
          `${name}: ${row.network} ${row.open}`
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});
