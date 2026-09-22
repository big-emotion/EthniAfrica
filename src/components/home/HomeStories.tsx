import Link from "next/link";

import type { HomeStory } from "@/lib/home/homeStories";
import { homeStoriesCopy } from "@/lib/i18n/copy/homeStories";
import type { Language } from "@/types/shared";

import { SectionHeading } from "./SectionHeading";

export interface HomeStoriesProps {
  language: Language;
  stories: HomeStory[];
}

/**
 * Three reviewed discoveries under the opening, each a card of two levels
 * only — its own title and one link (typography charter §4). The cards take
 * the page accent rather than one colour per kind: three siblings of the same
 * kind are told apart by their content (brand charter §5.2).
 */
// @req REQ-115
export function HomeStories({ language, stories }: HomeStoriesProps) {
  if (stories.length === 0) return null;
  const copy = homeStoriesCopy[language];

  return (
    <section className="home-stories afh-shell" data-testid="home-stories">
      <SectionHeading title={copy.title} />
      <p className="home-stories-intro">{copy.intro}</p>
      <ul className="home-stories-list" role="list">
        {stories.map((story) => {
          const titleId = `home-story-${story.id.replace(/[^a-z0-9-]/gi, "-")}`;
          return (
            <li key={story.id} className="home-story">
              <h3 id={titleId} className="home-story-title">
                {story.title}
              </h3>
              <Link
                className="home-story-link"
                href={story.href}
                aria-describedby={titleId}
              >
                {copy.linkLabel}
              </Link>
            </li>
          );
        })}
      </ul>

      <style>{`
        .home-stories {
          padding-block: var(--afh-space-8xl);
        }
        .home-stories-intro {
          margin: 0 0 var(--afh-space-5xl);
          font-size: var(--afh-text-body);
          line-height: var(--afh-leading-body);
          color: var(--afh-text);
        }
        .home-stories-list {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        /* Left-aligned whole, title and link together: a card is one block
           (brand charter §8.1), and mobile-text.css would otherwise centre
           the title over a flush-left link on a phone. */
        .home-story {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          padding: 16px;
          border: 1px solid var(--afh-border);
          border-radius: var(--afh-radius-lg);
          background: var(--afh-surface);
          text-align: left;
        }
        .home-stories .home-story .home-story-title {
          margin: 0;
          font-family: var(--afh-font-display);
          font-size: var(--afh-text-body);
          font-weight: 700;
          line-height: var(--afh-leading-body);
          color: var(--afh-text);
          text-align: left;
          text-wrap: pretty;
        }
        .home-story-link {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          min-height: 44px;
          font-size: var(--afh-text-small);
          font-weight: 600;
          color: var(--accent-ink);
          text-underline-offset: 4px;
        }

        @media (min-width: 768px) {
          .home-stories {
            padding-block: var(--afh-space-9xl);
          }
          .home-stories-list {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }
          .home-story {
            padding: 24px;
          }
        }
      `}</style>
    </section>
  );
}
