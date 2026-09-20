import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { eligiblePublications } from "@/lib/discoveries/catalog";
import {
  DISCOVERY_VIDEOS,
  videoPublications,
  type DiscoveryVideoRecord,
} from "@/lib/discoveries/videos";
import { embedPlayerUrl } from "@/lib/embeds/providers";

const RECORD: DiscoveryVideoRecord = {
  id: "video-test",
  status: "published",
  slug: { fr: "mande-video", en: "mande-video" },
  name: { fr: "Mandé", en: "Mandé" },
  description: { fr: "Description.", en: "Description." },
  publishedAt: "2026-09-16",
  durationSeconds: 121,
  poster: { src: "/images/x.jpg", width: 540, height: 960 },
  watchUrl: "https://www.youtube.com/shorts/vESK91smqxQ",
  embed: { provider: "youtube", id: "vESK91smqxQ" },
  credit: {
    author: "EthniAfrica",
    licence: "cc-by-sa",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  source: {
    title: "Fiche",
    url: "https://ethniafrica.com/fr",
    tier: "referenced",
  },
  subjects: [
    {
      kind: "family",
      id: "FLG_MANDE",
      label: { fr: "Mandé", en: "Mandé" },
    },
  ],
};

describe("videoPublications", () => {
  // @req REQ-181
  it("carries the embed reference and the credit beside the watch link", () => {
    const [publication] = videoPublications([RECORD]);

    expect(publication.video?.embed).toEqual({
      provider: "youtube",
      id: "vESK91smqxQ",
    });
    expect(publication.video?.credit).toEqual(RECORD.credit);
    expect(publication.video?.watchUrl).toBe(RECORD.watchUrl);
  });

  // The embed is optional: a record without one is a link out, as before.
  // @req REQ-181
  it("degrades to the link out when the record has no embed", () => {
    const { embed: _embed, ...withoutEmbed } = RECORD;
    const [publication] = videoPublications([withoutEmbed]);

    expect(publication.video?.embed).toBeUndefined();
    expect(publication.video?.watchUrl).toBe(RECORD.watchUrl);
  });

  // No `embedUrl` is stored: a stored string that becomes an iframe `src` is
  // an unvalidated address. Only the provider and the identifier are kept.
  // @req REQ-181
  it("stores no URL for the player", () => {
    const [publication] = videoPublications([RECORD]);

    expect(Object.keys(publication.video ?? {})).not.toContain("embedUrl");
    expect(Object.keys(publication.video?.embed ?? {}).sort()).toEqual([
      "id",
      "provider",
    ]);
  });
});

// This is the validator for embeds: an identifier out of shape is not rendered
// (`embedPlayerUrl` returns null), and a record that carries one fails here
// rather than shipping as a facade that quietly shows only a link.
describe("the published video catalog", () => {
  // @req REQ-181
  it("holds only embed identifiers that build a player URL", () => {
    for (const record of DISCOVERY_VIDEOS) {
      if (!record.embed) continue;
      expect(embedPlayerUrl(record.embed), record.id).not.toBeNull();
    }
  });

  // REQ-128: a production shown on the site names its author, its licence and
  // the page it is published on.
  // @req REQ-181
  it("credits every embedded production with an author and a licence URI", () => {
    for (const record of DISCOVERY_VIDEOS) {
      if (!record.embed) continue;
      expect(record.credit?.author, record.id).toBeTruthy();
      expect(record.credit?.licenceUrl, record.id).toMatch(/^https:\/\//);
      expect(record.watchUrl, record.id).toMatch(/^https:\/\//);
    }
  });

  // The poster is self-hosted: the facade never reaches for a platform thumbnail.
  // @req REQ-181
  it("serves every poster from public/, not from a platform", () => {
    for (const record of DISCOVERY_VIDEOS) {
      expect(record.poster.src, record.id).toMatch(/^\/images\//);
      expect(
        existsSync(path.join(process.cwd(), "public", record.poster.src)),
        record.id
      ).toBe(true);
    }
  });

  // @req REQ-181
  it("is eligible for the reader as written", () => {
    const publications = videoPublications();
    expect(eligiblePublications(publications)).toHaveLength(
      publications.length
    );
  });

  // The first production shipped on the site: one record, to prove the
  // contract end to end, and not the catalog.
  // @req REQ-181
  it("ships exactly one embedded production", () => {
    expect(DISCOVERY_VIDEOS.filter((record) => record.embed)).toHaveLength(1);
  });
});
