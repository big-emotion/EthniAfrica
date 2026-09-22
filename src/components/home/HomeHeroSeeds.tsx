import { useId } from "react";

import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";
import type { Language } from "@/types/shared";

export interface HomeHeroSeedsProps {
  language: Language;
  onPick: (word: string) => void;
}

/**
 * Three example queries under the home's search field, and they hold still.
 *
 * They used to be slot reels turning through words drawn from the corpus per
 * request. That taught breadth, and it cost a target that moved under the
 * reader's pointer, a stop gesture owed under WCAG 2.2.2, and an accessible
 * name that changed while a screen reader read it. The operator retired the
 * motion on 2026-09-22: the same three words as the placeholder, from copy,
 * so what the field suggests and what the chips run are one example set.
 *
 * Buttons that push the search page rather than links: a chip runs the query
 * the way typing the word and submitting would, which is the router push the
 * field's own form already falls back to.
 */
// @req REQ-002
export function HomeHeroSeeds({ language, onPick }: HomeHeroSeedsProps) {
  const copy = homeHeroCopy[language];
  const introId = useId();

  return (
    <div className="home-hero-seeds">
      <span id={introId} className="home-hero-seeds-intro">
        {copy.seedsIntro}
      </span>
      <ul className="home-hero-search-seeds" aria-labelledby={introId}>
        {copy.seeds.map((word) => (
          <li key={word}>
            <button type="button" onClick={() => onPick(word)}>
              {word}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
