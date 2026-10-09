import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeFicheTitle } from "@/components/patronymes/PatronymeFicheTitle";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";

const patronyme: PublicPatronyme = {
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

const TIER_WORDS =
  /Officielle|Référencée|Non vérifiée|En attente d.examen|palier/i;

describe("PatronymeFicheTitle (REQ-133)", () => {
  // @req REQ-133
  it("opens on the eyebrow and the name", () => {
    render(<PatronymeFicheTitle patronyme={patronyme} language="fr" />);

    // « Nom », not « Patronyme »: DEC-038 gives the reader the word a
    // francophone types and keeps `patronyme` for the code.
    expect(screen.getByText("Nom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Keïta" })).toBeInTheDocument();
  });

  // @req REQ-133
  it("states the naming system in the header (AC1)", () => {
    render(<PatronymeFicheTitle patronyme={patronyme} language="fr" />);

    expect(screen.getByText(/Nom de clan/)).toBeInTheDocument();
  });

  // @req REQ-133
  it("states a different naming system for a different fiche", () => {
    render(
      <PatronymeFicheTitle
        patronyme={{ ...patronyme, nameSystem: "non_hereditary_patronymic" }}
        language="fr"
      />
    );

    expect(screen.getByText(/Patronyme non héréditaire/)).toBeInTheDocument();
  });
});

/**
 * The head states what the fiche rests on (ETNI-1865, REQ-147): the tier of
 * its best citation, how many citations there are, and — on its own axis —
 * how many of those a machine wrote. No percentage: DEC-050 rules that a name
 * has no confidence row to compute one from.
 */
describe("PatronymeFicheTitle standing (REQ-147)", () => {
  const citing = (sources: unknown[]): PublicPatronyme => ({
    ...patronyme,
    content: { sources },
  });

  // @req REQ-147
  // @req REQ-092
  it("states how many sources back the fiche, and never their tier", () => {
    const { container } = render(
      <PatronymeFicheTitle
        language="fr"
        patronyme={citing([
          { title: "Ethnologue", tier: "official" },
          { title: "Camara 1976", tier: "referenced" },
          { title: "Niane 1960", tier: "referenced" },
          { title: "Cissé 1988", tier: "referenced" },
          { title: "Forum de généalogie", tier: "unverified" },
          { title: "Carnet de voyage", tier: "unverified" },
        ])}
      />
    );

    expect(container.textContent).not.toMatch(TIER_WORDS);
    expect(container.querySelector("[data-tier]")).toBeNull();
    expect(screen.getByText(/6 sources citées/)).toBeInTheDocument();
    expect(screen.queryByText(/intelligence artificielle/)).toBeNull();
    expect(screen.queryByText(/en cours de constitution/)).toBeNull();
  });

  // « En cours de constitution » used to follow from the sources' tier: a
  // fiche resting only on unverified citations was flagged as unconfirmed.
  // @req REQ-194
  it("marks a lone machine-written source without flagging the fiche by its tier", () => {
    const { container } = render(
      <PatronymeFicheTitle
        language="fr"
        patronyme={citing([
          {
            title: "Synthèse",
            tier: "unverified",
            source_kind: "ai_generated",
          },
        ])}
      />
    );

    expect(container.textContent).not.toMatch(TIER_WORDS);
    expect(
      screen.getByText(
        /1 source citée, dont une rédigée par une intelligence artificielle/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/en cours de constitution/)).toBeNull();
  });

  // @req REQ-147
  it("counts the machine-written share", () => {
    const { container } = render(
      <PatronymeFicheTitle
        language="fr"
        patronyme={citing([
          { title: "Camara 1976", tier: "referenced" },
          { title: "Note A", tier: "unverified", source_kind: "ai_generated" },
          { title: "Note B", tier: "unverified", source_kind: "ai_generated" },
          { title: "Note C", tier: "unverified", source_kind: "ai_generated" },
        ])}
      />
    );

    expect(container.textContent).not.toMatch(TIER_WORDS);
    expect(
      screen.getByText(
        /4 sources citées, dont 3 rédigées par une intelligence artificielle/
      )
    ).toBeInTheDocument();
  });

  // @req REQ-147
  it("asserts no tier when the dossier cites nothing readable", () => {
    const { container } = render(
      <PatronymeFicheTitle patronyme={patronyme} language="fr" />
    );

    expect(screen.getByText(/en cours de constitution/)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(TIER_WORDS);
  });
});
