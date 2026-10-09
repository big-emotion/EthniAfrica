import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PeopleDetailViewV2 } from "@/components/people/PeopleDetailViewV2";
import { PeopleFicheTitle } from "@/components/people/PeopleFicheTitle";
import { FicheSection } from "@/components/fiche/FicheSection";
import type { PeopleDetail } from "@/types/afrik-frontend";
import type { PeopleNamesDossier } from "@/api/v2/schemas/names";

/**
 * The people fiche's parity contract, held against the mockup at
 * docs/design/mockups/pages/peuple.html.
 *
 * Named "charter" so scripts/charterContractManifest.ts picks it up: the
 * aggregate suite is its own CI step, which makes a regression here read as
 * "charter contract suite failed" rather than hiding in the generic run.
 *
 * It is measured on the three regimes the corpus actually has, because they
 * render different fiches. The mockup was drawn on a five-country people; half
 * the corpus declares one country and gets neither picker nor share bar, and
 * PPL_BANTU stacks 21. A pass on the middle case says nothing about the edges,
 * which is how the previous plan for this surface was built on a premise
 * nobody had recounted.
 */
function peopleWith(
  countries: Array<{ country: string; population: number }>
): PeopleDetail {
  return {
    id: "PPL_SAMPLE",
    nameMain: "Échantillon",
    languageFamilyId: "FLG_BANTU",
    languageFamilyName: "Bantu",
    currentCountries: countries.map((entry) => entry.country),
    appellations: {
      mainName: "Échantillon",
      selfAppellation: "Autonyme",
      exonyms: ["Exonyme colonial"],
      whyProblematic: "Pourquoi ce nom pose problème.",
      ethnoLinguisticGroup: "Volta-Congo",
      historicalRegion: "Région historique déclarée",
    },
    languages: { mainLanguage: "Langue", isoCodes: ["xxx"], dialects: ["A"] },
    origins: { ancientOrigins: "Origines déclarées." },
    demography: {
      totalPopulation: countries.reduce((sum, e) => sum + e.population, 0),
      referenceYear: 2025,
      distributionByCountry: countries,
    },
    sources: [{ title: "Source", url: null, tier: "official" }],
  };
}

const REGIMES = [
  {
    label: "one country — half the corpus",
    people: peopleWith([{ country: "NGA", population: 45500000 }]),
    presenceCount: 1,
  },
  {
    label: "five countries — the mockup's own sample",
    people: peopleWith([
      { country: "NGA", population: 45500000 },
      { country: "BEN", population: 1800000 },
      { country: "TGO", population: 450000 },
      { country: "GHA", population: 150000 },
      { country: "SLE", population: 7300 },
    ]),
    presenceCount: 5,
  },
  {
    label: "21 countries — the widest field in the corpus",
    people: peopleWith(
      [
        "NGA",
        "BEN",
        "TGO",
        "GHA",
        "CMR",
        "COD",
        "AGO",
        "ZMB",
        "TZA",
        "KEN",
        "UGA",
        "RWA",
        "BDI",
        "MWI",
        "MOZ",
        "ZWE",
        "BWA",
        "NAM",
        "ZAF",
        "COG",
        "GAB",
      ].map((country, index) => ({
        country,
        population: 1000000 - index * 1000,
      }))
    ),
    presenceCount: 21,
  },
];

describe("people fiche parity with the mockup", () => {
  afterEach(cleanup);

  for (const regime of REGIMES) {
    // @req REQ-155
    it(`renders the nine chapters in order on ${regime.label}`, () => {
      const { container } = render(
        <PeopleDetailViewV2
          language="fr"
          people={regime.people}
          onward={<FicheSection title="Poursuivre">Suite</FicheSection>}
        />
      );

      const sections = [
        ...container.querySelectorAll("[data-fiche-section]"),
      ].map((node) => node.getAttribute("data-fiche-section"));

      // DEC-068: the document opens on the answer card, then every other
      // name; where the people lives is context that follows. No summary
      // chapter repeats the head's counts (REQ-151).
      expect(sections).toEqual([
        "D'où vient le nom ?",
        "Les autres noms",
        "Où vit ce peuple",
        "Langue",
        "Histoire",
        "Noms de personnes rattachés à ce peuple",
        "Culture et société",
        "Poursuivre",
        "Sources",
      ]);
    });

    // The count lives in the fiche's head, which now stands above the globe
    // rather than inside the parchment — so it is PeopleFicheTitle that must
    // state it, and this asserts the page still does.
    // @req REQ-115
    it(`counts the presence countries the globe draws on ${regime.label}`, () => {
      render(<PeopleFicheTitle language="fr" people={regime.people} />);

      expect(
        screen.getByText(`${regime.presenceCount} pays de présence`)
      ).toBeInTheDocument();
    });

    // The hard rule the charter calls hard: a people never receives a closed
    // line. The legend is prose and a list, and it must stay that way — a
    // swatch drawn as a stroked shape would be the first edge on the page.
    // @req REQ-116
    it(`draws no closed outline anywhere on ${regime.label}`, () => {
      const { container } = render(
        <PeopleDetailViewV2 language="fr" people={regime.people} />
      );

      expect(container.querySelector("polygon")).toBeNull();
      expect(container.querySelector("path[stroke]")).toBeNull();
    });
  }

  // @req REQ-155
  it("draws a derived share from row populations and preserves a declared share", () => {
    const people = peopleWith([
      { country: "BDI", population: 12_200_000 },
      { country: "RWA", population: 5_865_000 },
    ]);
    people.demography!.distributionByCountry![1].percentage = 32;
    const { container } = render(
      <PeopleDetailViewV2 language="fr" people={people} />
    );
    const distribution = container.querySelector(
      '[data-fiche-section="Où vit ce peuple"]'
    );
    expect(distribution?.textContent).toContain("67,5");
    expect(
      distribution?.querySelectorAll('[aria-label*="Information obtenue"]')
    ).toHaveLength(1);
    expect(distribution?.textContent).toContain("32");
  });

  // @req REQ-155
  it("states a divergent declared total without turning it into a share denominator", () => {
    const people = peopleWith([
      { country: "BDI", population: 12_200_000 },
      { country: "RWA", population: 5_865_000 },
    ]);
    people.demography!.totalPopulation = 10_500_000;
    const { container } = render(
      <PeopleDetailViewV2 language="fr" people={people} />
    );
    // REQ-155 (DEC-068): with no summary chapter, the disagreement is stated
    // where the shares are drawn.
    const summary = container.querySelector(
      '[data-fiche-section="Où vit ce peuple"]'
    );
    expect(summary?.textContent).toContain("10 500 000");
    expect(summary?.textContent).toContain("18 065 000");
    expect(summary?.textContent).not.toContain("116 %");
  });

  // @req REQ-151
  it("uses the resolved family name in the language chapter", () => {
    const people = peopleWith([{ country: "BDI", population: 1000 }]);
    people.languageFamilyName = undefined;
    const { container } = render(
      <PeopleDetailViewV2
        language="fr"
        people={people}
        resolvedFamilyName="Bantou"
      />
    );
    expect(
      container.querySelector('[data-fiche-section="Langue"]')?.textContent
    ).toContain("Bantou");
  });

  // 316 fiches carry no whyProblematic and 4 record no exonym. The mockup
  // renders both unconditionally; the corpus cannot.
  // @req REQ-115
  it("never prints a heading the fiche has nothing to put under", () => {
    const bare = peopleWith([{ country: "NGA", population: 1000 }]);
    render(
      <PeopleDetailViewV2
        language="fr"
        people={{
          ...bare,
          appellations: {
            mainName: "Échantillon",
            selfAppellation: "Autonyme",
          },
        }}
      />
    );

    expect(screen.queryByText("Exonymes")).toBeNull();
    expect(screen.queryByText(/Pourquoi ces noms posent problème/)).toBeNull();
  });
});

/**
 * Charter §4 on the people fiche.
 *
 * The two granularities are deliberately not the same rule. A **chapter** of
 * the fiche model — origines, langue, rôle historique, culture… — is one every
 * fiche is structurally expected to fill, so its emptiness is a fact about the
 * corpus and the fiche states it. A **field inside a block**, like the exonyms
 * above, is optional by design, and marking it would report a gap the model
 * never opened.
 */
describe("people fiche — what the corpus does not fill", () => {
  afterEach(cleanup);

  /** A fiche carrying its appellations and nothing else the model asks for. */
  function bareFiche(): PeopleDetail {
    const people = peopleWith([{ country: "NGA", population: 1000 }]);
    return {
      ...people,
      origins: undefined,
      languages: undefined,
      culture: undefined,
      historicalRole: undefined,
      organization: undefined,
    } as PeopleDetail;
  }

  // @req REQ-119
  it("keeps every chapter of the model, filled or not", () => {
    const { container } = render(
      <PeopleDetailViewV2 language="fr" people={bareFiche()} />
    );

    const chapters = [
      ...container.querySelectorAll("[data-fiche-section]"),
    ].map((node) => node.getAttribute("data-fiche-section"));

    expect(chapters).toContain("Histoire");
    expect(chapters).toContain("Langue");
    expect(chapters).toContain("Culture et société");
  });

  // @req REQ-119
  it("marks each unfilled chapter as a gap in the corpus", () => {
    const { container } = render(
      <PeopleDetailViewV2 language="fr" people={bareFiche()} />
    );

    const textOf = (title: string) =>
      container.querySelector(`[data-fiche-section="${title}"]`)?.textContent ??
      "";

    expect(textOf("Histoire")).toContain("Information manquante");
    expect(textOf("Langue")).toContain("Information manquante");
    expect(textOf("Culture et société")).toContain("Information manquante");
  });

  // A marker beside a value the fiche does declare would report a gap that is
  // not there — the failure charter §4 was rewritten after.
  // @req REQ-119
  it("marks nothing on a chapter the fiche does fill", () => {
    const { container } = render(
      <PeopleDetailViewV2
        language="fr"
        people={peopleWith([{ country: "NGA", population: 1000 }])}
      />
    );

    expect(
      container.querySelector('[data-fiche-section="Langue"]')?.textContent
    ).not.toContain("Information manquante");
  });

  // Fragmentation is not a rubric of the model: it exists only where a people
  // straddles two countries. Absent below that, it is inapplicable, not
  // missing, and marking it would invent a gap.
  // @req REQ-119
  it("prints no chapter for what the model never asked for", () => {
    const { container } = render(
      <PeopleDetailViewV2 language="fr" people={bareFiche()} />
    );

    const chapters = [
      ...container.querySelectorAll("[data-fiche-section]"),
    ].map((node) => node.getAttribute("data-fiche-section"));

    expect(chapters).not.toContain("Fragmentation coloniale");
  });

  // @req REQ-119
  it("prints no field path in its provenance notes", () => {
    const { container } = render(
      <PeopleDetailViewV2 language="fr" people={bareFiche()} />
    );

    const notes = Array.from(
      container.querySelectorAll(".afh-parchment-note")
    ).map((node) => node.textContent ?? "");

    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes)
      expect(note).not.toMatch(/[a-z][A-Za-z0-9]*\.[a-zA-Z]/);
  });
});

describe("people fiche — the answer card (DEC-068)", () => {
  afterEach(cleanup);

  const people = peopleWith([{ country: "SEN", population: 1000000 }]);

  function sectionsOf(container: HTMLElement) {
    return [...container.querySelectorAll("[data-fiche-section]")].map((node) =>
      node.getAttribute("data-fiche-section")
    );
  }

  // @req REQ-155
  it("puts the related peoples after where the people lives, and moves them out of culture", () => {
    const { container } = render(
      <PeopleDetailViewV2
        language="fr"
        people={{
          ...people,
          historicalRole: {
            relationsWithNeighbors: "Les Wolof les nomment Pël.",
          },
        }}
      />
    );

    expect(sectionsOf(container).slice(0, 4)).toEqual([
      "D'où vient le nom ?",
      "Les autres noms",
      "Où vit ce peuple",
      "Peuples liés",
    ]);
    const culture = container.querySelector(
      '[data-fiche-section="Culture et société"]'
    );
    expect(culture?.textContent ?? "").not.toContain("Les Wolof les nomment");
  });

  const source = (
    title: string,
    tier: "official" | "referenced" | "unverified"
  ) => ({
    title,
    author: "Auteur",
    year: 1985,
    url: "https://example.org",
    tier,
  });

  const blank = {
    meaning: null,
    periodLabel: null,
    imposition: null,
    sources: [
      { id: "s-1", title: "S", url: null, year: 1985, tier: "official" },
    ],
    confidence: null,
    attestations: [],
    shortLine: null,
    namedBy: null,
    originDebated: false,
    usedIn: [],
    pronunciation: null,
  };

  // The fiche reads the API's dossier (GET /v2/peoples/{id}/names), not the
  // corpus file.
  const dossier: PeopleNamesDossier = {
    peopleId: "PPL_SAMPLE",
    autonym: "Fulɓe",
    names: [
      {
        ...blank,
        id: "nr-1",
        nameText: "Fulɓe",
        nameType: "endonym",
        languageOfOrigin: "ful",
        assertionId: "a-1",
        shortLine: "Le nom qu'ils se donnent, dans leur langue.",
        originDebated: true,
        meaning: "Deux pistes sur le sens, aucune retenue.",
        pronunciation: {
          respelling: "foul-bé",
          audio: null,
          source: source("Guide", "referenced"),
        },
      },
      {
        ...blank,
        id: "nr-2",
        nameText: "Peul",
        nameType: "exonym",
        languageOfOrigin: "wol",
        assertionId: "a-2",
        namedBy: "les Wolof",
        usedIn: ["fra"],
        attestations: [
          {
            formAsWritten: "Peuls ou Peulhs",
            year: null,
            periodLabel: "rapporté dans un article de 1966",
            attestedBy: "Amadou Hampâté Bâ",
            source: { ...source("Abbia", "referenced"), page: "p. 23" },
          },
        ],
      },
      {
        ...blank,
        id: "nr-3",
        nameText: "Fulɓe",
        nameType: "historical_spelling",
        languageOfOrigin: null,
        assertionId: "a-3",
      },
      {
        ...blank,
        id: "nr-4",
        nameText: "Toucouleur",
        nameType: "exonym",
        languageOfOrigin: null,
        assertionId: "a-4",
        originDebated: true,
        imposition: {
          imposedBy: "Ethnographes coloniaux",
          impositionPeriod: null,
          whyProblematic: "Une ethnie séparée par classement.",
          contemporaryUsage: null,
        },
      },
    ],
  };

  function renderWithDossier() {
    return render(
      <PeopleDetailViewV2
        language="fr"
        people={people}
        namesDossier={dossier}
      />
    );
  }

  // @req REQ-190
  it("opens on the self-name, its pronunciation and one sentence", () => {
    const { container } = renderWithDossier();

    const card = container.querySelector(
      '[data-fiche-section="D\'où vient le nom ?"]'
    )!;
    expect(card.querySelector("[data-self-name]")?.textContent).toBe("Fulɓe");
    // A `lang` attribute takes the BCP 47 tag, not the corpus's ISO 639-3
    // code: axe refuses `lang="wol"` (valid-lang), and accepts `wo`.
    expect(
      container
        .querySelector('[data-name-row="Peul"] [data-name-form]')
        ?.getAttribute("lang")
    ).toBe("wo");
    expect(card.querySelector("[data-self-name]")?.getAttribute("lang")).toBe(
      "ff"
    );
    expect(card.textContent).toContain("foul-bé");
    expect(card.textContent).toContain(
      "Le nom qu'ils se donnent, dans leur langue."
    );
    // No recording, no play button.
    expect(card.querySelector("button[data-listen]")).toBeNull();
  });

  // @req REQ-190
  it("shows every form once", () => {
    const { container } = renderWithDossier();

    const forms = [...container.querySelectorAll("[data-name-form]")].map(
      (node) => node.textContent
    );
    expect(forms).toEqual(["Fulɓe", "Peul", "Toucouleur"]);
  });

  // @req REQ-190
  it("carries each status as a badge with an icon and a word", () => {
    const { container } = renderWithDossier();

    const badgesOf = (form: string) =>
      [
        ...(container
          .querySelector(`[data-name-row="${form}"]`)
          ?.querySelectorAll("[data-badge]") ?? []),
      ].map((badge) => ({
        word: badge.textContent,
        icon: Boolean(badge.querySelector("svg")),
      }));

    expect(badgesOf("Peul")).toEqual([
      { word: "Donné de l'extérieur", icon: true },
      { word: "En français", icon: true },
    ]);
    expect(badgesOf("Toucouleur").map((badge) => badge.word)).toEqual([
      "Imposé",
      "Origine débattue",
    ]);
  });

  // @req REQ-190
  it("justifies nothing above the sources: no tier label, no « non daté »", () => {
    const { container } = renderWithDossier();

    const flow = [...container.querySelectorAll("[data-fiche-section]")]
      .filter((node) => node.getAttribute("data-fiche-section") !== "Sources")
      .map((node) => node.textContent ?? "")
      .join(" ");
    expect(flow).not.toMatch(/Niveau de source|Source officielle|Référencée/);
    expect(flow.toLowerCase()).not.toContain("non daté");
    expect(
      container.querySelector('[data-testid="fiche-summary-fact"]')
    ).toBeNull();
  });

  // The stylesheet holds what the one face means (peopleOneFaceCharter); this
  // holds that the fiche opts into it.
  // @req REQ-190
  it("opts the fiche's text into the one-face rule", () => {
    const { container } = renderWithDossier();

    expect(container.querySelector("#fiche")?.classList).toContain(
      "afh-one-face"
    );
  });

  // @req REQ-189
  it("keeps a form's written traces one tap away, with their page", () => {
    const { container } = renderWithDossier();

    const traces = container.querySelector('[data-name-row="Peul"] details');
    expect(traces?.textContent).toContain("Peuls ou Peulhs");
    expect(traces?.textContent).toContain("p. 23");
    expect(traces?.hasAttribute("open")).toBe(false);
  });
});
