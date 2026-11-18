"use client";

import { useId, useState } from "react";

import {
  postAbuseReport,
  postReply,
  type BlockComments,
  type CommentReplyData,
  type CommentThreadData,
} from "@/components/comments/commentsApi";
import { ProofOfWorkGate } from "@/components/flags/ProofOfWorkGate";
import { commentsCopy } from "@/lib/i18n/copy/comments";
import { formatDate } from "@/lib/languageTag";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

const TEXT_ACTION =
  "inline-flex min-h-11 items-center px-0.5 text-afh-small font-semibold focus-visible:outline-none focus-visible:shadow-afh-focus";
const META = "text-afh-caption leading-[1.4] text-afh-text-soft";

export interface CommentThreadProps {
  comments?: BlockComments;
  language: Language;
  onPublished: () => void;
}

/** A passage's published comments, each with its one level of replies. */
// @req REQ-212
export function CommentThread({
  comments,
  language,
  onPublished,
}: CommentThreadProps) {
  const copy = commentsCopy[language];
  const threads = comments?.threads ?? [];
  if (threads.length === 0) {
    return (
      <div className="flex flex-col gap-afh-sm py-afh-md">
        <h3 className="font-afh-display text-afh-h3 font-black leading-[1.25]">
          {copy.empty.title}
        </h3>
        <p className="leading-[1.6] text-afh-text-soft">{copy.empty.body}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-afh-md">
      <p className="text-afh-small font-bold">{copy.count(comments.count)}</p>
      <div className="flex flex-col">
        {threads.map((thread, index) => (
          <Comment
            key={thread.id}
            thread={thread}
            first={index === 0}
            language={language}
            onPublished={onPublished}
          />
        ))}
      </div>
    </div>
  );
}

const day = (language: Language, iso: string) =>
  formatDate(language, new Date(iso));

function Comment({
  thread,
  first,
  language,
  onPublished,
}: {
  thread: CommentThreadData;
  first: boolean;
  language: Language;
  onPublished: () => void;
}) {
  const copy = commentsCopy[language].thread;
  const [replying, setReplying] = useState(false);
  const status =
    thread.status === "accepted" || thread.status === "rejected"
      ? copy.status[thread.status]
      : null;
  const basis =
    thread.knowledge_basis && thread.knowledge_basis in copy.basis
      ? copy.basis[thread.knowledge_basis as keyof typeof copy.basis]
      : null;
  return (
    <article
      className={cn(
        "flex flex-col gap-afh-sm pb-afh-xs",
        first ? "" : "border-t border-afh-border pt-afh-xl"
      )}
    >
      <div className={cn(META, "flex flex-wrap items-baseline gap-x-afh-base")}>
        <span className="text-afh-small font-bold text-afh-text">
          {thread.display_name ?? copy.anonymous}
        </span>
        <span>{day(language, thread.created_at)}</span>
        {status ? (
          <span className="inline-flex items-center rounded-full border border-afh-border bg-afh-surface px-afh-base py-0.5 text-afh-caption font-semibold leading-[1.5] text-afh-text">
            {status}
          </span>
        ) : null}
        {basis ? <span className="w-full">{basis}</span> : null}
      </div>
      {thread.body ? <p className="leading-[1.6]">{thread.body}</p> : null}
      {thread.proposed_rewrite ? (
        <p className="text-afh-small leading-[1.5]">
          <b className="font-bold">{copy.correction}</b>{" "}
          {thread.proposed_rewrite}
        </p>
      ) : null}
      {thread.counter_source_url ? (
        <p className="text-afh-small leading-[1.5]">
          <b className="font-bold">{copy.source}</b>{" "}
          <a
            href={thread.counter_source_url}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="break-all text-[color:var(--accent-ink)] underline underline-offset-2"
          >
            {thread.counter_source_url}
          </a>
        </p>
      ) : null}
      <div className="flex gap-afh-4xl">
        <button
          type="button"
          onClick={() => setReplying(true)}
          className={cn(TEXT_ACTION, "text-[color:var(--accent-ink)]")}
        >
          {copy.reply}
        </button>
        <ReportAction commentId={thread.id} language={language} />
      </div>
      {replying ? (
        <ReplyForm
          commentId={thread.id}
          language={language}
          onDone={() => setReplying(false)}
          onPublished={onPublished}
        />
      ) : null}
      {thread.replies.map((reply) => (
        <Reply
          key={reply.id}
          reply={reply}
          commentId={thread.id}
          language={language}
        />
      ))}
    </article>
  );
}

function Reply({
  reply,
  commentId,
  language,
}: {
  reply: CommentReplyData;
  commentId: string;
  language: Language;
}) {
  const copy = commentsCopy[language].thread;
  return (
    <div
      className={cn(
        "ml-afh-lg mt-afh-xs flex flex-col gap-afh-xs border-l-2 py-afh-xs pl-afh-lg",
        reply.is_moderation
          ? "border-[color:var(--accent)]"
          : "border-afh-border"
      )}
    >
      <p className="text-afh-caption font-bold">
        {reply.is_moderation
          ? copy.moderationHead
          : (reply.display_name ?? copy.anonymous)}
      </p>
      <p className="leading-[1.6]">{reply.body}</p>
      <div className={cn(META, "flex flex-wrap items-center gap-x-afh-md")}>
        {reply.is_moderation ? (
          copy.moderationSign(day(language, reply.created_at))
        ) : (
          <>
            <span>{day(language, reply.created_at)}</span>
            <ReportAction
              commentId={commentId}
              replyId={reply.id}
              language={language}
            />
          </>
        )}
      </div>
    </div>
  );
}

type ReportPhase = "idle" | "working" | "sent" | "failed";

/**
 * « Signaler »: anonymous, behind the same proof of work as a comment.
 * Three reports from distinct readers hide the message until a moderator
 * looks (moderation charter §2); the answer never says whether this one did.
 */
function ReportAction({
  commentId,
  replyId,
  language,
}: {
  commentId: string;
  replyId?: string;
  language: Language;
}) {
  const copy = commentsCopy[language].thread;
  const [phase, setPhase] = useState<ReportPhase>("idle");
  if (phase === "sent" || phase === "failed") {
    return (
      <span role="status" className="inline-flex min-h-11 items-center">
        {phase === "sent" ? copy.reportSent : copy.reportFailed}
      </span>
    );
  }
  if (phase === "working") {
    return (
      <ProofOfWorkGate
        language={language}
        onSolved={async (proof) =>
          setPhase(
            (await postAbuseReport({ commentId, replyId }, proof))
              ? "sent"
              : "failed"
          )
        }
        onFailed={() => setPhase("failed")}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setPhase("working")}
      className={cn(TEXT_ACTION, "font-medium text-afh-text-soft")}
    >
      {copy.report}
    </button>
  );
}

/**
 * One level of replies, reserved to a signed-in reader. The page does not
 * know whether the reader is signed in, so the API says it: a 401 becomes
 * the sentence that explains how to get there.
 */
function ReplyForm({
  commentId,
  language,
  onDone,
  onPublished,
}: {
  commentId: string;
  language: Language;
  onDone: () => void;
  onPublished: () => void;
}) {
  const copy = commentsCopy[language].thread;
  const fieldId = useId();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    const outcome = await postReply(commentId, body.trim());
    setSending(false);
    if (outcome === "sent") {
      onPublished();
      onDone();
      return;
    }
    setMessage(
      outcome === "needs-account" ? copy.replyNeedsAccount : copy.replyFailed
    );
  }

  return (
    <div className="ml-afh-lg flex flex-col gap-afh-sm pl-afh-lg">
      <label htmlFor={fieldId} className="text-afh-small font-bold">
        {copy.replyLabel}
      </label>
      <textarea
        id={fieldId}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={5000}
        className="min-h-24 w-full resize-y rounded-afh-lg border border-afh-border bg-afh-surface px-afh-lg py-afh-base text-afh-small leading-[1.5] text-afh-text focus-visible:outline-none focus-visible:shadow-afh-focus"
      />
      {message ? (
        <p role="alert" className="text-afh-small leading-[1.5]">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-afh-lg">
        <button
          type="button"
          disabled={sending}
          onClick={send}
          className="inline-flex min-h-11 items-center justify-center rounded-afh-lg border border-[color:var(--accent)] bg-afh-surface px-afh-xl text-afh-small font-semibold text-afh-text focus-visible:outline-none focus-visible:shadow-afh-focus"
        >
          {copy.replySend}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={cn(TEXT_ACTION, "text-[color:var(--accent-ink)]")}
        >
          {copy.replyCancel}
        </button>
      </div>
    </div>
  );
}
