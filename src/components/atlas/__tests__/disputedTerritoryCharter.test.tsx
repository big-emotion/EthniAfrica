import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { AtlasGlobe } from "@/components/atlas/AtlasGlobe";
import {
  getAdmin0Rings,
  buildCountryOutlineOverlay,
} from "@/lib/atlas/overlays";
import type { LonLat, Ring } from "@/lib/atlas/overlays";
import { countryCopy } from "@/lib/i18n/copy/country";

/**
 * Atlas charter §1 — a territory whose extent is citable but whose sovereignty
 * is not receives the closed trace without the fill.
 *
 * The failure this prevents was reported by a reader on 2026-09-08 (flag
 * 00EZK83QDV): the globe drew Morocco swallowing Western Sahara, so the atlas
 * settled a contested sovereignty in silence, on a surface whose whole argument
 * is provenance.
 *
 * The cause was upstream. Natural Earth's admin-0 layer encodes *de facto*
 * control rather than territory: it splits Western Sahara along the Moroccan
 * berm, giving El Aaiún and Smara to `MAR` and keeping only the Free Zone as
 * `SAH`. Copying it verbatim published a military line as if it were an
 * administrative border.
 *
 * The line this asset draws instead is the territory's own, and it is citable:
 * the 1912 Franco-Spanish convention bounds it at the 27°40′N parallel out to
 * 8°40′W, which is also the extent the UN has listed since 1963. So the trace
 * closes — a dash would claim the outline was reconstructed, which is the
 * family encoding's meaning and would be a different, false statement.
 *
 * What no source supports is a *state* filling it, so the fill is what goes.
 */

/** Ray casting, even-odd. The rings are small and planar enough for a membership test. */
function ringContains(ring: Ring, point: LonLat): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    const straddles = a.lat > point.lat !== b.lat > point.lat;
    if (
      straddles &&
      point.lon <
        ((b.lon - a.lon) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lon
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function covers(countryId: string, point: LonLat): boolean {
  const rings = getAdmin0Rings(countryId);
  if (!rings) return false;
  return rings.some((ring) => ringContains(ring, point));
}

/**
 * Towns inside Western Sahara, deliberately spread across the berm Natural
 * Earth splits on: the first three sit in the Moroccan-controlled west, which
 * upstream hands to `MAR`, the last three in the Free Zone it keeps as `SAH`.
 * Asserting both halves is what proves the military line is gone rather than
 * merely moved.
 *
 * Dakhla is absent on purpose. It sits on the Río de Oro peninsula, which the
 * 1:50m coastline generalises away upstream — at full Natural Earth resolution
 * the town falls inside no feature at all — so it would test the coastline's
 * fidelity, not this asset's sovereignty claim.
 */
const SAHRAWI_TOWNS: Record<string, LonLat> = {
  "El Aaiún": { lon: -13.2, lat: 27.15 },
  Smara: { lon: -11.67, lat: 26.74 },
  "Bou Craa": { lon: -12.87, lat: 26.33 },
  Tifariti: { lon: -10.57, lat: 26.09 },
  "Bir Lehlou": { lon: -9.65, lat: 26.32 },
  "Bir Gandouz": { lon: -14.5, lat: 21.6 },
};

/** Towns unambiguously in Morocco proper, north of the 27°40′N parallel. */
const MOROCCAN_TOWNS: Record<string, LonLat> = {
  Rabat: { lon: -6.84, lat: 34.02 },
  Agadir: { lon: -9.6, lat: 30.42 },
  Marrakech: { lon: -7.98, lat: 31.63 },
  "Tan-Tan": { lon: -11.1, lat: 28.44 },
};

describe("atlas charter §1 — Western Sahara is not drawn inside Morocco", () => {
  for (const [town, point] of Object.entries(SAHRAWI_TOWNS)) {
    // @req REQ-116
    it(`does not draw ${town} inside Morocco`, () => {
      expect(covers("MAR", point)).toBe(false);
    });

    // @req REQ-116
    it(`draws ${town} inside the Western Sahara outline`, () => {
      expect(covers("ESH", point)).toBe(true);
    });
  }

  for (const [town, point] of Object.entries(MOROCCAN_TOWNS)) {
    // @req REQ-116
    it(`still draws ${town} inside Morocco`, () => {
      expect(covers("MAR", point)).toBe(true);
    });
  }

  // @req REQ-116
  it("resolves the territory under its ISO code as well as the asset's key", () => {
    expect(getAdmin0Rings("ESH")).toEqual(getAdmin0Rings("SAH"));
  });
});

describe("atlas charter §1 — the contested encoding keeps the trace, drops the fill", () => {
  // @req REQ-116
  it("gives Western Sahara a closed outline", () => {
    const overlay = buildCountryOutlineOverlay("ESH");
    expect(overlay?.rings.length).toBeGreaterThan(0);
  });

  // @req REQ-116
  it("leaves Western Sahara unfilled, because no recognised sovereignty fills it", () => {
    const overlay = buildCountryOutlineOverlay("ESH");
    expect(overlay?.fillOpacity).toBe(0);
    expect(overlay?.sovereigntyContested).toBe(true);
  });

  // @req REQ-116
  it("still fills a country whose sovereignty no source contests", () => {
    const overlay = buildCountryOutlineOverlay("MAR");
    expect(overlay?.fillOpacity).toBeGreaterThan(0);
    expect(overlay?.sovereigntyContested).toBe(false);
  });
});

describe("atlas charter §1 — the reason is stated once, next to the mark", () => {
  // @req REQ-116
  it("names both institutions in French, without reconciling them", () => {
    const { body } = countryCopy.fr.atlas.disputedStatus;
    expect(body).toContain("ONU");
    expect(body).toContain("Union africaine");
    expect(body).toContain("1963");
    expect(body).toContain("1976");
  });

  // @req REQ-116
  it("names both institutions in English, without reconciling them", () => {
    const { body } = countryCopy.en.atlas.disputedStatus;
    expect(body).toContain("United Nations");
    expect(body).toContain("African Union");
    expect(body).toContain("1963");
    expect(body).toContain("1976");
  });

  // @req REQ-116
  it("explains the empty fill, so a reader does not read it as a rendering fault", () => {
    for (const locale of ["fr", "en"] as const) {
      expect(
        countryCopy[locale].atlas.disputedStatus.encoding.length
      ).toBeGreaterThan(0);
    }
  });
});

describe("atlas charter §1 — the note travels with the mark", () => {
  // @req REQ-116
  it("states the contested status beside a contested outline", () => {
    render(
      <AtlasGlobe
        overlay={buildCountryOutlineOverlay("ESH")!}
        missingMessage="n/a"
      />
    );
    const note = document.querySelector("[data-atlas-disputed-status]");
    expect(note?.textContent).toContain("ONU");
    expect(note?.textContent).toContain("Union africaine");
  });

  // @req REQ-116
  it("says nothing of the kind beside an uncontested country", () => {
    render(
      <AtlasGlobe
        overlay={buildCountryOutlineOverlay("MAR")!}
        missingMessage="n/a"
      />
    );
    expect(document.querySelector("[data-atlas-disputed-status]")).toBeNull();
  });
});
