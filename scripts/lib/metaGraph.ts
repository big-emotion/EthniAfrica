/**
 * Read-only client for Meta's Graph API.
 *
 * Read-only is the shape of this module, not a promise made by its callers: it
 * exposes `get` and `getAll` and nothing else, so the token it holds — which
 * also carries `instagram_manage_comments` and could therefore hide or delete a
 * comment — has no code path that writes. Publishing, if it ever exists, gets
 * its own module and its own token.
 */

const GRAPH_ORIGIN = "https://graph.facebook.com";

/** The version the app's Graph API Explorer was set to when this was written. */
export const DEFAULT_GRAPH_VERSION = "v26.0";

const DEFAULT_MAX_PAGES = 50;

export type GraphParams = Record<string, string | number>;

export interface GraphClient {
  get<T = unknown>(path: string, params?: GraphParams): Promise<T>;
  /** Every item of a paged `data` edge, following the cursor to the end. */
  getAll<T = unknown>(path: string, params?: GraphParams): Promise<T[]>;
}

export interface GraphClientOptions {
  token: string;
  version?: string;
  maxPages?: number;
  fetchImpl?: typeof fetch;
}

export class GraphApiError extends Error {
  readonly status: number;
  readonly code?: number;
  readonly subcode?: number;

  constructor(
    message: string,
    status: number,
    code?: number,
    subcode?: number
  ) {
    super(message);
    this.name = "GraphApiError";
    this.status = status;
    this.code = code;
    this.subcode = subcode;
  }
}

interface GraphErrorBody {
  error?: { message?: string; code?: number; error_subcode?: number };
}

interface Paged<T> {
  data?: T[];
  paging?: { cursors?: { after?: string }; next?: string };
}

export function createGraphClient(options: GraphClientOptions): GraphClient {
  const { token } = options;
  if (!token) throw new Error("A Graph API token is required.");
  const version = options.version ?? DEFAULT_GRAPH_VERSION;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const fetchImpl = options.fetchImpl ?? fetch;

  // Graph sometimes echoes the credential back inside an error message.
  const redact = (text: string) => text.split(token).join("[redacted]");

  async function get<T>(path: string, params: GraphParams = {}): Promise<T> {
    const url = new URL(
      `${GRAPH_ORIGIN}/${version}/${path.replace(/^\/+/, "")}`
    );
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, String(value));
    }

    const response = await fetchImpl(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await response.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }

    if (!response.ok) {
      const failure = (body as GraphErrorBody | undefined)?.error ?? {};
      throw new GraphApiError(
        redact(
          String(failure.message ?? `Graph API answered ${response.status}`)
        ),
        response.status,
        failure.code,
        failure.error_subcode
      );
    }
    if (body === undefined) {
      throw new Error("Graph API answered with something that is not JSON.");
    }
    return body as T;
  }

  async function getAll<T>(
    path: string,
    params: GraphParams = {}
  ): Promise<T[]> {
    const items: T[] = [];
    let after: string | undefined;

    for (let pages = 1; ; pages += 1) {
      const body = await get<Paged<T>>(
        path,
        after ? { ...params, after } : params
      );
      items.push(...(body.data ?? []));

      const cursor = body.paging?.cursors?.after;
      // `paging.next` is deliberately not followed: Graph embeds an
      // access_token in it, and replaying it would put a credential in a URL.
      if (!body.paging?.next || !cursor) return items;
      if (pages >= maxPages) {
        throw new Error(
          `Graph listing has more than ${maxPages} pages; narrow the request or raise maxPages.`
        );
      }
      after = cursor;
    }
  }

  return { get, getAll };
}
