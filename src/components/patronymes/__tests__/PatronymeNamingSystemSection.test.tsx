import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeNamingSystemSection } from "@/components/patronymes/PatronymeNamingSystemSection";
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

describe("PatronymeNamingSystemSection (AC1, REQ-133)", () => {
  // @req REQ-133
  it("renders the shared fields when present", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            spellings: [
              {
                spelling: "Keita",
                attestations: [{ countryId: "MLI", sourceRefs: ["s1"] }],
              },
            ],
            transmissionMode: "patrilineal",
            designatedSocialUnit: "clan",
          },
        }}
      />
    );

    expect(screen.getByText("Keita")).toBeInTheDocument();
    expect(
      screen.getByText(/attestée dans ce pays : Mali$/)
    ).toBeInTheDocument();
    expect(screen.getByText("Patrilinéaire")).toBeInTheDocument();
    expect(screen.getByText("Clan")).toBeInTheDocument();
  });

  // The reader is owed country names, not workshop codes. SSD is the case a
  // direct read of the map asset misses: the asset files South Sudan as SDS.
  // @req REQ-133
  it("names the countries where a spelling is attested", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            spellings: [
              {
                spelling: "Keita",
                attestations: [
                  { countryId: "MLI", sourceRefs: ["s1"] },
                  { countryId: "BFA", sourceRefs: ["s1"] },
                  { countryId: "SSD", sourceRefs: ["s2"] },
                ],
              },
            ],
          },
        }}
      />
    );

    const line = screen.getByText(/attestée dans ces pays/);
    expect(line).toHaveTextContent(
      "attestée dans ces pays : Mali, Burkina Faso, Soudan du Sud"
    );
    expect(line.textContent).not.toMatch(/\b(MLI|BFA|SSD|SDS)\b/);
  });

  // @req REQ-133
  it("names a non-hereditary transmission instead of blanking it", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          nameSystem: "non_hereditary_patronymic",
          content: { transmissionMode: "non_hereditary" },
        }}
      />
    );

    // Written by 4 dossiers and absent from the allow-list, which blanked it.
    expect(screen.getByText("Non héréditaire")).toBeInTheDocument();
  });

  // @req REQ-133
  it("prints the editor's reason for a field the dossier leaves empty", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            gaps: [
              {
                fieldPath: "transmissionMode",
                reason:
                  "Le passage ne précise pas le mode de transmission du nom.",
              },
            ],
          },
        }}
      />
    );

    expect(
      screen.getByText(
        "Le passage ne précise pas le mode de transmission du nom."
      )
    ).toBeInTheDocument();
  });

  // @req REQ-133
  it("renders the totemic-clan subtype fields for a totemic_clan fiche", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          nameSystem: "totemic_clan",
          content: {
            totemicFoodProhibition: "Hyène",
            permittedGivenNames: ["Aissata", "Boubou"],
          },
        }}
      />
    );

    expect(screen.getByText("Hyène")).toBeInTheDocument();
    expect(screen.getByText(/Aissata/)).toBeInTheDocument();
  });

  // @req REQ-133
  it("does not render totemic-clan fields for a nisba fiche (AC1)", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          nameSystem: "nisba",
          content: {
            totemicFoodProhibition: "Hyène",
            nisbaSubtype: "geographic",
          },
        }}
      />
    );

    expect(screen.queryByText("Hyène")).not.toBeInTheDocument();
    expect(screen.getByText("Géographique")).toBeInTheDocument();
  });

  // @req REQ-133
  it("does not render the nisba subtype for a totemic_clan fiche (AC1)", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{
          ...base,
          nameSystem: "totemic_clan",
          content: { nisbaSubtype: "geographic" },
        }}
      />
    );

    expect(screen.queryByText("Géographique")).not.toBeInTheDocument();
  });

  // @req REQ-133
  it("renders casteOrSocialFunction when present, regardless of system", () => {
    render(
      <PatronymeNamingSystemSection
        language="fr"
        patronyme={{ ...base, casteOrSocialFunction: "Nyamakala" }}
      />
    );

    expect(screen.getByText("Nyamakala")).toBeInTheDocument();
  });

  // @req REQ-133
  it("renders no field list when content carries nothing", () => {
    const { container } = render(
      <PatronymeNamingSystemSection language="fr" patronyme={base} />
    );

    expect(container.querySelector("dl")).not.toBeInTheDocument();
  });
});
