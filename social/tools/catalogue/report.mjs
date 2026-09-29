/**
 * The catalogue report, and the dry-run diff that precedes any registry write.
 *
 *     node social/tools/catalogue/report.mjs
 *     node social/tools/catalogue/report.mjs --live <publications.csv> \
 *       --coverage x,linkedin --out <private dir>
 *
 * Reads the registry and the name ledger, writes nothing unless `--out` names a
 * directory — which must be outside the repository, because the report quotes
 * private records. With `--live` it sets a platform read beside the registry and
 * proposes corrections only where two independent sources agree; the proposals
 * are a file for a person to review and hand to `reconcile-registry.mjs`.
 * `--coverage` names the networks the live read covered completely: a network
 * left out is never reported as "in the registry but not live".
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { registryFile, repoRoot } from "../paths.mjs";
import { liveRowsFromCsv } from "./audit-rows.mjs";
import { buildCatalogue, reconcileLive } from "./catalogue.mjs";
import { readNameLedger } from "./name-ledger.mjs";
import { proposeCorrections } from "./propose.mjs";
import { renderReport } from "./report-view.mjs";

const { values } = parseArgs({
  options: {
    live: { type: "string" },
    coverage: { type: "string", default: "" },
    out: { type: "string" },
  },
});

const file = registryFile();
if (!file || !fs.existsSync(file)) {
  console.error("registry not found: is ETHNIAFRICA_SOCIAL_POSTS set?");
  process.exit(1);
}
if (values.out) {
  const target = path.resolve(values.out);
  if (target.startsWith(repoRoot() + path.sep)) {
    console.error(
      `--out ${target} is inside the repository; this report quotes private records.`
    );
    process.exit(1);
  }
}

const { posts } = JSON.parse(fs.readFileSync(file, "utf8"));
const ledger = readNameLedger();
const catalogue = buildCatalogue(posts, { ledger });

let reconciliation;
let proposals;
if (values.live) {
  const rows = liveRowsFromCsv(fs.readFileSync(values.live, "utf8"));
  const coverage = values.coverage.split(",").filter(Boolean);
  reconciliation = reconcileLive(catalogue, rows, { coverage });
  const campaignOf = new Map(
    posts.map((post) => [post.id, post.links?.campaign ?? post.id])
  );
  proposals = proposeCorrections(
    reconciliation.readyButLive.map((entry) => ({
      ...entry,
      campaign: campaignOf.get(entry.edition),
    })),
    ledger
  );
}

const markdown = renderReport(catalogue, { reconciliation, proposals });

if (!values.out) {
  console.log(markdown);
} else {
  fs.mkdirSync(values.out, { recursive: true });
  fs.writeFileSync(path.join(values.out, "catalogue.md"), markdown);
  fs.writeFileSync(
    path.join(values.out, "catalogue.json"),
    JSON.stringify(
      {
        editions: catalogue.editions,
        duplicates: catalogue.duplicates,
        unresolved: catalogue.unresolved,
      },
      null,
      2
    ) + "\n"
  );
  if (proposals) {
    fs.writeFileSync(
      path.join(values.out, "corrections.proposed.json"),
      JSON.stringify({ corrections: proposals.corrections }, null, 2) + "\n"
    );
    fs.writeFileSync(
      path.join(values.out, "reconciliation.json"),
      JSON.stringify({ reconciliation, leads: proposals.leads }, null, 2) + "\n"
    );
  }
  console.log(`written to ${values.out}`);
}
