import { describe, expect, it } from "vitest";

import { getSiteTree } from "@/lib/siteTree";
import { getLocalizedRoute } from "@/lib/routing";

const section = (language: "fr", id: string) =>
  getSiteTree(language).find((s) => s.id === id);
const hrefs = (language: "fr", id: string) =>
  section(language, id)?.links.map((l) => l.href) ?? [];

describe("getSiteTree — the Articles section", () => {
  // @req REQ-110
  it("is called Articles and opens on the listing", () => {
    expect(section("fr", "dossiers")?.title).toBe("Articles");
    expect(hrefs("fr", "dossiers")[0]).toBe(
      getLocalizedRoute("fr", "dossiersHub")
    );
    expect(section("fr", "dossiers")?.links[0].label).toMatch(/articles/i);
  });

  // @req REQ-110
  it("holds the listing and the retained collections, no old dossier grouping", () => {
    const list = hrefs("fr", "dossiers");
    for (const page of ["names", "doctrine"] as const) {
      expect(list).not.toContain(getLocalizedRoute("fr", page));
    }
    expect(list).toContain(getLocalizedRoute("fr", "proverbs"));
    expect(list).toContain(getLocalizedRoute("fr", "anecdotes"));
  });

  // @req REQ-110
  it("keeps the designations page reachable under Parcourir and the doctrine under the site section", () => {
    expect(hrefs("fr", "corpus")).toContain(getLocalizedRoute("fr", "names"));
    expect(hrefs("fr", "le-site")).toContain(
      getLocalizedRoute("fr", "doctrine")
    );
  });
});
