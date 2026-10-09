"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { SourceReviewChip } from "@/components/source-transparency/SourceReviewChip";
import { SourceKindBadge } from "@/components/sources/SourceKindBadge";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { isEstimateRound, type GameRound } from "@/lib/games/gameKinds";
import { revealProvenanceFr } from "@/lib/games/revealProvenance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { gamesCopy } from "@/lib/i18n/copy/games";
import { formatNumber } from "@/lib/languageTag";
import type { Language } from "@/types/shared";

/**
 * Floor height of the panel. Exported so a caller can reserve the same space
 * under the answering state and keep the reveal from shifting the page.
 */
// @req REQ-120
export const GAME_REVEAL_MIN_HEIGHT_CLASS = "min-h-[18rem]";

export interface GameAnswerRevealProps {
  round: GameRound;
  language?: Language;
  isCorrect: boolean;
  isLastRound: boolean;
  /**
   * What the reader committed to. Only an estimate round renders it: on a
   * two-way choice the answer is already on screen as the button they
   * pressed, whereas a slider's value is gone the moment the round turns.
   */
  answer?: number | string | null;
  onNext: () => void;
  className?: string;
}

/**
 * What the reader is shown after answering (REQ-120).
 *
 * `reveal.textFr` is printed exactly as the corpus holds it: FR65/FR66 forbid
 * a paraphrase as firmly as an invented option, so there is no summarising and
 * no clamping here. `reveal.fieldPath` still records where the claim was read,
 * but the player is told so in French — see `revealProvenance` for why the
 * path itself no longer reaches the page.
 */
// @req REQ-120
export const GameAnswerReveal = ({
  round,
  language = "fr",
  isCorrect,
  isLastRound,
  answer,
  onNext,
  className,
}: GameAnswerRevealProps) => {
  const copy = gamesCopy[language];
  const reducedMotion = usePrefersReducedMotion();
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [round]);

  const VerdictIcon = isCorrect ? CheckCircle2 : XCircle;
  // `strictNullChecks` is off, so a reveal built without a source list is a
  // runtime crash the compiler will not catch — and a crash here blanks the
  // whole game rather than one line. Same reason `ficheSourceLabel` exists.
  const sources = round.reveal.sources ?? [];
  const provenance = revealProvenanceFr(round.reveal.fieldPath ?? "");
  const revealText = round.reveal.textFr;

  return (
    <div
      data-testid="game-answer-reveal"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={reducedMotion ? { transitionDuration: "0.01ms" } : undefined}
      className={cn(
        GAME_REVEAL_MIN_HEIGHT_CLASS,
        "flex flex-col gap-4 rounded-afh-lg border border-afh-border bg-afh-surface p-4 opacity-100 transition-opacity duration-afh-base",
        className
      )}
    >
      <div data-testid="game-reveal-live-region" aria-live="polite">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={cn(
            "flex items-center gap-2 font-afh-display text-afh-h2 font-black outline-none",
            isCorrect ? "text-afh-conf-high" : "text-afh-terracotta"
          )}
        >
          <VerdictIcon aria-hidden="true" className="h-6 w-6" />
          {isCorrect ? copy.correctVerdict : copy.incorrectVerdict}
        </h2>
        {/*
          The estimate round's whole subject is the distance between what the
          reader thought and what is, so the reveal states both. Printing only
          « ce n'est pas ça » would withhold the one number the round was
          asked for.
        */}
        {isEstimateRound(round) && typeof answer === "number" ? (
          <p
            data-testid="game-reveal-estimate"
            className="mt-3 text-afh-body text-afh-text-soft"
          >
            {copy.yourEstimate} {formatNumber(language, answer)} {round.unitFr}.
          </p>
        ) : null}

        <p
          data-testid="game-reveal-text"
          className="mt-3 text-afh-body text-afh-text"
        >
          {revealText}
        </p>
      </div>

      <div
        data-testid="game-reveal-provenance"
        className="flex flex-col gap-2 border-t border-afh-border pt-3 text-afh-small text-afh-text-soft"
      >
        {provenance ? (
          <p>
            {copy.provenanceLabel} {provenance}.
          </p>
        ) : null}

        {/*
          The source is named with its type, its tier is not (doctrine
          §1.1): ranking what a claim rests on is moderation's job, not the
          reader's.
        */}
        {sources.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {sources.map((source) => (
              <li
                key={`${source.label}-${source.standing}`}
                className="flex flex-wrap items-center gap-2"
              >
                <span>{source.label}</span>
                {source.kind ? (
                  <SourceKindBadge kind={source.kind} language={language} />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {round.reveal.confidence ? (
          <SourceReviewChip
            variant="inline"
            language={language}
            id={`game-reveal-${round.subjectId}`}
            sourceCount={round.reveal.confidence.sourceCount}
            lastHumanAuditAt={round.reveal.confidence.lastHumanAuditAt}
            ariaSuffix={copy.confidenceAriaSuffix}
          />
        ) : null}

        <a
          data-testid="game-reveal-fiche-link"
          href={round.reveal.ficheHref}
          className="self-start font-medium underline underline-offset-2"
        >
          {isEstimateRound(round) ? copy.openAtlas : copy.openFiche}
        </a>
      </div>

      <Button
        type="button"
        variant="accent"
        onClick={onNext}
        className="mt-auto w-full"
      >
        {isLastRound ? copy.seeScore : copy.nextRound}
      </Button>
    </div>
  );
};
