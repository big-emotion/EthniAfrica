import { describe, expect, it } from "vitest";

import {
  ACCESS_MODE_LABELS,
  MODULE_DEFINITIONS,
  RUBRIC_FILED_AXES,
  getNavModules,
} from "@/lib/hubs/moduleRegistry";
import { getModuleHref } from "@/lib/hubs/moduleHref";
import { getLocalizedRoute } from "@/lib/routing";

describe("the Articles axis", () => {
  // @req REQ-114
  it("is labelled Articles", () => {
    expect(ACCESS_MODE_LABELS.dossiers).toBe("Articles");
  });

  // @req REQ-114
  it("offers exactly four destinations, the listing first", () => {
    expect(getNavModules("dossiers").map((m) => m.id)).toEqual([
      "articles",
      "anecdotes",
      "proverbes",
      "galerie",
    ]);
  });

  // @req REQ-114
  it("opens the article listing at the existing /dossiers address", () => {
    const listing = getNavModules("dossiers")[0];
    expect(getModuleHref(listing, "fr")).toBe(
      getLocalizedRoute("fr", "dossiersHub")
    );
  });

  // @req REQ-114
  it("promises nothing that is not ready: every listed entry is ready", () => {
    for (const m of getNavModules("dossiers")) {
      expect(m.editorialReadiness).toBe("ready");
    }
  });

  // @req REQ-114
  it("keeps the withdrawn drafts registered and routed, only out of the menu", () => {
    const withdrawn = MODULE_DEFINITIONS.filter((m) =>
      ["nommer", "frise", "regards-colonisation"].includes(m.id)
    );
    expect(withdrawn).toHaveLength(3);
    for (const m of withdrawn) expect(m.unlisted).toBe(true);
  });

  // @req REQ-114
  it("is no longer filed under rubric headings", () => {
    expect(RUBRIC_FILED_AXES).not.toContain("dossiers");
  });
});
