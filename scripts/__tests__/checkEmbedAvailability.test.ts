import { describe, expect, it, vi } from "vitest";

import {
  checkEmbedAvailability,
  runAvailabilityCheck,
} from "../checkEmbedAvailability";

const youtube = (id: string) => ({
  id: `video:${id}`,
  name: { fr: `Pièce ${id}`, en: `Piece ${id}` },
  embed: { provider: "youtube" as const, id },
});

const answering = (status: number) =>
  vi.fn().mockResolvedValue({ status, ok: status >= 200 && status < 300 });

describe("the embedded-piece availability check", () => {
  // @req REQ-181
  it("asks YouTube's oEmbed endpoint about the piece's watch page", async () => {
    const fetchImpl = answering(200);

    await checkEmbedAvailability([youtube("vESK91smqxQ")], fetchImpl);

    const requested = new URL(fetchImpl.mock.calls[0][0] as string);
    expect(requested.origin + requested.pathname).toBe(
      "https://www.youtube.com/oembed"
    );
    expect(requested.searchParams.get("url")).toBe(
      "https://www.youtube.com/watch?v=vESK91smqxQ"
    );
  });

  // @req REQ-181
  it("tells a playable piece from a removed one and from one the owner restricted", async () => {
    const byStatus = { available: 200, gone: 404, restricted: 401 } as const;

    for (const [expected, status] of Object.entries(byStatus)) {
      const [result] = await checkEmbedAvailability(
        [youtube("vESK91smqxQ")],
        answering(status)
      );
      expect(result.status).toBe(expected);
    }
  });

  // @req REQ-181
  it("never reports a piece as gone because the network or the platform failed", async () => {
    const [unreachable] = await checkEmbedAvailability(
      [youtube("vESK91smqxQ")],
      vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND"))
    );
    const [platformError] = await checkEmbedAvailability(
      [youtube("vESK91smqxQ")],
      answering(503)
    );

    expect(unreachable.status).toBe("unknown");
    expect(platformError.status).toBe("unknown");
  });

  // @req REQ-181
  it("does not probe a record that links out, nor a provider with no oEmbed wired", async () => {
    const fetchImpl = answering(200);
    const linkOnly = {
      id: "video:lien-seul",
      name: { fr: "Lien seul", en: "Link only" },
    };
    const tiktok = {
      id: "video:tiktok",
      name: { fr: "TikTok", en: "TikTok" },
      embed: { provider: "tiktok" as const, id: "7000000000000" },
    };

    const results = await checkEmbedAvailability([linkOnly, tiktok], fetchImpl);

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(results.map((result) => result.status)).toEqual([
      "no-embed",
      "unchecked",
    ]);
  });

  // @req REQ-181
  it("refuses to build a request from an identifier that is not one", async () => {
    const fetchImpl = answering(200);

    const [result] = await checkEmbedAvailability(
      [youtube("not an id/../?")],
      fetchImpl
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.status).toBe("unchecked");
  });

  // @req REQ-181
  it("lists what needs a hand edit and still succeeds, so a third party cannot block a pull request", async () => {
    const lines: string[] = [];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ status: 404, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true });

    const exitCode = await runAvailabilityCheck({
      records: [youtube("gonegonegon"), youtube("aliveaalive")],
      fetchImpl,
      log: (line) => lines.push(line),
    });

    expect(exitCode).toBe(0);
    const report = lines.join("\n");
    expect(report).toContain("video:gonegonegon");
    expect(report).not.toContain("video:aliveaalive is");
  });

  // @req REQ-181
  it("succeeds when everything is playable", async () => {
    const lines: string[] = [];

    const exitCode = await runAvailabilityCheck({
      records: [youtube("vESK91smqxQ")],
      fetchImpl: answering(200),
      log: (line) => lines.push(line),
    });

    expect(exitCode).toBe(0);
    expect(lines.join("\n")).not.toMatch(/::warning::/);
  });
});
