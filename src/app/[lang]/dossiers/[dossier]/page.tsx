import { getLocalizedRoute, translatePath } from "@/lib/routing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleView } from "@/components/articles/ArticleView";
import { articleHref } from "@/components/articles/articlePaths";
import { DossierPage } from "@/components/dossiers/DossierPage";
import { PageLayout } from "@/components/layout/PageLayout";
import {
  isPublished,
  publishedArticleSummaries,
  readArticleCorpus,
} from "@/lib/articles/corpus";
import { getDossierBySlug } from "@/lib/dossiers/corpus";
import { isDossierSlugPublished } from "@/lib/dossiers/publication";
import { getPublishedLocales, isLocale } from "@/lib/locale";
import { articleJsonLd, serializeJsonLd } from "@/lib/articles/jsonLd";
import { localeHead } from "@/lib/seo/localeAlternates";
import type { Language } from "@/types/shared";

interface DossierRouteProps {
  params: Promise<{ lang: string; dossier: string }>;
}

/**
 * Every dossier of the Réalités vertical, on one page component.
 *
 * A dynamic segment rather than one directory per dossier, because the brief
 * this surface answers to is "one dossier page, not several": a static
 * directory per subject is exactly how the axis forked the first time, with
 * four dossiers composing four different documents.
 *
 * The Nommer pillar keeps its own static directory alongside this one, and
 * Next resolves the static segment first, so /fr/dossiers/nommer is untouched.
 * That is deliberate: Nommer's five chapters are five routes of their own,
 * which a single-page dossier is not.
 *
 * Since the articles redesign (30 September 2026) the same segment serves
 * the published articles first: an article slug can never equal a legacy
 * dossier slug or a static segment (the article loader refuses both), so the
 * order only decides which bank is asked first. A draft is not an article
 * here, and falls through to the dossier freeze, which answers 404.
 *
 * **No loading.tsx here, and it is not an oversight.** This route can call
 * notFound(), and loaderCoverage.test.ts forbids a wait screen above a route
 * that can — a loading boundary over a 404 renders the frame of a page that is
 * not going to exist, which search engines read as a soft 404.
 */
/** The published article at this French slug, with its published relations. */
function publishedArticleAt(slug: string) {
  const { articles } = readArticleCorpus();
  const article = articles.find(
    (candidate) => candidate.fr.slug === slug && isPublished(candidate)
  );
  if (!article) return null;
  const related = publishedArticleSummaries(articles).filter((summary) =>
    article.relatedArticleIds.includes(summary.id)
  );
  return { article, related };
}

// @req REQ-113 @req REQ-114
export async function generateMetadata({
  params,
}: DossierRouteProps): Promise<Metadata> {
  const { lang, dossier: slug } = await params;
  if (!isLocale(lang)) return {};
  const found = publishedArticleAt(slug);
  if (found) {
    const { article } = found;
    const body = (lang === "en" && article.en) || article.fr;
    const head = { title: body.title, description: body.excerpt };
    return {
      ...head,
      ...localeHead(
        lang,
        (language) => articleHref(language, article.fr.slug),
        article.en ? getPublishedLocales() : ["fr"],
        head
      ),
    };
  }
  if (!isDossierSlugPublished(slug)) return {};
  const dossier = getDossierBySlug(slug);

  if (!dossier) return {};

  const sourcePath = `${getLocalizedRoute("fr", "dossiersHub")}/${dossier.slug}`;

  return {
    title: dossier.title,
    description: dossier.standfirst,
    ...localeHead(
      lang,
      (language) => translatePath("fr", language, sourcePath),
      ["fr"],
      { title: dossier.title, description: dossier.standfirst }
    ),
  };
}

// @req REQ-113 @req REQ-114
export default async function DossierRoute({ params }: DossierRouteProps) {
  const { lang, dossier: slug } = await params;
  const found = isLocale(lang) ? publishedArticleAt(slug) : null;
  if (found) {
    const language = lang as Language;
    const body = (language === "en" && found.article.en) || found.article.fr;
    return (
      // No band: an article names a subject, not a part of the site, so its
      // title takes the ink rather than the brand gradient (brand charter
      // §5.3), and the trail stands above it as the way back to the list.
      <PageLayout language={language} hideHeader trailLabel={body.title}>
        <ArticleView
          language={language}
          article={found.article}
          related={found.related}
        />
        <script
          type="application/ld+json"
          // Built from the article record, with `<` escaped, never from the request.
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(articleJsonLd(found.article, language)),
          }}
        />
      </PageLayout>
    );
  }
  if (!isDossierSlugPublished(slug)) notFound();
  const dossier = getDossierBySlug(slug);

  if (!dossier) notFound();

  return (
    <DossierPage
      dossier={dossier}
      language={lang as Language}
      translationState={lang === "en" ? "missing" : undefined}
    />
  );
}
