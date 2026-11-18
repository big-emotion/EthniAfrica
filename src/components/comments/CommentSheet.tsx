"use client";

import { useEffect, useState } from "react";

import { CommentForm } from "@/components/comments/CommentForm";
import { CommentThread } from "@/components/comments/CommentThread";
import type { BlockComments } from "@/components/comments/commentsApi";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { commentsCopy } from "@/lib/i18n/copy/comments";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface SheetRequest {
  subject: { type: string; id: string };
  /** Null for the page-end invitation: a contribution on no block. */
  blockKey: string | null;
  eyebrow: string;
  title: string;
  quote?: string;
  fieldPath?: string;
}

/** The sources sheet's breakpoint (`SourceChainSheet`): a right panel from 1024 px. */
function usePanelWidth(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return wide;
}

export interface CommentSheetProps {
  request: SheetRequest | null;
  comments?: BlockComments;
  language: Language;
  onClose: () => void;
  /** Something new may be public: a signed-in reader's comment or reply. */
  onPublished: () => void;
}

type Sent = { address: string | null } | null;

const EYEBROW =
  "font-[family-name:var(--afh-font-mono)] text-afh-eyebrow font-semibold uppercase tracking-[0.06em] text-[color:var(--accent-ink)]";

/**
 * The thread of one passage and the form to add to it: a sheet from the
 * bottom on phone and tablet, a right panel from 1024 px (brief 21). It
 * closes with « Fermer », never a cross: no new glyph (actions charter §8).
 */
// @req REQ-212
export function CommentSheet({
  request,
  comments,
  language,
  onClose,
  onPublished,
}: CommentSheetProps) {
  const wide = usePanelWidth();

  return (
    <Sheet open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={wide ? "right" : "bottom"}
        className={cn(
          // Portalled out of the page, so it takes the page's accent itself.
          "afh-accent-ocre gap-0 overflow-y-auto bg-afh-bg p-0 text-afh-text [&>button:last-child]:hidden",
          wide
            ? "w-[min(460px,40vw)] rounded-none border-l border-afh-border sm:max-w-none"
            : "max-h-[88vh] rounded-t-afh-lg border-t-0"
        )}
      >
        {request ? (
          // Keyed: a new passage opens on its thread, not on the last one's
          // confirmation.
          <SheetBody
            key={`${request.blockKey}:${request.title}`}
            request={request}
            comments={comments}
            language={language}
            onClose={onClose}
            onPublished={onPublished}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  request,
  comments,
  language,
  onClose,
  onPublished,
}: CommentSheetProps & { request: SheetRequest }) {
  const copy = commentsCopy[language];
  const [sent, setSent] = useState<Sent>(null);
  return (
    <div className="flex flex-col gap-afh-2xl px-afh-2xl pb-afh-6xl text-left">
      <div className="sticky top-0 z-[2] flex items-start justify-between gap-afh-lg border-b border-afh-border bg-afh-bg pb-afh-lg pt-afh-2xl">
        <div>
          <p className={EYEBROW}>{request.eyebrow}</p>
          <SheetTitle className="mt-afh-xs font-afh-display text-afh-h2 font-black leading-[1.2] text-afh-text [text-wrap:balance]">
            {request.title}
          </SheetTitle>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center px-0.5 text-afh-small font-semibold text-[color:var(--accent-ink)] focus-visible:outline-none focus-visible:shadow-afh-focus"
        >
          {copy.sheet.close}
        </button>
      </div>
      <SheetDescription className="sr-only">
        {copy.sheet.description}
      </SheetDescription>
      {sent ? (
        <SentNotice sent={sent} language={language} onBack={onClose} />
      ) : (
        <>
          {request.quote ? (
            <p className="rounded-none border border-afh-border bg-afh-bg-warm px-afh-lg py-afh-base text-afh-small leading-[1.5] text-afh-text-soft">
              « {request.quote} »
            </p>
          ) : null}
          {request.blockKey ? (
            <CommentThread
              comments={comments}
              language={language}
              onPublished={onPublished}
            />
          ) : null}
          <CommentForm
            request={request}
            language={language}
            onSent={(address) => {
              setSent({ address });
              onPublished();
            }}
          />
        </>
      )}
    </div>
  );
}

/** What the reader is told back (moderation charter §6). */
function SentNotice({
  sent,
  language,
  onBack,
}: {
  sent: NonNullable<Sent>;
  language: Language;
  onBack: () => void;
}) {
  const copy = commentsCopy[language].sent;
  return (
    <div role="status" className="flex flex-col gap-afh-lg py-afh-md">
      <p className={EYEBROW}>{copy.eyebrow}</p>
      <h3 className="font-afh-display text-afh-h3 font-black leading-[1.25]">
        {sent.address ? copy.title : copy.privateTitle}
      </h3>
      <p className="leading-[1.6]">
        {sent.address ? copy.body(sent.address) : copy.privateBody}
      </p>
      {sent.address ? (
        <p className="text-afh-caption leading-[1.5] text-afh-text-soft">
          {copy.spam}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-afh-lg">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center rounded-afh-lg border border-afh-border bg-afh-surface px-afh-xl text-afh-small font-semibold text-afh-text focus-visible:outline-none focus-visible:shadow-afh-focus"
        >
          {copy.back}
        </button>
      </div>
    </div>
  );
}
