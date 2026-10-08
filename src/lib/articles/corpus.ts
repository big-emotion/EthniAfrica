/**
 * Reading the article bank off disk — no database, no private library.
 *
 * Rendering never touches the workshop that produced an article: everything a
 * page needs is in `content/articles/*.json`, so a deploy carries its own
 * content and cannot depend on a workstation path.
 *
 * A record that fails validation is reported, never skipped in silence: an
 * unreadable bank must not look like an honestly empty catalogue.
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

import { readDossierCorpus } from "@/lib/dossiers/corpus";

import { articleSchema, type Article, type ArticleFormat } from "./schema";

// @req REQ-114
export const ARTICLES_ROOT = join(process.cwd(), "content/articles");

// Static segments under /dossiers that already mean something else.
const RESERVED_SLUGS = [
  "anecdotes",
  "proverbes",
  "themes",
  "nommer",
  "migrations",
  "regards",
];

export interface ArticleCorpus {
  articles: Article[];
  errors: string[];
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  poster: { src: string; width: number; height: number };
  formats: ArticleFormat["kind"][];
}

interface RawRecord {
  filename: string;
  raw: unknown;
}

function posterOf(article: Article): ArticleSummary["poster"] {
  const first = article.media.formats[0];
  if (first.kind === "video") return first.poster;
  const { src, width, height } = first.slides[0];
  return { src, width, height };
}

function publicationProblems(article: Article): string[] {
  const problems: string[] = [];
  if (article.status !== "published") return problems;
  if (!article.publishedAt) problems.push("published without publishedAt");
  if (article.media.formats.length === 0)
    problems.push("published without media");
  if (article.sources.length === 0) problems.push("published without sources");
  if (article.fr.sections.length === 0)
    problems.push("published without body text");
  for (const format of article.media.formats) {
    if (format.kind === "video" && !format.youtubeId && !format.nativeSrc) {
      // A link out is not a playable reel.
      problems.push("video needs a youtubeId or nativeSrc");
    }
  }
  return problems;
}

// @req REQ-114
export function assembleArticleCorpus(
  records: RawRecord[],
  options: { legacyDossierSlugs?: string[] } = {}
): ArticleCorpus {
  const reserved = new Set([
    ...RESERVED_SLUGS,
    ...(options.legacyDossierSlugs ?? []),
  ]);
  const articles: Article[] = [];
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const { filename, raw } of records) {
    const parsed = articleSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${filename}: ${issue.path.join(".")} ${issue.message}`);
      }
      continue;
    }
    const article = parsed.data;
    const problems = publicationProblems(article);

    if (filename !== `${article.id}.json`) {
      problems.push(`file should be named ${article.id}.json`);
    }
    if (reserved.has(article.fr.slug)) {
      problems.push(`slug "${article.fr.slug}" is reserved`);
    }
    if (ids.has(article.id)) problems.push(`duplicate id "${article.id}"`);
    if (slugs.has(article.fr.slug)) {
      problems.push(`duplicate slug "${article.fr.slug}"`);
    }
    const sourceIds = new Set(article.sources.map((s) => s.id));
    for (const section of article.fr.sections) {
      for (const ref of section.sourceRefs) {
        if (!sourceIds.has(ref)) problems.push(`unknown source "${ref}"`);
      }
    }
    const edition = article.media.edition;
    if (edition?.supersedes && !edition.correctionNote) {
      problems.push("a superseding edition needs a correctionNote");
    }

    if (problems.length) {
      errors.push(...problems.map((p) => `${filename}: ${p}`));
      continue;
    }
    ids.add(article.id);
    slugs.add(article.fr.slug);
    articles.push(article);
  }

  // Relations resolve against the accepted set, so a refused article is never
  // silently a valid target.
  const accepted = new Set(articles.map((a) => a.id));
  const resolved = articles.filter((article) => {
    const unknown = article.relatedArticleIds.filter((id) => !accepted.has(id));
    for (const id of unknown) {
      errors.push(`${article.id}.json: unknown related article "${id}"`);
    }
    return unknown.length === 0;
  });

  return { articles: resolved, errors };
}

// @req REQ-114
export function readArticleCorpus(root: string = ARTICLES_ROOT): ArticleCorpus {
  if (!existsSync(root)) {
    // No article authored yet on this branch: a state, not a load failure.
    return { articles: [], errors: [] };
  }
  const records: RawRecord[] = [];
  const errors: string[] = [];
  for (const filename of readdirSync(root)
    .filter((n) => n.endsWith(".json"))
    .sort()) {
    try {
      records.push({
        filename,
        raw: JSON.parse(readFileSync(join(root, filename), "utf8")),
      });
    } catch (error) {
      errors.push(`${filename}: ${(error as Error).message}`);
    }
  }
  const legacyDossierSlugs = readDossierCorpus().dossiers.map((d) => d.slug);
  const assembled = assembleArticleCorpus(records, { legacyDossierSlugs });
  return {
    articles: assembled.articles,
    errors: [...errors, ...assembled.errors],
  };
}

/** The one publication predicate: menus, listing, sitemap and metadata share it. */
// @req REQ-114
export function isPublished(article: Article): boolean {
  return article.status === "published" && Boolean(article.publishedAt);
}

// @req REQ-114
export function publishedArticleSummaries(
  articles: Article[]
): ArticleSummary[] {
  return articles
    .filter(isPublished)
    .map((article) => ({
      id: article.id,
      slug: article.fr.slug,
      title: article.fr.title,
      excerpt: article.fr.excerpt,
      publishedAt: article.publishedAt as string,
      poster: posterOf(article),
      formats: article.media.formats.map((f) => f.kind),
    }))
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id)
    );
}

// @req REQ-114
export function articleForCampaign(
  articles: Article[],
  campaign: string
): Article | undefined {
  return articles
    .filter(isPublished)
    .find((article) => article.campaigns?.includes(campaign));
}
