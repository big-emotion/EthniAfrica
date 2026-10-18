import Link from "next/link";
import { useId, type ReactNode } from "react";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { cn } from "@/lib/utils";

export interface SpellingChoice {
  name: string;
  /** A new search for that name, which the reader chooses. */
  href: string;
}

export interface SpellingChoicesBlockProps {
  choices: readonly SpellingChoice[];
  title: string;
  /**
   * One line per chip that does not bear its fiche's filed name, saying
   * which fiche records the form (« La fiche Diarra donne l’écriture
   * Jara. »).
   */
  forms?: readonly string[];
  /** For a reader whose own spelling is the one searched. */
  invitation?: string;
  /**
   * Receives the invitation's id, so the action is described by the
   * sentence it answers rather than only by the heading about the lead.
   */
  action?: (describedBy: string | undefined) => ReactNode;
}

/**
 * The names a misspelling may have meant (boards search-state-typo, brief
 * 16, proposed). The choice is the page's one action, so each chip takes
 * Main's name chip in the accent and does not read as one more filter pill,
 * and the invitation under it is a note with a quiet `action`, never a second
 * accented button. The heading is the small group heading of the « Fiches »
 * lens: the verdict above it stays the strongest line under the name. A chip
 * names the form that scored, so when that is not its fiche's filed name, a
 * line in the note's ink says which fiche records it.
 *
 * The chip's ink is the accent fill's own (`--accent-foreground`): the tint
 * stays light at night while the page's body ink turns light (1.12:1). Its
 * border is `--accent-ink`, not `--accent` as on `.ea-owed-action`: the
 * accent border is 2.94:1 on the parchment by day, and the chip sits between
 * a heading and a link in accent ink, so its outline has to hold its own.
 */
// @req REQ-125
export function SpellingChoicesBlock({
  choices,
  title,
  forms = [],
  invitation,
  action,
}: SpellingChoicesBlockProps) {
  const invitationId = useId();
  return (
    <SearchFeedBlock id="appellations" zone="first" className="pt-afh-2xl">
      <h2 className="m-0 font-afh text-afh-small font-bold leading-[var(--afh-leading-small)] text-[color:var(--accent-ink)]">
        {title}
      </h2>
      <ul
        data-testid="appellations-list"
        className="mt-afh-lg flex list-none flex-wrap gap-afh-sm"
      >
        {choices.map((choice) => (
          <li key={choice.href} className="flex">
            <Link
              href={choice.href}
              className={cn(
                "inline-flex min-h-11 items-center rounded-afh-full border border-[color:var(--accent-ink)] bg-[color:var(--accent-tint)] px-afh-lg py-afh-xs text-afh-small font-bold text-[color:var(--accent-foreground)] no-underline",
                CHARTER_FOCUS_RING
              )}
            >
              {choice.name}
            </Link>
          </li>
        ))}
      </ul>
      {forms.map((line) => (
        <p
          key={line}
          className="mt-afh-md text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft"
        >
          {line}
        </p>
      ))}
      {invitation ? (
        <p
          id={invitationId}
          className="mt-afh-2xl text-afh-caption leading-[var(--afh-leading-caption)] text-afh-text-soft"
        >
          {invitation}
        </p>
      ) : null}
      {action ? (
        <div>{action(invitation ? invitationId : undefined)}</div>
      ) : null}
    </SearchFeedBlock>
  );
}
