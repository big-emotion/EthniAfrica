import type { Metadata } from "next";
import Link from "next/link";

import {
  SEARCH_REPORT_PERIODS,
  readSearchQueryReport,
  type SearchReportLang,
  type SearchReportPeriod,
} from "@/api/v2/services/searchQueryReport";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  firstParam,
  type QueueSearchParams,
} from "@/lib/admin/queueSearchParams";
import { adminCopy } from "@/lib/i18n/copy/admin";
import { formatDate, formatNumber } from "@/lib/languageTag";
import { getStaticPageRoute } from "@/lib/routing";
import { noIndexMetadata } from "@/lib/seo/noIndexMetadata";
import { getModeratorSession } from "@/lib/supabase/moderator";
import type { Language } from "@/types/shared";

/**
 * What readers searched, read from `search_query_log` so the operator does not
 * have to write SQL to find the names the corpus is missing.
 *
 * The searches without result come first because they are the list somebody
 * acts on: each is an alias or a fiche the corpus does not have yet (REQ-002).
 *
 * The session check is redundant with the middleware and kept anyway, for the
 * reason the report queue gives: an authorization that lives only in a matcher
 * is one configuration edit away from being gone. It runs before the log is
 * read, because the log is reachable only through the service-role client.
 */

const DEFAULT_PERIOD: SearchReportPeriod = 30;
const LANGS: readonly SearchReportLang[] = ["fr", "en"];

// @req REQ-042
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return noIndexMetadata(
    adminCopy[lang as Language].searchReport.metadataTitle
  );
}

// The log grows with every search; a cached render would show a stale period.
// @req REQ-042
export const dynamic = "force-dynamic";

const chipClass =
  "rounded-full border border-afh-border px-3 py-1 text-afh-small no-underline aria-[current=page]:border-afh-text aria-[current=page]:font-semibold";
const headCellClass = "pb-2 pr-4 text-left text-afh-caption font-semibold";
const cellClass = "py-2 pr-4 text-afh-small";

// @req REQ-042
export default async function SearchReportPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<QueueSearchParams>;
}) {
  await getModeratorSession();

  const { lang } = await routeParams;
  const language = lang as Language;
  const copy = adminCopy[language].searchReport;
  const route = `${getStaticPageRoute(language, "admin")}/recherches`;

  const params = await searchParams;
  const requestedPeriod = Number(firstParam(params, "periode"));
  const periodDays = SEARCH_REPORT_PERIODS.includes(
    requestedPeriod as SearchReportPeriod
  )
    ? (requestedPeriod as SearchReportPeriod)
    : DEFAULT_PERIOD;
  const requestedLang = firstParam(params, "langue");
  const logLang = LANGS.find((candidate) => candidate === requestedLang);

  const report = await readSearchQueryReport({
    periodDays,
    ...(logLang ? { lang: logLang } : {}),
  });

  function hrefFor(period: SearchReportPeriod, filter?: SearchReportLang) {
    const query = new URLSearchParams();
    if (period !== DEFAULT_PERIOD) query.set("periode", String(period));
    if (filter) query.set("langue", filter);
    const suffix = query.toString();
    return suffix ? `${route}?${suffix}` : route;
  }

  const count = (value: number) => formatNumber(language, value);
  const percent = (share: number) =>
    formatNumber(language, share, {
      style: "percent",
      maximumFractionDigits: 0,
    });
  const day = (iso: string) =>
    formatDate(language, new Date(iso), { dateStyle: "medium" });

  return (
    <PageLayout language={language} title={copy.title}>
      <div className="mx-auto w-full max-w-4xl space-y-afh-xl">
        <p className="max-w-3xl text-afh-small text-afh-text-soft">
          {copy.guidance}
        </p>

        <div className="space-y-3">
          <nav aria-label={copy.periodLabel} className="flex flex-wrap gap-2">
            {SEARCH_REPORT_PERIODS.map((period) => (
              <Link
                key={period}
                aria-current={period === periodDays ? "page" : undefined}
                className={chipClass}
                href={hrefFor(period, logLang)}
              >
                {copy.periodOption(period)}
              </Link>
            ))}
          </nav>
          <nav aria-label={copy.langLabel} className="flex flex-wrap gap-2">
            <Link
              aria-current={logLang ? undefined : "page"}
              className={chipClass}
              href={hrefFor(periodDays)}
            >
              {copy.allLangs}
            </Link>
            {LANGS.map((candidate) => (
              <Link
                key={candidate}
                aria-current={candidate === logLang ? "page" : undefined}
                className={chipClass}
                href={hrefFor(periodDays, candidate)}
              >
                {copy.langs[candidate]}
              </Link>
            ))}
          </nav>
        </div>

        <dl className="grid grid-cols-3 gap-4 border-y border-afh-border py-4">
          <div>
            <dt className="text-afh-caption text-afh-text-soft">
              {copy.totalSearches}
            </dt>
            <dd className="text-afh-body font-semibold">
              {count(report.totalSearches)}
            </dd>
          </div>
          <div>
            <dt className="text-afh-caption text-afh-text-soft">
              {copy.distinctQueries}
            </dt>
            <dd className="text-afh-body font-semibold">
              {count(report.distinctQueries)}
            </dd>
          </div>
          <div>
            <dt className="text-afh-caption text-afh-text-soft">
              {copy.zeroResultShare}
            </dt>
            <dd className="text-afh-body font-semibold">
              {percent(report.zeroResultShare)}
            </dd>
          </div>
        </dl>
        <p className="text-afh-caption text-afh-text-soft">
          {report.truncated
            ? copy.truncated(report.rowsRead)
            : copy.rowsRead(report.rowsRead)}
        </p>

        <section aria-labelledby="search-report-zero" className="space-y-3">
          <h2 id="search-report-zero" className="text-afh-body font-semibold">
            {copy.zeroResultsTitle}
          </h2>
          <p className="text-afh-small text-afh-text-soft">
            {copy.zeroResultsHint}
          </p>
          {report.zeroResults.length === 0 ? (
            <p className="text-afh-small text-afh-text-soft">{copy.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-afh-border">
                    <th scope="col" className={headCellClass}>
                      {copy.query}
                    </th>
                    <th scope="col" className={headCellClass}>
                      {copy.count}
                    </th>
                    <th scope="col" className={headCellClass}>
                      {copy.lastSeen}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.zeroResults.map((entry) => (
                    <tr
                      key={entry.query}
                      className="border-b border-afh-border"
                    >
                      <td className={`${cellClass} break-words`}>
                        {entry.query}
                      </td>
                      <td className={cellClass}>{count(entry.count)}</td>
                      <td className={`${cellClass} whitespace-nowrap`}>
                        {day(entry.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="search-report-frequent" className="space-y-3">
          <h2
            id="search-report-frequent"
            className="text-afh-body font-semibold"
          >
            {copy.frequentTitle}
          </h2>
          {report.mostFrequent.length === 0 ? (
            <p className="text-afh-small text-afh-text-soft">{copy.empty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-afh-border">
                    <th scope="col" className={headCellClass}>
                      {copy.query}
                    </th>
                    <th scope="col" className={headCellClass}>
                      {copy.count}
                    </th>
                    <th scope="col" className={headCellClass}>
                      {copy.zeroShare}
                    </th>
                    <th scope="col" className={headCellClass}>
                      {copy.lastSeen}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.mostFrequent.map((entry) => (
                    <tr
                      key={entry.query}
                      className="border-b border-afh-border"
                    >
                      <td className={`${cellClass} break-words`}>
                        {entry.query}
                      </td>
                      <td className={cellClass}>{count(entry.count)}</td>
                      <td className={cellClass}>
                        {percent(entry.zeroResultShare)}
                      </td>
                      <td className={`${cellClass} whitespace-nowrap`}>
                        {day(entry.lastSeen)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
