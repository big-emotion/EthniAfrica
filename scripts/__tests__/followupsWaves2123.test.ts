import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import retiredPatronymes from "../../dataset/source/afrik/patronymes/_retired-identifiers.json";
import { parsePatronymeFile } from "../../src/lib/afrik/parsers/patronymeParser";
import { getPatronymeRoute } from "../../src/lib/routing";

// The open questions that waves 21 to 23 of the long tail left (ETNI-2011):
// two family names folded into their keepers and the small source and link
// corrections the wave agents reported. The classification part is in
// patronymeNameSystemReclassification.test.ts.

const ROOT = process.cwd();
const AFRIK = resolve(ROOT, "dataset/source/afrik");
const LEDGER_FILE = "_retired-identifiers.json";
const RULED_ON = "2026-10-16";

const BRYANT_1929_URL = "https://archive.org/details/bwb_KT-091-892";
const BRYANT_1929_TITLE =
  "Olden Times in Zululand and Natal — Containing Earlier Political History of the Eastern-Nguni Clans";
const BRYANT_1905_URL = "https://archive.org/details/zuluenglishdicti00brya";
const NAJEM_URL =
  "https://westminsterresearch.westminster.ac.uk/download/926d7d076329ed28eba6c6893c17630fb1ec633a9e37b4a2ac4ea32394f484ed/19198678/Najem.pdf";
const LUSEKELO_MTENGA_URL =
  "https://www.researchgate.net/publication/342876767_Historicity_of_personal_names_in_Tanzania_the_case_of_the_names_in_the_Rombo-Chagga_community_in_Kilimanjaro";

// Same reading as the arbitration test of waves 14 to 19: a live reference to
// a retired id would be a dangling link. The wave-order plans name subjects
// before they are worked and the validator's report is a local artefact.
const REFERENCE_ROOTS: Array<[string, RegExp]> = [
  ["dataset/source/afrik", /\.json$/],
  ["docs/editorial", /\.(json|md)$/],
  ["src", /\.(ts|tsx)$/],
  ["scripts/__tests__", /\.ts$/],
];
const GENERATED_PLANS = /name-history-(long-tail-waves|priority-core)\.md$/;

const PATRONYME_FOLDS: Array<[string, string]> = [
  ["PAT_KOROMA", "PAT_KOUROUMA"],
  ["PAT_BANGURA", "PAT_BANGOURA"],
];

function filesUnder(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return filesUnder(path, pattern);
    return pattern.test(entry) && entry !== LEDGER_FILE ? [path] : [];
  });
}

function patronymeFile(id: string) {
  return resolve(AFRIK, "patronymes", `${id}.json`);
}

function readPatronyme(id: string) {
  return JSON.parse(readFileSync(patronymeFile(id), "utf8"));
}

function readPeople(id: string) {
  const family = readdirSync(resolve(AFRIK, "peuples")).find((folder) =>
    existsSync(resolve(AFRIK, "peuples", folder, `${id}.json`))
  );
  if (!family) throw new Error(`no fiche for ${id}`);
  return JSON.parse(
    readFileSync(resolve(AFRIK, "peuples", family, `${id}.json`), "utf8")
  );
}

type Citation = Record<string, unknown> & {
  url?: string;
  title?: string;
  page?: string | null;
  notes?: string;
  source_kind?: string;
};

function citationsOf(fiche: unknown, url: string): Citation[] {
  const found: Citation[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      const record = value as Citation;
      if (record.url === url) found.push(record);
      Object.values(record).forEach(walk);
    }
  };
  walk(fiche);
  return found;
}

function everyCitationOf(url: string, roots: string[]): Citation[] {
  return roots.flatMap((root) =>
    filesUnder(resolve(AFRIK, root), /\.json$/)
      .filter((file) => !file.includes("/archive/"))
      .flatMap((file) =>
        citationsOf(JSON.parse(readFileSync(file, "utf8")), url)
      )
  );
}

const ledgerEntry = (id: string) =>
  retiredPatronymes.find((candidate) => candidate.retiredId === id);

describe("the family-name ledger after the waves 21 to 23 follow-ups", () => {
  // @req REQ-141
  it.each(PATRONYME_FOLDS)("folds %s into %s", (id, keeper) => {
    expect(ledgerEntry(id)).toMatchObject({
      decision: "merged",
      successorId: keeper,
      decidedOn: RULED_ON,
    });
    expect(existsSync(patronymeFile(keeper))).toBe(true);
    expect(existsSync(patronymeFile(id))).toBe(false);
  });

  // @req REQ-141
  it("names, in each reason, what the keeper took over", () => {
    expect(ledgerEntry("PAT_KOROMA")?.reason).toMatch(/Sierra Leone/);
    expect(ledgerEntry("PAT_KOROMA")?.reason).toMatch(/Bamadaba/);
    expect(ledgerEntry("PAT_BANGURA")?.reason).toMatch(/Sierra Leone/);
    expect(ledgerEntry("PAT_BANGURA")?.reason).toMatch(/Bamadaba/);
  });

  // @req REQ-141
  it("redirects a retired family-name page to its keeper", async () => {
    const { vi } = await import("vitest");
    vi.doMock("@sentry/nextjs", () => ({
      withSentryConfig: (config: unknown) => config,
    }));
    const { default: nextConfig } = await import("../../next.config");
    const redirects = (await nextConfig.redirects()) as Array<{
      source: string;
      destination: string;
    }>;

    for (const [id, keeper] of PATRONYME_FOLDS) {
      expect(
        redirects.find((r) => r.source === getPatronymeRoute("fr", id))
          ?.destination
      ).toBe(getPatronymeRoute("fr", keeper));
    }
  });

  // @req REQ-141
  it("leaves nothing pointing at a retired id", () => {
    const pattern = new RegExp(
      `\\b(${PATRONYME_FOLDS.map(([id]) => id).join("|")})\\b`
    );
    const dangling = REFERENCE_ROOTS.flatMap(([root, files]) =>
      filesUnder(resolve(ROOT, root), files)
    )
      .filter((file) => !GENERATED_PLANS.test(file))
      .filter((file) => !file.includes("/logs/"))
      .filter((file) => !file.endsWith("followupsWaves2123.test.ts"))
      .filter((file) => pattern.test(readFileSync(file, "utf8")));

    expect(dangling).toEqual([]);
  });
});

describe("what Kourouma took over from Koroma", () => {
  const kourouma = () => readPatronyme("PAT_KOUROUMA");

  // @req REQ-141
  it("attests the spelling Koroma in Sierra Leone on the Bamadaba and the Kuranko fiche", () => {
    const koroma = kourouma().spellings.find(
      (entry: { spelling: string }) => entry.spelling === "Koroma"
    );
    const sierraLeone = koroma.attestations.find(
      (entry: { countryId: string }) => entry.countryId === "SLE"
    );

    expect(sierraLeone.sourceRefs).toEqual(
      expect.arrayContaining(["bamadaba-jamuw", "corpus-ppl-kuranko-clans"])
    );
    expect(sierraLeone.sourceRefs).not.toContain("afrik-candidate-queue");
  });

  // @req REQ-141
  it("links Sierra Leone and the Kuranko, as supposed and attested by the Kuranko fiche", () => {
    const fiche = kourouma();

    expect(
      fiche.countries.find(
        (entry: { countryId: string }) => entry.countryId === "SLE"
      )
    ).toMatchObject({
      status: "supposed",
      sourceRefs: ["corpus-ppl-kuranko-clans"],
    });
    expect(
      fiche.peoples.find(
        (entry: { peopleId: string }) => entry.peopleId === "PPL_KURANKO"
      )
    ).toMatchObject({
      status: "attested",
      sourceRefs: ["corpus-ppl-kuranko-clans"],
    });
    expect(
      fiche.peoples.map((e: { peopleId: string }) => e.peopleId)
    ).toContain("PPL_MALINKE");
  });

  // @req REQ-141
  it("cites the Kuranko fiche without quoting a chapter title the plain-language check flags", () => {
    const source = kourouma().sources.find(
      (entry: { sourceKey: string }) =>
        entry.sourceKey === "corpus-ppl-kuranko-clans"
    );

    expect(source).toMatchObject({ source_kind: "repository" });
    expect(source.notes).not.toMatch(/Ethnonymes/);
  });

  // @req REQ-141
  it("still parses and keeps the Guinea attestation", () => {
    const fiche = kourouma();

    expect(parsePatronymeFile(fiche).success).toBe(true);
    expect(
      fiche.countries.find(
        (entry: { countryId: string }) => entry.countryId === "GIN"
      )
    ).toBeDefined();
  });
});

describe("what Bangoura took over from Bangura", () => {
  const bangoura = () => readPatronyme("PAT_BANGOURA");

  // @req REQ-141
  it("attests the spelling Bangura in Sierra Leone on the Bamadaba alone, without the queue", () => {
    const bangura = bangoura().spellings.find(
      (entry: { spelling: string }) => entry.spelling === "Bangura"
    );

    expect(bangura.attestations).toEqual([
      { countryId: "SLE", sourceRefs: ["bamadaba-jamuw"] },
    ]);
  });

  // @req REQ-141
  it("marks Sierra Leone as supposed, on the one source that gave it", () => {
    expect(
      bangoura().countries.find(
        (entry: { countryId: string }) => entry.countryId === "SLE"
      )
    ).toMatchObject({
      status: "supposed",
      sourceRefs: ["afrik-candidate-queue"],
    });
  });

  // @req REQ-141
  it("keeps the tile saying that neither source speaks of Sierra Leone", () => {
    const entry = bangoura().nameHistory.names.find(
      (name: { nameText: string }) => name.nameText === "Bangura"
    );
    const statement = entry.accounts
      .map((account: { statement: string }) => account.statement)
      .join(" ");

    expect(entry.variantSpelling).toBe(true);
    expect(statement).toMatch(/Sierra Leone/);
    expect(statement).toMatch(/Guinée/);
    expect(
      entry.accounts.flatMap((account: { sources: Array<{ page?: string }> }) =>
        account.sources.map((source) => source.page ?? null)
      )
    ).toContain("p. 303");
  });

  // @req REQ-141
  it("keeps the gap that says no fiche links the name to a people in Sierra Leone", () => {
    const fiche = bangoura();

    expect(parsePatronymeFile(fiche).success).toBe(true);
    expect(
      fiche.gaps.some(
        ({ fieldPath, reason }: { fieldPath: string; reason: string }) =>
          fieldPath === "peoples" && /Sierra Leone/.test(reason)
      )
    ).toBe(true);
  });
});

describe("small source and link corrections reported by waves 21 to 23", () => {
  // @req REQ-136
  it("gives PAT_AMADHILA three different spellings, each on Mbenzi", () => {
    const spellings = readPatronyme("PAT_AMADHILA").spellings.map(
      (entry: { spelling: string }) => entry.spelling
    );

    expect(spellings).toEqual(["Amadhila", "Amathila", "Amadila"]);
  });

  // @req REQ-141
  it("adds the Zululand and Natal attestation of Ncube under South Africa, on Bryant", () => {
    const ncube = readPatronyme("PAT_NCUBE");
    const zaf = ncube.countries.find(
      (entry: { countryId: string }) => entry.countryId === "ZAF"
    );
    const spelling = ncube.spellings.find(
      (entry: { spelling: string }) => entry.spelling === "Ncube"
    );
    const keys = ncube.sources.map(
      (source: { sourceKey: string }) => source.sourceKey
    );

    expect(parsePatronymeFile(ncube).success).toBe(true);
    expect(zaf.status).toBe("attested");
    expect(zaf.sourceRefs).toEqual(
      expect.arrayContaining(["bryant-1905-zulu-dictionary"])
    );
    for (const ref of zaf.sourceRefs) expect(keys).toContain(ref);
    expect(
      spelling.attestations.map((e: { countryId: string }) => e.countryId)
    ).toEqual(expect.arrayContaining(["ZWE", "ZAF"]));
    expect(
      ncube.countries.map((e: { countryId: string }) => e.countryId)
    ).toContain("ZWE");
  });

  // @req REQ-136
  it("adds the spelling Meneses to PAT_MENEZES as Vasconcelos writes it, with his page", () => {
    const entry = readPatronyme("PAT_MENEZES").nameHistory.names.find(
      (name: { nameText: string }) => name.nameText === "Meneses"
    );
    const birth = entry.accounts.find(
      (account: { birth?: boolean }) => account.birth
    );

    expect(entry.variantSpelling).toBe(true);
    expect(birth.formAsWritten).toBe("Meneses");
    expect(birth.sources[0]).toMatchObject({
      year: 1928,
      page: "p. 164",
    });
    expect(
      readPatronyme("PAT_MENEZES").nameHistory.names.filter(
        (name: { accounts: Array<{ birth?: boolean }> }) =>
          name.accounts.some((account) => account.birth)
      )
    ).toHaveLength(1);
  });

  // @req REQ-136
  it("does not link PAT_MKAPA to the Makonde on a speech that names five peoples", () => {
    const mkapa = readPatronyme("PAT_MKAPA");
    const bank = mkapa.sources.find(
      (source: { sourceKey: string }) =>
        source.sourceKey === "world-bank-mkapa-matrilineal"
    );

    expect(
      mkapa.peoples.map((entry: { peopleId: string }) => entry.peopleId)
    ).not.toContain("PPL_MAKONDE");
    expect(
      mkapa.peoples.find(
        (entry: { peopleId: string }) => entry.peopleId === "PPL_MAKUA"
      )
    ).toMatchObject({ status: "supposed", sourceRefs: ["chanzo-mkapa-2023"] });
    expect(bank.notes).not.toMatch(/p\. 178/);
    expect(bank.notes).toMatch(/168/);
    expect(bank.notes).not.toMatch(/filiation matrilinéaire makonde/);
  });

  // @req REQ-136
  it("relinks nothing for PAT_NYERERE, and drops the Wikipedia-only caterpillar story", () => {
    const nyerere = readPatronyme("PAT_NYERERE");

    expect(nyerere.peoples).toEqual([]);
    expect(
      nyerere.gaps.find(
        ({ fieldPath }: { fieldPath: string }) => fieldPath === "peoples"
      ).reason
    ).toMatch(/Zanaki/);
    expect(JSON.stringify(nyerere)).not.toMatch(/wikipedia/i);
    expect(JSON.stringify(nyerere.origin)).not.toMatch(/chenille/);
    expect(parsePatronymeFile(nyerere).success).toBe(true);
  });

  // @req REQ-136
  it("says why PAT_GBAGUIDI keeps the Fon link as supposed: the sources say Mahi", () => {
    const gbaguidi = readPatronyme("PAT_GBAGUIDI");
    const gap = gbaguidi.gaps.find(
      ({ fieldPath }: { fieldPath: string }) => fieldPath === "peoples"
    );

    expect(gbaguidi.peoples[0]).toMatchObject({
      peopleId: "PPL_FON",
      status: "supposed",
    });
    expect(gap.reason).toMatch(/Mahi/);
    expect(gap.reason).toMatch(/Nago/);
  });

  // @req REQ-136
  it("cites for PAT_AL_MIRGHANI the article the link opens: al-Shahi, 1988", () => {
    const mirghani = readPatronyme("PAT_AL_MIRGHANI");
    const source = mirghani.sources.find(
      (entry: { url: string | null }) =>
        entry.url && /ora\.ox\.ac\.uk/.test(entry.url)
    );

    expect(source.title).toBe(
      "Some personal names and nicknames among the riverain people of northern Sudan"
    );
    expect(source.notes).toMatch(/al-Shahi/);
    expect(source.notes).toMatch(/1988/);
    expect(source.notes).toMatch(
      /Journal of the Anthropological Society of Oxford/
    );
    expect(JSON.stringify(mirghani)).not.toMatch(
      /Sufism and Politics|oxford-al-mirghani|L.étude d.Oxford/
    );
    expect(parsePatronymeFile(mirghani).success).toBe(true);
  });

  // @req REQ-136
  it.each(["PAT_TARHOUNI", "PAT_TRABELSI"])(
    "reads Najem on %s at the printed pages 216 and 219",
    (id) => {
      const citations = citationsOf(readPatronyme(id), NAJEM_URL);

      expect(citations.length).toBeGreaterThan(0);
      for (const citation of citations) {
        expect(citation.page).toBe("p. 216 ; p. 219");
        expect(citation.notes).toMatch(/Page 216/);
        expect(citation.notes).toMatch(/Page 219/);
        expect(citation.notes).not.toMatch(/Page 215|Pages 218/);
      }
    }
  );

  // @req REQ-136
  it("reads the Lusekelo and Mtenga tables for PAT_SHAYO at the printed pages 105 to 107", () => {
    const citations = citationsOf(
      readPatronyme("PAT_SHAYO"),
      LUSEKELO_MTENGA_URL
    );
    const pages = citations.map((citation) => citation.page);

    expect(pages).toContain("p. 105-107");
    expect(pages.filter((page) => page === "p. 107")).toHaveLength(2);
    for (const citation of citations) {
      expect(citation.page).not.toMatch(/108/);
      expect(citation.notes).not.toMatch(/Page 108/);
    }
  });

  // @req REQ-136
  it("cites Bryant 1929 under one title and one kind in every people and family-name fiche", () => {
    const citations = everyCitationOf(BRYANT_1929_URL, [
      "peuples",
      "patronymes",
    ]);

    expect(new Set(citations.map((c) => c.title))).toEqual(
      new Set([BRYANT_1929_TITLE])
    );
    expect(new Set(citations.map((c) => c.source_kind))).toEqual(
      new Set(["academic"])
    );
  });

  // @req REQ-136
  it("cites Bryant 1905 under one title and one kind, Ncube included", () => {
    const citations = everyCitationOf(BRYANT_1905_URL, [
      "peuples",
      "patronymes",
    ]);

    expect(citations.length).toBeGreaterThan(1);
    expect(new Set(citations.map((c) => c.title))).toEqual(
      new Set(["A Zulu-English Dictionary"])
    );
    expect(new Set(citations.map((c) => c.source_kind))).toEqual(
      new Set(["linguistic_reference"])
    );
  });
});

describe("PPL_NDEBELE_SA", () => {
  // @req REQ-136
  it("types its Bryant citation as academic, as the family-name fiches do", () => {
    const [citation] = citationsOf(
      readPeople("PPL_NDEBELE_SA"),
      BRYANT_1929_URL
    );

    expect(citation).toMatchObject({
      title: BRYANT_1929_TITLE,
      source_kind: "academic",
    });
  });
});
