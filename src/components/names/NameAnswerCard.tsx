/**
 * The people fiche's answer to « d'où vient le nom ? » (REQ-190, DEC-068).
 *
 * Two pieces, rendered by the fiche in two chapters: the card (the name the
 * people gives itself, how it is said, one sentence) and the other names
 * (each once, one sentence, its status as badges). A status is never written
 * as a sentence: it is a badge — an icon and a word, so it still reads
 * without its colour. The explanation, the written traces and their pages are
 * one tap away, never in the first reading.
 */

import type { ReactNode } from "react";

import type { Language } from "@/types/shared";
import type { AnsweredName, NameBadge, SelfName } from "@/lib/fiche/nameAnswer";
import { peopleCopy } from "@/lib/i18n/copy/people";

const ICONS: Record<string, ReactNode> = {
  own: <path d="M3 8.5l3 3 7-7" />,
  outside: <path d="M2 8h10M8.5 4.5L12 8l-3.5 3.5" />,
  imposed: (
    <path d="M2.5 6.5L8 3l5.5 3.5M3.5 6.5v6M6.5 6.5v6M9.5 6.5v6M12.5 6.5v6M2.5 13h11" />
  ),
  debated: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.3 6.3a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1M8 11.3v.1" />
    </>
  ),
  usage: <circle cx="8" cy="8" r="3" />,
};

function languageName(code: string, language: Language): string {
  try {
    return (
      new Intl.DisplayNames([language], { type: "language" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function Badge({ badge, language }: { badge: NameBadge; language: Language }) {
  const labels = peopleCopy[language].nameAnswer.badges;
  const [kind, code] = badge.split(":") as [string, string | undefined];
  const word =
    kind === "usage"
      ? labels.usage(languageName(code ?? "", language))
      : labels[kind as "own" | "outside" | "imposed" | "debated"];
  return (
    <span className="afh-name-badge" data-badge={kind}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {ICONS[kind]}
      </svg>
      {word}
    </span>
  );
}

function Badges({
  badges,
  language,
}: {
  badges: NameBadge[];
  language: Language;
}) {
  if (badges.length === 0) return null;
  return (
    <span className="afh-name-badges">
      {badges.map((badge) => (
        <Badge key={badge} badge={badge} language={language} />
      ))}
    </span>
  );
}

function Traces({
  name,
  language,
}: {
  name: AnsweredName;
  language: Language;
}) {
  if (name.attestations.length === 0) return null;
  const dated = [...name.attestations].sort((a, b) => {
    if (a.year === null) return b.year === null ? 0 : 1;
    if (b.year === null) return -1;
    return a.year - b.year;
  });
  return (
    <details className="afh-name-more">
      <summary>{peopleCopy[language].nameAnswer.writtenTraces}</summary>
      <ul>
        {dated.map((trace, index) => (
          <li key={`${trace.formAsWritten}-${index}`}>
            {/* An undated trace says nothing about its date, rather than
                printing a « non daté » the reader has no use for. */}
            {trace.year !== null ? `${trace.year} · ` : ""}
            <span lang={name.lang}>{trace.formAsWritten}</span>
            {" · "}
            {[trace.attestedBy, `${trace.source.title}, ${trace.source.page}`]
              .filter(Boolean)
              .join(" · ")}
          </li>
        ))}
      </ul>
    </details>
  );
}

// @req REQ-190
export function NameAnswerCard({
  self,
  language,
  sourcesLink,
}: {
  self: SelfName;
  language: Language;
  sourcesLink?: ReactNode;
}) {
  const copy = peopleCopy[language].nameAnswer;
  return (
    <div className="afh-name-answer" data-name-row={self.form}>
      <p className="afh-name-answer__self">
        <span data-self-name data-name-form lang={self.lang}>
          {self.form}
        </span>
      </p>
      {self.pronunciation ? (
        <p className="afh-name-answer__say">
          {self.pronunciation.audioUrl ? (
            <button
              type="button"
              data-listen
              aria-label={copy.listen(self.form)}
              onClick={() => new Audio(self.pronunciation!.audioUrl!).play()}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M5 3.5v9l7-4.5z" />
              </svg>
            </button>
          ) : null}
          <span>
            {copy.pronounced} « {self.pronunciation.respelling} »
          </span>
        </p>
      ) : null}
      {self.line ? <p>{self.line}</p> : null}
      <Badges badges={self.badges} language={language} />
      {self.detail ? (
        <details className="afh-name-more">
          <summary>{copy.meaningLeads}</summary>
          <p>{self.detail}</p>
        </details>
      ) : null}
      <Traces name={self} language={language} />
      {sourcesLink}
    </div>
  );
}

// @req REQ-190
export function OtherNamesList({
  names,
  note,
  problem,
  language,
}: {
  names: AnsweredName[];
  note?: string;
  problem?: string;
  language: Language;
}) {
  return (
    <div className="afh-name-others">
      {note ? <p>{note}</p> : null}
      {problem ? (
        <details className="afh-name-more">
          <summary>{peopleCopy[language].nameAnswer.whatTheyRaise}</summary>
          <p>{problem}</p>
        </details>
      ) : null}
      <ul>
        {names.map((name) => (
          <li key={name.form} data-name-row={name.form}>
            <p className="afh-name-others__form">
              <span data-name-form lang={name.lang}>
                {name.form}
              </span>
            </p>
            {name.line ? <p>{name.line}</p> : null}
            <Badges badges={name.badges} language={language} />
            <Traces name={name} language={language} />
          </li>
        ))}
      </ul>
    </div>
  );
}
