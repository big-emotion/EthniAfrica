import { describe, expect, it } from "vitest";
import { serializePatronyme } from "../patronymes";
import type { PatronymeAggregate } from "@/api/v2/services/patronymes";

function baseAggregate(
  overrides: Partial<PatronymeAggregate> = {}
): PatronymeAggregate {
  return {
    id: "PAT_KEITA",
    nameMain: "Keita",
    nameSystem: "clan_name",
    casteOrSocialFunction: "horon",
    content: { nameMain: "Keita", transmissionMode: "patrilineal" },
    associatedPeoples: [],
    associatedCountries: [],
    bearers: [],
    namedBearers: [],
    alliances: [],
    ...overrides,
  };
}

describe("serializePatronyme", () => {
  // @req REQ-133
  it("keeps alliances in the dossier's order with the resolved name", () => {
    const result = serializePatronyme(
      baseAggregate({
        alliances: [
          {
            targetId: "PAT_FOFANA",
            targetNameMain: "Fofana",
            allianceType: "sanankuya",
          },
          {
            targetId: "PAT_COULIBALY",
            targetNameMain: "Coulibaly",
            allianceType: null,
          },
        ],
      })
    );

    expect(result.alliances.map((a) => a.targetNameMain)).toEqual([
      "Fofana",
      "Coulibaly",
    ]);
  });

  // @req REQ-133
  it("carries the real columns through unchanged", () => {
    const result = serializePatronyme(baseAggregate());

    expect(result.id).toBe("PAT_KEITA");
    expect(result.nameMain).toBe("Keita");
    expect(result.nameSystem).toBe("clan_name");
    expect(result.casteOrSocialFunction).toBe("horon");
    expect(result.content).toEqual({
      nameMain: "Keita",
      transmissionMode: "patrilineal",
    });
  });

  // @req REQ-133
  it("sorts associated peoples by name for a stable payload", () => {
    const result = serializePatronyme(
      baseAggregate({
        associatedPeoples: [
          { id: "PPL_B", nameMain: "Bambara", autonym: null, slug: "PPL_B" },
          { id: "PPL_A", nameMain: "Alladian", autonym: null, slug: "PPL_A" },
        ],
      })
    );

    expect(result.associatedPeoples.map((p) => p.id)).toEqual([
      "PPL_A",
      "PPL_B",
    ]);
  });

  // @req REQ-133
  it("sorts associated countries by name for a stable payload", () => {
    const result = serializePatronyme(
      baseAggregate({
        associatedCountries: [
          { id: "SEN", nameFr: "Sénégal" },
          { id: "MLI", nameFr: "Mali" },
        ],
      })
    );

    expect(result.associatedCountries.map((c) => c.id)).toEqual(["MLI", "SEN"]);
  });

  // DEC-040: no code path takes a family name and returns an ethnic origin
  // for a named living person.
  // @req REQ-133
  it("strips a bearer down to id, fullName and roleCategory even if the aggregate carries more (DEC-040)", () => {
    const dirtyBearer = {
      id: "PER_X",
      fullName: "X",
      roleCategory: "author",
      // A defensive test: even if an upstream bug attached ethnic-origin
      // data to the aggregate, the serializer must never forward it.
      peopleLinks: [{ peopleId: "PPL_TEST", relationLabel: "membership" }],
      countryIds: ["MLI"],
    } as unknown as PatronymeAggregate["bearers"][number];

    const result = serializePatronyme(
      baseAggregate({ bearers: [dirtyBearer] })
    );

    expect(result.bearers).toEqual([
      { id: "PER_X", fullName: "X", roleCategory: "author" },
    ]);
    expect(Object.keys(result.bearers[0]).sort()).toEqual([
      "fullName",
      "id",
      "roleCategory",
    ]);
  });

  // @req REQ-133
  it("sorts bearers by full name for a stable payload", () => {
    const result = serializePatronyme(
      baseAggregate({
        bearers: [
          { id: "PER_B", fullName: "Bearer", roleCategory: "author" },
          { id: "PER_A", fullName: "Aearer", roleCategory: "author" },
        ],
      })
    );

    expect(result.bearers.map((b) => b.id)).toEqual(["PER_A", "PER_B"]);
  });

  // The join table has no editorial order to preserve — its primary key is
  // (patronyme_id, display_name) and nothing ranks the rows — so the payload
  // orders them itself rather than publishing whatever Postgres returned.
  // @req REQ-133
  it("sorts named bearers by the name the fiche states", () => {
    const result = serializePatronyme(
      baseAggregate({
        namedBearers: [
          { displayName: "Soundiata Keïta", status: "deceased" },
          { displayName: "Modibo Keïta", status: "deceased" },
        ],
      })
    );

    expect(result.namedBearers.map((bearer) => bearer.displayName)).toEqual([
      "Modibo Keïta",
      "Soundiata Keïta",
    ]);
  });

  // @req REQ-133
  it("strips a named bearer down to displayName and status (DEC-040)", () => {
    const dirtyNamedBearer = {
      displayName: "Soundiata Keïta",
      status: "deceased",
      personId: "PER_SOUNDIATA",
      peopleLinks: [{ peopleId: "PPL_MALINKE" }],
    } as unknown as PatronymeAggregate["namedBearers"][number];

    const result = serializePatronyme(
      baseAggregate({ namedBearers: [dirtyNamedBearer] })
    );

    expect(Object.keys(result.namedBearers[0]).sort()).toEqual([
      "displayName",
      "status",
    ]);
  });
});
