import { CANONICAL_DOMAIN } from "@/lib/brand";
import type { Language } from "@/types/shared";

import { articleMediaUrl } from "./media";
import type { Article } from "./schema";

/**
 * schema.org Article for one published article.
 *
 * Dates and author are the article's own: the media's publication date is a
 * different fact and never stands in for it. `dateModified` appears only when
 * the article was actually corrected.
 */
// @req REQ-114
export function articleJsonLd(article: Article, language: Language) {
  const body = (language === "en" && article.en) || article.fr;
  const first = article.media.formats[0];
  const imagePath =
    first.kind === "video" ? first.poster.src : first.slides[0].src;
  const media = articleMediaUrl(imagePath);
  const image = media.startsWith("/")
    ? `https://${CANONICAL_DOMAIN}${media}`
    : media;

  return {
    "@context": "https://schema.org",
    "@type": "Article" as const,
    headline: body.title,
    description: body.excerpt,
    inLanguage: body === article.fr ? "fr" : "en",
    datePublished: article.publishedAt,
    ...(article.modifiedAt ? { dateModified: article.modifiedAt } : {}),
    author: { "@type": "Organization", name: article.author.name },
    image,
  };
}

/** Serialised for a script tag: `<` is escaped so text can never close it. */
// @req REQ-114
export function serializeJsonLd(node: object): string {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}
