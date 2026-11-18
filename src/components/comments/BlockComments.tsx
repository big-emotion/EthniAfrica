"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CommentSheet,
  type SheetRequest,
} from "@/components/comments/CommentSheet";
import {
  fetchBlockComments,
  type BlockComments,
} from "@/components/comments/commentsApi";
import { QueryProvider } from "@/components/QueryProvider";
import { Button, type ButtonProps } from "@/components/ui/button";
import { buildBlockKey, type BlockSection } from "@/lib/comments/blockKey";
import { commentsCopy } from "@/lib/i18n/copy/comments";
import { formatDate } from "@/lib/languageTag";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

/**
 * Comments per passage on the search result page: brief 21, proposal B, the
 * block footer (approved 2026-11-18; REQ-212). Styles are the record layer
 * of the boards (`cm-*` in `docs/design/mockups/site/ea-live.css`) written as
 * token utilities here, so no stylesheet under `src/styles/` moves away from
 * the boards' verbatim copy.
 */

interface BlockCommentsContextValue {
  language: Language;
  byKey: ReadonlyMap<string, BlockComments>;
  open: (request: SheetRequest) => void;
}

const BlockCommentsContext = createContext<BlockCommentsContextValue | null>(
  null
);

const QUERY_KEY = "block-comments";

export interface BlockCommentsProviderProps {
  /** Every key the page may draw a footer on, read in one request. */
  blockKeys: readonly string[];
  language: Language;
  children: ReactNode;
}

/**
 * The page's one read of its comments, and its one sheet. The query client
 * lives here rather than at the root so that pages without comments do not
 * load it (see `QueryProvider`).
 */
// @req REQ-212
export function BlockCommentsProvider(props: BlockCommentsProviderProps) {
  return (
    <QueryProvider>
      <PageComments {...props} />
    </QueryProvider>
  );
}

function PageComments({
  blockKeys,
  language,
  children,
}: BlockCommentsProviderProps) {
  const queryClient = useQueryClient();
  const queryKey = [QUERY_KEY, blockKeys.join(",")];
  const { data } = useQuery({
    queryKey,
    queryFn: () => fetchBlockComments(blockKeys),
    enabled: blockKeys.length > 0,
    // A page without its counts still reads; a footer then says
    // « Aucun commentaire » rather than holding the page on a spinner.
    retry: false,
  });
  const [request, setRequest] = useState<SheetRequest | null>(null);

  const value = useMemo<BlockCommentsContextValue>(
    () => ({
      language,
      byKey: new Map((data ?? []).map((entry) => [entry.block_key, entry])),
      open: setRequest,
    }),
    [data, language]
  );

  return (
    <BlockCommentsContext.Provider value={value}>
      {children}
      <CommentSheet
        request={request}
        comments={
          request?.blockKey ? value.byKey.get(request.blockKey) : undefined
        }
        language={language}
        onClose={() => setRequest(null)}
        onPublished={() => queryClient.invalidateQueries({ queryKey })}
      />
    </BlockCommentsContext.Provider>
  );
}

export interface CommentablePassage {
  /** The subject as the search names it; the key normalises its spelling. */
  subject: { type: string; id: string };
  section: BlockSection;
  /** What the passage is called in the sheet's title (« Ses noms »). */
  label: string;
  /** The subject's name, after the label (« Ses noms · Peul »). */
  name: string;
  /** The passage's opening words, quoted at the head of the sheet. */
  quote?: string;
}

function usePassage(passage: CommentablePassage) {
  const context = useContext(BlockCommentsContext);
  if (!context) return null;
  const blockKey = buildBlockKey({
    subject: passage.subject.type,
    id: passage.subject.id,
    section: passage.section,
  });
  if (!blockKey) return null;
  const copy = commentsCopy[context.language];
  return {
    copy,
    language: context.language,
    entry: context.byKey.get(blockKey),
    open: () =>
      context.open({
        subject: passage.subject,
        blockKey,
        eyebrow: copy.sheet.eyebrow,
        title: `${passage.label} · ${passage.name}`,
        quote: passage.quote,
      }),
  };
}

/** The text-only button of the actions charter §4: the label alone. */
export const TEXT_BUTTON =
  "inline-flex min-h-11 items-center px-0.5 text-afh-small font-semibold text-[color:var(--accent-ink)] focus-visible:outline-none focus-visible:shadow-afh-focus";

/** The bordered button the boards call `.cm-btn`. */
export const BORDERED_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-afh-sm whitespace-nowrap rounded-afh-lg border border-afh-border bg-afh-surface px-afh-xl text-afh-small font-semibold leading-[1.2] text-afh-text focus-visible:outline-none focus-visible:shadow-afh-focus";

/**
 * The line that closes a passage: the count, then « Commenter ». The count
 * is a button only when there is a thread to open; « Commenter » is always
 * written, since the invitation matters most where nobody has spoken.
 */
// @req REQ-212
export function BlockCommentsFooter(passage: CommentablePassage) {
  const state = usePassage(passage);
  if (!state) return null;
  const { copy, entry, open } = state;
  const count = entry?.count ?? 0;
  return (
    <div
      data-comment-footer=""
      className="mt-afh-lg flex flex-wrap items-center justify-between gap-x-afh-lg gap-y-afh-xs border-t border-afh-border pt-afh-xs"
    >
      {count > 0 ? (
        <button
          type="button"
          onClick={open}
          className={cn(TEXT_BUTTON, "text-afh-text")}
        >
          {copy.count(count)}
        </button>
      ) : (
        <span className="inline-flex min-h-11 items-center text-afh-small text-afh-text-soft">
          {copy.none}
        </span>
      )}
      <button
        type="button"
        onClick={open}
        className={cn(BORDERED_BUTTON, "border-[color:var(--accent)]")}
      >
        {copy.add}
      </button>
    </div>
  );
}

/**
 * « Corrigé le … grâce à une contribution. » The sharp corner of the source
 * apparatus (moderation charter §5): it states what changed on the page.
 */
// @req REQ-212
export function CorrectedBanner(passage: CommentablePassage) {
  const state = usePassage(passage);
  if (!state?.entry?.corrected_at) return null;
  const { copy, entry, open, language } = state;
  return (
    <div
      data-comment-corrected=""
      className="mb-afh-lg flex flex-wrap items-center gap-x-afh-lg rounded-none border border-afh-text-soft bg-afh-bg-warm px-afh-lg py-0.5 text-afh-small"
    >
      <p className="py-afh-md font-bold leading-[1.4]">
        {copy.corrected(formatDate(language, new Date(entry.corrected_at)))}
      </p>
      <button type="button" onClick={open} className={TEXT_BUTTON}>
        {copy.seeDiscussion}
      </button>
    </div>
  );
}

/** A passage with its correction banner on top and its footer below. */
// @req REQ-212
export function CommentableBlock({
  children,
  ...passage
}: CommentablePassage & { children: ReactNode }) {
  return (
    <div data-comment-block="" className="flex flex-col">
      <CorrectedBanner {...passage} />
      {children}
      <BlockCommentsFooter {...passage} />
    </div>
  );
}

/** The participation sentence: after the first answer, never before it. */
// @req REQ-212
export function ParticipationInvite() {
  const context = useContext(BlockCommentsContext);
  if (!context) return null;
  const copy = commentsCopy[context.language];
  return (
    <aside
      aria-label={copy.inviteLabel}
      data-comment-invite=""
      className="my-afh-xs flex flex-col gap-afh-md rounded-afh-lg border border-afh-border bg-afh-bg-warm px-afh-2xl py-afh-lg"
    >
      <p className="text-afh-small leading-[1.55]">{copy.participation}</p>
      <p className="text-afh-small text-afh-text-soft">{copy.inviteHow}</p>
    </aside>
  );
}

export interface PageCommentActionProps {
  target: { type: string; id: string; name?: string; fieldPath?: string };
  label: string;
  className?: string;
  variant?: ButtonProps["variant"];
  /** What the page draws outside a result page, where no sheet exists. */
  fallback: ReactNode;
}

/**
 * The page-end « Signaler une erreur / Proposer une source » (brief 21,
 * arbitration 1): the same form as « Commenter », on no particular block,
 * so every contribution reaches one queue.
 */
// @req REQ-212
export function PageCommentAction({
  target,
  label,
  className,
  variant = "outline",
  fallback,
}: PageCommentActionProps) {
  const context = useContext(BlockCommentsContext);
  if (!context) return <>{fallback}</>;
  const copy = commentsCopy[context.language];
  return (
    // Drawn as the feed's contribution button it replaces: the same
    // primitive and classes, so the pair looks as it did (brief 21).
    <Button
      type="button"
      variant={variant}
      className={cn("min-h-11 text-afh-small", className)}
      onClick={() =>
        context.open({
          subject: { type: target.type, id: target.id },
          blockKey: null,
          eyebrow: copy.sheet.pageEyebrow,
          title: target.name ?? copy.blocks.page,
          fieldPath: target.fieldPath,
        })
      }
    >
      {label}
    </Button>
  );
}

/**
 * The opening words of a passage, quoted at the head of the sheet so the
 * reader knows what they answer: the first sentence, cut short if long.
 */
// @req REQ-212
export function passageQuote(text: string, max = 140): string {
  const sentence = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  const cut =
    sentence.length > max
      ? sentence.slice(0, sentence.lastIndexOf(" ", max)).replace(/[,;:]$/, "")
      : sentence.replace(/[.!?]$/, "");
  return `${cut}…`;
}
