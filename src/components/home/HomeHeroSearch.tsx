"use client";

import {
  UniversalSearchField,
  type NameSuggestion,
} from "@/components/search/UniversalSearchField";
import type { SeedWords } from "@/lib/home/seedWords";
import { HomeHeroSeeds } from "./HomeHeroSeeds";
import { useRouter } from "next/navigation";
import { getLocalizedRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

export interface HomeHeroSearchProps {
  language: Language;
  describedBy?: string;
  seedWords?: SeedWords;
  /** Kept as a test seam; production suggestions use /api/v2/names/suggest. */
  fetchSuggestions?: (query: string) => Promise<NameSuggestion[]>;
  onNavigate?: (href: string) => void;
}

// @req REQ-002
export function HomeHeroSearch({
  language,
  describedBy,
  seedWords,
  fetchSuggestions,
  onNavigate,
}: HomeHeroSearchProps) {
  const router = useRouter();
  const runSeed = (seed: string) => {
    const href = `${getLocalizedRoute(language, "search")}?${new URLSearchParams({ q: seed })}`;
    (onNavigate ?? router.push)(href);
  };
  return (
    <div className="home-hero-search afh-accent-ocre">
      <UniversalSearchField
        language={language}
        surface="home"
        describedBy={describedBy}
        fetchResults={fetchSuggestions}
        onNavigate={onNavigate}
      />
      <HomeHeroSeeds language={language} words={seedWords} onPick={runSeed} />
      <style jsx global>{`
        .home-hero-search {
          margin-top: 36px;
          text-align: left;
        }
        .home-hero-seeds {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 16px 0 0;
        }
        .home-hero-seeds-intro {
          color: var(--afh-text-soft);
          font-size: var(--afh-text-small);
        }
        .home-hero-search-seeds {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .home-hero-search-seeds button {
          min-height: 44px;
          padding: 0 14px;
          border: 1px solid var(--accent-tint);
          border-radius: var(--afh-radius-full);
          background: transparent;
          color: var(--accent-ink);
          font-size: var(--afh-text-small);
          cursor: pointer;
        }
        .home-hero-search-seeds button:hover {
          background: var(--accent-tint);
        }
        .home-hero-seeds-refresh {
          min-height: 44px;
          color: var(--accent-ink);
        }
        @media (min-width: 768px) {
          .home-hero-search {
            margin-top: 48px;
          }
          .home-hero-seeds,
          .home-hero-search-seeds {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
