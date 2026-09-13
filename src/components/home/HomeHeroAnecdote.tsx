import Image from "next/image";
import Link from "next/link";

import { TranslationProvenanceMarker } from "@/components/fiche/TranslationProvenanceMarker";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ActionLink } from "@/components/ui/ActionLink";
import type { DidYouKnowEntity } from "@/lib/home/didYouKnowFacts";
import { illustrationFor } from "@/lib/home/didYouKnowIllustrations";
import {
  localizeDidYouKnowIllustration,
  type LocalizedDidYouKnowFact,
} from "@/lib/home/didYouKnowLocalization";
import { DID_YOU_KNOW_ENTITY_ACCENT } from "@/lib/home/didYouKnowPresentation";
import { anecdotesCopy } from "@/lib/i18n/copy/anecdotes";
import {
  getCountryRoute,
  getFamilyRoute,
  getLocalizedRoute,
  getPeopleRoute,
} from "@/lib/routing";
import type { Language } from "@/types/shared";

export interface HomeHeroAnecdoteProps {
  language: Language;
  fact: LocalizedDidYouKnowFact;
}

function entityHref(language: Language, entity: DidYouKnowEntity): string {
  if (entity.kind === "country") return getCountryRoute(language, entity.id);
  if (entity.kind === "family") return getFamilyRoute(language, entity.id);
  return getPeopleRoute(language, entity.id);
}

/**
 * One « Saviez-vous que » anecdote, whole, in the hero's visual slot.
 *
 * It replaced the two-card band that used to follow the hero. The band gave
 * the home a second section to scroll to; this gives the anecdote a third of
 * the draw beside the question instead, alongside the globe and the archive
 * images, with no rule favouring any of the three.
 *
 * Whole rather than a teaser (operator ruling, 2026-09-13): headline, every
 * paragraph, the atlas entries it names and its source. A fact on the home
 * asserts as much as a fact on its own page and owes the same provenance.
 *
 * Filed by a kicker, never a title — brand charter §8.5: the anecdote is
 * drawn at random, so its headline is the heading and the kicker only says
 * what kind of thing it is. It carries none of AnecdoteReader's turning,
 * reaction or sharing controls; the exit leads to the page that has them.
 */
// @req REQ-115
export function HomeHeroAnecdote({ language, fact }: HomeHeroAnecdoteProps) {
  const copy = anecdotesCopy[language];
  const illustration = localizeDidYouKnowIllustration(
    fact.id,
    illustrationFor(fact.id),
    language
  );
  const officialSource = fact.sources?.find(
    (source) => source.tier === "official"
  );

  return (
    <article className="home-hero-anecdote">
      <SectionHeading
        eyebrow={copy.homeEyebrow}
        className="home-hero-anecdote-kicker"
      />

      {illustration?.kind === "picture" ? (
        <figure className="home-hero-anecdote-figure">
          <div className="home-hero-anecdote-frame">
            <Image
              src={illustration.src}
              alt={illustration.alt}
              fill
              priority
              sizes="(min-width: 1200px) 560px, (min-width: 768px) 560px, calc(100vw - 32px)"
              className="home-hero-anecdote-image"
            />
          </div>
          <figcaption className="home-hero-anecdote-credit">
            {illustration.credit}
            {/* Brand charter §9: a licence is published, not named — the
                same two links the anecdote card prints. */}
            {illustration.filePage ? (
              <>
                {" · "}
                <a
                  href={illustration.filePage}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {copy.file}
                </a>
              </>
            ) : null}
            {illustration.licenceUrl ? (
              <>
                {" · "}
                <a
                  href={illustration.licenceUrl}
                  rel="noreferrer noopener license"
                  target="_blank"
                >
                  {copy.licence}
                </a>
              </>
            ) : null}
          </figcaption>
        </figure>
      ) : null}

      <h2 className="home-hero-anecdote-headline">{fact.headline}</h2>

      <div className="home-hero-anecdote-prose">
        {fact.body.map((paragraph, position) => (
          <p
            key={paragraph.slice(0, 32)}
            className={position === 0 ? "home-hero-anecdote-lede" : undefined}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <ul className="home-hero-anecdote-chips">
        {fact.entities.map((entity) => (
          <li key={`${entity.kind}-${entity.id}`}>
            <Link
              className={`home-hero-anecdote-chip ${DID_YOU_KNOW_ENTITY_ACCENT[entity.kind]}`}
              href={entityHref(language, entity)}
            >
              <span aria-hidden="true" className="home-hero-anecdote-dot" />
              <span className="home-hero-anecdote-chip-kind">
                {copy.entityLabels[entity.kind]}
              </span>
              {entity.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="home-hero-anecdote-tier">
        {officialSource ? (
          <>
            {`${copy.sourceLead} `}
            <a
              href={officialSource.url}
              rel="noreferrer noopener"
              target="_blank"
            >
              {officialSource.title}
            </a>
          </>
        ) : (
          copy.tierLabels[fact.tier]
        )}
      </p>
      <TranslationProvenanceMarker
        translation={
          fact.translationKind
            ? { kind: fact.translationKind, stale: false }
            : null
        }
      />

      <p className="home-hero-anecdote-more">
        <ActionLink href={getLocalizedRoute(language, "anecdotes")}>
          {copy.homeMore}
        </ActionLink>
      </p>

      <style>{`
        /* One alignment for the whole card, at every width (brand charter
           §8.1). Below 768px mobile-text.css sends every paragraph to the
           left edge while headings inherit the body's centring; a centred
           card would therefore carry two edges — a centred headline and
           chips over left-hand prose, kicker and source. */
        .home-hero-anecdote {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          text-align: left;
        }
        .home-hero-anecdote-kicker {
          margin-bottom: var(--afh-space-lg);
        }
        .home-hero-anecdote-figure {
          margin: 0 0 var(--afh-space-2xl);
        }
        .home-hero-anecdote-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 2;
          overflow: hidden;
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg);
          background: var(--afh-bg-warm);
        }
        /* Contained, not cropped: the bank runs from portrait engravings to
           wide panoramas, and a crop cuts off the document the fact is about. */
        .home-hero-anecdote-image {
          object-fit: contain;
        }
        .home-hero-anecdote-credit {
          margin: var(--afh-space-md) auto 0;
          font-size: var(--afh-text-caption);
          line-height: var(--afh-leading-caption);
          color: var(--afh-fg-muted);
        }
        .home-hero-anecdote-headline {
          margin: 0 0 var(--afh-space-lg);
          font-family: var(--afh-font-display);
          font-size: var(--afh-text-h2);
          font-weight: 700;
          line-height: var(--afh-leading-h2);
          letter-spacing: -0.014em;
          text-wrap: balance;
          color: var(--afh-text);
        }
        /* Ragged-right at every width: a centred paragraph gives the eye no
           return edge, and this one runs past two lines (brand charter §8.1). */
        .home-hero-anecdote-prose {
          text-align: left;
        }
        .home-hero-anecdote-prose p {
          margin: 0 0 var(--afh-space-md);
          font-size: var(--afh-text-body);
          line-height: 1.6;
          color: var(--afh-text-soft);
        }
        .home-hero-anecdote-prose .home-hero-anecdote-lede {
          font-size: var(--afh-text-lead);
          color: var(--afh-text);
        }
        .home-hero-anecdote-prose p:last-child {
          margin-bottom: 0;
        }
        .home-hero-anecdote-chips {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
          gap: var(--afh-space-md);
          margin: var(--afh-space-2xl) 0 0;
          padding: 0;
          list-style: none;
        }
        .home-hero-anecdote-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 13px 6px 10px;
          border: 1px solid var(--accent);
          border-radius: var(--afh-radius-full);
          background: var(--afh-color-card);
          color: var(--accent-ink);
          font-size: var(--afh-text-caption);
          font-weight: 600;
          text-decoration: none;
        }
        .home-hero-anecdote-chip:hover,
        .home-hero-anecdote-chip:focus-visible {
          background: var(--accent-tint);
        }
        .home-hero-anecdote-dot {
          width: 6px;
          height: 6px;
          flex: none;
          border-radius: 50%;
          background: var(--accent);
        }
        .home-hero-anecdote-chip-kind {
          font-size: var(--afh-text-eyebrow);
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        .home-hero-anecdote-tier {
          margin: var(--afh-space-2xl) 0 0;
          font-size: var(--afh-text-caption);
          line-height: var(--afh-leading-caption);
          color: var(--afh-text-soft);
        }
        .home-hero-anecdote-tier a {
          color: inherit;
          text-underline-offset: 3px;
        }
        .home-hero-anecdote-tier a:hover,
        .home-hero-anecdote-tier a:focus-visible {
          color: var(--afh-text);
        }
        .home-hero-anecdote-more {
          margin: var(--afh-space-2xl) 0 0;
        }
        @media (min-width: 1200px) {
          .home-hero-anecdote {
            margin-inline: 0;
          }
        }
      `}</style>
    </article>
  );
}
