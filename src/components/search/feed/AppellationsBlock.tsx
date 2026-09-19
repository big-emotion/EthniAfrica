import Link from "next/link";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import { nameAnswerCopy } from "@/lib/i18n/copy/nameAnswer";
import { cn } from "@/lib/utils";
import type { NamingPresentationForm } from "@/lib/search/naming";
import type { Language } from "@/types/shared";

export type AppellationItem = Pick<
  NamingPresentationForm,
  "form" | "qualifier" | "selfGiven" | "problematic"
> & { searched?: boolean };

export interface AppellationsBlockProps {
  forms: readonly AppellationItem[];
  language?: Language;
  originsHref?: string;
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

function FormsList({
  forms,
  allForms,
  language,
  originsHref,
  className,
  testId,
}: {
  forms: readonly AppellationItem[];
  allForms: readonly AppellationItem[];
  language: Language;
  originsHref: string;
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
      {forms.map((item) => (
        <li
          key={`${item.form}-${item.qualifier ?? "form"}`}
          data-appellation=""
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
            {item.form}
          </span>
          {item.searched ? (
            <span className="text-afh-eyebrow font-bold text-[color:var(--accent-ink)]">
              {copy.yourSearch}
            </span>
          ) : null}
          {item.selfGiven === true ? (
            <span className="text-afh-eyebrow font-bold text-[color:var(--accent-ink)]">
              {copy.selfGivenMark}
            </span>
          ) : null}
          {item.problematic === "recorded" ? (
            <span className="text-afh-eyebrow font-bold text-[color:var(--afh-colonial-ink)]">
              {copy.problematicMark}
            </span>
          ) : null}
          {item.qualifier ? (
            <span className="hidden text-afh-eyebrow font-semibold text-afh-text-soft min-[1200px]:inline">
              {item.qualifier}
            </span>
          ) : null}
        </li>
      ))}
      {remainder > 0 ? (
        <li className="flex min-h-11 items-center">
          <Link
            href={originsHref}
            className={cn(
              "inline-flex min-h-11 items-center px-afh-xs text-afh-caption font-bold text-[color:var(--accent-ink)]",
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
  language = "fr",
  originsHref = "#origins",
}: AppellationsBlockProps) {
  const copy = nameAnswerCopy[language];

  return (
    <SearchFeedBlock id="appellations" zone="first" className="pt-afh-lg">
      <SearchFeedSectionHeading title={copy.appellations} />
      <FormsList
        forms={visibleForms(forms, 3)}
        allForms={forms}
        language={language}
        originsHref={originsHref}
        className="min-[1200px]:hidden"
        testId="appellations-mobile"
      />
      <FormsList
        forms={visibleForms(forms, 4)}
        allForms={forms}
        language={language}
        originsHref={originsHref}
        className="hidden min-[1200px]:flex"
        testId="appellations-desktop"
      />
    </SearchFeedBlock>
  );
}
