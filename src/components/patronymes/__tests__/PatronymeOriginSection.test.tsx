import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeOriginSection } from "@/components/patronymes/PatronymeOriginSection";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";

const base: PublicPatronyme = {
  id: "PAT_KEITA",
  nameMain: "Keïta",
  nameSystem: "totemic_clan",
  casteOrSocialFunction: null,
  content: {},
  associatedPeoples: [],
  associatedCountries: [],
  bearers: [],
  namedBearers: [],
  alliances: [],
};

describe("PatronymeOriginSection (REQ-133)", () => {
  // @req REQ-133
  it("keeps the chapter and marks it when the corpus documents no origin", () => {
    render(<PatronymeOriginSection language="fr" patronyme={base} />);

    // It used to return null here, which removed the chapter from the page
    // and from the rail — the rail reads its entries from the rendered DOM.
    expect(
      screen.getByRole("heading", { name: "Origine" })
    ).toBeInTheDocument();
    expect(screen.getByText("Donnée manquante")).toBeInTheDocument();
  });

  // @req REQ-133
  it("prints the editor's own reason where the dossier gives one", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            gaps: [
              {
                fieldPath: "origin",
                reason:
                  "Le passage ne documente aucune origine orale, écrite ou linguistique du nom.",
              },
            ],
          },
        }}
      />
    );

    expect(
      screen.getByText(
        "Le passage ne documente aucune origine orale, écrite ou linguistique du nom."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Donnée manquante")).not.toBeInTheDocument();
  });

  // @req REQ-133
  it("attributes an oral tradition to its griot rather than stating it flat", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              oralTraditions: [
                {
                  claim: "Le nom vient du Mandé.",
                  claimStatus: "contested",
                  griot: "Fadama Diarra",
                },
              ],
            },
          },
        }}
      />
    );

    expect(screen.getByText("Tradition orale")).toBeInTheDocument();
    expect(screen.getByText(/Le nom vient du Mandé/)).toBeInTheDocument();
    expect(
      screen.getByText(/Transmis par\s+Fadama Diarra/)
    ).toBeInTheDocument();
  });

  // @req REQ-133
  it("carries an oral tradition and a written chronicle side by side", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              oralTraditions: [{ claim: "Version griotique." }],
              writtenChronicles: [{ claim: "Version chroniquée." }],
            },
          },
        }}
      />
    );

    // Two testimonies about one name; neither is promoted over the other.
    expect(screen.getByText("Tradition orale")).toBeInTheDocument();
    expect(screen.getByText("Chronique écrite")).toBeInTheDocument();
    expect(screen.getByText(/Version griotique/)).toBeInTheDocument();
    expect(screen.getByText(/Version chroniquée/)).toBeInTheDocument();
  });

  // A historian's synthesis is labelled as one, never as a linguistic
  // reconstruction, and the accounts carried by the people come first.
  // @req REQ-133
  it("labels a historical synthesis as such and lists it after the oral and written accounts", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              oralTraditions: [{ claim: "Récit du griot." }],
              writtenChronicles: [{ claim: "Ouvrage en n'ko." }],
              historicalSyntheses: [{ claim: "Migration vers la côte." }],
              linguisticReconstructions: [{ claim: "Aucun sens connu." }],
            },
          },
        }}
      />
    );

    const labels = [
      "Tradition orale",
      "Chronique écrite",
      "Synthèse historique",
      "Reconstruction linguistique",
    ].map((label) => screen.getByText(label));
    for (let index = 1; index < labels.length; index += 1) {
      expect(
        labels[index - 1].compareDocumentPosition(labels[index]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
    expect(screen.getByText(/Migration vers la côte/)).toBeInTheDocument();
  });

  // An account is shown with the carrier and collection it was recorded with,
  // and no word the record did not use (audit finding C10).
  // @req REQ-133
  it("attributes an account to its carrier and collector as recorded, without the word griot", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              oralTraditions: [
                {
                  claim: "Un récit relie ce nom à une lignée.",
                  claimStatus: "claimed",
                  carrier: "Une aînée de la famille, nom tenu à sa demande",
                  collection: "mediated",
                  collector: "Un enseignant qui l'a recueillie",
                  context: "Récit transmis en dioula, à Bobo-Dioulasso",
                },
              ],
            },
          },
        }}
      />
    );

    expect(screen.getByText(/Transmis par\s+Une aînée/)).toBeInTheDocument();
    expect(
      screen.getByText(/Recueilli par\s+Un enseignant/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Bobo-Dioulasso/)).toBeInTheDocument();
    expect(screen.queryByText(/griot/i)).not.toBeInTheDocument();
  });

  // @req REQ-133
  it("says the carrier is not stated rather than leaving the account unattributed and silent", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              oralTraditions: [{ claim: "Un récit sans transmetteur." }],
            },
          },
        }}
      />
    );

    expect(screen.getByText(/Transmetteur non précisé/)).toBeInTheDocument();
  });

  // @req REQ-133
  it("omits the oral-tradition note when no oral tradition is documented", () => {
    render(
      <PatronymeOriginSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            origin: {
              writtenChronicles: [{ claim: "Cité dans le Tarikh es-Soudan." }],
            },
          },
        }}
      />
    );

    expect(screen.getByText("Chronique écrite")).toBeInTheDocument();
    expect(screen.queryByText(/transmise oralement/)).not.toBeInTheDocument();
  });
});
