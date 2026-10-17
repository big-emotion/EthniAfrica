/**
 * A name's own address, end to end on the server: the real handlers build the
 * envelopes, the real loaders map them, the real result page renders them to
 * HTML. Only the database services are replaced.
 */
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
import { ftsSearch } from "@/api/v2/services/searchService";
import { VALID_NAME_HISTORY } from "@/lib/afrik/parsers/__tests__/fixtures";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import { getNameAnswerRoute } from "@/lib/routing";
import { LINGALA_HISTORY } from "@/lib/search/__fixtures__/nameTimelineFixtures";
import { searchQueryLog } from "@/lib/search/searchQueryLog";
import { getAnsweredNameRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";
import type { FtsSearchResponse } from "@/types/afrik";

/** Traore is filed unaccented and told « Traoré » by its history. */
const TRAORE_HISTORY = {
  ...LINGALA_HISTORY,
  names: [{ ...LINGALA_HISTORY.names[0], nameText: "Traoré" }],
};

function searchAnswering(languages: Array<Record<string, unknown>>) {
  return {
    peoples: [],
    countries: [],
    families: [],
    persons: [],
    patronymes: [],
    quizzes: [],
    languages,
    places: [],
    words: [],
    results: [],
    peoplesTotal: 0,
    countriesTotal: 0,
    familiesTotal: 0,
    personsTotal: 0,
    patronymesTotal: 0,
    quizzesTotal: 0,
    languagesTotal: languages.length,
    placesTotal: 0,
    wordsTotal: 0,
    total: languages.length,
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
    searchAnswering([
      { id: "lin", name: "Lingala", exactMatch: true, relevance: 1 },
    ])
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
    vi.mocked(ftsSearch).mockResolvedValue(searchAnswering([]));

    const html = await serverHtml("ethnie");
    const head = await generateMetadata({ params: params("ethnie") });

    expect(html).toMatch(/<h1[^>]*>[^<]*[Ee]thnie[^<]*<\/h1>/);
    expect(head.alternates?.canonical).toBe(
      `https://${CANONICAL_DOMAIN}${getNameAnswerRoute("fr", "ethnie")}`
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
