import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeFicheView } from "@/components/patronymes/PatronymeFicheView";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import { modelChapterKeys } from "@/lib/fieldProvenance";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";

/**
 * The net the name fiche never had (atlas charter §4).
 *
 * Its absence is what let the front end drift onto a vocabulary the corpus
 * never wrote — `attestedForms` for `spellings`, a phantom `filiationClaims`,
 * an `origin.originType` that does not exist — while three chapters of the
 * model had no section at all and `sources`, filled on 30 dossiers out of 30,
 * reached no screen.
 */

/** PAT_CAMARA as the corpus actually holds it: filled, empty, and explained. */
const camara: PublicPatronyme = {
  id: "PAT_CAMARA",
  nameMain: "Camara",
  nameSystem: "clan_name",
  casteOrSocialFunction: null,
  associatedPeoples: [],
  associatedCountries: [],
  bearers: [],
  namedBearers: [],
  alliances: [],
  content: {
    nameMain: "Camara",
    nameSystem: "clan_name",
    spellings: [
      {
        spelling: "Camara",
        attestations: [
          { countryId: "LBR", sourceRefs: ["corpus-ppl-vai-organisation"] },
          { countryId: "SLE", sourceRefs: ["corpus-ppl-vai-organisation"] },
        ],
      },
    ],
    designatedSocialUnit: "clan",
    origin: {
      oralTraditions: [],
      writtenChronicles: [],
      linguisticReconstructions: [],
    },
    alliances: [],
    casteOrSocialFunction: null,
    bearers: [],
    homonyms: [],
    sources: [
      {
        sourceKey: "corpus-ppl-vai-organisation",
        title: "Fiche PPL_VAI — organisation sociale",
        url: null,
        tier: "referenced",
        source_kind: "corpus",
        notes: "Passage clanique de la fiche peuple.",
      },
    ],
    gaps: [
      {
        fieldPath: "transmissionMode",
        reason: "Le passage ne précise pas le mode de transmission du nom.",
      },
      {
        fieldPath: "origin",
        reason:
          "Le passage ne documente aucune origine orale, écrite ou linguistique du nom.",
      },
      {
        fieldPath: "alliances",
        reason:
          "Aucune alliance entre patronymes n'est documentée dans le passage.",
      },
      {
        fieldPath: "casteOrSocialFunction",
        reason:
          "Aucune fonction sociale propre à ce nom n'est établie au niveau du claim.",
      },
      {
        fieldPath: "bearers",
        reason:
          "Aucun porteur décédé vérifiable n'est documenté dans le passage.",
      },
      {
        fieldPath: "homonyms",
        reason: "Aucun homonyme distinct n'est documenté dans le passage.",
      },
    ],
  },
};

const CHAPTER_TITLES = [
  "Le nom",
  "Origine",
  "Peuples et pays concernés",
  "Alliances",
  "Porteurs et porteuses",
  "Sources",
];

describe("name fiche charter — the chapter list is the model's", () => {
  // @req REQ-133
  it("keeps every chapter, including the four that had no section at all", () => {
    render(<PatronymeFicheView language="fr" patronyme={camara} />);

    for (const title of CHAPTER_TITLES) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
  });

  // @req REQ-133
  it("names each added chapter as a field of the strict model", () => {
    const declared = modelChapterKeys("name");

    for (const key of ["alliances", "homonyms", "sources", "bearers"]) {
      expect(declared).toContain(key);
    }
  });

  // @req REQ-133
  it("publishes the sources anchor every citation chip points at", () => {
    const { container } = render(
      <PatronymeFicheView language="fr" patronyme={camara} />
    );

    // Dead on every name fiche until now: the view had no Sources section.
    expect(container.querySelector("#sources")).not.toBeNull();
    expect(
      screen.getAllByText("Fiche PPL_VAI — organisation sociale").length
    ).toBeGreaterThan(0);
  });
});

describe("name fiche charter — the corpus explains its own silences", () => {
  // @req REQ-133
  it("does not print the editor's internal gap reasons as page copy", () => {
    render(<PatronymeFicheView language="fr" patronyme={camara} />);

    for (const reason of [
      "Le passage ne précise pas le mode de transmission du nom.",
      "Aucun homonyme distinct n'est documenté dans le passage.",
    ]) {
      expect(screen.queryByText(reason)).not.toBeInTheDocument();
    }
  });

  // @req REQ-133
  it("renders the spellings, the richest field the name corpus has", () => {
    render(<PatronymeFicheView language="fr" patronyme={camara} />);

    // Present on 30 dossiers out of 30, rendered on none: the view read
    // `attestedForms`, a key no model and no dossier has ever carried.
    expect(screen.getByText("Camara")).toBeInTheDocument();
    expect(
      screen.getByText(/attestée dans ces pays : Liberia, Sierra Leone/)
    ).toBeInTheDocument();
  });

  // @req REQ-133
  it("falls back to the generic badge only where no reason was written", () => {
    render(
      <PatronymeFicheView
        language="fr"
        patronyme={{ ...camara, content: { ...camara.content, gaps: [] } }}
      />
    );

    expect(screen.getAllByText("Information manquante").length).toBeGreaterThan(
      0
    );
  });
});

describe("name fiche closing — sources, silences and the next name", () => {
  // @req REQ-198
  it("shows source accounts, documented silences and a folded bibliography", () => {
    const patronyme: PublicPatronyme = {
      ...camara,
      nameHistory: {
        summary: "Le nom Camara est attesté dans plusieurs pays.",
        originExplained: false,
        names: [
          {
            nameText: "Camara",
            nameStatus: "current",
            selfGiven: true,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: { from: null, to: null, label: "Usage contemporain" },
                statement: "Le nom est employé aujourd’hui.",
                sources: [
                  {
                    title: "Fiche PPL_VAI — organisation sociale",
                    author: "Équipe AFRIK",
                    year: null,
                    url: null,
                    tier: "referenced",
                    source_kind: "academic",
                  },
                ],
              },
            ],
          },
        ],
      } as NameHistory,
    };
    const { container } = render(
      <PatronymeFicheView language="fr" patronyme={patronyme} />
    );

    expect(
      screen.getByText(/mentionne ce nom, sans en expliquer l’origine/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aucune source n’explique l’origine du nom Camara.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ce que nous ne savons pas encore" })
    ).toBeInTheDocument();
    expect(
      container.querySelector("#sources details > summary")?.textContent
    ).toContain("La liste");
    expect(
      container
        .querySelector("[data-name-closing]")
        ?.compareDocumentPosition(container.querySelector("#sources")!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // @req REQ-133
  // @req REQ-198
  it("points from Origine to the name history's sources and keeps the other fiche links", () => {
    const patronyme: PublicPatronyme = {
      ...camara,
      id: "PAT_TRAORE",
      nameMain: "Traore",
      content: {
        ...camara.content,
        origin: {
          oralTraditions: [{ claim: "Récit oral attesté." }],
          writtenChronicles: [{ claim: "Chronique écrite attestée." }],
          historicalSyntheses: [{ claim: "Synthèse historique attestée." }],
          linguisticReconstructions: [
            { claim: "Reconstruction linguistique attestée." },
          ],
        },
        homonyms: [],
        gaps: [{ fieldPath: "homonyms", reason: "Internal note." }],
      },
      alliances: ["Diarra", "Diop", "Koné", "Touré", "Condé", "Diawara"].map(
        (name, index) => ({
          targetId: `PAT_${index}`,
          targetNameMain: name,
          allianceType: "sanankuya",
        })
      ),
      nameHistory: {
        summary: "Le nom Traoré est attesté.",
        names: [
          {
            nameText: "Traoré",
            nameStatus: "current",
            selfGiven: true,
            languageOfOrigin: null,
            namedBy: null,
            accounts: [
              {
                period: { from: 1900, to: 1900, label: "1900" },
                statement: "Le nom est attesté.",
                birth: true,
                sources: [
                  {
                    title: "Source d’histoire",
                    author: "Auteur",
                    year: 1900,
                    url: null,
                    tier: "referenced",
                    source_kind: "academic",
                  },
                ],
              },
            ],
          },
        ],
      } as NameHistory,
    };
    const { container } = render(
      <PatronymeFicheView
        language="fr"
        patronyme={patronyme}
        nextSteps={[
          {
            relation: "patronyme",
            kind: "Nom de famille",
            name: "Diarra",
            reason: "Le nom Diarra est documenté.",
          },
          {
            relation: "patronyme",
            kind: "Nom de famille",
            name: "Diop",
            reason: "Le nom Diop est documenté.",
          },
          {
            relation: "patronyme",
            kind: "Nom de famille",
            name: "Touré",
            reason: "Le nom Touré est documenté.",
          },
          {
            relation: "patronyme",
            kind: "Nom de famille",
            name: "Diawara",
            reason: "Le nom Diawara est documenté.",
          },
        ]}
      />
    );

    expect(
      screen.getByText(
        "Les récits sur l’origine de ce nom sont présentés dans l’histoire du nom, avec leurs sources."
      )
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-form-readings]")).toHaveLength(0);
    expect(screen.queryByText("Récit oral attesté.")).toBeNull();
    expect(screen.getByText(/Les six pactes de ce nom/)).toBeInTheDocument();
    expect(container.querySelectorAll("[data-name-next] a")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: "Lire l’histoire du nom Traoré" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/du plus récent au plus ancien/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Homonymes" })).toBeNull();
    expect(
      screen.getByText(
        "Le projet ne documente pas encore les autres noms de même forme."
      )
    ).toBeInTheDocument();
  });
});
