import { describe, expect, it, vi } from "vitest";

// The root layout is imported for its `metadata` alone; next/font/google is a
// build-time loader that does not run under vitest (same stub as
// fiche-seo-baseline.test.ts).
vi.mock("next/font/google", () => {
  const fontLoader = () => ({
    variable: "--font-stub",
    className: "font-stub",
  });
  return {
    Fraunces: fontLoader,
    JetBrains_Mono: fontLoader,
    Nunito_Sans: fontLoader,
  };
});

import { OG_DESCRIPTION } from "@/lib/brand";
import { translations } from "@/lib/translations";
import { metadata } from "@/app/layout";

/**
 * Every sentence whose job is to say what the atlas contains, to a reader who
 * has not arrived yet: the meta description a search engine prints, the
 * OpenGraph blurb a shared link previews, and the subtitle drawn *into* the
 * social card images (opengraph-image.tsx, twitter-image.tsx).
 */
const descriptions = () => [
  ["metadata.description", String(metadata.description ?? "")],
  ["OG_DESCRIPTION", OG_DESCRIPTION],
  ["translations.fr.subtitle", translations.fr.subtitle],
];

describe("what the site says it contains, before anyone arrives", () => {
  // These three strings are the meta description, the social-card blurb and
  // their translation entry: what a search engine prints and what a shared
  // link previews. They used to enumerate the six corpus classes; the
  // 2026-09-22 editorial plan (B3) replaced the inventory with the promise —
  // the four kinds of name a reader arrives with, and the sources behind each
  // history. An enumeration of classes is the retired encyclopaedia register.
  // @req REQ-019
  it("names the four kinds of name a reader arrives with, and the sources", () => {
    for (const [label, description] of descriptions()) {
      const folded = description.toLowerCase();
      for (const kind of ["noms de famille", "peuples", "langues", "lieux"]) {
        expect(folded, `${label} omits ${kind}`).toContain(kind);
      }
      expect(folded, `${label} omits the sources`).toMatch(/\bsources?\b/);
      expect(folded, `${label} omits the history`).toContain("histoire");
    }
  });

  // A description that states a count states it about a corpus that moves.
  // These said "55 pays africains" while afrik_countries held 54 and the rest
  // of the product said 54 in six other places; the enumeration above already
  // says "pays", so the figure was carrying no meaning it could get wrong.
  // @req REQ-019
  it("promises no figure the corpus has to keep up with", () => {
    for (const [label, description] of descriptions()) {
      expect(description, `${label} states a count`).not.toMatch(/\d/);
    }
  });
});
