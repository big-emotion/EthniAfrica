import { afterEach, describe, expect, it, vi } from "vitest";

import { CANONICAL_DOMAIN } from "@/lib/brand";
import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getPatronymeRoute,
  getPeopleLinksRoute,
  getPeopleRoute,
  getPlaceRoute,
} from "@/lib/routing";
import { ficheCanonical, type FicheKind } from "@/lib/seo/ficheCanonical";

/**
 * What a fiche says about itself to a crawler: an absolute canonical on the
 * live fiche, its robots directive and its Open Graph card.
 */

const BASE = `https://${CANONICAL_DOMAIN}`;

const ROUTES: Record<FicheKind, [id: string, route: typeof getPeopleRoute]> = {
  people: ["PPL_YORUBA", getPeopleRoute],
  country: ["BEN", getCountryRoute],
  family: ["FLG_BANTU", getFamilyRoute],
  language: ["yor", getLanguageRoute],
  name: ["PAT_KEITA", getPatronymeRoute],
  peopleLinks: ["PPL_YORUBA", getPeopleLinksRoute],
  place: ["LOC_GAGNOA", getPlaceRoute],
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ficheCanonical", () => {
  for (const [kind, [id, route]] of Object.entries(ROUTES) as [
    FicheKind,
    (typeof ROUTES)[FicheKind],
  ][]) {
    // @req REQ-091
    it(`declares the ${kind} fiche's canonical absolute, on the canonical domain`, async () => {
      const metadata = await ficheCanonical(kind, "fr", id);

      expect(metadata.alternates?.canonical).toBe(`${BASE}${route("fr", id)}`);
    });
  }

  // A pinned revision renders an archived copy of the same prose at a second
  // address; its canonical is the live fiche, never itself.
  // @req REQ-091
  it("drops a pinned or latest version suffix from the canonical", async () => {
    const pinned = await ficheCanonical("people", "fr", "PPL_YORUBA@v3");
    const latest = await ficheCanonical("people", "fr", "PPL_YORUBA@latest");

    expect(pinned.alternates?.canonical).toBe(
      `${BASE}${getPeopleRoute("fr", "PPL_YORUBA")}`
    );
    expect(latest.alternates?.canonical).toBe(pinned.alternates?.canonical);
  });

  // A 404 that claims a canonical is a 404 asking to be indexed.
  // @req REQ-091
  it("declares nothing for a slug that names no fiche", async () => {
    expect(await ficheCanonical("people", "fr", "PPL_YORUBA@V3")).toEqual({});
    expect(await ficheCanonical("people", "fr", "")).toEqual({});
  });

  // @req REQ-091
  it("keeps the identifier percent-encoded in the address", async () => {
    const metadata = await ficheCanonical("name", "fr", "PAT%20KEITA");

    expect(metadata.alternates?.canonical).toBe(
      `${BASE}${getPatronymeRoute("fr", "PAT%20KEITA")}`
    );
  });

  // @req REQ-141
  it("carries an Open Graph card in the locale the fiche was served in", async () => {
    const metadata = await ficheCanonical("language", "fr", "yor");

    expect(metadata.openGraph).toMatchObject({
      locale: "fr_FR",
      url: `${BASE}${getLanguageRoute("fr", "yor")}`,
    });
  });
});
