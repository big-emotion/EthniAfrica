import { z } from "zod";

/**
 * An article is one editorial angle developed in text, opened by the
 * publication it grew from. It is deliberately not a dossier: a social subject
 * has no thesis, rubric or fiche to force onto it, so this shape asks only for
 * what a reader and a checker actually need — the edition shown, the text, and
 * where each claim comes from.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

// Relative to the media root (see media.ts): never a host, never an expiring CDN URL.
const mediaPath = z
  .string()
  .min(1)
  .refine(
    (p) => !/^[a-z][a-z0-9+.-]*:/i.test(p) && !p.split("/").includes(".."),
    "media path must be relative"
  );

const image = z.object({
  src: mediaPath,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const videoFormat = z.object({
  kind: z.literal("video"),
  youtubeId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{11}$/)
    .optional(),
  // A cleared native derivative, for a post with no usable YouTube edition.
  nativeSrc: mediaPath.optional(),
  poster: image,
  durationSeconds: z.number().positive().optional(),
  captionsSrc: mediaPath.optional(),
  // Only present when a transcript was actually recovered.
  transcript: z.string().min(1).optional(),
  credits: z.string().min(1).optional(),
});

const carouselFormat = z.object({
  kind: z.literal("carousel"),
  slides: z
    .array(
      image.extend({
        alt: z.string().min(1),
        // The slide's own words as real text, so the essay is never locked in
        // an image.
        text: z.string().min(1),
      })
    )
    .min(1),
  credits: z.string().min(1).optional(),
});

const original = z.object({
  network: z.enum([
    "youtube",
    "tiktok",
    "instagram",
    "facebook",
    "linkedin",
    "x",
  ]),
  url: z.url().optional(),
  publishedAt: isoDate.optional(),
});

const source = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url().optional(),
  // Tier is authority; kind is what sort of thing it is — the same two axes as
  // the corpus, kept apart here too.
  tier: z.enum(["official", "referenced", "unverified", "needs_review"]),
  kind: z
    .enum(["book", "article", "press", "oral", "archive", "web", "other"])
    .optional(),
  locator: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

const section = z.object({
  heading: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  sourceRefs: z.array(z.string()).default([]),
});

const localized = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  // Empty only on an imported draft; publication requires a body (see corpus.ts).
  sections: z.array(section),
});

// @req REQ-114
export const articleSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  status: z.enum(["draft", "published"]),
  // The article's own date. Never inferred from a file's presence or from the
  // media's date, and never moved by a correction (see modifiedAt).
  publishedAt: isoDate.optional(),
  modifiedAt: isoDate.optional(),
  author: z.object({ name: z.string().min(1), role: z.string().optional() }),
  angle: z.string().min(1),
  fr: localized,
  en: localized.optional(),
  sources: z.array(source),
  media: z.object({
    edition: z
      .object({
        id: z.string().min(1),
        supersedes: z.string().min(1).optional(),
        correctionNote: z.string().min(1).optional(),
      })
      .optional(),
    formats: z.array(
      z.discriminatedUnion("kind", [videoFormat, carouselFormat])
    ),
    originals: z.array(original),
  }),
  // Production-ledger campaign ids this article develops: the one join that
  // lets a short in Découvertes point at its article.
  campaigns: z.array(z.string().min(1)).optional(),
  relatedArticleIds: z.array(z.string()).default([]),
  entities: z
    .array(z.object({ kind: z.string().min(1), id: z.string().min(1) }))
    .optional(),
});

export type ArticleRecord = z.input<typeof articleSchema>;
export type Article = z.output<typeof articleSchema>;
export type ArticleFormat = Article["media"]["formats"][number];
