"use client";

import * as React from "react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Link from "next/link";

import { FlagTarget } from "@/components/flags/FlagTarget";
import { cn } from "@/lib/utils";
import { useRouteLanguage } from "@/hooks/use-language";
import { formatDate } from "@/lib/languageTag";
import { getSourceRoute } from "@/lib/routing";
import { sourceStandingLabel } from "@/lib/glossaire/vocabularies";
import type { Language } from "@/types/shared";
import { toSourceTier, type SourceTier } from "@/types/sources";
import { sourceTransparencyCopy } from "@/lib/i18n/copy/sourceTransparency";
import type {
  SearchEvidenceAssertion,
  SearchEvidenceSource,
} from "@/lib/search/evidence";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type Source = SearchEvidenceSource;

export type Assertion = SearchEvidenceAssertion;

export type Revision = {
  url: string;
  label?: string;
};

export type PositionGroup = {
  position: string;
  sources: Source[];
};

export type SourceChainSheetProps = {
  language?: Language;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assertion: Assertion;
  /** Flat source list when the assertion has a single position. Grouped by tier in UI. */
  sources: Source[];
  /** Multi-perspective grouping per FR24. When provided, takes precedence over `sources`. */
  positions?: PositionGroup[];
  openFlagCount?: number;
  revisionUrl?: string;
  /** Anchor id for the source chip (e.g. "chip-paragraph-3"). */
  anchorId: string;
  /**
   * Cloudflare Turnstile public site key, threaded down from a Server
   * Component. Required together with `assertion.id` to enable the live
   * FlagTarget wiring — otherwise the disabled placeholder is kept.
   */
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CITE_DELAY_MS = 4000;

/**
 * Tracks anchors that have already been auto-opened by URL-hash on first mount,
 * so that mounting multiple `SourceChainSheet` instances on the same fiche
 * doesn't open every one of them when the user follows a shareable link.
 */
const openedAnchors = new Set<string>();

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Decides the responsive variant for the sheet:
 *   - "bottom"           — viewport < 1024 px
 *   - "right-narrow"     — 1024–1199 px (or tablet 720+) → 420 px wide
 *   - "right-wide"       — ≥ 1200 px → 480 px wide
 *
 * Note: the AC says 720–1199 → right 420 and < 1024 → bottom. These overlap at
 * 720–1023. The bottom-sheet rule wins because it is the stronger UX
 * constraint (small height + swipe-down). Right-side variants only kick in
 * from 1024 px upwards.
 */
function useSheetVariant(): "bottom" | "right-narrow" | "right-wide" {
  const [variant, setVariant] = React.useState<
    "bottom" | "right-narrow" | "right-wide"
  >("bottom");

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const wide = window.matchMedia("(min-width: 1200px)");
    const desktop = window.matchMedia("(min-width: 1024px)");

    const compute = () => {
      if (wide.matches) setVariant("right-wide");
      else if (desktop.matches) setVariant("right-narrow");
      else setVariant("bottom");
    };

    compute();
    wide.addEventListener?.("change", compute);
    desktop.addEventListener?.("change", compute);
    return () => {
      wide.removeEventListener?.("change", compute);
      desktop.removeEventListener?.("change", compute);
    };
  }, []);

  return variant;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

/**
 * Syncs the sheet open state with the URL hash so the anchor (#chip-...)
 * survives page refreshes and is shareable.
 */
function useUrlAnchorSync(
  open: boolean,
  anchorId: string,
  onOpenChange: (open: boolean) => void
) {
  // Read the initial hash and open the sheet if it matches.
  // Guard with a module-level registry so only the first mount per anchorId
  // triggers the auto-open — multiple sheets with the same anchor must not
  // all open at once.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHash = window.location.hash.replace(/^#/, "");
    if (currentHash === anchorId && !open && !openedAnchors.has(anchorId)) {
      openedAnchors.add(anchorId);
      onOpenChange(true);
    }
    // Intentionally run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write the hash when the sheet opens / closes.
  // Per-anchor guard: only rewrite the URL when the current hash is empty or
  // already matches this instance's anchor. Without this guard, mounting
  // multiple sheets on one fiche would strip an unrelated hash on every
  // open/close cycle.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;
    if (open) {
      if (hash === `#${anchorId}` || hash === "") {
        const target = `${pathname}${search}#${anchorId}`;
        try {
          window.history.replaceState(null, "", target);
        } catch {
          /* no-op in tests */
        }
      }
    } else if (hash === `#${anchorId}`) {
      const target = `${pathname}${search}`;
      try {
        window.history.replaceState(null, "", target);
      } catch {
        /* no-op in tests */
      }
    }
  }, [open, anchorId]);
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type SourceStanding = SourceTier | "needs_review";

function groupByTier(sources: Source[]): Record<SourceStanding, Source[]> {
  const out: Record<SourceStanding, Source[]> = {
    official: [],
    referenced: [],
    unverified: [],
    needs_review: [],
  };
  for (const s of sources) {
    // An untiered source keeps its own bucket. Everything else unrecognised
    // still reads as unverified rather than crashing on an undefined one.
    const standing: SourceStanding =
      s.tier === "needs_review" ? "needs_review" : toSourceTier(s.tier);
    out[standing].push(s);
  }
  return out;
}

/**
 * Returns the URL only if it parses to an `http:` or `https:` scheme.
 * Defends against `javascript:` or `data:` schemes coming from contributor
 * sources. Returns `null` otherwise (including for malformed URLs).
 */
// @req REQ-008
export function safeUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Formats an ISO date (YYYY-MM-DD) as a long date in the reader's locale.
 * Uses a TZ-stable parser to avoid off-by-one errors on date-only inputs.
 * Returns the raw input on parse failure.
 */
// @req REQ-008
export function formatBrokenDate(language: Language, iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return iso;
  return formatDate(language, date);
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function SourceItem({
  language,
  source,
}: {
  language: Language;
  source: Source;
}) {
  const copy = sourceTransparencyCopy[language].sourceChain;
  const isBroken = Boolean(source.brokenAt);
  const sanitizedUrl = safeUrl(source.url);
  const renderAsLink = !isBroken && sanitizedUrl !== null;

  return (
    <li
      data-testid={`source-item-${source.id}`}
      className="space-y-1 rounded-md border border-[var(--afh-border,var(--country-border,#e5e7eb))] bg-[var(--afh-surface,var(--country-surface,#fff))] p-3"
    >
      <div className="flex items-start justify-between gap-2">
        {/* min-w-0 lets a long title wrap instead of pushing the standing
            label off a 320 px sheet. */}
        <p className="min-w-0 break-words text-afh-small font-medium text-[var(--afh-fg,var(--country-fg,#111827))]">
          {/* The number the fiche's bibliography gave this source. It is the
              only place a reader sees the two numbering schemes together —
              the callout counts passages, the footer counts sources — so
              without it the footer's numbering indexes nothing followable. */}
          {source.bibliographyNumber !== undefined && (
            <span
              data-testid={`source-number-${source.id}`}
              className="mr-1 tabular-nums"
            >
              {source.bibliographyNumber}.
            </span>
          )}
          {source.title}
        </p>
        <span
          data-testid={`source-tier-${source.id}`}
          className="shrink-0 rounded-full bg-[var(--afh-muted,var(--country-muted,#f3f4f6))] px-2 py-0.5 text-afh-caption font-medium text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]"
        >
          {sourceStandingLabel(source.tier, language)}
        </span>
      </div>
      <p className="text-afh-caption text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]">
        {[source.author, source.year, source.page].filter(Boolean).join(" · ")}
      </p>
      {/* The source's own page, which outlives the fiche quoting it and says
          what else rests on it. The outward link below goes to the work; this
          one goes to what the corpus knows about it. */}
      <p>
        <Link
          href={getSourceRoute(language, source.id)}
          prefetch={false}
          data-testid={`source-directory-${source.id}`}
          className="inline-block text-afh-caption underline underline-offset-2"
        >
          {copy.viewInBibliography}
        </Link>
      </p>
      {source.url ? (
        renderAsLink ? (
          <a
            data-testid={`source-url-${source.id}`}
            href={sanitizedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block break-all text-afh-caption underline underline-offset-2 text-[var(--afh-accent,var(--country-accent,#1d4ed8))]"
          >
            {source.url}
          </a>
        ) : (
          <span
            data-testid={`source-url-${source.id}`}
            aria-disabled="true"
            className={cn(
              "inline-block break-all text-afh-caption underline underline-offset-2 text-[var(--afh-fg-muted,var(--country-fg-muted,#9ca3af))]",
              isBroken && "line-through"
            )}
          >
            {source.url}
          </span>
        )
      ) : null}
      {isBroken && source.brokenAt ? (
        <span
          data-testid={`source-broken-badge-${source.id}`}
          className="inline-flex items-center rounded-full bg-[var(--afh-warn-bg,#fef3c7)] px-2 py-0.5 text-afh-caption font-medium text-[var(--afh-warn-fg,#92400e)]"
        >
          {copy.brokenLink(formatBrokenDate(language, source.brokenAt))}
        </span>
      ) : null}
      <div data-testid={`source-flag-target-${source.id}`} className="pt-1">
        <FlagTarget
          language={language}
          target={{
            type: "source",
            id: source.id,
            snapshotQuote: source.citation,
          }}
          triggerLabel={copy.reportSource}
          className="w-auto text-afh-caption"
        />
      </div>
    </li>
  );
}

function TierGroup({
  language,
  tier,
  sources,
}: {
  language: Language;
  tier: SourceStanding;
  sources: Source[];
}) {
  if (sources.length === 0) return null;
  return (
    <div data-testid={`tier-group-${tier}`} className="space-y-2">
      <h4 className="text-afh-eyebrow font-semibold uppercase tracking-wide text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]">
        {sourceStandingLabel(tier, language)}
      </h4>
      <ul className="space-y-2">
        {sources.map((s) => (
          <SourceItem key={s.id} language={language} source={s} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Confirmed sources first, then everything else behind one sentence that says
 * why it is there (REQ-174). Nothing is filtered: a weak source is shown under
 * its own label, never dropped, because refusing it is the colonial filter
 * DEC-055 exists to remove.
 *
 * A contested assertion renders one list per position, and each carries its
 * own introduction. The sentence marks where that list stops being confirmed,
 * so a single copy hoisted above every position would either sit above
 * confirmed sources or lie far from the second position's unconfirmed ones.
 */
function SourceList({
  language,
  sources,
}: {
  language: Language;
  sources: Source[];
}) {
  const copy = sourceTransparencyCopy[language].sourceChain;
  const reviewedNarratives = sources.filter((s) => s.reviewedNarrative);
  const grouped = groupByTier(sources.filter((s) => !s.reviewedNarrative));
  const unconfirmedCount =
    grouped.unverified.length + grouped.needs_review.length;

  return (
    <div className="space-y-4">
      {/* `needs_review` closes the list rather than joining the tiers: it is
          the sources nobody has classified, and ranking them among the three
          would place a judgement where none was made. */}
      <TierGroup
        language={language}
        tier="official"
        sources={grouped.official}
      />
      <TierGroup
        language={language}
        tier="referenced"
        sources={grouped.referenced}
      />
      {reviewedNarratives.length > 0 ? (
        <div data-testid="reviewed-narratives-group" className="space-y-2">
          <h4 className="text-afh-eyebrow font-semibold uppercase tracking-wide text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]">
            {copy.reviewedNarratives}
          </h4>
          <ul className="space-y-2">
            {reviewedNarratives.map((s) => (
              <SourceItem key={s.id} language={language} source={s} />
            ))}
          </ul>
        </div>
      ) : null}
      {unconfirmedCount > 0 ? (
        <p
          data-testid="sources-unconfirmed-intro"
          className="text-afh-small text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]"
        >
          {copy.unconfirmedIntro}
        </p>
      ) : null}
      <TierGroup
        language={language}
        tier="unverified"
        sources={grouped.unverified}
      />
      <TierGroup
        language={language}
        tier="needs_review"
        sources={grouped.needs_review}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

const SourceChainSheet: React.FC<SourceChainSheetProps> = ({
  language: languageOverride,
  open,
  onOpenChange,
  assertion,
  sources,
  positions,
  openFlagCount = 0,
  revisionUrl,
  anchorId,
}) => {
  const variant = useSheetVariant();
  const reducedMotion = usePrefersReducedMotion();
  // The sheet opens from a chip on any fiche surface, from the quiz and from
  // the relations list; none of those hand it a locale, so it reads the route.
  const routeLanguage = useRouteLanguage();
  const language = languageOverride ?? routeLanguage;
  const copy = sourceTransparencyCopy[language].sourceChain;
  useUrlAnchorSync(open, anchorId, onOpenChange);

  // "Cite this assertion" appears after a 4 s dwell.
  const [showCite, setShowCite] = React.useState(false);
  React.useEffect(() => {
    if (!open) {
      setShowCite(false);
      return;
    }
    const t = setTimeout(() => setShowCite(true), CITE_DELAY_MS);
    return () => clearTimeout(t);
  }, [open]);

  const statementId = `${anchorId}-statement`;

  const side: "bottom" | "right" = variant === "bottom" ? "bottom" : "right";

  const widthClass =
    variant === "right-wide"
      ? "sm:max-w-[480px] w-[480px]"
      : variant === "right-narrow"
        ? "sm:max-w-[420px] w-[420px]"
        : "w-full max-h-[85vh] overflow-y-auto";

  const motionStyle: React.CSSProperties = reducedMotion
    ? { animationDuration: "0.01ms" }
    : {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn("flex flex-col gap-4", widthClass)}
        style={motionStyle}
        aria-labelledby={statementId}
        aria-modal="true"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-variant={variant}
      >
        {/* Visually hidden title/description for radix a11y */}
        <SheetTitle className="sr-only">{copy.title}</SheetTitle>
        <SheetDescription className="sr-only">
          {copy.description}
        </SheetDescription>

        {/* 1. Assertion */}
        <section
          data-testid="section-assertion"
          className="border-l-4 border-[var(--afh-accent,var(--country-accent,#1d4ed8))] pl-3"
        >
          <h3
            id={statementId}
            className="font-serif text-afh-small italic text-[var(--afh-fg,var(--country-fg,#111827))]"
          >
            « {assertion.statement} »
          </h3>
          {assertion.position ? (
            <p className="mt-1 text-afh-caption text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]">
              {copy.position} : {assertion.position}
            </p>
          ) : null}
        </section>

        {/* 2. Confidence */}
        <section
          data-testid="section-confidence"
          className="rounded-md bg-[var(--afh-muted,var(--country-muted,#f9fafb))] p-3"
        >
          {assertion.confidenceScore !== undefined ? (
            <div className="flex items-baseline justify-between">
              <span className="text-afh-eyebrow font-semibold uppercase tracking-wide text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]">
                {copy.confidence}
              </span>
              <span className="text-afh-h3 font-semibold text-[var(--afh-fg,var(--country-fg,#111827))]">
                {Math.round(assertion.confidenceScore * 100)}%
              </span>
            </div>
          ) : null}
          <p className="mt-1 text-afh-caption text-[var(--afh-fg-muted,var(--country-fg-muted,#6b7280))]">
            {copy.confidenceSummary(
              assertion.sourceCount,
              assertion.lastHumanAuditAt
            )}
          </p>
        </section>

        {/* 3. Flags banner (conditional) */}
        {openFlagCount > 0 ? (
          <section
            data-testid="section-flags"
            role="status"
            className="rounded-md border border-[var(--afh-warn-fg,#92400e)]/30 bg-[var(--afh-warn-bg,#fef3c7)] p-3 text-afh-small text-[var(--afh-warn-fg,#92400e)]"
          >
            {copy.openReports(openFlagCount)}
          </section>
        ) : null}

        {/* 4. Sources */}
        <section data-testid="section-sources" className="space-y-4">
          <h3 className="text-afh-small font-semibold text-[var(--afh-fg,var(--country-fg,#111827))]">
            {copy.sources}
          </h3>
          {positions && positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((pg, idx) => (
                <div
                  key={`${pg.position}-${idx}`}
                  data-testid={`position-group-${idx}`}
                  className="space-y-2 rounded-md border border-dashed border-[var(--afh-border,var(--country-border,#e5e7eb))] p-3"
                >
                  <p className="text-afh-caption font-semibold text-[var(--afh-accent,var(--country-accent,#1d4ed8))]">
                    {pg.position}
                  </p>
                  <SourceList language={language} sources={pg.sources} />
                </div>
              ))}
            </div>
          ) : (
            <SourceList language={language} sources={sources} />
          )}
        </section>

        {/* 5. Revision link (conditional) */}
        {revisionUrl && safeUrl(revisionUrl) ? (
          <section data-testid="section-revision">
            <a
              href={safeUrl(revisionUrl) as string}
              target="_blank"
              rel="noopener noreferrer"
              className="text-afh-caption underline underline-offset-2 text-[var(--afh-accent,var(--country-accent,#1d4ed8))]"
            >
              {copy.revisionHistory}
            </a>
          </section>
        ) : null}

        {/* 6. FlagTarget */}
        <section data-testid="section-flag-target" className="pt-2">
          {/* The `assertion.id` guard stays: with no assertion there is no
              target to report. Only the Turnstile half of the condition goes. */}
          {assertion.id ? (
            <FlagTarget
              language={language}
              target={{
                type: "assertion",
                id: assertion.id,
                fieldPath: assertion.fieldPath,
                snapshotQuote: assertion.statement,
              }}
              triggerLabel={copy.reportProblem}
            />
          ) : null}
        </section>

        {/* 7. Cite affordance (appears after 4 s dwell) */}
        <section data-testid="section-cite" className="pt-1">
          <button
            type="button"
            aria-hidden={!showCite}
            tabIndex={showCite ? 0 : -1}
            className={cn(
              "text-afh-caption underline underline-offset-2 transition-opacity",
              reducedMotion ? "duration-[1ms]" : "duration-300",
              showCite ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {copy.citeAssertion}
          </button>
        </section>
      </SheetContent>
    </Sheet>
  );
};

SourceChainSheet.displayName = "SourceChainSheet";

export default SourceChainSheet;
