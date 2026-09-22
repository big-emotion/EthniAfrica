import Link from "next/link";

import {
  homePurposeCopy,
  type HomePurposeBlock,
} from "@/lib/i18n/copy/homePurpose";
import { getLocalizedRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

import { SectionHeading } from "./SectionHeading";

export interface HomeProjectProps {
  language: Language;
}

interface ProjectBlockProps {
  block: HomePurposeBlock;
  href: string;
  testId: string;
}

function ProjectBlock({ block, href, testId }: ProjectBlockProps) {
  return (
    <div className="home-project-block" data-testid={testId}>
      <SectionHeading title={block.title} />
      <p className="home-project-body">{block.body}</p>
      <Link className="home-project-link" href={href}>
        {block.linkLabel}
      </Link>
    </div>
  );
}

/**
 * What the project is for and how it handles a claim, after the stories and
 * the drawn visual. It replaced the « Notre propos » disclosure above the
 * search: a reader who arrived with a name reaches the method once they have
 * seen what it produces.
 */
// @req REQ-115
export function HomeProject({ language }: HomeProjectProps) {
  const copy = homePurposeCopy[language];

  return (
    <section className="home-project afh-shell" data-testid="home-project">
      <ProjectBlock
        block={copy.why}
        href={getLocalizedRoute(language, "about")}
        testId="home-project-why"
      />
      <ProjectBlock
        block={copy.sources}
        href={getLocalizedRoute(language, "doctrine")}
        testId="home-project-sources"
      />

      <style>{`
        .home-project {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--afh-space-8xl);
          padding-block: var(--afh-space-8xl);
        }
        /* The prose is ragged-right under a heading that mobile-text.css
           centres on a phone; the heading keeps that default and the running
           text never centres (brand charter §8.1). */
        .home-project .home-project-body {
          margin: 0 0 var(--afh-space-2xl);
          font-size: var(--afh-text-body);
          line-height: var(--afh-leading-body);
          color: var(--afh-text);
          text-align: left;
          text-wrap: pretty;
        }
        .home-project-link {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-size: var(--afh-text-small);
          font-weight: 600;
          color: var(--accent-ink);
          text-underline-offset: 4px;
        }

        @media (min-width: 768px) {
          .home-project {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: var(--afh-space-8xl);
            padding-block: var(--afh-space-9xl);
          }
        }
      `}</style>
    </section>
  );
}
