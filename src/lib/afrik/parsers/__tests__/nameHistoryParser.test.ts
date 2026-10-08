import { describe, expect, it } from "vitest";

import { parseNameHistory } from "../nameHistoryParser";

function writtenSource(overrides: Record<string, unknown> = {}) {
  return {
    title: "Mes premiers combats",
    author: "Félix Houphouët-Boigny",
    year: null,
    url: "https://www.eolis.ci/news/4053",
    tier: "referenced",
    source_kind: "academic",
    page: "p. 29",
    ...overrides,
  };
}

function account(overrides: Record<string, unknown> = {}) {
  return {
    period: { from: 1904, to: 1904, label: "1904" },
    statement:
      "Le nom Yamoussoukro est donné au village en 1904, selon un récit familial.",
    sources: [writtenSource()],
    ...overrides,
  };
}

function nameHistory(accounts: unknown[] = [account()]) {
  return {
    summary:
      "Le nom Yamoussoukro a remplacé N'Gokro ; ses origines sont débattues et présentées plus bas.",
    names: [
      {
        nameText: "Yamoussoukro",
        nameStatus: "current",
        selfGiven: false,
        languageOfOrigin: "bci",
        namedBy: "Un administrateur colonial français, selon les récits",
        accounts,
      },
    ],
  };
}

describe("parseNameHistory", () => {
  // @req REQ-196
  it("accepts a block with competing hypotheses, a birth, a before and actors", () => {
    const parsed = parseNameHistory(
      nameHistory([
        account({ hypothesisGroup: "origine", birth: true }),
        account({
          hypothesisGroup: "origine",
          period: { from: 1909, to: 1910, label: "Après 1909" },
          statement: "Le nom Yamoussoukro est donné après la révolte de 1909.",
          actors: [{ name: "Simon Maurice", role: "administrateur" }],
        }),
        account({
          before: true,
          period: { from: 1848, to: 1904, label: "De 1848 à 1904" },
          statement: "Le nom N'Gokro désignait le village avant 1904.",
        }),
      ])
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.success).toBe(true);
  });

  // @req REQ-196
  it("allows a fuzzy period with no year at all", () => {
    const parsed = parseNameHistory(
      nameHistory([
        account({ period: { from: null, to: null, label: "Date inconnue" } }),
      ])
    );

    expect(parsed.success).toBe(true);
  });

  // @req REQ-196
  it("refuses two birth accounts on one name, naming the name", () => {
    const parsed = parseNameHistory(
      nameHistory([account({ birth: true }), account({ birth: true })])
    );

    expect(parsed.success).toBe(false);
    expect(parsed.errors.join("\n")).toMatch(
      /name "Yamoussoukro".*at most one birth/
    );
  });

  // @req REQ-196
  it("refuses a period that ends before it starts", () => {
    const parsed = parseNameHistory(
      nameHistory([account({ period: { from: 1910, to: 1904, label: "x" } })])
    );

    expect(parsed.success).toBe(false);
    expect(parsed.errors.join("\n")).toMatch(/from.*<=.*to/);
  });

  // @req REQ-196
  it("refuses a before account dated after the birth", () => {
    const parsed = parseNameHistory(
      nameHistory([
        account({ birth: true }),
        account({
          before: true,
          period: { from: 1950, to: null, label: "Depuis 1950" },
        }),
      ])
    );

    expect(parsed.success).toBe(false);
    expect(parsed.errors.join("\n")).toMatch(/before.*birth/);
  });

  // @req REQ-196
  it("refuses an account that is both the birth and before it", () => {
    const parsed = parseNameHistory(
      nameHistory([account({ birth: true, before: true })])
    );

    expect(parsed.success).toBe(false);
  });

  // @req REQ-196
  it("refuses an account with no source or an empty statement", () => {
    expect(
      parseNameHistory(nameHistory([account({ sources: [] })])).success
    ).toBe(false);
    expect(
      parseNameHistory(nameHistory([account({ statement: "  " })])).success
    ).toBe(false);
  });

  // @req REQ-196
  it("refuses a source with no source_kind", () => {
    const { source_kind: _omitted, ...withoutKind } = writtenSource();
    const parsed = parseNameHistory(
      nameHistory([account({ sources: [withoutKind] })])
    );

    expect(parsed.success).toBe(false);
    expect(parsed.errors.join("\n")).toMatch(/source_kind/);
  });

  // @req REQ-195
  it("accepts an oral tradition with no URL and no page, named by its narrative, carrier and place", () => {
    const parsed = parseNameHistory(
      nameHistory([
        account({
          sources: [
            {
              title: "Récit de fondation de N'Gokro",
              author: "Chefferie de Kami",
              year: null,
              url: null,
              tier: "unverified",
              source_kind: "oral_tradition",
              narrative: "Le départ de Koko Blé et Boigny N'Dri",
              carrier: "Porte-parole du chef de Kami",
              place: "Kami",
            },
          ],
        }),
      ])
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.success).toBe(true);
  });

  // @req REQ-195
  it("accepts an oral tradition whose carrier asked not to be named", () => {
    const parsed = parseNameHistory(
      nameHistory([
        account({
          sources: [
            {
              title: "Récit familial",
              author: "Famille fondatrice",
              year: null,
              url: null,
              tier: "unverified",
              source_kind: "oral_tradition",
            },
          ],
        }),
      ])
    );

    expect(parsed.success).toBe(true);
  });

  // @req REQ-196
  it("refuses a name status outside current and former", () => {
    const block = nameHistory();
    (block.names[0] as Record<string, unknown>).nameStatus = "concurrent";

    expect(parseNameHistory(block).success).toBe(false);
  });
});
