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
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() =>
        setClientChromeReady(true)
      );
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
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
