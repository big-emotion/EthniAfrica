"use client";

import { Fragment, useState } from "react";

import { getSearchEntityLabel } from "@/components/search/searchEntityAccent";
import { TileSourceMarker } from "@/components/search/timeline/TileSourceMarker";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { nameTimelineCopy } from "@/lib/i18n/copy/nameTimeline";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import {
  africanRegionsOf,
  elsewhereAnchorFor,
} from "@/lib/search/elsewhereAnchors";
import {
  buildNameTimeline,
  splitNamedText,
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
  language: Language;
}

const REGIMES: readonly TimelineRegime[] = ["modern", "colonial", "polity"];

/** A sentence with the names it cites set in italics. */
function NamedText({ text, forms }: { text: string; forms: string[] }) {
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
  language,
}: NameTimelineProps) {
  const copy = nameTimelineCopy[language];
  const leadCopy = searchFeedCopy[language].searchedLead;
  const timeline = buildNameTimeline(history, searched);
  const [shown, setShown] = useState(0);
  const [elsewhere, setElsewhere] = useState(false);
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
        <NamedText text={account.statement} forms={forms} />{" "}
        <TileSourceMarker
          statement={account.statement}
          sources={account.sources}
          anchorId={anchorIdOf(key)}
          language={language}
        />
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
        {timeline.selfLead && selfLine && selfIndex >= 0 ? (
          <button
            type="button"
            className={cn("afh-name-timeline-lead", CHARTER_FOCUS_RING)}
            onClick={() => setShown(selfIndex)}
          >
            <span>
              <NamedText
                text={`${leadCopy.searched(timeline.selfLead.searched)} ${selfLine(timeline.selfLead.self)}`}
                forms={forms}
              />
            </span>
            <span className="afh-name-timeline-lead-go" aria-hidden="true">
              {copy.seeSelfName}
            </span>
          </button>
        ) : null}
      </div>

      <div
        role="group"
        aria-label={copy.namesLabel(timeline.names[0].nameText)}
        className="afh-name-timeline-names"
      >
        {timeline.names.map((candidate, index) => (
          <button
            key={candidate.nameText}
            type="button"
            aria-pressed={index === shown}
            onClick={() => setShown(index)}
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
        {name.tiles.map((tile) => {
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
                  <p className="afh-name-timeline-period">{tile.periodLabel}</p>
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
                      <div key={index} className="afh-name-timeline-hypothesis">
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
                        text={copy.elsewhereLead[tile.placement](name.nameText)}
                        forms={forms}
                      />{" "}
                      {anchor.sentence}{" "}
                      <TileSourceMarker
                        statement={anchor.sentence}
                        sources={anchor.sources}
                        anchorId={anchorIdOf(`${tile.key}-elsewhere`)}
                        language={language}
                      />
                    </p>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="afh-name-timeline-end">{copy.end(name.nameText)}</p>
    </section>
  );
}
