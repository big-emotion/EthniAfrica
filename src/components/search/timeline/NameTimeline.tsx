"use client";

import { useRef, useState, type ReactNode } from "react";

import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { NameSourcesBlock } from "@/components/search/timeline/NameClosing";
import {
  NamedText,
  SourcedText,
} from "@/components/search/timeline/SourcedText";
import { otherVoiceKinds } from "@/lib/search/nameClosing";
import { TileSourceMarker } from "@/components/search/timeline/TileSourceMarker";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import { peopleCopy } from "@/lib/i18n/copy/people";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import {
  africanRegionsOf,
  elsewhereAnchorFor,
} from "@/lib/search/elsewhereAnchors";
import {
  buildNameTimeline,
  periodRuns,
  type NameHistoryAccount,
  type TimelineRegime,
  type TimelineTile,
} from "@/lib/search/nameTimeline";
import { cn } from "@/lib/utils";
import type { SearchEntityType } from "@/types/afrik-frontend";
import type { Language } from "@/types/shared";

export interface NameTimelineProps {
  history: NameHistory;
  /** What the reader typed: that name leads (REQ-197). */
  searched: string;
  subjectType: SearchEntityType;
  headingLevel?: "h1" | "h2";
  /** The subject's countries, so « ailleurs » skips its own region. */
  countryIds?: readonly string[];
  /**
   * Whether « Les sources parlent » opens its first family (brief 1): the
   * first subject of the page does, the others stay folded.
   */
  sourcesOpen?: boolean;
  /**
   * The way to the full fiche, drawn between the timeline and « Les sources
   * parlent » when the page has one subject (brief 1: it « stays under the
   * timeline »).
   */
  ficheLink?: ReactNode;
  /**
   * The one video made on the subject (brief 11 §2), drawn after the end
   * line and the hand-off, whichever name is open: it belongs to the subject.
   */
  video?: ReactNode;
  /** The name the chips have open, so the closing band can speak of it. */
  onOpenNameChange?: (nameText: string) => void;
  language: Language;
}

const REGIMES: readonly TimelineRegime[] = ["modern", "colonial", "polity"];

/**
 * The name-history timeline (REQ-198, DEC-073): one name at a time, from today
 * backwards, its birth marked and what came before it told as such. Layout
 * from the approved mockup (docs/editorial/strategy/name-history-timeline-
 * mockup-v4.html, birth palette from -v5); the thread, dots and tiles are the
 * fiche chronology's own classes so the two read as one object.
 */
// @req REQ-198
// @req REQ-197
export function NameTimeline({
  history,
  searched,
  subjectType,
  headingLevel = "h1",
  countryIds,
  sourcesOpen = false,
  ficheLink,
  video,
  onOpenNameChange,
  language,
}: NameTimelineProps) {
  const copy = nameTimelineCopy[language];
  const leadCopy = searchFeedCopy[language].searchedLead;
  const timeline = buildNameTimeline(history, searched);
  const [shown, setShown] = useState(0);
  const [elsewhere, setElsewhere] = useState(false);
  const namesRef = useRef<HTMLDivElement>(null);
  const name = timeline.names[shown];
  const forms = timeline.italicForms;
  const Heading = headingLevel;
  const anchorIdOf = (key: string) =>
    `timeline-${key}`.normalize("NFD").replace(/[^\w-]+/g, "-");

  const selfLine =
    leadCopy.self[subjectType as keyof typeof leadCopy.self] ?? undefined;
  const selfIndex = timeline.selfLead
    ? timeline.names.findIndex((n) => n.nameText === timeline.selfLead!.self)
    : -1;
  const selfLead = selfLine && selfIndex >= 0 ? timeline.selfLead : undefined;

  const show = (index: number) => {
    setShown(index);
    onOpenNameChange?.(timeline.names[index].nameText);
  };
  // The page introduces the name before it explains it (doctrine §1.1): the
  // reader lands on the chips and the intro line under them, never straight
  // on the explanations. Focus follows the scroll (WCAG 2.4.3).
  const openSelfName = () => {
    show(selfIndex);
    const names = namesRef.current;
    if (!names) return;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    names.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
    names
      .querySelectorAll<HTMLButtonElement>("button")
      [selfIndex]?.focus({ preventScroll: true });
  };

  const subjectRegions = africanRegionsOf(countryIds);
  const anchorOf = (tile: TimelineTile) =>
    tile.hypotheses
      ? undefined
      : elsewhereAnchorFor(tile.accounts[0].period, subjectRegions);
  const hasAnchors = name.tiles.some((tile) => anchorOf(tile));
  const regimes = REGIMES.filter((regime) =>
    name.tiles.some((tile) => tile.regime === regime)
  );

  const passage = (account: NameHistoryAccount, key: string) => (
    <>
      <p className="afh-name-timeline-statement">
        <SourcedText text={account.statement} forms={forms}>
          <TileSourceMarker
            statement={account.statement}
            sources={account.sources}
            anchorId={anchorIdOf(key)}
            language={language}
            surface="timeline"
          />
        </SourcedText>
      </p>
      {account.actors?.length ? (
        <p className="afh-name-timeline-actors">
          {copy.actors} :{" "}
          {account.actors
            .map((actor) => `${actor.name}, ${actor.role}`)
            .join(" ; ")}
        </p>
      ) : null}
    </>
  );

  return (
    <>
      <section className="afh-name-timeline" data-name-timeline="">
        <div className="afh-tile" data-timeline-summary="">
          <p className="afh-tile-label">
            {copy.eyebrow(getSearchEntityLabel(subjectType))}
          </p>
          <Heading className="afh-name-timeline-title">
            {timeline.names[0].nameText}
          </Heading>
          <p className="afh-name-timeline-summary">
            <NamedText text={timeline.summary} forms={forms} />
          </p>
          {selfLead ? (
            <button
              type="button"
              className={cn("afh-name-timeline-lead", CHARTER_FOCUS_RING)}
              onClick={openSelfName}
            >
              <span className="afh-name-timeline-lead-text">
                <span>
                  <NamedText
                    text={`${leadCopy.searched(selfLead.searched)} ${selfLine(selfLead.self)}`}
                    forms={forms}
                  />
                </span>
                {selfLead.readings > 0 ? (
                  <span className="afh-name-timeline-lead-line">
                    <NamedText
                      text={copy.selfReadings(selfLead.self, selfLead.readings)}
                      forms={forms}
                    />
                  </span>
                ) : null}
              </span>
              <span className="afh-name-timeline-lead-go" aria-hidden="true">
                {copy.seeSelfName}
              </span>
            </button>
          ) : null}
        </div>

        <div
          ref={namesRef}
          role="group"
          aria-label={copy.namesLabel(timeline.names[0].nameText)}
          className="afh-name-timeline-names"
        >
          {timeline.names.map((candidate, index) => (
            <button
              key={candidate.nameText}
              type="button"
              aria-pressed={index === shown}
              onClick={() => show(index)}
              className={cn("afh-name-timeline-name", CHARTER_FOCUS_RING)}
            >
              <span>{candidate.nameText}</span>
              {candidate.searched ? (
                <span className="afh-name-timeline-mark">
                  {" "}
                  · {copy.searchedMark}
                </span>
              ) : candidate.former ? (
                <span className="afh-name-timeline-mark">
                  {" "}
                  · {copy.formerMark}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {name.shortLine ? (
          <p className="afh-name-timeline-intro">
            <NamedText text={name.shortLine} forms={forms} />
          </p>
        ) : null}
        {!name.hasBirth ? (
          <p className="afh-name-timeline-nobirth" role="note">
            {copy.noBirth(name.nameText)}
          </p>
        ) : null}

        <div className="afh-name-timeline-tools">
          <p className="afh-name-timeline-hint">
            <span aria-hidden="true">↓ </span>
            {copy.hint}
          </p>
          {hasAnchors ? (
            <button
              type="button"
              aria-pressed={elsewhere}
              onClick={() => setElsewhere((value) => !value)}
              className={cn(
                "afh-name-timeline-elsewhere-toggle",
                CHARTER_FOCUS_RING
              )}
            >
              {copy.elsewhereButton}
            </button>
          ) : null}
        </div>

        {regimes.length > 0 ? (
          <ul
            className="afh-chronology-legend"
            aria-label={copy.regimeLegend}
            data-chronology-legend=""
          >
            {regimes.map((regime) => (
              <li key={regime} data-regime={regime}>
                {copy.regime[regime]}
              </li>
            ))}
          </ul>
        ) : null}

        <ol
          className="afh-chronology"
          aria-label={copy.tilesLabel(name.nameText)}
        >
          {/* A run of tiles of one period is one station (brief 11 §4). */}
          {periodRuns(name.tiles).map(([tile, ...joined]) => {
            const anchor = elsewhere ? anchorOf(tile) : undefined;
            return (
              <li
                key={tile.key}
                className="afh-chronology-station"
                data-regime={tile.regime}
                data-placement={tile.placement}
              >
                <div className="afh-tile">
                  {tile.placement === "birth" ? (
                    <p className="afh-name-timeline-pill">
                      {copy.birthMark(name.nameText)}
                    </p>
                  ) : tile.placement === "before" ? (
                    <p className="afh-name-timeline-pill">
                      {copy.beforeMark(name.nameText)}
                    </p>
                  ) : null}
                  {tile.periodLabel ? (
                    <p className="afh-name-timeline-period">
                      {tile.periodLabel}
                    </p>
                  ) : null}
                  {tile.hypotheses ? (
                    <>
                      <p className="afh-name-timeline-hypotheses">
                        <NamedText
                          text={copy.hypothesesHeading(name.nameText)}
                          forms={forms}
                        />
                      </p>
                      {tile.accounts.map((account, index) => (
                        <div
                          key={index}
                          className="afh-name-timeline-hypothesis"
                        >
                          <p className="afh-name-timeline-tag">
                            <span>{copy.hypothesis(index + 1)}</span>
                            {tile.periodLabel ? null : (
                              <span> · {account.period.label}</span>
                            )}
                          </p>
                          {passage(account, `${tile.key}-${index}`)}
                        </div>
                      ))}
                    </>
                  ) : (
                    passage(tile.accounts[0], tile.key)
                  )}
                  {joined.map((next) => (
                    <div key={next.key} className="afh-name-timeline-join">
                      {passage(next.accounts[0], next.key)}
                    </div>
                  ))}
                  {anchor ? (
                    <div
                      className="afh-name-timeline-elsewhere"
                      data-elsewhere=""
                    >
                      <p className="afh-name-timeline-tag">
                        {copy.elsewhereTitle}
                      </p>
                      <p className="afh-name-timeline-statement">
                        <NamedText
                          text={copy.elsewhereLead[tile.placement](
                            name.nameText
                          )}
                          forms={forms}
                        />{" "}
                        <SourcedText text={anchor.sentence} forms={[]}>
                          <TileSourceMarker
                            statement={anchor.sentence}
                            sources={anchor.sources}
                            anchorId={anchorIdOf(`${tile.key}-elsewhere`)}
                            language={language}
                            surface="timeline"
                          />
                        </SourcedText>
                      </p>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="afh-name-timeline-end">{copy.end(name.nameText)}</p>
        {/* Off the thread, no dot, no date: the way on to the self-name's
            story, while the searched name is open (brief 11 §1b-c). */}
        {selfLead && shown === 0 ? (
          <div className="afh-tile afh-name-timeline-handoff" data-handoff="">
            <p className="afh-tile-label">
              {peopleCopy[language].nameAnswer.badges.own}
            </p>
            <p className="afh-name-timeline-handoff-name">{selfLead.self}</p>
            <p className="afh-name-timeline-handoff-text">
              <NamedText
                text={`${selfLine(selfLead.self)} ${copy.handOffStory(selfLead.readings)}`}
                forms={forms}
              />
            </p>
            <button
              type="button"
              onClick={openSelfName}
              className={cn(
                "afh-name-timeline-handoff-action",
                CHARTER_FOCUS_RING
              )}
            >
              {copy.handOffAction(selfLead.self)}
            </button>
          </div>
        ) : null}
        {video}
      </section>
      {ficheLink}
      {/* Block 3 follows the name the chips have open (brief 1). */}
      <NameSourcesBlock
        key={name.nameText}
        name={name}
        forms={forms}
        open={sourcesOpen}
        otherKinds={otherVoiceKinds(timeline.names, name)}
        subjectType={subjectType}
        language={language}
      />
    </>
  );
}
