import type { MetadataRoute } from "next";

import {
  publishedArticleSummaries,
  readArticleCorpus,
} from "@/lib/articles/corpus";
import { articleHref } from "@/components/articles/articlePaths";
import { CANONICAL_DOMAIN } from "@/lib/brand";
import {
  getCountryRoute,
  getFamilyRoute,
  getLanguageRoute,
  getPatronymeRoute,
  getPeopleLinksRoute,
  getPeopleRoute,
} from "@/lib/routing";
import { getSiteTreePaths } from "@/lib/siteTree";
import { getSitemapEntityIds } from "@/lib/supabase/queries/afrik/sitemapEntries";

/**
 * `sitemap.xml`.
 *
 * Two things about this file that are not obvious:
 *
 * The base URL comes from `CANONICAL_DOMAIN`, never from the root layout's
 * `metadataBase` — that one falls back to `localhost:3000`, which in a sitemap
 * would publish 890 unreachable URLs.
 *
 * And this is a Next special file, not a route segment: it sits outside the
 * root layout's tree, so the `await connection()` that makes every page
 * request-time does not reach it, and it escapes the `generateStaticParams`
 * ban in `src/app/__tests__/staticParamsBan.test.ts` — that regex matches
 * `page|layout|route.tsx` only.
 */

const BASE_URL = `https://${CANONICAL_DOMAIN}`;

// The emitted name set follows source tiers stored in the corpus projection.
// Revalidate between releases so a corpus reload can add or remove a name
// without waiting for the next production build.
// A literal on purpose: Next reads segment config statically. Held to
// `CORPUS_AGGREGATE_REVALIDATE_SECONDS` (`PUBLIC_FLAGS_REVALIDATE_SECONDS` for
// the 60 s pages) by `src/app/__tests__/cacheFreshnessContract.test.ts`.
// @req REQ-147
export const revalidate = 3600;

/** Rubrics move when the site is restructured; fiches move when re-sourced. */
const RUBRIC_CHANGE_FREQUENCY = "monthly" as const;
const FICHE_CHANGE_FREQUENCY = "weekly" as const;

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): MetadataRoute.Sitemap[number] {
  return { url: `${BASE_URL}${path}`, changeFrequency, priority };
}

function fichePaths(
  corpus: Awaited<ReturnType<typeof getSitemapEntityIds>>
): string[] {
  return [
    ...corpus.families.map((id) => getFamilyRoute("fr", id)),
    ...corpus.peoples.flatMap((id) => [
      getPeopleRoute("fr", id),
      getPeopleLinksRoute("fr", id),
    ]),
    ...corpus.countries.map((id) => getCountryRoute("fr", id)),
    ...corpus.languages.map((id) => getLanguageRoute("fr", id)),
    ...corpus.patronymes.map((id) => getPatronymeRoute("fr", id)),
  ];
}

// @req REQ-110
// @req REQ-141
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const corpus = await getSitemapEntityIds();

  const entries: MetadataRoute.Sitemap = [];
  for (const path of getSiteTreePaths("fr")) {
    entries.push(
      entry(path, RUBRIC_CHANGE_FREQUENCY, path === "/fr" ? 1 : 0.8)
    );
  }
  for (const path of fichePaths(corpus)) {
    entries.push(entry(path, FICHE_CHANGE_FREQUENCY, 0.6));
  }
  // The same publication predicate as the listing and the menu.
  for (const summary of publishedArticleSummaries(
    readArticleCorpus().articles
  )) {
    entries.push(
      entry(articleHref("fr", summary.slug), FICHE_CHANGE_FREQUENCY, 0.7)
    );
  }
  return entries;
}
