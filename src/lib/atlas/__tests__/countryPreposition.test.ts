import { describe, expect, it } from "vitest";

import { getAdmin0Name } from "@/lib/atlas/overlays";

import { inCountry, locativePreposition } from "../countryPreposition";

const fr = (countryId: string) =>
  inCountry(countryId, getAdmin0Name(countryId, "fr")!, "fr");

describe("inCountry — French (REQ-117)", () => {
  // @req REQ-117
  it("takes « en » before a vowel whatever the gender", () => {
    expect(fr("ETH")).toBe("en Éthiopie");
    expect(fr("AGO")).toBe("en Angola");
  });

  // @req REQ-117
  it("takes « en » before a feminine name the vowel rule cannot reach", () => {
    expect(fr("CIV")).toBe("en Côte d'Ivoire");
    expect(fr("COD")).toBe("en République démocratique du Congo");
  });

  // @req REQ-117
  it("takes « au » by default, « aux » for a plural and « à » for an article-less name", () => {
    expect(fr("TGO")).toBe("au Togo");
    expect(fr("COM")).toBe("aux Comores");
    expect(fr("MDG")).toBe("à Madagascar");
  });

  // @req REQ-117
  it("is the locale the module defaults to, so the existing caller reads unchanged", () => {
    expect(inCountry("TGO", "Togo")).toBe("au Togo");
    expect(locativePreposition("TGO", "Togo")).toBe("au");
  });
});
