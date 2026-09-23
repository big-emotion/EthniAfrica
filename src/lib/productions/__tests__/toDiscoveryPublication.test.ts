import { describe, expect, it } from "vitest";

import { eligiblePublications } from "@/lib/discoveries/catalog";
import { formatProductionNameQuestion } from "@/lib/editorial/productionNameQuestion";
import { getLanguageRoute } from "@/lib/routing";

import type { LedgerEntry } from "../ledger";
import { toDiscoveryPublication } from "../toDiscoveryPublication";

function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    campaign: "test-subject",
    typologie: "langue",
    episode: 1,
    question: {
      fr: "D'où vient le nom Test ?",
      en: "Where does Test come from?",
    },
    myth: { fr: "Un mythe.", en: "A myth." },
    subjects: [
      { kind: "language", id: "tst", label: { fr: "Test", en: "Test" } },
    ],
    sitePath: getLanguageRoute("fr", "tst"),
    publications: [],
    ...overrides,
  };
}

describe("toDiscoveryPublication", () => {
  // @req REQ-184
  it("carries the subject's identity bridge into detail.entities", () => {
    const [publication] = toDiscoveryPublication(entry());
    expect(publication.detail?.entities).toEqual([
      { kind: "language", id: "tst", label: { fr: "Test", en: "Test" } },
    ]);
  });

  // @req REQ-184
  it("titles the production with the fixed name-question formula, from the subject's own name", () => {
    const [publication] = toDiscoveryPublication(entry());
    expect(publication.title.fr).toBe(
      formatProductionNameQuestion("Test", "fr")
    );
    expect(publication.title.en).toBe(
      formatProductionNameQuestion("Test", "en")
    );
  });

  // @req REQ-184
  it("projects a complete entry as an eligible video publication", () => {
    const complete = entry({
      durationSeconds: 90,
      poster: {
        src: "/images/discoveries/videos/test/poster.jpg",
        width: 540,
        height: 960,
      },
      publications: [
        {
          network: "tiktok",
          format: "video",
          url: "https://www.tiktok.com/@ethniafrica/video/1",
          publishedAt: "2026-09-15",
        },
      ],
      sources: [
        {
          title: "Source",
          url: "https://example.org/source",
          tier: "referenced",
        },
      ],
    });
    const publications = toDiscoveryPublication(complete);
    expect(eligiblePublications(publications)).toHaveLength(1);
    expect(publications[0].video?.watchUrl).toBe(
      "https://www.tiktok.com/@ethniafrica/video/1"
    );
  });

  // @req REQ-184
  it("still projects an incomplete entry, but never as eligible", () => {
    // The real Lingala and Côte d'Ivoire ledger entries, as filed 2026-09-23:
    // a verified platform link, but no poster asset and no measured duration
    // yet — the state docs/plans/production-history-plan.md §6 calls
    // "projected but stays invisible on the feed until a URL lands," extended
    // here to any missing required field, not only the URL.
    const partial = entry({
      publications: [
        {
          network: "tiktok",
          format: "video",
          url: "https://www.tiktok.com/@ethniafrica/video/1",
        },
      ],
    });
    const publications = toDiscoveryPublication(partial);
    expect(publications).toHaveLength(1);
    expect(eligiblePublications(publications)).toEqual([]);
  });

  // @req REQ-184
  it("projects nothing for a subject the corpus does not name (empty subjects[])", () => {
    expect(toDiscoveryPublication(entry({ subjects: [] }))).toEqual([]);
  });

  // @req REQ-184
  it("never invents a source: an entry with none carries none", () => {
    const [publication] = toDiscoveryPublication(entry({ sources: undefined }));
    expect(publication.source).toBeUndefined();
    expect(publication.detail?.sources).toEqual([]);
  });
});
