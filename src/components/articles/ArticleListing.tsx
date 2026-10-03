import Image from "next/image";
import Link from "next/link";

import { ActionLink } from "@/components/ui/ActionLink";
import type { ArticleSummary } from "@/lib/articles/corpus";
import { articleMediaUrl } from "@/lib/articles/media";
import { HUB_PAGE_SIZE, pageOf } from "@/lib/dossiers/paging";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import { getLocalizedRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

import {
  articleHref,
  articleListingHref,
  formatArticleDate,
} from "./articlePaths";
import styles from "./articles.module.css";

interface ArticleListingProps {
  language: Language;
  /** Published summaries only, already ordered by the corpus projection. */
  summaries: ArticleSummary[];
  page: number;
  /** The bank could not be read in full: never shown as an empty catalogue. */
  failed: boolean;
}

const COLLECTIONS = ["anecdotes", "proverbs", "gallery"] as const;

/**
 * The Articles section's landing: the retained collections, then the
 * catalogue, newest first.
 *
 * The pager is plain links rather than client state, so every page of the
 * catalogue is an address a reader can share and a crawler can follow.
 */
// @req REQ-114 @req REQ-108
export function ArticleListing({
  language,
  summaries,
  page,
  failed,
}: ArticleListingProps) {
  const copy = articlesCopy[language].listing;
  const pageCount = Math.max(1, Math.ceil(summaries.length / HUB_PAGE_SIZE));
  const current = Math.min(Math.max(Math.floor(page) || 1, 1), pageCount);
  const visible = pageOf(summaries, current);

  return (
    <div className={styles.listing}>
      <nav aria-label={copy.collectionsLabel}>
        <ul className={styles.collections}>
          <li className={styles.collectionsLabel} aria-hidden="true">
            {copy.collectionsLabel}
          </li>
          {COLLECTIONS.map((collection) => (
            <li key={collection}>
              <ActionLink href={getLocalizedRoute(language, collection)}>
                {copy.collections[collection]}
              </ActionLink>
            </li>
          ))}
        </ul>
      </nav>

      {failed ? (
        <p className={styles.state} role="alert">
          {copy.failed}{" "}
          <Link href={articleListingHref(language, 1)}>{copy.retry}</Link>
        </p>
      ) : summaries.length === 0 ? (
        <p className={styles.state}>{copy.empty}</p>
      ) : (
        <section aria-label={copy.listLabel}>
          <ul className={styles.grid}>
            {visible.map((summary) => (
              <li key={summary.id}>
                <Link
                  className={styles.card}
                  href={articleHref(language, summary.slug)}
                >
                  <Image
                    className={styles.cardPoster}
                    src={articleMediaUrl(summary.poster.src)}
                    alt=""
                    width={summary.poster.width}
                    height={summary.poster.height}
                    unoptimized
                  />
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{summary.title}</h2>
                    <span className={styles.cardExcerpt}>
                      {summary.excerpt}
                    </span>
                    <span className={styles.cardMeta}>
                      <time dateTime={summary.publishedAt}>
                        {formatArticleDate(summary.publishedAt, language)}
                      </time>
                      {" · "}
                      {summary.formats
                        .map((format) => copy.formats[format])
                        .join(" · ")}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!failed && pageCount > 1 ? (
        <nav className={styles.pager} aria-label={copy.pagerLabel}>
          <span className={styles.pagerStep}>
            {current > 1 ? (
              <Link href={articleListingHref(language, current - 1)}>
                {copy.previous}
              </Link>
            ) : null}
          </span>
          <span>{copy.pageOf(current, pageCount)}</span>
          <span className={styles.pagerStep}>
            {current < pageCount ? (
              <Link href={articleListingHref(language, current + 1)}>
                {copy.next}
              </Link>
            ) : null}
          </span>
        </nav>
      ) : null}
    </div>
  );
}
