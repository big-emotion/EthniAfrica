"use client";

import { useId, useState } from "react";

import {
  ANSWER_BLOCK,
  ANSWER_HEADING,
  ANSWER_TEXT_BUTTON,
} from "@/components/search/answer/answerStyle";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerKind, SearchAnswer } from "@/lib/search/answer";
import { leadingSentences } from "@/lib/search/answerFormat";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface OriginBlockProps {
  origin: NonNullable<SearchAnswer["origin"]>;
  kind: AnswerKind;
  /** Named in the sentence that introduces several readings. */
  title: string;
  /**
   * One label per account when each account is a different country's own
   * telling of the name (the two Congos). Those readings do not compete, so
   * the block says whose each one is instead of announcing a dispute.
   */
  accountLabels?: readonly string[];
  language?: Language;
}

/** A single undisputed account is cut at this many sentences. */
const SINGLE_ACCOUNT_SENTENCES = 3;

/**
 * « Where the name comes from ». The cutting rule is editorial, not visual: an
 * account that states a reading and then its contestation, cut after the
 * first sentence, would present the reading as settled. So with several
 * accounts, or a debated origin, every account keeps its own first sentence in
 * the same card before « Read more » and none is placed above another; only a
 * single undisputed account is shortened.
 * @req REQ-178
 */
export function OriginBlock({
  origin,
  kind,
  title,
  accountLabels,
  language = "fr",
}: OriginBlockProps) {
  const copy = searchAnswerCopy[language];
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const { accounts, debated } = origin;
  if (accounts.length === 0) return null;

  const side = debated || accounts.length > 1;
  const cut = accounts.map((account) =>
    leadingSentences(account.text, side ? 1 : SINGLE_ACCOUNT_SENTENCES)
  );
  const hasMore = cut.some(({ rest }) => rest.length > 0);

  const toggle = hasMore ? (
    <button
      type="button"
      className={ANSWER_TEXT_BUTTON}
      data-answer-read-more=""
      aria-expanded={expanded}
      aria-controls={detailId}
      onClick={() => setExpanded((open) => !open)}
    >
      {expanded ? copy.origin.readLess : copy.origin.readMore}
    </button>
  ) : null;

  return (
    <section
      className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-lg")}
      data-answer-block="origin"
      data-feed-block="answer-origin"
      data-feed-zone="primary"
    >
      <h2 className={ANSWER_HEADING}>
        {kind === "word" ? copy.origin.title.word : copy.origin.title.name}
      </h2>

      {side ? (
        <>
          {accountLabels ? null : (
            <p className="text-afh-body leading-[var(--afh-leading-body)] text-afh-text">
              {accounts.length === 2
                ? copy.origin.debatedIntroTwo(title)
                : copy.origin.debatedIntroMany}
            </p>
          )}
          <ul
            id={detailId}
            className="m-0 flex list-none flex-col gap-afh-base p-0"
          >
            {accounts.map((account, index) => (
              <li
                key={index}
                className="flex flex-col gap-afh-xs rounded-afh-xl border border-afh-border bg-afh-surface px-afh-2xl py-afh-xl text-afh-small leading-[var(--afh-leading-small)] text-afh-text"
                data-account
              >
                {accountLabels?.[index] ? (
                  <span className="text-afh-caption font-bold text-[color:var(--accent-ink)]">
                    {accountLabels[index]}
                  </span>
                ) : account.attribution && accounts.length > 1 ? (
                  <span className="text-afh-caption font-bold text-[color:var(--accent-ink)]">
                    {copy.origin.attribution[account.attribution]}
                  </span>
                ) : null}
                <p className="m-0">
                  {cut[index].shown}
                  {expanded && cut[index].rest ? ` ${cut[index].rest}` : ""}
                </p>
              </li>
            ))}
          </ul>
          {debated ? (
            <p className="m-0 text-afh-small text-afh-fg-muted">
              {copy.origin.debatedFootnote}
            </p>
          ) : null}
          {toggle}
        </>
      ) : (
        <div id={detailId} className="flex flex-col gap-afh-lg">
          <p className="m-0 text-afh-body leading-[var(--afh-leading-body)] text-afh-text">
            {cut[0].shown}
            {expanded && cut[0].rest ? ` ${cut[0].rest}` : ""}
          </p>
          {toggle ? <div>{toggle}</div> : null}
        </div>
      )}
    </section>
  );
}
