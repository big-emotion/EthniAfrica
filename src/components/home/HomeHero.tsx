import type { ReactNode } from "react";

import { PRODUCT_NAME } from "@/lib/brand";
import { homeHeroCopy } from "@/lib/i18n/copy/homeHero";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

import { HomeHeroSearch } from "./HomeHeroSearch";

/** One per page, so a fixed id is safe and needs no client-side `useId`. */
const DESCRIPTION_ID = "home-hero-description";

/**
 * The search-first opening band (REQ-115, ETNI-1404).
 *
 * Since 2026-09-22 it holds the question, the sentence that says what the
 * field accepts, the search and its three examples — and, when a campaign is
 * open, the featured answer. The drawn visual, the purpose statement and the
 * corpus figures moved below it, each into a section of its own (operator
 * ruling): the first screen is the one question and the one way to ask it.
 *
 * Reading order is the same at every width: copy and search, then the
 * featured answer. From 1200px the two share the band as columns; CSS never
 * changes the accessible order.
 */
export interface HomeHeroProps {
  language: Language;
  /**
   * The featured answer, resolved by the server page. Absent when no
   * campaign window is open, and the band is then one centred column.
   */
  featured?: ReactNode;
}

// @req REQ-044
// @req REQ-115
export function HomeHero({ language, featured }: HomeHeroProps) {
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
      <div
        className={cn(
          "afh-shell home-hero-inner",
          featured && "home-hero-inner--with-featured"
        )}
      >
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

          <HomeHeroSearch language={language} describedBy={DESCRIPTION_ID} />
        </header>

        {featured ? <div className="home-hero-featured">{featured}</div> : null}
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
          grid-template-areas:
            "copy"
            "featured";
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

        .home-hero-featured {
          grid-area: featured;
          min-width: 0;
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

        /* Two columns only when there is a second thing to put beside the
           search. Without a campaign the band stays one centred column: a
           flush-left copy block with nothing to its right would leave half
           the band empty. */
        @media (min-width: 1200px) {
          .home-hero-inner--with-featured {
            /* 1.15/0.85, the split the band already used beside its visual:
               the copy column keeps room for the headline on two lines, and
               the tile's 620px ceiling is a max-width, not a floor. */
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            grid-template-areas: "copy featured";
            /* Topped, never centred (operator ruling, 2026-09-14). Centred,
               the tile recentred whenever the copy column changed height —
               the search panel opening, a failure message appearing. */
            align-items: start;
            column-gap: 48px;
            padding-block: 40px;
          }
          .home-hero-inner--with-featured .home-hero-copy {
            margin: 0;
            max-width: 100%;
            text-align: left;
          }
          /* The prose block loses its auto margins with the column. A block
             that kept \`margin: auto\` would stay centred inside a left-aligned
             column — a second left edge inside one block, which §8.1 of the
             brand charter counts as a defect. */
          .home-hero-inner--with-featured .home-hero-description {
            margin-inline: 0;
          }
        }
      `}</style>
    </section>
  );
}
