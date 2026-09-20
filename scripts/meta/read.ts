#!/usr/bin/env tsx
/**
 * Read-only audience tooling for the Facebook Page and the Instagram account.
 *
 *   npx tsx scripts/meta/read.ts comments facebook  --post <id>  --out <dir>
 *   npx tsx scripts/meta/read.ts comments instagram --media <id> --out <dir>
 *   npx tsx scripts/meta/read.ts insights facebook  --out <dir>
 *   npx tsx scripts/meta/read.ts insights instagram --out <dir> [--recent <n>]
 *
 * It only reads. There is no publish, reply, hide or delete command, and the
 * client it is built on has no way to issue one. Runbook:
 * docs/runbooks/meta-graph-readonly.md.
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { createGraphClient } from "../lib/metaGraph";
import {
  readFacebookComments,
  readFacebookInsights,
  readInstagramComments,
  readInstagramInsights,
  type Comment,
} from "../lib/metaReaders";
import { resolveOutputDir } from "../lib/outsideCheckout";

const USAGE = `Usage:
  read.ts comments facebook  --post <id>  --out <dir>
  read.ts comments instagram --media <id> --out <dir>
  read.ts insights facebook  --out <dir>
  read.ts insights instagram --out <dir> [--recent <n>]`;

export interface RunDeps {
  env: {
    META_PAGE_TOKEN?: string;
    META_PAGE_ID?: string;
    META_IG_USER_ID?: string;
  };
  fetchImpl?: typeof fetch;
  now?: () => Date;
  log?: (line: string) => void;
}

function timestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function requireValue(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required.\n${USAGE}`);
  return value;
}

export async function run(argv: string[], deps: RunDeps): Promise<void> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      post: { type: "string" },
      media: { type: "string" },
      out: { type: "string" },
      recent: { type: "string" },
    },
  });
  const [command, platform] = positionals;
  const known =
    (command === "comments" || command === "insights") &&
    (platform === "facebook" || platform === "instagram");
  if (!known) throw new Error(USAGE);

  const token = requireValue(deps.env.META_PAGE_TOKEN, "META_PAGE_TOKEN");
  // Resolved before the first request: nothing is read that cannot be stored.
  const out = resolveOutputDir(values.out);
  const client = createGraphClient({ token, fetchImpl: deps.fetchImpl });
  const now = (deps.now ?? (() => new Date()))();
  const log = deps.log ?? console.log;
  const stamp = timestamp(now);

  const save = (name: string, payload: object): string => {
    const path = join(out, name);
    // `wx`: a second run in the same second fails rather than overwrite a read.
    writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, {
      mode: 0o600,
      flag: "wx",
    });
    return path;
  };

  const reportComments = (id: string, comments: Comment[]) => {
    const path = save(`${platform}-comments-${id}-${stamp}.json`, {
      platform,
      object: id,
      fetchedAt: now.toISOString(),
      comments,
    });
    const replies = comments.filter((comment) => comment.parentId).length;
    log(
      `Wrote ${path} (${comments.length} comments, ${replies} of them replies)`
    );
  };

  if (command === "comments" && platform === "facebook") {
    const post = requireValue(values.post, "--post");
    reportComments(post, await readFacebookComments(client, post));
  } else if (command === "comments") {
    const media = requireValue(values.media, "--media");
    reportComments(media, await readInstagramComments(client, media));
  } else if (platform === "facebook") {
    const pageId = requireValue(deps.env.META_PAGE_ID, "META_PAGE_ID");
    const report = await readFacebookInsights(client, pageId);
    const path = save(`facebook-insights-${stamp}.json`, {
      platform,
      fetchedAt: now.toISOString(),
      ...report,
    });
    log(`Wrote ${path} (${report.metrics.length} metrics)`);
  } else {
    const igUserId = requireValue(deps.env.META_IG_USER_ID, "META_IG_USER_ID");
    const recentMedia = values.recent ? Number(values.recent) : undefined;
    const report = await readInstagramInsights(client, igUserId, {
      recentMedia,
    });
    const path = save(`instagram-insights-${stamp}.json`, {
      platform,
      fetchedAt: now.toISOString(),
      ...report,
    });
    log(`Wrote ${path} (${report.media.length} posts)`);
  }
}

async function main(): Promise<void> {
  try {
    await run(process.argv.slice(2), {
      env: {
        META_PAGE_TOKEN: process.env.META_PAGE_TOKEN,
        META_PAGE_ID: process.env.META_PAGE_ID,
        META_IG_USER_ID: process.env.META_IG_USER_ID,
      },
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  void main();
}
