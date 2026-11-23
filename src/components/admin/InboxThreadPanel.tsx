"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  InboxReply,
  InboxThread,
  PublicationState,
} from "@/api/v2/services/moderationInbox";
import { moderationConsoleCopy } from "@/lib/i18n/copy/moderationConsole";
import { createBrowserSupabaseClient } from "@/lib/supabase/auth-client";
import type { Language } from "@/types/shared";

/**
 * A thread's discussion inside its queue row: who can see it, how many readers
 * reported it, the replies, and the three moderator actions on it — reply,
 * hide, restore. Status moves stay with the row (`QueueRow`).
 */

async function sendAsModerator(
  path: string,
  method: "POST" | "PUT",
  payload: unknown
): Promise<{ ok: boolean; data?: unknown; message?: string }> {
  const {
    data: { session },
  } = await createBrowserSupabaseClient().auth.getSession();

  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => null);
  // The API's own words when it has some: "failed" cannot tell a refusal from
  // a lost connection.
  return response.ok
    ? { ok: true, data: json?.data }
    : { ok: false, message: json?.errors?.[0]?.message };
}

// @req REQ-214
export function InboxThreadPanel({
  language,
  thread,
}: {
  language: Language;
  thread: InboxThread;
}) {
  const copy = moderationConsoleCopy[language].inbox;
  const replyId = useId();
  const reasonId = useId();
  const repliesLabelId = useId();
  const [state, setState] = useState<PublicationState>(
    thread.publication_state
  );
  const [hiddenReason, setHiddenReason] = useState(thread.hidden_reason);
  const [replies, setReplies] = useState<InboxReply[]>(thread.replies);
  const [replyText, setReplyText] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function run(
    path: string,
    method: "POST" | "PUT",
    payload: unknown,
    onSuccess: (data: unknown) => void
  ) {
    setPending(true);
    setError("");
    const result = await sendAsModerator(path, method, payload);
    setPending(false);
    if (!result.ok) {
      setError(result.message || copy.actionFailed);
      return;
    }
    onSuccess(result.data);
  }

  function reply() {
    if (!replyText.trim()) return;
    return run(
      `/api/v2/admin/comments/${thread.id}/replies`,
      "POST",
      { body: replyText.trim() },
      (data) => {
        setReplies((current) => [
          ...current,
          { ...(data as InboxReply), hidden_at: null, abuse_reports: 0 },
        ]);
        setReplyText("");
      }
    );
  }

  function hideComment() {
    if (!reason.trim()) {
      setError(copy.hideReasonRequired);
      return;
    }
    return run(
      `/api/v2/admin/comments/${thread.id}/visibility`,
      "PUT",
      { hidden: true, reason: reason.trim() },
      () => {
        setState("hidden");
        setHiddenReason(reason.trim());
        setReason("");
      }
    );
  }

  function unhideComment() {
    return run(
      `/api/v2/admin/comments/${thread.id}/visibility`,
      "PUT",
      { hidden: false },
      () => {
        // Back to what it was before it was hidden; the inbox recomputes the
        // finer "waiting for confirmation" state on the next load.
        setState(thread.published_at ? "published" : "private");
        setHiddenReason(null);
      }
    );
  }

  function setReplyHidden(target: InboxReply, hidden: boolean) {
    return run(
      `/api/v2/admin/replies/${target.id}/visibility`,
      "PUT",
      { hidden },
      () =>
        setReplies((current) =>
          current.map((item) =>
            item.id === target.id
              ? {
                  ...item,
                  hidden_at: hidden ? new Date().toISOString() : null,
                  abuse_reports: hidden ? item.abuse_reports : 0,
                }
              : item
          )
        )
    );
  }

  return (
    <div className="mt-afh-md flex flex-col gap-afh-md border-t border-afh-border pt-afh-md">
      <div className="flex flex-wrap items-baseline gap-afh-md text-afh-caption text-afh-text-soft">
        <span className="rounded-afh-sm border border-afh-border px-2 py-0.5">
          {copy.publication[state]}
        </span>
        <span>{copy.abuseReports(thread.abuse_reports)}</span>
        <span>{thread.display_name ?? copy.anonymousReader}</span>
      </div>

      {state === "hidden" && hiddenReason && (
        <p className="text-afh-small text-afh-text-soft">
          {copy.hiddenReason(copy.systemReasons[hiddenReason] ?? hiddenReason)}
        </p>
      )}

      {replies.length > 0 && (
        <div>
          <p className="text-afh-small font-semibold" id={repliesLabelId}>
            {copy.repliesHeading}
          </p>
          <ul
            aria-labelledby={repliesLabelId}
            className="flex flex-col gap-afh-md"
          >
            {replies.map((item) => (
              <li
                className="rounded-afh-md border border-afh-border p-afh-md"
                key={item.id}
              >
                <div className="flex flex-wrap items-baseline gap-afh-md text-afh-caption text-afh-text-soft">
                  <span>
                    {item.is_moderation
                      ? copy.moderationSignature
                      : (item.display_name ?? copy.anonymousReader)}
                  </span>
                  {item.hidden_at && <span>{copy.replyHidden}</span>}
                  {item.abuse_reports > 0 && (
                    <span>{copy.abuseReports(item.abuse_reports)}</span>
                  )}
                </div>
                <p className="mt-afh-sm text-afh-small">{item.body}</p>
                <Button
                  className="mt-afh-sm"
                  disabled={pending}
                  onClick={() => setReplyHidden(item, !item.hidden_at)}
                  type="button"
                  variant="outline"
                >
                  {item.hidden_at ? copy.unhideReply : copy.hideReply}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Label htmlFor={replyId}>{copy.replyLabel}</Label>
        <p className="text-afh-caption text-afh-text-soft">{copy.replyHint}</p>
        <Textarea
          id={replyId}
          maxLength={5000}
          onChange={(event) => setReplyText(event.target.value)}
          value={replyText}
        />
        <Button
          className="mt-afh-sm"
          disabled={pending}
          onClick={reply}
          type="button"
          variant="outline"
        >
          {copy.sendReply}
        </Button>
      </div>

      {state === "hidden" ? (
        <div>
          <Button
            disabled={pending}
            onClick={unhideComment}
            type="button"
            variant="outline"
          >
            {copy.unhideComment}
          </Button>
        </div>
      ) : (
        <div>
          <Label htmlFor={reasonId}>{copy.hideReasonLabel}</Label>
          <Textarea
            id={reasonId}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            value={reason}
          />
          <Button
            className="mt-afh-sm"
            disabled={pending}
            onClick={hideComment}
            type="button"
            variant="outline"
          >
            {copy.hideComment}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-afh-small text-afh-flag-open" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
