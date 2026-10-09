import { describe, expect, it } from "vitest";

import { validateAgainstSchema } from "@/app/api/v2/__tests__/helpers/openapiValidator";
import { loadAllPlaceFiches } from "@/lib/afrik/loaders/placeJsonLoader";

const PLACE_REF = { $ref: "#/components/schemas/PlaceV2" };

describe("OpenAPI v2 place contract", () => {
  // The schema is checked against the corpus' own place fiche, not a
  // synthesised body, so a nameHistory shape the spec cannot describe fails.
  // @req REQ-196
  it("describes LOC_YAMOUSSOUKRO as the detail endpoint serves it", () => {
    const place = loadAllPlaceFiches().places.find(
      ({ id }) => id === "LOC_YAMOUSSOUKRO"
    );
    expect(place).toBeDefined();

    const served = {
      id: place.id,
      placeType: place.placeType,
      nameMain: place.nameMain,
      names: [place.nameMain],
      summary: place.summary,
      country: { id: place.countryId, name: "Côte d'Ivoire" },
      associatedPeoples: place.associatedPeoples.map(({ peopleId }) => ({
        id: peopleId,
        name: null,
        relation: null,
      })),
      gaps: place.content.gaps,
      sources: place.content.sources,
      nameHistory: place.nameHistory,
    };

    expect(validateAgainstSchema(PLACE_REF, served)).toBeNull();
  });
});
