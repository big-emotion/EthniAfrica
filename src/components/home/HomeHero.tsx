import { PRODUCT_NAME } from "@/lib/brand";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";
import type { SeedWords } from "@/lib/home/seedWords";
import type { Language } from "@/types/shared";

import { HomeHeroSearch } from "./HomeHeroSearch";

/** One per page, so a fixed id is safe and needs no client-side `useId`. */
const DESCRIPTION_ID = "home-hero-description";

/** The compact opening: one question, search and four renewable examples. */
export interface HomeHeroProps {
  language: Language;
  seedWords?: SeedWords;
}

// @req REQ-044
// @req REQ-115
export function HomeHero({ language, seedWords }: HomeHeroProps) {
  const copy = homeHeroCopy[language];

  return (
    <section
      // Landmark label dropped during the light-parchment swap (ETNI-820,
      // 6ae60726) — restored here (ETNI-822) because e2e/home-visual.spec.ts
      // resolves the hero's crop origin via this exact locator.
      aria-label={PRODUCT_NAME}
      className="home-hero"
    >
      {/* The shell keeps every hero item on the page's shared content edge. */}
      <div className="afh-shell home-hero-inner">
        <header className="home-hero-copy afh-phone-centred">
          {/* One string inside an expression, never bare JSX text: SWC drops
              the space between an expression and the text that follows it on
              the same line — the bug that shipped « EthniAfricapublie » and
              which no test in this repo reproduces. Inside a string literal no
              whitespace rule applies.

              And no aria-label. The heading used to show one class that turned
              every few seconds while its accessible name listed all five — a
              landmark whose name was a different sentence from its text. */}
          <h1>{copy.question}</h1>
          {/* What the field accepts, in the reader's words, and the field's
              accessible description. A paragraph and not an h2: it is the
              title's standfirst, which typography charter §3 keeps out of the
              outline. The same string-in-one-expression rule as the title. */}
          <p
            id={DESCRIPTION_ID}
            className="home-hero-description"
            data-testid="home-hero-description"
          >
            {copy.description}
          </p>

          <HomeHeroSearch
            language={language}
            describedBy={DESCRIPTION_ID}
            seedWords={seedWords}
          />
        </header>
      </div>

      <div className="home-hero-seam" aria-hidden="true" />

      <style>{`
        /* overflow-x, and clip rather than hidden. The band needs the 100vw
           bleed bounded, but overflow:hidden bound both axes and so trapped
           the search panel that opens under the field — which is why that
           panel used to sit in the flow and push the page down. Unlike
           hidden, clip does not force the other axis to a scroll container,
           so overflow-y stays genuinely visible. */
        .home-hero {
          position: relative;
          overflow-x: clip;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          background: var(--afh-bg);
          color: var(--afh-text);
        }

        .home-hero-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-template-areas: "copy";
          gap: 32px;
          padding-block: 24px 28px;
        }

        .home-hero-copy {
          grid-area: copy;
          min-width: 0;
          max-width: 780px;
          margin: 0 auto;
          text-align: center;
        }
        /* The headline is six short words of plain text, which is exactly
           the case balance is for. */
        .home-hero-copy h1 {
          font-family: var(--afh-font-display);
          font-weight: 900;
          /* The scale's hero step, not the home's own clamp: that one was
             written in px, which ignores the reader's font-size setting
             (typography charter §2), and topped out at 56px, above the
             scale's ceiling. */
          font-size: var(--afh-text-hero);
          line-height: var(--afh-leading-hero);
          margin: 0 0 var(--afh-space-lg);
          color: var(--afh-text);
          text-wrap: balance;
        }

        /* A class, not \`.home-hero-copy p\`: a descendant selector outranks
           a single class, so an element rule would silently override
           whatever the description sets for itself.

           Reading size and full ink, because this is the band's prose. At
           the retired lede's smaller, softer grey it would read as a caption
           under the headline rather than as its answer. */
        .home-hero-description {
          margin: 0 auto;
          max-width: 52ch;
          font-size: var(--afh-text-body);
          line-height: var(--afh-leading-body);
          color: var(--afh-text);
        }

        /* Taller on the phone than the desktop's original 26px: it is the
           one thing that tells a reader the hero has ended and the next
           section has begun, and at 430px the two used to abut close enough
           to read as one band. */
        .home-hero-seam {
          height: 44px;
          background: var(--afh-bg);
          border-bottom: 1px solid var(--afh-cat-ocre);
        }

        @media (min-width: 768px) {
          .home-hero-inner {
            padding-block: 32px 36px;
          }
          .home-hero-seam {
            height: 26px;
          }
        }

      `}</style>
    </section>
  );
}
