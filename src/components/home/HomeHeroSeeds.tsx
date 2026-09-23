"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { FALLBACK_SEED_WORDS, type SeedWords } from "@/lib/home/seedWords";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";
import type { Language } from "@/types/shared";

export interface HomeHeroSeedsProps {
  language: Language;
  onPick: (word: string) => void;
  words?: SeedWords;
}

// The server shuffles each pool on every visit. Renewal is reader-controlled:
// a chip remains a stable target while pointing, typing or using a screen reader.
// @req REQ-002
export function HomeHeroSeeds({
  language,
  onPick,
  words = FALLBACK_SEED_WORDS[language],
}: HomeHeroSeedsProps) {
  const copy = homeHeroCopy[language];
  const introId = useId();
  const [turn, setTurn] = useState(0);
  const examples = Object.values(words).flatMap((pool) =>
    pool.length ? [pool[turn % pool.length]] : []
  );
  return (
    <div className="home-hero-seeds">
      <span id={introId} className="home-hero-seeds-intro">
        {copy.seedsIntro}
      </span>
      <ul className="home-hero-search-seeds" aria-labelledby={introId}>
        {examples.map((word, index) => (
          <li key={index}>
            <button type="button" onClick={() => onPick(word)}>
              {word}
            </button>
          </li>
        ))}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        className="home-hero-seeds-refresh"
        onClick={() => setTurn((current) => current + 1)}
      >
        {copy.refreshSeeds}
      </Button>
    </div>
  );
}
