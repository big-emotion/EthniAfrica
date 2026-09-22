import Link from "next/link";

import { MODULE_DEFINITIONS } from "@/lib/hubs/moduleRegistry";
import {
  aboutPage,
  accessModeCards,
  chapterSteps,
  purposeChapter,
} from "@/lib/i18n/copy/about";
import { getLocalizedRoute, type PageType } from "@/lib/routing";
import type { Language } from "@/types/shared";
import { ChapterHeading } from "@/components/pages/ChapterHeading";

interface AboutPageContentProps {
  language: Language;
}

/**
 * /[lang]/about content — editorial family (charter §4/§7, FR107). Chapter
 * anatomy across its top-level sections; the prose carries no reading measure
 * and fills the page box it shares with its title.
 *
 * Trimmed three times now, for the same reason each time: the page asked for
 * more reading — and more looking — than a visitor gives it.
 *
 * The first pass (2026-09-01) cut three blocks that duplicated content sitting
 * right next to them — the example-country cards, the interactive access cards
 * and the About/Doctrine distinction — and moved the source bibliography to
 * `/[lang]/sources`, because a reading list is not part of the project pitch.
 *
 * The second (2026-09-11) cut the three-block naming argument that sat between
 * chapters 01 and 02. Three of its four cleared images came back the same day
 * as chapter plates.
 *
 * The third (2026-09-22, operator ruling) retired those plates, and every
 * tinted card and coloured accent bar in the three chapters below, in favour
 * of a sober, minimalist reading of the doctrine — text and rhythm only. This
 * is a deliberate exception to the brand charter's §9 imagery doctrine (a
 * surface with more than one image carries more than one register) and §5.2
 * (a page has one accent): the operator chose plain typography for this
 * specific page over both. The three images (Ogilby's `Guinea`, the Tifinagh
 * photograph, al-Idrisi's map) are not retired from the product — they still
 * open the home hero and the "Did you know" band
 * (`src/lib/home/homeHeroVisuals.ts`, `src/lib/home/didYouKnowIllustrations.ts`)
 * and stay credited in `public/images/home/CREDITS.md`.
 *
 * Every word now lives in `lib/i18n/copy/about.ts`, which is the slice that
 * file's own comment left for a later change.
 */

/**
 * The heading a subject card wears, from the registry that declares the class
 * rather than spelled again here.
 *
 * This page names what the atlas holds, and it spelled the six nouns beside
 * the six links; the links were derived and the headings were not, so the
 * headings were free to drift from the menu they mirror. They are the same
 * nouns the site's own description owes (siteDescription.test.ts).
 */
const corpusNoun = (page: PageType): string =>
  MODULE_DEFINITIONS.find(
    (module) => module.accessMode === "atlas" && module.page === page
  )?.corpusNoun ?? "";

/** Structure only — every word is in the dictionary, so a copy change never
 *  reaches this file. */
const SUBJECTS: { key: string; page: PageType }[] = [
  { key: "peoples", page: "peoples" },
  { key: "languages", page: "languages" },
  { key: "families", page: "families" },
  { key: "countries", page: "countries" },
  { key: "names", page: "names" },
  { key: "patronymes", page: "patronymes" },
];

// @req REQ-091 @req REQ-132
export default function AboutPageContent({ language }: AboutPageContentProps) {
  const t = aboutPage[language];
  const purpose = purposeChapter[language];
  const steps = chapterSteps[language];

  return (
    <div className="mx-auto space-y-afh-6xl text-afh-text">
      <header
        data-testid="about-overview"
        className="grid gap-afh-xl border-b border-afh-border pb-afh-2xl min-[1240px]:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] min-[1240px]:items-end min-[1240px]:gap-afh-5xl"
      >
        <div className="space-y-afh-md">
          <p className="text-afh-eyebrow font-semibold uppercase tracking-wide text-afh-fg-muted">
            {t.overview.eyebrow}
          </p>
          <h1 className="font-afh-display text-afh-hero font-black leading-none">
            {t.title}
          </h1>
          <p className="text-afh-lead font-semibold leading-relaxed">
            {t.overview.lead}
          </p>
        </div>
        <p className="border-l-2 border-afh-gold pl-afh-md text-afh-small leading-relaxed text-afh-text-soft">
          {t.overview.asideLead} {t.overview.asideNote}{" "}
          <Link
            href={getLocalizedRoute(language, "doctrine")}
            className="font-bold text-[var(--accent-ink)] underline decoration-[var(--accent)] underline-offset-4"
          >
            {t.overview.doctrineLinkLabel}
          </Link>
          .
        </p>
      </header>

      <section
        data-testid="about-purpose"
        className="space-y-afh-xl"
        aria-labelledby="about-purpose-title"
      >
        <ChapterHeading
          id="about-purpose-title"
          stepLabel={purpose.stepLabel}
          heading={purpose.title}
        />
        <div className="space-y-afh-sm border-l-2 border-afh-gold pl-afh-md">
          <p className="font-afh-display text-afh-h2 font-black leading-tight">
            {purpose.claim}
          </p>
          <p
            data-testid="about-purpose-claim-status"
            className="text-afh-small leading-relaxed text-afh-text-soft"
          >
            {purpose.claimStatus}
          </p>
        </div>
        {/* The declaration the claim rests on, then the four sentences the
            atlas refuses with their reasons — the corrections are the doctrine
            (docs/editorial/purpose-doctrine.md). Read top to bottom, one
            column: a sober page reads as prose, not as a wall of cards. */}
        <div data-testid="about-declaration" className="space-y-afh-xl">
          <div className="flex flex-col gap-afh-lg">
            {purpose.declaration.map((part) => (
              <div key={part.title} className="space-y-afh-sm">
                <h3 className="font-afh-display text-afh-h3 font-black">
                  {part.title}
                </h3>
                {part.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="leading-relaxed text-afh-text-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div
            data-testid="about-declaration-refusals"
            className="space-y-afh-md border-t border-afh-border pt-afh-lg"
          >
            <h3 className="font-afh-display text-afh-h3 font-black">
              {purpose.refusals.title}
            </h3>
            <ul
              className="grid grid-cols-1 gap-afh-lg min-[720px]:grid-cols-2"
              role="list"
            >
              {purpose.refusals.items.map((item) => (
                <li key={item.sentence} className="space-y-afh-xs">
                  <p className="font-afh-display text-afh-lead font-bold">
                    {item.sentence}
                  </p>
                  <p
                    data-role="reason"
                    className="text-afh-small leading-relaxed text-afh-text-soft"
                  >
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ul
          className="grid grid-cols-1 gap-afh-md min-[720px]:grid-cols-3"
          role="list"
        >
          {purpose.scales.map((scale) => (
            <li key={scale.title} className="space-y-afh-xs">
              <h3 className="font-afh-display text-afh-h3 font-black">
                {scale.title}
              </h3>
              <p className="text-afh-small leading-relaxed text-afh-text-soft">
                {scale.body}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-afh-small leading-relaxed text-afh-text-soft">
          {purpose.closing}
        </p>
        {/* A second, separate position (purpose-doctrine.md §5) — not the
            constant ligne de vision above, and not a measurement the atlas
            produces, so it carries its own status line the same way. */}
        <div
          data-testid="about-purpose-unity-claim"
          className="space-y-afh-sm border-t border-afh-border pt-afh-lg"
        >
          <p className="font-afh-display text-afh-h3 font-black leading-tight">
            {purpose.unityClaim}
          </p>
          <p
            data-testid="about-purpose-unity-claim-status"
            className="text-afh-small leading-relaxed text-afh-text-soft"
          >
            {purpose.unityClaimStatus}
          </p>
        </div>
      </section>

      <section className="space-y-afh-xl" aria-labelledby="about-content-title">
        <div className="space-y-afh-md">
          <ChapterHeading
            id="about-content-title"
            stepLabel={steps.corpus}
            heading={t.contents.title}
          />
          <p className="text-afh-text-soft">{t.contents.intro}</p>
        </div>
        <ul
          data-testid="about-content-families"
          className="grid grid-cols-1 gap-afh-md min-[720px]:grid-cols-2 min-[1240px]:grid-cols-5"
          role="list"
        >
          {SUBJECTS.map((subject) => {
            const copy = t.contents.subjects[subject.key];
            return (
              <li
                key={subject.key}
                className="flex min-h-full flex-col border-t border-afh-border pt-afh-md"
              >
                <h3 className="font-afh-display text-afh-h3 font-black">
                  {corpusNoun(subject.page)}
                </h3>
                <p className="mt-afh-sm flex-1 text-afh-small leading-relaxed text-afh-text-soft">
                  {copy.description}
                </p>
                <Link
                  href={getLocalizedRoute(language, subject.page)}
                  className="mt-afh-md inline-flex min-h-[44px] items-center text-afh-small font-bold text-[var(--accent-ink)] underline decoration-[var(--accent)] underline-offset-4"
                >
                  {copy.linkLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-afh-xl" aria-labelledby="about-access-title">
        <div className="space-y-afh-md">
          <ChapterHeading
            id="about-access-title"
            stepLabel={steps.accessModes}
            heading={t.accessModes.title}
          />
          <p className="text-afh-text-soft">{t.accessModes.intro}</p>
        </div>
        <ul
          data-testid="about-access-mode-list"
          className="grid grid-cols-1 gap-afh-md min-[720px]:grid-cols-3"
          role="list"
        >
          {accessModeCards[language].map((mode) => (
            <li
              key={mode.id}
              data-testid={`about-access-mode-${mode.id}`}
              className="text-afh-small leading-relaxed text-afh-text-soft"
            >
              <p className="font-bold text-afh-text">{mode.label}</p>
              <p
                data-testid={`about-access-mode-description-${mode.id}`}
                className="mt-afh-xs"
              >
                {mode.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
