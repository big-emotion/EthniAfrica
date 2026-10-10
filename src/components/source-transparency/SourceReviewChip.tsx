"use client";

import * as React from "react";
import { useRouteLanguage } from "@/hooks/use-language";
import { sourceReviewChipCopy } from "@/lib/i18n/copy/sourceReviewChip";
import { formatDate } from "@/lib/languageTag";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

/**
 * SourceReviewChip — L3 component (ETNI-25)
 *
 * Named for what it shows: the sources' count and their last review. It was
 * `ConfidenceChip` until the score left reader surfaces (ETNI-2016, ETNI-2039).
 *
 * Renders a tappable typographic pill at the end of an assertion:
 *   `N références · revu YYYY-MM-DD`
 *
 * It takes no confidence score: the score is internal (REQ-194), and letting
 * it decide between the pill and the fallback link made two fiches with the
 * same sources read differently.
 *
 * - No emoji, no icon, no color alarm.
 * - 44×44 px tap target enforced directly on the button.
 * - One-shot subtle pulse on first render in a session, per-chip (honors prefers-reduced-motion).
 * - Falls back to a "voir les sources" text link when any data field is missing.
 *
 * Tokens: uses `--afh-*` (ETNI-21) with `--country-*` fallback so this PR is
 * independent. `SourceChainSheet` (ETNI-27) is intentionally NOT imported —
 * callers wire the sheet via the `onOpen` callback.
 */

const SESSION_PULSE_KEY = "afh-chip-pulsed-ids";
const KEYFRAMES_STYLE_ID = "afh-chip-keyframes";

export type SourceReviewChipVariant = "inline" | "hero" | "contested";

export type SourceReviewChipProps = {
  sourceCount: number | null;
  lastHumanAuditAt: string | null;
  variant?: SourceReviewChipVariant;
  onOpen?: () => void;
  ariaSuffix?: string;
  id?: string;
  language?: Language;
};

function toIsoShortDate(value: string): string {
  return value.slice(0, 10);
}

function toLongDate(language: Language, value: string): string {
  const isoDate = value.slice(0, 10);
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return value;
  }
  const [y, m, d] = parts;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return formatDate(language, date);
}

function readPulsedIds(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SESSION_PULSE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return new Set(parsed.filter((v) => typeof v === "string"));
    return new Set();
  } catch {
    return new Set();
  }
}

function writePulsedIds(ids: Set<string>): void {
  try {
    window.sessionStorage.setItem(
      SESSION_PULSE_KEY,
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // sessionStorage may throw in private mode — silently degrade.
  }
}

function ensureKeyframesInjected(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_STYLE_ID;
  style.textContent = `
@keyframes afhChipPulse {
  0% { box-shadow: 0 0 0 0 var(--afh-conf-pulse, rgba(184, 134, 11, 0.35)); }
  70% { box-shadow: 0 0 0 6px var(--afh-conf-pulse-fade, rgba(184, 134, 11, 0)); }
  100% { box-shadow: 0 0 0 0 var(--afh-conf-pulse-fade, rgba(184, 134, 11, 0)); }
}
.afh-chip-pulse {
  animation: afhChipPulse var(--afh-motion-pulse, 1200ms) ease-out 1;
}
@media (prefers-reduced-motion: reduce) {
  .afh-chip-pulse {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;
  document.head.appendChild(style);
}

// @req REQ-019
export function SourceReviewChip({
  sourceCount,
  lastHumanAuditAt,
  variant = "inline",
  onOpen,
  ariaSuffix,
  id,
  language: languageOverride,
}: SourceReviewChipProps) {
  // Read off the route rather than threaded: the chip sits at the end of an
  // assertion on every fiche surface, and its dozen callers have no locale
  // to hand it.
  const routeLanguage = useRouteLanguage();
  const language = languageOverride ?? routeLanguage;
  const hasAllData =
    sourceCount !== null &&
    sourceCount !== undefined &&
    lastHumanAuditAt !== null &&
    lastHumanAuditAt !== undefined &&
    lastHumanAuditAt !== "";

  const [shouldPulse, setShouldPulse] = React.useState(false);

  React.useEffect(() => {
    if (!hasAllData) return;
    if (typeof window === "undefined") return;
    ensureKeyframesInjected();
    const pulseKey = id ?? "__default__";
    const seen = readPulsedIds();
    if (!seen.has(pulseKey)) {
      setShouldPulse(true);
      seen.add(pulseKey);
      writePulsedIds(seen);
    }
  }, [hasAllData, id]);

  if (!hasAllData) {
    const sourceLink = sourceReviewChipCopy[language].viewSources;
    return (
      <span className="inline-flex items-center p-1">
        <a
          href="#sources"
          onClick={(event) => {
            if (onOpen) {
              event.preventDefault();
              onOpen();
            }
          }}
          // The chip stands on its own line rather than inside a sentence, so
          // it owes the 44px target: it measured 110×24.
          className="inline-flex min-h-11 items-center text-afh-small underline underline-offset-2 text-[color:var(--afh-text-soft,var(--country-text-soft,#7A6B5D))] hover:text-[color:var(--afh-text,var(--country-text,#2C2018))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--afh-focus,var(--country-text,#2C2018))]"
        >
          {sourceLink}
        </a>
      </span>
    );
  }

  const shortDate = toIsoShortDate(lastHumanAuditAt!);
  const longDate = toLongDate(language, lastHumanAuditAt!);
  // No score is printed: a percentage next to a claim reads as the odds that
  // it is true, and it only weighs who published the sources. « Revu »
  // is what the date means — a person last read the references — not a promise
  // that the claim was verified. The count is a count, and the sources sheet
  // says it is not corroboration (audit findings T04, T02).
  const copy = sourceReviewChipCopy[language];
  const references = copy.references(sourceCount);
  const pillText = copy.pill(references, shortDate);
  const baseAriaLabel = copy.openSources(references, longDate);
  const ariaLabel = ariaSuffix
    ? `${baseAriaLabel} ${ariaSuffix}`
    : baseAriaLabel;

  const variantClasses: Record<SourceReviewChipVariant, string> = {
    inline:
      "text-afh-caption font-medium tracking-tight text-[color:var(--afh-text-soft,var(--country-text-soft,#7A6B5D))]",
    hero: "text-afh-small font-semibold tracking-tight text-[color:var(--afh-text,var(--country-text,#2C2018))]",
    contested:
      "text-afh-caption font-medium italic underline decoration-dotted underline-offset-4 text-[color:var(--afh-text-soft,var(--country-text-soft,#7A6B5D))]",
  };

  const pillBgClasses =
    "bg-[color:var(--afh-conf-bg,var(--country-card,#FFFFFF))] border border-[color:var(--afh-border,var(--country-border,#E8DFD3))]";

  return (
    <span className="afh-chip-wrapper inline-flex items-center align-baseline">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => {
          if (onOpen) onOpen();
        }}
        className={cn(
          "inline-flex items-center justify-center p-3 min-h-[44px] min-w-[44px] rounded-full",
          "whitespace-nowrap select-none",
          "motion-safe:transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "focus-visible:ring-[color:var(--afh-focus,var(--country-text,#2C2018))]",
          pillBgClasses,
          variantClasses[variant],
          shouldPulse && "afh-chip-pulse"
        )}
        data-variant={variant}
      >
        <span className="afh-chip-text">{pillText}</span>
      </button>
    </span>
  );
}
