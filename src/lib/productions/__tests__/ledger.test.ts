import { describe, expect, it } from "vitest";

import { loadProductionLedger } from "../ledger";

// @req REQ-184
describe("loadProductionLedger", () => {
  it("reads every subject filed under docs/productions, across every typology", () => {
    const entries = loadProductionLedger();

    expect(entries.length).toBeGreaterThanOrEqual(15);
    for (const entry of entries) {
      expect(entry.campaign, JSON.stringify(entry)).toBeTruthy();
      expect(entry.sitePath, entry.campaign).toMatch(/^\//);
      expect(Array.isArray(entry.subjects), entry.campaign).toBe(true);
      expect(Array.isArray(entry.publications), entry.campaign).toBe(true);
    }
  });

  // @req REQ-184
  it("carries the Lingala carrousel backfilled from the verified TikTok link", () => {
    const entries = loadProductionLedger();
    const lingala = entries.find(
      (entry) => entry.campaign === "lingala-invente-par-les-belges"
    );

    expect(lingala?.publications).toContainEqual(
      expect.objectContaining({
        network: "tiktok",
        format: "carrousel",
        url: "https://www.tiktok.com/@ethniafrica/photo/7685962182923767062",
      })
    );
  });

  // @req REQ-184
  it("carries the newly filed Côte d'Ivoire subject and its verified TikTok video", () => {
    const entries = loadProductionLedger();
    const civ = entries.find(
      (entry) => entry.campaign === "cote-divoire-bouet-willaumez"
    );

    expect(civ?.subjects).toEqual([
      { kind: "country", id: "CIV", label: { fr: "Côte d'Ivoire" } },
    ]);
    expect(civ?.publications).toContainEqual(
      expect.objectContaining({
        network: "tiktok",
        format: "video",
        url: "https://www.tiktok.com/@ethniafrica/video/7685531757302549782",
      })
    );
  });
});
