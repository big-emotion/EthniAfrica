"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { SearchFeedBlock } from "@/components/search/feed/SearchFeedBlock";
import { SearchFeedEvidenceAction } from "@/components/search/feed/SearchFeedEvidenceAction";
import { InlineMarkup } from "@/components/search/feed/InlineMarkup";
import { SearchFeedSectionHeading } from "@/components/search/feed/SearchFeedSectionHeading";
import { CHARTER_FOCUS_RING } from "@/components/ui/charter-motion";
import {
  nameAnswerCopy,
  type NameAnswerCopy,
} from "@/lib/i18n/copy/nameAnswer";
import { cn } from "@/lib/utils";
import type { SearchEvidence } from "@/lib/search/evidence";
import type { NamingPresentationForm } from "@/lib/search/naming";
import type { Language } from "@/types/shared";

/** Above this many forms in one group, the rest wait behind a button. */
const VISIBLE_FORMS = 8;

export type AppellationItem = Pick<
  NamingPresentationForm,
  "form" | "qualifier"
> &
  Partial<Pick<NamingPresentationForm, "selfGiven" | "problematic">> & {
    searched?: boolean;
    subjectId?: string;
    /** What the corpus records about this form; makes the chip a disclosure. */
    detail?: { text: string; evidence?: SearchEvidence };
    /** A destination for a form that has one but no detail of its own. */
    href?: string;
  };

export interface AppellationsBlockProps {
  forms: readonly AppellationItem[];
  reviewed?: boolean;
  title?: string;
  subtitle?: string;
  language?: Language;
  /** Heading of each subject's group, keyed by `subjectId`; shown when several groups exist. */
  groupLabels?: Readonly<Record<string, string>>;
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

function formKey(item: AppellationItem): string {
  return `${item.subjectId ?? "lead"}-${item.form}-${item.qualifier ?? "form"}`;
}

const CHIP_BASE =
  "inline-flex items-baseline gap-afh-md rounded-afh-full border px-afh-lg py-afh-xs";

function FormChipContent({
  item,
  copy,
}: {
  item: AppellationItem;
  copy: NameAnswerCopy;
}) {
  const tags = markedTags(item, copy);
  return (
    <>
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
    </>
  );
}

function chipClassName(item: AppellationItem, interactive: boolean): string {
  return cn(
    CHIP_BASE,
    interactive && cn("min-h-11 items-center", CHARTER_FOCUS_RING),
    item.problematic === "recorded"
      ? "border-[color:var(--afh-colonial-ink)]"
      : item.searched
        ? "border-[var(--accent)]"
        : "border-afh-border",
    item.selfGiven === true ? "bg-afh-bg-warm" : "bg-afh-surface"
  );
}

/**
 * One subject's forms. Expansion and the open detail are local to the group,
 * so expanding one subject never moves another, and a new search remounts the
 * block (the parent keys it on the query) so no stale state survives.
 */
function AppellationGroup({
  forms,
  language,
  label,
}: {
  forms: readonly AppellationItem[];
  language: Language;
  label?: string;
}) {
  const copy = nameAnswerCopy[language];
  const listId = useId();
  const detailId = useId();
  const [expanded, setExpanded] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);

  const collapsible = forms.length > VISIBLE_FORMS;
  const shown =
    collapsible && !expanded ? visibleForms(forms, VISIBLE_FORMS) : forms;
  const hidden = forms.length - shown.length;
  const opened = forms.find((item) => formKey(item) === openForm);

  return (
    <div data-appellation-group="">
      {label ? (
        <p className="mt-afh-lg text-afh-caption font-semibold leading-[var(--afh-leading-caption)] text-afh-text-soft">
          {label}
        </p>
      ) : null}
      <ul
        id={listId}
        data-testid="appellations-list"
        className="mt-afh-lg flex flex-wrap gap-afh-md"
      >
        {shown.map((item) => {
          const key = formKey(item);
          const dataAttributes = {
            "data-appellation": "",
            "data-subject-id": item.subjectId,
            "data-searched": item.searched || undefined,
            "data-self-given": item.selfGiven === true || undefined,
            "data-problematic": item.problematic === "recorded" || undefined,
          };
          if (item.detail) {
            const isOpen = openForm === key;
            return (
              <li key={key} className="flex" {...dataAttributes}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={detailId}
                  onClick={() => setOpenForm(isOpen ? null : key)}
                  className={chipClassName(item, true)}
                >
                  <FormChipContent item={item} copy={copy} />
                </button>
              </li>
            );
          }
          if (item.href) {
            return (
              <li key={key} className="flex" {...dataAttributes}>
                <Link
                  href={item.href}
                  className={cn(chipClassName(item, true), "no-underline")}
                >
                  <FormChipContent item={item} copy={copy} />
                </Link>
              </li>
            );
          }
          return (
            <li
              key={key}
              className={chipClassName(item, false)}
              {...dataAttributes}
            >
              <FormChipContent item={item} copy={copy} />
            </li>
          );
        })}
      </ul>
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            "mt-afh-md inline-flex min-h-11 items-center px-afh-xs text-afh-caption font-bold leading-[var(--afh-leading-caption)] text-[color:var(--accent-ink)] underline",
            CHARTER_FOCUS_RING
          )}
        >
          {expanded ? copy.showFewerNames : copy.showMoreNames(hidden)}
        </button>
      ) : null}
      <div id={detailId} data-testid="appellation-detail">
        {opened?.detail ? (
          <div className="mt-afh-md max-w-[65ch] text-afh-small leading-[var(--afh-leading-small)] text-afh-text">
            <p>
              <InlineMarkup text={opened.detail.text} />
            </p>
            {opened.detail.evidence ? (
              <SearchFeedEvidenceAction
                evidence={opened.detail.evidence}
                anchorId={`${detailId}-source`}
                language={language}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function groupBySubject(
  forms: readonly AppellationItem[]
): Array<{ subjectId: string | undefined; forms: AppellationItem[] }> {
  const groups = new Map<string, AppellationItem[]>();
  for (const item of forms) {
    const key = item.subjectId ?? "";
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups].map(([key, group]) => ({
    subjectId: key || undefined,
    forms: group,
  }));
}

/** Equal-weight name forms with the searched form marked and always visible. */
// @req REQ-180
export function AppellationsBlock({
  forms,
  title,
  subtitle,
  language = "fr",
  groupLabels,
  className,
}: AppellationsBlockProps) {
  const copy = nameAnswerCopy[language];
  const groups = groupBySubject(forms);

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
      {groups.map(({ subjectId, forms: group }) => (
        <AppellationGroup
          key={subjectId ?? "lead"}
          forms={group}
          language={language}
          label={
            groups.length > 1 && subjectId
              ? groupLabels?.[subjectId]
              : undefined
          }
        />
      ))}
    </SearchFeedBlock>
  );
}
