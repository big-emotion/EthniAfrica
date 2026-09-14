#!/usr/bin/env tsx
/**
 * Pulls the admin queue's ruling drafts into the git ruling ledger.
 *
 * A moderator's decision is recorded as a row in `source_tier_ruling_drafts`
 * (migration 090). It becomes a ruling only here, in git, because the corpus
 * sync overwrites any tier changed in the database alone. This script reads
 * the drafts over PostgREST with the service role — one GET, nothing written
 * to the database — and appends each draft not already in the ledger, keyed on
 * its `draftId`, so running it twice appends nothing the second time.
 *
 * It does not apply anything: the printed command does, after review.
 *
 *   npx tsx scripts/afrik/pullSourceTierRulings.ts --target=recette
 *   npx tsx scripts/afrik/pullSourceTierRulings.ts --target=production
 *
 * Credentials follow check:migration-state: NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY for recette, PRODUCTION_SUPABASE_URL and
 * PRODUCTION_SUPABASE_SERVICE_ROLE_KEY for production, with no fallback from one
 * to the other.
 */

import fs from "node:fs";
import path from "node:path";

import * as prettier from "prettier";

import { resolveMigrationStateTarget } from "../lib/migrationStateTarget";
import type { SourceTier, SourceTierRulingDecision } from "@/types/sources";
import {
  SOURCE_TIER_RULINGS_LEDGER,
  type SourceTierRuling,
} from "./sourceTierRulings";

interface RulingDraftRow {
  id: string;
  source_title: string;
  source_url: string | null;
  decision: SourceTierRulingDecision;
  tier: SourceTier | null;
  repaired_url: string | null;
  rationale: string;
  decided_by: string;
  decided_at: string;
}

export interface PullSourceTierRulingsOptions {
  supabaseUrl: string;
  serviceRoleKey: string;
  ledgerPath: string;
  fetchImpl?: typeof fetch;
}

function draftToRuling(draft: RulingDraftRow): SourceTierRuling {
  return {
    id: `STR-${draft.id}`,
    match: { title: draft.source_title, url: draft.source_url ?? null },
    decision: draft.decision,
    ...(draft.tier ? { tier: draft.tier } : {}),
    ...(draft.repaired_url ? { repairedUrl: draft.repaired_url } : {}),
    rationale: draft.rationale,
    decidedBy: draft.decided_by,
    decidedAt: draft.decided_at.slice(0, 10),
    draftId: draft.id,
  };
}

export async function pullSourceTierRulings(
  options: PullSourceTierRulingsOptions
): Promise<{ appended: string[] }> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1/source_tier_ruling_drafts?select=*&order=decided_at.asc`,
    {
      method: "GET",
      headers: {
        apikey: options.serviceRoleKey,
        Authorization: `Bearer ${options.serviceRoleKey}`,
      },
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `source_tier_ruling_drafts answered HTTP ${response.status}: ${body.slice(0, 300)}`
    );
  }
  const drafts = (await response.json()) as RulingDraftRow[];

  const ledger = (
    fs.existsSync(options.ledgerPath)
      ? JSON.parse(fs.readFileSync(options.ledgerPath, "utf8"))
      : { rulings: [] }
  ) as { rulings?: SourceTierRuling[]; [key: string]: unknown };
  const rulings = Array.isArray(ledger.rulings) ? ledger.rulings : [];

  const pulled = new Set(rulings.map((ruling) => ruling.draftId));
  const fresh = drafts
    .filter((draft) => !pulled.has(draft.id))
    .map(draftToRuling);
  if (fresh.length === 0) return { appended: [] };

  ledger.rulings = [...rulings, ...fresh];
  const config = (await prettier.resolveConfig(options.ledgerPath)) ?? {};
  fs.writeFileSync(
    options.ledgerPath,
    await prettier.format(JSON.stringify(ledger, null, 2), {
      ...config,
      filepath: options.ledgerPath,
    }),
    "utf8"
  );
  return { appended: fresh.map((ruling) => ruling.id) };
}

async function main(): Promise<void> {
  const target = process.argv
    .find((argument) => argument.startsWith("--target="))
    ?.slice("--target=".length);

  const credentials = resolveMigrationStateTarget({
    environment: target,
    recetteUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    recetteKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    productionUrl: process.env.PRODUCTION_SUPABASE_URL,
    productionKey: process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY,
  });

  const { appended } = await pullSourceTierRulings({
    supabaseUrl: credentials.supabaseUrl,
    serviceRoleKey: credentials.serviceRoleKey,
    ledgerPath: SOURCE_TIER_RULINGS_LEDGER,
  });

  console.log(
    `Pulled ${appended.length} new ruling(s) from ${credentials.environment} into ${SOURCE_TIER_RULINGS_LEDGER}`
  );
  for (const id of appended) console.log(`  ${id}`);
  if (appended.length > 0) {
    console.log(
      "Review them, then: npx tsx scripts/afrik/applySourceTierRulings.ts (dry run), and --apply to write the fiches."
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(path.basename(process.argv[1]))
) {
  main().catch((error: Error) => {
    console.error(`pullSourceTierRulings — ${error.message}`);
    process.exitCode = 1;
  });
}
