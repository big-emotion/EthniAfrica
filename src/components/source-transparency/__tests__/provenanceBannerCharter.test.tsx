import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProvenanceBanner } from "../ProvenanceBanner";
import { CountryParchment } from "@/components/country/CountryParchment";
import { LanguageFamilyDetailViewV2 } from "@/components/family/LanguageFamilyDetailViewV2";
import { LanguageDetailViewV2 } from "@/components/language/LanguageDetailViewV2";
import { transformCountryData } from "@/lib/countryDataTransformer";
import type { CountryDetail } from "@/types/afrik-frontend";
import type { LanguagePageData } from "@/lib/languageDataTransformer";
import type { ProvenanceCensus } from "@/api/v2/schemas/confidence";

/**
 * The atlas charter §8 contract, held here rather than trusted.
 *
 * Every assertion below cites the failure it prevents. The measured one that
 * started it: `ConfidenceChip` was rendered by four components on the peoples
 * surface and one on the patronymes surface, and by zero on countries, zero on
 * language families and zero on languages — the three surfaces a search engine
 * lands on first, on an atlas whose brand charter asserts that every claim
 * carries its provenance.
 */

function census(
  standings: Partial<ProvenanceCensus["standings"]> = {}
): ProvenanceCensus {
  const resolved = {
    official: 4,
    referenced: 11,
    unverified: 0,
    needs_review: 0,
    ...standings,
  };
  return {
    entityType: "country",
    entityId: "CIV",
    assertionCount: Object.values(resolved).reduce((a, b) => a + b, 0),
    standings: resolved,
    lastHumanAuditAt: "2026-03-12T00:00:00.000Z",
  };
}

const settled = census();
const weak = census({ unverified: 4, needs_review: 2 });

function banner(): HTMLElement {
  return screen.getByRole("region", { name: /provenance/i });
}

const GOLD_GROUND = "--afh-color-gold-bg";

describe("the provenance banner charter (atlas charter §8)", () => {
  // A single figure at the head of a fiche averages an identity chapter
  // resting on official sources with an oral-tradition chapter resting on
  // unverified ones. It describes neither, and it is the only number the
  // reader carries away.
  // @req REQ-019
  it("prints no percentage and no aggregate score, in either state", () => {
    for (const state of [settled, weak]) {
      const { unmount } = render(
        <ProvenanceBanner language="fr" census={state} />
      );
      expect(banner().textContent).not.toMatch(/%/);
      expect(banner().textContent).not.toMatch(/\/\s*(10|100)\b/);
      expect(banner().textContent).not.toMatch(/\b0[.,]\d/);
      unmount();
    }
  });

  // The actions charter licenses exactly one glyph, the arrow. An alert
  // pictogram over a community or oral account would reinstate in one icon
  // the colonial filter the tier policy exists to refuse.
  // @req REQ-019
  it("draws no icon, no glyph and no pictogram of its own", () => {
    render(<ProvenanceBanner language="fr" census={weak} />);

    expect(banner().querySelector("svg")).toBeNull();
    expect(banner().querySelector("img")).toBeNull();
    // The one arrow is the ActionLink's, and it is the only mark allowed.
    const marks = banner().textContent!.match(/[^\p{L}\p{N}\s·,.:'’()%+-]/gu);
    expect(marks ?? []).toEqual(["→"]);
  });

  // Doctrine §1.1: a fiche holding unverified assertions looks like any other
  // to the reader — the gold ground was a tier signal by another name.
  // @req REQ-092
  it("wears the same quiet ground whatever standings the fiche holds", () => {
    const { unmount } = render(
      <ProvenanceBanner language="fr" census={settled} />
    );
    const quiet = banner().className;
    unmount();

    render(<ProvenanceBanner language="fr" census={weak} />);
    expect(banner().className).toBe(quiet);
    expect(banner().className).not.toContain(GOLD_GROUND);
  });

  // Source apparatus takes `--afh-radius-0` (actions charter §6), and it is
  // bounded to the reading measure: stretched across a 720 px screen it reads
  // as a navigation bar, the one object readers have learned to skip.
  // @req REQ-019
  it("takes the apparatus radius and stays inside the reading measure", () => {
    render(<ProvenanceBanner language="fr" census={weak} />);

    expect(banner().className).toContain("--afh-radius-0");
    expect(banner().className).toContain("--afh-measure-prose");
  });

  // @req REQ-019
  it("states every colour it uses as a token, never as a literal", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/components/source-transparency/ProvenanceBanner.tsx"
      ),
      "utf8"
    );

    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/\brgba?\(/);
    expect(source).not.toMatch(/\bhsl\(var\(--/);
  });

  // The measured defect: zero components on each of these three surfaces.
  // @req REQ-019
  it("reaches the country, the language family and the language fiche", () => {
    const country = {
      id: "CIV",
      nameFr: "République de Côte d'Ivoire",
      nameCommonFr: "Côte d'Ivoire",
      nameOfficial: "République de Côte d'Ivoire",
      demographics: { peoples: [] },
      kingdoms: [],
      sources: [],
    } as unknown as CountryDetail;

    const tongue: LanguagePageData = {
      id: "bam",
      name: "Bambara",
      nameProvenance: "sourced",
      isoCode639_3: "bam",
      glottocode: "bamb1269",
      nameEn: "Bambara",
      alternateNames: [],
      spellingAliases: [],
      dialects: [],
      family: { id: "FLG_NIGER_CONGO", name: "Niger-Congo" },
      speakingPeoples: [],
      vehicularRole: null,
      vitalityStatus: null,
      sources: [],
    };

    const surfaces = [
      <CountryParchment
        key="country"
        language="fr"
        data={transformCountryData(country)}
        country={country}
        provenance={weak}
      />,
      <LanguageFamilyDetailViewV2
        key="family"
        language="fr"
        family={
          {
            id: "FLG_BENOUECONGO",
            nameFr: "Bénoué-Congo",
            nameEn: "Benue–Congo",
            content: {},
          } as never
        }
        provenance={weak}
      />,
      <LanguageDetailViewV2
        key="language"
        language="fr"
        data={tongue}
        provenance={weak}
      />,
    ];

    for (const surface of surfaces) {
      const { container, unmount } = render(surface);
      expect(
        container.querySelector(".afh-provenance-banner"),
        String(surface.key)
      ).not.toBeNull();
      unmount();
    }
  });
});
