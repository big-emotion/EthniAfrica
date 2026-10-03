import { describe, expect, it } from "vitest";

import { getSiteTree } from "@/lib/siteTree";
import { getLocalizedRoute } from "@/lib/routing";

const section = (language: "fr" | "en", id: string) =>
  getSiteTree(language).find((s) => s.id === id);
const hrefs = (language: "fr" | "en", id: string) =>
  section(language, id)?.links.map((l) => l.href) ?? [];

describe("getSiteTree — the Articles section", () => {
  // @req REQ-110
  it.each(["fr", "en"] as const)(
    "is called Articles and opens on the listing (%s)",
    (language) => {
      expect(section(language, "dossiers")?.title).toBe("Articles");
      expect(hrefs(language, "dossiers")[0]).toBe(
        getLocalizedRoute(language, "dossiersHub")
      );
      expect(section(language, "dossiers")?.links[0].label).toMatch(
        language === "fr" ? /articles/i : /articles/i
      );
    }
  );

  // @req REQ-110
  it("holds the listing and the retained collections, no old dossier grouping", () => {
    const list = hrefs("fr", "dossiers");
    for (const page of ["names", "doctrine"] as const) {
      expect(list).not.toContain(getLocalizedRoute("fr", page));
    }
    expect(list).toContain(getLocalizedRoute("fr", "proverbs"));
    expect(list).toContain(getLocalizedRoute("fr", "anecdotes"));
    expect(list).toContain(getLocalizedRoute("fr", "gallery"));
  });

  // @req REQ-110
  it("keeps the designations page reachable under Parcourir and the doctrine under the site section", () => {
    expect(hrefs("fr", "corpus")).toContain(getLocalizedRoute("fr", "names"));
    expect(hrefs("fr", "le-site")).toContain(
      getLocalizedRoute("fr", "doctrine")
    );
  });
});
