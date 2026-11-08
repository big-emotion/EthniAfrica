import Link from "next/link";
import { StateMedallion } from "@/components/ui/StateMedallion";
import { FALLBACK_LOCALE } from "@/lib/locale";
import { getLocalizedRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";
import { systemStatesCopy } from "@/lib/i18n/copy/systemStates";

interface EmptyStateProps {
  message: string;
  variant?: "default" | "search" | "failure";
  /** Only the search variant links out; a caller without a locale gets the site default. */
  lang?: Language;
  retryHref?: string;
  retryLabel?: string;
  children?: React.ReactNode;
}

// @req REQ-099 @req REQ-107
export function EmptyState({
  message,
  variant,
  lang = FALLBACK_LOCALE,
  retryHref,
  retryLabel,
  children,
}: EmptyStateProps) {
  const copy = systemStatesCopy[lang].empty;
  return (
    <div className="flex flex-col items-center justify-center min-h-[16rem] gap-4 px-6 py-10 bg-afh-bg-warm text-afh-text-soft text-center rounded-md">
      <StateMedallion />

      <p data-testid="state-copy" className="text-afh-small max-w-sm">
        {message}
      </p>

      {variant === "search" && (
        <div className="flex flex-col gap-2 text-afh-small text-afh-text-soft">
          <p>{copy.searchHint}</p>
          <Link
            href={getLocalizedRoute(lang, "families")}
            data-cta="primary"
            className="underline underline-offset-2 hover:text-afh-text transition-colors"
          >
            {copy.browseFamilies}
          </Link>
        </div>
      )}

      {variant === "failure" && retryHref && (
        <Link
          href={retryHref}
          data-testid="retry"
          data-cta="retry"
          className="underline underline-offset-2 hover:text-afh-text transition-colors"
        >
          {retryLabel ?? copy.retry}
        </Link>
      )}

      {children}
    </div>
  );
}
