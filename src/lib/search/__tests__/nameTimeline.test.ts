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
  periodRuns,
  regimeOfYear,
  splitAtLastWord,
  splitNamedText,
  type TimelineTile,
} from "@/lib/search/nameTimeline";

const historyOf = (path: string) => {
  const raw = JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
  return parseNameHistory(raw.nameHistory).data!;
};
const FULA = "dataset/source/afrik/peuples/FLG_ATLANTIQUE/PPL_FULA.json";
const BASSA_CAM = "dataset/source/afrik/peuples/FLG_BANTU/PPL_BASSA_CAM.json";

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
      readings: 0,
    });
    expect(buildNameTimeline(PEUL_HISTORY, "fulbe").selfLead).toBeUndefined();
  });

  // « al-Jaʿali » and « Al-Jaali » compare equal under the fold (REQ-135);
  // the reader who typed one of them searched that one, not both.
  // @req REQ-135
  it("marks only the history spelling typed, never one the fold equates with it", () => {
    const history = historyOf(
      "dataset/source/afrik/patronymes/PAT_AL_JAALI.json"
    );
    const searched = (query: string) =>
      buildNameTimeline(history, query)
        .names.filter((name) => name.searched)
        .map(({ nameText }) => nameText);

    expect(searched("Al-Jaali")).toEqual(["Al-Jaali"]);
    expect(searched("al-Jaʿali")).toEqual(["al-Jaʿali"]);
  });

  // Brief 11 §1a: the lead announces only the explanations the page shows,
  // the accounts of the explanations tiles built for the self-name.
  // @req REQ-197
  it("counts the self-name's explanations the timeline builds: five for Fulɓe", () => {
    expect(buildNameTimeline(historyOf(FULA), "peul").selfLead).toEqual({
      searched: "Peul",
      self: "Fulɓe",
      readings: 5,
    });
  });

  // « origine du nom Basaa » holds one account: told as a plain tile, so the
  // page has no explanations tile to announce.
  // @req REQ-197
  it("counts none when the self-name's lone explanation builds no tile", () => {
    expect(
      buildNameTimeline(historyOf(BASSA_CAM), "bassa").selfLead
    ).toMatchObject({ searched: "Bassa", self: "Basaa", readings: 0 });
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
  it("inks a tile by the era its accounts declare before guessing from the date", () => {
    const source = LINGALA_HISTORY.names[0].accounts[0].sources[0];
    const dated = (year: number) => ({
      period: { from: year, to: year, label: String(year) },
      statement: `Le nom Testa est daté de ${year}.`,
      sources: [source],
    });
    const history = {
      summary: "Le nom Testa est porté depuis longtemps.",
      names: [
        {
          nameText: "Testa",
          nameStatus: "current" as const,
          selfGiven: true,
          languageOfOrigin: null,
          namedBy: null,
          accounts: [
            {
              period: { from: null, to: null, label: "Usage contemporain" },
              era: "modern" as const,
              statement: "Le nom Testa est employé aujourd'hui.",
              sources: [source],
            },
            // Liberia or Ethiopia in 1900: no colonial rule to infer.
            { ...dated(1900), era: "polity" as const },
            // Saint-Louis in 1850, already under French rule.
            { ...dated(1850), era: "colonial" as const },
            dated(1700),
          ],
        },
      ],
    };

    const regimes = buildNameTimeline(history, "testa").names[0].tiles.map(
      (tile) => [tile.periodLabel, tile.regime]
    );

    expect(regimes).toEqual([
      ["Usage contemporain", "modern"],
      ["1900", "polity"],
      ["1850", "colonial"],
      ["1700", "polity"],
    ]);
  });

  // @req REQ-198
  it("inks a group of undated hypotheses only when they all declare one era", () => {
    const withEras = (eras: ("polity" | "colonial")[]) => ({
      ...LINGALA_HISTORY,
      names: [
        {
          ...LINGALA_HISTORY.names[0],
          accounts: LINGALA_HISTORY.names[0].accounts.map((account) =>
            account.hypothesisGroup && !account.birth && !account.before
              ? { ...account, era: eras.shift() }
              : account
          ),
        },
      ],
    });
    const groupOf = (history: typeof LINGALA_HISTORY) =>
      buildNameTimeline(history, "lingala").names[0].tiles.find(
        (tile) => tile.hypotheses
      )!;

    expect(groupOf(withEras(["polity", "polity", "polity"])).regime).toBe(
      "polity"
    );
    expect(
      groupOf(withEras(["polity", "colonial", "polity"])).regime
    ).toBeUndefined();
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

describe("periodRuns — a period printed once over the tiles that share it", () => {
  const tile = (
    periodLabel: string,
    placement: TimelineTile["placement"] = "plain",
    hypotheses = false
  ): TimelineTile => ({
    key: `${placement}:${periodLabel}:${hypotheses}`,
    placement,
    periodLabel,
    regime: "modern",
    hypotheses,
    accounts: [],
  });
  const labels = (runs: TimelineTile[][]) =>
    runs.map((run) =>
      run.map(
        ({ placement, periodLabel, hypotheses }) =>
          `${placement}${hypotheses ? "+hypotheses" : ""} ${periodLabel}`
      )
    );

  // @req REQ-198
  it("joins Peul's two « Usage contemporain » tiles and keeps every account", () => {
    const peul = buildNameTimeline(historyOf(FULA), "peul").names[0];
    const runs = periodRuns(peul.tiles);

    expect(runs.map((run) => run.map((t) => t.periodLabel))).toEqual([
      ["Usage contemporain", "Usage contemporain"],
      ["Rapporté dans un article de 1966"],
      ["1842"],
    ]);
    expect(runs.flat()).toEqual(peul.tiles);
  });

  // @req REQ-198
  it("never joins a birth, a before or an explanations tile to another", () => {
    expect(
      labels(
        periodRuns([
          tile("2025"),
          tile("2025", "birth"),
          tile("2025"),
          tile("2025", "plain", true),
          tile("2025"),
          tile("2025", "before"),
          tile("2025", "before"),
        ])
      )
    ).toEqual([
      ["plain 2025"],
      ["birth 2025"],
      ["plain 2025"],
      ["plain+hypotheses 2025"],
      ["plain 2025"],
      ["before 2025"],
      ["before 2025"],
    ]);
  });

  // @req REQ-198
  it("joins only tiles in a row, and never two without a period", () => {
    const undated = { ...tile("x"), periodLabel: undefined };
    expect(
      periodRuns([tile("A"), tile("B"), tile("A"), undated, undated]).map(
        (run) => run.length
      )
    ).toEqual([1, 1, 1, 1, 1]);
  });
});

describe("splitAtLastWord — the passage's last word goes with its sources button", () => {
  // @req REQ-194
  it("cuts a plain sentence at its last space", () => {
    expect(splitAtLastWord([{ text: "Le nom est attesté en 1902." }])).toEqual([
      [{ text: "Le nom est attesté en " }],
      [{ text: "1902." }],
    ]);
  });

  // A name of several words is never cut, and guillemets stay with the words
  // they enclose, as French typography wants (board search-congo-430).
  // @req REQ-194
  it("keeps a final name of several words and its closing guillemet whole", () => {
    expect(
      splitAtLastWord(
        splitNamedText("le nom du pays est « République du Congo ».", [
          "République du Congo",
        ])
      )
    ).toEqual([
      [{ text: "le nom du pays est " }],
      [
        { text: "« " },
        { text: "République du Congo", name: true },
        { text: " »." },
      ],
    ]);
  });

  // @req REQ-194
  it("keeps a one-word passage whole", () => {
    expect(splitAtLastWord([{ text: "Attesté." }])).toEqual([
      [],
      [{ text: "Attesté." }],
    ]);
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
