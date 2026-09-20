import { describe, expect, it, vi } from "vitest";

import type { DiscoveryVideoRecord } from "@/lib/discoveries/videos";

import {
  checkEmbedAvailability,
  runEmbedAvailabilityCheck,
} from "../checkEmbedAvailability";

const record = (
  id: string,
  embed?: DiscoveryVideoRecord["embed"]
): DiscoveryVideoRecord => ({
  id,
  status: "published",
  slug: { fr: id, en: id },
  name: { fr: "Nom", en: "Name" },
  description: { fr: "d", en: "d" },
  publishedAt: "2026-09-16",
  durationSeconds: 60,
  poster: { src: "/images/x.jpg", width: 540, height: 960 },
  watchUrl: "https://www.youtube.com/shorts/aaaaaaaaaaa",
  embed,
  source: { title: "s", url: "https://example.org", tier: "referenced" },
  subjects: [],
});

const answering = (status: number) =>
  vi.fn(async () => ({ status }) as Response);

describe("checkEmbedAvailability", () => {
  const live = record("video:live", { provider: "youtube", id: "aaaaaaaaaaa" });

  // @req REQ-181
  it("lists a record whose oEmbed endpoint answers 404", async () => {
    const report = await checkEmbedAvailability([live], answering(404));

    expect(report.gone).toEqual([
      {
        id: "video:live",
        provider: "youtube",
        embedId: "aaaaaaaaaaa",
        status: 404,
      },
    ]);
  });

  // 401 is what YouTube answers for a private piece or one whose owner turned
  // embedding off: the player would not play either way.
  // @req REQ-181
  it("lists a record that cannot be embedded, not only one that is gone", async () => {
    const report = await checkEmbedAvailability([live], answering(401));

    expect(report.gone.map((finding) => finding.status)).toEqual([401]);
  });

  // @req REQ-181
  it("lists nothing for a piece that answers", async () => {
    const report = await checkEmbedAvailability([live], answering(200));

    expect(report.gone).toEqual([]);
    expect(report.checked).toBe(1);
  });

  // A round-trip that failed says nothing about the piece. Reporting it as gone
  // would tell the operator to strip an embed that is fine.
  // @req REQ-181
  it("does not call an unreachable endpoint a finding", async () => {
    const failing = vi.fn(async () => {
      throw new Error("network down");
    });
    const report = await checkEmbedAvailability([live], failing);

    expect(report.gone).toEqual([]);
    expect(report.unreachable).toEqual(["video:live"]);
  });

  // @req REQ-181
  it("does not treat a server error as the piece being gone", async () => {
    const report = await checkEmbedAvailability([live], answering(503));

    expect(report.gone).toEqual([]);
    expect(report.unreachable).toEqual(["video:live"]);
  });

  // The fix for a gone piece is a hand edit that drops `embed`, so a record
  // with none has nothing to check and no card to lose.
  // @req REQ-181
  it("skips a record without an embed and one that is not published", async () => {
    const fetcher = answering(200);
    const report = await checkEmbedAvailability(
      [
        record("video:link-only"),
        { ...live, id: "video:draft", status: "draft" },
      ],
      fetcher
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(report.checked).toBe(0);
  });

  // Only YouTube has a player, so only YouTube has an endpoint worth calling.
  // @req REQ-181
  it("asks YouTube's oEmbed about the piece by its watch URL", async () => {
    const fetcher = answering(200);
    await checkEmbedAvailability([live], fetcher);

    const [url] = fetcher.mock.calls[0] as unknown as [string];
    expect(url).toContain("https://www.youtube.com/oembed?");
    expect(decodeURIComponent(url)).toContain(
      "url=https://www.youtube.com/watch?v=aaaaaaaaaaa"
    );
  });
});

// A round-trip to a third party must not be able to block a pull request or a
// schedule: this is a report, in the shape of check:translation-parity.
describe("runEmbedAvailabilityCheck", () => {
  const gone = record("video:gone", { provider: "youtube", id: "bbbbbbbbbbb" });

  // @req REQ-181
  it("exits 0 when it finds a record that is gone", async () => {
    const log = vi.fn();
    const code = await runEmbedAvailabilityCheck([gone], answering(404), log);

    expect(code).toBe(0);
    expect(log.mock.calls.flat().join("\n")).toContain("video:gone");
  });

  // @req REQ-181
  it("exits 0 when every endpoint is unreachable", async () => {
    const failing = vi.fn(async () => {
      throw new Error("offline");
    });

    expect(await runEmbedAvailabilityCheck([gone], failing, vi.fn())).toBe(0);
  });

  // The annotation is what makes the finding visible on the run page, since
  // the job itself stays green.
  // @req REQ-181
  it("annotates each finding as a warning, never an error", async () => {
    const log = vi.fn();
    await runEmbedAvailabilityCheck([gone], answering(404), log);

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("::warning");
    expect(output).not.toContain("::error");
  });

  // @req REQ-181
  it("says what the hand fix is", async () => {
    const log = vi.fn();
    await runEmbedAvailabilityCheck([gone], answering(404), log);

    expect(log.mock.calls.flat().join("\n")).toMatch(
      /drop the record's `embed`/
    );
  });
});
