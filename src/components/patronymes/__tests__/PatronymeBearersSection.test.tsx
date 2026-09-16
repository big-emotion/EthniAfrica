import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatronymeBearersSection } from "@/components/patronymes/PatronymeBearersSection";
import type { PublicPatronyme } from "@/api/v2/schemas/patronymes";

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

describe("PatronymeBearersSection (AC3, DEC-040, REQ-133)", () => {
  // @req REQ-133
  it("lists a bearer by id, fullName and roleCategory only", () => {
    render(
      <PatronymeBearersSection
        language="fr"
        patronyme={{
          ...base,
          bearers: [
            {
              id: "PER_1",
              fullName: "Modibo Keïta",
              roleCategory: "chef d'État",
            },
          ],
        }}
      />
    );

    expect(screen.getByText("Modibo Keïta")).toBeInTheDocument();
    expect(screen.getByText("chef d'État")).toBeInTheDocument();
  });

  // @req REQ-133
  it("always states the DEC-040 editorial policy alongside the list", () => {
    render(
      <PatronymeBearersSection
        language="fr"
        patronyme={{
          ...base,
          bearers: [
            {
              id: "PER_1",
              fullName: "Modibo Keïta",
              roleCategory: "chef d'État",
            },
          ],
        }}
      />
    );

    expect(
      screen.getByText(/ne permet de déduire l'origine ethnique/)
    ).toBeInTheDocument();
  });

  // Charter §4 asks the chapter to say it holds nothing; REQ-119 fixes *how*
  // — the shared provenance marker, so an undocumented chapter never reads as
  // a sentence the corpus wrote.
  // @req REQ-119
  it("states explicitly when no bearer is documented (atlas charter §4)", () => {
    render(<PatronymeBearersSection language="fr" patronyme={base} />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // The corpus names its bearers by displayName rather than through person
  // records, and the fiche said "Donnée manquante" over a dossier that named
  // Soundiata Keïta. The API now serves those bearers under `namedBearers`,
  // already restricted to a publishable status.
  // @req REQ-133
  it("lists a bearer the API serves under namedBearers", () => {
    render(
      <PatronymeBearersSection
        language="fr"
        patronyme={{
          ...base,
          namedBearers: [
            { displayName: "Soundiata Keïta", status: "deceased" },
          ],
        }}
      />
    );

    expect(screen.getByText("Soundiata Keïta")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // DEC-040 / RGPD art. 9: `content` is the dossier served verbatim and holds
  // bearers of every status, so reading it here published a living person's
  // ethnic origin. The chapter must see nothing but the filtered field — that
  // is what makes the guarantee a property of the code rather than of whatever
  // the corpus happens to contain today.
  // @req REQ-133
  it("ignores bearers written only in the unfiltered content dossier", () => {
    render(
      <PatronymeBearersSection
        language="fr"
        patronyme={{
          ...base,
          content: {
            bearers: [
              { status: "living_self_identified", displayName: "Awa Keïta" },
            ],
          },
        }}
      />
    );

    expect(screen.queryByText("Awa Keïta")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // @req REQ-133
  it("does not print a bearer twice when a person record and a named bearer agree", () => {
    render(
      <PatronymeBearersSection
        language="fr"
        patronyme={{
          ...base,
          bearers: [
            {
              id: "PER_1",
              fullName: "Modibo Keïta",
              roleCategory: "chef d'État",
            },
          ],
          namedBearers: [{ displayName: "Modibo Keïta", status: "deceased" }],
        }}
      />
    );

    expect(screen.getAllByText("Modibo Keïta")).toHaveLength(1);
  });

  // @req REQ-133
  it("falls back to a stated label when roleCategory is empty", () => {
    render(
      <PatronymeBearersSection
        language="fr"
        patronyme={{
          ...base,
          bearers: [
            { id: "PER_1", fullName: "Modibo Keïta", roleCategory: "" },
          ],
        }}
      />
    );

    expect(screen.getByText("Rôle non renseigné")).toBeInTheDocument();
  });
});
