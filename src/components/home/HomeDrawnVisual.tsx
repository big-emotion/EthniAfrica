import Image from "next/image";

import { ContinentGlobeStage } from "@/components/atlas/ContinentGlobeStage";
import type { HomeHeroVisual } from "@/lib/home/homeHeroVisuals";
import type { Language } from "@/types/shared";

import { HomeHeroAnecdote } from "./HomeHeroAnecdote";

export interface HomeDrawnVisualProps {
  language: Language;
  /** Documented peoples per country, forwarded to the globe's honest field. */
  peopleCountsByCountry?: Record<string, number>;
  /** The visual drawn once by the server for this page request. */
  visual?: HomeHeroVisual;
}

/**
 * The globe, a project image or an anecdote, drawn per request by the page
 * (REQ-115), in its own section after the stories.
 *
 * It sat beside the search until 2026-09-22; the opening now gives that
 * column to the featured answer (operator ruling). The `home-hero-*` class
 * names and test ids are kept on purpose: e2e/home-globe.spec.ts and the
 * page's `?hero=` pinning address the visual by them, and what the visual is
 * did not change — only where it sits.
 *
 * No section title: what is drawn is unknown until the request, so a title
 * could not be true of every draw (brand charter §8.5). The anecdote carries
 * its own heading; the globe and the image need none.
 */
// @req REQ-115
export function HomeDrawnVisual({
  language,
  peopleCountsByCountry,
  visual = { kind: "globe" },
}: HomeDrawnVisualProps) {
  return (
    <section className="home-visual afh-shell" data-testid="home-visual">
      <div
        className={`home-hero-visual home-hero-${visual.kind}`}
        data-testid={`home-hero-${visual.kind}`}
      >
        {visual.kind === "globe" ? (
          /* Placement only: the shared stage keeps ownership of WebGL
             probing, its SVG fallback, keyboard controls and reduced-motion
             behaviour. */
          <ContinentGlobeStage
            language={language}
            peopleCountsByCountry={peopleCountsByCountry}
            presentation="hero"
            activation="explicit"
            autoRotate
          />
        ) : null}
        {visual.kind === "image" ? (
          <figure className="home-hero-figure" data-testid="home-hero-figure">
            <div className="home-hero-image-frame">
              <Image
                src={visual.image.src}
                alt={visual.image.alt}
                fill
                sizes="(min-width: 1200px) 620px, (min-width: 768px) 560px, calc(100vw - 32px)"
                style={{ objectPosition: visual.image.position }}
              />
            </div>
            <figcaption>{visual.image.credit}</figcaption>
          </figure>
        ) : null}
        {visual.kind === "anecdote" ? (
          <HomeHeroAnecdote language={language} fact={visual.fact} />
        ) : null}
      </div>

      <style>{`
        .home-visual {
          padding-block: var(--afh-space-8xl);
        }
        .home-hero-visual {
          min-width: 0;
          width: 100%;
        }

        /* Compact on a phone; the engine and interaction model are the
           shared stage's, untouched. */
        .home-hero-globe .home-globe-stage {
          min-height: 300px;
          --afh-globe-stage-height: 300px;
          max-width: 430px;
        }

        .home-hero-figure {
          width: 100%;
          max-width: 430px;
          margin: 0 auto;
        }
        .home-hero-image-frame {
          position: relative;
          overflow: hidden;
          width: 100%;
          aspect-ratio: 1;
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg);
          background: var(--afh-surface);
          box-shadow: var(--afh-elev-warm);
        }
        .home-hero-image-frame img {
          object-fit: cover;
        }
        .home-hero-figure figcaption {
          margin-top: 10px;
          font-size: var(--afh-text-caption);
          line-height: var(--afh-leading-caption);
          color: var(--afh-text-soft);
        }

        @media (min-width: 768px) {
          .home-visual {
            padding-block: var(--afh-space-9xl);
          }
          .home-hero-globe .home-globe-stage {
            min-height: 380px;
            --afh-globe-stage-height: 380px;
            max-width: 560px;
          }
          .home-hero-figure {
            max-width: 560px;
          }
        }

        @media (min-width: 1200px) {
          .home-hero-globe .home-globe-stage {
            min-height: 460px;
            --afh-globe-stage-height: 460px;
            max-width: 620px;
          }
          .home-hero-figure {
            max-width: 620px;
          }
        }
      `}</style>
    </section>
  );
}
