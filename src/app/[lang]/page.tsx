import type { Metadata } from "next";
import { PageLayout } from "@/components/layout/PageLayout";
import { HomeHero } from "@/components/home/HomeHero";
import { pickDidYouKnowFacts } from "@/lib/home/didYouKnowFacts";
import { localizeDidYouKnowFact } from "@/lib/home/didYouKnowLocalization";
import { getCorpusCounts } from "@/lib/home/corpusCounts";
import { loadSeedWords } from "@/lib/home/seedWords";
import {
  drawHomeHeroVisual,
  drawHomeHeroVisualSide,
  type HomeHeroVisual,
  type HomeHeroVisualSide,
} from "@/lib/home/homeHeroVisuals";
import { getContinentPeopleCounts } from "@/api/v2/services/continentPeopleCounts";
import { OG_TITLE, OG_DESCRIPTION } from "@/lib/brand";
import { surfaceHead } from "@/lib/seo/localeAlternates";
import type { Language } from "@/types/shared";

/**
 * The home draws its hero visual, its side and — one draw in three — a sourced
 * fact on every request (REQ-115), so it must not be prerendered. The root
 * layout currently awaits connection() for the CSP nonce, but that is action
 * at a distance: stating the contract here keeps a future middleware change
 * from freezing the draw forever.
 *
 * This is the opposite failure to the one staticParamsBan.test.ts guards:
 * there a route claimed to be static and answered 500 at request time;
 * here a route that is dynamic only by inheritance would answer 200 with
 * the same visual forever.
 */
// @req REQ-115
export const dynamic = "force-dynamic";

interface HomePageProps {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ hero?: string | string[] }>;
}

// The canonical follows the locale the home was served in: the English home
// declaring `/fr` would be a duplicate-content signal against itself.
// @req REQ-044 FR95
// @req REQ-140
// @req REQ-141
export async function generateMetadata({
  params,
}: Pick<HomePageProps, "params">): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    ...surfaceHead(lang as Language, "home", (locale) => `/${locale}`),
  };
}

// @req REQ-113
// @req REQ-115
export default async function Home({ params, searchParams }: HomePageProps) {
  // Safe to narrow: the [lang] layout has already 404ed anything that is not
  // a published locale.
  const { lang } = await params;
  const language = lang as Language;

  // Drawn on the server once per request: no hydration mismatch and no visual
  // swap after the first paint. The force-dynamic contract above prevents the
  // result from being frozen into a prerendered page.
  //
  // `?hero=` pins the side as well as the kind: a browser check measuring the
  // two columns must meet the same composition on every run.
  const query = await searchParams;
  const heroParam = query?.hero;
  const pinned = heroParam === "globe" || heroParam === "mercator";
  const drawn = pinned ? ({ kind: "globe" } as const) : drawHomeHeroVisual();
  const visualSide: HomeHeroVisualSide = pinned
    ? "end"
    : drawHomeHeroVisualSide();

  // An anecdote draw that finds no officially sourced fact shows the globe
  // rather than an empty slot or a weaker claim.
  const [anecdote] = drawn.kind === "anecdote" ? pickDidYouKnowFacts(1) : [];
  const heroVisual: HomeHeroVisual =
    drawn.kind !== "anecdote"
      ? drawn
      : anecdote
        ? { kind: "anecdote", fact: localizeDidYouKnowFact(anecdote, language) }
        : { kind: "globe" };

  const [counts, peopleCountsByCountry, seedWords] = await Promise.all([
    // A failed total read is not an empty corpus. The counter component says
    // it is unavailable instead of turning an operational failure into zero.
    getCorpusCounts().catch(() => null),
    // The shared globe owns its own unavailable state: losing its country
    // signal must not take the search or the rest of the hero with it.
    heroVisual.kind === "globe"
      ? getContinentPeopleCounts().catch(() => undefined)
      : Promise.resolve(undefined),
    loadSeedWords(),
  ]);

  return (
    <PageLayout language={language} hideHeader flushTop flushBottom>
      <HomeHero
        language={language}
        seedWords={seedWords}
        peopleCountsByCountry={peopleCountsByCountry}
        counts={counts}
        visual={heroVisual}
        visualSide={visualSide}
      />
    </PageLayout>
  );
}
