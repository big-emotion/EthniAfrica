"use client";

import { ActionLink } from "@/components/ui/ActionLink";
import type { NameHistory } from "@/lib/afrik/parsers/nameHistoryParser";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { ficheNameStoryCopy } from "@/lib/i18n/copy/ficheNameStory";
import { nameStoryHref } from "@/lib/search/nameClosing";
import type { FicheEntityType } from "@/types/fiche";
import type { Language } from "@/types/shared";

export interface FicheStoryLinkProps {
  history: NameHistory | null | undefined;
  /** The kind of fiche the reader leaves, recorded with the click. */
  from: FicheEntityType;
  language: Language;
}

/**
 * The fiche's way to the story of its own name (brief 10 §1, `Main`
 * « lien vers l'histoire du nom »).
 *
 * It names the history's first name, the one the fiche's h1 carries, spelt as
 * the history spells it: Fulɓe under an h1 that reads Fulbe, Mandé and not the
 * self-name Manden, which the result page then leads to (doctrine §1.1).
 *
 * A fiche without a name history renders nothing, not an empty slot: the page
 * the link opens would have no timeline to tell. A client component for one
 * reason, as `FicheOnward` is: the click is the only measure of whether the
 * link earns its place before anyone moves it higher (approval record item 6).
 */
// @req REQ-198
// @req REQ-046
export function FicheStoryLink({
  history,
  from,
  language,
}: FicheStoryLinkProps) {
  const name = history?.names[0]?.nameText;
  if (!name) return null;

  const copy = ficheNameStoryCopy[language];

  return (
    <div className="ea-story">
      <ActionLink
        className="ea-story-link"
        href={nameStoryHref(language, name)}
        onClick={() =>
          trackEvent("fiche:related_click", { from, to: "name_story" })
        }
      >
        {copy.storyLink(name)}
      </ActionLink>
      <p className="ea-story-hint">{copy.storyLinkHint}</p>
    </div>
  );
}
