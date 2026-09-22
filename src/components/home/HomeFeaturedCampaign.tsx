import Link from "next/link";

import type { LocalizedFeaturedCampaign } from "@/lib/home/featuredCampaignLocalization";
import { formatNumber } from "@/lib/languageTag";
import {
  getCountryRoute,
  getLanguageRoute,
  getPatronymeRoute,
  getPeopleRoute,
} from "@/lib/routing";
import type { Language } from "@/types/shared";

/**
 * The home's featured-campaign tile (editorial-and-experience-plan.md,
 * H7-H10). Renders only when the page hands it a campaign — the caller
 * (src/app/[lang]/page.tsx) resolves `getActiveFeaturedCampaign` and passes
 * this tile into the opening band's `featured` slot, or nothing when no
 * window is open, so an inactive registry costs the home nothing.
 *
 * The forms list states every documented form at the same weight and marks
 * only the self-designation — never a ranked "the real name", the same
 * discipline DEC-057 holds the search result page to.
 */

const ENTITY_ROUTE: Record<
  LocalizedFeaturedCampaign["entity"]["kind"],
  (language: Language, id: string) => string
> = {
  people: getPeopleRoute,
  country: getCountryRoute,
  language: getLanguageRoute,
  patronyme: getPatronymeRoute,
};

export interface HomeFeaturedCampaignProps {
  language: Language;
  campaign: LocalizedFeaturedCampaign;
}

// @req REQ-115
export function HomeFeaturedCampaign({
  language,
  campaign,
}: HomeFeaturedCampaignProps) {
  const href = ENTITY_ROUTE[campaign.entity.kind](language, campaign.entity.id);
  const sourceNames = campaign.sources.map((source) => source.title).join(", ");
  const sourceCountLabel = `${formatNumber(language, campaign.sourceCount)} source${
    campaign.sourceCount === 1 ? "" : "s"
  }`;

  return (
    <section className="home-featured" data-testid="home-featured">
      <div className="home-featured-card">
        <div className="home-featured-body">
          <p className="home-featured-eyebrow">{campaign.eyebrow}</p>
          <h2 className="home-featured-heading">{campaign.heading}</h2>
          <p className="home-featured-support">{campaign.support}</p>

          {campaign.forms && campaign.forms.length > 0 && (
            <ul className="home-featured-forms" role="list">
              {campaign.forms.map((form) => (
                <li
                  key={form.label}
                  className={form.isSelfDesignation ? "is-self" : undefined}
                >
                  {form.label}
                </li>
              ))}
            </ul>
          )}

          {campaign.quote && (
            <blockquote className="home-featured-quote">
              {campaign.quote}
            </blockquote>
          )}

          <p className="home-featured-sources">
            {sourceCountLabel} — {sourceNames}
          </p>

          <Link className="home-featured-link" href={href}>
            {campaign.linkLabel}
          </Link>
        </div>
      </div>

      <style>{`
        /* No shell and no band padding of its own: the tile sits in the
           opening band's grid (HomeHero), under the search on a phone and
           beside it from 1200px, and takes that band's edges. Left-aligned
           whole, because it is one card (brand charter §8.1) inside a header
           mobile-text.css would otherwise centre. */
        .home-featured {
          min-width: 0;
          text-align: left;
        }
        .home-featured-card {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg);
          background: var(--afh-surface);
          box-shadow: var(--afh-elev-warm);
        }
        .home-featured-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: var(--afh-gradient-brand);
        }
        .home-featured-body {
          padding: var(--afh-space-xl) var(--afh-space-lg);
        }
        .home-featured-eyebrow {
          margin: 0 0 var(--afh-space-xs);
          font-size: var(--afh-text-eyebrow);
          font-weight: var(--afh-eyebrow-weight);
          letter-spacing: var(--afh-eyebrow-tracking);
          text-transform: var(--afh-eyebrow-transform);
          color: var(--accent-ink);
        }
        /* 700: a heading role's weight. 900 is the page title's and a key
           figure's (typography charter §8.1), and beside the h1 at 1200px a
           second 900 made two titles on one screen. */
        .home-featured-heading {
          margin: 0 0 var(--afh-space-sm);
          font-family: var(--afh-font-display);
          font-weight: 700;
          font-size: var(--afh-text-h2);
          line-height: 1.15;
          text-wrap: balance;
          color: var(--afh-text);
        }
        .home-featured-support {
          margin: 0 0 var(--afh-space-md);
          font-size: var(--afh-text-small);
          color: var(--afh-text-soft);
          line-height: 1.5;
        }
        .home-featured-forms {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0 0 var(--afh-space-md);
          padding: 0;
          list-style: none;
        }
        .home-featured-forms li {
          font-size: var(--afh-text-caption);
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--afh-radius-full);
          background: var(--afh-bg-warm);
          border: 1px solid var(--afh-border);
          color: var(--afh-text-soft);
        }
        .home-featured-forms li.is-self {
          background: var(--accent-tint);
          border-color: transparent;
          color: var(--accent-ink);
        }
        .home-featured-quote {
          margin: 0 0 var(--afh-space-md);
          padding-left: var(--afh-space-md);
          border-left: 3px solid var(--accent);
          font-family: var(--afh-font-body);
          font-style: italic;
          font-size: var(--afh-text-body);
          line-height: 1.4;
          color: var(--afh-text);
        }
        .home-featured-sources {
          margin: 0 0 var(--afh-space-lg);
          font-size: var(--afh-text-caption);
          color: var(--afh-text-soft);
        }
        /* The page accent, not the brand gradient: a primary action has one
           colour (brand charter §5.4), and the gradient belongs to the
           lockups (§5.3). It now sits one column from the search button,
           which already takes the accent. */
        .home-featured-link {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 var(--afh-space-lg);
          border-radius: var(--afh-radius-md);
          background: var(--accent);
          color: var(--accent-foreground);
          font-weight: 600;
          font-size: var(--afh-text-small);
          text-decoration: none;
        }

        @media (min-width: 768px) {
          .home-featured-body {
            padding: var(--afh-space-2xl) var(--afh-space-2xl);
            max-width: 720px;
          }
          .home-featured-heading {
            font-size: var(--afh-text-h1);
          }
        }
      `}</style>
    </section>
  );
}
