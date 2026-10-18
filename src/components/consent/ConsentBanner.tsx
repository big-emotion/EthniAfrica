"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useConsent } from "@/hooks/use-consent";
import { Switch } from "@/components/ui/switch";
import { FALLBACK_LOCALE, isLocale } from "@/lib/locale";
import { getStaticPageRoute } from "@/lib/routing";
import { getTranslation } from "@/lib/translations";
import type { ConsentPreferences } from "@/types/consent";

const PANEL_ID = "consent-preferences-panel";

// The strip as drawn on the `Main` board (brief 12 part C). It runs full
// width, so the board's container steps at 768 and 1200 px are viewport
// steps here: `md` is 768 px in this Tailwind config, and 1200 has no name.
// It is written `min-[75rem]` (1200 px), not `min-[1200px]`: Tailwind sorts a
// px step before the rem-based `md`, and `md:px-afh-5xl` then won at 1200.

// « Refuser », « Accepter » and « Enregistrer mes préférences » share one
// style, one ink, one weight: refusing is drawn exactly as easy as accepting.
const ANSWER_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-afh-lg border border-afh-text bg-transparent px-afh-2xl py-afh-md text-center text-afh-small font-semibold leading-[1.4] text-afh-text focus-visible:outline-none focus-visible:shadow-afh-focus md:px-afh-5xl";

// Drawn like the footer's legal links, where « Gestion des cookies » is
// already a button among links.
const QUIET_CLASS =
  "inline-flex min-h-11 items-center text-afh-small font-semibold leading-[1.4] text-afh-text-soft underline decoration-[color-mix(in_srgb,var(--afh-text-soft)_40%,transparent)] underline-offset-4 focus-visible:outline-none focus-visible:shadow-afh-focus";

const SWITCH_LABEL_CLASS =
  "text-afh-small font-semibold leading-[var(--afh-leading-small)] text-afh-text";
const SWITCH_DESCRIPTION_CLASS =
  "text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft";

// @req REQ-046
export function ConsentBanner() {
  const { showBanner, acceptAll, rejectAll, updatePreferences, consentState } =
    useConsent();
  // Mounted from the root providers, above the `[lang]` segment, so the
  // locale comes off the route params rather than a prop; outside the locale
  // tree there are none, and the policy is offered in the default locale.
  const { lang } = useParams<{ lang?: string }>() ?? {};
  const language = isLocale(lang) ? lang : FALLBACK_LOCALE;
  const copy = getTranslation(language).consent;
  const [showCustomize, setShowCustomize] = useState(false);
  // Track local overrides for preferences - null means use consentState
  const [localAnalytics, setLocalAnalytics] = useState<boolean | null>(null);
  const [localEmbeds, setLocalEmbeds] = useState<boolean | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Derive preferences from consent state with local overrides. `functional`
  // is carried through untouched: the banner no longer offers it, because the
  // only thing it ever controlled was a Sentry user context and no Sentry runs.
  const preferences: ConsentPreferences = useMemo(
    () => ({
      essential: true,
      analytics: localAnalytics ?? consentState.preferences.analytics,
      functional: consentState.preferences.functional,
      embeds: localEmbeds ?? consentState.preferences.embeds,
    }),
    [
      localAnalytics,
      localEmbeds,
      consentState.preferences.embeds,
      consentState.preferences.analytics,
      consentState.preferences.functional,
    ]
  );

  // Remember the element that had focus before the banner appeared so we can
  // restore it when the banner is dismissed (WCAG 2.1 success criterion 2.4.3).
  const triggerElementRef = useRef<Element | null>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!showBanner || !bannerRef.current) return;

    // Capture the element that currently has focus so we can restore it later.
    triggerElementRef.current = document.activeElement;

    const banner = bannerRef.current;

    // The strip itself takes the focus: a focused answer is the one a key
    // press gives, and neither answer may be the easier one (REQ-088).
    banner.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        rejectAll();
        // Restore focus to the element that was focused before the banner opened.
        if (
          triggerElementRef.current instanceof HTMLElement ||
          triggerElementRef.current instanceof SVGElement
        ) {
          triggerElementRef.current.focus();
        }
        return;
      }

      // Focus trap
      if (event.key === "Tab" && bannerRef.current) {
        const focusableElements =
          bannerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        // On arrival the strip holds the focus, so Shift+Tab from the strip
        // itself wraps as it does from the first control.
        const atStart =
          document.activeElement === firstElement ||
          document.activeElement === bannerRef.current;

        if (event.shiftKey && atStart) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Attach to the banner element so the listener fires on the same node the
    // test fires events on, and is automatically scoped to the dialog.
    banner.addEventListener("keydown", handleKeyDown);
    return () => banner.removeEventListener("keydown", handleKeyDown);
  }, [showBanner, rejectAll]);

  const handleToggleEmbeds = useCallback((checked: boolean) => {
    setLocalEmbeds(checked);
  }, []);

  const handleSavePreferences = useCallback(() => {
    updatePreferences(preferences);
  }, [preferences, updatePreferences]);

  const handleToggleAnalytics = useCallback((checked: boolean) => {
    setLocalAnalytics(checked);
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-label={copy.title}
      tabIndex={-1}
      // No visible title and no shadow. `text-left` opts out of the phone's
      // centred body text: the board sets the strip ragged left. The open
      // panel is the one tall state; past the screen it scrolls in the strip.
      className="fixed inset-x-0 bottom-0 z-50 max-h-dvh overflow-y-auto border-t border-afh-border bg-afh-bg text-left text-afh-text focus:outline-none"
    >
      <div className="mx-auto flex max-w-[var(--afh-shell-max)] flex-col gap-afh-md p-afh-2xl md:px-afh-5xl min-[75rem]:grid min-[75rem]:grid-cols-[minmax(0,1fr)_auto] min-[75rem]:items-center min-[75rem]:gap-x-afh-6xl min-[75rem]:gap-y-0 min-[75rem]:px-afh-6xl">
        <p className="text-afh-small leading-[var(--afh-leading-small)] text-afh-text-soft min-[75rem]:col-start-1 min-[75rem]:row-start-2">
          {copy.strip}
        </p>

        {/* « Personnaliser » open: the panel opens above the answers. From
            1200 px it takes a row of its own above the paragraph, and closed
            that row is empty. */}
        {showCustomize && (
          <div
            id={PANEL_ID}
            className="flex flex-col gap-afh-lg rounded-afh-lg border border-afh-border bg-afh-surface p-afh-2xl min-[75rem]:col-start-1 min-[75rem]:row-start-1 min-[75rem]:mb-afh-2xl"
          >
            <p className="text-afh-small leading-[var(--afh-leading-small)] text-afh-text-soft md:max-w-[var(--afh-measure-prose)]">
              {copy.description}
            </p>
            <ul className="flex flex-col gap-afh-md">
              <li className="flex items-center justify-between gap-afh-2xl">
                <span className="flex min-w-0 flex-col gap-afh-xs">
                  <label
                    htmlFor="essential-switch"
                    className={SWITCH_LABEL_CLASS}
                  >
                    {copy.essential}
                  </label>
                  <span className={SWITCH_DESCRIPTION_CLASS}>
                    {copy.essentialDescription}
                  </span>
                </span>
                <Switch
                  id="essential-switch"
                  aria-label={copy.essential}
                  checked={true}
                  disabled
                />
              </li>
              <li className="flex items-center justify-between gap-afh-2xl">
                <span className="flex min-w-0 flex-col gap-afh-xs">
                  <label
                    htmlFor="analytics-switch"
                    className={SWITCH_LABEL_CLASS}
                  >
                    {copy.analytics}
                  </label>
                  <span className={SWITCH_DESCRIPTION_CLASS}>
                    {copy.analyticsDescription}
                  </span>
                </span>
                <Switch
                  id="analytics-switch"
                  aria-label={copy.analytics}
                  checked={preferences.analytics}
                  onCheckedChange={handleToggleAnalytics}
                />
              </li>
              {/* Third-party players. Only the panel lists this, so it can be
                  withdrawn; the play click writes it on. The arrival banner
                  offers no such switch about content the reader has not reached. */}
              <li className="flex items-center justify-between gap-afh-2xl">
                <span className="flex min-w-0 flex-col gap-afh-xs">
                  <label htmlFor="embeds-switch" className={SWITCH_LABEL_CLASS}>
                    {copy.embeds}
                  </label>
                  <span className={SWITCH_DESCRIPTION_CLASS}>
                    {copy.embedsDescription}
                  </span>
                </span>
                <Switch
                  id="embeds-switch"
                  aria-label={copy.embeds}
                  checked={preferences.embeds}
                  onCheckedChange={handleToggleEmbeds}
                />
              </li>
            </ul>
            <button
              type="button"
              className={`${ANSWER_CLASS} self-stretch md:self-start`}
              onClick={handleSavePreferences}
            >
              {copy.save}
            </button>
          </div>
        )}

        {/* One order on screen and in focus at every width: the quiet pair,
            then the answers (WCAG 2.4.3, brief 12 approval record item 5).
            No reversed row, no `order`. */}
        <div className="flex flex-col gap-afh-md md:flex-row md:items-center md:justify-between md:gap-afh-2xl min-[75rem]:col-start-2 min-[75rem]:row-start-2">
          <div className="flex flex-wrap items-center gap-x-afh-5xl">
            <button
              type="button"
              className={QUIET_CLASS}
              aria-expanded={showCustomize}
              aria-controls={PANEL_ID}
              onClick={() => setShowCustomize(!showCustomize)}
            >
              {copy.customise}
            </button>
            {/* The canonical privacy document, the one the footer and the site
                tree both name. This used to point at `/fr/confidentialite`, a
                hand-written page that restated it — so the banner sent the
                reader to a copy nothing else maintained. */}
            <Link
              href={getStaticPageRoute(language, "dataPolicy")}
              className={QUIET_CLASS}
            >
              {copy.dataPolicy}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-afh-md md:flex-none">
            <button type="button" className={ANSWER_CLASS} onClick={rejectAll}>
              {copy.reject}
            </button>
            <button type="button" className={ANSWER_CLASS} onClick={acceptAll}>
              {copy.acceptAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
