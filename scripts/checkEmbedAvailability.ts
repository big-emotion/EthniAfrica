#!/usr/bin/env tsx
/**
 * Availability of the pieces the site plays in place (REQ-181, DEC-059).
 *
 * The player is a cross-origin frame, so the page cannot hear that its piece was
 * deleted, made private or blocked: the reader would meet YouTube's own error
 * inside the site's card. The one way to find out is to ask the platform from
 * outside, on a schedule, and to say what needs a hand edit.
 *
 * It reports and never blocks, like `check:translation-parity`: a round trip to
 * a third party is not something a pull request should be able to fail on. Only
 * a crash of the script itself exits non-zero, since a watcher that dies
 * silently is a watcher nobody notices is gone.
 *
 * The fix stays manual on purpose. A record whose piece is gone drops its
 * `embed` field in `src/lib/discoveries/videos.ts` and keeps its `watchUrl`, so
 * the card degrades to the link-out instead of disappearing.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DISCOVERY_VIDEOS,
  type DiscoveryVideoRecord,
} from "@/lib/discoveries/videos";
import { embedPlayerUrl, type EmbedProvider } from "@/lib/embeds/providers";

export type ProbedRecord = Pick<DiscoveryVideoRecord, "id" | "name" | "embed">;

export type Availability =
  | "available"
  | "gone"
  | "restricted"
  // The platform or the network failed to answer. Never read as "gone": a
  // timeout at 03:00 must not send someone to remove a piece that is fine.
  | "unknown"
  // An embed this script has no way to ask about.
  | "unchecked"
  | "no-embed";

export interface AvailabilityResult {
  id: string;
  name: string;
  status: Availability;
  detail?: string;
}

type Answer = { status: number; ok: boolean };
type FetchLike = (
  url: string,
  init?: { signal?: AbortSignal }
) => Promise<Answer>;

/**
 * Only YouTube has a player, hence the only oEmbed endpoint wired. Adding a
 * provider to the site is adding its line here in the same change.
 */
const OEMBED_URL: Partial<Record<EmbedProvider, (id: string) => string>> = {
  youtube: (id) =>
    `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${id}`
    )}&format=json`,
};

const REQUEST_TIMEOUT_MS = 10_000;

/**
 * 404 is what YouTube answers for a piece that was removed (measured on
 * 2026-09-20 with a bogus identifier). 401 and 403 are its answer for a private
 * piece or one whose owner disabled embedding — reported behaviour, not
 * something a public piece lets this script measure. Both mean the frame would
 * show an error, so both need the same hand edit.
 */
function classify(answer: Answer): Availability {
  if (answer.ok) return "available";
  if (answer.status === 404) return "gone";
  if (answer.status === 401 || answer.status === 403) return "restricted";
  return "unknown";
}

// @req REQ-181
export async function checkEmbedAvailability(
  records: readonly ProbedRecord[],
  fetchImpl: FetchLike = fetch
): Promise<AvailabilityResult[]> {
  const results: AvailabilityResult[] = [];

  for (const record of records) {
    const base = { id: record.id, name: record.name.fr };
    const { embed } = record;

    if (!embed) {
      results.push({ ...base, status: "no-embed" });
      continue;
    }

    // `embedPlayerUrl` is the one place that knows what a well-formed
    // identifier is. Asking it, rather than re-declaring the shape here, keeps
    // a malformed stored value from ever reaching a request.
    const oembed = OEMBED_URL[embed.provider];
    if (!oembed || !embedPlayerUrl(embed, [embed.provider])) {
      results.push({ ...base, status: "unchecked" });
      continue;
    }

    try {
      const answer = await fetchImpl(oembed(embed.id), {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      results.push({
        ...base,
        status: classify(answer),
        detail: `oEmbed answered ${answer.status}`,
      });
    } catch (error) {
      results.push({
        ...base,
        status: "unknown",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

function annotation(result: AvailabilityResult): string | null {
  const label = `${result.id} (${result.name})`;
  switch (result.status) {
    case "gone":
      return `::warning title=Embedded piece removed::${label} — ${result.detail}. Drop its embed field in src/lib/discoveries/videos.ts; it keeps its watchUrl and falls back to the link-out.`;
    case "restricted":
      return `::warning title=Embedded piece not playable::${label} — ${result.detail}: private, or embedding disabled by its owner. Drop its embed field in src/lib/discoveries/videos.ts.`;
    case "unknown":
      return `::notice title=Availability unknown::${label} — ${result.detail}. Not treated as removed.`;
    default:
      return null;
  }
}

// @req REQ-181
export async function runAvailabilityCheck({
  records = DISCOVERY_VIDEOS.filter((record) => record.status === "published"),
  fetchImpl = fetch,
  log = console.log,
}: {
  records?: readonly ProbedRecord[];
  fetchImpl?: FetchLike;
  log?: (line: string) => void;
} = {}): Promise<0> {
  const results = await checkEmbedAvailability(records, fetchImpl);

  results.forEach((result) => {
    const line = annotation(result);
    if (line) log(line);
  });

  const count = (status: Availability) =>
    results.filter((result) => result.status === status).length;
  log(
    `check:embed-availability — ${results.length} record(s): ${count("available")} playable, ${count("gone")} removed, ${count("restricted")} restricted, ${count("unknown")} unknown, ${count("unchecked")} unchecked (reported, never blocking)`
  );

  return 0;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  runAvailabilityCheck().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
