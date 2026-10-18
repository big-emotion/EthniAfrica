import Link from "next/link";

import { ChapterHeading } from "@/components/pages/ChapterHeading";
import ApproachSources from "@/components/pages/ApproachSources";
import { approachCopy } from "@/lib/i18n/copy/approach";
import { approachSources } from "@/lib/approach/sources";
import {
  getLocalizedRoute,
  getPatronymeRoute,
  getStaticPageRoute,
} from "@/lib/routing";
import type { Language } from "@/types/shared";

interface ApproachPageContentProps {
  language: Language;
}

const LINK_CLASS =
  "inline-flex min-h-[44px] items-center font-bold text-afh-accent-ink underline decoration-afh-accent underline-offset-4";

// @req REQ-132
export default function ApproachPageContent({
  language,
}: ApproachPageContentProps) {
  const copy = approachCopy[language];

  return (
    <article className="ed-phone-centre ea-approach max-w-prose space-y-afh-6xl text-afh-text">
      <header
        data-testid="approach-overview"
        className="space-y-afh-md border-b border-afh-border pb-afh-2xl"
      >
        <h1 className="font-afh-display text-afh-hero font-black leading-none">
          {copy.title}
        </h1>
        <p className="ea-signature font-afh-display text-afh-h2 font-bold leading-tight">
          {copy.signature}
        </p>
        <p className="leading-relaxed text-afh-text-soft">{copy.intro}</p>
      </header>

      {copy.sections.map((section, index) => (
        <section
          key={section.title}
          data-testid="approach-section"
          className="space-y-afh-md"
        >
          <ChapterHeading
            stepLabel={String(index + 1).padStart(2, "0")}
            heading={section.title}
          />
          <p className="leading-relaxed text-afh-text-soft">{section.body}</p>
          {index === 2 ? (
            <nav
              aria-label={copy.nameLinksLabel}
              className="flex flex-wrap gap-x-afh-lg"
            >
              <Link
                className={LINK_CLASS}
                href={getPatronymeRoute(language, "PAT_KOUASSI")}
              >
                {copy.kouassiLink}
              </Link>
              <Link
                className={LINK_CLASS}
                href={getPatronymeRoute(language, "PAT_YAO")}
              >
                {copy.yaoLink}
              </Link>
            </nav>
          ) : null}
        </section>
      ))}

      <section
        data-testid="approach-position"
        aria-labelledby="approach-position-heading"
        className="ea-position space-y-afh-lg border-t border-afh-border pt-afh-5xl"
      >
        <h2
          id="approach-position-heading"
          className="font-afh-display text-afh-h2 font-bold"
        >
          {copy.positionTitle}
        </h2>
        {copy.position.map((paragraph) => (
          <p
            key={paragraph}
            className="ea-position-text font-afh-display text-afh-body font-bold leading-relaxed text-afh-text"
          >
            {paragraph}
          </p>
        ))}
      </section>

      <ApproachSources
        title={copy.sourcesTitle}
        listLabel={copy.sourcesLabel}
        preview={copy.sourcesPreview}
        moreLabel={copy.moreSources}
        lessLabel={copy.fewerSources}
        sources={approachSources.map(({ id, hrefs }) => ({
          ...copy.sources[id],
          hrefs,
        }))}
      />

      <nav
        aria-label={copy.closeLabel}
        className="ea-approach-close flex flex-wrap gap-x-afh-lg border-t border-afh-border pt-afh-lg"
      >
        <Link
          className={LINK_CLASS}
          href={getLocalizedRoute(language, "search")}
        >
          {copy.close.search}
        </Link>
        <Link
          className={LINK_CLASS}
          href={getLocalizedRoute(language, "doctrine")}
        >
          {copy.close.method}
        </Link>
        <Link
          className={LINK_CLASS}
          href={getStaticPageRoute(language, "reportError")}
        >
          {copy.close.reportError}
        </Link>
      </nav>
    </article>
  );
}
