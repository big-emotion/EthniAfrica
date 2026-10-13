import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import {
  WAVE_SIZE,
  cutWaves,
  nameHistoryCoverage,
  orderTail,
  readTail,
  renderWaveList,
  renderWaveSummary,
  type TailSubject,
} from "../lib/nameHistoryWaveOrder";

const subject = (overrides: Partial<TailSubject>): TailSubject => ({
  id: "PPL_X",
  kind: "people",
  group: "FLG_A",
  visitors: 0,
  population: null,
  spread: 1,
  ...overrides,
});

describe("orderTail", () => {
  // @req REQ-196
  it("puts visited fiches before unvisited ones, whatever their population", () => {
    const ordered = orderTail([
      subject({ id: "PPL_BIG", population: 5_000_000 }),
      subject({ id: "PPL_SEEN", visitors: 1, population: 10 }),
    ]);

    expect(ordered.map((s) => s.id)).toEqual(["PPL_SEEN", "PPL_BIG"]);
  });

  // @req REQ-196
  it("ranks unvisited peoples by population band, an unknown population last", () => {
    const ordered = orderTail([
      subject({ id: "PPL_UNKNOWN", group: "FLG_A" }),
      subject({ id: "PPL_SMALL", group: "FLG_B", population: 5_000 }),
      subject({ id: "PPL_MID", group: "FLG_C", population: 300_000 }),
      subject({ id: "PPL_LARGE", group: "FLG_D", population: 2_000_000 }),
    ]);

    expect(ordered.map((s) => s.id)).toEqual([
      "PPL_LARGE",
      "PPL_MID",
      // Same band: the known population comes first, the unknown one after.
      "PPL_SMALL",
      "PPL_UNKNOWN",
    ]);
  });

  // @req REQ-196
  it("keeps the members of one family together inside a demand tier", () => {
    const ordered = orderTail([
      subject({ id: "PPL_A1", group: "FLG_A", population: 900_000 }),
      subject({ id: "PPL_B1", group: "FLG_B", population: 800_000 }),
      subject({ id: "PPL_A2", group: "FLG_A", population: 200_000 }),
      subject({ id: "PPL_B2", group: "FLG_B", population: 700_000 }),
    ]);

    // All four sit in one band; family B outweighs family A, so B goes first
    // and each family stays whole.
    expect(ordered.map((s) => s.id)).toEqual([
      "PPL_B1",
      "PPL_B2",
      "PPL_A1",
      "PPL_A2",
    ]);
  });

  // @req REQ-196
  it("orders family names by visits, then by countries spanned, grouped by country", () => {
    const ordered = orderTail([
      subject({ id: "PAT_SOLO", kind: "family-name", group: "GIN", spread: 1 }),
      subject({
        id: "PAT_WIDE",
        kind: "family-name",
        group: "MLI",
        spread: 3,
      }),
      subject({
        id: "PAT_SEEN",
        kind: "family-name",
        group: "GIN",
        spread: 1,
        visitors: 2,
      }),
    ]);

    expect(ordered.map((s) => s.id)).toEqual([
      "PAT_SEEN",
      "PAT_WIDE",
      "PAT_SOLO",
    ]);
  });

  // @req REQ-196
  it("is deterministic: the input order does not change the result", () => {
    const input = [
      subject({ id: "PPL_C", group: "FLG_B", population: 1 }),
      subject({ id: "PPL_A", group: "FLG_A", population: 1 }),
      subject({ id: "PPL_B", group: "FLG_A", population: 1 }),
    ];

    expect(orderTail(input)).toEqual(orderTail([...input].reverse()));
  });
});

describe("cutWaves", () => {
  const many = (kind: TailSubject["kind"], count: number) =>
    Array.from({ length: count }, (_, i) =>
      subject({ id: `${kind}_${String(i).padStart(3, "0")}`, kind })
    );

  // @req REQ-196
  it("cuts waves of 60 and alternates peoples and family names from the first wave", () => {
    const waves = cutWaves(many("people", 130), many("family-name", 70), 14);

    expect(WAVE_SIZE).toBe(60);
    expect(waves.map((w) => [w.number, w.kind, w.subjects.length])).toEqual([
      [14, "people", 60],
      [15, "family-name", 60],
      [16, "people", 60],
      [17, "family-name", 10],
      [18, "people", 10],
    ]);
  });

  // @req REQ-196
  it("carries on with the other kind once one runs out", () => {
    const waves = cutWaves(many("people", 60), many("family-name", 120), 14);

    expect(waves.map((w) => [w.number, w.kind])).toEqual([
      [14, "people"],
      [15, "family-name"],
      [16, "family-name"],
    ]);
  });
});

describe("coverage and tail on a corpus", () => {
  const root = mkdtempSync(join(tmpdir(), "wave-order-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  const realHistory = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        "dataset/source/afrik/peuples/FLG_KROU/PPL_BAKWE.json"
      ),
      "utf8"
    )
  ).nameHistory;

  const write = (path: string, fiche: unknown) => {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(fiche));
  };

  write("peuples/FLG_A/PPL_DONE.json", {
    id: "PPL_DONE",
    languageFamilyId: "FLG_A",
    nameHistory: realHistory,
  });
  write("peuples/FLG_A/PPL_BROKEN.json", {
    id: "PPL_BROKEN",
    languageFamilyId: "FLG_A",
    nameHistory: { summary: "x", names: [] },
  });
  write("peuples/FLG_B/PPL_TODO.json", {
    id: "PPL_TODO",
    languageFamilyId: "FLG_B",
    currentCountries: ["GIN", "MLI"],
    content: { demography: { totalPopulation: 250000 } },
  });
  write("peuples/V1/PPL_OLD.json", { id: "PPL_OLD" });
  write("patronymes/PAT_TODO.json", {
    id: "PAT_TODO",
    countries: [{ countryId: "GIN" }, { countryId: "MLI" }],
    peoples: [],
  });
  write("patronymes/_manifest.json", { not: "a fiche" });

  // @req REQ-196
  it("counts a nameHistory as complete only when the validator's schema accepts it", () => {
    const peuples = nameHistoryCoverage(root).find(
      (row) => row.folder === "peuples"
    );

    expect(peuples).toEqual({ folder: "peuples", fiches: 3, complete: 1 });
  });

  // @req REQ-196
  it("reports a folder that is missing as empty rather than failing", () => {
    const lieux = nameHistoryCoverage(root).find(
      (row) => row.folder === "lieux"
    );

    expect(lieux).toEqual({ folder: "lieux", fiches: 0, complete: 0 });
  });

  // @req REQ-196
  it("lists as tail every fiche without a complete nameHistory, with its demand signals", () => {
    const tail = readTail(root, { PPL_TODO: 4 });

    expect(tail.map((s) => s.id).sort()).toEqual([
      "PAT_TODO",
      "PPL_BROKEN",
      "PPL_TODO",
    ]);
    expect(tail.find((s) => s.id === "PPL_TODO")).toEqual({
      id: "PPL_TODO",
      kind: "people",
      group: "FLG_B",
      visitors: 4,
      population: 250000,
      spread: 2,
    });
    expect(tail.find((s) => s.id === "PAT_TODO")).toMatchObject({
      kind: "family-name",
      group: "GIN",
      spread: 2,
    });
  });
});

describe("the rendered tables", () => {
  const waves = cutWaves(
    [
      subject({ id: "PPL_A1", group: "FLG_A" }),
      subject({ id: "PPL_A2", group: "FLG_A" }),
      subject({ id: "PPL_B1", group: "FLG_B" }),
    ],
    [],
    14
  );

  // @req REQ-196
  it("summarises a wave by its family mix and its first and last id", () => {
    expect(renderWaveSummary(waves)).toContain(
      "| 14 | people | 3 | `FLG_A` 2, `FLG_B` 1 | `PPL_A1` | `PPL_B1` |"
    );
  });

  // @req REQ-196
  it("names the four largest groups of a wave and counts the others", () => {
    const groups = ["A", "B", "C", "D", "E", "F"].map((g, i) =>
      subject({ id: `PPL_${g}${i}`, group: `FLG_${g}` })
    );

    expect(renderWaveSummary(cutWaves(groups, [], 14))).toContain(
      "`FLG_A` 1, `FLG_B` 1, `FLG_C` 1, `FLG_D` 1, 2 more"
    );
  });

  // @req REQ-196
  it("lists the ids of a wave grouped by family, compactly", () => {
    expect(renderWaveList(waves)).toContain(
      "- `FLG_A`: `PPL_A1`, `PPL_A2`\n- `FLG_B`: `PPL_B1`"
    );
  });
});
