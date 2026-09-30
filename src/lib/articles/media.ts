/**
 * Where an article's media is served from.
 *
 * Records store paths relative to a media root, never a host: the durable
 * media host is a deployment decision (public/ has under 1 MiB of headroom and
 * the self-hosted Supabase stack runs without its storage service), so moving
 * it must be one value, not an edit to every article. Like the enabled embed
 * providers it is a source constant rather than an environment variable, so
 * changing the host is a reviewed commit.
 *
 * Expiring platform CDN URLs and workstation paths are refused on purpose —
 * neither is production hosting.
 */
// @req REQ-114
export const ARTICLE_MEDIA_BASE_URL = "/media/articles";

// @req REQ-114
export function createArticleMediaUrl(baseUrl: string) {
  const root = baseUrl.replace(/\/+$/, "");
  return (relativePath: string): string => {
    const cleaned = relativePath.replace(/^\/+/, "");
    if (
      /^[a-z][a-z0-9+.-]*:/i.test(cleaned) ||
      cleaned.split("/").includes("..") ||
      cleaned.includes("\\")
    ) {
      throw new Error(`article media path must be relative: "${relativePath}"`);
    }
    return `${root}/${cleaned}`;
  };
}

// @req REQ-114
export const articleMediaUrl = createArticleMediaUrl(ARTICLE_MEDIA_BASE_URL);
