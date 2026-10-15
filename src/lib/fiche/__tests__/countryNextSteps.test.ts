import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/queries/afrik/countries", () => ({
  getAfrikCountryNameRows: vi.fn(async () => []),
}));
vi.mock("@/api/v2/services/places", () => ({
  listPlacesOfCountry: vi.fn(async (id: string) =>
    id === "CIV"
      ? [
          {
            id: "LOC_DALOA",
            nameMain: "Daloa",
            summary: "Le nom Daloa est celui d'une ville. Suite.",
          },
          {
            id: "LOC_YAMOUSSOUKRO",
            nameMain: "Yamoussoukro",
            summary: "Le nom Yamoussoukro. Suite.",
          },
        ]
      : []
  ),
}));
vi.mock("@/lib/fiche/ficheExistence", () => ({
  loadPeopleFiche: vi.fn(async (id: string) =>
    id === "PPL_NONE"
      ? null
      : {
          nameMain: id === "PPL_KONGO" ? "Kongo" : id.slice(4),
          nameHistory: { summary: `Le nom ${id} désigne un peuple. Suite.` },
        }
  ),
}));

import {
  loadCountryNextSteps,
  sharedNameCountries,
  sharedNameNote,
  type CountryNameRow,
} from "@/lib/fiche/countryNextSteps";

const row = (
  id: string,
  firstName: string,
  nameOfficial: string,
  nameFr = firstName
): CountryNameRow => ({
  id,
  nameFr,
  nameOfficial,
  firstName,
  summary: `Le nom ${firstName} désigne un pays. Suite.`,
});

const ROWS = [
  row("COG", "Congo", "République du Congo"),
  row(
    "COD",
    "République démocratique du Congo",
    "République démocratique du Congo (RDC)"
  ),
  row("GIN", "Guinée", "République de Guinée"),
  row("GNQ", "Guinée équatoriale", "République de Guinée équatoriale"),
  row("NER", "Niger", "République du Niger"),
  row("NGA", "Nigeria", "République fédérale du Nigeria"),
  row("CIV", "Côte d'Ivoire", "République de Côte d'Ivoire"),
];

// Brief 5, approved 2026-10-15: docs/design/mockups/site/country-*.dc.html.
describe("countryNextSteps — the names a country shares and its next names", () => {
  // @req REQ-198
  it("finds the countries whose first names contain one another, as words", () => {
    const ids = (id: string) =>
      sharedNameCountries(
        ROWS.find((entry) => entry.id === id)!,
        ROWS
      ).map((entry) => entry.id);
    expect(ids("COG")).toEqual(["COD"]);
    expect(ids("COD")).toEqual(["COG"]);
    expect(ids("GNQ")).toEqual(["GIN"]);
    expect(ids("NER")).toEqual([]);
    expect(ids("CIV")).toEqual([]);
  });

  // @req REQ-198
  it("names both countries by their official names, translations dropped", () => {
    expect(sharedNameNote(ROWS[0], ROWS)).toEqual({
      name: "Congo",
      self: "la République du Congo",
      other: "la République démocratique du Congo",
    });
  });

  // @req REQ-198
  it("offers the largest people, then the first place from A to Z", async () => {
    const cards = await loadCountryNextSteps({
      self: ROWS[6],
      rows: ROWS,
      peoples: [
        { id: "PPL_NONE", name: "Sans fiche" },
        { id: "PPL_AKAN", name: "Akan" },
      ],
      language: "fr",
    });
    expect(cards.map((card) => [card.kind, card.name])).toEqual([
      ["Peuple", "AKAN"],
      ["Lieu", "Daloa"],
    ]);
  });

  // @req REQ-198
  it("leads to the country sharing the name, under the people's own name", async () => {
    const cards = await loadCountryNextSteps({
      self: ROWS[0],
      rows: ROWS,
      peoples: [{ id: "PPL_KONGO", name: "Kongo (Brazzaville)" }],
      language: "fr",
    });
    expect(cards).toEqual([
      {
        kind: "Pays",
        name: "République démocratique du Congo",
        reason: "Le nom République démocratique du Congo désigne un pays.",
      },
      {
        kind: "Peuple",
        name: "Kongo",
        reason: "Le nom PPL_KONGO désigne un peuple.",
      },
    ]);
  });

  // @req REQ-198
  it("offers a second people when no place has a summary", async () => {
    const cards = await loadCountryNextSteps({
      self: row("GAB", "Gabon", "République gabonaise"),
      rows: ROWS,
      peoples: [
        { id: "PPL_FANG", name: "Fang" },
        { id: "PPL_PUNU", name: "Punu" },
      ],
      language: "fr",
    });
    expect(cards.map((card) => card.name)).toEqual(["FANG", "PUNU"]);
  });
});
