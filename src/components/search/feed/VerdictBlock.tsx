import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface VerdictBlockProps {
  name: string;
  verdict: string;
  summary?: string;
  kind?: string;
  eyebrow?: string;
  language?: Language;
  tone?: "answer" | "plain";
  className?: string;
}

/** The answer movement: searched name first, then a one-sentence verdict. */
// @req REQ-180
export function VerdictBlock({
  name,
  verdict,
  summary,
  kind,
  eyebrow,
  language = "fr",
  tone = "answer",
  className,
}: VerdictBlockProps) {
  return (
    <SearchFeedBlock
      id="verdict"
      zone="first"
      className={cn("pt-afh-2xl min-[1200px]:pt-0", className)}
    >
      <p
        data-testid="verdict-eyebrow"
        className="text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] tracking-[var(--afh-eyebrow-tracking)] text-[color:var(--accent-ink)]"
      >
        {eyebrow ?? nameAnswerCopy[language].eyebrow}
        {kind ? <span className="text-afh-text-soft"> · {kind}</span> : null}
      </p>
      <h1 className="mt-afh-xs font-afh-display text-afh-hero font-black leading-[var(--afh-leading-hero)] text-afh-text min-[1200px]:mt-afh-md">
        {name}
      </h1>
      {tone === "answer" ? (
        <div
          data-verdict-panel=""
          className="afh-accent-terre mt-afh-md rounded-r-afh-lg border-l-[length:calc(var(--afh-space-xs)-var(--afh-space-px))] border-l-[var(--accent-ink)] bg-[var(--accent-tint)] px-afh-2xl py-afh-lg text-[color:var(--accent-foreground)] min-[1200px]:mt-afh-lg min-[1200px]:border-l-[length:var(--afh-space-xs)] min-[1200px]:px-afh-5xl min-[1200px]:py-afh-2xl"
        >
          <p className="text-afh-small font-bold leading-[var(--afh-leading-small)]">
            <InlineMarkup text={verdict} />
          </p>
          {summary ? (
            <p className="mt-afh-xs line-clamp-2 text-afh-caption leading-[var(--afh-leading-caption)] min-[1200px]:text-afh-small min-[1200px]:leading-[var(--afh-leading-small)]">
              <InlineMarkup text={summary} />
            </p>
          ) : null}
        </div>
      ) : (
        <div data-verdict-panel="" className="mt-afh-lg text-afh-text">
          <p className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)]">
            <InlineMarkup text={verdict} />
          </p>
          {summary ? (
            <p className="mt-afh-md line-clamp-2 text-afh-small leading-[var(--afh-leading-small)]">
              <InlineMarkup text={summary} />
            </p>
          ) : null}
        </div>
      )}
    </SearchFeedBlock>
  );
}
