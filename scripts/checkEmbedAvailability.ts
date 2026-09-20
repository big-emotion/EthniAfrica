#!/usr/bin/env tsx
/**
 * Availability watch for embedded productions (REQ-181, DEC-059).
 *
 * The player is a cross-origin frame, so the page cannot see that a piece was
 * deleted or had embedding turned off at its platform: a reader would meet a
 * grey rectangle. The only way to know is to ask the platform out of band, on a
 * schedule, which is this script.
 *
 * It reports and never fails (the shape of `check:translation-parity`, and for
 * the same reason): a round-trip to a third party must not be able to block a
 * pull request or turn a schedule red because somebody else's server sneezed.
 * Findings surface as warning annotations on the run page.
 *
 * What counts as a finding is deliberately narrow. Only an answer that says the
 * piece cannot play (404 gone, 401/403 private or embedding disabled) is one. A
 * network failure or a 5xx says nothing about the piece, so it is listed apart
 * as unreachable: reporting it as gone would send the operator to strip an
 * embed that is fine.
 *
 * The fix for a gone piece stays a hand edit of `DISCOVERY_VIDEOS`: drop the
 * record's `embed`, keep its `watchUrl`. The card degrades to the link out and
 * never disappears.
 */

import { pathToFileURL } from "node:url";

import { DISCOVERY_VIDEOS } from "@/lib/discoveries/videos";
import type { DiscoveryVideoRecord } from "@/lib/discoveries/videos";
import type { EmbedProvider } from "@/lib/embeds/providers";

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** oEmbed endpoint and the public page URL it is asked about, per provider. */
const OEMBED: Partial<
  Record<EmbedProvider, { endpoint: string; pageUrl: (id: string) => string }>
> = {
  youtube: {
    endpoint: "https://www.youtube.com/oembed",
    pageUrl: (id) => `https://www.youtube.com/watch?v=${id}`,
  },
};

/** A piece the platform says will not play: gone, private, or not embeddable. */
const CANNOT_PLAY = new Set([401, 403, 404]);

const REQUEST_TIMEOUT_MS = 10_000;

interface GoneEmbed {
  id: string;
  provider: EmbedProvider;
  embedId: string;
  status: number;
}

export interface AvailabilityReport {
  checked: number;
  gone: GoneEmbed[];
  /** Records whose endpoint did not give a usable answer: unknown, not gone. */
  unreachable: string[];
}

// @req REQ-181
export async function checkEmbedAvailability(
  records: readonly DiscoveryVideoRecord[],
  fetcher: Fetcher = fetch
): Promise<AvailabilityReport> {
  const report: AvailabilityReport = { checked: 0, gone: [], unreachable: [] };

  for (const record of records) {
    if (record.status !== "published" || !record.embed) continue;
    const provider = OEMBED[record.embed.provider];
    // A platform with no player has no endpoint worth calling.
    if (!provider) continue;

    const query = new URLSearchParams({
      url: provider.pageUrl(record.embed.id),
      format: "json",
    });
    report.checked += 1;
    try {
      const response = await fetcher(`${provider.endpoint}?${query}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (CANNOT_PLAY.has(response.status)) {
        report.gone.push({
          id: record.id,
          provider: record.embed.provider,
          embedId: record.embed.id,
          status: response.status,
        });
      } else if (response.status !== 200) {
        report.unreachable.push(record.id);
      }
    } catch {
      report.unreachable.push(record.id);
    }
  }
  return report;
}

// @req REQ-181
export async function runEmbedAvailabilityCheck(
  records: readonly DiscoveryVideoRecord[] = DISCOVERY_VIDEOS,
  fetcher: Fetcher = fetch,
  log: (line: string) => void = console.log
): Promise<number> {
  const { checked, gone, unreachable } = await checkEmbedAvailability(
    records,
    fetcher
  );

  log(`embed availability — ${checked} checked, ${gone.length} gone`);
  for (const finding of gone) {
    log(
      `::warning title=Embedded production unavailable::${finding.id} (${finding.provider} ${finding.embedId}) answered ${finding.status}; drop the record's \`embed\` in DISCOVERY_VIDEOS and keep its watchUrl, so the card degrades to the link out.`
    );
  }
  if (unreachable.length > 0) {
    log(
      `not a finding — no usable answer for: ${unreachable.join(", ")} (network failure or server error)`
    );
  }
  // Report only: nothing here may fail a job.
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runEmbedAvailabilityCheck().then((code) => process.exit(code));
}
