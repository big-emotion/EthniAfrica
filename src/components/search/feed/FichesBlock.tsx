import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import type { FeedMovementZone } from "@/components/search/feed/feedBlockTypes";
import { searchFeedCopy } from "@/lib/i18n/copy/searchFeed";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

interface FeedFicheItemBase {
  kind: string;
  name: string;
  /** The card's third line. Absent, the card shows its eyebrow and name only. */
  meta?: string;
  /** In the grouped lens: the fiche answers to the searched name. */
  onName?: boolean;
}

export type FeedFicheItem = FeedFicheItemBase &
  (
    | { href: string; onNavigate?: () => void; links?: never }
    | {
        href?: never;
        onNavigate?: never;
        links: Array<{
          name: string;
          href: string;
          onNavigate?: () => void;
        }>;
      }
  );

export interface FichesBlockProps {
  items: FeedFicheItem[];
  reviewed?: boolean;
  title?: string;
  subtitle?: string;
  zone?: FeedMovementZone;
  language?: Language;
  /**
   * The « Fiches » lens (brief 12) instead of the « Tout » shelf: no shelf
   * heading, under the lens's own title. `grouped` sets the fiches that answer
   * to the searched name apart from the ones around it; `ungrouped` is a
   * relation browse, where no name was searched.
   */
  lens?: "grouped" | "ungrouped";
  /**
   * The spelling a misspelling's search was for, when these are the other
   * fiches it found, none bearing that spelling (brief 16): titled as other
   * fiches found, under a caution that we have not established they answer
   * that spelling, each card with its own line, as the « Fiches » lens draws
   * them. It wins over `lens`: under the « Fiches » filter too, nothing ties
   * these fiches to the spelling, so they are never grouped « Autour de ce
   * nom ».
   */
  foundFor?: string;
}

// @req REQ-180
export function FichesBlock({
  items,
  reviewed = false,
  title,
  subtitle,
  zone = "primary",
  language = "fr",
  lens,
  foundFor,
}: FichesBlockProps) {
  const copy = searchFeedCopy[language];

  if (foundFor !== undefined) {
    const group = (
      <FicheGroup
        id="fiches-found"
        title={copy.answer.fichesFound.title(items.length)}
        note={copy.answer.fichesFound.note(items.length, foundFor)}
        items={items}
        reviewed={reviewed}
      />
    );
    // Under the lens title, the group keeps the gap of the lens groups below.
    return (
      <SearchFeedBlock id="fiches" zone={zone}>
        {lens ? <div className="mt-afh-md">{group}</div> : group}
      </SearchFeedBlock>
    );
  }

  if (lens) {
    const onName = items.filter((item) => item.onName);
    const around = items.filter((item) => !item.onName);
    return (
      <SearchFeedBlock id="fiches" zone={zone}>
        {lens === "ungrouped" ? (
          <FicheGrid items={items} reviewed={reviewed} lens />
        ) : (
          <div className="mt-afh-md flex flex-col gap-afh-5xl">
            {onName.length > 0 ? (
              <FicheGroup
                id="fiches-lens-on-name"
                title={copy.lens.onName(onName.length)}
                items={onName}
                reviewed={reviewed}
              />
            ) : null}
            {around.length > 0 ? (
              <FicheGroup
                id="fiches-lens-around"
                title={copy.lens.around(around.length)}
                note={copy.lens.aroundNote}
                items={around}
                reviewed={reviewed}
              />
            ) : null}
          </div>
        )}
      </SearchFeedBlock>
    );
  }

  return (
    <SearchFeedBlock id="fiches" zone={zone}>
      <SearchFeedSectionHeading
        title={title ?? copy.shelves.fiches}
        subtitle={subtitle ?? copy.labels.fichesSubtitle}
      />
      <FicheGrid items={items} reviewed={reviewed} />
    </SearchFeedBlock>
  );
}

/** The heading and note of the grouped Shorts lens, over a grid of fiches. */
function FicheGroup({
  id,
  title,
  note,
  items,
  reviewed,
}: {
  id: string;
  title: string;
  note?: string;
  items: FeedFicheItem[];
  reviewed: boolean;
}) {
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2
        id={id}
        className="m-0 font-afh text-afh-small font-bold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)]"
      >
        {title}
      </h2>
      {note ? (
        <p className="mt-afh-xs text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {note}
        </p>
      ) : null}
      <FicheGrid items={items} reviewed={reviewed} lens />
    </section>
  );
}

function shelfColumns(count: number): string {
  return count <= 1
    ? "grid-cols-1 min-[1200px]:grid-cols-1"
    : count === 2
      ? "grid-cols-1 min-[430px]:grid-cols-2 min-[1200px]:grid-cols-2"
      : count === 3
        ? "grid-cols-1 min-[430px]:grid-cols-2 min-[1200px]:grid-cols-3"
        : "grid-cols-1 min-[430px]:grid-cols-2 min-[1200px]:grid-cols-4";
}

// A lens card carries its fiche's own line, too long for half of a 382 px
// phone column: one column below 768 px (brief 12, ea-live.css). The tablet
// prefix of this repo starts at 720 px, hence the explicit 768.
function lensColumns(count: number): string {
  return count <= 1
    ? "grid-cols-1"
    : count === 2
      ? "grid-cols-1 min-[768px]:grid-cols-2"
      : count === 3
        ? "grid-cols-1 min-[768px]:grid-cols-2 min-[1200px]:grid-cols-3"
        : "grid-cols-1 min-[768px]:grid-cols-2 min-[1200px]:grid-cols-4";
}

function FicheGrid({
  items,
  reviewed,
  lens = false,
}: {
  items: FeedFicheItem[];
  reviewed: boolean;
  lens?: boolean;
}) {
  const columns = lens ? lensColumns(items.length) : shelfColumns(items.length);
  return (
    <ul className={`mt-afh-lg grid list-none gap-afh-lg ${columns}`}>
      {items.map((item) => {
        const content = (
          <>
            <span
              className={`text-afh-eyebrow font-semibold uppercase leading-[var(--afh-leading-eyebrow)] text-afh-text-soft ${reviewed ? "tracking-[0.14em]" : "tracking-[var(--afh-eyebrow-tracking)]"}`}
            >
              {item.kind}
            </span>
            <span
              className={cn(
                "font-afh-display text-afh-body font-bold leading-[1.3]",
                lens && "[overflow-wrap:anywhere]"
              )}
            >
              {item.name}
            </span>
            {item.meta ? (
              <span className="text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft">
                {item.meta}
              </span>
            ) : null}
          </>
        );
        const className = `flex min-h-11 h-full flex-col justify-center gap-afh-xs rounded-afh-lg border border-afh-border bg-afh-surface px-afh-2xl py-afh-lg text-afh-text no-underline ${CHARTER_FOCUS_RING}`;
        const key =
          item.href ??
          item.links?.map(({ href }) => href).join("|") ??
          item.name;

        return (
          <li key={key}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={item.onNavigate}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <article data-testid="feed-people-group" className={className}>
                {content}
                <ul
                  className="mt-afh-sm flex list-none flex-wrap gap-afh-sm"
                  aria-label={`Fiches de ${item.name}`}
                >
                  {item.links?.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={link.onNavigate}
                        className={cn(
                          `inline-flex min-h-11 items-center rounded-afh-full border border-afh-border px-afh-lg text-afh-caption font-semibold ${CHARTER_FOCUS_RING}`,
                          lens && "leading-[var(--afh-leading-caption)]"
                        )}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            )}
          </li>
        );
      })}
    </ul>
  );
}
