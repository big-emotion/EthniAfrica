"use client";

import Link from "next/link";
import { Fragment, useId } from "react";

import type { FlagFormTarget } from "@/components/flags/FlagForm";
import { SearchFeedContributionAction } from "@/components/search/feed/SearchFeedContributionAction";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import { sourceDiamondCopy } from "@/lib/i18n/copy/sourceDiamond";
import { getLocalizedRoute } from "@/lib/routing";
import {
  firstSentence,
  groupAccountsBySourceFamily,
  type NextStepCard,
} from "@/lib/search/nameClosing";

export type { NextStepCard } from "@/lib/search/nameClosing";
import {
  splitNamedText,
  type NameHistoryAccount,
  type TimelineName,
} from "@/lib/search/nameTimeline";
import type { SourceKindFamily } from "@/lib/sources/sourceKindFamily";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

/**
 * The blocks brief 1 adds under the timeline (approved 2026-10-14; boards
 * docs/design/mockups/site/search-*.dc.html, components on `Main`):
 * « Les sources parlent », the closing band and the next step.
 */

const MONO = "font-[family-name:var(--afh-font-mono)]";
const H2 =
  "font-afh-display text-afh-h2 font-black leading-[1.2] text-afh-text [overflow-wrap:anywhere]";

// Static class names, so Tailwind sees every one of them.
const FAMILY_FILL: Record<SourceKindFamily, string> = {
  oral: "bg-[color:var(--afh-source-oral)]",
  book: "bg-[color:var(--afh-source-book)]",
  encyclopedia: "bg-[color:var(--afh-source-encyclopedia)]",
  press: "bg-[color:var(--afh-source-press)]",
  report: "bg-[color:var(--afh-source-report)]",
  archive: "bg-[color:var(--afh-source-archive)]",
  other: "bg-[color:var(--afh-source-other)]",
};

function FamilyMark({ family }: { family: SourceKindFamily }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2.5 shrink-0 rotate-45 rounded-[2px]",
        FAMILY_FILL[family]
      )}
    />
  );
}

function Caret() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4 shrink-0 text-afh-text-soft transition-transform group-open:rotate-180"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Named({ text, forms }: { text: string; forms: string[] }) {
  return (
    <>
      {splitNamedText(text, forms).map((part, index) =>
        part.name ? (
          <em key={index}>{part.text}</em>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        )
      )}
    </>
  );
}

export interface NameSourcesBlockProps {
  name: TimelineName;
  forms: string[];
  /** The first subject's block opens its first family, the others are folded. */
  open?: boolean;
  language: Language;
}

/** Block 3: the open name's accounts, regrouped by the type of their sources. */
// @req REQ-198
// @req REQ-161
export function NameSourcesBlock({
  name,
  forms,
  open = false,
  language,
}: NameSourcesBlockProps) {
  const headingId = useId();
  const copy = nameClosingCopy[language];
  const families = sourceDiamondCopy[language].families;
  const timelineCopy = nameTimelineCopy[language];
  const groups = groupAccountsBySourceFamily(name);
  if (groups.length === 0) return null;

  const accounts = name.tiles.flatMap((tile) => tile.accounts);
  const hypothesis = new Map<NameHistoryAccount, number>();
  for (const tile of name.tiles) {
    if (!tile.hypotheses) continue;
    tile.accounts.forEach((account, index) =>
      hypothesis.set(account, index + 1)
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      data-name-sources=""
      className="afh-tile flex flex-col gap-afh-2xl [.search-feed-reviewed_&]:mt-[var(--afh-section-gap)] text-left"
    >
      <p className="afh-tile-label">{copy.sourcesEyebrow}</p>
      <h2 id={headingId} className={H2}>
        <Named
          text={copy.sourcesTitle(name.nameText)}
          forms={[name.nameText]}
        />
      </h2>
      <p className="text-afh-small leading-[1.6] text-afh-text-soft">
        <Named
          text={copy.sourcesLead(accounts.length, name.nameText)}
          forms={[name.nameText]}
        />
      </p>
      <ul aria-label={copy.sourcesStrip} className="flex flex-wrap gap-afh-md">
        {groups.map((group) => (
          <li
            key={group.family}
            className="inline-flex min-h-9 items-center gap-afh-md rounded-afh-full border border-afh-border bg-afh-bg px-afh-lg py-afh-xs text-afh-caption font-semibold text-afh-text"
          >
            <FamilyMark family={group.family} />
            {families[group.family]} ·{" "}
            <b className={MONO}>{copy.sourceCount(group.sourceCount)}</b>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-afh-md">
        {groups.map((group, groupIndex) => (
          <details
            key={group.family}
            open={open && groupIndex === 0}
            data-family={group.family}
            className="group rounded-afh-lg border border-afh-border bg-afh-bg"
          >
            <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-afh-lg px-afh-2xl py-afh-md [&::-webkit-details-marker]:hidden">
              <FamilyMark family={group.family} />
              <span className="font-bold text-afh-text">
                {families[group.family]}
              </span>
              <span
                className={cn(
                  MONO,
                  "ml-auto whitespace-nowrap text-afh-caption text-afh-text-soft"
                )}
              >
                {copy.accountCount(group.accounts.length)}
              </span>
              <Caret />
            </summary>
            <div className="flex flex-col gap-afh-md px-afh-2xl pb-afh-2xl">
              {group.accounts.map(({ account, sources }, index) => (
                <details
                  key={index}
                  open={open && groupIndex === 0 && index === 0}
                  className="group/account border-t border-dashed border-afh-border"
                >
                  <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-afh-lg py-afh-md [&::-webkit-details-marker]:hidden">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span
                        className={cn(
                          MONO,
                          "text-afh-caption font-semibold text-afh-text-soft"
                        )}
                      >
                        {hypothesis.has(account)
                          ? `${timelineCopy.hypothesis(hypothesis.get(account)!)} · `
                          : null}
                        {account.period.label ?? copy.undated}
                      </span>
                      <span className="line-clamp-1 text-afh-small leading-[1.5] text-afh-text group-open/account:hidden">
                        <Named
                          text={firstSentence(account.statement)}
                          forms={forms}
                        />
                      </span>
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="size-4 text-afh-text-soft transition-transform group-open/account:rotate-180"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="text-afh-small leading-[1.6] [overflow-wrap:anywhere]">
                    <Named text={account.statement} forms={forms} />
                  </p>
                  <ul className="my-afh-md flex flex-col gap-afh-sm border-l-2 border-afh-border pl-afh-lg">
                    {sources.map((source, sourceIndex) => (
                      <li
                        key={sourceIndex}
                        className="text-afh-caption leading-[1.5] text-afh-text-soft"
                      >
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[color:var(--accent-ink)] underline decoration-1 underline-offset-[3px]"
                          >
                            {source.title}
                          </a>
                        ) : (
                          <span className="font-bold text-afh-text">
                            {source.title}
                          </span>
                        )}
                        {" · "}
                        {[source.author, source.year]
                          .filter(Boolean)
                          .join(", ")}
                        {" · "}
                        {sourceKindLabel(source.source_kind, language)}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export interface NameClosingBandProps {
  silences: readonly string[];
  /** Absent where the page already carries its invitation (an unknown name). */
  contributionTarget?: FlagFormTarget;
  language: Language;
}

/** Blocks 5 to 7: what the project does not know, its conviction, the invitation to correct. */
// @req REQ-198
export function NameClosingBand({
  silences,
  contributionTarget,
  language,
}: NameClosingBandProps) {
  const copy = nameClosingCopy[language];
  return (
    <section
      aria-labelledby="name-closing-title"
      data-name-closing=""
      className="flex flex-col gap-afh-5xl rounded-afh-lg bg-afh-bg-warm px-afh-2xl py-afh-5xl md:p-afh-6xl [.search-feed-reviewed_&]:mt-[var(--afh-section-gap)] text-left"
    >
      <div>
        <h2 id="name-closing-title" className={H2}>
          {copy.closingTitle}
        </h2>
        <ul className="mt-afh-lg flex flex-col gap-afh-md">
          {silences.map((line) => (
            <li
              key={line}
              className="grid grid-cols-[14px_1fr] items-baseline gap-afh-lg text-afh-small leading-[1.6] text-afh-text before:size-2.5 before:translate-y-px before:rounded-full before:border-[1.5px] before:border-dashed before:border-[color:var(--afh-name-before-dash)] before:content-['']"
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-afh-border pt-afh-5xl font-afh-display text-afh-h3 font-bold leading-[1.35] text-afh-text">
        {copy.conviction}
      </p>
      {copy.thesis ? (
        <p
          data-name-thesis=""
          className={cn(
            MONO,
            "-mt-afh-lg text-afh-caption tracking-[0.04em] text-afh-text-soft"
          )}
        >
          {copy.thesis}
        </p>
      ) : null}
      {contributionTarget ? (
        <div className="flex flex-col gap-afh-lg rounded-afh-lg border border-[color:var(--accent)] bg-afh-surface p-afh-2xl">
          <p className="font-bold">{copy.invitationTitle}</p>
          <p className="text-afh-small leading-[1.6]">{copy.invitationBody}</p>
          <div className="flex flex-wrap gap-afh-md">
            <SearchFeedContributionAction
              language={language}
              target={contributionTarget}
              label={copy.report}
              preferredKind="correction-proposal"
              variant="outline"
              className="border-[color:var(--accent)] bg-[color:var(--accent-tint)] font-semibold text-afh-text"
            />
            <SearchFeedContributionAction
              language={language}
              target={contributionTarget}
              label={copy.propose}
              preferredKind="contribution"
              variant="outline"
              className="border-[color:var(--accent)] bg-afh-surface font-semibold text-afh-text"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** Block 8: one or two names to read next, each with the reason it is offered. */
// @req REQ-198
export function NameNextStep({
  cards,
  language,
}: {
  cards: readonly NextStepCard[];
  language: Language;
}) {
  const copy = nameClosingCopy[language];
  if (cards.length === 0) return null;
  const searchRoute = getLocalizedRoute(language, "search");
  return (
    <nav
      aria-labelledby="name-next-title"
      data-name-next=""
      className="flex flex-col gap-afh-lg [.search-feed-reviewed_&]:mt-[var(--afh-section-gap)] text-left"
    >
      <h2 id="name-next-title" className={H2}>
        {copy.nextTitle}
      </h2>
      <div className="grid grid-cols-1 gap-afh-lg md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={`${searchRoute}?${new URLSearchParams({ q: card.name })}`}
            className="flex min-h-11 flex-col gap-afh-sm rounded-afh-lg border border-afh-border bg-afh-surface p-afh-2xl text-afh-text no-underline focus-visible:outline-none focus-visible:shadow-afh-focus"
          >
            <span
              className={cn(
                MONO,
                "text-afh-caption font-bold uppercase tracking-[0.08em] text-[color:var(--accent-ink)]"
              )}
            >
              {card.kind}
            </span>
            <span className="inline-flex items-center gap-afh-md font-afh-display text-afh-h3 font-black leading-[1.2]">
              {card.name}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-[18px] text-[color:var(--accent-ink)]"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
            <span className="text-afh-small leading-[1.55] text-afh-text-soft">
              {card.reason}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
