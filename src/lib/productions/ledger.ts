import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * The shape `scripts/ci/checkProductionLedger.ts` validates. Redeclared here
 * rather than imported: the gate lives under `scripts/`, run by `tsx` outside
 * the Next build, and importing across that boundary is not a path this
 * repository's tooling resolves. Keep this in sync with the gate's own
 * `LedgerEntry` by hand; `ledger.test.ts` reads the real `docs/productions/`
 * tree, so a drift wide enough to matter fails a test, not silently.
 */
export interface LedgerEntry {
  campaign: string;
  typologie: string;
  episode: number | null;
  question: { fr: string; en?: string };
  myth: { fr: string; en?: string } | null;
  narrativePattern?: string;
  subjects: Array<{
    kind: string;
    id: string;
    label: { fr: string; en?: string };
  }>;
  sitePath: string;
  publications: Array<{
    network: string;
    format: string;
    url?: string;
    publishedAt?: string;
  }>;
  poster?: { src: string; width: number; height: number };
  durationSeconds?: number;
  sources?: Array<{ title: string; url: string; tier: string }>;
}

const LEDGER_ROOT = path.join(process.cwd(), "docs/productions");

function readJsonFiles(dir: string): LedgerEntry[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), "utf8")));
}

/**
 * Every subject filed under `docs/productions/**\/*.json`, read at server
 * time. Not memoised: this runs during the server render / build, not per
 * request from a browser, and the file tree is small (fifteen entries as of
 * 2026-09-23) — the same trust level the audience-audit skill already gives
 * `docs/audience/audit-*.md`.
 *
 * A file the gate would reject is not specially handled here: `check:
 * production-ledger` runs in CI before this ever reads a broken tree, so a
 * malformed file reaching production is a gate failure elsewhere, not this
 * function's job to guard against a second time.
 */
// @req REQ-184
export function loadProductionLedger(): LedgerEntry[] {
  let typologyDirs: string[];
  try {
    typologyDirs = readdirSync(LEDGER_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
  return typologyDirs.flatMap((dir) =>
    readJsonFiles(path.join(LEDGER_ROOT, dir))
  );
}
