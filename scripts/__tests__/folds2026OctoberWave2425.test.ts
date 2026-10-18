import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredIdentifiers from "../../dataset/source/afrik/_retired-identifiers.json";
import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { RETIRED_PEOPLE_IDS } from "../../src/lib/afrik/retiredPeopleIds";
import { getPatronymeRoute } from "../../src/lib/routing";

// The duplicates, unattested fiches and names that are not surnames which
// waves 24 (peoples) and 25 (family names) of the long tail reported,
// arbitrated on the operator's approval of 2026-10-18 (ETNI-2011). The wave
// agents reported them and folded or retired nothing.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");
const LEDGER_FILE = "_retired-identifiers.json";
const RULED_ON = "2026-10-18";

// Where a live reference to an id can sit. The archive `.txt` notes, the
// demography CSV and the dated visit snapshot under scripts/data are frozen
// exports, left alone by every earlier fold. The wave-order lists under
// docs/editorial/strategy are generated plans that name the subjects of a
// wave before they are worked. The production ledger names corpus subjects
// and its own gate refuses an id the corpus no longer holds.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.(json|md)$/],
  ["docs/productions", /\.json$/],
  ["src", /\.(ts|tsx)$/],
  ["scripts/__tests__", /\.ts$/],
];
const GENERATED_PLANS = /name-history-(long-tail-waves|priority-core)\.md$/;

const PEOPLE_FOLDS: Array<[string, string]> = [["PPL_MUCUBAL", "PPL_MUCUVAL"]];

// Retired with no keeper: unattested as a people, or a census or analytic
// category that no source uses as a name.
const PEOPLE_WITHDRAWN = [
  "PPL_TAAL",
  "PPL_GUWA",
  "PPL_MBOGO",
  "PPL_MOBE",
  "PPL_AUTRES_PEUPLES_BANTOUS",
  "PPL_PEUPLES_FORESTIERS_DU_SUD_ET_DE_L_EST",
  "PPL_AFRICAINS_D_ORIGINE_RECENTE",
];

const PATRONYME_FOLDS: Array<[string, string]> = [
  ["PAT_NJIE", "PAT_NDIAYE"],
  ["PAT_JALLOW", "PAT_DIALLO"],
  ["PAT_JALLOH", "PAT_DIALLO"],
  ["PAT_ADEN", "PAT_ADAM"],
];

// An ethnonym, two given names, a name known only from one court citation and
// the head of tribal group names: no source opened tells any of them as a
// family name. Ahl Sidi was left off the coordinator's list although wave 25
// recommended retiring it with Ngarta and Ngarlejy.
const PATRONYME_WITHDRAWN = [
  "PAT_EL_KENZI",
  "PAT_NGARLEJY",
  "PAT_NGARTA",
  "PAT_KIGOZI",
  "PAT_AHL_SIDI",
];

const RETIRED_PEOPLE = [...PEOPLE_FOLDS.map(([id]) => id), ...PEOPLE_WITHDRAWN];
const RETIRED_PATRONYMES = [
  ...PATRONYME_FOLDS.map(([id]) => id),
  ...PATRONYME_WITHDRAWN,
];

interface Source {
  sourceKey?: string;
  title?: string;
  url?: string | null;
  page?: string;
}
interface Account {
  statement: string;
  birth?: boolean;
  aspect?: string;
  formAsWritten?: string;
  hypothesisGroup?: string;
  sources: Source[];
}
interface HistoryName {
  nameText: string;
  selfGiven: boolean;
  accounts: Account[];
}

function filesUnder(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, pattern);
    return pattern.test(entry) && entry !== LEDGER_FILE ? [path] : [];
  });
}

function peopleFile(id: string): string | undefined {
  return readdirSync(resolve(AFRIK, "peuples"))
    .map((family) => resolve(AFRIK, "peuples", family, `${id}.json`))
    .find((file) => existsSync(file));
}

function readPeople(id: string) {
  const file = peopleFile(id);
  if (!file) throw new Error(`no fiche for ${id}`);
  return JSON.parse(readFileSync(file, "utf8"));
}

function patronymeFile(id: string) {
  return resolve(AFRIK, "patronymes", `${id}.json`);
}

function readPatronyme(id: string) {
  return JSON.parse(readFileSync(patronymeFile(id), "utf8"));
}

function readCountry(id: string) {
  return JSON.parse(readFileSync(resolve(AFRIK, "pays", `${id}.json`), "utf8"));
}

const historyName = (
  fiche: { nameHistory: { names: HistoryName[] } },
  text: string
) => fiche.nameHistory.names.find((name) => name.nameText === text);

const ledgerEntry = <Entry extends { retiredId: string }>(
  ledger: Entry[],
  id: string
) => ledger.find((candidate) => candidate.retiredId === id);

describe("ledger and redirects of the waves 24 and 25 arbitration", () => {
  // @req REQ-178
  it.each(PEOPLE_FOLDS)(
    "redirects %s to %s, ruled 2026-10-18",
    (id, keeper) => {
      const entry = ledgerEntry(retiredIdentifiers, id);

      expect(RETIRED_PEOPLE_IDS[id]).toBe(keeper);
      expect(RETIRED_PEOPLE_IDS[keeper]).toBeUndefined();
      expect(entry).toMatchObject({
        decision: "merged",
        successorId: keeper,
        decidedOn: RULED_ON,
      });
      expect(peopleFile(keeper)).toBeDefined();
    }
  );

  // @req REQ-178
  it.each(PEOPLE_WITHDRAWN)(
    "withdraws %s with no keeper to redirect to",
    (id) => {
      const entry = ledgerEntry(retiredIdentifiers, id);

      expect(entry).toMatchObject({
        decision: "withdrawn",
        successorId: null,
        decidedOn: RULED_ON,
      });
      expect(entry?.reason.length).toBeGreaterThan(40);
      expect(RETIRED_PEOPLE_IDS[id]).toBeUndefined();
    }
  );

  // @req REQ-178
  it("leaves no fiche for a retired id, and nothing pointing at one", () => {
    const pattern = new RegExp(
      `\\b(${[...RETIRED_PEOPLE, ...RETIRED_PATRONYMES].join("|")})\\b`
    );
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    )
      .filter((file) => !GENERATED_PLANS.test(file))
      .filter((file) => !file.includes("/logs/"))
      .filter((file) => !file.endsWith("folds2026OctoberWave2425.test.ts"))
      .filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
    for (const id of RETIRED_PEOPLE) expect(peopleFile(id)).toBeUndefined();
    for (const id of RETIRED_PATRONYMES)
      expect(existsSync(patronymeFile(id))).toBe(false);
  });

  // Kept by standing rulings: a test or a kept-distinct entry holds each one.
  // @req REQ-178
  it.each([
    "PPL_JIE_SUD",
    "PPL_MANDE_MACRO",
    "PPL_MANDE_DU_SUD",
    "PPL_GA_DANGME",
  ])("leaves %s as it was ruled", (id) => {
    expect(peopleFile(id)).toBeDefined();
    expect(RETIRED_PEOPLE_IDS[id]).toBeUndefined();
    const entry = ledgerEntry(retiredIdentifiers, id);
    if (entry) expect(entry.decision).toBe("kept-distinct");
  });
});

describe("the family-name ledger", () => {
  // @req REQ-141
  it.each(PATRONYME_FOLDS)("folds %s into %s", (id, keeper) => {
    expect(ledgerEntry(retiredPatronymes, id)).toMatchObject({
      decision: "merged",
      successorId: keeper,
      decidedOn: RULED_ON,
    });
    expect(existsSync(patronymeFile(keeper))).toBe(true);
  });

  // @req REQ-141
  it.each(PATRONYME_WITHDRAWN)("withdraws %s with no successor", (id) => {
    const entry = ledgerEntry(retiredPatronymes, id);

    expect(entry).toMatchObject({
      decision: "withdrawn",
      successorId: null,
      decidedOn: RULED_ON,
    });
    expect(entry?.reason.length).toBeGreaterThan(40);
  });

  // Not acted on: no source opened ties Nalubega to Lubega, or Momade to
  // Mohamed. The operator keeps the others by ruling.
  // @req REQ-141
  it.each([
    "PAT_NALUBEGA",
    "PAT_MOMADE",
    "PAT_BIKADAL",
    "PAT_ATEBA",
    "PAT_NONO",
    "PAT_NYUSI",
    "PAT_KOLLO",
  ])("keeps %s as a fiche", (id) => {
    expect(existsSync(patronymeFile(id))).toBe(true);
    expect(ledgerEntry(retiredPatronymes, id)).toBeUndefined();
  });

  // @req REQ-141
  it("redirects a folded name to its keeper and a withdrawn one nowhere", async () => {
    const { vi } = await import("vitest");
    vi.doMock("@sentry/nextjs", () => ({
      withSentryConfig: (config: unknown) => config,
    }));
    const { default: nextConfig } = await import("../../next.config");
    const redirects = (await nextConfig.redirects()) as Array<{
      source: string;
      destination: string;
    }>;
    const destinationOf = (id: string) =>
      redirects.find((r) => r.source === getPatronymeRoute("fr", id))
        ?.destination;

    for (const [id, keeper] of PATRONYME_FOLDS)
      expect(destinationOf(id)).toBe(getPatronymeRoute("fr", keeper));
    for (const id of PATRONYME_WITHDRAWN)
      expect(destinationOf(id)).toBeUndefined();
  });
});

describe("what the keepers carry over", () => {
  // @req REQ-178
  it("tells Kuvale as the self-name of the people the Portuguese called Mucubal", () => {
    const mucuval = readPeople("PPL_MUCUVAL");
    const kuvale = historyName(mucuval, "Kuvale");
    const selfName = kuvale?.accounts.find((account) =>
      account.sources.some((source) => /Kakombola/.test(source.title ?? ""))
    );

    expect(mucuval.nameHistory.selfNameUnknown).toBeUndefined();
    expect(kuvale?.selfGiven).toBe(true);
    expect(selfName?.sources[0].page).toBe("p. 38, note 48");
  });

  // @req REQ-178
  it("gives Kuvale its oldest written trace in Estermann's album of 1960", () => {
    const kuvale = historyName(readPeople("PPL_MUCUVAL"), "Kuvale");
    const births = kuvale?.accounts.filter((account) => account.birth) ?? [];

    expect(births).toHaveLength(1);
    expect(births[0].formAsWritten).toBe("Kuvale");
    expect(births[0].sources[0]).toMatchObject({
      author: "Carlos Estermann",
      page: "p. 8, 24",
    });
  });

  // @req REQ-178
  it("lists Kuvale in Maho's Bantu classification under R101", () => {
    const kuvale = historyName(readPeople("PPL_MUCUVAL"), "Kuvale");

    expect(
      kuvale?.accounts.some(
        (account) =>
          /R101/.test(account.statement) &&
          account.sources.some((source) => source.page === "p. 86")
      )
    ).toBe(true);
  });

  // @req REQ-178
  it("keeps Mucubal as a name given from outside, still used in 2022", () => {
    const mucuval = readPeople("PPL_MUCUVAL");
    const mucubal = historyName(mucuval, "Mucubal");

    expect(mucubal?.selfGiven).toBe(false);
    expect(
      mucubal?.accounts.some((account) =>
        account.sources.some((source) =>
          /verangola\.net/.test(source.url ?? "")
        )
      )
    ).toBe(true);
    expect(mucuval.content.appellations.exonyms).toContain("Mucubal");
    expect(mucuval.content.appellations.whyProblematic).not.toMatch(
      /groupe Herero distinct/
    );
    // The name at issue is now attributed to colonial documents.
    expect(mucuval.classificationStatus).toBe("colonial-legacy");
  });

  // @req REQ-178
  it("files Kuvale as the self-name of PPL_MUCUVAL and never as an outside name", () => {
    const { appellations } = readPeople("PPL_MUCUVAL").content;

    expect(appellations.selfAppellation).toBe("Kuvale");
    expect(appellations.exonyms).not.toContain("OvaKuvale");
    expect(appellations.exonyms).not.toContain("Kuvale");
  });

  // The self-name rests on one historian reporting two earlier authors, in
  // the past tense: the summary says so rather than stating it as today's fact.
  // @req REQ-178
  it("attributes the Kuvale self-name in the PPL_MUCUVAL summary", () => {
    const { summary } = readPeople("PPL_MUCUVAL").nameHistory;

    expect(summary).toMatch(/Selon l'historien Rafael Coca de Campos/);
    expect(summary).not.toMatch(/Kuvale est celui que se donne/);
  });

  // @req REQ-178
  it("carries Satzinger's two origins of the name Kenzi to PPL_NUBIENS", () => {
    const kenzi = historyName(readPeople("PPL_NUBIENS"), "Kenzi");
    const hypotheses =
      kenzi?.accounts.filter((account) => account.hypothesisGroup) ?? [];

    expect(kenzi?.selfGiven).toBe(false);
    expect(hypotheses).toHaveLength(2);
    expect(
      new Set(hypotheses.map((account) => account.hypothesisGroup)).size
    ).toBe(1);
    for (const account of kenzi?.accounts ?? []) {
      expect(account.sources[0]).toMatchObject({
        author: "Helmut Satzinger",
        page: "p. 748",
      });
    }
  });

  // @req REQ-141
  it("adds Njie in the Gambia to PAT_NDIAYE, with the Bakweri homonym, on the DAFN", () => {
    const ndiaye = readPatronyme("PAT_NDIAYE");
    const dafn = ndiaye.sources.find((source: Source) =>
      /surname=njie/.test(source.url ?? "")
    );
    const njie = ndiaye.spellings.find(
      (entry: { spelling: string }) => entry.spelling === "Njie"
    );
    const gambia = ndiaye.countries.find(
      (entry: { countryId: string }) => entry.countryId === "GMB"
    );

    expect(njie.attestations).toEqual([
      { countryId: "GMB", sourceRefs: [dafn.sourceKey] },
    ]);
    expect(gambia.sourceRefs).toEqual([dafn.sourceKey]);
    expect(ndiaye.homonyms).toContainEqual(
      expect.objectContaining({ entityType: "people", entityId: "PPL_BAKWERI" })
    );
    expect(
      ndiaye.gaps.map((gap: { fieldPath: string }) => gap.fieldPath)
    ).not.toContain("homonyms");
  });

  // @req REQ-141
  it("attests the Gambia of PAT_DIALLO on the DAFN entry for Jallow", () => {
    const diallo = readPatronyme("PAT_DIALLO");
    const dafn = diallo.sources.find(
      (source: Source) =>
        source.url === "https://en.geneanet.org/surnames/JALLOW"
    );
    const gambia = diallo.countries.find(
      (entry: { countryId: string }) => entry.countryId === "GMB"
    );

    expect(gambia.sourceRefs).toContain(dafn.sourceKey);
  });

  // @req REQ-141
  it("tells Adan and Aden as Somali forms of Adam on PAT_ADAM", () => {
    const adam = readPatronyme("PAT_ADAM");
    const adan = historyName(adam, "Adan");
    const aden = historyName(adam, "Aden");
    const burton = adan?.accounts.find((account) => account.birth);

    expect(burton?.formAsWritten).toBe("Adan");
    expect(burton?.sources[0]).toMatchObject({
      author: "Richard F. Burton",
      page: "p. 18, note",
    });
    expect(
      aden?.accounts.some((account) =>
        account.sources.some((source) => /surname=aden/.test(source.url ?? ""))
      )
    ).toBe(true);
  });

  // @req REQ-141
  it("carries Aden in Djibouti and its bearer to PAT_ADAM", () => {
    const adam = readPatronyme("PAT_ADAM");
    const presidence = adam.sources.find((source: Source) =>
      /presidence\.dj/.test(source.url ?? "")
    );
    const aden = adam.spellings.find(
      (entry: { spelling: string }) => entry.spelling === "Aden"
    );

    expect(aden.attestations).toEqual([
      { countryId: "DJI", sourceRefs: [presidence.sourceKey] },
    ]);
    expect(adam.countries).toContainEqual(
      expect.objectContaining({ countryId: "DJI", status: "attested" })
    );
    expect(adam.bearers).toContainEqual(
      expect.objectContaining({ displayName: "Djama Guedi Aden" })
    );
  });

  // The DAFN entry folded in for Aden also gives two European family names
  // spelled Aden, of other origins: one homonym, as PAT_WOLDE records them.
  // @req REQ-141
  it("records the European Aden as a homonym of PAT_ADAM", () => {
    const adam = readPatronyme("PAT_ADAM");
    const dafnAden = adam.sources.find((source: Source) =>
      /surname=aden/.test(source.url ?? "")
    );

    expect(adam.homonyms).toContainEqual(
      expect.objectContaining({
        entityType: "patronyme",
        entityId: null,
        sourceRefs: [dafnAden.sourceKey],
      })
    );
    expect(
      adam.gaps.map((gap: { fieldPath: string }) => gap.fieldPath)
    ).not.toContain("homonyms");
  });
});

describe("references repointed", () => {
  // @req REQ-149
  it.each([
    ["GAB", "Autres peuples bantous"],
    ["CMR", "Peuples forestiers du Sud et de l'Est"],
    ["CPV", "Africains d'origine récente"],
  ])("keeps the %s row « %s » without a people id", (countryId, name) => {
    const country = readCountry(countryId);
    const row = country.content.majorPeoples.find(
      (entry: { name: string }) => entry.name === name
    );

    expect(row).toBeDefined();
    expect(row.peopleId).toBeNull();
  });

  // @req REQ-149
  it("keeps the Cabo Verde census of foreign residents on the country fiche", () => {
    const capeVerde = readCountry("CPV");

    expect(capeVerde.content.historicalFacts.postIndependence).toMatch(
      /10 869/
    );
    expect(
      capeVerde.content.sources.map((source: Source) => source.url)
    ).toContain(
      "https://www.migrationpartnershipfacility.eu/news/answering-the-call-cabo-verdes-local-immigration-units-support-migrants-arriving-by-boat"
    );
  });
});
