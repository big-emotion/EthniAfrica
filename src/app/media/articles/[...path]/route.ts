import { serveArticleMedia } from "@/lib/articles/mediaFiles";

// Read at request time from the mounted directory; there is nothing to
// prerender, and a build must not depend on the host's files.
// @req REQ-114
export const dynamic = "force-dynamic";

// @req REQ-114
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return serveArticleMedia(path);
}
