import Link from "next/link";
import type { ReactNode } from "react";

import { aboutCopy } from "@/lib/i18n/copy/about";
import { getLocalizedRoute, getStaticPageRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";
import { ChapterHeading } from "@/components/pages/ChapterHeading";

interface AboutPageContentProps {
  language: Language;
}

interface SectionProps {
  testId: string;
  step: number;
  title: string;
  paragraphs: string[];
  headingId?: string;
  children?: ReactNode;
}

const LINK_CLASS =
  "inline-flex min-h-[44px] items-center font-bold text-[var(--accent-ink)] underline decoration-[var(--accent)] underline-offset-4";

/**
 * One A-section of the editorial plan. The step is a bare two-digit number
 * so no locale-bound word lives in this file; the heading carries the words.
 */
function AboutSection({
  testId,
  step,
  title,
  paragraphs,
  headingId,
  children,
}: SectionProps) {
  return (
    <section
      data-testid={testId}
      className="space-y-afh-md"
      aria-labelledby={headingId}
    >
      <ChapterHeading
        id={headingId}
        stepLabel={String(step).padStart(2, "0")}
        heading={title}
      />
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="leading-relaxed text-afh-text-soft">
          {paragraph}
        </p>
      ))}
      {children}
    </section>
  );
}

/**
 * /[lang]/about content — editorial family (charter §4/§7, FR107): chapter
 * anatomy on each section, no reading measure, text and rhythm only.
 *
 * Rewritten on 22 September 2026 to the editorial plan's A1–A7; what left the
 * page and where it went is recorded in `lib/i18n/copy/about.ts`. The plates
 * and tinted cards were already retired the same day (operator ruling: a
 * sober reading over the brand charter's §9 imagery doctrine); the images
 * still open the home hero and the "Did you know" band.
 */
// @req REQ-091 @req REQ-132
export default function AboutPageContent({ language }: AboutPageContentProps) {
  const t = aboutCopy[language];

  return (
    <div className="mx-auto space-y-afh-6xl text-afh-text">
      <header
        data-testid="about-overview"
        className="space-y-afh-md border-b border-afh-border pb-afh-2xl"
      >
        <p className="text-afh-eyebrow font-semibold uppercase tracking-wide text-afh-fg-muted">
          {t.overview.eyebrow}
        </p>
        <h1 className="font-afh-display text-afh-hero font-black leading-none">
          {t.title}
        </h1>
        <p className="text-afh-lead font-semibold leading-relaxed">
          {t.overview.lead}
        </p>
        {t.overview.paragraphs.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed text-afh-text-soft">
            {paragraph}
          </p>
        ))}
      </header>

      {/* The anchor id is linked from other surfaces (about#about-purpose-title). */}
      <AboutSection
        testId="about-purpose"
        step={1}
        headingId="about-purpose-title"
        {...t.purpose}
      />

      <AboutSection
        testId="about-explore"
        step={2}
        title={t.explore.title}
        paragraphs={t.explore.paragraphs}
      >
        <ul
          data-testid="about-access-mode-list"
          className="grid grid-cols-1 gap-afh-md pt-afh-sm min-[720px]:grid-cols-3"
          role="list"
        >
          {t.explore.accessModes.map((mode) => (
            <li
              key={mode.id}
              data-testid={`about-access-mode-${mode.id}`}
              className="text-afh-small leading-relaxed text-afh-text-soft"
            >
              <h3 className="font-bold text-afh-text">{mode.label}</h3>
              <p
                data-testid={`about-access-mode-description-${mode.id}`}
                className="mt-afh-xs"
              >
                {mode.description}
              </p>
            </li>
          ))}
        </ul>
      </AboutSection>

      <AboutSection testId="about-audience" step={3} {...t.audience} />

      <AboutSection testId="about-sources" step={4} {...t.sources} />

      <AboutSection testId="about-conviction" step={5} {...t.conviction} />

      <AboutSection
        testId="about-correction"
        step={6}
        title={t.correction.title}
        paragraphs={t.correction.paragraphs}
      >
        <div className="flex flex-wrap gap-x-afh-lg text-afh-small">
          <Link
            href={getLocalizedRoute(language, "search")}
            className={LINK_CLASS}
          >
            {t.correction.links.search}
          </Link>
          <Link
            href={getLocalizedRoute(language, "doctrine")}
            className={LINK_CLASS}
          >
            {t.correction.links.method}
          </Link>
          <Link
            href={getStaticPageRoute(language, "reportError")}
            className={LINK_CLASS}
          >
            {t.correction.links.reportError}
          </Link>
        </div>
      </AboutSection>
    </div>
  );
}
