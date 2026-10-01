import { describe, expect, it } from "vitest";

import { normaliseSearchQuery } from "@/lib/search/queryNormalisation";

// Every query below was typed by a reader in September 2026 (search_query_log).
describe("normaliseSearchQuery", () => {
  // @req REQ-178
  it("keeps the raw query untouched for display and for the log", () => {
    const raw = "  D’où vient les Bakayoko ? ";
    expect(normaliseSearchQuery(raw).raw).toBe(raw);
  });

  // @req REQ-178
  it.each([
    ["les krus", "krus"],
    ["les siamou", "siamou"],
    ["le peul", "peul"],
    ["la côte d'ivoire", "côte d'ivoire"],
    ["l'egypte", "egypte"],
    ["l’egypte", "egypte"],
    ["un bassa", "bassa"],
    ["des peuls", "peuls"],
    ["du mali", "mali"],
    ["de la guinée", "guinée"],
  ])("strips the leading article of %s", (raw, primary) => {
    expect(normaliseSearchQuery(raw).candidates[0]).toBe(primary);
  });

  // @req REQ-178
  it.each([
    ["d’où vient les bakayoko", "bakayoko"],
    ["d'où vient le nom peul ?", "peul"],
    ["d'ou vient le nom des bassa", "bassa"],
    ["qui a créé la côte d'ivoire", "côte d'ivoire"],
    ["que veut dire keïta", "keïta"],
    ["Bambara?", "bambara"],
    ["« mandé »", "mandé"],
  ])("strips the question frame and punctuation of %s", (raw, primary) => {
    expect(normaliseSearchQuery(raw).candidates[0]).toBe(primary);
  });

  // @req REQ-178
  it("offers the trailing plural s only as an additional candidate, before the unstripped form", () => {
    const { candidates } = normaliseSearchQuery("les krus");
    expect(candidates).toEqual(["krus", "kru", "les krus"]);
  });

  // @req REQ-178
  it("does not singularise a short word or a word that has no plural s", () => {
    expect(normaliseSearchQuery("bas").candidates).toEqual(["bas"]);
    expect(normaliseSearchQuery("fula").candidates).toEqual(["fula"]);
  });

  // @req REQ-178
  it("falls back to the unstripped form when an article is part of a name", () => {
    expect(normaliseSearchQuery("les bassa").candidates).toEqual([
      "bassa",
      "les bassa",
    ]);
  });

  // @req REQ-178
  it("never empties the query: a bare article stays a query", () => {
    expect(normaliseSearchQuery("les").candidates).toEqual(["les"]);
    expect(normaliseSearchQuery("   ").candidates).toEqual([]);
  });

  // @req REQ-178
  it("splits a multi-name query into tokens, without connecting words", () => {
    expect(normaliseSearchQuery("mandja egypte").tokens).toEqual([
      "mandja",
      "egypte",
    ]);
    expect(normaliseSearchQuery("peuple du mali").tokens).toEqual([
      "peuple",
      "mali",
    ]);
  });

  // @req REQ-178
  it("gives a single name no tokens: there is nothing to widen", () => {
    expect(normaliseSearchQuery("les krus").tokens).toEqual([]);
    expect(normaliseSearchQuery("keïta").tokens).toEqual([]);
  });
});

describe("normaliseSearchQuery — names that begin like an article", () => {
  // @req REQ-178
  it.each(["lesotho", "unguja", "dogon", "lagos", "desta"])(
    "leaves %s whole",
    (name) => {
      expect(normaliseSearchQuery(name).candidates[0]).toBe(name);
    }
  );
});
