import type { ArticleRecord } from "../schema";

const source = {
  id: "src-1",
  title: "A published work about the name",
  tier: "referenced" as const,
  kind: "book" as const,
  locator: "chap. 2",
};

const base = (): ArticleRecord => ({
  id: "video-a",
  status: "published",
  publishedAt: "2026-09-25",
  author: { name: "EthniAfrica" },
  angle: "name-origin",
  fr: {
    slug: "video-a",
    title: "D'où vient le nom X ?",
    excerpt: "Une explication relie ce nom à un mot local.",
    sections: [
      {
        heading: "Ce que l'on sait",
        paragraphs: ["Une explication relie ce nom à un mot local."],
        sourceRefs: ["src-1"],
      },
    ],
  },
  sources: [source],
  media: {
    formats: [
      {
        kind: "video",
        youtubeId: "A99ETtxdxiU",
        poster: { src: "/media/a.jpg", width: 540, height: 960 },
      },
    ],
    originals: [
      {
        network: "youtube",
        url: "https://www.youtube.com/watch?v=A99ETtxdxiU",
        publishedAt: "2026-09-25",
      },
    ],
  },
  relatedArticleIds: [],
});

// @req REQ-114
export function videoArticle(over: Partial<ArticleRecord> = {}): ArticleRecord {
  const a = { ...base(), ...over };
  // The slug follows an overridden id so two fixtures never collide by accident;
  // the duplicate-slug test sets it by hand.
  if (over.id) a.fr = { ...a.fr, slug: over.id };
  return a;
}

// @req REQ-114
export function carouselArticle(
  over: Partial<ArticleRecord> = {}
): ArticleRecord {
  const a = base();
  a.id = "carousel-a";
  a.fr.slug = "carousel-a";
  a.media.formats = [
    {
      kind: "carousel",
      slides: [
        {
          src: "/media/s1.jpg",
          width: 1080,
          height: 1350,
          alt: "Slide 1",
          text: "Slide one text",
        },
        {
          src: "/media/s2.jpg",
          width: 1080,
          height: 1350,
          alt: "Slide 2",
          text: "Slide two text",
        },
      ],
    },
  ];
  const merged = { ...a, ...over };
  if (over.id) merged.fr = { ...merged.fr, slug: over.id };
  return merged;
}

// @req REQ-114
export function bothFormatsArticle(
  over: Partial<ArticleRecord> = {}
): ArticleRecord {
  const a = carouselArticle();
  a.id = "both-a";
  a.fr.slug = "both-a";
  a.media.formats.push(...videoArticle().media.formats);
  const merged = { ...a, ...over };
  if (over.id) merged.fr = { ...merged.fr, slug: over.id };
  return merged;
}
