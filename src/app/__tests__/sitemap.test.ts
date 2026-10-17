import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/queries/afrik/sitemapEntries", () => ({
  getSitemapEntityIds: vi.fn(),
}));
vi.mock("@/lib/supabase/queries/afrik/nameAddressEntries", () => ({
  getAnsweredNameRows: vi.fn(async () => []),
}));
// The name addresses are cached for an hour; outside Next there is no cache
// to hold them, so the walk runs on every call.
vi.mock("next/cache", () => ({
  unstable_cache: (callback: (...args: unknown[]) => unknown) => callback,
}));

import robots from "../robots";
import sitemap, { revalidate } from "../sitemap";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import { discoveryPath, eligiblePublications } from "@/lib/discoveries/catalog";
import { getDiscoveryPublications } from "@/lib/discoveries/entries";
import { getSitemapEntityIds } from "@/lib/supabase/queries/afrik/sitemapEntries";
import { getAnsweredNameRows } from "@/lib/supabase/queries/afrik/nameAddressEntries";
import { VALID_NAME_HISTORY } from "@/lib/afrik/parsers/__tests__/fixtures";
import {
  LINGALA_HISTORY,
  PEUL_HISTORY,
} from "@/lib/search/__fixtures__/nameTimelineFixtures";
import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getLocalizedRoute,
  getNameAnswerRoute,
  getPatronymeRoute,
  getPeopleLinksRoute,
  getPeopleRoute,
  getPlaceRoute,
  getStaticPageRoute,
} from "@/lib/routing";

const mockedEntityIds = getSitemapEntityIds as unknown as ReturnType<
  typeof vi.fn
>;

const CORPUS = {
  peoples: ["PPL_BAMILEKE", "PPL_WOLOF"],
  countries: ["CMR", "SEN"],
  families: ["FLG_NIGER_CONGO"],
  languages: ["bam", "wol"],
  patronymes: ["PAT_BAMBA_CLAN"],
  places: ["LOC_GAGNOA"],
};

async function urls() {
  const entries = await sitemap();
  return entries.map((entry) => entry.url);
}

describe("sitemap.xml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedEntityIds.mockResolvedValue(CORPUS);
  });

  // A curator adding a first readable citation must move the name into the
  // sitemap after the corpus reload, without waiting for a release.
  // @req REQ-147
  it("refreshes the tier-dependent name set between releases", () => {
    expect(revalidate).toBe(3600);
  });

  // The root layout's metadataBase falls back to localhost:3000. Publishing
  // 890 localhost URLs is the failure this pins.
  // @req REQ-110
  it("addresses every url at the canonical domain", async () => {
    const all = await urls();
    expect(all.length).toBeGreaterThan(0);
    for (const url of all) {
      expect(url.startsWith(`https://${CANONICAL_DOMAIN}/`)).toBe(true);
    }
  });

  // @req REQ-110
  it("carries one url per fiche, plus the peoples' liens sub-route", async () => {
    const all = await urls();
    const base = `https://${CANONICAL_DOMAIN}`;

    expect(all).toContain(`${base}${getFamilyRoute("fr", "FLG_NIGER_CONGO")}`);
    expect(all).toContain(`${base}${getPeopleRoute("fr", "PPL_WOLOF")}`);
    expect(all).toContain(`${base}${getPeopleLinksRoute("fr", "PPL_WOLOF")}`);
    expect(all).toContain(`${base}${getCountryRoute("fr", "CMR")}`);
  });

  // Languages (748) and patronymes (30) have fiche routes but were absent
  // from the sitemap, leaving them unreachable by crawlers (ETNI-1800).
  // @req REQ-139
  // @req REQ-110
  it("carries one url per language and patronyme fiche", async () => {
    const all = await urls();
    const base = `https://${CANONICAL_DOMAIN}`;

    expect(all).toContain(`${base}${getLanguageRoute("fr", "bam")}`);
    expect(all).toContain(`${base}${getLanguageRoute("fr", "wol")}`);
    expect(all).toContain(
      `${base}${getPatronymeRoute("fr", "PAT_BAMBA_CLAN")}`
    );
  });

  // @req REQ-196
  it("carries one url per place page", async () => {
    const all = await urls();

    expect(all).toContain(
      `https://${CANONICAL_DOMAIN}${getPlaceRoute("fr", "LOC_GAGNOA")}`
    );
  });

  // @req REQ-110
  it("lists the rubrics a reader enters by", async () => {
    const all = await urls();
    const base = `https://${CANONICAL_DOMAIN}`;

    for (const path of [
      "/fr",
      getLocalizedRoute("fr", "peoples"),
      getLocalizedRoute("fr", "countries"),
      getLocalizedRoute("fr", "families"),
      "/fr/plan-du-site",
    ]) {
      expect(all, path).toContain(`${base}${path}`);
    }
  });

  // Same treatment as the other corpus rubrics and the already-shipped
  // appellations index (ETNI-1453): the languages and patronymes hub routes
  // are reachable pages, so they are crawlable ones too (ETNI-1795).
  // @req REQ-139
  // @req REQ-110
  it("lists the languages and patronymes hub routes as rubrics", async () => {
    const all = await urls();
    const base = `https://${CANONICAL_DOMAIN}`;

    for (const path of [
      getLocalizedRoute("fr", "languages"),
      getLocalizedRoute("fr", "patronymes"),
    ]) {
      expect(all, path).toContain(`${base}${path}`);
    }
  });

  /**
   * The three axis hubs are pages again (brand charter §8.6). Asserted on the
   * exact URL rather than as a fragment, because `/fr/atlas` is a prefix of
   * the facet routes the sitemap also publishes — a `toContain` on the
   * fragment would pass on `/fr/atlas/peuples` alone and say nothing about the
   * hub. The three arrive through `getSiteTreePaths`, which is this file's
   * only feed.
   */
  // @req REQ-114
  it("publishes each axis hub", async () => {
    const all = await urls();
    const base = `https://${CANONICAL_DOMAIN}`;

    for (const page of ["atlasHub", "dossiersHub", "jeuxHub"] as const) {
      expect(all, page).toContain(`${base}${getLocalizedRoute("fr", page)}`);
    }
  });

  // @req REQ-110
  it("omits the authenticated, terminal and combinatorial routes", async () => {
    const all = await urls();
    const paths = all.map((url) =>
      url.replace(`https://${CANONICAL_DOMAIN}`, "")
    );

    for (const fragment of [
      "/fr/admin",
      `${getLocalizedRoute("fr", "quiz")}/score`,
      "/fr/report-error",
    ]) {
      expect(
        paths.filter((path) => path.startsWith(fragment)),
        fragment
      ).toEqual([]);
    }

    // /comparer is in; the pairs it can build are not.
    expect(paths).toContain("/fr/comparer");
    expect(paths.filter((path) => path.startsWith("/fr/comparer/"))).toEqual(
      []
    );
  });

  // @req REQ-139
  // @req REQ-110
  it("still ships the rubrics when the corpus cannot be read", async () => {
    mockedEntityIds.mockResolvedValue({
      peoples: [],
      countries: [],
      families: [],
      languages: [],
      patronymes: [],
      places: [],
    });

    const all = await urls();
    expect(all).toContain(`https://${CANONICAL_DOMAIN}/fr`);
    expect(all.some((url) => url.includes("/peuples/PPL_"))).toBe(false);
    expect(all.some((url) => url.includes("/atlas/langues/"))).toBe(false);
    expect(all.some((url) => url.includes("/atlas/noms/"))).toBe(false);
    expect(all.some((url) => url.includes("/atlas/lieux/"))).toBe(false);
  });

  // @req REQ-141
  it("composes every French rubric in the French vocabulary", async () => {
    const all = await urls();
    const base = `https://${CANONICAL_DOMAIN}`;

    for (const key of ["sitemap", "reports", "legalNotice"] as const) {
      expect(all).toContain(`${base}${getStaticPageRoute("fr", key)}`);
    }
  });

  // @req REQ-110
  it("never emits the same url twice", async () => {
    const all = await urls();
    expect(new Set(all).size).toBe(all.length);
  });

  // @req REQ-110
  it("emits no English URL", async () => {
    expect((await urls()).some((url) => url.includes("/en"))).toBe(false);
  });

  // The registry no longer listing them is one half; this is the other — what
  // the site actually emits. Hiding a second policy was never the same as not
  // having one, and it is the emitted set a reader can reach.
  // @req REQ-110
  it("serves exactly one privacy policy", async () => {
    const all = await urls();
    const policies = all.filter((url) =>
      /confidentialite|politique-de-donnees/.test(url)
    );

    expect(policies).toEqual([
      `https://${CANONICAL_DOMAIN}/fr/politique-de-donnees`,
    ]);
  });
});

describe("robots.txt", () => {
  // public/robots.txt carried no Sitemap line, and a hard-coded one would have
  // been the first thing to go stale on a domain change.
  // @req REQ-110
  it("points crawlers at the sitemap on the canonical domain", () => {
    const rules = robots();
    expect(rules.sitemap).toBe(`https://${CANONICAL_DOMAIN}/sitemap.xml`);
    expect(rules.host).toBe(`https://${CANONICAL_DOMAIN}`);
  });

  // The duplicate privacy pages used to be listed here too. Deleting a route
  // is a stronger guarantee than asking a crawler not to index it, so the
  // disallow list shrank back to what authentication alone hides.
  // @req REQ-110
  it("bans the authenticated surfaces", () => {
    const rule = robots().rules;
    const disallow = Array.isArray(rule) ? rule[0].disallow : rule.disallow;

    expect(disallow).toEqual(["/fr/admin/"]);
    expect(disallow).not.toContain("/fr/politique-confidentialite");
    expect(disallow).not.toContain("/fr/confidentialite");
  });

  // The retired English addresses answer with a 308 to their French page;
  // a crawler banned from them could never read the redirect and carry the
  // old URL's standing over.
  // @req REQ-110
  it("lets crawlers follow the retired English addresses", () => {
    const rule = robots().rules;
    const disallow = Array.isArray(rule) ? rule[0].disallow : rule.disallow;

    expect(disallow).not.toContain("/en/");
  });

  // Named routes are what a rewrite would drop; this holds the whole rule to
  // the property instead — nothing about a privacy policy is hidden here.
  // @req REQ-110
  it("no longer hides a privacy policy from crawlers", () => {
    const rule = robots().rules;
    const disallow = Array.isArray(rule) ? rule[0].disallow : rule.disallow;

    expect(
      (disallow as string[]).filter((path) => /confidentialite/.test(path))
    ).toEqual([]);
  });
});

// 41 publication pages were visited over 30 days while the sitemap listed
// none of them (audience audit 2026-10-13); search is the second source of
// visits, and a crawler only reaches them through the feed's own swipes.
describe("sitemap.xml — découvertes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedEntityIds.mockResolvedValue(CORPUS);
  });

  // @req REQ-158
  it("lists every published discovery once, at its own address", async () => {
    const published = eligiblePublications(getDiscoveryPublications());
    expect(published.length).toBeGreaterThan(0);

    const listed = await urls();
    for (const entry of published) {
      const url = `https://${CANONICAL_DOMAIN}${discoveryPath("fr", entry)}`;
      expect(
        listed.filter((u) => u === url),
        entry.id
      ).toHaveLength(1);
    }
  });
});

describe("sitemap.xml — the addresses of answered names", () => {
  const [told] = VALID_NAME_HISTORY.names;
  const [account] = told.accounts;
  /** « Fulɓe » told by one account citing a referenced source. */
  const sourcedFulbe = {
    ...VALID_NAME_HISTORY,
    names: [
      {
        ...told,
        nameText: "Fulɓe",
        accounts: [
          {
            ...account,
            sources: [{ ...account.sources[0], tier: "referenced" as const }],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEntityIds.mockResolvedValue(CORPUS);
    vi.mocked(getAnsweredNameRows).mockResolvedValue([
      { name: "Lingala", nameHistory: LINGALA_HISTORY },
      // Filed twice, by two kinds: one address all the same.
      { name: "LINGALA", nameHistory: LINGALA_HISTORY },
      { name: "Fulɓe", nameHistory: sourcedFulbe },
      // Both tell their name on an unverified account only.
      { name: "Yoruba", nameHistory: VALID_NAME_HISTORY },
      { name: "Fulɓe", nameHistory: PEUL_HISTORY },
    ]);
  });

  const addressed = async () =>
    (await urls()).filter((url) =>
      url.startsWith(
        `https://${CANONICAL_DOMAIN}${getLocalizedRoute("fr", "search")}/`
      )
    );

  // @req REQ-200
  it("lists an answered form at its address, letters such as ɓ kept", async () => {
    const all = await addressed();
    const base = `https://${CANONICAL_DOMAIN}`;

    // The encoding itself (ful%C9%93e) is pinned in routing.test.ts.
    expect(all).toContain(`${base}${getNameAnswerRoute("fr", "lingala")}`);
    expect(all).toContain(`${base}${getNameAnswerRoute("fr", "Fulɓe")}`);
    expect(all.some((url) => url.endsWith("/ful%C9%93e"))).toBe(true);
  });

  // @req REQ-200
  it("lists no address for a form whose accounts cite nothing above unverified", async () => {
    expect(await addressed()).not.toContain(
      `https://${CANONICAL_DOMAIN}${getNameAnswerRoute("fr", "Yoruba")}`
    );
  });

  // @req REQ-200
  it("lists each address once, case and accent variants folded together", async () => {
    const all = await addressed();

    expect(new Set(all).size).toBe(all.length);
    expect(
      all.filter((url) => url.endsWith(getNameAnswerRoute("fr", "lingala")))
    ).toHaveLength(1);
  });

  // @req REQ-200
  it("lists the production ledger's published words", async () => {
    expect(await addressed()).toContain(
      `https://${CANONICAL_DOMAIN}${getNameAnswerRoute("fr", "ethnie")}`
    );
  });

  // The directory rejects on a failed read rather than shrinking, so this
  // build of the sitemap goes without the addresses and keeps everything
  // else; the next revalidation reads them again.
  // @req REQ-200
  it("still ships the fiches and rubrics when the addresses cannot be read", async () => {
    vi.mocked(getAnsweredNameRows).mockRejectedValue(
      new Error("afrik_languages: range error")
    );

    const all = await urls();

    expect(all).toContain(`https://${CANONICAL_DOMAIN}/fr`);
    expect(all).toContain(
      `https://${CANONICAL_DOMAIN}${getLanguageRoute("fr", "bam")}`
    );
    expect(await addressed()).toEqual([]);
  });
});
