import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Language } from "@/types/shared";
import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageFromRoute,
  getLocalizedRoute,
  getPeopleLinksRoute,
  getPeopleRoute,
  getStaticPageRoute,
} from "@/lib/routing";
import { LOCALES } from "@/lib/locale";
import { isModulePublished } from "@/lib/hubs/moduleOffer";
import { resolveRelocatedPath, resolveRenamedModulePath } from "@/proxy";
import { LIVE_ROUTES } from "../a11yRoutes";

const require = createRequire(import.meta.url);
const lighthouseConfig = require("../../.lighthouserc.js");

const LIGHTHOUSE_ORIGIN = "http://localhost:3000";
const lighthouseUrls = lighthouseConfig.ci.collect.url as string[];
const lighthouseUrl = (route: string) => `${LIGHTHOUSE_ORIGIN}${route}`;

/**
 * One representative assembled fiche per AFRIK entity type (FR102). Both
 * browser gates must audit all three: a regression that only reaches, say,
 * the country fiche would otherwise pass while two thirds of the fiche
 * surface goes unmeasured.
 */
const representativeFicheRoutes = (locale: Language) => ({
  "language-family": getFamilyRoute(locale, "FLG_BANTU"),
  people: getPeopleRoute(locale, "PPL_WOLOF"),
  country: getCountryRoute(locale, "SEN"),
});

/**
 * One representative route per charter route-family rolled out in 16.4–16.9
 * (ETNI-807 · FR110). Both gates must audit all five. `moderation` uses the
 * public, unauthenticated sign-in entry point rather than the auth-gated
 * admin surface: an unauthenticated live audit against a redirect-on-mount
 * page would measure the redirect, not the admin/moderation charter surface.
 */
const representativeFamilyRoutes = (locale: Language) => ({
  homepage: `/${locale}`,
  directories: getLocalizedRoute(locale, "peoples"),
  search: getLocalizedRoute(locale, "search"),
  "editorial-legal": getStaticPageRoute(locale, "legalNotice"),
  moderation: `${getStaticPageRoute(locale, "admin")}/connexion`,
});

/**
 * The axe gate's route list, read as data rather than as text.
 *
 * This used to grep `a11y-test.ts` for quoted route strings, which worked
 * only while the routes were spelled out there. They are composed from the
 * slug table now, so the list lives in its own module and both the gate and
 * this test read the same array — which also means this test can no longer
 * pass by matching a string that happens to appear in a comment.
 */
const axeRoutes = LIVE_ROUTES;

type MatrixEntry = {
  matchingUrlPattern: string;
  assertions: Record<string, [string, Record<string, number>]>;
};

const assertMatrix = lighthouseConfig.ci.assert.assertMatrix as MatrixEntry[];

/** The entries a collected URL is actually asserted against. */
const entriesFor = (url: string) =>
  assertMatrix.filter((entry) =>
    new RegExp(entry.matchingUrlPattern).test(url)
  );

describe("browser quality-gate routes", () => {
  // @req REQ-019
  it("audits canonical AFRIK identifiers instead of display-name slugs", () => {
    expect(lighthouseUrls).toContain(
      lighthouseUrl(getCountryRoute("fr", "SEN"))
    );
    expect(lighthouseUrls).toContain(
      lighthouseUrl(getPeopleRoute("fr", "PPL_WOLOF"))
    );
    expect(lighthouseConfig.ci.collect.puppeteerScript).toBe(
      "./scripts/lighthouse-setup.cjs"
    );
    expect(lighthouseConfig.ci.collect.puppeteerLaunchOptions.args).toContain(
      "--no-sandbox"
    );

    expect(axeRoutes).toContain(getPeopleRoute("fr", "PPL_WOLOF"));
    expect(axeRoutes).not.toContain(getPeopleRoute("fr", "wolof"));
  });

  // @req REQ-141
  it("audits one representative fiche route per entity type, in every locale, in both browser gates", () => {
    for (const locale of LOCALES) {
      for (const [entityType, route] of Object.entries(
        representativeFicheRoutes(locale)
      )) {
        expect(
          lighthouseUrls,
          `Lighthouse must audit the ${locale} ${entityType} fiche`
        ).toContain(lighthouseUrl(route));
        expect(
          axeRoutes,
          `axe must audit the ${locale} ${entityType} fiche`
        ).toContain(route);
      }
    }
  });

  /**
   * `lhci collect` aborts the whole run on the first URL that fails to load,
   * so one dead address does not cost one measurement — it costs every
   * measurement after it. ETNI-1555 deleted the three axis landing pages
   * while `/fr/atlas` was still first in the list.
   */
  // @req REQ-114
  it("audits no retired axis landing page in either browser gate, in any locale", () => {
    for (const locale of LOCALES) {
      for (const page of ["atlasHub", "dossiersHub", "jeuxHub"] as const) {
        const route = getLocalizedRoute(locale, page);

        expect(lighthouseUrls, route).not.toContain(lighthouseUrl(route));
        expect(axeRoutes, route).not.toContain(route);
      }
    }
  });

  // @req REQ-091
  it("gates every Lighthouse budget at error level so the fiche routes block the build", () => {
    for (const [audit, assertion] of Object.entries(
      lighthouseConfig.ci.assert.assertMatrix[0].assertions
    )) {
      expect(assertion[0], `${audit} must block, not warn`).toBe("error");
    }
  });

  // @req REQ-046
  it("installs a discoverable Chromium binary before running Lighthouse", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/lighthouse.yml"),
      "utf8"
    );

    expect(workflow).toContain("playwright install --with-deps chromium");
    expect(workflow).toContain("CHROME_PATH");
  });

  /**
   * The PR comment used to carry its own hand-typed route list, which listed
   * four retired addresses and called a route "not audited" that the config
   * had measured for months. A list that is read off the config cannot say
   * something the config does not.
   */
  // @req REQ-046
  it("derives the PR comment's route list from the Lighthouse config", () => {
    const workflow = readFileSync(
      resolve(process.cwd(), ".github/workflows/lighthouse.yml"),
      "utf8"
    );

    expect(workflow).toContain("require('./.lighthouserc.js')");
    const handTypedRoutes = workflow
      .split("\n")
      .filter((line) => /- `\/fr/.test(line));
    expect(handTypedRoutes).toEqual([]);
    expect(workflow).not.toContain("Not audited");
  });

  /**
   * Three regimes, each held at error level. Ordinary routes keep the 5.5 s
   * LCP and 300 ms TBT budgets. The streamed links chapter keeps a targeted
   * 6 s LCP ratchet. A fiche opens on a WebGL globe that a GPU-less runner
   * rasterises on the CPU, so its ceilings are ratchets taken from the
   * 2026-09-12 nightly. Asserted per URL, through the patterns, so a pattern
   * that stops matching its routes fails here rather than asserting nothing
   * in CI.
   */
  // @req REQ-046
  it("enforces stable mobile performance and responsiveness budgets", () => {
    const budgetFor = (url: string, audit: string) =>
      entriesFor(url)
        .map((entry) => entry.assertions[audit])
        .filter(Boolean);

    for (const locale of LOCALES) {
      for (const route of Object.values(representativeFicheRoutes(locale))) {
        const url = lighthouseUrl(route);
        expect(budgetFor(url, "total-blocking-time"), url).toEqual([
          ["error", { maxNumericValue: 3600 }],
        ]);
        expect(budgetFor(url, "largest-contentful-paint"), url).toEqual([
          ["error", { maxNumericValue: 6500 }],
        ]);
      }

      for (const route of [
        `/${locale}`,
        getLocalizedRoute(locale, "peoples"),
      ]) {
        const url = lighthouseUrl(route);
        expect(budgetFor(url, "categories:performance"), url).toEqual([
          ["error", { minScore: 0.73 }],
        ]);
        expect(budgetFor(url, "total-blocking-time"), url).toEqual([
          ["error", { maxNumericValue: 300 }],
        ]);
        expect(budgetFor(url, "largest-contentful-paint"), url).toEqual([
          ["error", { maxNumericValue: 5500 }],
        ]);
      }

      const linksUrl = lighthouseUrl(getPeopleLinksRoute(locale, "PPL_WOLOF"));
      expect(budgetFor(linksUrl, "categories:performance"), linksUrl).toEqual([
        ["error", { minScore: 0.73 }],
      ]);
      expect(budgetFor(linksUrl, "total-blocking-time"), linksUrl).toEqual([
        ["error", { maxNumericValue: 300 }],
      ]);
      expect(budgetFor(linksUrl, "largest-contentful-paint"), linksUrl).toEqual(
        [["error", { maxNumericValue: 6000 }]]
      );
    }
  });

  // @req REQ-141
  it("audits one representative route per charter route-family in every locale with axe", () => {
    for (const locale of LOCALES) {
      for (const [family, route] of Object.entries(
        representativeFamilyRoutes(locale)
      )) {
        expect(
          axeRoutes,
          `axe must audit the ${locale} ${family} route-family`
        ).toContain(route);
      }
    }
  });

  // @req REQ-091
  it("audits one representative route per charter route-family with Lighthouse", () => {
    for (const [family, route] of Object.entries(
      representativeFamilyRoutes("fr")
    )) {
      expect(
        lighthouseUrls,
        `Lighthouse must audit the ${family} route-family`
      ).toContain(lighthouseUrl(route));
    }
  });

  /**
   * The root URL is measured through the middleware's redirect, so its budget
   * is attributed to the French home (REQ-140). The config must say so where
   * the inclusion decisions are written.
   */
  // @req REQ-140
  it("measures the root and records which locale it lands on", () => {
    expect(lighthouseUrls).toContain(`${LIGHTHOUSE_ORIGIN}/`);
    expect(lighthouseUrls).toContain(lighthouseUrl("/fr"));

    const config = readFileSync(
      resolve(process.cwd(), ".lighthouserc.js"),
      "utf8"
    );
    expect(config).toContain("REQ-140");
  });

  /**
   * The property the named lists above cannot state: that a URL nobody
   * thought to list is still an address the site serves.
   *
   * `.lighthouserc.js` spells its routes out, while `a11yRoutes.ts`
   * recomposes them from the slug table -- so the two drift apart exactly
   * when a slug moves, and only the hand-written one goes stale. Moving
   * Appellations from Comprendre to Explorer left this file auditing
   * `/fr/dossiers/appellations`, and every assertion here passed, because
   * appellations belongs to none of the families enumerated above.
   *
   * Asked through the middleware's own resolvers rather than against a
   * second copy of the slug table: a collect URL that the middleware would
   * answer with a 308 is by definition an address that has moved. Lighthouse
   * would still measure it -- it follows the redirect -- so the budget is
   * silently attributed to a route the config no longer names, and `lhci`
   * has one more hop to abort on.
   */
  // @req REQ-091
  it("audits no address the middleware would redirect", () => {
    for (const url of lighthouseUrls) {
      const { pathname, searchParams } = new URL(url);

      expect(
        resolveRelocatedPath(pathname, searchParams),
        `${url} has moved (relocated segment)`
      ).toBeNull();
      expect(
        resolveRenamedModulePath(pathname),
        `${url} has moved (renamed module path)`
      ).toBeNull();
      if (pathname !== "/") {
        expect(
          getLanguageFromRoute(pathname),
          `${url} opens on a locale the site does not publish`
        ).not.toBeNull();
      }
    }
  });

  /**
   * The assertMatrix scopes its tighter budgets by URL pattern; a pattern
   * that stops matching would hold the comparator to the looser site-wide
   * budget in silence.
   */
  // @req REQ-141
  it("gives the comparator routes their layout-shift and responsiveness budgets", () => {
    for (const locale of LOCALES) {
      const route = getLocalizedRoute(locale, "compare");
      for (const url of [
        lighthouseUrl(route),
        lighthouseUrl(`${route}/peuples/PPL_A/PPL_B`),
      ]) {
        const scoped = entriesFor(url).filter(
          (entry) => "max-potential-fid" in entry.assertions
        );

        expect(
          scoped,
          `${url} must fall under the comparator budget`
        ).toHaveLength(1);
        expect(scoped[0].assertions["cumulative-layout-shift"]).toEqual([
          "error",
          { maxNumericValue: 0.1 },
        ]);
        expect(scoped[0].assertions["max-potential-fid"]).toEqual([
          "error",
          { maxNumericValue: 250 },
        ]);
      }
    }
  });

  // @req REQ-141
  it("audits only French routes with axe, at the recorded count", () => {
    expect(
      axeRoutes.every((route) => route === "/fr" || route.startsWith("/fr/"))
    ).toBe(true);
    // Nineteen while the dossiers are withdrawn; twenty-three when they
    // return. Sixteen plus the two search-feed states added in ETNI-1966
    // (an exact match and an unknown name — the bare search route audited
    // only the empty state) plus Découvertes, where a production is played
    // and which the Lighthouse gate now visits (ETNI-1970, REQ-181). The
    // number is the wall clock of the one required check, and it is written
    // out rather than derived so that adding a route is a decision taken
    // here — a count computed from the list under test would agree with
    // whatever that list happened to say.
    const expectedRoutes =
      19 +
      (isModulePublished("nommer") ? 2 : 0) +
      (isModulePublished("frise") ? 1 : 0) +
      (isModulePublished("regards-colonisation") ? 1 : 0);

    expect(axeRoutes.length).toBe(expectedRoutes);
  });

  // @req REQ-103 FR71 (Epic 10, Story 10.11 · ETNI-500)
  it("audits the quiz journey in both browser gates with a blocking mobile Performance gate", () => {
    for (const locale of LOCALES) {
      const quiz = getLocalizedRoute(locale, "quiz");

      expect(lighthouseUrls, `Lighthouse must audit ${quiz}`).toContain(
        lighthouseUrl(quiz)
      );
      expect(axeRoutes, `axe must audit ${quiz}`).toContain(quiz);
    }

    for (const locale of LOCALES) {
      const quiz = lighthouseUrl(getLocalizedRoute(locale, "quiz"));
      const performance = entriesFor(quiz)
        .map((entry) => entry.assertions["categories:performance"])
        .filter(Boolean);

      expect(
        performance,
        `${quiz} must carry a performance floor`
      ).toHaveLength(1);
      expect(performance[0][0], `${quiz} performance must block`).toBe("error");
    }
  });

  // The browser gates used to opt their test server into a bilingual mode;
  // with the English site retired there is no mode left to opt into.
  // @req REQ-140
  it("sets no locale publication mode in any browser gate", () => {
    for (const workflowPath of [
      ".github/workflows/a11y.yml",
      ".github/workflows/e2e.yml",
      ".github/workflows/lighthouse.yml",
    ]) {
      const workflow = readFileSync(
        resolve(process.cwd(), workflowPath),
        "utf8"
      );
      expect(workflow, workflowPath).not.toContain("SITE_LOCALE_MODE");
    }
  });
});
