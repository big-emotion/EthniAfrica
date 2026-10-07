"use client";

import { useId, useMemo, useState } from "react";

import {
  ANSWER_ACCENT_CLASS,
  ANSWER_BLOCK,
  ANSWER_TEXT_BUTTON,
} from "@/components/search/answer/answerStyle";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { LazySourceChainSheet } from "@/components/source-transparency/SourceChainSheet.lazy";
import type {
  PositionGroup,
  Source,
} from "@/components/source-transparency/SourceChainSheet";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerAccount, AnswerKind } from "@/lib/search/answer";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface SourcesLineProps {
  count: number;
  accounts?: AnswerAccount[];
  kind: AnswerKind;
  /** Names the subject in the sheet's header. */
  title: string;
  language?: Language;
}

function distinctSources(account: AnswerAccount): Source[] {
  const seen = new Map<string, Source>();
  for (const entry of account.evidence) {
    for (const source of entry.sources) seen.set(source.id, source);
  }
  return [...seen.values()];
}

/**
 * One line instead of a badge after every sentence; the sheet behind it groups
 * the sources by the account each one supports, so a reader can tell which
 * reading rests on what.
 * @req REQ-180
 */
export function SourcesLine({
  count,
  accounts = [],
  kind,
  title,
  language = "fr",
}: SourcesLineProps) {
  const copy = searchAnswerCopy[language];
  const [open, setOpen] = useState(false);
  const anchorId = `answer-sources-${useId().replace(/:/g, "")}`;

  const { sources, positions } = useMemo(() => {
    const perAccount = accounts.map(distinctSources);
    if (accounts.length < 2) {
      return { sources: perAccount[0] ?? [], positions: undefined };
    }
    const groups: PositionGroup[] = accounts.map((account, index) => ({
      position: [
        copy.sources.accountPosition(index + 1),
        account.attribution ? copy.origin.attribution[account.attribution] : "",
      ]
        .filter(Boolean)
        .join(" · "),
      sources: perAccount[index],
    }));
    return { sources: [], positions: groups };
  }, [accounts, copy]);

  if (count <= 0) return null;

  return (
    <div
      className={cn(
        ANSWER_BLOCK,
        ANSWER_ACCENT_CLASS[kind],
        "flex flex-wrap items-center justify-between gap-x-afh-lg border-y border-afh-border py-afh-md"
      )}
      data-answer-block="sources"
      data-feed-block="answer-sources"
      data-feed-zone="primary"
    >
      <span className="text-afh-small text-afh-text">
        <InlineMarkup text={copy.sources.summary(count)} />
      </span>
      <button
        type="button"
        className={ANSWER_TEXT_BUTTON}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {copy.sources.open}
      </button>
      <LazySourceChainSheet
        language={language}
        open={open}
        onOpenChange={setOpen}
        assertion={{
          statement: copy.sources.sheetStatement(title),
          sourceCount: count,
          lastHumanAuditAt: null,
        }}
        sources={sources}
        positions={positions}
        anchorId={anchorId}
      />
    </div>
  );
}
