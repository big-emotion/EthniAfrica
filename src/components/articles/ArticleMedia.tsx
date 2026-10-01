"use client";

import { useState } from "react";

import { EmbedFacade } from "@/components/media/EmbedFacade";
import { articleMediaUrl } from "@/lib/articles/media";
import type { Article, ArticleFormat } from "@/lib/articles/schema";
import { articlesCopy } from "@/lib/i18n/copy/articles";
import type { Language } from "@/types/shared";

import { ArticleCarousel } from "./ArticleCarousel";
import styles from "./articles.module.css";

interface ArticleMediaProps {
  language: Language;
  title: string;
  formats: ArticleFormat[];
  originals: Article["media"]["originals"];
}

type VideoFormat = Extract<ArticleFormat, { kind: "video" }>;

function youtubeWatchUrl(
  format: VideoFormat,
  originals: ArticleMediaProps["originals"]
): string {
  return (
    originals.find((original) => original.network === "youtube")?.url ??
    `https://www.youtube.com/watch?v=${format.youtubeId}`
  );
}

/**
 * The publication an article grew from, above its text.
 *
 * A YouTube edition plays through the site's one consent-gated facade; a
 * cleared native derivative plays in the browser's own player, never on its
 * own. When the post and its carousel tell the same angle, a two-button
 * switch chooses which one is shown — it swaps the media only, so the text
 * below is never behind a tab.
 *
 * A picture that fails to load takes the media down, never the article: the
 * reader is told, and a carousel's words are printed in its place.
 */
// @req REQ-114 @req REQ-181
export function ArticleMedia({
  language,
  title,
  formats,
  originals,
}: ArticleMediaProps) {
  const copy = articlesCopy[language];
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  const format = formats[selected];
  const kinds = formats.map((item) => item.kind);
  const offersChoice = new Set(kinds).size > 1;

  if (!format) return null;

  return (
    <div className={styles.media}>
      {offersChoice ? (
        <div
          className={styles.formatSwitch}
          role="group"
          aria-label={copy.article.formatSwitchLabel}
        >
          {formats.map((item, index) => (
            <button
              key={`${item.kind}-${index}`}
              type="button"
              className={styles.formatButton}
              aria-pressed={index === selected}
              onClick={() => {
                setSelected(index);
                setFailed(false);
              }}
            >
              {copy.listing.formats[item.kind]}
            </button>
          ))}
        </div>
      ) : null}

      {failed ? (
        <p className={styles.unavailable} role="status">
          {copy.article.mediaUnavailable}
        </p>
      ) : null}

      {format.kind === "carousel" ? (
        failed ? (
          <ol>
            {format.slides.map((slide) => (
              <li key={slide.src}>{slide.text}</li>
            ))}
          </ol>
        ) : (
          <ArticleCarousel
            language={language}
            title={title}
            slides={format.slides}
            onMediaError={() => setFailed(true)}
          />
        )
      ) : format.youtubeId ? (
        <EmbedFacade
          language={language}
          name={title}
          embed={{ provider: "youtube", id: format.youtubeId }}
          poster={{
            ...format.poster,
            src: articleMediaUrl(format.poster.src),
          }}
          watchUrl={youtubeWatchUrl(format, originals)}
        />
      ) : format.nativeSrc && !failed ? (
        <video
          className={styles.nativeVideo}
          controls
          preload="none"
          playsInline
          poster={articleMediaUrl(format.poster.src)}
          width={format.poster.width}
          height={format.poster.height}
          onError={() => setFailed(true)}
        >
          <source src={articleMediaUrl(format.nativeSrc)} />
          {format.captionsSrc ? (
            <track
              kind="captions"
              src={articleMediaUrl(format.captionsSrc)}
              srcLang="fr"
              default
            />
          ) : null}
        </video>
      ) : null}

      {format.kind === "video" && format.transcript ? (
        <details className={styles.disclosure}>
          <summary>{copy.article.transcriptTitle}</summary>
          <p>{format.transcript}</p>
        </details>
      ) : null}

      {format.credits ? (
        <p className={styles.mediaNote}>
          {copy.article.credits(format.credits)}
        </p>
      ) : null}
    </div>
  );
}
