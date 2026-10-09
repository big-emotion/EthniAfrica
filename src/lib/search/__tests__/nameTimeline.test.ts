import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseNameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";
import {
  buildNameTimeline,
  regimeOfYear,
  splitNamedText,
} from "@/lib/search/nameTimeline";

const tileShape = (history = LINGALA_HISTORY, searched = "lingala") =>
  buildNameTimeline(history, searched).names[0].tiles.map((tile) => [
    tile.placement,
    tile.periodLabel ?? null,
    tile.accounts.length,
  ]);

describe("buildNameTimeline — which name comes first", () => {
  // @req REQ-197
  it("puts the searched name first, then the self-given ones, then the rest", () => {
    const timeline = buildNameTimeline(PEUL_HISTORY, "peul");

    expect(timeline.names.map(({ nameText }) => nameText)).toEqual([
      "Peul",
      "Fulɓe",
    ]);
    expect(timeline.names[0].searched).toBe(true);
    expect(timeline.names[1].searched).toBe(false);
  });

  // @req REQ-197
  it("leads from a searched name to the name the subject gives itself", () => {
    expect(buildNameTimeline(PEUL_HISTORY, "Peul").selfLead).toEqual({
      searched: "Peul",
      self: "Fulɓe",
    });
    expect(buildNameTimeline(PEUL_HISTORY, "fulbe").selfLead).toBeUndefined();
  });

  // @req REQ-197
  it("keeps the self-given name first when the search matched no name", () => {
    const timeline = buildNameTimeline(LINGALA_HISTORY, "kibangi");

    expect(timeline.names[0].nameText).toBe("Lingala");
    expect(timeline.names.every((name) => !name.searched)).toBe(true);
  });
});

describe("buildNameTimeline — the tiles of one name, from today backwards", () => {
  // @req REQ-198
  it("reads today first, then the birth, then the origin hypotheses, then what came before the name", () => {
    expect(tileShape()).toEqual([
      ["plain", "Depuis 2006", 1],
      ["plain", "1904", 1],
      ["birth", "1902", 1],
      ["plain", null, 3],
      ["before", "De 1884-1885 à 1901", 1],
      ["before", "Jusqu'aux années 1880", 1],
    ]);
  });

  // @req REQ-198
  it("groups competing origins in one tile, in the fiche's order, none ranked", () => {
    const group = buildNameTimeline(LINGALA_HISTORY, "lingala").names[0]
      .tiles[3];

    expect(group.hypotheses).toBe(true);
    expect(group.accounts.map(({ period }) => period.label)).toEqual([
      "1901-1902",
      "Avant 1901",
      "Origine non datée",
    ]);
  });

  // @req REQ-198
  it("tells a lone hypothesis as a plain tile rather than a group of one", () => {
    const history = structuredClone(LINGALA_HISTORY);
    history.names[0].accounts = history.names[0].accounts.filter(
      (account, index) => !account.hypothesisGroup || index === 3
    );

    const tiles = buildNameTimeline(history, "lingala").names[0].tiles;
    const lone = tiles.find((tile) => tile.periodLabel === "1901-1902");

    expect(lone?.hypotheses).toBe(false);
  });

  // @req REQ-198
  it("says when a name has no birth in the project", () => {
    const timeline = buildNameTimeline(LINGALA_HISTORY, "lingala");
    const byName = Object.fromEntries(
      timeline.names.map((name) => [name.nameText, name.hasBirth])
    );

    expect(byName).toEqual({ Lingala: true, Mangala: false, Bangala: true });
  });

  // @req REQ-198
  it("inks a dated tile by its era and leaves an undated one neutral", () => {
    const [today, grammar, birth, group] = buildNameTimeline(
      LINGALA_HISTORY,
      "lingala"
    ).names[0].tiles;

    expect(today.regime).toBe("modern");
    expect(grammar.regime).toBe("colonial");
    expect(birth.regime).toBe("colonial");
    expect(group.regime).toBeUndefined();
  });

  // @req REQ-198
  it("cuts the eras at 1885 and 1960", () => {
    expect(regimeOfYear(1884)).toBe("polity");
    expect(regimeOfYear(1885)).toBe("colonial");
    expect(regimeOfYear(1959)).toBe("colonial");
    expect(regimeOfYear(1960)).toBe("modern");
    expect(regimeOfYear(null)).toBeUndefined();
  });
});

describe("buildNameTimeline — the validated fiches", () => {
  const fiches = [
    "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json",
    "dataset/source/afrik/langues/lin.json",
    "dataset/source/afrik/pays/MLI.json",
    "dataset/source/afrik/pays/CIV.json",
    "dataset/source/afrik/patronymes/PAT_TRAORE.json",
    "dataset/source/afrik/pays/COG.json",
  ];

  // @req REQ-198
  it.each(fiches)(
    "%s: one birth at most, nothing but before tiles after the first before tile",
    (path) => {
      const raw = JSON.parse(
        readFileSync(resolve(process.cwd(), path), "utf8")
      );
      const parsed = parseNameHistory(raw.nameHistory);
      expect(parsed.success).toBe(true);

      for (const name of buildNameTimeline(parsed.data!, "").names) {
        const placements = name.tiles.map(({ placement }) => placement);
        const firstBefore = placements.indexOf("before");
        expect(placements.filter((p) => p === "birth").length).toBeLessThan(2);
        if (firstBefore >= 0) {
          expect(
            placements.slice(firstBefore).every((p) => p === "before")
          ).toBe(true);
        }
        const accounts = name.tiles.flatMap((tile) => tile.accounts);
        expect(accounts).toHaveLength(
          parsed.data!.names.find((n) => n.nameText === name.nameText)!.accounts
            .length
        );
      }
    }
  );

  // @req REQ-198
  it("shows the lingala birth in 1902 with the bobangi and Bangala tiles below it", () => {
    const raw = JSON.parse(
      readFileSync(
        resolve(process.cwd(), "dataset/source/afrik/langues/lin.json"),
        "utf8"
      )
    );
    const [lingala] = buildNameTimeline(raw.nameHistory, "lingala").names;
    const birth = lingala.tiles.findIndex((t) => t.placement === "birth");

    expect(lingala.nameText).toBe("Lingala");
    expect(lingala.tiles[birth].periodLabel).toBe("1902");
    const below = lingala.tiles
      .slice(birth + 1)
      .filter((t) => t.placement === "before")
      .map((t) => t.accounts[0].statement);
    expect(below.some((s) => s.includes("bobangi"))).toBe(true);
    expect(below.some((s) => s.includes("Bangala"))).toBe(true);
  });
});

describe("splitNamedText — names in italics", () => {
  // @req REQ-198
  it("marks every listed name and written form, whatever its case", () => {
    expect(
      splitNamedText("Le nom lingala remplace Bangala.", ["Lingala", "Bangala"])
    ).toEqual([
      { text: "Le nom " },
      { text: "lingala", name: true },
      { text: " remplace " },
      { text: "Bangala", name: true },
      { text: "." },
    ]);
  });

  // @req REQ-198
  it("prefers the longest form and never matches inside a word", () => {
    expect(
      splitNamedText("Le Congo français n'est pas Congolais.", [
        "Congo",
        "Congo français",
      ])
    ).toEqual([
      { text: "Le " },
      { text: "Congo français", name: true },
      { text: " n'est pas Congolais." },
    ]);
  });

  // @req REQ-198
  it("reads letters outside the Latin alphabet as part of a word", () => {
    expect(splitNamedText("Les Fulɓe et les Fulɓeyankoo.", ["Fulɓe"])).toEqual([
      { text: "Les " },
      { text: "Fulɓe", name: true },
      { text: " et les Fulɓeyankoo." },
    ]);
  });

  // @req REQ-198
  it("lists the names and written forms the block itself records", () => {
    expect(buildNameTimeline(PEUL_HISTORY, "peul").italicForms).toEqual(
      expect.arrayContaining(["Fulɓe", "Peul", "Peuls ou Peulhs"])
    );
  });
});
