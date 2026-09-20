import { GraphApiError, type GraphClient } from "./metaGraph";

/** One shape for both networks, so the audit reads a single list of comments. */
export interface Comment {
  id: string;
  /** Null for a top-level comment. */
  parentId: string | null;
  text: string;
  createdAt: string;
  likeCount: number;
  /** Facebook names only the Page itself, so this is mostly null there. */
  author: string | null;
}

export interface MetricValue {
  value: number | Record<string, number>;
  endTime?: string;
}

export type MetricReading =
  | { metric: string; ok: true; values: MetricValue[] }
  | { metric: string; ok: false; error: string };

/**
 * Meta renames and retires metrics without notice — `page_impressions` is
 * already gone — so this list is a starting point to re-check against the
 * version in force, not a contract.
 */
export const DEFAULT_FACEBOOK_METRICS = [
  "page_media_view",
  "page_views_total",
  "page_post_engagements",
  "page_follows",
  "page_daily_follows_unique",
  "page_total_media_view_unique",
];

const INSTAGRAM_ACCOUNT_METRICS: {
  metric: string;
  params: Record<string, string>;
}[] = [
  { metric: "reach", params: { period: "day" } },
  { metric: "follower_count", params: { period: "day" } },
  { metric: "views", params: { period: "day", metric_type: "total_value" } },
];

const INSTAGRAM_MEDIA_METRICS = ["reach", "views", "likes", "saved", "shares"];

interface FacebookCommentRow {
  id: string;
  message?: string;
  created_time: string;
  like_count?: number;
  parent?: { id: string };
  from?: { id: string; name: string };
}

interface InstagramCommentRow {
  id: string;
  text?: string;
  timestamp: string;
  username?: string;
  like_count?: number;
  replies?: { data?: InstagramCommentRow[] };
}

interface MetricRow {
  name: string;
  values?: { value: MetricValue["value"]; end_time?: string }[];
  total_value?: { value: MetricValue["value"] };
}

export async function readFacebookComments(
  client: GraphClient,
  objectId: string
): Promise<Comment[]> {
  // `stream` returns replies flat; without it only top-level comments come back.
  const listing = { filter: "stream", limit: 100 };
  const rows = await client.getAll<FacebookCommentRow>(`${objectId}/comments`, {
    ...listing,
    fields: "id,message,created_time,like_count,parent{id}",
  });

  // Asking for `from` in the listing above makes Facebook silently drop the
  // comments whose author it cannot resolve — 3 of 71 on the reel that showed
  // it — so authors come from a second pass and are merged, never required.
  const withAuthors = await client.getAll<FacebookCommentRow>(
    `${objectId}/comments`,
    { ...listing, fields: "id,from{id,name}" }
  );
  const authorOf = new Map(
    withAuthors.flatMap((row) =>
      row.from?.name ? [[row.id, row.from.name] as const] : []
    )
  );

  return rows.map((row) => ({
    id: row.id,
    parentId: row.parent?.id ?? null,
    text: row.message ?? "",
    createdAt: row.created_time,
    likeCount: row.like_count ?? 0,
    author: authorOf.get(row.id) ?? null,
  }));
}

export async function readInstagramComments(
  client: GraphClient,
  mediaId: string
): Promise<Comment[]> {
  const rows = await client.getAll<InstagramCommentRow>(`${mediaId}/comments`, {
    fields:
      "id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}",
    limit: 50,
  });

  const toComment = (
    row: InstagramCommentRow,
    parentId: string | null
  ): Comment => ({
    id: row.id,
    parentId,
    text: row.text ?? "",
    createdAt: row.timestamp,
    likeCount: row.like_count ?? 0,
    author: row.username ?? null,
  });

  return rows.flatMap((row) => [
    toComment(row, null),
    ...(row.replies?.data ?? []).map((reply) => toComment(reply, row.id)),
  ]);
}

async function readMetric(
  client: GraphClient,
  path: string,
  metric: string,
  params: Record<string, string> = {}
): Promise<MetricReading> {
  try {
    const body = await client.get<{ data?: MetricRow[] }>(path, {
      ...params,
      metric,
    });
    const row = body.data?.[0];
    const values: MetricValue[] = row?.values
      ? row.values.map((entry) => ({
          value: entry.value,
          ...(entry.end_time ? { endTime: entry.end_time } : {}),
        }))
      : row?.total_value
        ? [{ value: row.total_value.value }]
        : [];
    return { metric, ok: true, values };
  } catch (error) {
    // Only "this metric is not valid here" is recoverable. Anything else — an
    // expired token above all — must fail the run, or the report would come
    // back empty and look like an audience of zero.
    if (error instanceof GraphApiError && error.code === 100) {
      return { metric, ok: false, error: error.message };
    }
    throw error;
  }
}

export async function readFacebookInsights(
  client: GraphClient,
  pageId: string,
  metrics: string[] = DEFAULT_FACEBOOK_METRICS
): Promise<{ followers: number | null; metrics: MetricReading[] }> {
  const page = await client.get<{ followers_count?: number }>(pageId, {
    fields: "followers_count",
  });
  const readings: MetricReading[] = [];
  for (const metric of metrics) {
    readings.push(
      await readMetric(client, `${pageId}/insights`, metric, { period: "day" })
    );
  }
  return { followers: page.followers_count ?? null, metrics: readings };
}

export interface InstagramPost {
  id: string;
  /** REELS, FEED, STORY… — the placement, which decides which metrics exist. */
  type: string;
  mediaType: string;
  timestamp: string;
  commentsCount: number;
  likeCount: number;
  metrics: MetricReading[];
}

export interface InstagramInsights {
  profile: { username: string; followers: number; mediaCount: number };
  account: MetricReading[];
  media: InstagramPost[];
}

export async function readInstagramInsights(
  client: GraphClient,
  igUserId: string,
  options: { recentMedia?: number } = {}
): Promise<InstagramInsights> {
  const recent = options.recentMedia ?? 10;

  const profile = await client.get<{
    username: string;
    followers_count: number;
    media_count: number;
  }>(igUserId, { fields: "username,followers_count,media_count" });

  // One request per metric: a metric an account or a post type does not support
  // fails the whole call, and would take the supported ones down with it.
  const account: MetricReading[] = [];
  for (const { metric, params } of INSTAGRAM_ACCOUNT_METRICS) {
    account.push(
      await readMetric(client, `${igUserId}/insights`, metric, params)
    );
  }

  const media: InstagramPost[] = [];
  if (recent > 0) {
    const listing = await client.get<{
      data?: {
        id: string;
        timestamp: string;
        media_type: string;
        media_product_type?: string;
        comments_count?: number;
        like_count?: number;
      }[];
    }>(`${igUserId}/media`, {
      fields:
        "id,timestamp,media_type,media_product_type,comments_count,like_count",
      limit: recent,
    });
    for (const post of (listing.data ?? []).slice(0, recent)) {
      const metrics: MetricReading[] = [];
      for (const metric of INSTAGRAM_MEDIA_METRICS) {
        metrics.push(await readMetric(client, `${post.id}/insights`, metric));
      }
      media.push({
        id: post.id,
        type: post.media_product_type ?? post.media_type,
        mediaType: post.media_type,
        timestamp: post.timestamp,
        commentsCount: post.comments_count ?? 0,
        likeCount: post.like_count ?? 0,
        metrics,
      });
    }
  }

  return {
    profile: {
      username: profile.username,
      followers: profile.followers_count,
      mediaCount: profile.media_count,
    },
    account,
    media,
  };
}
