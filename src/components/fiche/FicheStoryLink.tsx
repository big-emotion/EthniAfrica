"use client";

import { ActionLink } from "@/components/ui/ActionLink";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { ficheNameStoryCopy } from "@/lib/i18n/copy/ficheNameStory";
import type { NameStoryLink } from "@/lib/search/nameClosing";
import type { FicheEntityType } from "@/types/fiche";
import type { Language } from "@/types/shared";

export interface FicheStoryLinkProps {
  /**
   * The name to follow and its href, as `nameStoryLink` decides them on the
   * server: the history's first name, only when the result page answers the
   * fiche under it, and the name's address when it has one. Two strings and
   * not the history, so the client payload carries no account.
   */
  story: NameStoryLink | null | undefined;
  /** The kind of fiche the reader leaves, recorded with the click. */
  from: FicheEntityType | "place";
  language: Language;
  familyName?: boolean;
  /** Override the generic wording on fiches with an approved local label. */
  copyOverride?: { linkLabel: string; hint: string };
}

/**
 * The fiche's way to the story of its own name (brief 10 §1, `Main`
 * « lien vers l'histoire du nom »).
 *
 * It names the history's first name, the one the fiche's h1 carries, spelt as
 * the history spells it: Kihavu under an h1 that reads Havu, Mandé and not the
 * self-name Manden, which the result page then leads to (doctrine §1.1).
 *
 * Without a story it renders nothing, not an empty slot: the page the link
 * would open tells no timeline for this fiche. A client component for one
 * reason, as `FicheOnward` is: the click is the only measure of whether the
 * link earns its place before anyone moves it higher (approval record item 6).
 */
// @req REQ-198
// @req REQ-046
export function FicheStoryLink({
  story,
  from,
  language,
  familyName = false,
  copyOverride,
}: FicheStoryLinkProps) {
  if (!story) return null;

  const copy = ficheNameStoryCopy[language];

  return (
    <div className="ea-story">
      <ActionLink
        className="ea-story-link"
        href={story.href}
        onClick={() =>
          trackEvent("fiche:related_click", { from, to: "name_story" })
        }
      >
        {copyOverride?.linkLabel ??
          (familyName
            ? copy.familyNameStoryLink(story.name)
            : copy.storyLink(story.name))}
      </ActionLink>
      <p className="ea-story-hint">
        {copyOverride?.hint ??
          (familyName ? copy.familyNameStoryHint : copy.storyLinkHint)}
      </p>
    </div>
  );
}
