"use client";

import type { FlagFormTarget } from "@/components/flags/FlagForm";
import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedContributionAction } from "@/components/search/feed/SearchFeedContributionAction";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import type { Language } from "@/types/shared";

export interface FeedSilence {
  title: string;
  detail: string;
}

export interface OwedBlockProps {
  language?: Language;
  thin?: boolean;
  silences?: FeedSilence[];
  conviction: { title: string; body: string };
  invitation: { title: string; body: string; action: string };
  contributionTarget: FlagFormTarget;
}

// @req REQ-180
export function OwedBlock({
  language = "fr",
  thin = false,
  silences = [],
  conviction,
  invitation,
  contributionTarget,
}: OwedBlockProps) {
  const hasSilences = silences.length > 0;
  const usesTwoColumns = hasSilences && !thin;
  const copy = nameAnswerCopy[language];

  return (
    <SearchFeedBlock id="owed" zone="closing">
      <div
        className={
          usesTwoColumns
            ? "grid gap-afh-5xl min-[1200px]:grid-cols-2 min-[1200px]:gap-afh-6xl"
            : "grid gap-afh-2xl"
        }
      >
        {hasSilences ? (
          <div data-feed-part="silences">
            <SearchFeedSectionHeading
              title={copy.silences}
              subtitle={copy.silencesLead}
            />
            <ul className="mt-afh-lg space-y-afh-lg">
              {silences.map((silence) => (
                <li
                  key={silence.title}
                  className="rounded-afh-lg border border-dashed border-afh-border p-afh-2xl"
                >
                  <p className="text-afh-small font-bold text-afh-text-soft">
                    {silence.title}
                  </p>
                  <p className="mt-afh-xs text-afh-caption text-afh-text-soft">
                    {silence.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={hasSilences ? "space-y-afh-2xl" : "contents"}>
          <div
            data-feed-part="conviction"
            className="rounded-afh-lg bg-afh-bg-warm p-afh-2xl"
          >
            <p className="text-afh-small font-bold text-afh-text">
              {conviction.title}
            </p>
            <p className="mt-afh-xs text-afh-small text-afh-text">
              {conviction.body}
            </p>
          </div>
          <div
            data-feed-part="invitation"
            className="rounded-afh-lg border border-[color:var(--accent)] bg-afh-surface p-afh-2xl"
          >
            <p className="text-afh-small font-bold text-afh-text">
              {invitation.title}
            </p>
            <p className="mt-afh-xs text-afh-small text-afh-text">
              {invitation.body}
            </p>
            <SearchFeedContributionAction
              language={language}
              target={contributionTarget}
              label={invitation.action}
              preferredKind={
                contributionTarget.type === "search-query"
                  ? "contribution"
                  : "correction-proposal"
              }
              variant="outline"
              className="mt-afh-lg min-h-11 border-[color:var(--accent)] bg-[color:var(--accent-tint)] text-[color:var(--accent-foreground)] hover:bg-[color:var(--accent-tint)] hover:text-[color:var(--accent-foreground)] hover:brightness-95"
            />
          </div>
        </div>
      </div>
    </SearchFeedBlock>
  );
}
