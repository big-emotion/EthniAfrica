import { ActionLink } from "@/components/ui/ActionLink";
import type { ArticleSummary } from "@/lib/articles/corpus";
import type { Article } from "@/lib/articles/schema";
import {
  SOURCE_PENDING_REVIEW_LABEL,
  SOURCE_TIER_LABELS,
} from "@/lib/glossaire/vocabularies";
import { ACCENT_BY_ACCESS_MODE } from "@/lib/hubs/moduleRegistry";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import { getStaticPageRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

import { ArticleMedia } from "./ArticleMedia";
import { articleHref, formatArticleDate } from "./articlePaths";
import styles from "./articles.module.css";

interface ArticleViewProps {
  language: Language;
  article: Article;
  /** Published summaries of the related articles, already resolved. */
  related: ArticleSummary[];
}

const TEXT_ID = "article-text";
const sourceAnchor = (id: string) => `source-${id}`;

/**
 * One article, in the order the operator set for every one of them: title
 * and byline, the publication it grew from, the text that develops it, then
 * the sources and what to read next.
 */
// @req REQ-114
export function ArticleView({ language, article, related }: ArticleViewProps) {
  const copy = articlesCopy[language].article;
  const body = article.fr;
  const position = new Map(
    article.sources.map((source, index) => [source.id, index + 1])
  );
  const edition = article.media.edition;
  const hasMedia = article.media.formats.length > 0;

  return (
    <article className={`${styles.article} ${ACCENT_BY_ACCESS_MODE.dossiers}`}>
      <header className={styles.head}>
        <h1 className={styles.title}>{body.title}</h1>
        <p className={styles.byline}>
          {copy.byline(article.author.name)}
          {article.publishedAt ? (
            <>
              {" · "}
              <time dateTime={article.publishedAt}>
                {copy.publishedOn(
                  formatArticleDate(article.publishedAt, language)
                )}
              </time>
            </>
          ) : null}
          {article.modifiedAt ? (
            <>
              {" · "}
              <time dateTime={article.modifiedAt}>
                {copy.modifiedOn(
                  formatArticleDate(article.modifiedAt, language)
                )}
              </time>
            </>
          ) : null}
        </p>
      </header>

      {hasMedia ? (
        <div className={styles.mediaBlock}>
          <a className={styles.skip} href={`#${TEXT_ID}`}>
            {copy.skipToText}
          </a>
          <section className={styles.media} aria-label={copy.mediaLabel}>
            <ArticleMedia
              language={language}
              title={body.title}
              formats={article.media.formats}
              originals={article.media.originals}
            />
            {edition?.supersedes && edition.correctionNote ? (
              <p className={styles.correction}>
                <strong>{copy.correctionTitle}</strong>
                {edition.correctionNote}
              </p>
            ) : null}
            <Originals language={language} article={article} />
          </section>
        </div>
      ) : null}

      <div className={styles.text} id={TEXT_ID}>
        <p className={styles.lead}>{body.excerpt}</p>
        {body.sections.map((section, index) => (
          <section className={styles.section} key={index}>
            <h2>{section.heading}</h2>
            {/* Keyed by position: nothing forbids two identical paragraphs. */}
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {section.sourceRefs.length > 0 ? (
              <ul className={styles.cited} aria-label={copy.citedBy}>
                {section.sourceRefs.map((ref) => (
                  <li key={ref}>
                    <a href={`#${sourceAnchor(ref)}`}>
                      {copy.sourceMarker(position.get(ref) ?? 0)}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {article.sources.length > 0 ? (
        <section className={styles.apparatus}>
          <h2>{copy.referencesTitle}</h2>
          <ol className={styles.references}>
            {article.sources.map((source) => (
              <li key={source.id} id={sourceAnchor(source.id)}>
                {source.url ? (
                  <a href={source.url} rel="noreferrer" target="_blank">
                    {source.title}
                  </a>
                ) : (
                  source.title
                )}
                {source.locator ? `, ${source.locator}` : null}
                <span className={styles.tier}>
                  {source.tier === "needs_review"
                    ? SOURCE_PENDING_REVIEW_LABEL[language]
                    : SOURCE_TIER_LABELS[language][source.tier]}
                </span>
                {source.notes ? <p>{source.notes}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className={styles.apparatus}>
          <h2>{copy.relatedTitle}</h2>
          <ul className={styles.related}>
            {related.map((summary) => (
              <li key={summary.id}>
                <ActionLink href={articleHref(language, summary.slug)}>
                  {summary.title}
                </ActionLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p>
        <ActionLink href={getStaticPageRoute(language, "contribute")}>
          {copy.contribute}
        </ActionLink>
      </p>
    </article>
  );
}

function Originals({
  language,
  article,
}: {
  language: Language;
  article: Article;
}) {
  const copy = articlesCopy[language].article;
  const linked = article.media.originals.filter((original) => original.url);
  if (linked.length === 0) return null;
  return (
    <div>
      <p className={styles.mediaNote}>{copy.originalsTitle}</p>
      <ul className={styles.originals}>
        {linked.map((original) => (
          <li key={`${original.network}-${original.url}`}>
            <a href={original.url} rel="noreferrer" target="_blank">
              {copy.networks[original.network]}
            </a>
            {original.publishedAt
              ? `, ${copy.originalPostedOn(formatArticleDate(original.publishedAt, language))}`
              : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
