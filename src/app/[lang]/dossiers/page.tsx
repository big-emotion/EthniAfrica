import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleListing } from "@/components/articles/ArticleListing";
import { PageLayout } from "@/components/layout/PageLayout";
import { logger } from "@/lib/api/logger";
import {
  publishedArticleSummaries,
  readArticleCorpus,
} from "@/lib/articles/corpus";
import { ACCENT_BY_ACCESS_MODE } from "@/lib/hubs/moduleRegistry";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import { isLocale } from "@/lib/locale";
import { getLocalizedRoute } from "@/lib/routing";
import { surfaceHead } from "@/lib/seo/localeAlternates";

interface ArticlesListingProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * The Articles listing, at the section's existing address.
 *
 * It replaced the axis spread on 30 September 2026 (articles redesign,
 * option A): the spread listed modules the section no longer offers, while
 * a reader arriving here wants something to read. The three retained
 * collections stay one tap away above the catalogue.
 *
 * A bank that reported errors is shown as a failure even when some records
 * validated: listing the survivors would present a partial catalogue as the
 * whole one. The errors go to the log, never to the page — they can name a
 * draft.
 */
// @req REQ-114 @req REQ-140
export async function generateMetadata({
  params,
}: Pick<ArticlesListingProps, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const copy = articlesCopy[lang].listing;
  const head = { title: copy.pageTitle, description: copy.pageSubtitle };
  return {
    ...head,
    ...surfaceHead(
      lang,
      "dossiersHub",
      (language) => getLocalizedRoute(language, "dossiersHub"),
      head
    ),
  };
}

// @req REQ-114 @req REQ-108
export default async function ArticlesListingRoute({
  params,
  searchParams,
}: ArticlesListingProps) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const page = Number((await searchParams).page ?? 1);
  const corpus = readArticleCorpus();
  if (corpus.errors.length > 0) {
    logger.error("article bank failed validation", corpus.errors);
  }
  const copy = articlesCopy[lang].listing;

  return (
    <PageLayout
      language={lang}
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
    >
      <div className={ACCENT_BY_ACCESS_MODE.dossiers}>
        <ArticleListing
          language={lang}
          summaries={publishedArticleSummaries(corpus.articles)}
          page={page}
          failed={corpus.errors.length > 0}
        />
      </div>
    </PageLayout>
  );
}
