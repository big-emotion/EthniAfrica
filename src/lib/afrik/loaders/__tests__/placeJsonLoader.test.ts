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
      countryId: "CIV",
      associatedPeoples: [{ peopleId: "PPL_BAOULE" }],
      nameHistory: yamoussoukro.nameHistory,
    });
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
    countryId: "CIV",
    associatedPeoples: [{ peopleId: "PPL_BAOULE", relation: "fondateurs" }],
    summary: "Capitale politique.",
    content: { gaps: [], sources: [] },
    nameHistory: null,
    ...overrides,
  };
}

const references = {
  countryIds: new Set(["CIV"]),
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

    const report = await loadPlaces(client, [place({ countryId: "XXX" })], {
      references,
    });

    expect(report.inserted).toBe(0);
    expect(report.errors).toEqual([
      "LOC_YAMOUSSOUKRO: countryId XXX does not resolve to a country fiche",
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
