"use client";

import { useState } from "react";

import {
  ANSWER_BLOCK,
  ANSWER_HEADING,
  ANSWER_TEXT_BUTTON,
} from "@/components/search/answer/answerStyle";
import { searchAnswerCopy } from "@/lib/i18n/copy/searchAnswer";
import type { AnswerName, SearchAnswer } from "@/lib/search/answer";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/shared";

export interface NamesBlockProps {
  answer: Pick<SearchAnswer, "kind" | "names" | "path" | "title">;
  /** The form the reader typed; marked, never promoted. */
  searchedForm?: string;
  language?: Language;
  /** Names a group when several answers share the page (the two Congos). */
  groupLabel?: string;
  /** Several countries' dated names under one heading; replaces `names`. */
  groups?: ReadonlyArray<{ label: string; names: AnswerName[] }>;
}

/** A list of four reads at a glance; the rest waits behind one control. */
const LIST_PREVIEW = 4;

/** Past this a « form » is a sentence the fiche filed as a name. */
const PILL_FORM_MAX = 40;

const fold = (text: string): string =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/** « Fulɓe · Pullo » answers to a search for either word. */
function matchesSearch(form: string, searched?: string): boolean {
  if (!searched) return false;
  const target = fold(searched);
  return form.split("·").some((part) => fold(part) === target);
}

/** Pill text: « abantu · zoulou » from the short line « En zoulou. ». */
function pillQualifier(line?: string): string | undefined {
  if (!line) return undefined;
  return line
    .replace(/\.$/, "")
    .replace(/^(?:En|In)\s+/u, "")
    .trim();
}

function ListNames({
  names,
  searchedForm,
  language,
}: {
  names: AnswerName[];
  searchedForm?: string;
  language: Language;
}) {
  const copy = searchAnswerCopy[language].names;
  const [expanded, setExpanded] = useState(false);
  const hidden = names.slice(LIST_PREVIEW);
  const visible = expanded ? names : names.slice(0, LIST_PREVIEW);

  return (
    <div className="overflow-hidden rounded-afh-xl border border-afh-border bg-afh-surface">
      <ul className="m-0 list-none p-0">
        {visible.map((name) => (
          <li
            key={name.form}
            className={cn(
              "flex flex-col gap-afh-xs border-b border-afh-border px-afh-2xl py-afh-xl last:border-b-0",
              name.selfGiven === true && "bg-afh-bg-warm"
            )}
          >
            <span className="flex flex-wrap items-baseline gap-x-afh-md gap-y-afh-xs">
              <strong className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text">
                {name.form}
              </strong>
              {name.selfGiven === true ? (
                <span className="text-afh-caption font-bold text-afh-conf-high">
                  {copy.selfGiven}
                </span>
              ) : null}
              {matchesSearch(name.form, searchedForm) ? (
                <span className="text-afh-caption font-bold text-[color:var(--accent-ink)]">
                  {copy.yourSearch}
                </span>
              ) : null}
            </span>
            {name.shortLine ? (
              <span className="text-afh-small leading-[var(--afh-leading-small)] text-afh-fg-muted">
                {name.shortLine}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {hidden.length > 0 ? (
        <div className="border-t border-afh-border px-afh-2xl">
          <button
            type="button"
            className={ANSWER_TEXT_BUTTON}
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded
              ? copy.showFewer
              : copy.showMore(
                  hidden.length,
                  hidden
                    .slice(0, 4)
                    .map(({ form }) => form)
                    .join(", ")
                )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PillNames({
  names,
  searchedForm,
  language,
}: {
  names: AnswerName[];
  searchedForm?: string;
  language: Language;
}) {
  const copy = searchAnswerCopy[language].names;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-afh-md p-0">
      {names.map((name) => {
        const searched = matchesSearch(name.form, searchedForm);
        const qualifier = pillQualifier(name.shortLine);
        // A sentence the fiche filed as a name is read, not boxed: a box
        // around a paragraph is a card, and a name is not a card.
        if (name.form.length > PILL_FORM_MAX) {
          return (
            <li
              key={name.form}
              className="w-full text-afh-small leading-[var(--afh-leading-small)] text-afh-text"
            >
              {name.form}
            </li>
          );
        }
        return (
          <li
            key={name.form}
            className={cn(
              "rounded-afh-full border bg-afh-surface px-afh-xl py-afh-md text-afh-small text-afh-text",
              searched ? "border-[color:var(--accent)]" : "border-afh-border"
            )}
          >
            <strong className="font-afh-display font-bold">{name.form}</strong>
            {searched ? ` · ${copy.yourSearch}` : null}
            {qualifier ? ` · ${qualifier}` : null}
          </li>
        );
      })}
    </ul>
  );
}

function Timeline({
  names,
  groupLabel,
  language,
}: {
  names: AnswerName[];
  groupLabel?: string;
  language: Language;
}) {
  const copy = searchAnswerCopy[language].names;
  return (
    <div className="flex flex-col gap-afh-md">
      {groupLabel ? (
        <h3 className="m-0 text-afh-small font-bold text-afh-text">
          {groupLabel}
        </h3>
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-afh-md p-0">
        {names.map((name) => (
          <li
            key={`${name.period ?? ""}-${name.form}`}
            className="grid grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)] gap-x-afh-lg text-afh-small leading-[var(--afh-leading-small)]"
          >
            <span className="text-afh-fg-muted">
              {name.period ?? copy.undated}
            </span>
            <span className="text-afh-text [overflow-wrap:anywhere]">
              {name.form}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PathTable({ path }: { path: NonNullable<SearchAnswer["path"]> }) {
  return (
    <ul className="m-0 list-none overflow-hidden rounded-afh-xl border border-afh-border bg-afh-surface p-0">
      {path.map((step) => (
        <li
          key={`${step.language}-${step.form}`}
          className="grid grid-cols-[minmax(5.5rem,8rem)_minmax(0,1fr)] items-baseline gap-x-afh-lg border-b border-afh-border px-afh-2xl py-afh-lg last:border-b-0"
        >
          <span className="text-afh-small text-afh-fg-muted">
            {step.language}
          </span>
          <strong className="font-afh-display text-afh-h3 font-bold leading-[var(--afh-leading-h3)] text-afh-text [overflow-wrap:anywhere]">
            {step.form}
          </strong>
        </li>
      ))}
    </ul>
  );
}

/**
 * « Its names ». The shape follows what the fiche knows about each form: a list
 * when it says who uses it, a timeline when forms are dated, pills when they
 * are plain spellings, a table of steps for a word's journey. Order is the
 * fiche's order (the name a people gives itself first); no form is larger or
 * higher than another because it is the one searched.
 * @req REQ-178
 */
export function NamesBlock({
  answer,
  searchedForm,
  language = "fr",
  groupLabel,
  groups,
}: NamesBlockProps) {
  const copy = searchAnswerCopy[language];
  const { kind, path } = answer;
  const names = groups ? groups.flatMap((group) => group.names) : answer.names;

  const hasPath = kind === "word" && path && path.length > 0;
  if (names.length === 0 && !hasPath) return null;

  const dated = kind === "country" && names.some((name) => name.period);
  const annotated =
    kind === "people" &&
    names.some((name) => name.shortLine || name.selfGiven === true);

  return (
    <section
      className={cn(ANSWER_BLOCK, "flex flex-col gap-afh-lg")}
      data-answer-block="names"
      data-feed-block="answer-names"
      data-feed-zone="primary"
    >
      <h2 className={ANSWER_HEADING}>{copy.names.title[kind]}</h2>
      {groups ? (
        <div className="flex flex-col gap-afh-2xl">
          {groups
            .filter((group) => group.names.length > 0)
            .map((group) => (
              <Timeline
                key={group.label}
                names={group.names}
                groupLabel={group.label}
                language={language}
              />
            ))}
        </div>
      ) : hasPath ? (
        <PathTable path={path} />
      ) : dated ? (
        <Timeline names={names} groupLabel={groupLabel} language={language} />
      ) : annotated ? (
        <ListNames
          names={names}
          searchedForm={searchedForm}
          language={language}
        />
      ) : (
        <PillNames
          names={names}
          searchedForm={searchedForm}
          language={language}
        />
      )}
    </section>
  );
}
