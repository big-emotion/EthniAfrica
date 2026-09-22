import Link from "next/link";

import { ChapterHeading } from "@/components/pages/ChapterHeading";
import { TranslationProvenanceMarker } from "@/components/fiche/TranslationProvenanceMarker";
import {
  CLASSIFICATION_DEFINITIONS_EN,
  DOCTRINE_PAGE_EN,
} from "@/lib/doctrine/doctrineContent.en";
import { CLASSIFICATION_LABELS } from "@/lib/glossaire/vocabularies";
import { doctrineCopy } from "@/lib/i18n/copy/doctrine";
import { getLocalizedRoute, getStaticPageRoute } from "@/lib/routing";
import type { Language } from "@/types/shared";

/**
 * /[lang]/doctrine content — editorial family (charter §4/§7, FR107).
 *
 * Reoriented from a bare classification glossary into the public method page
 * (editorial-and-experience-plan.md §6). The method sections (M1-M11) are
 * new, directly-authored bilingual prose, unrelated to DEC-048's machine
 * translation pipeline — only `CLASSIFICATION_DEFINITIONS_EN` still comes
 * from that pipeline, so the "machine, not yet reviewed" marker now sits next
 * to the classification block it actually describes, not at the page header.
 * The four refused sentences sit after M8 as their own numbered section
 * (moved from the About page, 22 September 2026), so M9-M11 render one step
 * later than the plan's numbering.
 *
 * Each classification section keeps its `id="<status>"` anchor:
 * ClassificationBadge links to it (story ETNI-178 / 0.21, AR21, AR44). Gains
 * chapter anatomy on every section. No reading measure: the prose fills the
 * page box it shares with its title.
 *
 * Anchors:
 *   - #consensual
 *   - #contested
 *   - #colonial-legacy
 *   - #reconstructive
 */
const SECTIONS: Array<{
  id: keyof (typeof CLASSIFICATION_LABELS)["fr"];
}> = [
  { id: "consensual" },
  { id: "contested" },
  { id: "colonial-legacy" },
  { id: "reconstructive" },
];

// @req REQ-091
export default function DoctrinePageContent({
  language = "fr",
}: {
  language?: Language;
}) {
  const copy = doctrineCopy[language];

  return (
    <div className="mx-auto space-y-8 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-afh-h1 font-bold">{copy.title}</h1>
        <p className="text-muted-foreground">{copy.intro}</p>
      </header>

      {copy.method.map((section, index) => (
        <section key={section.heading} className="space-y-2">
          <ChapterHeading
            stepLabel={`${String(index + 1).padStart(2, "0")} · ${copy.methodStepLabel}`}
            heading={section.heading}
          />
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
          {section.refusals && (
            <ul
              data-testid="doctrine-refusals"
              className="grid grid-cols-1 gap-afh-lg min-[720px]:grid-cols-2"
              role="list"
            >
              {section.refusals.map((item) => (
                <li key={item.sentence} className="space-y-afh-xs">
                  <p className="font-afh-display text-afh-lead font-bold">
                    {item.sentence}
                  </p>
                  <p
                    data-role="reason"
                    className="text-afh-small leading-relaxed text-muted-foreground"
                  >
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="space-y-2 scroll-mt-24">
        <ChapterHeading
          stepLabel={`${String(copy.method.length + 1).padStart(2, "0")} · ${copy.methodStepLabel}`}
          heading={copy.classificationSection.heading}
        />
        <p className="leading-relaxed">{copy.classificationSection.intro}</p>
        <TranslationProvenanceMarker
          translation={
            language === "en"
              ? { kind: DOCTRINE_PAGE_EN.provenance, stale: false }
              : null
          }
        />
      </section>

      {SECTIONS.map((section, index) => {
        const labels = CLASSIFICATION_LABELS[language][section.id];
        return (
          <section
            key={section.id}
            id={section.id}
            className="space-y-2 scroll-mt-24"
          >
            <ChapterHeading
              stepLabel={`${String(index + 1).padStart(2, "0")} · ${copy.stepLabel}`}
              heading={labels.label}
            />
            <p className="text-afh-small italic text-muted-foreground">
              {labels.tooltip}
            </p>
            <p className="leading-relaxed">
              {language === "en"
                ? CLASSIFICATION_DEFINITIONS_EN[section.id].description
                : copy.descriptions[section.id]}
            </p>
          </section>
        );
      })}

      <section className="flex flex-wrap gap-4 border-t border-afh-border pt-4 text-afh-small font-bold">
        <Link
          href={getLocalizedRoute(language, "sources")}
          className="underline decoration-[var(--accent)] underline-offset-4"
        >
          {copy.closingActions.sources}
        </Link>
        <Link
          href={getStaticPageRoute(language, "reportError")}
          className="underline decoration-[var(--accent)] underline-offset-4"
        >
          {copy.closingActions.reportError}
        </Link>
        <Link
          href={getLocalizedRoute(language, "search")}
          className="underline decoration-[var(--accent)] underline-offset-4"
        >
          {copy.closingActions.search}
        </Link>
      </section>
    </div>
  );
}
