import type { BlockComments } from "@/api/v2/services/comments";
import type { Proof } from "@/lib/antibot/proofOfWork";

/**
 * The browser side of `/api/v2/comments`. Writing a comment is
 * `submitFlag`: a comment is a flag with a `block_key`.
 *
 * No bearer: the proxy would read it as an API key. A signed-in reader's
 * session travels as the site's cookies, which same-origin requests carry.
 */

export type { BlockComments };
export type CommentThreadData = BlockComments["threads"][number];
export type CommentReplyData = CommentThreadData["replies"][number];

// @req REQ-212
export async function fetchBlockComments(
  blockKeys: readonly string[]
): Promise<BlockComments[]> {
  const response = await fetch(
    `/api/v2/comments?block_keys=${encodeURIComponent(blockKeys.join(","))}`
  );
  if (!response.ok) throw new Error(`comments ${response.status}`);
  const json = (await response.json()) as { data?: unknown };
  // Anything but a list reads as "no comments": a footer must never take
  // the answer down with it.
  return Array.isArray(json?.data) ? (json.data as BlockComments[]) : [];
}

export type ReplyOutcome = "sent" | "needs-account" | "failed";

// @req REQ-212
export async function postReply(
  commentId: string,
  body: string
): Promise<ReplyOutcome> {
  try {
    const response = await fetch(`/api/v2/comments/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (response.ok) return "sent";
    return response.status === 401 ? "needs-account" : "failed";
  } catch {
    return "failed";
  }
}

/** A comment, or one of its replies when `replyId` is given. */
// @req REQ-212
export async function postAbuseReport(
  target: { commentId: string; replyId?: string },
  antibot: Proof
): Promise<boolean> {
  const path = target.replyId
    ? `/api/v2/comments/${target.commentId}/replies/${target.replyId}/report`
    : `/api/v2/comments/${target.commentId}/report`;
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ antibot, website: "" }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
