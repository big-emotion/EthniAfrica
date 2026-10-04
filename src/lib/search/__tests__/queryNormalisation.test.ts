import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeString } from "@/lib/normalize";
import {
  MULTI_WORD_COUNTRY_NAMES,
  normaliseSearchQuery,
} from "@/lib/search/queryNormalisation";

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

// Measured on production, 2026-10-03: each typed spelling found nothing while
// the corpus holds the name under the spelling French writes.
describe("normaliseSearchQuery — spellings readers swap", () => {
  // @req REQ-002
  it("tries m for an n written before b or p, after the typed forms", () => {
    expect(normaliseSearchQuery("diawanbe").candidates).toEqual([
      "diawanbe",
      "diawambe",
    ]);
  });

  // @req REQ-002
  it("tries y for an i written between two consonants, after the typed forms", () => {
    expect(normaliseSearchQuery("pigmee").candidates).toEqual([
      "pigmee",
      "pygmee",
    ]);
  });

  // @req REQ-002
  it("swaps the singular too, and never before an unswapped candidate", () => {
    expect(normaliseSearchQuery("les pigmées").candidates).toEqual([
      "pigmées",
      "pigmée",
      "les pigmées",
      "pygmées",
      "pygmée",
    ]);
  });

  // @req REQ-002
  it.each(["fulbr", "diawara", "bambara", "pygmée", "kassabara"])(
    "adds no variant to %s, which has nothing to swap",
    (name) => {
      expect(normaliseSearchQuery(name).candidates).toEqual([name]);
    }
  );

  // @req REQ-002
  it("swaps nothing in a query of several names: those are widened instead", () => {
    expect(normaliseSearchQuery("mandja egypte").candidates).toEqual([
      "mandja egypte",
    ]);
  });
});

describe("normaliseSearchQuery — a country name of several words", () => {
  // @req REQ-002
  it("keeps it whole when the query is widened name by name", () => {
    expect(normaliseSearchQuery("n'daho cote d'ivoire").tokens).toEqual([
      "n'daho",
      "cote d'ivoire",
    ]);
    expect(normaliseSearchQuery("les peuls du Burkina Faso").tokens).toEqual([
      "peuls",
      "burkina faso",
    ]);
  });

  // @req REQ-002
  it("keeps the spelling the reader typed, accents included", () => {
    expect(normaliseSearchQuery("mossi côte d’ivoire").tokens).toEqual([
      "mossi",
      "côte d'ivoire",
    ]);
  });

  // @req REQ-002
  it("is not widened at all when the country is the whole query", () => {
    expect(normaliseSearchQuery("côte d'ivoire").tokens).toEqual([]);
    expect(normaliseSearchQuery("afrique du sud").tokens).toEqual([]);
  });

  // @req REQ-002
  it("names only countries the corpus files under that name", () => {
    const paysDir = join(process.cwd(), "dataset/source/afrik/pays");
    const filed = new Set(
      readdirSync(paysDir)
        .filter((file) => file.endsWith(".json"))
        .map((file) =>
          normalizeString(
            JSON.parse(readFileSync(join(paysDir, file), "utf8")).nameFr
          )
        )
    );
    expect(MULTI_WORD_COUNTRY_NAMES.length).toBeGreaterThan(0);
    for (const name of MULTI_WORD_COUNTRY_NAMES) {
      expect(filed).toContain(name);
    }
  });
});
