/**
 * Serving article media from a directory on the host.
 *
 * Until a dedicated storage space exists, the server itself is the media host:
 * the derivatives live in a directory outside the git clone (the deploy
 * directory is a checkout at the released tag) and are mounted read-only into
 * the container. Moving to an object store later is a change to
 * `ARTICLE_MEDIA_BASE_URL`, not to any article.
 *
 * Files are named with a content hash, so a URL never changes meaning and the
 * cache can be immutable. Every path segment is checked against a strict
 * alphabet before the disk is touched: the whole point of the check is that
 * `..`, encoded dots and hidden files never reach `path.join`.
 */
import { readFile } from "fs/promises";
import { join } from "path";

// @req REQ-114
export const ARTICLE_MEDIA_DIR = "/app/article-media";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// @req REQ-114
export function resolveArticleMediaFile(
  segments: string[],
  root: string = ARTICLE_MEDIA_DIR
): { file: string; contentType: string } | null {
  if (segments.length === 0) return null;
  if (!segments.every((s) => SEGMENT.test(s) && !s.includes(".."))) return null;

  const name = segments[segments.length - 1];
  const contentType =
    CONTENT_TYPES[name.slice(name.lastIndexOf(".")).toLowerCase()];
  if (!contentType) return null;

  return { file: join(root, ...segments), contentType };
}

// @req REQ-114
export async function serveArticleMedia(
  segments: string[],
  root: string = ARTICLE_MEDIA_DIR
): Promise<Response> {
  const resolved = resolveArticleMediaFile(segments, root);
  if (!resolved) return new Response("Not found", { status: 404 });

  try {
    const bytes = await readFile(resolved.file);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "content-type": resolved.contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Absent file or unmounted directory: a missing image, never a 500.
    return new Response("Not found", { status: 404 });
  }
}
