import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadAllPlaceFiches,
  loadPlaces,
  type PlaceFiche,
} from "../placeJsonLoader";

vi.mock("@/lib/api/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const yamoussoukro = JSON.parse(
  readFileSync(
    join(process.cwd(), "dataset/source/afrik/lieux/LOC_YAMOUSSOUKRO.json"),
    "utf8"
  )
) as Record<string, unknown>;

let datasetRoot: string;

/** A copy of a fiche without its single country, to build a region. */
function withoutCountry(fiche: Record<string, unknown>) {
  const copy = { ...fiche };
  delete copy.countryId;
  return copy;
}

function writePlace(fileName: string, fiche: Record<string, unknown>) {
  const dir = join(datasetRoot, "lieux");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, fileName), JSON.stringify(fiche));
}

beforeEach(() => {
  datasetRoot = mkdtempSync(join(tmpdir(), "place-loader-"));
});

afterEach(() => {
  rmSync(datasetRoot, { recursive: true, force: true });
});

describe("loadAllPlaceFiches", () => {
  // @req REQ-196
  it("reads a place fiche and keeps the nameHistory block it declares", () => {
    writePlace("LOC_YAMOUSSOUKRO.json", yamoussoukro);

    const { places, errors } = loadAllPlaceFiches(datasetRoot);

    expect(errors).toEqual([]);
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      id: "LOC_YAMOUSSOUKRO",
      placeType: "ville",
      nameMain: "Yamoussoukro",
      countryIds: ["CIV"],
      associatedPeoples: [{ peopleId: "PPL_BAOULE" }],
      nameHistory: yamoussoukro.nameHistory,
    });
  });

  // A region such as the Sahara spans several countries; a town has one.
  // @req REQ-193
  it("reads every country of a region that spans several", () => {
    const rest = withoutCountry(yamoussoukro);
    writePlace("LOC_REGION.json", {
      ...rest,
      id: "LOC_REGION",
      placeType: "region",
      countryIds: ["MLI", "NER", "DZA"],
    });

    const { places, errors } = loadAllPlaceFiches(datasetRoot);

    expect(errors).toEqual([]);
    expect(places[0].countryIds).toEqual(["MLI", "NER", "DZA"]);
  });

  // @req REQ-193
  it("refuses a place with both, neither, one listed or a repeated country", () => {
    const rest = withoutCountry(yamoussoukro);
    const cases: [string, Record<string, unknown>][] = [
      [
        "LOC_BOTH.json",
        { ...yamoussoukro, id: "LOC_BOTH", countryIds: ["CIV", "GHA"] },
      ],
      ["LOC_NEITHER.json", { ...rest, id: "LOC_NEITHER" }],
      ["LOC_ONE.json", { ...rest, id: "LOC_ONE", countryIds: ["CIV"] }],
      [
        "LOC_TWICE.json",
        { ...rest, id: "LOC_TWICE", countryIds: ["CIV", "CIV"] },
      ],
    ];
    for (const [file, fiche] of cases) writePlace(file, fiche);

    const { places, errors } = loadAllPlaceFiches(datasetRoot);

    expect(places).toEqual([]);
    expect(errors).toHaveLength(4);
    for (const error of errors) expect(error).toMatch(/countryId|countryIds/);
  });

  // The legacy names[] block is on its way out of the place model (ETNI-2023):
  // nothing the loader persists may depend on it.
  // @req REQ-196
  it("persists nothing from the legacy names block", () => {
    writePlace("LOC_YAMOUSSOUKRO.json", yamoussoukro);

    const [place] = loadAllPlaceFiches(datasetRoot).places;

    expect(Object.keys(place.content).sort()).toEqual(["gaps", "sources"]);
    expect(place).not.toHaveProperty("names");
  });

  // The place page shows each source's type (doctrine §1.1); a parser that
  // drops `source_kind` leaves every source « type non précisé ».
  // @req REQ-196
  it("keeps the type of each source the fiche declares", () => {
    writePlace("LOC_YAMOUSSOUKRO.json", yamoussoukro);

    const [place] = loadAllPlaceFiches(datasetRoot).places;

    expect(
      (place.content.sources as Array<{ source_kind?: string }>).map(
        (source) => source.source_kind
      )
    ).toEqual(
      (yamoussoukro.sources as Array<{ source_kind: string }>).map(
        (source) => source.source_kind
      )
    );
    expect(
      (place.content.sources as Array<{ source_kind?: string }>)[0]
    ).toMatchObject({ source_kind: "academic" });
  });

  // @req REQ-196
  it("names a fiche that fails the place model instead of dropping it silently", () => {
    writePlace("LOC_BROKEN.json", {
      ...yamoussoukro,
      id: "LOC_BROKEN",
      countryId: "ci",
    });

    const { places, errors } = loadAllPlaceFiches(datasetRoot);

    expect(places).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("LOC_BROKEN.json");
    expect(errors[0]).toContain("countryId");
  });

  // @req REQ-196
  it("answers an empty batch when the corpus has no lieux directory", () => {
    expect(loadAllPlaceFiches(datasetRoot)).toEqual({ places: [], errors: [] });
  });
});

// ─── Supabase test double ──────────────────────────────────────────────────

interface Write {
  table: string;
  op: "upsert" | "delete" | "insert";
  payload: unknown;
}

function fakeSupabase(failOn?: string) {
  const writes: Write[] = [];
  const from = (table: string) => ({
    upsert: (payload: unknown) => {
      writes.push({ table, op: "upsert", payload });
      return Promise.resolve({
        error: failOn === table ? { message: "boom" } : null,
      });
    },
    insert: (payload: unknown) => {
      writes.push({ table, op: "insert", payload });
      return Promise.resolve({ error: null });
    },
    delete: () => ({
      eq: (_column: string, value: unknown) => {
        writes.push({ table, op: "delete", payload: value });
        return Promise.resolve({ error: null });
      },
    }),
  });
  return { client: { from } as never, writes };
}

function place(overrides: Partial<PlaceFiche> = {}): PlaceFiche {
  return {
    id: "LOC_YAMOUSSOUKRO",
    placeType: "ville",
    nameMain: "Yamoussoukro",
    countryIds: ["CIV"],
    associatedPeoples: [{ peopleId: "PPL_BAOULE", relation: "fondateurs" }],
    summary: "Capitale politique.",
    content: { gaps: [], sources: [] },
    nameHistory: null,
    ...overrides,
  };
}

const references = {
  countryIds: new Set(["CIV", "MLI", "NER"]),
  peopleIds: new Set(["PPL_BAOULE"]),
};

describe("loadPlaces", () => {
  // @req REQ-196
  it("writes the place row with its name_history, then its peoples", async () => {
    const { client, writes } = fakeSupabase();
    const nameHistory = yamoussoukro.nameHistory as PlaceFiche["nameHistory"];

    const report = await loadPlaces(client, [place({ nameHistory })], {
      references,
    });

    expect(report).toEqual({ total: 1, inserted: 1, errors: [] });
    expect(writes[0]).toEqual({
      table: "afrik_places",
      op: "upsert",
      payload: expect.objectContaining({
        id: "LOC_YAMOUSSOUKRO",
        place_type: "ville",
        name_main: "Yamoussoukro",
        country_id: "CIV",
        summary: "Capitale politique.",
        content: { gaps: [], sources: [] },
        name_history: nameHistory,
      }),
    });
    expect(writes.slice(1)).toEqual([
      {
        table: "afrik_place_countries",
        op: "delete",
        payload: "LOC_YAMOUSSOUKRO",
      },
      {
        table: "afrik_place_countries",
        op: "insert",
        payload: [
          { place_id: "LOC_YAMOUSSOUKRO", country_id: "CIV", position: 0 },
        ],
      },
      {
        table: "afrik_place_peoples",
        op: "delete",
        payload: "LOC_YAMOUSSOUKRO",
      },
      {
        table: "afrik_place_peoples",
        op: "insert",
        payload: [
          {
            place_id: "LOC_YAMOUSSOUKRO",
            people_id: "PPL_BAOULE",
            relation: "fondateurs",
          },
        ],
      },
    ]);
  });

  // @req REQ-196
  it("refuses a fiche whose countryId does not resolve, naming the fiche", async () => {
    const { client, writes } = fakeSupabase();

    const report = await loadPlaces(client, [place({ countryIds: ["XXX"] })], {
      references,
    });

    expect(report.inserted).toBe(0);
    expect(report.errors).toEqual([
      "LOC_YAMOUSSOUKRO: countryId XXX does not resolve to a country fiche",
    ]);
    expect(writes).toEqual([]);
  });

  // A region has no single country: the row says so with a null country_id,
  // and every country goes to afrik_place_countries in the fiche's order.
  // @req REQ-193
  it("writes a region with no single country and all its countries in order", async () => {
    const { client, writes } = fakeSupabase();

    const report = await loadPlaces(
      client,
      [
        place({
          id: "LOC_REGION",
          countryIds: ["NER", "MLI"],
          associatedPeoples: [],
        }),
      ],
      { references }
    );

    expect(report.errors).toEqual([]);
    expect(writes[0].payload).toEqual(
      expect.objectContaining({ country_id: null })
    );
    expect(writes).toContainEqual({
      table: "afrik_place_countries",
      op: "insert",
      payload: [
        { place_id: "LOC_REGION", country_id: "NER", position: 0 },
        { place_id: "LOC_REGION", country_id: "MLI", position: 1 },
      ],
    });
  });

  // @req REQ-193
  it("refuses a region when any of its countries does not resolve", async () => {
    const { client, writes } = fakeSupabase();

    const report = await loadPlaces(
      client,
      [place({ id: "LOC_REGION", countryIds: ["NER", "XXX"] })],
      { references }
    );

    expect(report.errors).toEqual([
      "LOC_REGION: countryId XXX does not resolve to a country fiche",
    ]);
    expect(writes).toEqual([]);
  });

  // @req REQ-196
  it("refuses a fiche whose associated people does not resolve", async () => {
    const { client } = fakeSupabase();

    const report = await loadPlaces(
      client,
      [place({ associatedPeoples: [{ peopleId: "PPL_NOBODY" }] })],
      { references }
    );

    expect(report.errors).toEqual([
      "LOC_YAMOUSSOUKRO: peopleId PPL_NOBODY does not resolve to a people fiche",
    ]);
  });

  // @req REQ-196
  it("validates without writing on a dry run", async () => {
    const { client, writes } = fakeSupabase();

    const report = await loadPlaces(client, [place()], {
      references,
      dryRun: true,
    });

    expect(report).toEqual({ total: 1, inserted: 0, errors: [] });
    expect(writes).toEqual([]);
  });

  // @req REQ-196
  it("reports a rejected row and goes on with the next fiche", async () => {
    const { client } = fakeSupabase("afrik_places");

    const report = await loadPlaces(client, [place()], { references });

    expect(report.errors).toEqual(["LOC_YAMOUSSOUKRO: afrik_places — boom"]);
  });
});
