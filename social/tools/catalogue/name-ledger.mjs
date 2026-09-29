/**
 * The name series' ledger, `docs/productions/`, read as a lookup by campaign.
 *
 * A campaign the ledger holds is the evidence the contract accepts for reading a
 * legacy registry entry as a name investigation; nothing else grants that.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { repoRoot } from "../paths.mjs";

export function readNameLedger(
  root = path.join(repoRoot(), "docs", "productions")
) {
  const records = new Map();
  for (const shelf of readdirSync(root, { withFileTypes: true })) {
    if (!shelf.isDirectory()) continue;
    for (const file of readdirSync(path.join(root, shelf.name))) {
      if (!file.endsWith(".json")) continue;
      const record = JSON.parse(
        readFileSync(path.join(root, shelf.name, file), "utf8")
      );
      if (record.campaign) {
        records.set(record.campaign, {
          ...record,
          file: `${shelf.name}/${file}`,
        });
      }
    }
  }
  return records;
}
