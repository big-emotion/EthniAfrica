"use client";

import dynamic from "next/dynamic";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { ConsentProvider, useConsent } from "@/hooks/use-consent";

const DeferredClientChrome = dynamic(
  () =>
    import("@/components/system/DeferredClientChrome").then(
      (mod) => mod.DeferredClientChrome
    ),
  { ssr: false }
);

const CLIENT_CHROME_FALLBACK_MS = 15_000;
const CLIENT_CHROME_INTERACTIONS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

/**
 * Enforces consent preferences on third-party integrations that have no
 * component of their own: Sentry user context is cleared when functional
 * consent is revoked. Plausible injection lives solely in
 * <PlausibleScript> (rendered in layout.tsx) — it used to be duplicated
 * here too, which fired the script twice and double-counted every pageview
 * whenever analytics consent was granted.
 *
 * Must be rendered inside <ConsentProvider>.
 */
function ConsentEnforcer() {
  const { consentState } = useConsent();
  const { functional } = consentState.preferences;

  // Sentry user context: clear when functional consent is false or not yet given.
  useEffect(() => {
    if (!functional) {
      Sentry.setUser(null);
    }
  }, [functional]);

  return null;
}

// @req REQ-115
export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  /**
   * Request nonce minted by the CSP middleware. next-themes writes an inline
   * bootstrap script so the saved surface is applied before hydration, and
   * script-src admits no 'unsafe-inline' — without this the browser drops
   * that script and the reader's night choice reverts on every load.
   * Optional because the surfaces with no CSP (tests, Storybook) have none
   * to give.
   */
  nonce?: string;
}) {
  const [clientChromeReady, setClientChromeReady] = useState(false);

  useEffect(() => {
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      window.clearTimeout(fallback);
      for (const eventName of CLIENT_CHROME_INTERACTIONS) {
        window.removeEventListener(eventName, reveal);
      }
      setClientChromeReady(true);
    };

    for (const eventName of CLIENT_CHROME_INTERACTIONS) {
      window.addEventListener(eventName, reveal, {
        once: true,
        passive: true,
      });
    }

    // Lighthouse traces showed that mounting this large dynamic island on the
    // second animation frame created a late main-thread task and repainted the
    // already-visible LCP text. Real readers get the chrome on first input;
    // quiet readers still receive the consent prompt after a bounded delay.
    const fallback = window.setTimeout(reveal, CLIENT_CHROME_FALLBACK_MS);

    return () => {
      window.clearTimeout(fallback);
      for (const eventName of CLIENT_CHROME_INTERACTIONS) {
        window.removeEventListener(eventName, reveal);
      }
    };
  }, []);

  return (
    // `class` rather than a data attribute: Tailwind's darkMode is
    // configured as ["class"], so one switch drives both the shadcn HSL
    // layer (index.css .dark) and the --afh-* aliases (color.css .dark).
    // enableSystem stays off — REQ-115 makes parchment the surface the
    // editorial copy was contrast-checked on, so night is something the
    // reader opts into rather than something an OS setting imposes.
    <ThemeProvider
      nonce={nonce}
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <ConsentProvider>
          <ConsentEnforcer />
          {children}
          {/* Mounted once for the whole site, but only after the destination
              has painted. Toasts, the consent prompt and navigation waits
              are interaction chrome; none is needed to render this request. */}
          {clientChromeReady ? <DeferredClientChrome /> : null}
        </ConsentProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
