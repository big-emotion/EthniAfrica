import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import {
  nameAnswerCopy,
  type NameAnswerCopy,
} from "@/lib/i18n/copy/nameAnswer";
import { cn } from "@/lib/utils";
import type { NamingPresentationForm } from "@/lib/search/naming";
import type { Language } from "@/types/shared";

export type AppellationItem = Pick<
  NamingPresentationForm,
  "form" | "qualifier"
> &
  Partial<Pick<NamingPresentationForm, "selfGiven" | "problematic">> & {
    searched?: boolean;
    subjectId?: string;
  };

export interface AppellationsBlockProps {
  forms: readonly AppellationItem[];
  reviewed?: boolean;
  title?: string;
  subtitle?: string;
  language?: Language;
  originsHref?: string;
  className?: string;
}

function visibleForms(
  forms: readonly AppellationItem[],
  limit: number
): AppellationItem[] {
  const first = forms.slice(0, limit);
  if (first.some((item) => item.searched)) return first;

  const searched = forms.find((item) => item.searched);
  return searched ? [...first.slice(0, limit - 1), searched] : first;
}

function hiddenCount(forms: readonly AppellationItem[], shown: number): number {
  return Math.max(0, forms.length - shown);
}

function moreLabel(language: Language, count: number): string {
  if (language === "en") return `+${count} more`;
  return `+${count} ${count === 1 ? "autre" : "autres"}`;
}

interface MarkedTag {
  key: "searched" | "selfGiven" | "problematic";
  text: string;
}

/**
 * The form's own qualifier is the tag when the corpus carries one (e.g. "leur
 * nom, et celui de tous", "votre recherche · 1914") — the generic mark applies
 * only when the corpus gives none. A form can carry more than one mark at
 * once, so this returns every mark that applies rather than the first.
 */
function markedTags(item: AppellationItem, copy: NameAnswerCopy): MarkedTag[] {
  const tags: MarkedTag[] = [];
  if (item.searched)
    tags.push({ key: "searched", text: item.qualifier ?? copy.yourSearch });
  if (item.selfGiven === true)
    tags.push({
      key: "selfGiven",
      text: item.qualifier ?? copy.selfGivenMark,
    });
  if (item.problematic === "recorded")
    tags.push({
      key: "problematic",
      text: item.qualifier ?? copy.problematicMark,
    });
  return tags;
}

function FormsList({
  forms,
  allForms,
  language,
  originsHref,
  reviewed,
  className,
  testId,
}: {
  forms: readonly AppellationItem[];
  allForms: readonly AppellationItem[];
  language: Language;
  originsHref: string;
  reviewed: boolean;
  className: string;
  testId: string;
}) {
  const copy = nameAnswerCopy[language];
  const remainder = hiddenCount(allForms, forms.length);

  return (
    <ul
      data-testid={testId}
      className={cn("mt-afh-lg flex flex-wrap gap-afh-md", className)}
    >
      {forms.map((item) => {
        const tags = markedTags(item, copy);
        return (
          <li
            key={`${item.subjectId ?? "lead"}-${item.form}-${item.qualifier ?? "form"}`}
            data-appellation=""
            data-subject-id={item.subjectId}
            data-searched={item.searched || undefined}
            data-self-given={item.selfGiven === true || undefined}
            data-problematic={item.problematic === "recorded" || undefined}
            className={cn(
              "inline-flex items-center gap-afh-md rounded-afh-full border px-afh-lg py-afh-xs",
              item.problematic === "recorded"
                ? "border-[color:var(--afh-colonial-ink)]"
                : item.searched
                  ? "border-[var(--accent)]"
                  : "border-afh-border",
              item.selfGiven === true ? "bg-afh-bg-warm" : "bg-afh-surface"
            )}
          >
            <span className="font-afh-display text-afh-small font-bold text-afh-text">
              <InlineMarkup text={item.form} />
            </span>
            {tags.map(({ key, text }) => (
              <span
                key={key}
                className={cn(
                  "text-afh-eyebrow font-bold leading-[var(--afh-leading-eyebrow)]",
                  key === "problematic"
                    ? "text-[color:var(--afh-colonial-ink)]"
                    : "text-[color:var(--accent-ink)]"
                )}
              >
                <InlineMarkup text={text} />
              </span>
            ))}
            {tags.length === 0 && item.qualifier ? (
              <span className="hidden text-afh-eyebrow font-semibold text-afh-text-soft min-[1200px]:inline">
                <InlineMarkup text={item.qualifier} />
              </span>
            ) : null}
          </li>
        );
      })}
      {remainder > 0 ? (
        <li className={cn("flex items-center", !reviewed && "min-h-11")}>
          <Link
            href={originsHref}
            className={cn(
              "relative inline-flex items-center px-afh-xs text-afh-caption font-bold leading-[var(--afh-leading-caption)] text-[color:var(--accent-ink)]",
              reviewed
                ? "after:absolute after:-inset-y-[5px] after:inset-x-0"
                : "min-h-11",
              CHARTER_FOCUS_RING
            )}
          >
            {moreLabel(language, remainder)}
          </Link>
        </li>
      ) : null}
    </ul>
  );
}

/** Equal-weight name forms with the searched form marked and always visible. */
// @req REQ-180
export function AppellationsBlock({
  forms,
  reviewed = false,
  title,
  subtitle,
  language = "fr",
  originsHref = "#origins",
  className,
}: AppellationsBlockProps) {
  const copy = nameAnswerCopy[language];

  return (
    <SearchFeedBlock
      id="appellations"
      zone="first"
      className={cn("pt-afh-lg min-[1200px]:pt-afh-md", className)}
    >
      <SearchFeedSectionHeading
        title={title ?? copy.appellations}
        subtitle={subtitle}
        subtitleClassName="hidden min-[1200px]:block"
      />
      <FormsList
        forms={visibleForms(forms, 3)}
        allForms={forms}
        language={language}
        originsHref={originsHref}
        reviewed={reviewed}
        className="min-[1200px]:hidden"
        testId="appellations-mobile"
      />
      <FormsList
        forms={visibleForms(forms, 4)}
        allForms={forms}
        language={language}
        originsHref={originsHref}
        reviewed={reviewed}
        className="hidden min-[1200px]:flex"
        testId="appellations-desktop"
      />
    </SearchFeedBlock>
  );
}
