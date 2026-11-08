import { describe, expect, it } from "vitest";

import { mapRowToSource } from "@/api/v2/services/sourceMapper";
import { evaluateSourceUrl } from "@/lib/sources/authorized-source-catalog";

/**
 * `mapRowToSource` is the one reading of a `sources` row. These pin what it
 * refuses to invent: an unknown kind or tier stays null, a malformed
 * identifier map is dropped, and the verification date comes from the column
 * that exists.
 */

const fullRow = {
  id: "src-1",
  source_key: "ethnologue",
  source_kind: "linguistic_reference",
  tier: "referenced",
  identifiers: { isbn: "978-0-00-000000-0", doi: 42, issn: null },
  title: "Ethnologue",
  url: "https://www.ethnologue.com/language/lin",
  pinned_url: "https://web.archive.org/web/2024/https://www.ethnologue.com/",
  year: 2024,
  author: "Eberhard",
  publisher: "SIL",
  resolvable: true,
  verified_at: "2026-10-01T00:00:00Z",
  last_verified_at: "1999-01-01T00:00:00Z",
  notes: "Fiche lingala",
  page: "12",
  added_at: "2026-01-01T00:00:00Z",
};

describe("mapRowToSource", () => {
  // @req REQ-092
  it("maps every column of a complete row to its camelCase field", () => {
    const source = mapRowToSource(fullRow);

    expect(source).toMatchObject({
      id: "src-1",
      sourceKey: "ethnologue",
      sourceKind: "linguistic_reference",
      tier: "referenced",
      title: "Ethnologue",
      url: "https://www.ethnologue.com/language/lin",
      pinnedUrl: "https://web.archive.org/web/2024/https://www.ethnologue.com/",
      year: 2024,
      author: "Eberhard",
      publisher: "SIL",
      resolvable: true,
      notes: "Fiche lingala",
      page: "12",
      addedAt: "2026-01-01T00:00:00Z",
    });
  });

  // @req REQ-092
  it("reads the verification date from verified_at, never last_verified_at", () => {
    expect(mapRowToSource(fullRow).lastVerifiedAt).toBe("2026-10-01T00:00:00Z");
    expect(
      mapRowToSource({ ...fullRow, verified_at: null }).lastVerifiedAt
    ).toBeNull();
  });

  // @req REQ-092
  it("keeps only string identifiers", () => {
    expect(mapRowToSource(fullRow).identifiers).toEqual({
      isbn: "978-0-00-000000-0",
    });
  });

  // @req REQ-092
  it("drops an identifiers value that is not a plain object", () => {
    expect(mapRowToSource({ ...fullRow, identifiers: ["a"] }).identifiers).toBe(
      null
    );
    expect(mapRowToSource({ ...fullRow, identifiers: "x" }).identifiers).toBe(
      null
    );
    expect(
      mapRowToSource({ ...fullRow, identifiers: null }).identifiers
    ).toBeNull();
  });

  // @req REQ-092
  it("leaves an untiered or mistiered row null instead of coercing it", () => {
    expect(mapRowToSource({ ...fullRow, tier: null }).tier).toBeNull();
    expect(mapRowToSource({ ...fullRow, tier: "gold" }).tier).toBeNull();
  });

  // @req REQ-092
  it("leaves an unrecognised source kind null", () => {
    expect(
      mapRowToSource({ ...fullRow, source_kind: "blog" }).sourceKind
    ).toBeNull();
    expect(
      mapRowToSource({ ...fullRow, source_kind: undefined }).sourceKind
    ).toBeNull();
  });

  // @req REQ-092
  it("gives a sparse row nulls and an empty title rather than undefined", () => {
    const source = mapRowToSource({ id: "bare" });

    expect(source).toEqual({
      id: "bare",
      sourceKey: null,
      sourceKind: null,
      tier: null,
      identifiers: null,
      title: "",
      url: null,
      pinnedUrl: null,
      year: null,
      author: null,
      publisher: null,
      resolvable: null,
      lastVerifiedAt: null,
      notes: null,
      page: null,
      addedAt: null,
      policy: evaluateSourceUrl(""),
    });
  });

  // @req REQ-092
  it("evaluates the catalogue policy from the row's URL", () => {
    expect(mapRowToSource(fullRow).policy).toEqual(
      evaluateSourceUrl(fullRow.url)
    );
    // A non-string URL is treated as absent, and absent is off-catalogue.
    const noUrl = mapRowToSource({ ...fullRow, url: 12 });
    expect(noUrl.url).toBeNull();
    expect(noUrl.policy).toEqual({
      key: "unknown",
      tier: "unverified",
      sourceKind: "unknown",
    });
  });
});
