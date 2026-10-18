import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeAlliancesSection } from "@/components/patronymes/PatronymeAlliancesSection";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";
import { getPatronymeRoute } from "@/lib/routing";
import { translations } from "@/lib/translations";

const t = translations.fr.patronymes;

const base: PublicPatronyme = {
  id: "PAT_KEITA",
  nameMain: "Keïta",
  nameSystem: "clan_name",
  casteOrSocialFunction: null,
  content: {},
  associatedPeoples: [],
  associatedCountries: [],
  bearers: [],
  namedBearers: [],
  alliances: [],
};

const sanankuya = {
  targetId: "PAT_COULIBALY",
  targetNameMain: "Coulibaly",
  allianceType: "sanankuya",
};

describe("PatronymeAlliancesSection (REQ-133)", () => {
  // The production fiche printed "PAT_COULIBALY — sanankuya": a corpus
  // identifier as link text, and a Mande word with no gloss. Neither is
  // something a reader can do anything with.
  // @req REQ-133
  it("links an allied name by its name, never by its identifier", () => {
    render(
      <PatronymeAlliancesSection
        language="fr"
        patronyme={{ ...base, alliances: [sanankuya] }}
      />
    );

    const link = screen.getByRole("link", { name: "Coulibaly" });
    expect(link).toHaveAttribute(
      "href",
      getPatronymeRoute("fr", "PAT_COULIBALY")
    );
    expect(screen.queryByText(/PAT_/)).not.toBeInTheDocument();
  });

  // @req REQ-133
  it("glosses a known alliance term once beside the linked name", () => {
    render(
      <PatronymeAlliancesSection
        language="fr"
        patronyme={{ ...base, alliances: [sanankuya] }}
      />
    );

    expect(
      screen.getByText(
        "Le pacte de ce nom est un sanankuya, parenté à plaisanterie mandingue :"
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Coulibaly" })).toBeInTheDocument();
  });

  // @req REQ-133
  it("states a shared pact explanation once and keeps all six allied names as links", () => {
    const alliances = [
      ["PAT_DIARRA", "Diarra"],
      ["PAT_DIOP", "Diop"],
      ["PAT_KONE", "Koné"],
      ["PAT_TOURE", "Touré"],
      ["PAT_CONDE", "Condé"],
      ["PAT_DIAWARA", "Diawara"],
    ].map(([targetId, targetNameMain]) => ({
      targetId,
      targetNameMain,
      allianceType: "sanankuya",
    }));

    render(
      <PatronymeAlliancesSection
        language="fr"
        patronyme={{ ...base, alliances }}
      />
    );

    expect(
      screen.getByText(
        "Les six pactes de ce nom sont des sanankuya, parenté à plaisanterie mandingue :"
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/parenté à plaisanterie mandingue/)
    ).toHaveLength(1); // one shared sentence for the six names
    for (const name of [
      "Diarra",
      "Diop",
      "Koné",
      "Touré",
      "Condé",
      "Diawara",
    ]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  // @req REQ-133
  it("prints an unglossed term as the corpus attests it", () => {
    render(
      <PatronymeAlliancesSection
        language="fr"
        patronyme={{
          ...base,
          alliances: [
            {
              targetId: "PAT_X",
              targetNameMain: "Xname",
              allianceType: "parenté à plaisanterie sénoufo",
            },
          ],
        }}
      />
    );

    expect(
      screen.getByText(/parenté à plaisanterie sénoufo/)
    ).toBeInTheDocument();
  });

  // A reader who lands on an empty "Alliances" has no idea what an alliance
  // between two names is. The note says what the chapter is for, and it says
  // it whether or not the corpus fills the chapter.
  // @req REQ-133
  it("explains what an alliance between names is, even when none is documented", () => {
    render(<PatronymeAlliancesSection language="fr" patronyme={base} />);

    expect(screen.getByText(t.alliancesNote)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // @req REQ-119
  it("prints the curator's gap wording when the corpus explains its silence", () => {
    render(
      <PatronymeAlliancesSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            gaps: [
              {
                fieldPath: "alliances",
                reason: "Aucun pacte nommé n'a été trouvé pour ce nom.",
              },
            ],
          },
        }}
      />
    );

    expect(
      screen.getByText("Aucun pacte nommé n'a été trouvé pour ce nom.")
    ).toBeInTheDocument();
  });
});
