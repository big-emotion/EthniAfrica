"use client";

import Link from "next/link";
import { Fragment, useId, type MouseEvent } from "react";

import type { FlagFormTarget } from "@/components/flags/FlagForm";
import { Badge as NameBadgeChip } from "@/components/names/NameAnswerCard";
import { SearchFeedContributionAction } from "@/components/search/feed/SearchFeedContributionAction";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { sourceKindLabel } from "@/lib/glossaire/vocabularies";
import { nameClosingCopy } from "@/lib/i18n/copy/nameClosing";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import { getTranslation } from "@/lib/translations";
import { normalizeFrenchSpacing } from "@/lib/prose/frenchSpacing";
import { sourceDiamondCopy } from "@/lib/i18n/copy/sourceDiamond";
import { useNameSearchHref } from "@/components/search/NameAddressProvider";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import {
  firstSentence,
  groupAccountsBySourceFamily,
  groupBySourceFamily,
  sourceRowsForTimelineName,
  timelineTileAnchorId,
  type NameHistorySource,
  type NameSourceRow,
  type NextStepCard,
  type SourceFamilyGroup,
  traditionReporters,
} from "@/lib/search/nameClosing";

export type { NextStepCard } from "@/lib/search/nameClosing";
import {
  splitNamedText,
  type NameHistoryAccount,
  type TimelineName,
} from "@/lib/search/nameTimeline";
import {
  sourceKindFamily,
  type SourceKindFamily,
} from "@/lib/sources/sourceKindFamily";
import { cn } from "@/lib/utils";
import type { SearchEntityType } from "@/types/afrik-frontend";
import type { FicheEntityType } from "@/types/fiche";
import type { Language } from "@/types/shared";
import type { SourceKind } from "@/types/sources";

/**
 * The blocks under the timeline: « Les sources du nom … », the closing band
 * and the next step. Result-page source rows follow approved brief 15; fiche
 * sources retain the account groups because no timeline can receive links.
 */

const MONO = "font-[family-name:var(--afh-font-mono)]";
const H2 =
  "font-afh-display text-afh-h2 font-black leading-[1.2] text-afh-text [overflow-wrap:anywhere]";

// Static class names, so Tailwind sees every one of them.
const FAMILY_FILL: Record<SourceKindFamily, string> = {
  oral: "bg-(--afh-source-oral)",
  book: "bg-(--afh-source-book)",
  encyclopedia: "bg-(--afh-source-encyclopedia)",
  press: "bg-(--afh-source-press)",
  report: "bg-(--afh-source-report)",
  archive: "bg-(--afh-source-archive)",
  other: "bg-(--afh-source-other)",
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
          <em key={index}>{normalizeFrenchSpacing(part.text)}</em>
        ) : (
          <Fragment key={index}>{normalizeFrenchSpacing(part.text)}</Fragment>
        )
      )}
    </>
  );
}

export interface NameSourcesBlockProps {
  name: TimelineName;
  /** Opens and scrolls to a folded timeline tile linked from a source row. */
  onRevealAccount?: (
    tileKey: string,
    event: MouseEvent<HTMLAnchorElement>
  ) => void;
  /** Kinds of source only the subject's other names cite (see `otherVoiceKinds`). */
  otherKinds?: readonly SourceKind[];
  subjectType?: SearchEntityType;
  language: Language;
}

/** Block 3: the open name's accounts, regrouped by the type of their sources. */
// @req REQ-198
// @req REQ-161
export function NameSourcesBlock({
  name,
  onRevealAccount,
  otherKinds = [],
  subjectType,
  language,
}: NameSourcesBlockProps) {
  const headingId = useId();
  const copy = nameClosingCopy[language];
  const groups = groupAccountsBySourceFamily(name);
  if (groups.length === 0) return null;

  const rows = sourceRowsForTimelineName(name);
  const sourceCounts = new Map<SourceKindFamily, number>();
  for (const { source } of rows) {
    const family = sourceKindFamily(source.source_kind);
    sourceCounts.set(family, (sourceCounts.get(family) ?? 0) + 1);
  }
  const accounts = name.tiles.flatMap((tile) => tile.accounts);
  const sources = rows.length;

  return (
    <section
      aria-labelledby={headingId}
      data-name-sources=""
      className="afh-tile flex flex-col gap-afh-2xl [.search-feed-reviewed_&]:mt-[var(--afh-section-gap)] text-left"
    >
      <h2 id={headingId} className={H2}>
        <Named
          text={copy.sourcesTitle(name.nameText)}
          forms={[name.nameText]}
        />
      </h2>
      <p className="text-afh-small leading-[1.6] text-afh-text-soft">
        <Named
          text={copy.sourcesLead(sources, accounts.length, name.nameText)}
          forms={[name.nameText]}
        />
      </p>
      <SourceStrip
        groups={groups}
        sourceCounts={sourceCounts}
        language={language}
      />
      <SourceRows
        rows={rows}
        nameText={name.nameText}
        onRevealAccount={onRevealAccount}
        language={language}
      />
      {otherKinds.length > 0 ? (
        <p
          data-other-voices=""
          className="text-afh-caption leading-[1.6] text-afh-text-soft"
        >
          {copy.otherVoices(subjectType, otherKinds)}
        </p>
      ) : null}
    </section>
  );
}

function SourceRows({
  rows,
  nameText,
  onRevealAccount,
  language,
}: {
  rows: readonly NameSourceRow[];
  nameText: string;
  onRevealAccount?: NameSourcesBlockProps["onRevealAccount"];
  language: Language;
}) {
  const copy = nameClosingCopy[language];
  return (
    <ul className="flex flex-col gap-afh-md" data-source-rows="">
      {rows.map(({ source, accounts }) => {
        const target = accounts[0];
        const title = source.narrative ?? source.title;
        const details =
          source.source_kind === "oral_tradition" && source.carrier
            ? copy.fiche.carrier(source.carrier, source.place)
            : [source.author, source.year]
                .filter(
                  (value) =>
                    value !== null && value !== undefined && value !== ""
                )
                .join(", ");
        return (
          <li
            key={JSON.stringify([
              source.source_kind,
              source.title,
              source.author,
              source.year,
              source.url,
              source.carrier,
              source.place,
              source.narrative,
            ])}
            data-source-row=""
            className="flex flex-col gap-afh-sm rounded-afh-lg border border-afh-border bg-afh-bg p-afh-lg text-afh-small leading-[1.5]"
          >
            <span className="flex items-start gap-afh-md font-semibold text-afh-text">
              <FamilyMark family={sourceKindFamily(source.source_kind)} />
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-1 underline-offset-[3px]"
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </span>
            <span className="text-afh-text-soft">
              {details ? `${details} · ` : ""}
              {sourceKindLabel(source.source_kind, language)}
            </span>
            <a
              href={`#${timelineTileAnchorId(nameText, target.tileKey)}`}
              onClick={(event) => onRevealAccount?.(target.tileKey, event)}
              className="w-fit font-bold text-[color:var(--accent-ink)] underline decoration-1 underline-offset-[3px]"
              data-timeline-account-link=""
            >
              {copy.sourceAccounts(accounts.length)}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

interface FamilyGroupsProps {
  groups: readonly SourceFamilyGroup[];
  forms: string[];
  /** Opens the first family and its first account. */
  open: boolean;
  hypothesis?: ReadonlyMap<NameHistoryAccount, number>;
  /** An oral source named by its carrier and place first (brief 2). */
  carrierFirst?: boolean;
  patronyme?: boolean;
  language: Language;
}

/** The family groups of block 3, each folding its accounts. */
function FamilyGroups({
  groups,
  forms,
  open,
  hypothesis = new Map(),
  carrierFirst = false,
  patronyme = false,
  language,
}: FamilyGroupsProps) {
  const copy = nameClosingCopy[language];
  const families = sourceDiamondCopy[language].families;
  const timelineCopy = nameTimelineCopy[language];
  const claimStatusLabels =
    getTranslation(language).patronymes.originClaimStatusLabels;
  return (
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
                      {patronyme && account.claimStatus
                        ? ` · ${claimStatusLabels[account.claimStatus]}`
                        : null}
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
                      {carrierFirst &&
                      (source.carrier ||
                        source.source_kind === "oral_tradition") ? (
                        <OralSourceLine
                          source={source}
                          reporters={traditionReporters(account)}
                          language={language}
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

/**
 * An oral account is identified by who carries it and where, then by who
 * wrote it down (doctrine §1.1, brief 2). A tradition the project reads only
 * in a written work has no carrier to name: it is named by its narrative,
 * then by who reports it (brief 4).
 */
function OralSourceLine({
  source,
  reporters,
  language,
}: {
  source: NameHistorySource;
  /** The works that wrote a carrierless tradition down (brief 4). */
  reporters: readonly NameHistorySource[];
  language: Language;
}) {
  const copy = nameClosingCopy[language].fiche;
  const title = source.narrative ?? source.title;
  // A tradition with no carrier is named by who wrote it down: the account's
  // written sources when it has some, else the oral source's own reference.
  const reportedBy = source.carrier
    ? [copy.reportedBy(source.author, source.year, source.title)]
    : (reporters.length > 0 ? reporters : [source]).map((reporter) =>
        copy.traditionsReportedBy(
          reporter.author,
          reporter.year,
          reporter.title
        )
      );
  return (
    <>
      {source.url ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[color:var(--accent-ink)] underline decoration-1 underline-offset-[3px]"
        >
          {title}
        </a>
      ) : (
        <span className="font-bold text-afh-text">{title}</span>
      )}
      {source.carrier ? (
        <>
          {" · "}
          {copy.carrier(source.carrier, source.place)}
        </>
      ) : null}
      {" · "}
      {sourceKindLabel(source.source_kind, language)}
      {" · "}
      {reportedBy.join(" ; ")}
    </>
  );
}

/** The families present, each with its count of distinct sources. */
function SourceStrip({
  groups,
  sourceCounts,
  language,
}: {
  groups: readonly SourceFamilyGroup[];
  sourceCounts?: ReadonlyMap<SourceKindFamily, number>;
  language: Language;
}) {
  const copy = nameClosingCopy[language];
  const families = sourceDiamondCopy[language].families;
  return (
    <ul aria-label={copy.sourcesStrip} className="flex flex-wrap gap-afh-md">
      {groups.map((group) => (
        <li
          key={group.family}
          className="inline-flex min-h-9 items-center gap-afh-md rounded-afh-full border border-afh-border bg-afh-bg px-afh-lg py-afh-xs text-afh-caption font-semibold text-afh-text"
        >
          <FamilyMark family={group.family} />
          {families[group.family]} ·{" "}
          <b className={MONO}>
            {copy.sourceCount(
              sourceCounts?.get(group.family) ?? group.sourceCount
            )}
          </b>
        </li>
      ))}
    </ul>
  );
}

export interface NameFicheSourcesBlockProps {
  history: NameHistory;
  subjectType: SearchEntityType;
  language: Language;
}

/**
 * Block 3 on a fiche (brief 2, boards people-*.dc.html): every name of the
 * subject, grouped by name first, then by the type of its sources. The first
 * name (the self-name, first in the fiche) is open, the others folded. A
 * fiche with one name keeps the search page's form.
 */
// @req REQ-198
// @req REQ-161
export function NameFicheSourcesBlock({
  history,
  subjectType,
  language,
}: NameFicheSourcesBlockProps) {
  const headingId = useId();
  const copy = nameClosingCopy[language];
  const names = history.names.filter((name) => name.accounts.length > 0);
  const every = names.flatMap((name) => name.accounts);
  const groups = groupBySourceFamily(every);
  if (groups.length === 0) return null;
  const forms = names.map((name) => name.nameText);
  const single = names.length === 1 ? names[0] : null;
  const sources = groups.reduce((sum, group) => sum + group.sourceCount, 0);

  return (
    <section
      aria-labelledby={headingId}
      data-name-sources=""
      className="afh-tile flex flex-col gap-afh-2xl text-left"
    >
      <h2 id={headingId} className={H2}>
        {single ? (
          <Named
            text={copy.sourcesTitle(single.nameText)}
            forms={[single.nameText]}
          />
        ) : (
          copy.fiche.sourcesTitle(subjectType)
        )}
      </h2>
      <p className="text-afh-small leading-[1.6] text-afh-text-soft">
        {single ? (
          <Named
            text={
              subjectType === "patronyme" && history.originExplained === false
                ? copy.fiche.sourcesLead(
                    sources,
                    every.length,
                    names.length,
                    subjectType,
                    false
                  )
                : copy.sourcesLead(sources, every.length, single.nameText)
            }
            forms={[single.nameText]}
          />
        ) : (
          copy.fiche.sourcesLead(
            sources,
            every.length,
            names.length,
            subjectType,
            history.originExplained
          )
        )}
      </p>
      <SourceStrip groups={groups} language={language} />
      {single ? (
        <FamilyGroups
          groups={groups}
          forms={forms}
          open
          carrierFirst
          patronyme={subjectType === "patronyme"}
          language={language}
        />
      ) : (
        <div className="flex flex-col gap-afh-md">
          {names.map((name, index) => (
            <details
              key={name.nameText}
              open={index === 0}
              data-name-group=""
              className="group/name rounded-afh-lg border border-afh-border bg-afh-surface"
            >
              <summary className="flex min-h-[52px] cursor-pointer list-none flex-wrap items-center gap-afh-md px-afh-2xl py-afh-md [&::-webkit-details-marker]:hidden">
                <span className="font-afh-display text-afh-h3 font-black leading-[1.2] text-afh-text [overflow-wrap:anywhere]">
                  {name.nameText}
                </span>
                {name.selfGiven ? (
                  <NameBadgeChip badge="own" language={language} />
                ) : null}
                <span
                  className={cn(
                    MONO,
                    "ml-auto whitespace-nowrap text-afh-caption text-afh-text-soft"
                  )}
                >
                  {copy.accountCount(name.accounts.length)}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="size-4 shrink-0 text-afh-text-soft transition-transform group-open/name:rotate-180"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div className="px-afh-2xl pb-afh-2xl">
                <FamilyGroups
                  groups={groupBySourceFamily(name.accounts)}
                  forms={forms}
                  open={index === 0}
                  carrierFirst
                  patronyme={subjectType === "patronyme"}
                  language={language}
                />
              </div>
            </details>
          ))}
        </div>
      )}
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
              // The tint stays light at night; --accent-foreground is the ink
              // that stays dark with it (--afh-text turns light: 1.12:1).
              className="border-[color:var(--accent)] bg-[color:var(--accent-tint)] font-semibold text-[color:var(--accent-foreground)]"
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

/**
 * Block 8: one or two names to read next, each with the reason it is offered.
 *
 * A click is counted one of two ways. A fiche route is a server component and
 * cannot hand down a callback, so it names the fiche (`trackFrom`) and the
 * block records `fiche:related_click` itself, as FicheOnward did before it.
 * The result page passes `onNavigate` and counts the click with its other
 * result clicks.
 */
// @req REQ-198
// @req REQ-046
export function NameNextStep({
  cards,
  language,
  trackFrom,
  onNavigate,
}: {
  cards: readonly NextStepCard[];
  language: Language;
  trackFrom?: FicheEntityType;
  onNavigate?: (card: NextStepCard, rank: number) => void;
}) {
  const copy = nameClosingCopy[language];
  const nameHref = useNameSearchHref(language);
  if (cards.length === 0) return null;
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
        {cards.map((card, index) => (
          <Link
            key={card.name}
            href={nameHref(card.name)}
            onClick={() => {
              if (trackFrom) {
                trackEvent("fiche:related_click", {
                  from: trackFrom,
                  to: card.relation,
                });
              }
              onNavigate?.(card, index + 1);
            }}
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
