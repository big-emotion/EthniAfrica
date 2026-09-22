import { describe, it, expect } from "vitest";
import { violatesReaderRegister } from "../readerRegister";

/**
 * A research wave is the workshop's calendar. The pattern once matched only
 * "vague N du plan", so 28 name fiches told their readers about a value
 * "héritée de la vague 1" and passed the gate. A wave of migration, of
 * settlement or of independences is the subject's own history and must stay
 * readable.
 */
describe("violatesReaderRegister — research waves", () => {
  // @req REQ-133
  it("refuses a bare research-wave reference in French", () => {
    expect(
      violatesReaderRegister(
        "La classification vague 1 est conservée faute de meilleure preuve."
      )
    ).toBe(true);
    expect(
      violatesReaderRegister(
        "la valeur nisba héritée de la vague 1 n’est donc pas étendue par inférence."
      )
    ).toBe(true);
  });

  // @req REQ-133
  it("refuses a bare research-wave reference in English", () => {
    expect(
      violatesReaderRegister("The nisba value inherited from wave 1 is kept.")
    ).toBe(true);
  });

  // @req REQ-133
  it("keeps a sentence about a historical wave readable", () => {
    expect(
      violatesReaderRegister(
        "Une première vague de migrations bantoues atteint la côte vers 1500."
      )
    ).toBe(false);
    expect(
      violatesReaderRegister(
        "La vague 1960 des indépendances redessine les frontières administratives."
      )
    ).toBe(false);
    expect(
      violatesReaderRegister(
        "The 1960 wave of independences redrew administrative borders."
      )
    ).toBe(false);
  });
});

describe("violatesReaderRegister — the project called an atlas", () => {
  // @req REQ-143
  it("refuses a sentence in which the project calls itself an atlas", () => {
    expect(
      violatesReaderRegister(
        "L'atlas ne documente pas encore ce point pour ce nom : aucune source dédiée n'a été consultée à ce jour."
      )
    ).toBe(true);
    expect(
      violatesReaderRegister(
        "Ce nom figure au relevé de couverture de l’atlas."
      )
    ).toBe(true);
    expect(
      violatesReaderRegister("The atlas does not yet document this point.")
    ).toBe(true);
  });

  // @req REQ-143
  it("keeps the titles of real works and the Atlas mountains readable", () => {
    for (const text of [
      "UNESCO, Atlas des langues en danger dans le monde",
      "Atlas of the World's Languages in Danger",
      "WorldAtlas — Ethnic Groups of Morocco",
      "Les Amazighs du Haut-Atlas et des monts de l'Atlas",
      "Chapitre d'atlas linguistique académique à comité de relecture",
    ]) {
      expect(violatesReaderRegister(text)).toBe(false);
    }
  });
});
