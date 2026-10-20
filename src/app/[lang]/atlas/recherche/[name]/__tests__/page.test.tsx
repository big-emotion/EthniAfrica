/**
 * A name's own address, end to end on the server: the real handlers build the
 * envelopes, the real loaders map them, the real result page renders them to
 * HTML. Only the database services are replaced.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", async () => {
  const { getLocalizedRoute } = await import("@/lib/routing");
  return {
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
    permanentRedirect: (path: string) => {
      throw new Error(`NEXT_PERMANENT_REDIRECT:${path}`);
    },
    usePathname: () => getLocalizedRoute("fr", "search"),
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  };
});
vi.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: unknown[]) => unknown) => callback,
}));
vi.mock("@/components/layout/PageLayout", () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@/hooks/use-language", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/use-language")>()),
  useLanguage: () => ({ language: "fr", setLanguage: vi.fn() }),
}));
vi.mock("@/lib/supabase/queries/afrik/nameAddressEntries", () => ({
  getAnsweredNameRows: vi.fn(),
}));
// Left real; one test hands the real walk a table that fails to read.
vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/supabase/server")>();
  return {
    ...original,
    createServerClient: vi.fn(original.createServerClient),
  };
});
vi.mock("@/api/v2/services/searchService", () => ({ ftsSearch: vi.fn() }));
vi.mock("@/api/v2/services/searchCompanions", () => ({
  getSearchCompanionSelections: vi.fn(async () => ({
    subjects: [],
    targets: [],
    shorts: { count: 0, items: [] },
    anecdotes: { count: 0, items: [] },
    proverbs: { count: 0, items: [] },
    quiz: { count: 0, items: [] },
  })),
}));
vi.mock("@/api/v2/services/languageService", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getLanguageById: vi.fn(),
}));
vi.mock("@/api/v2/services/patronymes", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getPatronymeById: vi.fn(async () => null),
}));
// A page with no subject offers two seed names next; their fiches are not
// what these tests read.
vi.mock("@/api/v2/services/peopleService", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getPeopleById: vi.fn(async () => null),
}));
vi.mock("@/api/v2/services/countryService", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCountryById: vi.fn(async () => null),
}));
vi.mock("@/lib/search/searchQueryLog", () => ({
  searchQueryLog: { write: vi.fn() },
}));

import NameAddressLayout from "@/app/[lang]/atlas/recherche/[name]/layout";
import NameAddressPage, {
  generateMetadata,
} from "@/app/[lang]/atlas/recherche/[name]/page";
import { getLanguageById } from "@/api/v2/services/languageService";
import { getPatronymeById } from "@/api/v2/services/patronymes";
import { getSearchCompanionSelections } from "@/api/v2/services/searchCompanions";
import { ftsSearch } from "@/api/v2/services/searchService";
import { VALID_NAME_HISTORY } from "@/lib/afrik/parsers/__tests__/fixtures";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import { getNameAnswerRoute } from "@/lib/routing";
import { LINGALA_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import { readAnswer } from "@/lib/search/answer";
import { nameSearchHref } from "@/lib/search/nameAddress";
import { wordNamingData } from "@/lib/supabase/queries/afrik/searchNaming";
import { searchQueryLog } from "@/lib/search/searchQueryLog";
import { getAnsweredNameRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";
import { createServerClient } from "@/lib/supabase/server";
import type { FtsSearchResponse } from "@/types/afrik";

/** Traore is filed unaccented and told « Traoré » by its history. */
const TRAORE_HISTORY = {
  ...LINGALA_HISTORY,
  names: [{ ...LINGALA_HISTORY.names[0], nameText: "Traoré" }],
};

/** PPL_FULA is filed « Peul »; its history tells « Fulɓe » first. */
const FULA_HISTORY = {
  ...LINGALA_HISTORY,
  names: [
    { ...LINGALA_HISTORY.names[0], nameText: "Fulɓe" },
    { ...LINGALA_HISTORY.names[0], nameText: "Peul" },
  ],
};

type SearchRow = Record<string, unknown>;

function searchAnswering({
  peoples = [],
  languages = [],
  patronymes = [],
  words = [],
}: {
  peoples?: SearchRow[];
  languages?: SearchRow[];
  patronymes?: SearchRow[];
  words?: SearchRow[];
} = {}) {
  return {
    peoples,
    countries: [],
    families: [],
    persons: [],
    patronymes,
    quizzes: [],
    languages,
    places: [],
    words,
    results: [],
    peoplesTotal: peoples.length,
    countriesTotal: 0,
    familiesTotal: 0,
    personsTotal: 0,
    patronymesTotal: patronymes.length,
    quizzesTotal: 0,
    languagesTotal: languages.length,
    placesTotal: 0,
    wordsTotal: words.length,
    total: peoples.length + languages.length + patronymes.length + words.length,
    leads: [],
    nearNames: [],
  } as unknown as FtsSearchResponse;
}

const params = (name: string) => Promise.resolve({ lang: "fr", name });

async function serverHtml(name: string) {
  return renderToString(await NameAddressPage({ params: params(name) }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAnsweredNameRows).mockResolvedValue([
    { name: "Lingala", nameHistory: LINGALA_HISTORY },
    { name: "Traore", nameHistory: TRAORE_HISTORY },
    // Its one account cites an oral account left unverified.
    { name: "Yoruba", nameHistory: VALID_NAME_HISTORY },
  ]);
  vi.mocked(ftsSearch).mockResolvedValue(
    searchAnswering({
      languages: [
        { id: "lin", name: "Lingala", exactMatch: true, relevance: 1 },
      ],
    })
  );
  vi.mocked(getLanguageById).mockResolvedValue({
    id: "lin",
    name: "Lingala",
    nameProvenance: "sourced",
    isoCode639_3: "lin",
    glottocode: null,
    nameEn: null,
    alternateNames: [],
    spellingAliases: [],
    dialects: [],
    family: { id: "FLG_BANTU", name: "Bantou" },
    speakingPeoples: [],
    vehicularRole: null,
    vitalityStatus: null,
    sources: [],
    nameHistory: LINGALA_HISTORY,
  } as unknown as Awaited<ReturnType<typeof getLanguageById>>);
});

describe("the address of an answered name", () => {
  // The answer is in the HTML the server sends, so a crawler that runs no
  // script reads it.
  // @req REQ-200
  it("carries the answer in its server HTML, headed by the corpus spelling", async () => {
    const html = await serverHtml("lingala");

    expect(html).toMatch(/<h1[^>]*>Lingala<\/h1>/);
    // The opening sentence, with the searched form marked inside it.
    expect(html.replace(/<[^>]+>/g, "")).toContain(
      "Le nom lingala désigne une langue du bassin du Congo"
    );
    expect(ftsSearch).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Lingala" })
    );
  });

  // An address is not a query a reader typed: the public list of what
  // readers ask is not filled by crawlers reading addresses.
  // @req REQ-200
  it("does not log the address as a typed query", async () => {
    await serverHtml("lingala");

    expect(searchQueryLog.write).not.toHaveBeenCalled();
  });

  // @req REQ-200
  it("answers 404 for a form the corpus does not answer", async () => {
    await expect(
      NameAddressLayout({ children: null, params: params("zzqx") })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  // @req REQ-200
  it("answers 404 for a form whose accounts cite nothing above unverified", async () => {
    await expect(
      NameAddressLayout({ children: null, params: params("yoruba") })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  // @req REQ-200
  it("sends an accent or case variant to the corpus spelling by one permanent redirect", async () => {
    // getNameAnswerRoute("fr", "Traoré") is …/traor%C3%A9 (routing.test.ts).
    await expect(
      NameAddressLayout({ children: null, params: params("traore") })
    ).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:${getNameAnswerRoute("fr", "Traoré")}`
    );
    await expect(
      NameAddressLayout({ children: null, params: params("Lingala") })
    ).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:${getNameAnswerRoute("fr", "lingala")}`
    );
  });

  // @req REQ-200
  it("lets the address itself through, encoded or not", async () => {
    for (const segment of ["traor%C3%A9", "traoré", "lingala"]) {
      await expect(
        NameAddressLayout({ children: "page", params: params(segment) })
      ).resolves.toBe("page");
    }
  });

  // A published word of the production ledger has no fiche: the search
  // answers it from the registry, and its address renders that answer.
  // @req REQ-200
  it("renders a ledger word's answer on the server, with its own head", async () => {
    vi.mocked(ftsSearch).mockResolvedValue(searchAnswering());

    const html = await serverHtml("ethnie");
    const head = await generateMetadata({ params: params("ethnie") });

    expect(html).toMatch(/<h1[^>]*>[^<]*[Ee]thnie[^<]*<\/h1>/);
    expect(head.alternates?.canonical).toBe(
      `https://${CANONICAL_DOMAIN}${getNameAnswerRoute("fr", "ethnie")}`
    );
  });

  // ETNI-2110 regression: « tribu » is used in the prose of many fiches. The
  // word fiche answers it; the prose hits never turn the page into the
  // « N fiches donnent cette écriture » verdict, and nothing on the page
  // leads back to the page itself.
  // @req REQ-200
  it("answers « tribu » with its word fiche even when fiche prose uses the word", async () => {
    const tribu = JSON.parse(
      readFileSync(
        join(process.cwd(), "dataset/source/afrik/mots/WRD_TRIBU.json"),
        "utf8"
      )
    );
    const naming = wordNamingData(tribu.id, tribu.nameHistory);
    const proseRow = (id: string, nameMain: string) => ({
      id,
      nameMain,
      content: {},
      relevance: 0.2,
      exactMatch: false,
      recordedIn: [
        {
          fieldPath: "content.history.colonialClassification",
          text: `Les administrateurs coloniaux ont classé les ${nameMain} comme une tribu.`,
        },
      ],
    });
    vi.mocked(getAnsweredNameRows).mockResolvedValue([
      { name: "tribu", nameHistory: tribu.nameHistory },
    ]);
    vi.mocked(ftsSearch).mockResolvedValue(
      searchAnswering({
        peoples: [
          proseRow("PPL_KIKUYU", "Kikuyu"),
          proseRow("PPL_ZULU", "Zoulou"),
        ],
        words: [
          {
            ...tribu,
            relevance: 1,
            exactMatch: true,
            answer: readAnswer("word", {}, tribu, {
              nameRecords: naming.records,
              evidence: naming.evidence,
            }),
          },
        ],
      })
    );

    const html = await serverHtml("tribu");
    const text = html.replace(/<[^>]+>/g, "").replace(/&#x27;/g, "'");

    expect(text).toContain(tribu.definition);
    expect(text).not.toMatch(/fiches donnent cette écriture/);
    expect(html).not.toContain(`href="${getNameAnswerRoute("fr", "tribu")}"`);
    expect(html).not.toContain(nameSearchHref("fr", "tribu"));
  });

  // The variant's redirect lands on a page headed as the corpus writes the
  // name, not as it is filed (AC 3).
  // @req REQ-200
  it("heads the address of a family name filed unaccented with its corpus spelling", async () => {
    vi.mocked(ftsSearch).mockResolvedValue(
      searchAnswering({
        patronymes: [
          {
            id: "PAT_TRAORE",
            nameMain: "Traore",
            nameSystem: "clan_name",
            casteOrSocialFunction: null,
            content: {},
            relevance: 1,
            exactMatch: true,
            normalizedScore: 1,
            snippet: null,
          },
        ],
      })
    );
    vi.mocked(getPatronymeById).mockResolvedValue({
      id: "PAT_TRAORE",
      nameMain: "Traore",
      nameSystem: "clan_name",
      casteOrSocialFunction: null,
      content: { nameMain: "Traore" },
      associatedPeoples: [],
      associatedCountries: [],
      bearers: [],
      namedBearers: [],
      alliances: [],
      nameHistory: TRAORE_HISTORY,
    });

    const html = await serverHtml("traor%C3%A9");

    expect(html).toMatch(/<h1[^>]*>Traoré<\/h1>/);
  });

  // A failed read is not a smaller corpus. A 404 tells crawlers the address
  // is gone; an error is retried and leaves the address standing.
  // @req REQ-200
  it("answers an error, not 404, when a names table cannot be read", async () => {
    const { getAnsweredNameRows: walkTables } = await vi.importActual<
      typeof import("@/lib/supabase/queries/afrik/nameAddressEntries")
    >("@/lib/supabase/queries/afrik/nameAddressEntries");
    vi.mocked(getAnsweredNameRows).mockImplementation(walkTables);
    const languagesDown = {
      from: (table: string) => ({
        select: () => ({
          range: async () =>
            table === "afrik_languages"
              ? { data: null, error: { message: "range error" } }
              : { data: [], error: null },
        }),
      }),
    };
    vi.mocked(createServerClient).mockReturnValueOnce(
      languagesDown as unknown as ReturnType<typeof createServerClient>
    );

    const layout = NameAddressLayout({
      children: "page",
      params: params("lingala"),
    });

    await expect(layout).rejects.toThrow("afrik_languages");
    await expect(layout).rejects.not.toThrow("NEXT_NOT_FOUND");
  });

  // Crawlers read the address. During an outage it answers an error, never a
  // 200 page with a retry button at the canonical address.
  // @req REQ-200
  it("answers an error, not an indexable outage page, when the reading fails", async () => {
    vi.mocked(ftsSearch).mockRejectedValueOnce(new Error("search is down"));
    await expect(serverHtml("lingala")).rejects.toThrow();

    vi.mocked(getSearchCompanionSelections).mockRejectedValueOnce(
      new Error("companions are down")
    );
    await expect(serverHtml("lingala")).rejects.toThrow();
  });

  // ETNI-2093: a name the history tells, not the filed one, gets its own
  // address, and the page there reads the fiche that history belongs to.
  // @req REQ-200
  it("gives a name a history tells its own address, which reads that fiche", async () => {
    vi.mocked(getAnsweredNameRows).mockResolvedValue([
      { name: "Peul", nameHistory: FULA_HISTORY },
    ]);
    vi.mocked(ftsSearch).mockResolvedValue(
      searchAnswering({
        peoples: [
          {
            id: "PPL_FULA",
            nameMain: "Peul",
            content: {},
            exactMatch: true,
            relevance: 1,
            historyNames: ["Fulɓe", "Peul"],
            // What the search service builds from the history's names.
            answer: {
              kind: "people",
              title: "Peul",
              names: [
                { form: "Fulɓe", selfGiven: true },
                { form: "Peul", selfGiven: false },
              ],
              what: { facts: {} },
              sources: { count: 1 },
            },
          },
        ],
      })
    );

    await expect(
      NameAddressLayout({ children: "page", params: params("ful%C9%93e") })
    ).resolves.toBe("page");
    await expect(
      NameAddressLayout({ children: null, params: params("FUL%C6%81E") })
    ).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:${getNameAnswerRoute("fr", "Fulɓe")}`
    );
    // The address key folds accents and case only (DEC-074).
    await expect(
      NameAddressLayout({ children: null, params: params("fulbe") })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    const html = await serverHtml("ful%C9%93e");
    const head = await generateMetadata({ params: params("ful%C9%93e") });

    expect(html).toMatch(/<h1[^>]*>Fulɓe<\/h1>/);
    expect(html).not.toContain("sans établir qu’elles répondent à ce nom");
    expect(ftsSearch).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Fulɓe" })
    );
    expect(head.alternates?.canonical).toBe(
      `https://${CANONICAL_DOMAIN}/fr/atlas/recherche/ful%C9%93e`
    );
  });

  // @req REQ-200
  it("declares its own title, description and canonical", async () => {
    const head = await generateMetadata({ params: params("lingala") });

    expect(String(head.title)).toContain("Lingala");
    expect(String(head.title)).not.toContain("Recherche");
    expect(head.description).toContain("Lingala");
    const address = `https://${CANONICAL_DOMAIN}${getNameAnswerRoute("fr", "lingala")}`;
    expect(head.alternates?.canonical).toBe(address);
    expect(head.openGraph?.url).toBe(address);
  });
});
