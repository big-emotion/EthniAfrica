import {
  listFeedRevisions,
  type FeedRevisionItem,
} from "../services/feedRevisions";
import { buildAtomFeed } from "@/lib/api/atomSerializer";
import { resolveSiteUrl } from "@/lib/siteUrl";
import { API_LICENSE, API_ATTRIBUTION } from "../utils/response";

export interface FeedCursorPaginationMeta {
  limit: number;
  next_cursor: string | null;
}

export interface FeedRevisionMeta {
  license: string;
  attribution: string;
  pagination: FeedCursorPaginationMeta;
}

export interface FeedRevisionEnvelope {
  data: FeedRevisionItem[];
  meta: FeedRevisionMeta;
  errors: never[];
}

// @req REQ-038
export async function listFeedRevisionsHandler(
  limit: number,
  since?: string,
  cursor?: string
): Promise<FeedRevisionEnvelope> {
  const { items, next_cursor } = await listFeedRevisions(limit, since, cursor);
  return {
    data: items,
    meta: {
      license: API_LICENSE,
      attribution: API_ATTRIBUTION,
      pagination: { limit, next_cursor },
    },
    errors: [],
  };
}

// @req REQ-038
export async function listFeedRevisionsAtomHandler(
  limit: number,
  since?: string,
  cursor?: string
): Promise<string> {
  const { items } = await listFeedRevisions(limit, since, cursor);
  const baseUrl = resolveSiteUrl();
  const feedUrl = `${baseUrl}/api/v2/feed/revisions`;

  // NFR32: updated is derived from data, never from Date.now()
  const updated =
    items.length > 0 && items[0].published_at
      ? items[0].published_at
      : "1970-01-01T00:00:00.000Z";

  return buildAtomFeed(items, { baseUrl, feedUrl, updated });
}
